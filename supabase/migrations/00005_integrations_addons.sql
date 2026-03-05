-- ============================================================================
-- ZIEN Platform - Integrations & Add-ons Schema
-- Migration: 00005_integrations_addons.sql
-- Date: 2026-02-24
-- Description: Integrations marketplace, add-ons, usage billing
-- ============================================================================

-- Integrations catalog (marketplace)
CREATE TABLE IF NOT EXISTS integrations_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- payments, meetings, maps, storage, marketing, etc.
    description TEXT,
    provider TEXT, -- stripe, vonage, google, etc.
    pricing_model TEXT NOT NULL DEFAULT 'fixed', -- fixed, usage, commission, hybrid
    setup_mode TEXT NOT NULL DEFAULT 'self-connect', -- self-connect, admin-connect, managed-by-zien
    required_secrets JSONB DEFAULT '[]',
    required_plan TEXT,
    region_availability TEXT,
    webhook_support BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tenant integrations (enabled add-ons)
CREATE TABLE IF NOT EXISTS tenant_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES integrations_catalog(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    enabled_at TIMESTAMPTZ DEFAULT now(),
    disabled_at TIMESTAMPTZ,
    UNIQUE(company_id, integration_id)
);

-- Integration usage logs (for usage/commission billing)
CREATE TABLE IF NOT EXISTS integration_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES integrations_catalog(id) ON DELETE CASCADE,
    usage_type TEXT NOT NULL, -- e.g. 'video_minutes', 'api_calls', 'ad_spend'
    usage_amount NUMERIC NOT NULL,
    usage_unit TEXT,
    usage_period_start TIMESTAMPTZ,
    usage_period_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Integration billing map (maps usage to invoice/charge)
CREATE TABLE IF NOT EXISTS integration_billing_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usage_log_id UUID NOT NULL REFERENCES integration_usage_logs(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    charge_id TEXT,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'AED',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);
