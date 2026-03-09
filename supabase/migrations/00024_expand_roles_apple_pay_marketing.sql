-- Migration 00024: Expand roles, add company_modules, Apple Pay, marketing, voice, AI memory
-- ZIEN Platform - Tenant Isolation + Feature Expansion

-- ============================================================
-- 1. EXPAND company_members role_code CHECK CONSTRAINT
-- Add all 22 roles from permissions.ts
-- ============================================================
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_role_code_check;
ALTER TABLE company_members ADD CONSTRAINT company_members_role_code_check 
  CHECK (role_code IN (
    'company_gm', 'assistant_gm', 'executive_secretary',
    'department_manager', 'hr_officer', 'accountant',
    'supervisor', 'senior_employee', 'sales_rep',
    'employee', 'field_employee', 'driver',
    'new_hire', 'trainee', 'client_user'
  ));

-- ============================================================
-- 2. COMPANY_MODULES table (referenced in code but missing)
-- ============================================================
CREATE TABLE IF NOT EXISTS company_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules_catalog(id),
    is_active BOOLEAN DEFAULT true,
    activated_at TIMESTAMPTZ DEFAULT now(),
    deactivated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, module_id)
);

ALTER TABLE company_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_modules_tenant" ON company_modules FOR ALL 
  USING (is_company_member(company_id));

-- ============================================================
-- 3. PROVISIONING_JOBS table
-- ============================================================
CREATE TABLE IF NOT EXISTS provisioning_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'error', 'cancelled')),
    total_steps INTEGER DEFAULT 5,
    completed_steps INTEGER DEFAULT 0,
    current_step TEXT DEFAULT 'init',
    error_message TEXT,
    config JSONB DEFAULT '{}',
    idempotency_key TEXT UNIQUE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE provisioning_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provisioning_jobs_founder" ON provisioning_jobs FOR ALL 
  USING (is_founder() OR is_company_member(company_id));

-- ============================================================
-- 4. COMPANY_SUBSCRIPTIONS table (code references this name)
-- ============================================================
CREATE TABLE IF NOT EXISTS company_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_code TEXT NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing', 'paused', 'expired')),
    gateway TEXT DEFAULT 'stripe' CHECK (gateway IN ('stripe', 'network_international', 'tilr', 'apple_pay', 'manual')),
    gateway_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, gateway)
);

ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_subscriptions_tenant" ON company_subscriptions FOR ALL 
  USING (is_founder() OR is_company_member(company_id));

-- ============================================================
-- 5. PAYMENT_EVENTS table (audit trail for all payments)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    gateway TEXT NOT NULL,
    event_type TEXT NOT NULL,
    gateway_event_id TEXT,
    amount NUMERIC,
    currency TEXT DEFAULT 'AED',
    status TEXT,
    metadata JSONB DEFAULT '{}',
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_events_access" ON payment_events FOR ALL 
  USING (is_founder() OR is_company_member(company_id));

-- ============================================================
-- 6. APPLE PAY domain verification + merchant session
-- ============================================================
CREATE TABLE IF NOT EXISTS apple_pay_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    merchant_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    session_data JSONB,
    validation_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- ============================================================
-- 7. MARKETING CAMPAIGNS (real backend)
-- ============================================================
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push', 'whatsapp', 'multi_channel')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'completed')),
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    template_id UUID,
    audience_filter JSONB DEFAULT '{}',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    total_recipients INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    total_unsubscribed INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_campaigns_tenant" ON marketing_campaigns FOR ALL 
  USING (is_founder() OR is_company_member(company_id));

CREATE TABLE IF NOT EXISTS marketing_audience_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    filter_rules JSONB NOT NULL DEFAULT '{}',
    member_count INTEGER DEFAULT 0,
    is_dynamic BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_audience_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_segments_tenant" ON marketing_audience_segments FOR ALL 
  USING (is_founder() OR is_company_member(company_id));

CREATE TABLE IF NOT EXISTS marketing_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB DEFAULT '[]',
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_templates_tenant" ON marketing_email_templates FOR ALL 
  USING (is_founder() OR is_company_member(company_id));

-- ============================================================
-- 8. VOICE AUTOMATION tables
-- ============================================================
CREATE TABLE IF NOT EXISTS voice_agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    agent_name TEXT DEFAULT 'RARE Voice',
    voice_id TEXT DEFAULT '6ZVgc4q9LWAloWbuwjuu',
    language TEXT DEFAULT 'ar',
    greeting_text TEXT,
    system_prompt TEXT,
    max_call_duration INTEGER DEFAULT 300,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id)
);

ALTER TABLE voice_agent_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_configs_tenant" ON voice_agent_configs FOR ALL 
  USING (is_founder() OR is_company_member(company_id));

CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    caller_id TEXT,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    status TEXT CHECK (status IN ('ringing', 'answered', 'completed', 'missed', 'failed', 'voicemail')),
    duration_seconds INTEGER DEFAULT 0,
    transcript TEXT,
    sentiment TEXT,
    ai_summary TEXT,
    recording_url TEXT,
    agent_config_id UUID REFERENCES voice_agent_configs(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_logs_tenant" ON call_logs FOR ALL 
  USING (is_founder() OR is_company_member(company_id));

-- ============================================================
-- 9. AI CONVERSATION MEMORY
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    agent_type TEXT DEFAULT 'general',
    title TEXT,
    messages JSONB DEFAULT '[]',
    token_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_conversations_owner" ON ai_conversations FOR ALL 
  USING (user_id = auth.uid() OR is_founder());

CREATE TABLE IF NOT EXISTS ai_agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL,
    custom_prompt TEXT,
    allowed_actions JSONB DEFAULT '[]',
    model_override TEXT,
    temperature NUMERIC DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, agent_type)
);

ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_agent_configs_tenant" ON ai_agent_configs FOR ALL 
  USING (is_founder() OR is_company_member(company_id));

-- ============================================================
-- 10. INTEGRATION PRICING RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS integration_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_code TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('setup_fee', 'monthly', 'yearly', 'per_usage', 'per_seat', 'webhook')),
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'AED',
    unit_label TEXT,
    min_quantity INTEGER DEFAULT 0,
    max_quantity INTEGER,
    tier_name TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    integration_code TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
    config JSONB DEFAULT '{}',
    pricing_rule_id UUID REFERENCES integration_pricing_rules(id),
    activated_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, integration_code)
);

ALTER TABLE company_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_integrations_tenant" ON company_integrations FOR ALL 
  USING (is_founder() OR is_company_member(company_id));

-- ============================================================
-- 11. PROFILES TABLE (needed by AuthContext, missing from schema)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    platform_role TEXT DEFAULT 'user' CHECK (platform_role IN ('founder', 'platform_admin', 'platform_support', 'user')),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON profiles FOR ALL 
  USING (id = auth.uid() OR is_founder());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, platform_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'platform_role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 12. PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_company_modules_company ON company_modules(company_id);
CREATE INDEX IF NOT EXISTS idx_company_modules_module ON company_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_company ON attendance(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_company ON leave_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_company ON ai_usage_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_company ON payment_events(company_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_company ON marketing_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_company ON call_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_company ON ai_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_company ON provisioning_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company ON company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);

-- Done: Migration 00024
