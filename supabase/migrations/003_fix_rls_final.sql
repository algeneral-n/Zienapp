-- ============================================================================
-- ZIEN Platform — DEFINITIVE RLS Fix (runs AFTER 002_rls_store_invitations.sql)
-- Migration: 003_fix_rls_final.sql
-- Date: 2026-03-10
-- Description:
--   002_rls_store_invitations.sql sorts AFTER all 000xx migrations (lexicographic)
--   and RE-INTRODUCES recursive policies on company_members that were fixed in 00018.
--   00020 tried to fix this but it sorts BEFORE 002, so the fix was useless.
--
--   This migration:
--   1. Drops ALL recursive policies on company_members from 002
--   2. Recreates clean non-recursive policies using SECURITY DEFINER helpers
--   3. Fixes departments/invitations/integrations policies inline queries
--   4. Ensures all SECURITY DEFINER helpers are current
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Ensure SECURITY DEFINER helpers exist (idempotent)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auth_user_company_ids()
RETURNS SETOF UUID AS $$
  SELECT company_id 
  FROM public.company_members 
  WHERE user_id = auth.uid() 
  AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_company_member(target_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = target_company_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_founder()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND platform_role = 'founder'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND platform_role IN ('founder', 'platform_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

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
    AND COALESCE(role_code, role::TEXT) = 'company_gm'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Helper: check if user has a specific role in a company
CREATE OR REPLACE FUNCTION has_company_role(target_company_id UUID, target_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = target_company_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND COALESCE(role_code, role::TEXT) = target_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Helper: check if user has any of the specified roles in a company
CREATE OR REPLACE FUNCTION has_any_company_role(target_company_id UUID, target_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = target_company_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND COALESCE(role_code, role::TEXT) = ANY(target_roles)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Helper: check if user is in the same department
CREATE OR REPLACE FUNCTION is_same_department(target_company_id UUID, target_dept_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = target_company_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND department_id = target_dept_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Helper: check if user is manager of another user
CREATE OR REPLACE FUNCTION is_manager_of(target_company_id UUID, target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.company_id = target_company_id
    AND e.user_id = target_user_id
    AND e.manager_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: Drop ALL existing policies on company_members (nuclear clean)
-- ═══════════════════════════════════════════════════════════════════════════════

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
DROP POLICY IF EXISTS "cm_select_safe" ON company_members;
DROP POLICY IF EXISTS "cm_manage_safe" ON company_members;

-- Ensure RLS is enabled
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: Create CLEAN non-recursive policies on company_members
-- ALL use SECURITY DEFINER functions — NO inline queries to company_members
-- ═══════════════════════════════════════════════════════════════════════════════

-- SELECT: see own row + members of same company (via SECURITY DEFINER) + platform admin
CREATE POLICY "cm_select_v3" ON company_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_company_member(company_id)
    OR is_platform_admin()
  );

-- INSERT: only company admin/GM or platform admin
CREATE POLICY "cm_insert_v3" ON company_members
  FOR INSERT TO authenticated
  WITH CHECK (
    is_company_admin(company_id)
    OR is_platform_admin()
  );

-- UPDATE: only company admin/GM or platform admin  
CREATE POLICY "cm_update_v3" ON company_members
  FOR UPDATE TO authenticated
  USING (
    is_company_admin(company_id)
    OR is_platform_admin()
  );

-- DELETE: only company admin/GM or platform admin
CREATE POLICY "cm_delete_v3" ON company_members
  FOR DELETE TO authenticated
  USING (
    is_company_admin(company_id)
    OR is_platform_admin()
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: Fix departments policies (replace inline company_members queries)
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Members can see their company departments" ON departments;
DROP POLICY IF EXISTS "GMs can manage departments" ON departments;
DROP POLICY IF EXISTS "departments_tenant_select" ON departments;
DROP POLICY IF EXISTS "departments_tenant_insert" ON departments;
DROP POLICY IF EXISTS "departments_tenant_update" ON departments;
DROP POLICY IF EXISTS "departments_tenant_delete" ON departments;

CREATE POLICY "dept_select_v3" ON departments
  FOR SELECT TO authenticated
  USING (is_company_member(company_id) OR is_platform_admin());

CREATE POLICY "dept_manage_v3" ON departments
  FOR ALL TO authenticated
  USING (
    has_any_company_role(company_id, ARRAY['company_gm', 'assistant_gm', 'executive_secretary'])
    OR is_platform_admin()
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: Fix company_invitations policies (replace inline queries)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  DROP POLICY IF EXISTS "Company admins can manage invitations" ON company_invitations;
  DROP POLICY IF EXISTS "Anyone can validate their invitation by token" ON company_invitations;

  CREATE POLICY "invitations_manage_v3" ON company_invitations
    FOR ALL TO authenticated
    USING (
      has_any_company_role(company_id, ARRAY['company_gm', 'assistant_gm', 'executive_secretary'])
      OR is_platform_admin()
    );

  CREATE POLICY "invitations_own_email_v3" ON company_invitations
    FOR SELECT TO authenticated
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
EXCEPTION WHEN undefined_table THEN NULL; END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: Fix tenant_integrations policies (replace inline queries)  
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  DROP POLICY IF EXISTS "Members can see their company integrations" ON tenant_integrations;
  DROP POLICY IF EXISTS "Admins can manage their company integrations" ON tenant_integrations;

  CREATE POLICY "tenant_integrations_select_v3" ON tenant_integrations
    FOR SELECT TO authenticated
    USING (is_company_member(company_id) OR is_platform_admin());

  CREATE POLICY "tenant_integrations_manage_v3" ON tenant_integrations
    FOR ALL TO authenticated
    USING (
      has_any_company_role(company_id, ARRAY['company_gm', 'assistant_gm', 'department_manager'])
      OR is_platform_admin()
    );
EXCEPTION WHEN undefined_table THEN NULL; END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: Fix presence_status policy (replace inline company_members query)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  DROP POLICY IF EXISTS "presence_status_select" ON presence_status;
  DROP POLICY IF EXISTS "presence_status_upsert" ON presence_status;
  DROP POLICY IF EXISTS "presence_status_tenant_select" ON presence_status;
  DROP POLICY IF EXISTS "presence_status_tenant_insert" ON presence_status;
  DROP POLICY IF EXISTS "presence_status_tenant_update" ON presence_status;
  DROP POLICY IF EXISTS "presence_status_tenant_delete" ON presence_status;

  ALTER TABLE presence_status ENABLE ROW LEVEL SECURITY;

  -- User sees own presence + anyone in same company
  CREATE POLICY "presence_select_v3" ON presence_status
    FOR SELECT TO authenticated
    USING (
      user_id = auth.uid()
      OR company_id IN (SELECT auth_user_company_ids())
      OR is_platform_admin()
    );

  -- Users can only update their own presence
  CREATE POLICY "presence_upsert_v3" ON presence_status
    FOR ALL TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL; END $$;


COMMIT;

-- ============================================================================
-- VERIFICATION (run after applying):
-- SELECT * FROM company_members LIMIT 5;      -- Should NOT loop
-- SELECT is_company_member('<any-company-id>');  -- Should return bool
-- SELECT auth_user_company_ids();               -- Should return UUID set
-- SELECT * FROM departments LIMIT 5;            -- Should work
-- ============================================================================
