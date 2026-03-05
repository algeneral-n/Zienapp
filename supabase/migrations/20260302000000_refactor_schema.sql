-- ZIEN Platform Initial Schema

-- 1. Catalog Tables (Definitions)
CREATE TABLE IF NOT EXISTS company_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    dependencies TEXT[], -- Array of module codes
    tier TEXT DEFAULT 'core', -- 'core', 'addon', 'premium'
    category TEXT, -- 'accounting', 'hr', 'crm', 'store', 'ai', 'logistics', etc.
    is_core BOOLEAN DEFAULT FALSE,
    is_paid_addon BOOLEAN DEFAULT FALSE,
    base_price_monthly NUMERIC DEFAULT 0,
    base_price_yearly NUMERIC DEFAULT 0,
    requires_subscription BOOLEAN DEFAULT FALSE,
    requires_integrations TEXT[],
    billing_model TEXT DEFAULT 'flat', -- 'flat', 'usage', 'per_user'
    provisioning_behavior TEXT DEFAULT 'auto', -- 'auto', 'manual'
    role_scope TEXT[],
    ai_agent_availability BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_type_id UUID REFERENCES company_types(id),
    name TEXT NOT NULL,
    version TEXT DEFAULT '1.0.0',
    rules_json JSONB DEFAULT '{}', -- Criteria for matching
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blueprint_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules_catalog(id),
    is_required BOOLEAN DEFAULT TRUE,
    default_config_json JSONB DEFAULT '{}',
    default_limits_json JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS seed_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    kind TEXT NOT NULL, -- 'roles', 'coa', 'tax', 'workflows', 'demo_data'
    payload_json JSONB NOT NULL,
    version TEXT DEFAULT '1.0.0',
    checksum TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blueprint_seed_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
    seed_pack_id UUID REFERENCES seed_packs(id),
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS integrations_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    is_paid_addon BOOLEAN DEFAULT FALSE,
    base_price_monthly NUMERIC DEFAULT 0,
    base_price_yearly NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blueprint_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations_catalog(id),
    is_required BOOLEAN DEFAULT FALSE,
    is_recommended BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY, -- 'free', 'starter', 'pro', 'business', 'enterprise'
    name TEXT NOT NULL,
    price_monthly NUMERIC NOT NULL,
    price_yearly NUMERIC NOT NULL,
    max_users INTEGER,
    usage_limit_per_service INTEGER,
    features JSONB
);

CREATE TABLE IF NOT EXISTS plan_module_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id TEXT REFERENCES subscription_plans(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules_catalog(id),
    max_limit INTEGER,
    is_included BOOLEAN DEFAULT TRUE
);

-- 2. Runtime Tables (Companies & Execution)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company_type_id UUID REFERENCES company_types(id),
    country TEXT NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'provisioning', -- 'active', 'suspended', 'provisioning', 'error'
    logo_url TEXT,
    business_license_url TEXT,
    responsible_person_id_url TEXT,
    created_by UUID, -- Link to auth.users
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE platform_role AS ENUM ('founder', 'tenant_user');
CREATE TYPE company_role AS ENUM ('company_gm', 'executive_secretary', 'department_manager', 'supervisor', 'employee', 'client_user');

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    platform_role platform_role DEFAULT 'tenant_user',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role company_role NOT NULL,
    department_id UUID, -- Optional link to department
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, user_id)
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    manager_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules_catalog(id),
    status TEXT DEFAULT 'enabled', -- 'enabled', 'disabled', 'provisioning', 'error'
    config_json JSONB DEFAULT '{}',
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, module_id)
);

CREATE TABLE IF NOT EXISTS company_module_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules_catalog(id),
    settings_json JSONB DEFAULT '{}',
    limits_json JSONB DEFAULT '{}',
    feature_flags JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, module_id)
);

CREATE TABLE IF NOT EXISTS company_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations_catalog(id),
    status TEXT DEFAULT 'active',
    config_json JSONB DEFAULT '{}',
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, integration_id)
);

CREATE TABLE IF NOT EXISTS company_seed_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    seed_pack_id UUID REFERENCES seed_packs(id),
    blueprint_id UUID REFERENCES blueprints(id),
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'success',
    logs TEXT[]
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE PRIMARY KEY,
    plan_id TEXT REFERENCES subscription_plans(id),
    status TEXT NOT NULL, -- 'active', 'past_due', 'canceled'
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_usage_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules_catalog(id),
    usage_count INTEGER DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    UNIQUE(company_id, module_id, period_start)
);

CREATE TABLE IF NOT EXISTS provisioning_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES blueprints(id),
    status TEXT DEFAULT 'queued', -- 'queued', 'running', 'done', 'error'
    current_step TEXT,
    logs TEXT[],
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provisioning_job_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES provisioning_jobs(id) ON DELETE CASCADE,
    step_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'running', 'success', 'error'
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT,
    attempt_no INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Operational Tables (Tenant Scoped)

