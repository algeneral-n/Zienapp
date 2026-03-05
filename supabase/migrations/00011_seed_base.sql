-- ============================================================================
-- ZIEN Platform - Base Seed Data
-- Migration: 00011_seed_base.sql
-- Date: 2026-02-25
-- Description: Core seed data for the platform: company types (industries),
--              modules catalog, blueprints, seed packs, permissions,
--              role-permission mapping, subscription plans, pricing add-ons.
-- ============================================================================

-- =========================================================
-- A. COMPANY TYPES (Industries/Verticals)
-- =========================================================

INSERT INTO company_types (code, name_ar, name_en, description, icon) VALUES
    ('retail',         'تجارة التجزئة والسوبرماركت',   'Retail & Supermarket',         'Retail stores, supermarkets, convenience stores',        'store'),
    ('manufacturing',  'المصانع والتصنيع',             'Manufacturing',                'Production, assembly, process manufacturing',             'factory'),
    ('mall',           'المولات والمراكز التجارية',    'Malls & Shopping Centers',     'Shopping malls and commercial centres',                    'business'),
    ('trades',         'المهن والفنيين',                'Trades & Professionals',       'Electricians, plumbers, mechanics, technicians',          'build'),
    ('ngo',            'الجمعيات التعاونية والخيرية',  'NGOs & Cooperatives',          'Charitable organisations, cooperatives',                   'volunteer_activism'),
    ('real_estate',    'العقارات والتطوير العقاري',    'Real Estate & Development',    'Property management, development, brokerage',             'apartment'),
    ('customs',        'التخليص الجمركي',               'Customs Clearance',            'Import/export, freight forwarding, customs brokerage',     'local_shipping'),
    ('consulting',     'الاستشارات',                    'Consulting',                   'Engineering, IT, business, legal consulting',              'support_agent'),
    ('media',          'الإنتاج الإعلامي والتصوير',    'Media & Production',           'Video production, photography, advertising',               'videocam'),
    ('construction',   'المقاولات والإنشاءات',         'Construction',                 'General contracting, civil engineering, fit-out',          'construction'),
    ('delivery',       'البيع المباشر والتوصيل',       'Direct Sales & Delivery',      'D2C sales, delivery services, distribution',               'delivery_dining'),
    ('logistics',      'الخدمات اللوجستية',             'Logistics',                    'Fleet management, warehousing, shipping',                  'local_shipping'),
    ('services',       'الشركات الخدمية والإدارية',    'Administrative & Services',    'Cleaning, maintenance, facility management, BPO',          'miscellaneous_services'),
    ('healthcare',     'الرعاية الصحية',                'Healthcare',                   'Clinics, hospitals, pharmacies, medical services',         'local_hospital'),
    ('education',      'التعليم والتدريب',              'Education & Training',         'Schools, training centres, e-learning',                    'school'),
    ('hospitality',    'الضيافة والمطاعم',              'Hospitality & F&B',            'Hotels, restaurants, cafes, catering',                     'restaurant'),
    ('tech',           'التقنية والبرمجيات',            'Technology & Software',        'SaaS, IT services, software development',                  'code'),
    ('agriculture',    'الزراعة',                       'Agriculture',                  'Farming, livestock, agri-business',                        'agriculture'),
    ('transportation', 'النقل والمواصلات',              'Transportation',               'Taxi, bus, ride-hailing, public transport',                'directions_bus'),
    ('general',        'شركات عامة',                    'General Business',             'Multi-purpose companies without specific vertical',        'business_center')
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- B. MODULES CATALOG
-- =========================================================

INSERT INTO modules_catalog (code, name_ar, name_en, description_ar, description_en, tier, sort_order) VALUES
    -- Core (always available)
    ('hr',           'الموارد البشرية',        'Human Resources',       'إدارة شؤون الموظفين والرواتب والحضور',            'Employee management, payroll, attendance',         'core',    10),
    ('accounting',   'المحاسبة والمالية',      'Accounting & Finance',  'الفواتير والمدفوعات وشجرة الحسابات والقيود',       'Invoices, payments, chart of accounts, journals',  'core',    20),
    ('crm',          'إدارة العملاء',          'CRM & Sales',           'العملاء المحتملين والفرص البيعية والعقود',          'Leads, opportunities, quotes, contracts',          'core',    30),
    ('projects',     'إدارة المشاريع',         'Projects & Tasks',      'المشاريع والمهام وتتبع التقدم',                    'Projects, tasks, time tracking, milestones',       'core',    40),
    ('chat',         'المحادثات',              'Chat & Messaging',      'قنوات المحادثة وحالة التواجد',                     'Chat channels, presence, direct messages',         'core',    50),
    ('meetings',     'الاجتماعات',             'Meetings',              'جدولة الاجتماعات والتسجيل والتلخيص الذكي',         'Scheduling, recording, AI summarisation',          'core',    60),
    ('documents',    'إدارة المستندات',        'Documents',             'أرشفة المستندات والملفات',                         'Document storage, archiving, versioning',          'core',    70),

    -- Add-on (optional, may incur extra cost)
    ('store',        'المتجر ونقاط البيع',     'Store & POS',           'المنتجات والمخزون ونقاط البيع',                    'Products, inventory, point of sale',               'addon',   80),
    ('logistics',    'اللوجستيات',             'Logistics & Fleet',     'المركبات والسائقين والشحنات وتتبع GPS',             'Vehicles, drivers, shipments, GPS tracking',       'addon',   90),
    ('recruitment',  'التوظيف',                'Recruitment',           'الوظائف والتقديمات والتوظيف',                      'Job posts, applications, hiring pipeline',         'addon',  100),
    ('training',     'التدريب',                'Training & Academy',    'الدورات التدريبية والاختبارات والشهادات',           'Courses, exams, certificates',                     'addon',  110),
    ('client_portal','بوابة العملاء',          'Client Portal',         'بوابة ذاتية للعملاء لعرض الفواتير والعقود',         'Self-service portal for clients',                  'addon',  120),
    ('employee_portal','بوابة الموظفين',       'Employee Portal',       'بوابة ذاتية للموظفين الميدانيين والداخليين',        'Self-service portal for employees',                'addon',  130),

    -- Premium (advanced features, higher cost)
    ('ai_rare',      'الذكاء الاصطناعي RARE',  'RARE AI',              'مساعد ذكي واعي بالسياق والدور',                    'Context-aware, role-aware AI assistant',            'premium', 140),
    ('analytics',    'التحليلات المتقدمة',     'Advanced Analytics',    'تقارير وتحليلات متقدمة ولوحات بيانات',             'Advanced reports, dashboards, BI',                 'premium', 150),
    ('automation',   'الأتمتة',                'Automation & Workflows','سير العمل الآلي والأوتوميشن',                      'Workflow automation, triggers, pipelines',         'premium', 160)
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- C. BLUEPRINTS (one default per major company type)
-- =========================================================

