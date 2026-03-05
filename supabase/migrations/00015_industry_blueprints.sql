-- ============================================================================
-- Migration 00015: Industry Blueprints
-- Multi-industry provisioning templates for the V2 provisioning engine
-- ============================================================================

-- ─── Table: industry_blueprints ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS industry_blueprints (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_code     TEXT UNIQUE NOT NULL,
  industry_name_en  TEXT NOT NULL,
  industry_name_ar  TEXT NOT NULL,
  recommended_modules TEXT[] NOT NULL DEFAULT '{}',
  default_plan      TEXT NOT NULL DEFAULT 'pro',
  default_settings  JSONB NOT NULL DEFAULT '{}',
  business_sizes    TEXT[] NOT NULL DEFAULT '{micro,small,medium,large,enterprise}',
  country_overrides JSONB NOT NULL DEFAULT '{}',
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for active lookup
CREATE INDEX IF NOT EXISTS idx_blueprints_active ON industry_blueprints (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_blueprints_code   ON industry_blueprints (industry_code);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE industry_blueprints ENABLE ROW LEVEL SECURITY;

-- Public read (anyone can see available blueprints during onboarding)
CREATE POLICY "blueprints_select_public"
  ON industry_blueprints FOR SELECT
  USING (is_active = true);

-- Only service role can insert/update/delete
CREATE POLICY "blueprints_manage_service"
  ON industry_blueprints FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── Trigger: updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_blueprint_timestamp()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_blueprint_updated
  BEFORE UPDATE ON industry_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_blueprint_timestamp();

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed Data: 5 core industries + 3 additional
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industry_blueprints (industry_code, industry_name_en, industry_name_ar, recommended_modules, default_plan, default_settings, business_sizes, country_overrides)
VALUES
-- ─── 1. Retail ───────────────────────────────────────────────────────────────
(
  'retail',
  'Retail & E-Commerce',
  'تجارة التجزئة والتجارة الإلكترونية',
  ARRAY['hr', 'crm', 'accounting', 'store', 'integrations', 'rare'],
  'pro',
  '{
    "pos_enabled": true,
    "inventory_tracking": true,
    "multi_location": false,
    "e_commerce_sync": true,
    "loyalty_program": true,
    "default_currency": "AED",
    "tax_rate": 5,
    "vat_enabled": true,
    "receipt_template": "retail_standard",
    "barcode_enabled": true
  }'::jsonb,
  ARRAY['micro', 'small', 'medium', 'large'],
  '{
    "UAE": { "vat_rate": 5, "currency": "AED", "payment_gateways": ["stripe", "ni"] },
    "SA": { "vat_rate": 15, "currency": "SAR", "payment_gateways": ["stripe", "tilr"] },
    "EG": { "vat_rate": 14, "currency": "EGP", "payment_gateways": ["stripe"] },
    "BH": { "vat_rate": 10, "currency": "BHD", "payment_gateways": ["stripe", "ni"] }
  }'::jsonb
),

-- ─── 2. Restaurant & F&B ────────────────────────────────────────────────────
(
  'restaurant',
  'Restaurant & Food Services',
  'المطاعم والخدمات الغذائية',
  ARRAY['hr', 'crm', 'accounting', 'store', 'integrations', 'rare'],
  'pro',
  '{
    "pos_enabled": true,
    "kitchen_display": true,
    "table_management": true,
    "delivery_integration": true,
    "menu_management": true,
    "ingredient_tracking": true,
    "waste_management": true,
    "default_currency": "AED",
    "tax_rate": 5,
    "vat_enabled": true,
    "tip_enabled": true,
    "receipt_template": "restaurant_standard"
  }'::jsonb,
  ARRAY['micro', 'small', 'medium', 'large'],
  '{
    "UAE": { "vat_rate": 5, "municipality_fee": 7, "tourism_fee": 0, "currency": "AED" },
    "SA": { "vat_rate": 15, "currency": "SAR" },
    "BH": { "vat_rate": 10, "currency": "BHD" },
    "KW": { "vat_rate": 0, "currency": "KWD" }
  }'::jsonb
),

-- ─── 3. Construction & Contracting ──────────────────────────────────────────
(
  'construction',
  'Construction & Contracting',
  'البناء والمقاولات',
  ARRAY['hr', 'crm', 'accounting', 'integrations', 'control_room', 'rare'],
  'business',
  '{
    "project_management": true,
    "site_tracking": true,
    "equipment_management": true,
    "subcontractor_management": true,
    "safety_compliance": true,
    "timesheet_tracking": true,
    "material_procurement": true,
    "progress_billing": true,
    "default_currency": "AED",
    "tax_rate": 5,
    "vat_enabled": true,
    "wps_enabled": true
  }'::jsonb,
  ARRAY['small', 'medium', 'large', 'enterprise'],
  '{
    "UAE": { "vat_rate": 5, "wps_required": true, "currency": "AED" },
    "SA": { "vat_rate": 15, "wps_required": true, "currency": "SAR" },
    "QA": { "vat_rate": 0, "wps_required": true, "currency": "QAR" },
    "OM": { "vat_rate": 5, "currency": "OMR" }
  }'::jsonb
),

