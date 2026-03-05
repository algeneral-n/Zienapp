-- ============================================================================
-- ZIEN Platform - Unified Database Schema
-- Migration: 00001_unified_schema.sql
-- Date: 2026-02-24
-- Description: Single source of truth merging all project schemas
-- ============================================================================

-- =========================
-- 0. EXTENSIONS & ENUMS
-- =========================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Company lifecycle
DO $$ BEGIN
    CREATE TYPE company_status AS ENUM (
        'pending_review', 'active', 'restricted', 'suspended', 'rejected'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Platform-level role
DO $$ BEGIN
    CREATE TYPE platform_role AS ENUM (
        'founder', 'platform_admin', 'platform_support', 'tenant_user'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Company-level role
DO $$ BEGIN
    CREATE TYPE company_role AS ENUM (
        'company_gm', 'executive_secretary', 'department_manager',
        'supervisor', 'employee', 'client_user'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Module pricing tier
DO $$ BEGIN
    CREATE TYPE module_tier AS ENUM ('core', 'addon', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Provisioning job lifecycle
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM (
        'pending', 'validating', 'applying_modules', 'seeding',
        'finalizing', 'completed', 'failed', 'rolled_back'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed pack categories
DO $$ BEGIN
    CREATE TYPE seed_kind AS ENUM (
        'roles', 'chart_of_accounts', 'tax_config', 'workflows', 'demo_data'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Billing interval
DO $$ BEGIN
    CREATE TYPE billing_interval AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Subscription status
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM (
        'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'pending_approval'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Member status
DO $$ BEGIN
    CREATE TYPE member_status AS ENUM ('invited', 'active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =========================
-- 1. PLATFORM LAYER
-- =========================

-- User profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    platform_role platform_role DEFAULT 'tenant_user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Module registry
CREATE TABLE IF NOT EXISTS modules_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon TEXT,
    tier module_tier NOT NULL DEFAULT 'core',
    dependencies JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Business archetypes
CREATE TABLE IF NOT EXISTS company_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Default modules per company type
CREATE TABLE IF NOT EXISTS company_type_template_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_type_id UUID NOT NULL REFERENCES company_types(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules_catalog(id) ON DELETE CASCADE,
    is_default_enabled BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_type_id, module_id)
);

-- =========================
-- 2. COMPANY CORE
-- =========================

-- Main tenant table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    slug TEXT UNIQUE NOT NULL,
    company_type_id UUID REFERENCES company_types(id),
    industry TEXT,
    status company_status DEFAULT 'pending_review',
    -- Contact
    country_code TEXT DEFAULT 'AE',
    city TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    -- Config
    timezone TEXT DEFAULT 'Asia/Dubai',
    currency_code TEXT DEFAULT 'AED',
    tax_mode TEXT DEFAULT 'country_default',
    -- Branding
    logo_url TEXT,
    business_license_url TEXT,
    responsible_person_id_url TEXT,
    branding_theme TEXT DEFAULT 'prism',
    branding_mode TEXT DEFAULT 'system',
    branding JSONB DEFAULT '{}',
    -- Ownership
    owner_user_id UUID NOT NULL REFERENCES auth.users(id),
    -- Settings
    settings JSONB DEFAULT '{}',
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Company members (multi-company per user)
CREATE TABLE IF NOT EXISTS company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role company_role NOT NULL DEFAULT 'employee',
    department_id UUID,
    branch_id UUID,
    status member_status DEFAULT 'active',
    is_primary BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, user_id)
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code TEXT,
    name TEXT NOT NULL,
    manager_id UUID REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);

-- Add FK from company_members.department_id to departments
ALTER TABLE company_members
    ADD CONSTRAINT fk_company_members_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL;

-- =========================
-- 3. PROVISIONING ENGINE
-- =========================

-- Blueprint templates per company type
CREATE TABLE IF NOT EXISTS blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_type_id UUID NOT NULL REFERENCES company_types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    version TEXT DEFAULT '1.0.0',
    rules_json JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Modules linked to blueprints
CREATE TABLE IF NOT EXISTS blueprint_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules_catalog(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true,
    default_config_json JSONB DEFAULT '{}',
    default_limits_json JSONB DEFAULT '{}',
    UNIQUE(blueprint_id, module_id)
);

-- Seed data packs
CREATE TABLE IF NOT EXISTS seed_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    kind seed_kind NOT NULL,
    description TEXT,
    payload_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ordered seed packs per blueprint
CREATE TABLE IF NOT EXISTS blueprint_seed_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    seed_pack_id UUID NOT NULL REFERENCES seed_packs(id) ON DELETE CASCADE,
    apply_order INTEGER DEFAULT 0,
    UNIQUE(blueprint_id, seed_pack_id)
);

-- Provisioning job queue
CREATE TABLE IF NOT EXISTS provisioning_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES blueprints(id),
    status job_status DEFAULT 'pending',
    current_step TEXT,
    step_index INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 1,
    logs TEXT[] DEFAULT '{}',
    error_message TEXT,
    idempotency_key TEXT UNIQUE,
    snapshot JSONB DEFAULT '{}',
    requested_by UUID REFERENCES auth.users(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- 4. COMPANY MODULES
-- =========================

-- Active modules per company
CREATE TABLE IF NOT EXISTS company_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules_catalog(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    activated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, module_id)
);

-- =========================
-- 5. BILLING
-- =========================

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    price_monthly NUMERIC NOT NULL DEFAULT 0,
    price_yearly NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'AED',
    billing_interval billing_interval DEFAULT 'monthly',
    max_users INTEGER,
    max_usage_per_service INTEGER,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Company subscriptions (Stripe binding)
CREATE TABLE IF NOT EXISTS company_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status subscription_status DEFAULT 'pending_approval',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- 6. BUSINESS MODULES
-- =========================

-- CRM: Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounting: Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    total_amount NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    issued_at TIMESTAMPTZ DEFAULT now(),
    due_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounting: Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounting: Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT,
    payment_date TIMESTAMPTZ DEFAULT now(),
    reference_number TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounting: Tax settings
CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL,
    tax_name TEXT NOT NULL,
    tax_rate NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- HR: Employees
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    member_id UUID UNIQUE REFERENCES company_members(id) ON DELETE CASCADE,
    employee_code TEXT,
    job_title TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    hire_date DATE,
    salary_amount NUMERIC,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- HR: Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day')),
    location_lat NUMERIC,
    location_lng NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- HR: Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES company_members(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- HR: Payroll
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
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

-- Logistics: Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plate_number TEXT NOT NULL,
    model TEXT,
    type TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Logistics: Tasks
CREATE TABLE IF NOT EXISTS logistics_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES company_members(id),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    pickup_location TEXT,
    delivery_location TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled')),
    tracking_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CRM: Quotes
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    quote_number TEXT NOT NULL,
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    valid_until DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CRM: Contracts
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    start_date DATE,
    end_date DATE,
    value NUMERIC,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'terminated')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    budget NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Communication: Meetings
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES company_members(id),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    meeting_link TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Communication: Chats
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES company_members(id),
    receiver_id UUID REFERENCES company_members(id),
    group_id UUID,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- 7. ONBOARDING & DOCUMENTS
-- =========================

-- Company onboarding submissions (KYC)
CREATE TABLE IF NOT EXISTS company_onboarding_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    company_name_ar TEXT,
    company_type_id UUID REFERENCES company_types(id),
    industry TEXT,
    gm_name TEXT,
    gm_email TEXT,
    gm_phone TEXT,
    business_license_url TEXT,
    gm_id_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    submitted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Company documents
CREATE TABLE IF NOT EXISTS company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    category TEXT,
    file_type TEXT,
    file_size INTEGER,
    expiry_date DATE,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- 8. AI & AUDIT
-- =========================

-- AI usage tracking
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    agent_type TEXT NOT NULL,
    mode TEXT,
    module_code TEXT,
    model_name TEXT,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    query_text TEXT,
    response_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- AI generated reports
CREATE TABLE IF NOT EXISTS ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL,
    module_code TEXT,
    report_type TEXT,
    content JSONB,
    generated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- System-wide audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- 9. RBAC & FEATURE FLAGS
-- =========================

-- Permission registry
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT,
    name_en TEXT NOT NULL,
    description TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Role-permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role company_role NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(role, permission_id)
);

-- Per-company feature toggles
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    flag_key TEXT NOT NULL,
    enabled BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, flag_key)
);

-- =========================
-- 10. INDEXES
-- =========================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_platform_role ON profiles(platform_role);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(company_type_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_role ON company_members(role);
CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_modules_company ON company_modules(company_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_company ON provisioning_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_status ON provisioning_jobs(status);
CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_idempotency ON provisioning_jobs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_stripe ON company_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_member ON employees(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_company ON attendance(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_company ON leave_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_company ON payroll(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_company ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_logistics_tasks_company ON logistics_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_company ON quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_company ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_meetings_company ON meetings(company_id);
CREATE INDEX IF NOT EXISTS idx_chats_company ON chats(company_id);
CREATE INDEX IF NOT EXISTS idx_chats_sender ON chats(sender_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_company ON ai_usage_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_company ON feature_flags(company_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- =========================
-- 11. AUTO-UPDATE TRIGGERS
-- =========================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_subscriptions_updated_at
    BEFORE UPDATE ON company_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blueprints_updated_at
    BEFORE UPDATE ON blueprints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provisioning_jobs_updated_at
    BEFORE UPDATE ON provisioning_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- 12. AUTO-CREATE PROFILE ON AUTH SIGNUP
-- =========================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