-- Helper: get module id by code
-- We use sub-selects in blueprint_modules inserts below.

INSERT INTO blueprints (company_type_id, name, version, rules_json, is_active)
SELECT ct.id, 'Default ' || ct.name_en || ' Blueprint', '1.0.0', '{}', true
FROM company_types ct
WHERE ct.code IN (
    'retail', 'manufacturing', 'construction', 'consulting',
    'logistics', 'services', 'real_estate', 'hospitality',
    'healthcare', 'education', 'tech', 'general'
)
ON CONFLICT DO NOTHING;


-- =========================================================
-- D. BLUEPRINT-MODULE MAPPINGS (examples for key verticals)
-- =========================================================

-- Retail: needs store/POS + accounting + HR + CRM
INSERT INTO blueprint_modules (blueprint_id, module_id, is_required, default_config_json)
SELECT b.id, m.id, true, '{}'
FROM blueprints b
JOIN company_types ct ON ct.id = b.company_type_id AND ct.code = 'retail'
CROSS JOIN modules_catalog m
WHERE m.code IN ('hr', 'accounting', 'crm', 'store', 'chat', 'documents')
ON CONFLICT (blueprint_id, module_id) DO NOTHING;

-- Construction: needs projects + logistics + HR + accounting
INSERT INTO blueprint_modules (blueprint_id, module_id, is_required, default_config_json)
SELECT b.id, m.id, true, '{}'
FROM blueprints b
JOIN company_types ct ON ct.id = b.company_type_id AND ct.code = 'construction'
CROSS JOIN modules_catalog m
WHERE m.code IN ('hr', 'accounting', 'projects', 'logistics', 'chat', 'documents')
ON CONFLICT (blueprint_id, module_id) DO NOTHING;

-- Logistics company: needs logistics + HR + accounting + CRM
INSERT INTO blueprint_modules (blueprint_id, module_id, is_required, default_config_json)
SELECT b.id, m.id, true, '{}'
FROM blueprints b
JOIN company_types ct ON ct.id = b.company_type_id AND ct.code = 'logistics'
CROSS JOIN modules_catalog m
WHERE m.code IN ('hr', 'accounting', 'crm', 'logistics', 'chat', 'documents')
ON CONFLICT (blueprint_id, module_id) DO NOTHING;

-- Consulting: needs projects + CRM + accounting + HR + meetings
INSERT INTO blueprint_modules (blueprint_id, module_id, is_required, default_config_json)
SELECT b.id, m.id, true, '{}'
FROM blueprints b
JOIN company_types ct ON ct.id = b.company_type_id AND ct.code = 'consulting'
CROSS JOIN modules_catalog m
WHERE m.code IN ('hr', 'accounting', 'crm', 'projects', 'meetings', 'chat', 'documents')
ON CONFLICT (blueprint_id, module_id) DO NOTHING;

-- Tech: needs projects + HR + CRM + meetings + analytics
INSERT INTO blueprint_modules (blueprint_id, module_id, is_required, default_config_json)
SELECT b.id, m.id, true, '{}'
FROM blueprints b
JOIN company_types ct ON ct.id = b.company_type_id AND ct.code = 'tech'
CROSS JOIN modules_catalog m
WHERE m.code IN ('hr', 'accounting', 'crm', 'projects', 'meetings', 'chat', 'documents', 'analytics')
ON CONFLICT (blueprint_id, module_id) DO NOTHING;

-- General: core + chat + documents
INSERT INTO blueprint_modules (blueprint_id, module_id, is_required, default_config_json)
SELECT b.id, m.id, true, '{}'
FROM blueprints b
JOIN company_types ct ON ct.id = b.company_type_id AND ct.code = 'general'
CROSS JOIN modules_catalog m
WHERE m.code IN ('hr', 'accounting', 'chat', 'documents')
ON CONFLICT (blueprint_id, module_id) DO NOTHING;


-- =========================================================
-- E. SEED PACKS
-- =========================================================