-- HR: Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ NOT NULL,
    check_out TIMESTAMPTZ,
    location_lat NUMERIC,
    location_lng NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounting: Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID, -- Link to clients table
    invoice_number TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    tax NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue'
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CRM: Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_module_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_seed_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE provisioning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE provisioning_job_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION is_founder() RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT platform_role FROM profiles WHERE id = auth.uid()) = 'founder';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_company_member(cid UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM company_members WHERE company_id = cid AND user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_company_admin(cid UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM company_members WHERE company_id = cid AND user_id = auth.uid() AND role = 'company_gm');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_company_role(cid UUID, required_role company_role) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM company_members WHERE company_id = cid AND user_id = auth.uid() AND role = required_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for Companies
CREATE POLICY "Founders can see all companies" ON companies FOR ALL USING (is_founder());
CREATE POLICY "Members can see their own company" ON companies FOR SELECT USING (is_company_member(id));
CREATE POLICY "GMs can update their own company" ON companies FOR UPDATE USING (is_company_admin(id));

-- Policies for Company Members
CREATE POLICY "Founders can see all members" ON company_members FOR ALL USING (is_founder());
CREATE POLICY "Members can see members of their company" ON company_members FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "GMs can manage members of their company" ON company_members FOR ALL USING (is_company_admin(company_id));

-- Policies for Company Modules
CREATE POLICY "Founders can see all company modules" ON company_modules FOR ALL USING (is_founder());
CREATE POLICY "Members can see modules of their company" ON company_modules FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "GMs can manage modules of their company" ON company_modules FOR ALL USING (is_company_admin(company_id));

-- Policies for Company Integrations
CREATE POLICY "Founders can see all company integrations" ON company_integrations FOR ALL USING (is_founder());
CREATE POLICY "Members can see integrations of their company" ON company_integrations FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "GMs can manage integrations of their company" ON company_integrations FOR ALL USING (is_company_admin(company_id));

-- Policies for Invoices (Tenant Scoped)
CREATE POLICY "Founders can see all invoices" ON invoices FOR ALL USING (is_founder());
CREATE POLICY "Tenant members can see company invoices" ON invoices FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "GMs can manage invoices" ON invoices FOR ALL USING (is_company_admin(company_id));

-- Policies for Clients (Tenant Scoped)
CREATE POLICY "Founders can see all clients" ON clients FOR ALL USING (is_founder());
CREATE POLICY "Tenant members can see company clients" ON clients FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "GMs can manage clients" ON clients FOR ALL USING (is_company_admin(company_id));

-- Policies for Attendance (Tenant Scoped)
CREATE POLICY "Founders can see all attendance" ON attendance FOR ALL USING (is_founder());
CREATE POLICY "Users can see their own attendance" ON attendance FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "GMs can see all company attendance" ON attendance FOR SELECT USING (is_company_admin(company_id));
CREATE POLICY "Users can insert their own attendance" ON attendance FOR INSERT WITH CHECK (user_id = auth.uid());

-- Seed Data
INSERT INTO subscription_plans (id, name, price_monthly, price_yearly, max_users, usage_limit_per_service) VALUES
('free', 'Free', 0, 0, 3, 3),
('starter', 'Starter', 59, 590, 15, 12),
('pro', 'Pro', 159, 1590, 20, 25),
('business', 'Business', 499, 4990, 50, 40),
('enterprise', 'Enterprise', 0, 0, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO modules_catalog (code, title_ar, title_en, tier, category, is_core) VALUES
('accounting', 'المحاسبة والفواتير', 'Accounting & Invoices', 'core', 'accounting', true),
('crm', 'المبيعات وإدارة العملاء', 'Sales & CRM', 'core', 'crm', true),
('hr', 'الموارد البشرية', 'Human Resources', 'core', 'hr', true),
('fleet', 'الأسطول والخدمات اللوجستية', 'Fleet & Logistics', 'addon', 'logistics', false),
('meetings', 'الاجتماعات والمحادثات', 'Meetings & Chat', 'core', 'communication', true),
('admin', 'المهام الإدارية', 'Admin Tasks', 'core', 'admin', true),
('store', 'متجر الشركة', 'Company Store', 'addon', 'store', false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO integrations_catalog (code, name, category, is_paid_addon) VALUES
('stripe', 'Stripe Payments', 'payments', false),
('vonage', 'Vonage Video Meetings', 'communication', true),
('google_maps', 'Google Maps', 'maps', true),
('openai', 'OpenAI', 'ai', true)
ON CONFLICT (code) DO NOTHING;
