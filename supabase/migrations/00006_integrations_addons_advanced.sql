-- ============================================================================
-- ZIEN Platform - Integrations & Add-ons Advanced Schema
-- Migration: 00006_integrations_addons_advanced.sql
-- Date: 2026-02-25
-- Description: Advanced fields for usage billing, marketplace, and transactions
-- ============================================================================

-- Add advanced fields to integration_usage_logs
ALTER TABLE integration_usage_logs
    ADD COLUMN IF NOT EXISTS usage_cost NUMERIC,
    ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS external_reference TEXT,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add advanced fields to integrations_catalog
ALTER TABLE integrations_catalog
    ADD COLUMN IF NOT EXISTS commission_rate NUMERIC,
    ADD COLUMN IF NOT EXISTS min_usage NUMERIC,
    ADD COLUMN IF NOT EXISTS max_usage NUMERIC,
    ADD COLUMN IF NOT EXISTS tiered_pricing JSONB,
    ADD COLUMN IF NOT EXISTS marketplace_url TEXT;

-- Add advanced fields to integration_billing_map
ALTER TABLE integration_billing_map
    ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
    ADD COLUMN IF NOT EXISTS invoice_status TEXT,
    ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- Create marketplace_transactions table
CREATE TABLE IF NOT EXISTS marketplace_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES integrations_catalog(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'AED',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);
