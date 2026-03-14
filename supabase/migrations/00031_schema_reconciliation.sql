-- 00031_schema_reconciliation.sql
-- Sprint 2 – T1-2: Schema Reconciliation
-- Adds 24 missing blueprint tables. All use IF NOT EXISTS so safe to re-run.

-- ─── 1. session_devices ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_devices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type text NOT NULL DEFAULT 'web',            -- web, ios, android, desktop
  device_name text,
  ip_address  inet,
  user_agent  text,
  last_active timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_session_devices_user ON public.session_devices(user_id, last_active DESC);

-- ─── 2. visitor_profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.visitor_profiles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email          text,
  phone          text,
  full_name      text,
  source         text,           -- website, qr, referral, etc.
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visitor_profiles_company ON public.visitor_profiles(company_id);

-- ─── 3. user_permission_overrides ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_code text NOT NULL,
  granted         boolean NOT NULL DEFAULT true,  -- true = grant, false = deny
  granted_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason          text,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id, permission_code)
);

-- ─── 4. module_shell_registry ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.module_shell_registry (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code  text NOT NULL UNIQUE,
  display_name text NOT NULL,
  icon         text,
  route_path   text NOT NULL,
  tab_config   jsonb NOT NULL DEFAULT '[]',   -- [{label, path, permission, icon}]
  list_config  jsonb NOT NULL DEFAULT '{}',   -- column defs for GenericList
  ai_agent     text,                          -- RARE agent type for this module
  sort_order   int NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── 5. provisioning_rollbacks ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.provisioning_rollbacks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid REFERENCES public.provisioning_jobs(id) ON DELETE CASCADE,
  step_code   text NOT NULL,
  rollback_sql text,
  status      text NOT NULL DEFAULT 'pending',  -- pending, executed, failed
  error       text,
  executed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 6. provisioning_artifacts ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.provisioning_artifacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid REFERENCES public.provisioning_jobs(id) ON DELETE CASCADE,
  artifact_type text NOT NULL,   -- seed_data, config, migration
  artifact_key  text NOT NULL,
  artifact_value jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── 7. pricing_tiers ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  tier_name       text NOT NULL,               -- starter, professional, enterprise
  max_users       int,
  max_modules     int,
  price_monthly   numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly    numeric(10,2) NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'USD',
  features        jsonb NOT NULL DEFAULT '[]',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 8. entitlements ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.entitlements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  feature_code    text NOT NULL,       -- e.g. 'ai.rare', 'storage.10gb', 'users.50'
  granted_by      text NOT NULL DEFAULT 'subscription', -- subscription, trial, manual, promo
  quota_limit     int,                  -- null = unlimited
  quota_used      int NOT NULL DEFAULT 0,
  valid_from      timestamptz NOT NULL DEFAULT now(),
  valid_until     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, feature_code)
);

-- ─── 9. ai_model_routing_rules ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_model_routing_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type    text NOT NULL,
  mode          text NOT NULL DEFAULT '*',
  model_name    text NOT NULL,          -- gpt-4o, gpt-4o-mini, etc.
  priority      int NOT NULL DEFAULT 0,
  conditions    jsonb NOT NULL DEFAULT '{}',  -- role requirements, cost thresholds
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── 10. ai_budget_policies ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_budget_policies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  daily_limit     int NOT NULL DEFAULT 100,
  monthly_limit   int NOT NULL DEFAULT 2000,
  cost_cap_usd    numeric(10,2),
  alert_threshold numeric(3,2) NOT NULL DEFAULT 0.80,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- ─── 11. ai_confirmation_rules ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_confirmation_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_pattern  text NOT NULL,        -- glob pattern e.g. 'payroll.*', 'invoice.delete'
  min_role_level  int NOT NULL DEFAULT 3,
  requires_otp    boolean NOT NULL DEFAULT false,
  requires_reason boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 12. ai_tool_access_rules ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_tool_access_rules (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_code  text NOT NULL,
  agent_type text NOT NULL,
  allowed    boolean NOT NULL DEFAULT true,
  conditions jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tool_code, agent_type)
);

