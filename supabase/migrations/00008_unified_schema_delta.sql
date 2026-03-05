-- ============================================================================
-- ZIEN Platform - Unified Schema Delta (Core Identity + Modules + Blueprints)
-- Migration: 00008_unified_schema_delta.sql
-- Date: 2026-02-25
-- Description: Align core tables with ZIEN Master Blueprint (sections 4.1–4.4)
-- ============================================================================

-- 1) Extend enums to cover richer company roles
DO $$ BEGIN
    ALTER TYPE company_role ADD VALUE IF NOT EXISTS 'assistant_gm';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE company_role ADD VALUE IF NOT EXISTS 'senior_employee';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE company_role ADD VALUE IF NOT EXISTS 'trainee';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE company_role ADD VALUE IF NOT EXISTS 'new_hire';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE company_role ADD VALUE IF NOT EXISTS 'field_employee';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE company_role ADD VALUE IF NOT EXISTS 'driver';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE company_role ADD VALUE IF NOT EXISTS 'sales_rep';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE company_role ADD VALUE IF NOT EXISTS 'accountant';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE company_role ADD VALUE IF NOT EXISTS 'hr_officer';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- NOTE: platform_role already covers founder/platform_admin/platform_support;
-- additional platform_ops/platform_finance can be modeled via permissions.


-- 2) Core identity tables (profiles, companies, company_members, departments)

-- profiles: add locale for 15-language i18n
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS locale TEXT;

-- companies: add industry_code, business_size, provisioning_status
ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS industry_code TEXT,
    ADD COLUMN IF NOT EXISTS business_size TEXT,
    ADD COLUMN IF NOT EXISTS provisioning_status TEXT
        DEFAULT 'draft'
        CHECK (provisioning_status IN ('draft', 'provisioning', 'active', 'suspended'));

-- company_members: invited_by + updated_at for better auditability
ALTER TABLE company_members
    ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- departments: updated_at to align with blueprint
ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- 3) Modules catalog and company_modules

-- modules_catalog: add is_core / requires_subscription / default_config
ALTER TABLE modules_catalog
    ADD COLUMN IF NOT EXISTS is_core BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS requires_subscription BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS default_config JSONB DEFAULT '{}'::jsonb;

-- company_modules: add status / source / enabled_by
ALTER TABLE company_modules
    ADD COLUMN IF NOT EXISTS status TEXT
        DEFAULT 'enabled'
        CHECK (status IN ('enabled', 'disabled', 'trial', 'pending_setup')),
    ADD COLUMN IF NOT EXISTS source TEXT
        DEFAULT 'provisioning'
        CHECK (source IN ('provisioning', 'manual', 'integration')),
    ADD COLUMN IF NOT EXISTS enabled_by UUID REFERENCES auth.users(id);


-- 4) Blueprints and blueprint_modules

-- blueprints: add code, localized names, industry_code, business_size
ALTER TABLE blueprints
    ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS name_ar TEXT,
    ADD COLUMN IF NOT EXISTS name_en TEXT,
    ADD COLUMN IF NOT EXISTS industry_code TEXT,
    ADD COLUMN IF NOT EXISTS business_size TEXT;

-- blueprint_modules: add default_enabled and sort_order
ALTER TABLE blueprint_modules
    ADD COLUMN IF NOT EXISTS default_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- ai_usage_logs: add action classification and sensitivity flag
ALTER TABLE ai_usage_logs
    ADD COLUMN IF NOT EXISTS action_level TEXT DEFAULT 'read_only',
    ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_sensitive
    ON ai_usage_logs(company_id, is_sensitive) WHERE is_sensitive = true;

-- ============================================================================
-- End of unified schema delta (core slice)
-- ============================================================================
