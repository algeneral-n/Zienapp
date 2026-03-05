-- ============================================================================
-- ZIEN Platform - Row Level Security Policies
-- Migration: 00002_rls_policies.sql
-- Date: 2026-02-24
-- Description: RLS helper functions + policies for every table
-- ============================================================================

-- =========================
-- 0. ENABLE RLS ON ALL TABLES
-- =========================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_type_template_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_seed_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE provisioning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_onboarding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- =========================
-- 1. HELPER FUNCTIONS
-- =========================

-- Check if current user is platform founder
CREATE OR REPLACE FUNCTION is_founder()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND platform_role = 'founder'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is platform admin or founder
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND platform_role IN ('founder', 'platform_admin')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is a member of the given company
CREATE OR REPLACE FUNCTION is_company_member(target_company_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM company_members
        WHERE company_id = target_company_id
        AND user_id = auth.uid()
        AND status = 'active'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is owner or GM of the given company
CREATE OR REPLACE FUNCTION is_company_admin(target_company_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM companies
        WHERE id = target_company_id
        AND owner_user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM company_members
        WHERE company_id = target_company_id
        AND user_id = auth.uid()
        AND role = 'company_gm'
        AND status = 'active'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user has a specific company role or higher
CREATE OR REPLACE FUNCTION has_company_role(target_company_id UUID, target_role company_role)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM company_members
        WHERE company_id = target_company_id
        AND user_id = auth.uid()
        AND status = 'active'
        AND (
            role = target_role
            OR role = 'company_gm'
            OR (role = 'executive_secretary' AND target_role IN ('department_manager', 'supervisor', 'employee'))
            OR (role = 'department_manager' AND target_role IN ('supervisor', 'employee'))
            OR (role = 'supervisor' AND target_role = 'employee')
        )
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has a specific permission in a company
CREATE OR REPLACE FUNCTION has_permission(target_company_id UUID, target_permission TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM company_members cm
        JOIN role_permissions rp ON rp.role = cm.role
        JOIN permissions p ON p.id = rp.permission_id
        WHERE cm.company_id = target_company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND p.code = target_permission
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =========================
-- 2. PLATFORM LOOKUP TABLES (READ-ONLY PUBLIC)
-- =========================

-- modules_catalog: everyone can read, only platform admins can write
CREATE POLICY "modules_catalog_select" ON modules_catalog
    FOR SELECT USING (true);
CREATE POLICY "modules_catalog_admin" ON modules_catalog
    FOR ALL USING (is_platform_admin());

-- company_types: everyone can read, only platform admins can write
CREATE POLICY "company_types_select" ON company_types
    FOR SELECT USING (true);
CREATE POLICY "company_types_admin" ON company_types
    FOR ALL USING (is_platform_admin());

-- company_type_template_modules: everyone can read
CREATE POLICY "company_type_template_modules_select" ON company_type_template_modules
    FOR SELECT USING (true);
CREATE POLICY "company_type_template_modules_admin" ON company_type_template_modules
    FOR ALL USING (is_platform_admin());

-- subscription_plans: everyone can read
CREATE POLICY "subscription_plans_select" ON subscription_plans
    FOR SELECT USING (true);
CREATE POLICY "subscription_plans_admin" ON subscription_plans
    FOR ALL USING (is_platform_admin());

-- permissions: everyone can read
CREATE POLICY "permissions_select" ON permissions
    FOR SELECT USING (true);
CREATE POLICY "permissions_admin" ON permissions
    FOR ALL USING (is_platform_admin());

-- role_permissions: everyone can read
CREATE POLICY "role_permissions_select" ON role_permissions
    FOR SELECT USING (true);
CREATE POLICY "role_permissions_admin" ON role_permissions
    FOR ALL USING (is_platform_admin());

-- =========================
-- 3. PROFILES
-- =========================

-- Users can read their own profile, platform admins can read all
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (
        id = auth.uid()
        OR is_platform_admin()
        -- Allow company members to see co-workers' profiles
        OR EXISTS (
            SELECT 1 FROM company_members cm1
            JOIN company_members cm2 ON cm1.company_id = cm2.company_id
            WHERE cm1.user_id = auth.uid()
            AND cm2.user_id = profiles.id
            AND cm1.status = 'active'
        )
    );

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_admin" ON profiles
    FOR ALL USING (is_platform_admin());

-- =========================
-- 4. COMPANIES
-- =========================

-- Members can read their company, admins can read all
CREATE POLICY "companies_select_member" ON companies
    FOR SELECT USING (
        is_company_member(id)
        OR owner_user_id = auth.uid()
        OR is_platform_admin()
    );

-- Owner or GM can update
CREATE POLICY "companies_update" ON companies
    FOR UPDATE USING (is_company_admin(id) OR is_platform_admin());

-- Only platform admin can insert/delete
CREATE POLICY "companies_insert" ON companies
    FOR INSERT WITH CHECK (is_platform_admin() OR owner_user_id = auth.uid());

CREATE POLICY "companies_delete" ON companies
    FOR DELETE USING (is_platform_admin());

-- =========================
-- 5. COMPANY MEMBERS
-- =========================

CREATE POLICY "company_members_select" ON company_members
    FOR SELECT USING (
        is_company_member(company_id)
        OR user_id = auth.uid()
        OR is_platform_admin()
    );

CREATE POLICY "company_members_insert" ON company_members
    FOR INSERT WITH CHECK (
        is_company_admin(company_id)
        OR is_platform_admin()
    );

CREATE POLICY "company_members_update" ON company_members
    FOR UPDATE USING (
        is_company_admin(company_id)
        OR is_platform_admin()
    );

CREATE POLICY "company_members_delete" ON company_members
    FOR DELETE USING (
        is_company_admin(company_id)
        OR is_platform_admin()
    );

-- =========================
-- 6. DEPARTMENTS
-- =========================

CREATE POLICY "departments_select" ON departments
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());

CREATE POLICY "departments_modify" ON departments
    FOR ALL USING (is_company_admin(company_id) OR is_platform_admin());

-- =========================
-- 7. COMPANY MODULES
-- =========================

CREATE POLICY "company_modules_select" ON company_modules
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());

CREATE POLICY "company_modules_modify" ON company_modules
    FOR ALL USING (is_company_admin(company_id) OR is_platform_admin());

-- =========================
-- 8. PROVISIONING (platform admin only + visibility)
-- =========================

CREATE POLICY "blueprints_select" ON blueprints
    FOR SELECT USING (true);
CREATE POLICY "blueprints_admin" ON blueprints
    FOR ALL USING (is_platform_admin());

CREATE POLICY "blueprint_modules_select" ON blueprint_modules
    FOR SELECT USING (true);
CREATE POLICY "blueprint_modules_admin" ON blueprint_modules
    FOR ALL USING (is_platform_admin());

CREATE POLICY "seed_packs_select" ON seed_packs
    FOR SELECT USING (true);
CREATE POLICY "seed_packs_admin" ON seed_packs
    FOR ALL USING (is_platform_admin());

CREATE POLICY "blueprint_seed_packs_select" ON blueprint_seed_packs
    FOR SELECT USING (true);
CREATE POLICY "blueprint_seed_packs_admin" ON blueprint_seed_packs
    FOR ALL USING (is_platform_admin());

CREATE POLICY "provisioning_jobs_select" ON provisioning_jobs
    FOR SELECT USING (
        is_company_admin(company_id)
        OR requested_by = auth.uid()
        OR is_platform_admin()
    );

CREATE POLICY "provisioning_jobs_admin" ON provisioning_jobs
    FOR ALL USING (is_platform_admin());

-- =========================
-- 9. BILLING
-- =========================

CREATE POLICY "company_subscriptions_select" ON company_subscriptions
    FOR SELECT USING (
        is_company_admin(company_id)
        OR is_platform_admin()
    );

CREATE POLICY "company_subscriptions_admin" ON company_subscriptions
    FOR ALL USING (is_platform_admin());

-- =========================
-- 10. BUSINESS MODULE TABLES
-- (Company member can read, authorized roles can write)
-- =========================

-- Macro: per-company standard policies
-- Clients
CREATE POLICY "clients_select" ON clients
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "clients_modify" ON clients
    FOR ALL USING (
        has_company_role(company_id, 'employee')
        OR is_platform_admin()
    );

-- Invoices
CREATE POLICY "invoices_select" ON invoices
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "invoices_modify" ON invoices
    FOR ALL USING (
        has_company_role(company_id, 'supervisor')
        OR is_platform_admin()
    );

-- Invoice Items
CREATE POLICY "invoice_items_select" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices i
            WHERE i.id = invoice_items.invoice_id
            AND (is_company_member(i.company_id) OR is_platform_admin())
        )
    );
