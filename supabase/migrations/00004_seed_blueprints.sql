-- ============================================================================
-- ZIEN Platform - Blueprint & Seed Pack Data
-- Migration: 00004_seed_blueprints.sql
-- Date: 2026-02-24
-- Description: Company types, blueprints, blueprint modules, seed packs
-- ============================================================================

-- =========================
-- 1. COMPANY TYPES
-- =========================

INSERT INTO company_types (code, name_ar, name_en, description, icon)
VALUES
    ('general_trading',    'تجارة عامة',       'General Trading',        'Import/export, wholesale, retail',       'Store'),
    ('professional_services','خدمات مهنية',     'Professional Services',  'Consulting, legal, accounting firms',    'Briefcase'),
    ('construction',       'مقاولات',            'Construction',           'Building, contracting, engineering',     'Building2'),
    ('food_beverage',      'أغذية ومشروبات',    'Food & Beverage',        'Restaurants, cafes, catering',           'UtensilsCrossed'),
    ('healthcare',         'رعاية صحية',         'Healthcare',             'Clinics, pharmacies, medical centers',   'HeartPulse'),
    ('education',          'تعليم',              'Education',              'Schools, training centers, academies',   'GraduationCap'),
    ('technology',         'تكنولوجيا',          'Technology',             'Software, IT services, digital',         'Cpu'),
    ('logistics',          'لوجستيات',           'Logistics',              'Transport, shipping, fleet management',  'Truck'),
    ('real_estate',        'عقارات',             'Real Estate',            'Property management, brokerages',        'Home'),
    ('manufacturing',      'تصنيع',              'Manufacturing',          'Factories, production, assembly',        'Factory')
ON CONFLICT (code) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;

-- =========================
-- 2. COMPANY TYPE → DEFAULT MODULES
-- =========================

-- General Trading: dashboard + accounting + crm + inventory + documents + communication
INSERT INTO company_type_template_modules (company_type_id, module_id, is_default_enabled, is_required, sort_order)
SELECT ct.id, mc.id, true, mc.code IN ('dashboard', 'accounting'), row_number() OVER ()
FROM company_types ct
CROSS JOIN modules_catalog mc
WHERE ct.code = 'general_trading'
AND mc.code IN ('dashboard', 'accounting', 'crm', 'inventory', 'documents', 'communication')
ON CONFLICT (company_type_id, module_id) DO NOTHING;

-- Professional Services: dashboard + accounting + crm + projects + hr + documents + communication
INSERT INTO company_type_template_modules (company_type_id, module_id, is_default_enabled, is_required, sort_order)
SELECT ct.id, mc.id, true, mc.code IN ('dashboard', 'accounting'), row_number() OVER ()
FROM company_types ct
CROSS JOIN modules_catalog mc
WHERE ct.code = 'professional_services'
AND mc.code IN ('dashboard', 'accounting', 'crm', 'projects', 'hr', 'documents', 'communication')
ON CONFLICT (company_type_id, module_id) DO NOTHING;

-- Construction: dashboard + accounting + hr + projects + logistics + inventory + documents + communication
INSERT INTO company_type_template_modules (company_type_id, module_id, is_default_enabled, is_required, sort_order)
SELECT ct.id, mc.id, true, mc.code IN ('dashboard', 'accounting'), row_number() OVER ()
FROM company_types ct
CROSS JOIN modules_catalog mc
WHERE ct.code = 'construction'
AND mc.code IN ('dashboard', 'accounting', 'hr', 'projects', 'logistics', 'inventory', 'documents', 'communication')
ON CONFLICT (company_type_id, module_id) DO NOTHING;

-- Food & Beverage: dashboard + accounting + inventory + crm + hr + documents + communication
INSERT INTO company_type_template_modules (company_type_id, module_id, is_default_enabled, is_required, sort_order)
SELECT ct.id, mc.id, true, mc.code IN ('dashboard', 'accounting'), row_number() OVER ()
FROM company_types ct
CROSS JOIN modules_catalog mc
WHERE ct.code = 'food_beverage'
AND mc.code IN ('dashboard', 'accounting', 'inventory', 'crm', 'hr', 'documents', 'communication')
ON CONFLICT (company_type_id, module_id) DO NOTHING;

-- Healthcare: dashboard + accounting + hr + crm + documents + communication
INSERT INTO company_type_template_modules (company_type_id, module_id, is_default_enabled, is_required, sort_order)
SELECT ct.id, mc.id, true, mc.code IN ('dashboard', 'accounting'), row_number() OVER ()
FROM company_types ct
CROSS JOIN modules_catalog mc
WHERE ct.code = 'healthcare'
AND mc.code IN ('dashboard', 'accounting', 'hr', 'crm', 'documents', 'communication')
ON CONFLICT (company_type_id, module_id) DO NOTHING;

