-- ============================================================================
-- Migration 00036: Expanded Industries — 13 Sectors with Sub-Activities
-- Replaces old 8 blueprints with 13 comprehensive industry sectors
-- Adds sub_activities JSONB column for sub-activity data per sector
-- ============================================================================

-- ─── Add sub_activities column ──────────────────────────────────────────────
ALTER TABLE industry_blueprints
  ADD COLUMN IF NOT EXISTS sub_activities JSONB NOT NULL DEFAULT '[]';

-- ─── Upsert all 13 sectors ─────────────────────────────────────────────────

INSERT INTO industry_blueprints (
  industry_code, industry_name_en, industry_name_ar,
  recommended_modules, default_plan, default_settings, business_sizes,
  country_overrides, sub_activities, is_active
)
VALUES

-- ─── 1. Commercial & Trading ────────────────────────────────────────────────
(
  'commercial',
  'Commercial & Trading',
  'الشركات التجارية',
  ARRAY['hr','accounting','crm','store','inventory','logistics','integrations','rare','analytics'],
  'pro',
  '{"pos_enabled":true,"inventory_tracking":true,"multi_location":true,"e_commerce_sync":true,"default_currency":"AED","vat_enabled":true,"tax_rate":5}'::jsonb,
  ARRAY['micro','small','medium','large','enterprise'],
  '{"UAE":{"vat_rate":5,"currency":"AED"},"SA":{"vat_rate":15,"currency":"SAR"},"EG":{"vat_rate":14,"currency":"EGP"},"BH":{"vat_rate":10,"currency":"BHD"}}'::jsonb,
  '[
    {"code":"building_materials","name_en":"Building Materials Trading","name_ar":"تجارة مواد البناء"},
    {"code":"food_trading","name_en":"Food & Beverage Trading","name_ar":"تجارة المواد الغذائية"},
    {"code":"electronics_trading","name_en":"Electronics Trading","name_ar":"تجارة الإلكترونيات"},
    {"code":"auto_trading","name_en":"Automobiles & Spare Parts","name_ar":"تجارة السيارات وقطع الغيار"},
    {"code":"electrical_appliances","name_en":"Electrical Appliances","name_ar":"تجارة الأجهزة الكهربائية"},
    {"code":"furniture_trading","name_en":"Furniture Trading","name_ar":"تجارة الأثاث"},
    {"code":"textiles_fashion","name_en":"Textiles & Fashion","name_ar":"تجارة الملابس والأقمشة"},
    {"code":"chemicals_trading","name_en":"Chemicals Trading","name_ar":"تجارة المواد الكيماوية"},
    {"code":"grains_trading","name_en":"Grains & Agricultural Products","name_ar":"تجارة الحبوب والمنتجات الزراعية"},
    {"code":"medical_equipment","name_en":"Medical Equipment Trading","name_ar":"تجارة الأجهزة الطبية"}
  ]'::jsonb,
  true
),

