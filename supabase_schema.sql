-- ZIEN Platform - Multi-tenant Database Schema
-- Optimized for Supabase Postgres + RLS

-- 1. CORE PLATFORM LAYER
CREATE TABLE IF NOT EXISTS platform_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    role_code TEXT NOT NULL CHECK (role_code IN ('founder', 'platform_admin', 'platform_support')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('core', 'addon', 'premium')),
    is_core BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_type_template_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_type_id UUID REFERENCES company_types(id),
    module_id UUID REFERENCES modules_catalog(id),
    is_default_enabled BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TENANT CORE
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    company_type_id UUID REFERENCES company_types(id),
    status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'active', 'restricted', 'suspended', 'rejected')),
    country_code TEXT DEFAULT 'AE',
    city TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'Asia/Dubai',
    currency_code TEXT DEFAULT 'AED',
    tax_mode TEXT DEFAULT 'country_default',
    owner_user_id UUID NOT NULL,
    branding_theme TEXT DEFAULT 'prism',
    branding_mode TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role_code TEXT NOT NULL CHECK (role_code IN ('company_gm', 'executive_secretary', 'department_manager', 'supervisor', 'employee', 'client_user')),
    branch_id UUID, -- To be defined if branches are used
    status TEXT DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended')),
    is_primary BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, user_id)
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    manager_member_id UUID REFERENCES company_members(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BILLING & USAGE
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    price_aed NUMERIC NOT NULL,
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
    max_users INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT DEFAULT 'active',
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BUSINESS MODULES (ENHANCED)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    invoice_number TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    total_amount NUMERIC DEFAULT 0,
    issued_at TIMESTAMPTZ DEFAULT now(),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    member_id UUID UNIQUE REFERENCES company_members(id),
    employee_code TEXT,
    job_title TEXT,
    department_id UUID REFERENCES departments(id),
    hire_date DATE,
    salary_amount NUMERIC,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ACCOUNTING
CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL,
    tax_name TEXT NOT NULL,
    tax_rate NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id),
    amount NUMERIC NOT NULL,
    payment_method TEXT,
    payment_date TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- HR (ENHANCED)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT DEFAULT 'present',
    location_lat NUMERIC,
    location_lng NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES company_members(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    basic_salary NUMERIC NOT NULL,
    allowances NUMERIC DEFAULT 0,
    deductions NUMERIC DEFAULT 0,
    net_salary NUMERIC NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- LOGISTICS
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    plate_number TEXT NOT NULL,
    model TEXT,
    type TEXT,
    status TEXT DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logistics_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES company_members(id),
    vehicle_id UUID REFERENCES vehicles(id),
    title TEXT NOT NULL,
    description TEXT,
    pickup_location TEXT,
    delivery_location TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled')),
    tracking_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CRM & PROJECTS
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    quote_number TEXT NOT NULL,
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft',
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    title TEXT NOT NULL,
    content TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- COMMUNICATION
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    meeting_link TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES company_members(id),
    receiver_id UUID REFERENCES company_members(id), -- Null if group chat
    group_id UUID, -- For group chats
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ONBOARDING & DOCUMENTS
CREATE TABLE IF NOT EXISTS company_onboarding_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    company_type_id UUID REFERENCES company_types(id),
    gm_name TEXT,
    gm_email TEXT,
    gm_phone TEXT,
    business_license_url TEXT,
    gm_id_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    category TEXT,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. AI & LOGS (ENHANCED)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    member_id UUID REFERENCES company_members(id),
    module_code TEXT,
    model_name TEXT,
    tokens_in INTEGER,
    tokens_out INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    module_code TEXT,
    report_type TEXT,
    content JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    member_id UUID REFERENCES company_members(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES (ENHANCED)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for enhanced tables
-- Helper function to check if user is platform founder
CREATE OR REPLACE FUNCTION is_founder() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() AND role_code = 'founder'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check company membership
CREATE OR REPLACE FUNCTION is_company_member(target_company_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM company_members 
    WHERE company_id = target_company_id AND user_id = auth.uid() AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for companies
CREATE POLICY "Founders can see all companies" ON companies
    FOR SELECT USING (is_founder());

CREATE POLICY "Members can see their own company" ON companies
    FOR SELECT USING (id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Policies for core modules
CREATE POLICY "Members can manage their company clients" ON clients FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company invoices" ON invoices FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company employees" ON employees FOR ALL USING (is_company_member(company_id));

CREATE POLICY "Members can manage their company tax settings" ON tax_settings FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company invoice items" ON invoice_items FOR ALL USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND is_company_member(invoices.company_id)));
CREATE POLICY "Members can manage their company payments" ON payments FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company attendance" ON attendance FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company leave requests" ON leave_requests FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company payroll" ON payroll FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company vehicles" ON vehicles FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company logistics tasks" ON logistics_tasks FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company quotes" ON quotes FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company contracts" ON contracts FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company projects" ON projects FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company meetings" ON meetings FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company chats" ON chats FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Founders can manage onboarding submissions" ON company_onboarding_submissions FOR ALL USING (is_founder());
CREATE POLICY "Members can manage their company documents" ON company_documents FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company ai reports" ON ai_reports FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company audit logs" ON audit_logs FOR ALL USING (is_company_member(company_id));
