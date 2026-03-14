-- ============================================================================
-- Migration 00032: Entitlement Engine + Tenant Lifecycle + Provisioning Rollback
-- Sprint 3 — T0-5, T0-6, T2-1
-- ============================================================================

BEGIN;

-- ─── 1. Extend company_status enum ──────────────────────────────────────────
-- Blueprint statuses: draft, provisioning, trialing, active, restricted, suspended,
-- churned, archived, rejected
-- Current: pending_review, active, restricted, suspended, rejected
-- Add: draft, provisioning, trialing, churned, archived

DO $$ BEGIN
  ALTER TYPE company_status ADD VALUE IF NOT EXISTS 'draft' BEFORE 'pending_review';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE company_status ADD VALUE IF NOT EXISTS 'provisioning' AFTER 'pending_review';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE company_status ADD VALUE IF NOT EXISTS 'trialing' AFTER 'provisioning';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE company_status ADD VALUE IF NOT EXISTS 'churned' AFTER 'suspended';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE company_status ADD VALUE IF NOT EXISTS 'archived' AFTER 'churned';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Tenant lifecycle transition log ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_status_transitions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  from_status   text NOT NULL,
  to_status     text NOT NULL,
  reason        text,
  actor_user_id uuid REFERENCES auth.users(id),
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tst_company_id ON public.tenant_status_transitions(company_id);
CREATE INDEX IF NOT EXISTS idx_tst_created_at ON public.tenant_status_transitions(created_at DESC);

-- ─── 3. Entitlement DB functions ────────────────────────────────────────────

-- Check if a company has remaining quota for a feature
CREATE OR REPLACE FUNCTION public.check_entitlement(
  _company_id uuid,
  _feature_code text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _row record;
BEGIN
  SELECT * INTO _row
  FROM public.entitlements
  WHERE company_id = _company_id
    AND feature_code = _feature_code
    AND (valid_until IS NULL OR valid_until > now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'no_entitlement',
      'feature_code', _feature_code
    );
  END IF;

  -- Unlimited quota
  IF _row.quota_limit IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'reason', 'unlimited',
      'feature_code', _feature_code,
      'quota_used', _row.quota_used
    );
  END IF;

  -- Check quota
  IF _row.quota_used >= _row.quota_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'quota_exceeded',
      'feature_code', _feature_code,
      'quota_limit', _row.quota_limit,
      'quota_used', _row.quota_used
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'within_quota',
    'feature_code', _feature_code,
    'quota_limit', _row.quota_limit,
    'quota_used', _row.quota_used,
    'remaining', _row.quota_limit - _row.quota_used
  );
END;
$$;

-- Increment usage counter for an entitlement (atomic)
CREATE OR REPLACE FUNCTION public.increment_entitlement_usage(
  _company_id uuid,
  _feature_code text,
  _amount int DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _row record;
BEGIN
  SELECT * INTO _row
  FROM public.entitlements
  WHERE company_id = _company_id
    AND feature_code = _feature_code
    AND (valid_until IS NULL OR valid_until > now())
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_entitlement');
  END IF;

  -- Check soft limit before increment
  IF _row.quota_limit IS NOT NULL AND (_row.quota_used + _amount) > _row.quota_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'quota_exceeded',
      'quota_limit', _row.quota_limit,
      'quota_used', _row.quota_used,
      'requested', _amount
    );
  END IF;

  UPDATE public.entitlements
  SET quota_used = quota_used + _amount
  WHERE id = _row.id;

  RETURN jsonb_build_object(
    'success', true,
    'quota_used', _row.quota_used + _amount,
    'quota_limit', _row.quota_limit
  );
END;
$$;

-- Reset usage counter (for monthly resets)
CREATE OR REPLACE FUNCTION public.reset_entitlement_usage(
  _company_id uuid,
  _feature_code text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.entitlements
  SET quota_used = 0
  WHERE company_id = _company_id
    AND feature_code = _feature_code;
END;
$$;

-- ─── 4. Provisioning rollback steps (detailed per-step tracking) ────────────
CREATE TABLE IF NOT EXISTS public.provisioning_rollback_steps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rollback_id   uuid NOT NULL REFERENCES public.provisioning_rollbacks(id) ON DELETE CASCADE,
  step_code     text NOT NULL,
  step_type     text NOT NULL DEFAULT 'compensate', -- reverse, compensate, skip
  status        text NOT NULL DEFAULT 'pending',    -- pending, executed, failed, skipped
  details       jsonb DEFAULT '{}',
  error         text,
  executed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── 5. Tenant lifecycle allowed transitions ────────────────────────────────
-- Materialized for fast lookups; defines which status transitions are valid
CREATE TABLE IF NOT EXISTS public.tenant_transition_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_status text NOT NULL,
  to_status   text NOT NULL,
  allowed_by  text[] NOT NULL DEFAULT '{}', -- role codes that can trigger this
  auto_trigger text,                        -- null = manual, or 'payment_failed', 'quota_exceeded', etc.
  description text,
  UNIQUE(from_status, to_status)
);

-- Seed transition rules
INSERT INTO public.tenant_transition_rules (from_status, to_status, allowed_by, auto_trigger, description)
VALUES
  ('draft',           'pending_review', '{company_gm,founder,platform_admin}', NULL, 'Submit company for review'),
  ('pending_review',  'provisioning',   '{founder,platform_admin}', NULL, 'Approve and start provisioning'),
  ('pending_review',  'rejected',       '{founder,platform_admin}', NULL, 'Reject company application'),
  ('provisioning',    'trialing',       '{system}', NULL, 'Provisioning completed, trial begins'),
  ('provisioning',    'active',         '{system}', NULL, 'Provisioning completed, no trial'),
  ('provisioning',    'pending_review', '{system}', NULL, 'Provisioning failed, return to review'),
  ('trialing',        'active',         '{founder,platform_admin,system}', NULL, 'Trial ends, convert to paid'),
  ('trialing',        'suspended',      '{founder,platform_admin}', 'trial_expired', 'Trial expired without conversion'),
  ('active',          'restricted',     '{founder,platform_admin,system}', 'quota_exceeded', 'Usage limits exceeded'),
  ('active',          'suspended',      '{founder,platform_admin,system}', 'payment_failed', 'Payment failed repeatedly'),
  ('restricted',      'active',         '{founder,platform_admin,system}', 'quota_resolved', 'Usage back within limits'),
  ('restricted',      'suspended',      '{founder,platform_admin}', NULL, 'Manual suspension from restricted'),
  ('suspended',       'active',         '{founder,platform_admin}', NULL, 'Reinstate after resolution'),
  ('suspended',       'churned',        '{founder,platform_admin,system}', 'inactivity_timeout', 'No reactivation after timeout'),
  ('churned',         'archived',       '{founder,platform_admin}', NULL, 'Archive churned tenant data'),
  ('archived',        'active',         '{founder}', NULL, 'Restore archived tenant (founder only)'),
  ('rejected',        'pending_review', '{founder,platform_admin}', NULL, 'Re-evaluate rejected application')
ON CONFLICT (from_status, to_status) DO NOTHING;

-- ─── 6. RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE public.tenant_status_transitions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisioning_rollback_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_transition_rules     ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "tst_service" ON public.tenant_status_transitions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "prbs_service" ON public.provisioning_rollback_steps
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "ttr_service" ON public.tenant_transition_rules
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated read for transition rules (public reference data)
CREATE POLICY "ttr_read" ON public.tenant_transition_rules
  FOR SELECT USING (auth.role() = 'authenticated');

COMMIT;