-- Education: dashboard + accounting + hr + academy + documents + communication
INSERT INTO company_type_template_modules (company_type_id, module_id, is_default_enabled, is_required, sort_order)
SELECT ct.id, mc.id, true, mc.code IN ('dashboard', 'accounting'), row_number() OVER ()
FROM company_types ct
CROSS JOIN modules_catalog mc
WHERE ct.code = 'education'
AND mc.code IN ('dashboard', 'accounting', 'hr', 'academy', 'documents', 'communication')
ON CONFLICT (company_type_id, module_id) DO NOTHING;

-- Technology: dashboard + accounting + hr + projects + crm + documents + communication
INSERT INTO company_type_template_modules (company_type_id, module_id, is_default_enabled, is_required, sort_order)
SELECT ct.id, mc.id, true, mc.code IN ('dashboard', 'accounting'), row_number() OVER ()
FROM company_types ct
CROSS JOIN modules_catalog mc
WHERE ct.code = 'technology'
AND mc.code IN ('dashboard', 'accounting', 'hr', 'projects', 'crm', 'documents', 'communication')
ON CONFLICT (company_type_id, module_id) DO NOTHING;

-- Logistics: dashboard + accounting + logistics + inventory + hr + documents + communication
INSERT INTO company_type_template_modules (company_type_id, module_id, is_default_enabled, is_required, sort_order)
SELECT ct.id, mc.id, true, mc.code IN ('dashboard', 'accounting'), row_number() OVER ()
FROM company_types ct
CROSS JOIN modules_catalog mc
WHERE ct.code = 'logistics'
AND mc.code IN ('dashboard', 'accounting', 'logistics', 'inventory', 'hr', 'documents', 'communication')
ON CONFLICT (company_type_id, module_id) DO NOTHING;

-- Real Estate: dashboard + accounting + crm + projects + documents + communication
INSERT INTO company_type_template_modules (company_type_id, module_id, is_default_enabled, is_required, sort_order)
SELECT ct.id, mc.id, true, mc.code IN ('dashboard', 'accounting'), row_number() OVER ()
FROM company_types ct
CROSS JOIN modules_catalog mc
WHERE ct.code = 'real_estate'
AND mc.code IN ('dashboard', 'accounting', 'crm', 'projects', 'documents', 'communication')
ON CONFLICT (company_type_id, module_id) DO NOTHING;

-- Manufacturing: dashboard + accounting + inventory + hr + logistics + projects + documents + communication
INSERT INTO company_type_template_modules (company_type_id, module_id, is_default_enabled, is_required, sort_order)
SELECT ct.id, mc.id, true, mc.code IN ('dashboard', 'accounting'), row_number() OVER ()
FROM company_types ct
CROSS JOIN modules_catalog mc
WHERE ct.code = 'manufacturing'
AND mc.code IN ('dashboard', 'accounting', 'inventory', 'hr', 'logistics', 'projects', 'documents', 'communication')
ON CONFLICT (company_type_id, module_id) DO NOTHING;

-- =========================
-- 3. BLUEPRINTS (one per company type)
-- =========================

INSERT INTO blueprints (company_type_id, name, version, rules_json)
SELECT
    ct.id,
    'Default ' || ct.name_en || ' Blueprint',
    '1.0.0',
    jsonb_build_object(
        'auto_create_departments', true,
        'auto_assign_core_modules', true,
        'provision_seed_data', true,
        'default_currency', 'AED',
        'default_timezone', 'Asia/Dubai'
    )
FROM company_types ct
ON CONFLICT DO NOTHING;