INSERT INTO seed_packs (code, kind, description, payload_json) VALUES
    ('roles_default',      'roles',              'Default roles and departments',
     '{"departments": ["إدارة عامة|General Management", "المالية|Finance", "الموارد البشرية|Human Resources", "المبيعات|Sales", "العمليات|Operations", "تقنية المعلومات|IT"]}'::jsonb),

    ('coa_uae_standard',   'chart_of_accounts',  'UAE Standard Chart of Accounts (simplified)',
     '{"accounts": [
        {"code": "1000", "name_ar": "الأصول", "name_en": "Assets", "type": "asset"},
        {"code": "1100", "name_ar": "النقد والبنوك", "name_en": "Cash & Banks", "type": "asset"},
        {"code": "1200", "name_ar": "الذمم المدينة", "name_en": "Accounts Receivable", "type": "asset"},
        {"code": "1300", "name_ar": "المخزون", "name_en": "Inventory", "type": "asset"},
        {"code": "1400", "name_ar": "الأصول الثابتة", "name_en": "Fixed Assets", "type": "asset"},
        {"code": "2000", "name_ar": "الالتزامات", "name_en": "Liabilities", "type": "liability"},
        {"code": "2100", "name_ar": "الذمم الدائنة", "name_en": "Accounts Payable", "type": "liability"},
        {"code": "2200", "name_ar": "القروض", "name_en": "Loans", "type": "liability"},
        {"code": "2300", "name_ar": "الضرائب المستحقة", "name_en": "Taxes Payable", "type": "liability"},
        {"code": "3000", "name_ar": "حقوق الملكية", "name_en": "Equity", "type": "equity"},
        {"code": "3100", "name_ar": "رأس المال", "name_en": "Capital", "type": "equity"},
        {"code": "3200", "name_ar": "الأرباح المحتجزة", "name_en": "Retained Earnings", "type": "equity"},
        {"code": "4000", "name_ar": "الإيرادات", "name_en": "Revenue", "type": "revenue"},
        {"code": "4100", "name_ar": "إيرادات المبيعات", "name_en": "Sales Revenue", "type": "revenue"},
        {"code": "4200", "name_ar": "إيرادات الخدمات", "name_en": "Service Revenue", "type": "revenue"},
        {"code": "5000", "name_ar": "المصروفات", "name_en": "Expenses", "type": "expense"},
        {"code": "5100", "name_ar": "الرواتب والأجور", "name_en": "Salaries & Wages", "type": "expense"},
        {"code": "5200", "name_ar": "الإيجار", "name_en": "Rent", "type": "expense"},
        {"code": "5300", "name_ar": "المرافق", "name_en": "Utilities", "type": "expense"},
        {"code": "5400", "name_ar": "مصاريف إدارية", "name_en": "Administrative Expenses", "type": "expense"},
        {"code": "5500", "name_ar": "مصاريف تسويق", "name_en": "Marketing Expenses", "type": "expense"}
     ]}'::jsonb),

    ('tax_uae_vat',        'tax_config',         'UAE VAT 5%',
     '{"taxes": [{"name": "VAT", "rate": 5.0, "country": "AE", "is_default": true}]}'::jsonb),

    ('tax_sa_vat',         'tax_config',         'Saudi Arabia VAT 15%',
     '{"taxes": [{"name": "VAT", "rate": 15.0, "country": "SA", "is_default": true}]}'::jsonb),

    ('workflows_default',  'workflows',          'Default approval workflows',
     '{"workflows": [
        {"name": "leave_approval", "steps": ["supervisor", "hr_officer", "department_manager"]},
        {"name": "expense_approval", "steps": ["supervisor", "accountant", "department_manager"]},
        {"name": "purchase_approval", "steps": ["department_manager", "accountant", "company_gm"]}
     ]}'::jsonb)
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- F. PERMISSIONS (granular permission codes)
-- =========================================================