-- ─── 2. Industrial & Manufacturing ──────────────────────────────────────────
(
  'industrial',
  'Industrial & Manufacturing',
  'الشركات الصناعية',
  ARRAY['hr','accounting','inventory','projects','logistics','control_room','automation','integrations','rare','analytics'],
  'business',
  '{"production_tracking":true,"quality_control":true,"equipment_management":true,"safety_compliance":true,"default_currency":"AED","vat_enabled":true,"tax_rate":5}'::jsonb,
  ARRAY['small','medium','large','enterprise'],
  '{"UAE":{"vat_rate":5,"currency":"AED"},"SA":{"vat_rate":15,"currency":"SAR"},"EG":{"vat_rate":14,"currency":"EGP"},"OM":{"vat_rate":5,"currency":"OMR"}}'::jsonb,
  '[
    {"code":"food_manufacturing","name_en":"Food Manufacturing","name_ar":"صناعة الأغذية"},
    {"code":"heavy_industry","name_en":"Heavy Industry & Steel","name_ar":"الصناعات الثقيلة والحديد"},
    {"code":"plastics","name_en":"Plastics Manufacturing","name_ar":"صناعة البلاستيك"},
    {"code":"aluminum","name_en":"Aluminum Industry","name_ar":"صناعة الألمنيوم"},
    {"code":"cement","name_en":"Cement & Building Materials","name_ar":"صناعة الأسمنت ومواد البناء"},
    {"code":"textiles_mfg","name_en":"Textile Manufacturing","name_ar":"صناعة النسيج"},
    {"code":"chemicals_mfg","name_en":"Chemical Manufacturing","name_ar":"الصناعات الكيماوية"},
    {"code":"electronics_mfg","name_en":"Electronics Assembly","name_ar":"تجميع الإلكترونيات"},
    {"code":"ceramics","name_en":"Ceramics & Glass","name_ar":"صناعة السيراميك والزجاج"},
    {"code":"pharmaceuticals","name_en":"Pharmaceuticals","name_ar":"صناعة الأدوية"}
  ]'::jsonb,
  true
),

-- ─── 3. Services & Professional ─────────────────────────────────────────────
(
  'professional_services',
  'Services & Professional',
  'الشركات الخدمية والمهنية',
  ARRAY['hr','accounting','crm','projects','documents','client_portal','meetings','rare','analytics'],
  'pro',
  '{"time_tracking":true,"project_billing":true,"client_portal":true,"document_management":true,"proposal_generation":true,"default_currency":"AED","vat_enabled":true,"tax_rate":5}'::jsonb,
  ARRAY['micro','small','medium','large'],
  '{"UAE":{"vat_rate":5,"currency":"AED","free_zone_applicable":true},"SA":{"vat_rate":15,"currency":"SAR"},"EG":{"vat_rate":14,"currency":"EGP"},"BH":{"vat_rate":10,"currency":"BHD"}}'::jsonb,
  '[
    {"code":"engineering_consulting","name_en":"Engineering Consulting","name_ar":"الاستشارات الهندسية"},
    {"code":"legal_services","name_en":"Law Firms & Legal Services","name_ar":"المحاماة والخدمات القانونية"},
    {"code":"accounting_services","name_en":"Accounting & Audit Firms","name_ar":"مكاتب المحاسبة والتدقيق"},
    {"code":"it_services","name_en":"IT & Technology Services","name_ar":"خدمات تكنولوجيا المعلومات"},
    {"code":"marketing_services","name_en":"Marketing & Advertising","name_ar":"التسويق والإعلان"},
    {"code":"design_services","name_en":"Design & Architecture","name_ar":"التصميم والهندسة المعمارية"},
    {"code":"training_services","name_en":"Training & Coaching","name_ar":"التدريب والتطوير"},
    {"code":"management_consulting","name_en":"Management Consulting","name_ar":"الاستشارات الإدارية"},
    {"code":"healthcare_services","name_en":"Healthcare Services","name_ar":"الخدمات الصحية"},
    {"code":"education_services","name_en":"Educational Institutions","name_ar":"المؤسسات التعليمية"}
  ]'::jsonb,
  true
),

