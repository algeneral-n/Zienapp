-- Migration 00025: RLS + RBAC Hardening
-- Security functions, FORCE RLS, unified policies, cross-tenant guards, audit triggers
-- ZIEN Platform Security Foundation

-- ============================================================
-- 1. CORE SECURITY FUNCTIONS (SECURITY DEFINER)
-- These are the SINGLE SOURCE OF TRUTH for all policy decisions
-- ============================================================

-- Current authenticated user ID
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
  SELECT COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is platform founder
CREATE OR REPLACE FUNCTION is_founder()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_roles
    WHERE user_id = auth.uid()
      AND role_code = 'founder'
      AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is platform admin (founder OR platform_admin)
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_roles
    WHERE user_id = auth.uid()
      AND role_code IN ('founder', 'platform_admin')
      AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is member of a specific company
CREATE OR REPLACE FUNCTION is_company_member(_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = _company_id
      AND user_id = auth.uid()
      AND status = 'active'
  ) OR is_platform_admin();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user has a specific role in a company
CREATE OR REPLACE FUNCTION has_company_role(_company_id UUID, _role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = _company_id
      AND user_id = auth.uid()
      AND role_code = _role
      AND status = 'active'
  ) OR is_platform_admin();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get the role level for a given role_code
CREATE OR REPLACE FUNCTION get_role_level(_role TEXT)
RETURNS INTEGER AS $$
  SELECT CASE _role
    WHEN 'founder' THEN 100
    WHEN 'platform_admin' THEN 95
    WHEN 'platform_support' THEN 90
    WHEN 'company_gm' THEN 85
    WHEN 'assistant_gm' THEN 80
    WHEN 'executive_secretary' THEN 75
    WHEN 'department_manager' THEN 65
    WHEN 'hr_officer' THEN 60
    WHEN 'accountant' THEN 60
    WHEN 'supervisor' THEN 55
    WHEN 'senior_employee' THEN 45
    WHEN 'sales_rep' THEN 45
    WHEN 'employee' THEN 35
    WHEN 'field_employee' THEN 30
    WHEN 'driver' THEN 25
    WHEN 'new_hire' THEN 20
    WHEN 'trainee' THEN 15
    WHEN 'client_user' THEN 10
    ELSE 0
  END;
$$ LANGUAGE sql IMMUTABLE;

-- Check if current user has minimum permission level in a company
CREATE OR REPLACE FUNCTION has_permission(_company_id UUID, _min_level INTEGER)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = _company_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND get_role_level(role_code) >= _min_level
  ) OR is_platform_admin();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check delegation: assistant_gm can act on behalf of GM
CREATE OR REPLACE FUNCTION has_delegation(_company_id UUID, _from_role TEXT, _to_user_id UUID, _scope JSONB DEFAULT '{}')
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM role_delegations
    WHERE company_id = _company_id
      AND from_role = _from_role
      AND to_user_id = _to_user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (_scope = '{}' OR scope @> _scope)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if company has a specific module enabled
CREATE OR REPLACE FUNCTION company_has_module(_company_id UUID, _module_code TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_modules cm
    JOIN modules_catalog mc ON mc.id = cm.module_id
    WHERE cm.company_id = _company_id
      AND mc.code = _module_code
      AND cm.is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- 2. ROLE DELEGATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS role_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    from_role TEXT NOT NULL,
    to_user_id UUID NOT NULL,
    scope JSONB DEFAULT '{}',
    reason TEXT,
    is_active BOOLEAN DEFAULT true,
    granted_by UUID NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE role_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_delegations FORCE ROW LEVEL SECURITY;
CREATE POLICY "role_delegations_select" ON role_delegations FOR SELECT
  USING (is_company_member(company_id));
CREATE POLICY "role_delegations_insert" ON role_delegations FOR INSERT
  WITH CHECK (has_company_role(company_id, 'company_gm') OR is_platform_admin());
CREATE POLICY "role_delegations_update" ON role_delegations FOR UPDATE
  USING (has_company_role(company_id, 'company_gm') OR is_platform_admin());
CREATE POLICY "role_delegations_delete" ON role_delegations FOR DELETE
  USING (has_company_role(company_id, 'company_gm') OR is_platform_admin());

-- ============================================================
-- 3. FORCE RLS ON ALL OPERATIONAL TABLES
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'companies', 'company_members', 'departments',
      'clients', 'invoices', 'invoice_items', 'payments',
      'employees', 'attendance', 'leave_requests',
      'tax_settings', 'projects', 'project_tasks',
      'company_modules', 'provisioning_jobs',
      'company_subscriptions', 'payment_events',
      'marketing_campaigns', 'marketing_audience_segments', 'marketing_email_templates',
      'voice_agent_configs', 'call_logs',
      'ai_conversations', 'ai_agent_configs',
      'integration_pricing_rules', 'company_integrations',
      'apple_pay_sessions', 'role_delegations',
      'support_tickets', 'audit_logs', 'ai_usage_logs'
    ])
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Table % not found, skipping FORCE RLS', tbl;
    END;
  END LOOP;