INSERT INTO permissions (code, name_en, name_ar, category) VALUES
    -- HR
    ('hr.employees.read',           'View Employees',           'عرض الموظفين',            'hr'),
    ('hr.employees.write',          'Create/Edit Employees',    'إنشاء/تعديل الموظفين',    'hr'),
    ('hr.employees.delete',         'Delete Employees',         'حذف الموظفين',            'hr'),
    ('hr.attendance.read',          'View Attendance',          'عرض الحضور',              'hr'),
    ('hr.attendance.write',         'Manage Attendance',        'إدارة الحضور',            'hr'),
    ('hr.leave.request',            'Request Leave',            'طلب إجازة',               'hr'),
    ('hr.leave.approve',            'Approve Leave',            'اعتماد الإجازات',          'hr'),
    ('hr.payroll.read',             'View Payroll',             'عرض الرواتب',             'hr'),
    ('hr.payroll.process',          'Process Payroll',          'معالجة الرواتب',           'hr'),
    ('hr.documents.read',           'View Employee Documents',  'عرض مستندات الموظفين',     'hr'),
    ('hr.documents.write',          'Upload Documents',         'رفع المستندات',            'hr'),
    ('hr.benefits.manage',          'Manage Benefits',          'إدارة المزايا',            'hr'),
    ('hr.insurance.file',           'File Insurance Claim',     'تقديم مطالبة تأمين',       'hr'),
    ('hr.insurance.approve',        'Approve Insurance Claim',  'اعتماد مطالبات التأمين',    'hr'),
    ('hr.recruitment.manage',       'Manage Recruitment',       'إدارة التوظيف',            'hr'),
    ('hr.training.manage',          'Manage Training',          'إدارة التدريب',            'hr'),
    ('hr.training.take',            'Take Training/Exam',       'حضور التدريب/الاختبار',     'hr'),

    -- Accounting
    ('acc.coa.read',                'View Chart of Accounts',   'عرض شجرة الحسابات',        'accounting'),
    ('acc.coa.write',               'Manage Chart of Accounts', 'إدارة شجرة الحسابات',       'accounting'),
    ('acc.journal.read',            'View Journal Entries',     'عرض القيود المحاسبية',      'accounting'),
    ('acc.journal.write',           'Create Journal Entry',     'إنشاء قيد محاسبي',          'accounting'),
    ('acc.journal.post',            'Post Journal Entry',       'ترحيل القيود',              'accounting'),
    ('acc.invoices.read',           'View Invoices',            'عرض الفواتير',              'accounting'),
    ('acc.invoices.write',          'Create/Edit Invoices',     'إنشاء/تعديل الفواتير',      'accounting'),
    ('acc.invoices.send',           'Send Invoices',            'إرسال الفواتير',            'accounting'),
    ('acc.payments.read',           'View Payments',            'عرض المدفوعات',            'accounting'),
    ('acc.payments.write',          'Record Payments',          'تسجيل المدفوعات',           'accounting'),
    ('acc.receipts.write',          'Issue Receipts',           'إصدار الإيصالات',           'accounting'),
    ('acc.expenses.read',           'View Expenses',            'عرض المصروفات',            'accounting'),
    ('acc.expenses.submit',         'Submit Expense',           'تقديم مصروف',              'accounting'),
    ('acc.expenses.approve',        'Approve Expense',          'اعتماد المصروفات',          'accounting'),
    ('acc.advances.request',        'Request Advance',          'طلب سلفة',                 'accounting'),
    ('acc.advances.approve',        'Approve Advance',          'اعتماد السلف',              'accounting'),
    ('acc.tax.read',                'View Tax Settings',        'عرض إعدادات الضرائب',       'accounting'),
    ('acc.tax.write',               'Manage Tax Settings',      'إدارة إعدادات الضرائب',      'accounting'),
    ('acc.reports.read',            'View Financial Reports',   'عرض التقارير المالية',       'accounting'),
    ('acc.reports.export',          'Export Financial Data',     'تصدير البيانات المالية',     'accounting'),

    -- CRM
    ('crm.leads.read',             'View Leads',               'عرض العملاء المحتملين',      'crm'),
    ('crm.leads.write',            'Create/Edit Leads',        'إنشاء/تعديل العملاء المحتملين','crm'),
    ('crm.leads.convert',          'Convert Lead',             'تحويل العميل المحتمل',       'crm'),
    ('crm.opportunities.read',     'View Opportunities',       'عرض الفرص البيعية',          'crm'),
    ('crm.opportunities.write',    'Create/Edit Opportunities','إنشاء/تعديل الفرص',          'crm'),
    ('crm.quotes.read',            'View Quotes',              'عرض عروض الأسعار',           'crm'),
    ('crm.quotes.write',           'Create/Edit Quotes',       'إنشاء/تعديل عروض الأسعار',    'crm'),
    ('crm.quotes.approve',         'Approve Quote',            'اعتماد عرض السعر',           'crm'),
    ('crm.contracts.read',         'View Contracts',           'عرض العقود',                 'crm'),
    ('crm.contracts.write',        'Create/Edit Contracts',    'إنشاء/تعديل العقود',          'crm'),
    ('crm.clients.read',           'View Clients',             'عرض العملاء',                'crm'),
    ('crm.clients.write',          'Create/Edit Clients',      'إنشاء/تعديل العملاء',         'crm'),
    ('crm.portal.manage',          'Manage Client Portal',     'إدارة بوابة العملاء',         'crm'),

    -- Projects
    ('proj.projects.read',         'View Projects',            'عرض المشاريع',               'projects'),
    ('proj.projects.write',        'Create/Edit Projects',     'إنشاء/تعديل المشاريع',        'projects'),
    ('proj.projects.delete',       'Delete Projects',          'حذف المشاريع',               'projects'),
    ('proj.members.manage',        'Manage Project Members',   'إدارة أعضاء المشروع',         'projects'),
    ('proj.tasks.read',            'View Tasks',               'عرض المهام',                 'projects'),
    ('proj.tasks.write',           'Create/Edit Tasks',        'إنشاء/تعديل المهام',          'projects'),
    ('proj.tasks.assign',          'Assign Tasks',             'تعيين المهام',               'projects'),
    ('proj.tasks.complete',        'Complete Tasks',           'إنجاز المهام',               'projects'),
    ('proj.worklogs.read',         'View Work Logs',           'عرض سجلات العمل',            'projects'),
    ('proj.worklogs.write',        'Log Work Hours',           'تسجيل ساعات العمل',           'projects'),
    ('proj.comments.write',        'Add Task Comments',        'إضافة تعليقات على المهام',     'projects'),

    -- Store / POS / Inventory
    ('store.products.read',        'View Products',            'عرض المنتجات',               'store'),
    ('store.products.write',       'Create/Edit Products',     'إنشاء/تعديل المنتجات',        'store'),
    ('store.products.delete',      'Delete Products',          'حذف المنتجات',               'store'),
    ('store.inventory.read',       'View Inventory',           'عرض المخزون',                'store'),
    ('store.inventory.adjust',     'Adjust Inventory',         'تعديل المخزون',              'store'),
    ('store.inventory.transfer',   'Transfer Stock',           'نقل المخزون',                'store'),
    ('store.pos.open',             'Open POS Session',         'فتح جلسة نقطة بيع',          'store'),
    ('store.pos.sell',             'Process POS Sale',         'معالجة عملية بيع',            'store'),
    ('store.pos.close',            'Close POS Session',        'إغلاق جلسة نقطة بيع',        'store'),
    ('store.pos.reports',          'View POS Reports',         'عرض تقارير نقاط البيع',       'store'),
    ('store.warehouses.manage',    'Manage Warehouses',        'إدارة المستودعات',            'store'),
    ('store.orders.read',          'View Customer Orders',     'عرض طلبات العملاء',           'store'),
    ('store.orders.process',       'Process Customer Orders',  'معالجة طلبات العملاء',         'store'),

    -- Logistics
    ('logi.vehicles.read',         'View Vehicles',            'عرض المركبات',               'logistics'),
    ('logi.vehicles.write',        'Manage Vehicles',          'إدارة المركبات',              'logistics'),
    ('logi.drivers.read',          'View Drivers',             'عرض السائقين',               'logistics'),
    ('logi.drivers.write',         'Manage Drivers',           'إدارة السائقين',              'logistics'),
    ('logi.shipments.read',        'View Shipments',           'عرض الشحنات',                'logistics'),
    ('logi.shipments.write',       'Create/Update Shipments',  'إنشاء/تحديث الشحنات',         'logistics'),
    ('logi.routes.read',           'View Routes',              'عرض المسارات',               'logistics'),
    ('logi.routes.write',          'Manage Routes',            'إدارة المسارات',              'logistics'),
    ('logi.gps.read',              'View GPS Tracks',          'عرض تتبع GPS',               'logistics'),
    ('logi.geofences.manage',      'Manage Geofences',         'إدارة السياج الجغرافي',        'logistics'),
    ('logi.ping.send',             'Send Location Ping',       'إرسال موقع',                 'logistics'),

    -- Chat
    ('chat.channels.read',         'View Chat Channels',       'عرض قنوات المحادثة',          'chat'),
    ('chat.channels.write',        'Create/Manage Channels',   'إنشاء/إدارة القنوات',         'chat'),
    ('chat.messages.send',         'Send Messages',            'إرسال رسائل',                'chat'),
    ('chat.messages.delete_own',   'Delete Own Messages',      'حذف رسائلي',                 'chat'),
    ('chat.messages.delete_any',   'Delete Any Message',       'حذف أي رسالة',               'chat'),
    ('chat.presence.read',         'View Presence',            'عرض حالة التواجد',            'chat'),

    -- Meetings
    ('meet.meetings.read',         'View Meetings',            'عرض الاجتماعات',             'meetings'),
    ('meet.meetings.write',        'Create/Edit Meetings',     'إنشاء/تعديل الاجتماعات',      'meetings'),
    ('meet.meetings.cancel',       'Cancel Meeting',           'إلغاء اجتماع',               'meetings'),
    ('meet.rooms.manage',          'Manage Meeting Rooms',     'إدارة غرف الاجتماعات',        'meetings'),
    ('meet.join',                  'Join Meeting',             'الانضمام للاجتماع',            'meetings'),
    ('meet.recordings.read',       'View Recordings',          'عرض التسجيلات',              'meetings'),
    ('meet.transcripts.read',      'View Transcripts',         'عرض النصوص',                 'meetings'),
    ('meet.summaries.read',        'View AI Summaries',        'عرض الملخصات الذكية',         'meetings'),

    -- AI / RARE
    ('ai.rare.read_only',          'AI Read-Only Queries',     'استعلامات AI للقراءة فقط',     'ai'),
    ('ai.rare.suggest',            'AI Suggest Actions',       'اقتراحات AI',                'ai'),
    ('ai.rare.execute',            'AI Execute Actions',       'تنفيذ أوامر AI',              'ai'),
    ('ai.rare.sensitive',          'AI Sensitive Actions',     'عمليات AI حساسة',             'ai'),
    ('ai.rare.audit',              'View AI Audit Log',        'عرض سجل تدقيق AI',           'ai'),
    ('ai.rare.configure',          'Configure AI Agents',      'إعداد عملاء AI',              'ai'),

    -- Integrations
    ('intg.view',                  'View Integrations',        'عرض التكاملات',              'integrations'),
    ('intg.activate',              'Activate Integration',     'تفعيل تكامل',                'integrations'),
    ('intg.deactivate',            'Deactivate Integration',   'تعطيل تكامل',                'integrations'),
    ('intg.billing.read',          'View Integration Billing', 'عرض فوترة التكاملات',         'integrations'),
    ('intg.health.read',           'View Integration Health',  'عرض صحة التكاملات',           'integrations'),

    -- Platform / Founder
    ('platform.dashboard',         'View Platform Dashboard',  'عرض لوحة المنصة',            'platform'),
    ('platform.blueprints',        'Manage Blueprints',        'إدارة القوالب',              'platform'),
    ('platform.modules',           'Manage Modules Catalog',   'إدارة كتالوج الخدمات',        'platform'),
    ('platform.integrations',      'Manage Integrations Catalog','إدارة كتالوج التكاملات',     'platform'),
    ('platform.provisioning',      'View Provisioning Jobs',   'عرض وظائف التهيئة',          'platform'),
    ('platform.provisioning.retry','Retry Provisioning',       'إعادة محاولة التهيئة',        'platform'),
    ('platform.subscriptions',     'View Subscriptions',       'عرض الاشتراكات',             'platform'),
    ('platform.security',          'View Security Events',     'عرض أحداث الأمان',            'platform'),
    ('platform.support',           'Manage Support Tickets',   'إدارة تذاكر الدعم',           'platform'),
    ('platform.policies',          'Manage Platform Policies', 'إدارة سياسات المنصة',         'platform'),
    ('platform.announcements',     'Send Announcements',       'إرسال إعلانات المنصة',        'platform'),
    ('platform.reports',           'Export Platform Reports',  'تصدير تقارير المنصة',         'platform')
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- G. ROLE-PERMISSION MAPPING
-- =========================================================
-- Maps company_role enum values to permissions.
-- GM gets everything. Others get subsets.