-- ─── 4. Construction & Contracting ──────────────────────────────────────────
(
  'construction',
  'Construction & Contracting',
  'شركات المقاولات',
  ARRAY['hr','accounting','projects','inventory','logistics','control_room','documents','automation','rare','analytics'],
  'business',
  '{"project_management":true,"site_tracking":true,"equipment_management":true,"safety_compliance":true,"timesheet_tracking":true,"material_procurement":true,"default_currency":"AED","vat_enabled":true,"tax_rate":5,"wps_enabled":true}'::jsonb,
  ARRAY['small','medium','large','enterprise'],
  '{"UAE":{"vat_rate":5,"wps_required":true,"currency":"AED"},"SA":{"vat_rate":15,"wps_required":true,"currency":"SAR"},"QA":{"vat_rate":0,"currency":"QAR"},"OM":{"vat_rate":5,"currency":"OMR"}}'::jsonb,
  '[
    {"code":"building_construction","name_en":"Building Construction","name_ar":"بناء المباني"},
    {"code":"road_construction","name_en":"Roads & Bridges","name_ar":"الطرق والجسور"},
    {"code":"infrastructure","name_en":"Infrastructure Projects","name_ar":"مشاريع البنية التحتية"},
    {"code":"electromechanical","name_en":"Electromechanical","name_ar":"الكهروميكانيك"},
    {"code":"finishing","name_en":"Finishing & Interior","name_ar":"التشطيبات والديكور"},
    {"code":"excavation","name_en":"Excavation & Earthworks","name_ar":"الحفر وأعمال التربة"},
    {"code":"plumbing","name_en":"Plumbing & HVAC","name_ar":"السباكة والتكييف"},
    {"code":"structural_steel","name_en":"Structural Steel","name_ar":"الهياكل المعدنية"}
  ]'::jsonb,
  true
),

-- ─── 5. Real Estate ─────────────────────────────────────────────────────────
(
  'real_estate',
  'Real Estate',
  'شركات العقارات',
  ARRAY['hr','accounting','crm','projects','documents','client_portal','control_room','rare','analytics'],
  'business',
  '{"property_management":true,"tenant_management":true,"lease_management":true,"maintenance_tracking":true,"rental_collection":true,"ejari_integration":true,"default_currency":"AED","vat_enabled":true,"tax_rate":5}'::jsonb,
  ARRAY['small','medium','large','enterprise'],
  '{"UAE":{"vat_rate":5,"ejari_required":true,"rera_compliance":true,"currency":"AED"},"SA":{"vat_rate":15,"ejar_required":true,"currency":"SAR"},"BH":{"vat_rate":10,"currency":"BHD"}}'::jsonb,
  '[
    {"code":"property_sales","name_en":"Property Sales","name_ar":"بيع العقارات"},
    {"code":"property_purchase","name_en":"Property Purchase","name_ar":"شراء العقارات"},
    {"code":"property_development","name_en":"Real Estate Development","name_ar":"التطوير العقاري"},
    {"code":"property_management","name_en":"Property Management","name_ar":"إدارة العقارات"},
    {"code":"property_rental","name_en":"Rental & Leasing","name_ar":"التأجير والإيجار"},
    {"code":"property_valuation","name_en":"Property Valuation","name_ar":"التقييم العقاري"},
    {"code":"property_investment","name_en":"Real Estate Investment","name_ar":"الاستثمار العقاري"}
  ]'::jsonb,
  true
),

-- ─── 6. Restaurants & Food Service ──────────────────────────────────────────
(
  'restaurants',
  'Restaurants & Food Service',
  'المطاعم والخدمات الغذائية',
  ARRAY['hr','accounting','store','inventory','crm','logistics','integrations','rare','analytics'],
  'pro',
  '{"pos_enabled":true,"kitchen_display":true,"table_management":true,"delivery_integration":true,"menu_management":true,"ingredient_tracking":true,"default_currency":"AED","vat_enabled":true,"tax_rate":5,"tip_enabled":true}'::jsonb,
  ARRAY['micro','small','medium','large'],
  '{"UAE":{"vat_rate":5,"municipality_fee":7,"currency":"AED"},"SA":{"vat_rate":15,"currency":"SAR"},"BH":{"vat_rate":10,"currency":"BHD"},"KW":{"vat_rate":0,"currency":"KWD"}}'::jsonb,
  '[
    {"code":"fine_dining","name_en":"Fine Dining","name_ar":"المطاعم الفاخرة"},
    {"code":"fast_food","name_en":"Fast Food & QSR","name_ar":"الوجبات السريعة"},
    {"code":"cafes","name_en":"Cafes & Coffee Shops","name_ar":"المقاهي"},
    {"code":"bakeries","name_en":"Bakeries & Pastries","name_ar":"المخابز والحلويات"},
    {"code":"catering","name_en":"Catering Services","name_ar":"خدمات التموين والكاترينج"},
    {"code":"cloud_kitchen","name_en":"Cloud Kitchens","name_ar":"المطابخ السحابية"},
    {"code":"juice_bars","name_en":"Juice Bars & Healthy","name_ar":"محلات العصائر والصحي"}
  ]'::jsonb,
  true
),