END $$;

-- ============================================================
-- 4. UNIFIED POLICIES FOR ALL OPERATIONAL TABLES
-- Pattern: SELECT = is_company_member, INSERT = member + created_by,
-- UPDATE = has_permission(55+), DELETE = has_permission(65+)
-- ============================================================

-- Helper: Drop all existing policies on a table before creating new ones
CREATE OR REPLACE FUNCTION _drop_policies(_table TEXT) RETURNS VOID AS $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = _table AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, _table);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Apply unified policies to standard operational tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'clients', 'invoices', 'invoice_items', 'payments',
      'employees', 'attendance', 'leave_requests',
      'tax_settings', 'projects', 'project_tasks'
    ])
  LOOP
    BEGIN
      PERFORM _drop_policies(tbl);

      -- SELECT: any company member
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR SELECT USING (is_company_member(company_id))',
        tbl || '_sel', tbl
      );

      -- INSERT: any company member (created_by match optional)
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (is_company_member(company_id))',
        tbl || '_ins', tbl
      );

      -- UPDATE: supervisor+ (level 55)
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR UPDATE USING (has_permission(company_id, 55)) WITH CHECK (has_permission(company_id, 55))',
        tbl || '_upd', tbl
      );

      -- DELETE: department_manager+ (level 65)
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR DELETE USING (has_permission(company_id, 65))',
        tbl || '_del', tbl
      );

    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Table % not found, skipping policies', tbl;
    END;
  END LOOP;
END $$;

-- Special policies for companies table
SELECT _drop_policies('companies');
CREATE POLICY "companies_sel" ON companies FOR SELECT
  USING (is_company_member(id) OR owner_user_id = auth.uid() OR is_platform_admin());
CREATE POLICY "companies_ins" ON companies FOR INSERT
  WITH CHECK (owner_user_id = auth.uid() OR is_platform_admin());
CREATE POLICY "companies_upd" ON companies FOR UPDATE
  USING (has_company_role(id, 'company_gm') OR is_platform_admin())
  WITH CHECK (has_company_role(id, 'company_gm') OR is_platform_admin());

-- Special policies for company_members
SELECT _drop_policies('company_members');
CREATE POLICY "company_members_sel" ON company_members FOR SELECT
  USING (is_company_member(company_id) OR user_id = auth.uid());
CREATE POLICY "company_members_ins" ON company_members FOR INSERT
  WITH CHECK (has_permission(company_id, 65) OR is_platform_admin());
CREATE POLICY "company_members_upd" ON company_members FOR UPDATE
  USING (has_permission(company_id, 65) OR is_platform_admin());
CREATE POLICY "company_members_del" ON company_members FOR DELETE
  USING (has_company_role(company_id, 'company_gm') OR is_platform_admin());

-- Special policies for departments
SELECT _drop_policies('departments');
CREATE POLICY "departments_sel" ON departments FOR SELECT
  USING (is_company_member(company_id));
CREATE POLICY "departments_ins" ON departments FOR INSERT
  WITH CHECK (has_permission(company_id, 65) OR is_platform_admin());
CREATE POLICY "departments_upd" ON departments FOR UPDATE
  USING (has_permission(company_id, 55) OR is_platform_admin());

-- AI tables: user owns their conversations
SELECT _drop_policies('ai_conversations');
CREATE POLICY "ai_conversations_sel" ON ai_conversations FOR SELECT
  USING (user_id = auth.uid() OR is_founder());
CREATE POLICY "ai_conversations_ins" ON ai_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_conversations_upd" ON ai_conversations FOR UPDATE
  USING (user_id = auth.uid());

-- Audit logs: read-only for company members, insert by anyone
SELECT _drop_policies('audit_logs');
CREATE POLICY "audit_logs_sel" ON audit_logs FOR SELECT
  USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "audit_logs_ins" ON audit_logs FOR INSERT
  WITH CHECK (true); -- Worker inserts with service role

-- ============================================================
-- 5. CROSS-TENANT GUARD TRIGGERS
-- Prevent FK references across companies
-- ============================================================

-- Guard: invoices.client_id must belong to same company
CREATE OR REPLACE FUNCTION guard_invoice_client_company()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM clients WHERE id = NEW.client_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-tenant violation: client does not belong to this company';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_invoice_client ON invoices;
CREATE TRIGGER trg_guard_invoice_client
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION guard_invoice_client_company();

