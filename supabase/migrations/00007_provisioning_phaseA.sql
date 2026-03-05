-- ============================================================================
-- ZIEN Platform - Provisioning Engine Phase A
-- Migration: 00007_provisioning_phaseA.sql
-- Date: 2026-02-25
-- Description: Versioning, job steps, config snapshots, entitlements, seed ledger
-- ============================================================================

-- 1. Versioning for blueprints
ALTER TABLE blueprints
    ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 2. Versioning for seed_packs
ALTER TABLE seed_packs
    ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS checksum TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Config snapshots in provisioning_jobs
ALTER TABLE provisioning_jobs
    ADD COLUMN IF NOT EXISTS requested_config_json JSONB,
    ADD COLUMN IF NOT EXISTS resolved_config_json JSONB,
    ADD COLUMN IF NOT EXISTS blueprint_version INTEGER,
    ADD COLUMN IF NOT EXISTS seed_pack_versions_snapshot JSONB;

-- 4. Job steps table
CREATE TABLE IF NOT EXISTS provisioning_job_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES provisioning_jobs(id) ON DELETE CASCADE,
    step_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued', -- queued/running/done/error/skipped
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    attempt_no INTEGER DEFAULT 1,
    error_code TEXT,
    error_message TEXT,
    metadata_json JSONB DEFAULT '{}',
    UNIQUE(job_id, step_code, attempt_no)
);

-- 5. Plan module entitlements
CREATE TABLE IF NOT EXISTS plan_module_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_code TEXT NOT NULL,
    module_code TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT false,
    limits_json JSONB DEFAULT '{}',
    UNIQUE(plan_code, module_code)
);

-- 6. Company seed application ledger
CREATE TABLE IF NOT EXISTS company_seed_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    seed_pack_id UUID NOT NULL REFERENCES seed_packs(id) ON DELETE CASCADE,
    seed_pack_version INTEGER NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT now(),
    job_id UUID REFERENCES provisioning_jobs(id) ON DELETE SET NULL,
    UNIQUE(company_id, seed_pack_id, seed_pack_version)
);

-- ============================================================================
-- End of Phase A
-- ============================================================================