-- ─── 7. Banking & Financial Exchange ────────────────────────────────────────
(
  'banking_exchange',
  'Banking & Financial Exchange',
  'الصرافة والبنوك',
  ARRAY['hr','accounting','crm','documents','control_room','automation','integrations','rare','analytics'],
  'enterprise',
  '{"compliance_enabled":true,"aml_screening":true,"transaction_monitoring":true,"multi_currency":true,"default_currency":"AED","vat_enabled":true,"tax_rate":5}'::jsonb,
  ARRAY['small','medium','large','enterprise'],
  '{"UAE":{"vat_rate":5,"cbuae_compliance":true,"currency":"AED"},"SA":{"vat_rate":15,"sama_compliance":true,"currency":"SAR"},"BH":{"vat_rate":10,"cbb_compliance":true,"currency":"BHD"}}'::jsonb,
  '[
    {"code":"currency_exchange","name_en":"Currency Exchange","name_ar":"الصرافة وتبديل العملات"},
    {"code":"banking_services","name_en":"Banking Services","name_ar":"الخدمات المصرفية"},
    {"code":"money_transfer","name_en":"Money Transfer","name_ar":"تحويل الأموال"},
    {"code":"investment_firms","name_en":"Investment Firms","name_ar":"شركات الاستثمار"},
    {"code":"microfinance","name_en":"Microfinance","name_ar":"التمويل الأصغر"},
    {"code":"financial_advisory","name_en":"Financial Advisory","name_ar":"الاستشارات المالية"}
  ]'::jsonb,
  true
),

-- ─── 8. Insurance Companies ─────────────────────────────────────────────────
(
  'insurance',
  'Insurance Companies',
  'شركات التأمين',
  ARRAY['hr','accounting','crm','documents','client_portal','automation','control_room','rare','analytics'],
  'business',
  '{"claims_management":true,"policy_management":true,"underwriting":true,"risk_assessment":true,"default_currency":"AED","vat_enabled":true,"tax_rate":5}'::jsonb,
  ARRAY['small','medium','large','enterprise'],
  '{"UAE":{"vat_rate":5,"ia_compliance":true,"currency":"AED"},"SA":{"vat_rate":15,"cchi_compliance":true,"currency":"SAR"},"BH":{"vat_rate":10,"currency":"BHD"}}'::jsonb,
  '[
    {"code":"medical_insurance","name_en":"Medical Insurance","name_ar":"التأمين الطبي"},
    {"code":"auto_insurance","name_en":"Auto Insurance","name_ar":"تأمين السيارات"},
    {"code":"property_insurance","name_en":"Property Insurance","name_ar":"تأمين الممتلكات"},
    {"code":"life_insurance","name_en":"Life Insurance","name_ar":"تأمين الحياة"},
    {"code":"travel_insurance","name_en":"Travel Insurance","name_ar":"تأمين السفر"},
    {"code":"commercial_insurance","name_en":"Commercial Insurance","name_ar":"التأمين التجاري"}
  ]'::jsonb,
  true
),

