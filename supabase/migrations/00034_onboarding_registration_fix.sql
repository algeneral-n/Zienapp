-- ============================================================================
-- Migration 00034: Onboarding & Registration Fix
-- Adds missing columns, registration_applications table, document verification
-- ============================================================================

-- ─── 1. Add missing columns to companies ────────────────────────────────────
ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS cr_number TEXT,
    ADD COLUMN IF NOT EXISTS tax_number TEXT;

-- ─── 2. Registration Applications (Founder Review Queue) ────────────────────
-- Auto-save draft data, Founder reviews before activation
CREATE TABLE IF NOT EXISTS registration_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Company data (saved progressively)
    company_name TEXT,
    company_name_ar TEXT,
    industry_code TEXT,
    country TEXT DEFAULT 'AE',
    city TEXT,
    employee_count TEXT,
    cr_number TEXT,
    -- GM data
    gm_name TEXT,
    gm_email TEXT,
    gm_phone TEXT,
    -- Modules & Plan
    selected_modules TEXT[] DEFAULT '{}',
    plan_code TEXT,
    billing_cycle TEXT DEFAULT 'monthly',
    -- Documents
    license_file_url TEXT,
    id_file_url TEXT,
    license_verified BOOLEAN DEFAULT false,
    id_verified BOOLEAN DEFAULT false,
    license_verification_result JSONB DEFAULT '{}',
    id_verification_result JSONB DEFAULT '{}',
    -- Status
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','submitted','under_review','approved','rejected','provisioning','active')),
    step_completed INTEGER DEFAULT 0,
    -- Founder review
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    -- After approval
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES auth.users(id),
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg_app_status ON registration_applications (status);
CREATE INDEX IF NOT EXISTS idx_reg_app_email ON registration_applications (gm_email);

-- RLS: Public can insert (draft), service role manages all
ALTER TABLE registration_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reg_app_insert_public"
    ON registration_applications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "reg_app_select_own"
    ON registration_applications FOR SELECT
    USING (gm_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "reg_app_update_own_draft"
    ON registration_applications FOR UPDATE
    USING (status = 'draft')
    WITH CHECK (status IN ('draft', 'submitted'));

CREATE POLICY "reg_app_service_all"
    ON registration_applications FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_reg_app_timestamp()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reg_app_updated
    BEFORE UPDATE ON registration_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_reg_app_timestamp();

-- ─── 3. Ensure subscription_plans has is_active column ──────────────────────
-- Already exists in schema, just ensure seed data is active
UPDATE subscription_plans SET is_active = true WHERE is_active IS NULL;
