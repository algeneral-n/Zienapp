-- ============================================================================
-- ZIEN Platform - Core Seed Data
-- Migration: 00003_seed_core.sql
-- Date: 2026-02-24
-- Description: Subscription plans, modules catalog, permissions, role mappings
-- ============================================================================

-- =========================
-- 1. SUBSCRIPTION PLANS
-- =========================

INSERT INTO subscription_plans (code, name_ar, name_en, price_monthly, price_yearly, currency, max_users, max_usage_per_service, features, sort_order)
VALUES
    ('free',       'مجاني',    'Free',       0,     0,     'AED', 3,    50,   '{"modules": ["core"], "support": "community"}', 1),
    ('starter',    'مبتدئ',    'Starter',    99,    990,   'AED', 10,   500,  '{"modules": ["core", "addon"], "support": "email", "ai_queries": 100}', 2),
    ('pro',        'احترافي',  'Pro',        249,   2490,  'AED', 50,   2000, '{"modules": ["core", "addon", "premium"], "support": "priority", "ai_queries": 500}', 3),
    ('enterprise', 'مؤسسي',    'Enterprise', 499,   4990,  'AED', NULL, NULL, '{"modules": ["core", "addon", "premium"], "support": "dedicated", "ai_queries": -1, "custom_branding": true}', 4),
    ('custom',     'مخصص',     'Custom',     0,     0,     'AED', NULL, NULL, '{"modules": ["core", "addon", "premium"], "support": "dedicated", "ai_queries": -1, "custom_branding": true, "white_label": true}', 5)
ON CONFLICT (code) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    max_users = EXCLUDED.max_users,
    max_usage_per_service = EXCLUDED.max_usage_per_service,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order;

-- =========================
-- 2. MODULES CATALOG
-- =========================

INSERT INTO modules_catalog (code, name_ar, name_en, description_en, icon, tier, dependencies, sort_order)
VALUES
    ('dashboard',    'لوحة التحكم',     'Dashboard',           'Main overview and KPIs',            'LayoutDashboard',  'core',    '[]',               1),
    ('hr',           'الموارد البشرية',  'HR',                  'Human resources management',        'Users',            'core',    '[]',               2),
    ('accounting',   'المحاسبة',         'Accounting',          'Financial accounts and reporting',   'Calculator',       'core',    '[]',               3),
    ('crm',          'إدارة العملاء',    'CRM',                 'Customer relationship management',  'UserCheck',        'addon',   '[]',               4),
    ('inventory',    'المخزون',          'Inventory',           'Stock and warehouse management',    'Package',          'addon',   '[]',               5),
    ('logistics',    'اللوجستيات',       'Logistics',           'Fleet and delivery management',     'Truck',            'addon',   '["inventory"]',    6),
    ('projects',     'المشاريع',         'Projects',            'Project planning and tracking',     'Briefcase',        'addon',   '[]',               7),
    ('academy',      'الأكاديمية',       'Academy',             'Learning and training platform',    'GraduationCap',    'premium', '["hr"]',           8),
    ('ai_assistant', 'مساعد RARE',       'RARE AI Assistant',   'AI-powered business intelligence',  'Bot',              'premium', '[]',               9),
    ('communication','التواصل',          'Communication',       'Chat, meetings, and notifications', 'MessageSquare',    'core',    '[]',              10),
    ('documents',    'المستندات',        'Documents',           'Document management and storage',   'FileText',         'core',    '[]',              11)
ON CONFLICT (code) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    description_en = EXCLUDED.description_en,
    icon = EXCLUDED.icon,
    tier = EXCLUDED.tier,
    dependencies = EXCLUDED.dependencies,
    sort_order = EXCLUDED.sort_order;

-- =========================
-- 3. PERMISSIONS
-- =========================