-- =========================
-- 4. BLUEPRINT → MODULES (link each blueprint to its company type's default modules)
-- =========================

INSERT INTO blueprint_modules (blueprint_id, module_id, is_required, default_config_json)
SELECT
    b.id,
    cttm.module_id,
    cttm.is_required,
    '{}'::jsonb
FROM blueprints b
JOIN company_type_template_modules cttm ON cttm.company_type_id = b.company_type_id
ON CONFLICT (blueprint_id, module_id) DO NOTHING;

-- =========================
-- 5. SEED PACKS
-- =========================

INSERT INTO seed_packs (code, kind, description, payload_json)
VALUES
    -- Default roles (departments)
    ('default_departments_trading', 'roles', 'Default departments for trading companies',
     '{"departments": ["Sales", "Procurement", "Finance", "Administration", "Warehouse"]}'),

    ('default_departments_services', 'roles', 'Default departments for professional services',
     '{"departments": ["Consulting", "Legal", "Finance", "HR", "Operations"]}'),

    ('default_departments_construction', 'roles', 'Default departments for construction',
     '{"departments": ["Engineering", "Projects", "Finance", "Procurement", "Safety", "Fleet"]}'),

    ('default_departments_tech', 'roles', 'Default departments for technology companies',
     '{"departments": ["Engineering", "Product", "Design", "Sales", "Finance", "HR"]}'),

    ('default_departments_general', 'roles', 'Default departments for general business',
     '{"departments": ["Operations", "Finance", "HR", "Administration"]}'),

    -- UAE tax config
    ('uae_vat_config', 'tax_config', 'UAE VAT configuration (5%)',
     '{"taxes": [{"name": "VAT", "rate": 5, "country_code": "AE", "is_active": true}]}'),

    -- Demo data (only for sandbox/testing)
    ('demo_clients_5', 'demo_data', 'Sample 5 clients for demo',
     '{"clients": [{"name": "Acme Corp"}, {"name": "Atlas Trading"}, {"name": "Beacon Services"}, {"name": "Crystal Solutions"}, {"name": "Delta Logistics"}]}')
ON CONFLICT (code) DO UPDATE SET
    kind = EXCLUDED.kind,
    description = EXCLUDED.description,
    payload_json = EXCLUDED.payload_json;

-- =========================
-- 6. BLUEPRINT → SEED PACKS (link appropriate seed packs)
-- =========================

-- Trading blueprints get trading departments + UAE VAT
INSERT INTO blueprint_seed_packs (blueprint_id, seed_pack_id, apply_order)
SELECT b.id, sp.id, CASE sp.code
    WHEN 'default_departments_trading' THEN 1
    WHEN 'uae_vat_config' THEN 2
    END
FROM blueprints b
JOIN company_types ct ON ct.id = b.company_type_id
CROSS JOIN seed_packs sp
WHERE ct.code = 'general_trading'
AND sp.code IN ('default_departments_trading', 'uae_vat_config')
ON CONFLICT (blueprint_id, seed_pack_id) DO NOTHING;

-- Professional services blueprints
INSERT INTO blueprint_seed_packs (blueprint_id, seed_pack_id, apply_order)
SELECT b.id, sp.id, CASE sp.code
    WHEN 'default_departments_services' THEN 1
    WHEN 'uae_vat_config' THEN 2
    END
FROM blueprints b
JOIN company_types ct ON ct.id = b.company_type_id
CROSS JOIN seed_packs sp
WHERE ct.code = 'professional_services'
AND sp.code IN ('default_departments_services', 'uae_vat_config')
ON CONFLICT (blueprint_id, seed_pack_id) DO NOTHING;

-- Construction blueprints
INSERT INTO blueprint_seed_packs (blueprint_id, seed_pack_id, apply_order)
SELECT b.id, sp.id, CASE sp.code
    WHEN 'default_departments_construction' THEN 1
    WHEN 'uae_vat_config' THEN 2
    END
FROM blueprints b
JOIN company_types ct ON ct.id = b.company_type_id
CROSS JOIN seed_packs sp
WHERE ct.code = 'construction'
AND sp.code IN ('default_departments_construction', 'uae_vat_config')
ON CONFLICT (blueprint_id, seed_pack_id) DO NOTHING;

-- Technology blueprints
INSERT INTO blueprint_seed_packs (blueprint_id, seed_pack_id, apply_order)
SELECT b.id, sp.id, CASE sp.code
    WHEN 'default_departments_tech' THEN 1
    WHEN 'uae_vat_config' THEN 2
    END
FROM blueprints b
JOIN company_types ct ON ct.id = b.company_type_id
CROSS JOIN seed_packs sp
WHERE ct.code = 'technology'
AND sp.code IN ('default_departments_tech', 'uae_vat_config')
ON CONFLICT (blueprint_id, seed_pack_id) DO NOTHING;

-- All other types get general departments + UAE VAT
INSERT INTO blueprint_seed_packs (blueprint_id, seed_pack_id, apply_order)
SELECT b.id, sp.id, CASE sp.code
    WHEN 'default_departments_general' THEN 1
    WHEN 'uae_vat_config' THEN 2
    END
FROM blueprints b
JOIN company_types ct ON ct.id = b.company_type_id
CROSS JOIN seed_packs sp
WHERE ct.code IN ('food_beverage', 'healthcare', 'education', 'logistics', 'real_estate', 'manufacturing')
AND sp.code IN ('default_departments_general', 'uae_vat_config')
ON CONFLICT (blueprint_id, seed_pack_id) DO NOTHING;
