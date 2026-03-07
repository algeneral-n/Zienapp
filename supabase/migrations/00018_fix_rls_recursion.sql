-- ============================================================================
-- ZIEN Platform — Fix RLS Infinite Recursion + Comprehensive Policy Cleanup
-- Migration: 00018_fix_rls_recursion.sql
-- Date: 2026-03-07
-- Description:
--   1. Recreate all SECURITY DEFINER helper functions with SET search_path = public
--   2. Drop ALL broken/recursive policies on company_members
--   3. Recreate clean non-recursive policies
--   4. Fix inline-subquery policies on other tables (00012, 00013)
--   5. Enable RLS + create policies for 70+ business tables from 00010
-- ============================================================================

BEGIN;

-- ─── Detect column name: role vs role_code ──────────────────────────────────
-- Production DB uses role_code TEXT; unified schema uses role company_role enum
-- We create helpers that work with whichever exists

-- Helper: get the actual role column value for a user in a company
CREATE OR REPLACE FUNCTION _cm_role(target_company_id UUID, target_user_id UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(
    -- Try role_code first (legacy/production schema)
    (SELECT role_code FROM public.company_members 
     WHERE company_id = target_company_id AND user_id = target_user_id AND status = 'active' LIMIT 1),
    -- Fallback to role (unified schema)
    (SELECT role::TEXT FROM public.company_members 
     WHERE company_id = target_company_id AND user_id = target_user_id AND status = 'active' LIMIT 1)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


-- ─── STEP 1: Recreate SECURITY DEFINER helper functions ─────────────────────
-- All with SET search_path = public to guarantee RLS bypass

-- Returns all company IDs the current auth user belongs to
CREATE OR REPLACE FUNCTION auth_user_company_ids()
RETURNS SETOF UUID AS $$
  SELECT company_id 
  FROM public.company_members 
  WHERE user_id = auth.uid() 
  AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Check if current user is a member of the given company
CREATE OR REPLACE FUNCTION is_company_member(target_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = target_company_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Check if current user is platform founder
CREATE OR REPLACE FUNCTION is_founder()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND platform_role = 'founder'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Check if current user is platform admin or founder
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND platform_role IN ('founder', 'platform_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Check if current user is owner or GM of the given company
CREATE OR REPLACE FUNCTION is_company_admin(target_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = target_company_id
    AND owner_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = target_company_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND (
      COALESCE(role_code, role::TEXT) = 'company_gm'
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Aliases for convenience
CREATE OR REPLACE FUNCTION is_platform_founder()
RETURNS BOOLEAN AS $$
  SELECT is_founder();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


-- ─── STEP 2: Drop ALL existing policies on company_members ──────────────────
-- Both from 00002_rls_policies.sql and 002_rls_store_invitations.sql

DROP POLICY IF EXISTS "company_members_select" ON company_members;
DROP POLICY IF EXISTS "company_members_insert" ON company_members;
DROP POLICY IF EXISTS "company_members_update" ON company_members;
DROP POLICY IF EXISTS "company_members_delete" ON company_members;
DROP POLICY IF EXISTS "Members can see their company members" ON company_members;
DROP POLICY IF EXISTS "Company GMs can manage members" ON company_members;
DROP POLICY IF EXISTS "cm_select" ON company_members;
DROP POLICY IF EXISTS "cm_insert" ON company_members;
DROP POLICY IF EXISTS "cm_update" ON company_members;
DROP POLICY IF EXISTS "cm_delete" ON company_members;


-- ─── STEP 3: Create clean non-recursive policies on company_members ─────────

-- Ensure RLS is enabled
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- SELECT: user can see own memberships + members of same company (via SECURITY DEFINER) + platform admin
CREATE POLICY "cm_select" ON company_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_company_member(company_id)
    OR is_platform_admin()
  );

-- INSERT: only company admin or platform admin
CREATE POLICY "cm_insert" ON company_members
  FOR INSERT TO authenticated
  WITH CHECK (
    is_company_admin(company_id)
    OR is_platform_admin()
  );

-- UPDATE: only company admin or platform admin
CREATE POLICY "cm_update" ON company_members
  FOR UPDATE TO authenticated
  USING (
    is_company_admin(company_id)
    OR is_platform_admin()
  );

-- DELETE: only company admin or platform admin
CREATE POLICY "cm_delete" ON company_members
  FOR DELETE TO authenticated
  USING (
    is_company_admin(company_id)
    OR is_platform_admin()
  );


-- ─── STEP 4: Fix profiles SELECT policy ─────────────────────────────────────

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR is_platform_admin()
    OR id IN (
      SELECT cm2.user_id FROM public.company_members cm2
      WHERE cm2.company_id IN (SELECT auth_user_company_ids())
      AND cm2.status = 'active'
    )
  );


-- ─── STEP 5: Fix inline-subquery policies from 00012 ───────────────────────
-- Replace SELECT company_id FROM company_members WHERE user_id = auth.uid()
-- with auth_user_company_ids() or is_company_member()

-- pricing_quotes
DO $$ BEGIN
  DROP POLICY IF EXISTS "pricing_quotes_read" ON pricing_quotes;
  CREATE POLICY "pricing_quotes_read" ON pricing_quotes FOR SELECT TO authenticated
    USING (company_id IN (SELECT auth_user_company_ids()) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- pricing_quote_items
DO $$ BEGIN
  DROP POLICY IF EXISTS "pricing_quote_items_read" ON pricing_quote_items;
  CREATE POLICY "pricing_quote_items_read" ON pricing_quote_items FOR SELECT TO authenticated
    USING (quote_id IN (
      SELECT id FROM pricing_quotes WHERE company_id IN (SELECT auth_user_company_ids())
    ) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- integration_setup_sessions
DO $$ BEGIN
  DROP POLICY IF EXISTS "integration_setup_read" ON integration_setup_sessions;
  CREATE POLICY "integration_setup_read" ON integration_setup_sessions FOR SELECT TO authenticated
    USING (is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- integration_health_checks
DO $$ BEGIN
  DROP POLICY IF EXISTS "integration_health_read" ON integration_health_checks;
  CREATE POLICY "integration_health_read" ON integration_health_checks FOR SELECT TO authenticated
    USING (is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- integration_sync_runs
DO $$ BEGIN
  DROP POLICY IF EXISTS "integration_sync_read" ON integration_sync_runs;
  CREATE POLICY "integration_sync_read" ON integration_sync_runs FOR SELECT TO authenticated
    USING (is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ai_policy_rules
DO $$ BEGIN
  DROP POLICY IF EXISTS "ai_policy_read" ON ai_policy_rules;
  CREATE POLICY "ai_policy_read" ON ai_policy_rules FOR SELECT TO authenticated
    USING (company_id IS NULL OR is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ai_action_reviews
DO $$ BEGIN
  DROP POLICY IF EXISTS "ai_reviews_read" ON ai_action_reviews;
  CREATE POLICY "ai_reviews_read" ON ai_action_reviews FOR SELECT TO authenticated
    USING (is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- module_runtime_metrics
DO $$ BEGIN
  DROP POLICY IF EXISTS "module_metrics_read" ON module_runtime_metrics;
  CREATE POLICY "module_metrics_read" ON module_runtime_metrics FOR SELECT TO authenticated
    USING (is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- approval_workflows
DO $$ BEGIN
  DROP POLICY IF EXISTS "approval_workflows_read" ON approval_workflows;
  CREATE POLICY "approval_workflows_read" ON approval_workflows FOR SELECT TO authenticated
    USING (is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- approval_requests
DO $$ BEGIN
  DROP POLICY IF EXISTS "approval_requests_read" ON approval_requests;
  CREATE POLICY "approval_requests_read" ON approval_requests FOR SELECT TO authenticated
    USING (is_company_member(company_id) OR is_platform_admin());
  DROP POLICY IF EXISTS "approval_requests_insert" ON approval_requests;
  CREATE POLICY "approval_requests_insert" ON approval_requests FOR INSERT TO authenticated
    WITH CHECK (is_company_member(company_id) AND requested_by = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- tenant_health_snapshots
DO $$ BEGIN
  DROP POLICY IF EXISTS "tenant_health_read" ON tenant_health_snapshots;
  CREATE POLICY "tenant_health_read" ON tenant_health_snapshots FOR SELECT TO authenticated
    USING (is_platform_admin() OR is_company_admin(company_id));
EXCEPTION WHEN undefined_table THEN NULL; END $$;


-- ─── STEP 6: Fix inline-subquery policies from 00013 ───────────────────────

DO $$ BEGIN
  DROP POLICY IF EXISTS "general_ledger_tenant_isolation" ON general_ledger;
  CREATE POLICY "general_ledger_tenant_isolation" ON general_ledger
    USING (is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "cost_centers_tenant_isolation" ON cost_centers;
  CREATE POLICY "cost_centers_tenant_isolation" ON cost_centers
    USING (is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "employee_shifts_tenant_isolation" ON employee_shifts;
  CREATE POLICY "employee_shifts_tenant_isolation" ON employee_shifts
    USING (is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "employee_goals_tenant_isolation" ON employee_goals;
  CREATE POLICY "employee_goals_tenant_isolation" ON employee_goals
    USING (is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "crm_activities_tenant_isolation" ON crm_activities;
  CREATE POLICY "crm_activities_tenant_isolation" ON crm_activities
    USING (is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "deal_stages_tenant_isolation" ON deal_stages;
  CREATE POLICY "deal_stages_tenant_isolation" ON deal_stages
    USING (is_company_member(company_id) OR is_platform_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;


-- ─── STEP 7: Enable RLS + Create policies for 70+ business tables from 00010 ─
-- These tables were created without any RLS policies. We add tenant isolation.

-- Macro: For each table that has company_id, enable RLS and create CRUD policies
-- We use DO blocks for safety (skip if table doesn't exist)

-- Helper function for creating standard tenant policies
CREATE OR REPLACE FUNCTION _enable_tenant_rls(tbl TEXT) RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  EXECUTE format('DROP POLICY IF EXISTS "%s_tenant_select" ON %I', tbl, tbl);
  EXECUTE format('DROP POLICY IF EXISTS "%s_tenant_insert" ON %I', tbl, tbl);
  EXECUTE format('DROP POLICY IF EXISTS "%s_tenant_update" ON %I', tbl, tbl);
  EXECUTE format('DROP POLICY IF EXISTS "%s_tenant_delete" ON %I', tbl, tbl);
  
  EXECUTE format(
    'CREATE POLICY "%s_tenant_select" ON %I FOR SELECT TO authenticated USING (is_company_member(company_id) OR is_platform_admin())',
    tbl, tbl
  );
  EXECUTE format(
    'CREATE POLICY "%s_tenant_insert" ON %I FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id))',
    tbl, tbl
  );
  EXECUTE format(
    'CREATE POLICY "%s_tenant_update" ON %I FOR UPDATE TO authenticated USING (is_company_member(company_id) OR is_platform_admin())',
    tbl, tbl
  );
  EXECUTE format(
    'CREATE POLICY "%s_tenant_delete" ON %I FOR DELETE TO authenticated USING (is_company_admin(company_id) OR is_platform_admin())',
    tbl, tbl
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply tenant RLS to all business tables that have company_id
-- Wrapped in exception handlers for tables that may not exist yet
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    -- Accounting/Finance
    'chart_of_accounts', 'journal_entries', 'journal_lines', 'advances', 'expenses',
    -- HR
    'employee_documents', 'benefits', 'insurance_claims', 'job_posts', 'job_applications',
    'training_courses', 'training_assignments', 'training_attempts',
    -- CRM
    'leads', 'opportunities', 'receipts', 'client_portal_users',
    -- Projects
    'project_members', 'tasks', 'task_comments', 'work_logs',
    -- Logistics
    'drivers', 'routes', 'shipments', 'gps_tracks', 'location_pings', 'geofences',
    -- Store/POS
    'warehouses', 'inventory_items', 'pos_sessions', 'pos_orders', 'pos_order_items',
    'customer_orders', 'customer_order_items',
    -- Chat & Meetings
    'chat_channels', 'chat_channel_members', 'chat_messages', 'presence_status',
    'meeting_rooms', 'meeting_sessions', 'meeting_participants', 'meeting_transcripts', 'meeting_summaries',
    -- AI & Platform
    'ai_agent_actions', 'security_events', 'integration_events',
    -- Billing
    'pricing_addons', 'subscription_usage_counters', 'billing_events',
    -- Additional from 00010
    'product_variants'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    BEGIN
      -- Check if table exists AND has company_id column
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'company_id'
      ) THEN
        PERFORM _enable_tenant_rls(tbl);
        RAISE NOTICE 'RLS enabled for %', tbl;
      ELSE
        RAISE NOTICE 'Skipped % (missing or no company_id)', tbl;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error on %: %', tbl, SQLERRM;
    END;
  END LOOP;
END $$;

-- Clean up the helper function
DROP FUNCTION IF EXISTS _enable_tenant_rls(TEXT);


-- ─── STEP 8: Special policies for tables without company_id ─────────────────

-- journal_lines: company_id is on parent journal_entries
DO $$ BEGIN
  ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "journal_lines_tenant" ON journal_lines;
  CREATE POLICY "journal_lines_tenant" ON journal_lines FOR SELECT TO authenticated
    USING (
      entry_id IN (SELECT id FROM journal_entries WHERE company_id IN (SELECT auth_user_company_ids()))
      OR is_platform_admin()
    );
EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;

-- task_comments: company_id is on parent tasks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'task_comments' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "task_comments_tenant" ON task_comments;
    CREATE POLICY "task_comments_tenant" ON task_comments FOR SELECT TO authenticated
      USING (
        task_id IN (SELECT id FROM tasks WHERE company_id IN (SELECT auth_user_company_ids()))
        OR is_platform_admin()
      );
  END IF;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- work_logs: company_id may be on parent tasks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'work_logs' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "work_logs_tenant" ON work_logs;
    CREATE POLICY "work_logs_tenant" ON work_logs FOR SELECT TO authenticated
      USING (
        task_id IN (SELECT id FROM tasks WHERE company_id IN (SELECT auth_user_company_ids()))
        OR is_platform_admin()
      );
  END IF;
EXCEPTION WHEN undefined_table THEN NULL; END $$;


COMMIT;

-- ============================================================================
-- VERIFICATION: Run these queries after applying to confirm no recursion
-- ============================================================================
-- SELECT * FROM company_members LIMIT 5;
-- SELECT is_company_member('8698a2b7-53e6-41b9-a43c-457d480eb9e1');
-- SELECT auth_user_company_ids();
-- ============================================================================