-- Guard: employees.department_id must belong to same company
CREATE OR REPLACE FUNCTION guard_employee_department_company()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.department_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM departments WHERE id = NEW.department_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-tenant violation: department does not belong to this company';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_employee_dept ON employees;
CREATE TRIGGER trg_guard_employee_dept
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION guard_employee_department_company();

-- Guard: attendance.employee_id must belong to same company
CREATE OR REPLACE FUNCTION guard_attendance_employee_company()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM employees WHERE id = NEW.employee_id AND company_id = NEW.company_id
    ) THEN
      RAISE EXCEPTION 'Cross-tenant violation: employee does not belong to this company';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_attendance_emp ON attendance;
CREATE TRIGGER trg_guard_attendance_emp
  BEFORE INSERT OR UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION guard_attendance_employee_company();

-- Guard: leave_requests.employee_id must belong to same company
DROP TRIGGER IF EXISTS trg_guard_leave_emp ON leave_requests;
CREATE TRIGGER trg_guard_leave_emp
  BEFORE INSERT OR UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION guard_attendance_employee_company();

-- ============================================================
-- 6. AUDIT LOGGING TRIGGERS (sensitive operations)
-- ============================================================

-- Ensure audit_logs table exists with proper structure
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    user_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-audit role changes in company_members
CREATE OR REPLACE FUNCTION audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.role_code IS DISTINCT FROM NEW.role_code THEN
    INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
      NEW.company_id,
      auth.uid(),
      'role_change',
      'company_member',
      NEW.id::text,
      jsonb_build_object('role_code', OLD.role_code, 'status', OLD.status),
      jsonb_build_object('role_code', NEW.role_code, 'status', NEW.status)
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
      NEW.company_id,
      auth.uid(),
      'member_status_change',
      'company_member',
      NEW.id::text,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_role_changes ON company_members;
CREATE TRIGGER trg_audit_role_changes
  AFTER UPDATE ON company_members
  FOR EACH ROW EXECUTE FUNCTION audit_role_changes();

-- Auto-audit payment events
CREATE OR REPLACE FUNCTION audit_payment_events()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, new_data)
  VALUES (
    NEW.company_id,
    auth.uid(),
    'payment_' || COALESCE(NEW.event_type, 'unknown'),
    'payment_event',
    NEW.id::text,
    jsonb_build_object('gateway', NEW.gateway, 'amount', NEW.amount, 'currency', NEW.currency, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_payments ON payment_events;
CREATE TRIGGER trg_audit_payments
  AFTER INSERT ON payment_events
  FOR EACH ROW EXECUTE FUNCTION audit_payment_events();

-- Auto-audit subscription changes
CREATE OR REPLACE FUNCTION audit_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
      NEW.company_id,
      auth.uid(),
      'subscription_status_change',
      'company_subscription',
      NEW.id::text,
      jsonb_build_object('status', OLD.status, 'plan_code', OLD.plan_code),
      jsonb_build_object('status', NEW.status, 'plan_code', NEW.plan_code)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_subscription ON company_subscriptions;
CREATE TRIGGER trg_audit_subscription
  AFTER UPDATE ON company_subscriptions
  FOR EACH ROW EXECUTE FUNCTION audit_subscription_changes();

-- ============================================================
-- 7. AI GOVERNANCE TABLES
-- ============================================================

-- AI Policies (company-level AI rules)
CREATE TABLE IF NOT EXISTS ai_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    policy_type TEXT NOT NULL CHECK (policy_type IN ('allow', 'deny', 'require_approval', 'throttle')),
    agent_type TEXT,
    action_level TEXT CHECK (action_level IN ('read_only', 'suggest', 'modify', 'sensitive')),
    min_role_level INTEGER DEFAULT 0,
    max_daily_requests INTEGER,
    forbidden_topics TEXT[],
    require_human_approval BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_policies FORCE ROW LEVEL SECURITY;
CREATE POLICY "ai_policies_sel" ON ai_policies FOR SELECT
  USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "ai_policies_write" ON ai_policies FOR ALL
  USING (has_company_role(company_id, 'company_gm') OR is_platform_admin());

-- AI Action Reviews (approval queue for sensitive actions)
CREATE TABLE IF NOT EXISTS ai_action_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL,
    agent_type TEXT NOT NULL,
    action_code TEXT NOT NULL,
    action_level TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'executed')),
    reviewed_by UUID,
    review_note TEXT,
    reviewed_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    execution_result JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_action_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY "ai_reviews_sel" ON ai_action_reviews FOR SELECT
  USING (is_company_member(company_id));
CREATE POLICY "ai_reviews_ins" ON ai_action_reviews FOR INSERT
  WITH CHECK (is_company_member(company_id));
CREATE POLICY "ai_reviews_upd" ON ai_action_reviews FOR UPDATE
  USING (has_permission(company_id, 65));