-- ─── 4. Professional Services ───────────────────────────────────────────────
(
  'professional_services',
  'Professional Services & Consulting',
  'الخدمات المهنية والاستشارات',
  ARRAY['hr', 'crm', 'accounting', 'integrations', 'rare'],
  'pro',
  '{
    "time_tracking": true,
    "project_billing": true,
    "client_portal": true,
    "document_management": true,
    "proposal_generation": true,
    "contract_management": true,
    "expense_tracking": true,
    "utilization_reporting": true,
    "default_currency": "AED",
    "tax_rate": 5,
    "vat_enabled": true,
    "billable_rates_enabled": true
  }'::jsonb,
  ARRAY['micro', 'small', 'medium', 'large'],
  '{
    "UAE": { "vat_rate": 5, "currency": "AED", "free_zone_applicable": true },
    "SA": { "vat_rate": 15, "currency": "SAR" },
    "EG": { "vat_rate": 14, "currency": "EGP" },
    "BH": { "vat_rate": 10, "currency": "BHD" }
  }'::jsonb
),

-- ─── 5. Healthcare & Medical ────────────────────────────────────────────────
(
  'healthcare',
  'Healthcare & Medical Services',
  'الرعاية الصحية والخدمات الطبية',
  ARRAY['hr', 'crm', 'accounting', 'integrations', 'control_room', 'rare'],
  'business',
  '{
    "patient_management": true,
    "appointment_scheduling": true,
    "medical_records": true,
    "prescription_management": true,
    "lab_integration": true,
    "insurance_billing": true,
    "inventory_pharma": true,
    "compliance_hipaa": false,
    "compliance_haad": true,
    "default_currency": "AED",
    "tax_rate": 0,
    "vat_enabled": false,
    "dha_integration": true
  }'::jsonb,
  ARRAY['small', 'medium', 'large', 'enterprise'],
  '{
    "UAE": { "vat_rate": 0, "dha_required": true, "haad_required": true, "currency": "AED" },
    "SA": { "vat_rate": 15, "moh_required": true, "currency": "SAR" },
    "BH": { "vat_rate": 10, "nhra_required": true, "currency": "BHD" },
    "EG": { "vat_rate": 14, "currency": "EGP" }
  }'::jsonb
),

-- ─── 6. Education & Training ────────────────────────────────────────────────
(
  'education',
  'Education & Training',
  'التعليم والتدريب',
  ARRAY['hr', 'crm', 'accounting', 'integrations', 'rare'],
  'pro',
  '{
    "student_management": true,
    "course_management": true,
    "attendance_tracking": true,
    "grade_management": true,
    "parent_portal": true,
    "fee_management": true,
    "lms_integration": true,
    "default_currency": "AED",
    "tax_rate": 0,
    "vat_enabled": false
  }'::jsonb,
  ARRAY['micro', 'small', 'medium', 'large'],
  '{
    "UAE": { "vat_rate": 0, "khda_compliance": true, "currency": "AED" },
    "SA": { "vat_rate": 15, "currency": "SAR" },
    "EG": { "vat_rate": 0, "currency": "EGP" }
  }'::jsonb
),

-- ─── 7. Real Estate & Property ──────────────────────────────────────────────
(
  'real_estate',
  'Real Estate & Property Management',
  'العقارات وإدارة الممتلكات',
  ARRAY['hr', 'crm', 'accounting', 'integrations', 'control_room', 'rare'],
  'business',
  '{
    "property_management": true,
    "tenant_management": true,
    "lease_management": true,
    "maintenance_tracking": true,
    "rental_collection": true,
    "vacancy_tracking": true,
    "owner_portal": true,
    "ejari_integration": true,
    "default_currency": "AED",
    "tax_rate": 5,
    "vat_enabled": true
  }'::jsonb,
  ARRAY['small', 'medium', 'large', 'enterprise'],
  '{
    "UAE": { "vat_rate": 5, "ejari_required": true, "rera_compliance": true, "currency": "AED" },
    "SA": { "vat_rate": 15, "ejar_required": true, "currency": "SAR" },
    "BH": { "vat_rate": 10, "currency": "BHD" }
  }'::jsonb
),

-- ─── 8. Logistics & Transportation ──────────────────────────────────────────
(
  'logistics',
  'Logistics & Transportation',
  'الخدمات اللوجستية والنقل',
  ARRAY['hr', 'crm', 'accounting', 'store', 'integrations', 'control_room', 'rare'],
  'business',
  '{
    "fleet_management": true,
    "route_optimization": true,
    "warehouse_management": true,
    "shipment_tracking": true,
    "driver_management": true,
    "fuel_tracking": true,
    "customs_documentation": true,
    "delivery_proof": true,
    "default_currency": "AED",
    "tax_rate": 5,
    "vat_enabled": true,
    "gps_tracking": true
  }'::jsonb,
  ARRAY['small', 'medium', 'large', 'enterprise'],
  '{
    "UAE": { "vat_rate": 5, "rta_compliance": true, "currency": "AED" },
    "SA": { "vat_rate": 15, "currency": "SAR" },
    "OM": { "vat_rate": 5, "currency": "OMR" }
  }'::jsonb
)
ON CONFLICT (industry_code) DO UPDATE SET
  industry_name_en = EXCLUDED.industry_name_en,
  industry_name_ar = EXCLUDED.industry_name_ar,
  recommended_modules = EXCLUDED.recommended_modules,
  default_plan = EXCLUDED.default_plan,
  default_settings = EXCLUDED.default_settings,
  business_sizes = EXCLUDED.business_sizes,
  country_overrides = EXCLUDED.country_overrides,
  updated_at = now();