-- ─── 13. ai_sensitive_action_registry ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_sensitive_action_registry (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_code     text NOT NULL UNIQUE,
  description     text,
  risk_level      text NOT NULL DEFAULT 'medium',  -- low, medium, high, critical
  requires_approval boolean NOT NULL DEFAULT false,
  approval_roles  text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 14. company_ai_settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_ai_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  enabled         boolean NOT NULL DEFAULT true,
  default_model   text NOT NULL DEFAULT 'gpt-4o-mini',
  language        text NOT NULL DEFAULT 'en',
  tone            text NOT NULL DEFAULT 'professional',
  knowledge_base_enabled boolean NOT NULL DEFAULT false,
  auto_suggestions boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 15. document_embeddings (RAG) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_embeddings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_id   uuid,
  chunk_index   int NOT NULL DEFAULT 0,
  content_text  text NOT NULL,
  embedding     vector(1536),           -- OpenAI ada-002 dimension
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- Note: vector index requires pgvector extension. Create if available:
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_doc_embeddings_company ON public.document_embeddings(company_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ─── 16. search_index ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.search_index (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  title       text NOT NULL,
  body        text,
  metadata    jsonb NOT NULL DEFAULT '{}',
  tsv         tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) STORED,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_index_tsv ON public.search_index USING GIN(tsv);
CREATE INDEX IF NOT EXISTS idx_search_index_company ON public.search_index(company_id, entity_type);

-- ─── 17. retention_policies ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.retention_policies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     text NOT NULL UNIQUE,   -- e.g. 'audit_logs', 'ai_usage_logs'
  retain_days     int NOT NULL DEFAULT 365,
  archive_to      text,                    -- s3 bucket or null
  delete_after_archive boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 18. abandoned_signups ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abandoned_signups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  company_name text,
  step_reached text NOT NULL DEFAULT 'email',  -- email, company_info, industry, payment
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_abandoned_signups_email ON public.abandoned_signups(email);

-- ─── 19. internal_offers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.internal_offers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  offer_type      text NOT NULL DEFAULT 'discount',   -- discount, trial_extension, upgrade
  target_segment  text,                                 -- new, churned, tier_starter, etc.
  value           jsonb NOT NULL DEFAULT '{}',          -- {percent: 20} or {months: 3}
  valid_from      timestamptz NOT NULL DEFAULT now(),
  valid_until     timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 20. founder_reports ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.founder_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL,            -- daily_digest, revenue, churn, growth
  title       text NOT NULL,
  data        jsonb NOT NULL DEFAULT '{}',
  generated_by text NOT NULL DEFAULT 'system',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_founder_reports_type ON public.founder_reports(report_type, created_at DESC);

-- ─── 21. founder_commands ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.founder_commands (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid NOT NULL REFERENCES auth.users(id),
  command     text NOT NULL,
  target_type text,             -- company, user, subscription, module
  target_id   uuid,
  payload     jsonb NOT NULL DEFAULT '{}',
  status      text NOT NULL DEFAULT 'executed',  -- executed, failed, reverted
  result      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_founder_commands_actor ON public.founder_commands(actor_id, created_at DESC);

-- ─── 22. tenant_overview (materialized view) ────────────────────────────
-- Founder dashboard: one row per company with key metrics.
CREATE MATERIALIZED VIEW IF NOT EXISTS public.tenant_overview AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  c.industry,
  c.status,
  c.created_at,
  (SELECT count(*) FROM public.company_members cm WHERE cm.company_id = c.id AND cm.status = 'active') AS active_members,
  (SELECT count(*) FROM public.company_modules cmod WHERE cmod.company_id = c.id AND cmod.is_enabled = true) AS enabled_modules,
  (SELECT ts.status FROM public.tenant_subscriptions ts WHERE ts.company_id = c.id ORDER BY ts.created_at DESC LIMIT 1) AS subscription_status,
  (SELECT ts.plan_id FROM public.tenant_subscriptions ts WHERE ts.company_id = c.id ORDER BY ts.created_at DESC LIMIT 1) AS current_plan_id
FROM public.companies c;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_overview_pk ON public.tenant_overview(company_id);

-- Refresh function (call periodically or after key events)
CREATE OR REPLACE FUNCTION public.refresh_tenant_overview()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.tenant_overview;
END;
$$;

-- ─── RLS for new tables ─────────────────────────────────────────────────
ALTER TABLE public.session_devices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_shell_registry       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisioning_rollbacks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisioning_artifacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_routing_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_budget_policies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_confirmation_rules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tool_access_rules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sensitive_action_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ai_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_index                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_policies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_signups           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_offers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_commands            ENABLE ROW LEVEL SECURITY;

-- Company-scoped tables: members can read their own company's data
DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'visitor_profiles', 'entitlements', 'ai_budget_policies',
    'company_ai_settings', 'document_embeddings', 'search_index'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (
        company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
      )',
      tbl || '_select_member', tbl
    );
  END LOOP;
END $$;

-- User-scoped: session_devices
CREATE POLICY "session_devices_own" ON public.session_devices
  FOR ALL USING (user_id = auth.uid());

-- Permission overrides: company admins (GM/HR) can manage
CREATE POLICY "user_perm_overrides_select" ON public.user_permission_overrides
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
  );

-- Founder-only tables
DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'module_shell_registry', 'ai_model_routing_rules', 'ai_confirmation_rules',
    'ai_tool_access_rules', 'ai_sensitive_action_registry', 'retention_policies',
    'internal_offers', 'founder_reports', 'founder_commands'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_founder = true)
      )',
      tbl || '_founder_only', tbl
    );
  END LOOP;
END $$;

-- Pricing tiers: public read, founder write
CREATE POLICY "pricing_tiers_select_all" ON public.pricing_tiers
  FOR SELECT USING (true);
CREATE POLICY "pricing_tiers_manage_founder" ON public.pricing_tiers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_founder = true)
  );

-- Service-role only inserts for provisioning tables
CREATE POLICY "prov_rollbacks_service" ON public.provisioning_rollbacks
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "prov_artifacts_service" ON public.provisioning_artifacts
  FOR ALL USING (auth.role() = 'service_role');

-- Abandoned signups: service_role only
CREATE POLICY "abandoned_signups_service" ON public.abandoned_signups
  FOR ALL USING (auth.role() = 'service_role');
