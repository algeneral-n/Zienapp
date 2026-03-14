-- ============================================================================
-- Migration 00035: Integration Payments
-- Tracks payment records for paid integrations before activation
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations_catalog(id),
    integration_code TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'AED',
    pricing_model TEXT NOT NULL DEFAULT 'free',
    pricing_tier TEXT,
    stripe_payment_intent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','paid','failed','refunded')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intg_pay_company ON integration_payments (company_id);
CREATE INDEX IF NOT EXISTS idx_intg_pay_code ON integration_payments (integration_code);
CREATE INDEX IF NOT EXISTS idx_intg_pay_stripe ON integration_payments (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

ALTER TABLE integration_payments ENABLE ROW LEVEL SECURITY;

-- Company members can view their own payments
CREATE POLICY "intg_pay_select_member"
    ON integration_payments FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid() AND status = 'active'
    ));

-- Service role manages all
CREATE POLICY "intg_pay_service_all"
    ON integration_payments FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Trigger: updated_at
CREATE TRIGGER trg_intg_pay_updated
    BEFORE UPDATE ON integration_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_reg_app_timestamp();