-- AI Context Snapshots (safe summary per request)
CREATE TABLE IF NOT EXISTS ai_context_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    page_key TEXT,
    role_code TEXT,
    context_data JSONB NOT NULL DEFAULT '{}',
    forbidden_topics TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_context_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_context_snapshots FORCE ROW LEVEL SECURITY;
CREATE POLICY "ai_context_owner" ON ai_context_snapshots FOR ALL
  USING (user_id = auth.uid() OR is_platform_admin());

-- ============================================================
-- 8. APPROVAL REQUESTS TABLE (general purpose)
-- ============================================================

CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    action_code TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    requested_by UUID NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'cancelled')),
    approved_by UUID,
    approval_note TEXT,
    approved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '72 hours'),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY "approvals_sel" ON approval_requests FOR SELECT
  USING (is_company_member(company_id));
CREATE POLICY "approvals_ins" ON approval_requests FOR INSERT
  WITH CHECK (is_company_member(company_id));
CREATE POLICY "approvals_upd" ON approval_requests FOR UPDATE
  USING (has_permission(company_id, 65));

-- ============================================================
-- 9. BLUEPRINT STRATEGY TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS industry_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_code TEXT NOT NULL,
    country_code TEXT DEFAULT 'GLOBAL',
    business_size TEXT DEFAULT 'any' CHECK (business_size IN ('micro', 'small', 'medium', 'large', 'enterprise', 'any')),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    modules JSONB NOT NULL DEFAULT '[]',
    seed_packs JSONB DEFAULT '[]',
    suggested_integrations JSONB DEFAULT '[]',
    pricing_rules JSONB DEFAULT '{}',
    operational_model TEXT DEFAULT 'services',
    chart_of_accounts_template TEXT,
    tax_rules JSONB DEFAULT '{}',
    hr_templates JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed packs (reusable data templates)
CREATE TABLE IF NOT EXISTS seed_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('chart_of_accounts', 'vat_rules', 'hr_documents', 'pos_defaults', 'logistics_defaults', 'general')),
    country_code TEXT DEFAULT 'GLOBAL',
    data JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default "generic business" blueprint
INSERT INTO industry_blueprints (industry_code, name_ar, name_en, description, modules, is_default)
VALUES (
    'generic',
    'نشاط تجاري عام',
    'Generic Business',
    'Default blueprint for unrecognized business types. Activates core modules.',
    '["accounting", "hr", "crm", "projects", "integrations", "ai"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. PRICING QUOTES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS pricing_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES industry_blueprints(id),
    plan_code TEXT NOT NULL,
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
    line_items JSONB NOT NULL DEFAULT '[]',
    subtotal NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'AED',
    seats INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'paid', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pricing_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_quotes FORCE ROW LEVEL SECURITY;
CREATE POLICY "quotes_sel" ON pricing_quotes FOR SELECT
  USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "quotes_ins" ON pricing_quotes FOR INSERT
  WITH CHECK (TRUE); -- Created during onboarding before membership exists
CREATE POLICY "quotes_upd" ON pricing_quotes FOR UPDATE
  USING (is_company_member(company_id) OR is_platform_admin());

-- ============================================================
-- 11. PLATFORM INCIDENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category TEXT NOT NULL CHECK (category IN (
      'provisioning_stuck', 'integration_failure', 'billing_failure',
      'ai_anomaly', 'security_event', 'performance', 'custom'
    )),
    title TEXT NOT NULL,
    description TEXT,
    company_id UUID REFERENCES companies(id),
    related_entity_type TEXT,
    related_entity_id TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'mitigated', 'resolved', 'auto_resolved')),
    runbook JSONB DEFAULT '{}',
    auto_fix_available BOOLEAN DEFAULT false,
    auto_fix_action JSONB,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_incidents FORCE ROW LEVEL SECURITY;
CREATE POLICY "incidents_sel" ON platform_incidents FOR SELECT
  USING (is_platform_admin());
CREATE POLICY "incidents_write" ON platform_incidents FOR ALL
  USING (is_platform_admin());

-- ============================================================
-- 12. PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_role_delegations_company ON role_delegations(company_id);
CREATE INDEX IF NOT EXISTS idx_role_delegations_user ON role_delegations(to_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_policies_company ON ai_policies(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_reviews_company ON ai_action_reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_reviews_status ON ai_action_reviews(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_company ON approval_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_industry_blueprints_code ON industry_blueprints(industry_code);
CREATE INDEX IF NOT EXISTS idx_pricing_quotes_company ON pricing_quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_platform_incidents_status ON platform_incidents(status);
CREATE INDEX IF NOT EXISTS idx_platform_incidents_severity ON platform_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Done: Migration 00025 — RLS + RBAC Hardening
