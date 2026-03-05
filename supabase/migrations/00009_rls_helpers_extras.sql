-- ============================================================================
-- ZIEN Platform - RLS Helper Functions (Extras)
-- Migration: 00009_rls_helpers_extras.sql
-- Date: 2026-02-25
-- Description: Align RLS helpers with ZIEN Master Blueprint (section 5)
-- ============================================================================

-- 1) current_user_id()
-- Simple wrapper around auth.uid() to match blueprint naming
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
    SELECT auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- 2) is_platform_founder()
-- Thin alias over is_founder() to keep blueprint naming
CREATE OR REPLACE FUNCTION is_platform_founder()
RETURNS BOOLEAN AS $$
    SELECT is_founder();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- 3) can_access_department(company_id, department_id)
-- Checks whether the current user can access a specific department within a company.
-- Rules (conservative by default):
--  - Company admins (owner/GM or platform admin) always have access.
--  - Active members of the same company whose own department_id matches the target
--    department_id have access.
--  - Any member granted a generic permission code 'department_access_all' for that
--    company has access (to allow HR/central roles to see all departments).
CREATE OR REPLACE FUNCTION can_access_department(target_company_id UUID, target_department_id UUID)
RETURNS BOOLEAN AS $$
    SELECT
        -- Company-wide admins
        is_company_admin(target_company_id)
        OR is_platform_admin()
        OR EXISTS (
            -- Member of the same company assigned to that department
            SELECT 1
            FROM company_members cm
            WHERE cm.company_id = target_company_id
              AND cm.user_id = auth.uid()
              AND cm.status = 'active'
              AND cm.department_id = target_department_id
        )
        OR has_permission(target_company_id, 'department_access_all');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- End of RLS helper extras
-- ============================================================================