-- ─── 9. Logistics & Supply Chain ────────────────────────────────────────────
(
  'logistics',
  'Logistics & Supply Chain',
  'شركات اللوجستيات',
  ARRAY['hr','accounting','inventory','logistics','control_room','automation','crm','integrations','rare','analytics'],
  'business',
  '{"fleet_management":true,"route_optimization":true,"warehouse_management":true,"shipment_tracking":true,"customs_documentation":true,"gps_tracking":true,"default_currency":"AED","vat_enabled":true,"tax_rate":5}'::jsonb,
  ARRAY['small','medium','large','enterprise'],
  '{"UAE":{"vat_rate":5,"rta_compliance":true,"currency":"AED"},"SA":{"vat_rate":15,"currency":"SAR"},"OM":{"vat_rate":5,"currency":"OMR"}}'::jsonb,
  '[
    {"code":"warehousing","name_en":"Warehousing & Storage","name_ar":"التخزين والمستودعات"},
    {"code":"shipping","name_en":"Shipping & Freight","name_ar":"الشحن والنقل البحري"},
    {"code":"distribution","name_en":"Distribution Services","name_ar":"خدمات التوزيع"},
    {"code":"warehouse_management","name_en":"Warehouse Management","name_ar":"إدارة المستودعات"},
    {"code":"packaging","name_en":"Packaging Solutions","name_ar":"حلول التغليف"},
    {"code":"cold_chain","name_en":"Cold Chain Logistics","name_ar":"سلسلة التبريد"},
    {"code":"last_mile","name_en":"Last Mile Delivery","name_ar":"التوصيل للميل الأخير"}
  ]'::jsonb,
  true
),

-- ─── 10. Charities & NGOs ───────────────────────────────────────────────────
(
  'charities',
  'Charities & NGOs',
  'الجمعيات الخيرية',
  ARRAY['hr','accounting','crm','projects','documents','training','rare','analytics'],
  'pro',
  '{"donation_tracking":true,"donor_management":true,"campaign_management":true,"volunteer_management":true,"default_currency":"AED","vat_enabled":false,"tax_rate":0}'::jsonb,
  ARRAY['micro','small','medium','large'],
  '{"UAE":{"vat_rate":0,"iacad_compliance":true,"currency":"AED"},"SA":{"vat_rate":0,"currency":"SAR"},"EG":{"vat_rate":0,"currency":"EGP"}}'::jsonb,
  '[
    {"code":"humanitarian","name_en":"Humanitarian Aid","name_ar":"المساعدات الإنسانية"},
    {"code":"educational_ngo","name_en":"Educational NGOs","name_ar":"الجمعيات التعليمية"},
    {"code":"health_ngo","name_en":"Health Organizations","name_ar":"المنظمات الصحية"},
    {"code":"environmental","name_en":"Environmental NGOs","name_ar":"الجمعيات البيئية"},
    {"code":"community","name_en":"Community Organizations","name_ar":"المنظمات المجتمعية"},
    {"code":"relief","name_en":"Disaster Relief","name_ar":"الإغاثة من الكوارث"}
  ]'::jsonb,
  true
),

-- ─── 11. Institutions & Embassies ───────────────────────────────────────────
(
  'institutions',
  'Institutions & Embassies',
  'المؤسسات والسفارات',
  ARRAY['hr','accounting','documents','meetings','projects','control_room','automation','rare','analytics'],
  'enterprise',
  '{"protocol_management":true,"visa_services":true,"citizen_services":true,"document_legalization":true,"default_currency":"AED","vat_enabled":true,"tax_rate":5}'::jsonb,
  ARRAY['medium','large','enterprise'],
  '{"UAE":{"vat_rate":5,"currency":"AED"},"SA":{"vat_rate":15,"currency":"SAR"}}'::jsonb,
  '[
    {"code":"embassies","name_en":"Embassies","name_ar":"السفارات"},
    {"code":"consulates","name_en":"Consulates","name_ar":"القنصليات"},
    {"code":"government","name_en":"Government Institutions","name_ar":"المؤسسات الحكومية"},
    {"code":"international_orgs","name_en":"International Organizations","name_ar":"المنظمات الدولية"},
    {"code":"semi_government","name_en":"Semi-Government Bodies","name_ar":"الهيئات شبه الحكومية"}
  ]'::jsonb,
  true
),