INSERT INTO permissions (code, name_en, name_ar, category)
VALUES
    -- Company management
    ('company.read',           'View company details',          'عرض تفاصيل الشركة',       'company'),
    ('company.update',         'Update company settings',       'تعديل إعدادات الشركة',     'company'),
    ('company.delete',         'Delete company',                'حذف الشركة',               'company'),
    -- Members
    ('members.read',           'View team members',             'عرض أعضاء الفريق',         'members'),
    ('members.invite',         'Invite new members',            'دعوة أعضاء جدد',           'members'),
    ('members.update',         'Update member role/status',      'تعديل دور/حالة العضو',    'members'),
    ('members.remove',         'Remove members',                'إزالة أعضاء',              'members'),
    -- Departments
    ('departments.manage',     'Create/edit departments',        'إدارة الأقسام',            'departments'),
    -- Modules
    ('modules.read',           'View active modules',           'عرض الوحدات النشطة',       'modules'),
    ('modules.manage',         'Activate/deactivate modules',   'إدارة الوحدات',            'modules'),
    -- Billing
    ('billing.read',           'View subscription & invoices',  'عرض الاشتراك والفواتير',    'billing'),
    ('billing.manage',         'Manage subscription & payments', 'إدارة الاشتراك والمدفوعات', 'billing'),
    -- HR
    ('hr.read',                'View employee records',         'عرض سجلات الموظفين',       'hr'),
    ('hr.manage',              'Manage HR records',             'إدارة سجلات الموارد البشرية', 'hr'),
    ('payroll.read',           'View payroll data',             'عرض بيانات الرواتب',        'hr'),
    ('payroll.manage',         'Process payroll',               'معالجة الرواتب',            'hr'),
    -- CRM
    ('crm.read',               'View clients & quotes',         'عرض العملاء والعروض',       'crm'),
    ('crm.manage',             'Manage CRM data',              'إدارة بيانات العملاء',      'crm'),
    -- Accounting
    ('accounting.read',        'View invoices & payments',      'عرض الفواتير والمدفوعات',   'accounting'),
    ('accounting.manage',      'Create/edit invoices',          'إنشاء/تعديل الفواتير',     'accounting'),
    -- Logistics
    ('logistics.read',         'View vehicles & tasks',         'عرض المركبات والمهام',      'logistics'),
    ('logistics.manage',       'Manage fleet & deliveries',     'إدارة الأسطول والتوصيل',    'logistics'),
    -- Projects
    ('projects.read',          'View projects',                 'عرض المشاريع',             'projects'),
    ('projects.manage',        'Manage projects',               'إدارة المشاريع',            'projects'),
    -- Documents
    ('documents.read',         'View documents',                'عرض المستندات',             'documents'),
    ('documents.manage',       'Upload/manage documents',       'رفع/إدارة المستندات',       'documents'),
    -- AI
    ('ai.use',                 'Use AI assistant',              'استخدام المساعد الذكي',      'ai'),
    ('ai.reports',             'View AI reports',               'عرض تقارير الذكاء الاصطناعي', 'ai'),
    -- Audit
    ('audit.read',             'View audit logs',               'عرض سجلات المراجعة',        'audit'),
    -- Settings
    ('settings.branding',      'Manage company branding',       'إدارة هوية الشركة',         'settings'),
    ('settings.features',      'Manage feature flags',          'إدارة الميزات',             'settings')
ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_ar = EXCLUDED.name_ar,
    category = EXCLUDED.category;

-- =========================
-- 4. ROLE-PERMISSION MAPPING
-- =========================

-- company_gm gets ALL permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'company_gm'::company_role, id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- executive_secretary gets most except delete/billing manage
INSERT INTO role_permissions (role, permission_id)
SELECT 'executive_secretary'::company_role, id FROM permissions
WHERE code NOT IN ('company.delete', 'billing.manage')
ON CONFLICT (role, permission_id) DO NOTHING;

-- department_manager gets operational + read permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'department_manager'::company_role, id FROM permissions
WHERE code IN (
    'company.read', 'members.read', 'departments.manage', 'modules.read',
    'billing.read', 'hr.read', 'hr.manage', 'payroll.read',
    'crm.read', 'crm.manage', 'accounting.read', 'accounting.manage',
    'logistics.read', 'logistics.manage',
    'projects.read', 'projects.manage',
    'documents.read', 'documents.manage',
    'ai.use', 'ai.reports', 'audit.read'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- supervisor gets team-level read + limited write
INSERT INTO role_permissions (role, permission_id)
SELECT 'supervisor'::company_role, id FROM permissions
WHERE code IN (
    'company.read', 'members.read', 'modules.read',
    'hr.read', 'crm.read', 'crm.manage',
    'accounting.read', 'accounting.manage',
    'logistics.read', 'logistics.manage',
    'projects.read', 'projects.manage',
    'documents.read', 'documents.manage',
    'ai.use'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- employee gets basic read + self-service
INSERT INTO role_permissions (role, permission_id)
SELECT 'employee'::company_role, id FROM permissions
WHERE code IN (
    'company.read', 'members.read', 'modules.read',
    'hr.read', 'crm.read',
    'accounting.read', 'logistics.read',
    'projects.read', 'documents.read',
    'ai.use'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- client_user gets minimal external read
INSERT INTO role_permissions (role, permission_id)
SELECT 'client_user'::company_role, id FROM permissions
WHERE code IN (
    'company.read', 'projects.read', 'documents.read'
)
ON CONFLICT (role, permission_id) DO NOTHING;