-- G1. company_gm -> ALL company-level permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'company_gm'::company_role, p.id
FROM permissions p
WHERE p.category NOT IN ('platform')
ON CONFLICT (role, permission_id) DO NOTHING;

-- G2. executive_secretary -> same as GM minus delete + sensitive
INSERT INTO role_permissions (role, permission_id)
SELECT 'executive_secretary'::company_role, p.id
FROM permissions p
WHERE p.category NOT IN ('platform')
  AND p.code NOT LIKE '%.delete%'
  AND p.code != 'ai.rare.sensitive'
  AND p.code != 'ai.rare.configure'
ON CONFLICT (role, permission_id) DO NOTHING;

-- G3. department_manager -> department-scoped write + read
INSERT INTO role_permissions (role, permission_id)
SELECT 'department_manager'::company_role, p.id
FROM permissions p
WHERE p.code IN (
    'hr.employees.read', 'hr.employees.write', 'hr.attendance.read', 'hr.attendance.write',
    'hr.leave.request', 'hr.leave.approve', 'hr.documents.read', 'hr.documents.write',
    'hr.recruitment.manage', 'hr.training.manage', 'hr.training.take',
    'acc.invoices.read', 'acc.expenses.read', 'acc.expenses.submit', 'acc.expenses.approve',
    'acc.advances.request',
    'crm.leads.read', 'crm.leads.write', 'crm.opportunities.read', 'crm.opportunities.write',
    'crm.quotes.read', 'crm.quotes.write', 'crm.quotes.approve',
    'crm.contracts.read', 'crm.contracts.write', 'crm.clients.read', 'crm.portal.manage',
    'proj.projects.read', 'proj.projects.write', 'proj.members.manage',
    'proj.tasks.read', 'proj.tasks.write', 'proj.tasks.assign', 'proj.tasks.complete',
    'proj.worklogs.read', 'proj.worklogs.write', 'proj.comments.write',
    'store.products.read', 'store.products.write', 'store.inventory.read',
    'store.inventory.adjust', 'store.inventory.transfer', 'store.orders.read', 'store.orders.process',
    'logi.vehicles.read', 'logi.vehicles.write', 'logi.drivers.read', 'logi.drivers.write',
    'logi.shipments.read', 'logi.shipments.write', 'logi.routes.read', 'logi.routes.write',
    'logi.gps.read', 'logi.geofences.manage',
    'chat.channels.read', 'chat.channels.write', 'chat.messages.send',
    'chat.messages.delete_own', 'chat.messages.delete_any', 'chat.presence.read',
    'meet.meetings.read', 'meet.meetings.write', 'meet.meetings.cancel', 'meet.join',
    'meet.recordings.read', 'meet.transcripts.read', 'meet.summaries.read',
    'ai.rare.read_only', 'ai.rare.suggest', 'ai.rare.execute',
    'intg.view', 'intg.health.read'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- G4. supervisor -> department-scoped read + limited write
INSERT INTO role_permissions (role, permission_id)
SELECT 'supervisor'::company_role, p.id
FROM permissions p
WHERE p.code IN (
    'hr.employees.read', 'hr.attendance.read', 'hr.attendance.write',
    'hr.leave.request', 'hr.leave.approve', 'hr.documents.read', 'hr.training.take',
    'acc.expenses.read', 'acc.expenses.submit', 'acc.expenses.approve', 'acc.advances.request',
    'crm.leads.read', 'crm.leads.write', 'crm.opportunities.read', 'crm.opportunities.write',
    'crm.quotes.read', 'crm.quotes.write', 'crm.contracts.read', 'crm.clients.read',
    'proj.projects.read', 'proj.tasks.read', 'proj.tasks.write', 'proj.tasks.assign',
    'proj.tasks.complete', 'proj.worklogs.read', 'proj.worklogs.write', 'proj.comments.write',
    'store.products.read', 'store.inventory.read', 'store.orders.read', 'store.orders.process',
    'logi.vehicles.read', 'logi.drivers.read', 'logi.shipments.read', 'logi.shipments.write',
    'logi.routes.read', 'logi.gps.read',
    'chat.channels.read', 'chat.messages.send', 'chat.messages.delete_own', 'chat.presence.read',
    'meet.meetings.read', 'meet.meetings.write', 'meet.meetings.cancel', 'meet.join',
    'meet.recordings.read', 'meet.transcripts.read', 'meet.summaries.read',
    'ai.rare.read_only', 'ai.rare.suggest'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- G5. employee -> self-scoped read + basic write
INSERT INTO role_permissions (role, permission_id)
SELECT 'employee'::company_role, p.id
FROM permissions p
WHERE p.code IN (
    'hr.leave.request', 'hr.documents.write', 'hr.insurance.file', 'hr.training.take',
    'acc.expenses.submit', 'acc.advances.request',
    'proj.projects.read', 'proj.tasks.read', 'proj.tasks.complete',
    'proj.worklogs.read', 'proj.worklogs.write', 'proj.comments.write',
    'store.products.read', 'store.inventory.read',
    'chat.channels.read', 'chat.messages.send', 'chat.messages.delete_own', 'chat.presence.read',
    'meet.meetings.read', 'meet.meetings.write', 'meet.join',
    'meet.recordings.read', 'meet.transcripts.read', 'meet.summaries.read',
    'ai.rare.read_only', 'ai.rare.suggest'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- G6. senior_employee -> employee + some extra write
INSERT INTO role_permissions (role, permission_id)
SELECT 'senior_employee'::company_role, p.id
FROM permissions p
WHERE p.code IN (
    'hr.leave.request', 'hr.documents.write', 'hr.insurance.file', 'hr.training.take',
    'acc.expenses.submit', 'acc.advances.request',
    'crm.leads.read', 'crm.leads.write', 'crm.opportunities.read',
    'proj.projects.read', 'proj.tasks.read', 'proj.tasks.write', 'proj.tasks.complete',
    'proj.worklogs.read', 'proj.worklogs.write', 'proj.comments.write',
    'store.products.read', 'store.inventory.read',
    'chat.channels.read', 'chat.messages.send', 'chat.messages.delete_own', 'chat.presence.read',
    'meet.meetings.read', 'meet.meetings.write', 'meet.join',
    'meet.recordings.read', 'meet.transcripts.read', 'meet.summaries.read',
    'ai.rare.read_only', 'ai.rare.suggest'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- G7. accountant -> full accounting + limited view elsewhere
INSERT INTO role_permissions (role, permission_id)
SELECT 'accountant'::company_role, p.id
FROM permissions p
WHERE p.code LIKE 'acc.%'
   OR p.code IN (
    'hr.payroll.read', 'hr.leave.request', 'hr.documents.write', 'hr.training.take',
    'crm.clients.read', 'crm.quotes.read', 'crm.contracts.read',
    'store.products.read', 'store.inventory.read', 'store.pos.reports', 'store.pos.close',
    'logi.vehicles.read',
    'chat.channels.read', 'chat.messages.send', 'chat.messages.delete_own', 'chat.presence.read',
    'meet.meetings.read', 'meet.join',
    'intg.view', 'intg.billing.read', 'intg.activate',
    'ai.rare.read_only', 'ai.rare.suggest', 'ai.rare.execute'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- G8. hr_officer -> full HR + limited elsewhere
INSERT INTO role_permissions (role, permission_id)
SELECT 'hr_officer'::company_role, p.id
FROM permissions p
WHERE p.code LIKE 'hr.%'
   OR p.code IN (
    'acc.expenses.submit', 'acc.advances.request',
    'chat.channels.read', 'chat.messages.send', 'chat.messages.delete_own', 'chat.presence.read',
    'meet.meetings.read', 'meet.join',
    'intg.view', 'intg.health.read',
    'ai.rare.read_only', 'ai.rare.suggest', 'ai.rare.execute'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- G9. sales_rep -> CRM focus
INSERT INTO role_permissions (role, permission_id)
SELECT 'sales_rep'::company_role, p.id
FROM permissions p
WHERE p.code IN (
    'crm.leads.read', 'crm.leads.write',
    'crm.opportunities.read', 'crm.opportunities.write',
    'crm.quotes.read', 'crm.quotes.write',
    'crm.contracts.read', 'crm.clients.read', 'crm.clients.write',
    'store.products.read', 'store.pos.sell', 'store.orders.read', 'store.orders.process',
    'hr.leave.request', 'hr.documents.write', 'hr.training.take',
    'acc.expenses.submit',
    'chat.channels.read', 'chat.messages.send', 'chat.messages.delete_own', 'chat.presence.read',
    'meet.meetings.read', 'meet.join',
    'ai.rare.read_only', 'ai.rare.suggest'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- G10. driver -> logistics focus + self
INSERT INTO role_permissions (role, permission_id)
SELECT 'driver'::company_role, p.id
FROM permissions p
WHERE p.code IN (
    'logi.shipments.read', 'logi.shipments.write', 'logi.routes.read',
    'logi.gps.read', 'logi.ping.send',
    'hr.leave.request', 'hr.documents.write', 'hr.training.take',
    'chat.channels.read', 'chat.messages.send', 'chat.messages.delete_own',
    'ai.rare.read_only'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- G11. field_employee -> location + tasks
INSERT INTO role_permissions (role, permission_id)
SELECT 'field_employee'::company_role, p.id
FROM permissions p
WHERE p.code IN (
    'logi.gps.read', 'logi.ping.send',
    'proj.projects.read', 'proj.tasks.read', 'proj.tasks.complete',
    'proj.worklogs.read', 'proj.worklogs.write', 'proj.comments.write',
    'hr.leave.request', 'hr.documents.write', 'hr.training.take',
    'chat.channels.read', 'chat.messages.send', 'chat.messages.delete_own',
    'ai.rare.read_only'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- G12. trainee -> minimal read + training
INSERT INTO role_permissions (role, permission_id)
SELECT 'trainee'::company_role, p.id
FROM permissions p
WHERE p.code IN (
    'hr.leave.request', 'hr.training.take',
    'proj.projects.read', 'proj.tasks.read',
    'chat.channels.read', 'chat.messages.send', 'chat.messages.delete_own',
    'meet.meetings.read', 'meet.join',
    'ai.rare.read_only'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- G13. new_hire -> same as trainee
INSERT INTO role_permissions (role, permission_id)
SELECT 'new_hire'::company_role, p.id
FROM permissions p
WHERE p.code IN (
    'hr.leave.request', 'hr.documents.write', 'hr.training.take',
    'proj.projects.read', 'proj.tasks.read',
    'chat.channels.read', 'chat.messages.send', 'chat.messages.delete_own',
    'meet.meetings.read', 'meet.join',
    'ai.rare.read_only'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- G14. client_user -> client portal only
INSERT INTO role_permissions (role, permission_id)
SELECT 'client_user'::company_role, p.id
FROM permissions p
WHERE p.code IN (
    'crm.contracts.read', 'crm.quotes.read',
    'acc.invoices.read', 'acc.payments.read',
    'proj.projects.read', 'proj.tasks.read',
    'store.orders.read',
    'ai.rare.read_only'
)
ON CONFLICT (role, permission_id) DO NOTHING;


-- =========================================================
-- H. SUBSCRIPTION PLANS (base plans)
-- =========================================================

INSERT INTO subscription_plans (code, name_ar, name_en, price_monthly, price_yearly, currency, max_users, features, sort_order) VALUES
    ('starter',    'المبتدئ',    'Starter',      99,    999,   'AED', 5,
     '{"modules_limit": 4, "storage_gb": 5, "ai_queries_month": 100}'::jsonb,  10),
    ('business',   'الأعمال',    'Business',     299,   2990,  'AED', 25,
     '{"modules_limit": 10, "storage_gb": 50, "ai_queries_month": 1000, "integrations_limit": 3}'::jsonb, 20),
    ('enterprise', 'المؤسسات',   'Enterprise',   799,   7990,  'AED', NULL,
     '{"modules_limit": null, "storage_gb": 500, "ai_queries_month": 10000, "integrations_limit": null, "priority_support": true}'::jsonb, 30)
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- I. PRICING ADD-ONS
-- =========================================================

INSERT INTO pricing_addons (code, name_ar, name_en, addon_type, price_monthly, price_per_unit, unit_label, sort_order) VALUES
    ('extra_seats',      'مقاعد إضافية',       'Extra Seats',           'seats',       0,   15,  'per user/month',       10),
    ('extra_storage',    'تخزين إضافي',        'Extra Storage',         'storage',     0,   10,  'per 10 GB/month',      20),
    ('ai_extra',         'استخدام AI إضافي',    'Extra AI Usage',        'ai_usage',    0,   50,  'per 1000 queries',     30),
    ('store_addon',      'متجر ونقاط بيع',     'Store & POS Module',    'module',      49,  0,   '',                     40),
    ('logistics_addon',  'لوجستيات',           'Logistics Module',      'module',      69,  0,   '',                     50),
    ('recruitment_addon','توظيف',              'Recruitment Module',    'module',      29,  0,   '',                     60),
    ('training_addon',   'تدريب',              'Training Module',       'module',      29,  0,   '',                     70),
    ('analytics_addon',  'تحليلات متقدمة',     'Advanced Analytics',    'module',      99,  0,   '',                     80),
    ('automation_addon', 'أتمتة',              'Automation & Workflows','module',      79,  0,   '',                     90),
    ('priority_support', 'دعم أولوية',         'Priority Support',      'support',     149, 0,   '',                    100)
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- J. INTEGRATIONS CATALOG (initial entries)
-- =========================================================

INSERT INTO integrations_catalog (code, name, category, provider, pricing_model, setup_mode, webhook_support) VALUES
    ('stripe',           'Stripe Payments',          'payments',       'stripe',   'usage',      'self-connect',     true),
    ('apple_pay',        'Apple Pay',                'payments',       'apple',    'usage',      'admin-connect',    true),
    ('google_pay',       'Google Pay',               'payments',       'google',   'usage',      'admin-connect',    true),
    ('google_ads',       'Google Ads',               'marketing',      'google',   'commission', 'self-connect',     true),
    ('meta_ads',         'Meta Ads (FB/IG)',         'marketing',      'meta',     'commission', 'self-connect',     true),
    ('whatsapp_api',     'WhatsApp Business API',    'marketing',      'meta',     'usage',      'admin-connect',    true),
    ('email_marketing',  'Email Marketing',          'marketing',      'zien',     'usage',      'managed-by-zien',  false),
    ('supabase_storage', 'Supabase Storage',         'storage',        'supabase', 'usage',      'managed-by-zien',  false),
    ('cloudflare_r2',    'Cloudflare R2 Storage',    'storage',        'cloudflare','usage',     'managed-by-zien',  false),
    ('vonage',           'Vonage Video/Voice',       'communications', 'vonage',   'usage',      'self-connect',     true),
    ('google_maps',      'Google Maps Platform',     'maps',           'google',   'usage',      'self-connect',     false),
    ('gps_tracking',     'GPS Fleet Tracking',       'maps',           'zien',     'fixed',      'managed-by-zien',  false),
    ('ai_openai',        'OpenAI (RARE AI Backend)', 'ai',             'openai',   'usage',      'managed-by-zien',  false)
ON CONFLICT (code) DO NOTHING;


-- ============================================================================
-- End of SEED_BASE
-- ============================================================================