-- ─── 12. Recruitment & Staffing ─────────────────────────────────────────────
(
  'recruitment',
  'Recruitment & Staffing',
  'شركات التوظيف',
  ARRAY['hr','accounting','crm','recruitment','documents','client_portal','automation','rare','analytics'],
  'pro',
  '{"applicant_tracking":true,"job_board_integration":true,"interview_scheduling":true,"background_checks":true,"default_currency":"AED","vat_enabled":true,"tax_rate":5}'::jsonb,
  ARRAY['micro','small','medium','large'],
  '{"UAE":{"vat_rate":5,"mohre_compliance":true,"currency":"AED"},"SA":{"vat_rate":15,"mol_compliance":true,"currency":"SAR"},"BH":{"vat_rate":10,"currency":"BHD"}}'::jsonb,
  '[
    {"code":"local_recruitment","name_en":"Local Recruitment","name_ar":"التوظيف المحلي"},
    {"code":"international_recruitment","name_en":"International Recruitment","name_ar":"التوظيف الدولي"},
    {"code":"temp_staffing","name_en":"Temporary Staffing","name_ar":"التوظيف المؤقت"},
    {"code":"executive_search","name_en":"Executive Search","name_ar":"البحث التنفيذي"},
    {"code":"hr_consulting","name_en":"HR Consulting","name_ar":"استشارات الموارد البشرية"},
    {"code":"manpower_supply","name_en":"Manpower Supply","name_ar":"توريد العمالة"}
  ]'::jsonb,
  true
),

-- ─── 13. Transport Companies ────────────────────────────────────────────────
(
  'transport',
  'Transport Companies',
  'شركات النقل',
  ARRAY['hr','accounting','logistics','control_room','crm','inventory','automation','integrations','rare','analytics'],
  'business',
  '{"fleet_management":true,"driver_management":true,"fuel_tracking":true,"route_planning":true,"gps_tracking":true,"maintenance_scheduling":true,"default_currency":"AED","vat_enabled":true,"tax_rate":5}'::jsonb,
  ARRAY['small','medium','large','enterprise'],
  '{"UAE":{"vat_rate":5,"rta_compliance":true,"currency":"AED"},"SA":{"vat_rate":15,"currency":"SAR"},"OM":{"vat_rate":5,"currency":"OMR"}}'::jsonb,
  '[
    {"code":"domestic_transport","name_en":"Domestic Transport","name_ar":"النقل الداخلي"},
    {"code":"international_transport","name_en":"International Transport","name_ar":"النقل الدولي"},
    {"code":"land_freight","name_en":"Land Freight","name_ar":"النقل البري"},
    {"code":"sea_freight","name_en":"Sea Freight","name_ar":"النقل البحري"},
    {"code":"air_freight","name_en":"Air Freight","name_ar":"النقل الجوي"},
    {"code":"passenger_transport","name_en":"Passenger Transport","name_ar":"نقل الركاب"},
    {"code":"moving_services","name_en":"Moving & Relocation","name_ar":"خدمات النقل والتغليف"}
  ]'::jsonb,
  true
)

ON CONFLICT (industry_code) DO UPDATE SET
  industry_name_en   = EXCLUDED.industry_name_en,
  industry_name_ar   = EXCLUDED.industry_name_ar,
  recommended_modules = EXCLUDED.recommended_modules,
  default_plan       = EXCLUDED.default_plan,
  default_settings   = EXCLUDED.default_settings,
  business_sizes     = EXCLUDED.business_sizes,
  country_overrides  = EXCLUDED.country_overrides,
  sub_activities     = EXCLUDED.sub_activities,
  is_active          = EXCLUDED.is_active,
  updated_at         = now();

-- ─── Deactivate old blueprints that no longer exist ─────────────────────────
UPDATE industry_blueprints
SET is_active = false, updated_at = now()
WHERE industry_code NOT IN (
  'commercial','industrial','professional_services','construction',
  'real_estate','restaurants','banking_exchange','insurance',
  'logistics','charities','institutions','recruitment','transport'
)
AND is_active = true;