CREATE POLICY "invoice_items_modify" ON invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM invoices i
            WHERE i.id = invoice_items.invoice_id
            AND (has_company_role(i.company_id, 'supervisor') OR is_platform_admin())
        )
    );

-- Payments
CREATE POLICY "payments_select" ON payments
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "payments_modify" ON payments
    FOR ALL USING (
        has_company_role(company_id, 'supervisor')
        OR is_platform_admin()
    );

-- Tax Settings
CREATE POLICY "tax_settings_select" ON tax_settings
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "tax_settings_modify" ON tax_settings
    FOR ALL USING (is_company_admin(company_id) OR is_platform_admin());

-- Employees
CREATE POLICY "employees_select" ON employees
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "employees_modify" ON employees
    FOR ALL USING (
        has_company_role(company_id, 'department_manager')
        OR is_platform_admin()
    );

-- Attendance
CREATE POLICY "attendance_select" ON attendance
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "attendance_modify" ON attendance
    FOR ALL USING (
        has_company_role(company_id, 'supervisor')
        OR is_platform_admin()
    );

-- Leave Requests
CREATE POLICY "leave_requests_select" ON leave_requests
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "leave_requests_insert" ON leave_requests
    FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "leave_requests_update" ON leave_requests
    FOR UPDATE USING (
        has_company_role(company_id, 'supervisor')
        OR is_platform_admin()
    );

