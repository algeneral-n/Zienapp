-- Migration 00014: Founder / Platform Admin Tables
-- Supports the super-admin control plane for platform-wide oversight

-- ─── Platform Audit Log ─────────────────────────────────────────────────────
-- Separate from tenant-level audit_log; tracks founder/platform actions
CREATE TABLE IF NOT EXISTS platform_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT, -- 'tenant', 'subscription', 'policy', 'system'
    target_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_platform_audit_actor ON platform_audit_log(actor_id);
CREATE INDEX idx_platform_audit_action ON platform_audit_log(action);
CREATE INDEX idx_platform_audit_created ON platform_audit_log(created_at DESC);

-- ─── AI Policies ────────────────────────────────────────────────────────────
-- Platform-wide AI governance rules that apply to all tenants
CREATE TABLE IF NOT EXISTS ai_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    policy_type TEXT NOT NULL, -- 'rate_limit', 'content_filter', 'model_access', 'cost_cap'
    rules JSONB NOT NULL DEFAULT '{}',
    applies_to TEXT DEFAULT 'all', -- 'all', 'plan:<code>', 'company:<id>'
    is_active BOOLEAN DEFAULT true,
    priority INT DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_policies_type ON ai_policies(policy_type);
CREATE INDEX idx_ai_policies_active ON ai_policies(is_active) WHERE is_active = true;

-- ─── Platform Announcements ──────────────────────────────────────────────────
-- System-wide announcements visible to all tenants
CREATE TABLE IF NOT EXISTS platform_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_ar TEXT,
    body_en TEXT NOT NULL,
    body_ar TEXT,
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical', 'maintenance'
    target_audience TEXT DEFAULT 'all', -- 'all', 'plan:<code>', 'company:<id>'
    starts_at TIMESTAMPTZ DEFAULT now(),
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_announcements_active ON platform_announcements(is_active, starts_at, ends_at);

-- ─── Feature Flags ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INT DEFAULT 0, -- 0-100 for gradual rollout
    target_plans TEXT[] DEFAULT '{}', -- empty = all plans
    target_companies UUID[] DEFAULT '{}', -- empty = all companies
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_feature_flags_key ON feature_flags(flag_key);

-- ─── Platform Config ────────────────────────────────────────────────────────
-- Key-value store for platform-wide configuration
CREATE TABLE IF NOT EXISTS platform_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Founder Users ──────────────────────────────────────────────────────────
-- Tracks which users have platform-admin privileges
CREATE TABLE IF NOT EXISTS platform_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT NOT NULL DEFAULT 'admin', -- 'super_admin', 'admin', 'viewer'
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- ─── RLS Policies ────────────────────────────────────────────────────────────
ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Platform admins can read everything
CREATE POLICY platform_audit_log_read ON platform_audit_log
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM platform_admins WHERE is_active = true)
    );

CREATE POLICY ai_policies_read ON ai_policies
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM platform_admins WHERE is_active = true)
    );

CREATE POLICY ai_policies_write ON ai_policies
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM platform_admins WHERE is_active = true AND role IN ('super_admin', 'admin'))
    );

CREATE POLICY platform_announcements_read ON platform_announcements
    FOR SELECT USING (true); -- all authenticated users can read announcements

CREATE POLICY platform_announcements_write ON platform_announcements
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM platform_admins WHERE is_active = true AND role IN ('super_admin', 'admin'))
    );

CREATE POLICY feature_flags_read ON feature_flags
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM platform_admins WHERE is_active = true)
    );

CREATE POLICY feature_flags_write ON feature_flags
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM platform_admins WHERE is_active = true AND role = 'super_admin')
    );

CREATE POLICY platform_config_read ON platform_config
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM platform_admins WHERE is_active = true)
    );

CREATE POLICY platform_config_write ON platform_config
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM platform_admins WHERE is_active = true AND role = 'super_admin')
    );

CREATE POLICY platform_admins_read ON platform_admins
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM platform_admins WHERE is_active = true)
    );

CREATE POLICY platform_admins_write ON platform_admins
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM platform_admins WHERE is_active = true AND role = 'super_admin')
    );