-- Payroll
CREATE POLICY "payroll_select" ON payroll
    FOR SELECT USING (
        has_company_role(company_id, 'department_manager')
        OR is_platform_admin()
    );
CREATE POLICY "payroll_modify" ON payroll
    FOR ALL USING (is_company_admin(company_id) OR is_platform_admin());

-- Vehicles
CREATE POLICY "vehicles_select" ON vehicles
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "vehicles_modify" ON vehicles
    FOR ALL USING (
        has_company_role(company_id, 'supervisor')
        OR is_platform_admin()
    );

-- Logistics Tasks
CREATE POLICY "logistics_tasks_select" ON logistics_tasks
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "logistics_tasks_modify" ON logistics_tasks
    FOR ALL USING (
        has_company_role(company_id, 'supervisor')
        OR is_platform_admin()
    );

-- Quotes
CREATE POLICY "quotes_select" ON quotes
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "quotes_modify" ON quotes
    FOR ALL USING (
        has_company_role(company_id, 'employee')
        OR is_platform_admin()
    );

-- Contracts
CREATE POLICY "contracts_select" ON contracts
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "contracts_modify" ON contracts
    FOR ALL USING (
        has_company_role(company_id, 'department_manager')
        OR is_platform_admin()
    );

-- Projects
CREATE POLICY "projects_select" ON projects
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "projects_modify" ON projects
    FOR ALL USING (
        has_company_role(company_id, 'supervisor')
        OR is_platform_admin()
    );

-- Meetings
CREATE POLICY "meetings_select" ON meetings
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "meetings_modify" ON meetings
    FOR ALL USING (is_company_member(company_id));

-- Chats
CREATE POLICY "chats_select" ON chats
    FOR SELECT USING (
        sender_id IN (
            SELECT id FROM company_members WHERE user_id = auth.uid() AND status = 'active'
        )
        OR receiver_id IN (
            SELECT id FROM company_members WHERE user_id = auth.uid() AND status = 'active'
        )
        OR is_platform_admin()
    );
CREATE POLICY "chats_insert" ON chats
    FOR INSERT WITH CHECK (is_company_member(company_id));

-- =========================
-- 11. ONBOARDING & DOCUMENTS
-- =========================

CREATE POLICY "onboarding_submissions_select" ON company_onboarding_submissions
    FOR SELECT USING (
        submitted_by = auth.uid()
        OR is_platform_admin()
    );
CREATE POLICY "onboarding_submissions_insert" ON company_onboarding_submissions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "onboarding_submissions_admin" ON company_onboarding_submissions
    FOR UPDATE USING (is_platform_admin());

CREATE POLICY "company_documents_select" ON company_documents
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "company_documents_modify" ON company_documents
    FOR ALL USING (
        has_company_role(company_id, 'department_manager')
        OR is_platform_admin()
    );

-- =========================
-- 12. AI & AUDIT
-- =========================

CREATE POLICY "ai_usage_logs_select" ON ai_usage_logs
    FOR SELECT USING (
        is_company_admin(company_id)
        OR user_id = auth.uid()
        OR is_platform_admin()
    );
CREATE POLICY "ai_usage_logs_insert" ON ai_usage_logs
    FOR INSERT WITH CHECK (is_company_member(company_id) OR is_platform_admin());

CREATE POLICY "ai_reports_select" ON ai_reports
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "ai_reports_insert" ON ai_reports
    FOR INSERT WITH CHECK (is_company_member(company_id) OR is_platform_admin());

CREATE POLICY "audit_logs_select" ON audit_logs
    FOR SELECT USING (
        is_company_admin(company_id)
        OR is_platform_admin()
    );
CREATE POLICY "audit_logs_insert" ON audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR is_platform_admin());

-- =========================
-- 13. FEATURE FLAGS
-- =========================

CREATE POLICY "feature_flags_select" ON feature_flags
    FOR SELECT USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "feature_flags_admin" ON feature_flags
    FOR ALL USING (is_company_admin(company_id) OR is_platform_admin());
