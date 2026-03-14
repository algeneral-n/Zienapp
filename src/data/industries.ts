/**
 * ZIEN Platform — Comprehensive Industries & Activities Data
 * 13 industry sectors with sub-activities, module recommendations, and bilingual content
 */

import {
    Store, Factory, Briefcase, HardHat, Home, Utensils,
    Landmark, Shield, Truck, Heart, Building2, Users,
    Bus, Package, Scale, Stethoscope, GraduationCap,
    Hammer, Warehouse, ShoppingCart, Coffee, Banknote,
    Globe, FileText, Wrench, Boxes, Ship, Plane,
    type LucideIcon,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────

export interface SubActivity {
    code: string;
    nameEn: string;
    nameAr: string;
}

export interface IndustrySector {
    code: string;
    nameEn: string;
    nameAr: string;
    descEn: string;
    descAr: string;
    icon: LucideIcon;
    color: string;            // Tailwind color class prefix (e.g. 'blue', 'emerald')
    subActivities: SubActivity[];
    recommendedModules: string[];
    defaultPlan: string;
}

// ─── Module Catalog (expanded) ──────────────────────────────────────────

export interface ModuleDef {
    code: string;
    nameEn: string;
    nameAr: string;
    descEn: string;
    descAr: string;
    category: 'core' | 'addon' | 'premium';
    icon: LucideIcon;
}

export const MODULE_CATALOG: ModuleDef[] = [
    // Core
    { code: 'hr', nameEn: 'HR & Employees', nameAr: 'الموارد البشرية', descEn: 'Employee management, attendance, leave, contracts', descAr: 'إدارة الموظفين والحضور والإجازات والعقود', category: 'core', icon: Users },
    { code: 'accounting', nameEn: 'Accounting & Finance', nameAr: 'المحاسبة والمالية', descEn: 'General ledger, invoicing, tax, financial reports', descAr: 'دفتر الأستاذ والفواتير والضرائب والتقارير المالية', category: 'core', icon: Banknote },
    { code: 'crm', nameEn: 'CRM & Sales', nameAr: 'إدارة العملاء والمبيعات', descEn: 'Pipeline, leads, contacts, deals management', descAr: 'إدارة خط الأنابيب والعملاء المحتملين والصفقات', category: 'core', icon: Briefcase },
    { code: 'projects', nameEn: 'Project Management', nameAr: 'إدارة المشاريع', descEn: 'Tasks, milestones, Gantt charts, team collaboration', descAr: 'المهام والمعالم ومخططات جانت والتعاون', category: 'core', icon: FileText },
    { code: 'chat', nameEn: 'Team Chat', nameAr: 'الدردشة الجماعية', descEn: 'Real-time messaging, channels, file sharing', descAr: 'المراسلة الفورية والقنوات ومشاركة الملفات', category: 'core', icon: Globe },
    { code: 'meetings', nameEn: 'Meetings', nameAr: 'الاجتماعات', descEn: 'Video calls, scheduling, AI summaries', descAr: 'مكالمات الفيديو والجدولة وملخصات الذكاء الاصطناعي', category: 'core', icon: Users },
    { code: 'documents', nameEn: 'Documents', nameAr: 'المستندات', descEn: 'Document management, templates, approvals', descAr: 'إدارة المستندات والقوالب والموافقات', category: 'core', icon: FileText },

    // Addon
    { code: 'store', nameEn: 'Store & POS', nameAr: 'المتجر ونقاط البيع', descEn: 'E-commerce, point-of-sale, product catalog', descAr: 'التجارة الإلكترونية ونقاط البيع وكتالوج المنتجات', category: 'addon', icon: ShoppingCart },
    { code: 'inventory', nameEn: 'Inventory & Warehouse', nameAr: 'المخزون والمستودعات', descEn: 'Stock tracking, warehouse management, transfers', descAr: 'تتبع المخزون وإدارة المستودعات والتحويلات', category: 'addon', icon: Warehouse },
    { code: 'logistics', nameEn: 'Logistics & Fleet', nameAr: 'اللوجستيات والأسطول', descEn: 'Fleet tracking, dispatching, delivery management', descAr: 'تتبع الأسطول والإرسال وإدارة التوصيل', category: 'addon', icon: Truck },
    { code: 'recruitment', nameEn: 'Recruitment', nameAr: 'التوظيف', descEn: 'Job postings, applicant tracking, hiring workflow', descAr: 'الإعلانات الوظيفية وتتبع المتقدمين وسير التوظيف', category: 'addon', icon: Users },
    { code: 'training', nameEn: 'Training & Academy', nameAr: 'التدريب والأكاديمية', descEn: 'LMS, courses, certifications, skill tracking', descAr: 'نظام إدارة التعلم والدورات والشهادات', category: 'addon', icon: GraduationCap },
    { code: 'client_portal', nameEn: 'Client Portal', nameAr: 'بوابة العملاء', descEn: 'Customer self-service, tickets, invoices', descAr: 'الخدمة الذاتية للعملاء والتذاكر والفواتير', category: 'addon', icon: Globe },
    { code: 'employee_portal', nameEn: 'Employee Portal', nameAr: 'بوابة الموظف', descEn: 'Self-service HR requests, payslips, leave', descAr: 'طلبات الخدمة الذاتية وكشوف الرواتب والإجازات', category: 'addon', icon: Users },

    // Premium
    { code: 'rare', nameEn: 'RARE AI Agents', nameAr: 'وكلاء RARE AI', descEn: '24 AI agents for every department', descAr: '24 وكيل ذكاء اصطناعي لكل قسم', category: 'premium', icon: Shield },
    { code: 'analytics', nameEn: 'Advanced Analytics', nameAr: 'التحليلات المتقدمة', descEn: 'BI dashboards, custom reports, predictive insights', descAr: 'لوحات ذكاء الأعمال والتقارير المخصصة', category: 'premium', icon: Banknote },
    { code: 'automation', nameEn: 'Workflow Automation', nameAr: 'أتمتة سير العمل', descEn: 'Custom workflows, triggers, approvals', descAr: 'سير عمل مخصص ومشغلات وموافقات', category: 'premium', icon: Wrench },
    { code: 'control_room', nameEn: 'Control Room', nameAr: 'غرفة التحكم', descEn: 'Real-time operations dashboard, KPIs, alerts', descAr: 'لوحة العمليات الحية ومؤشرات الأداء والتنبيهات', category: 'premium', icon: Shield },
    { code: 'integrations', nameEn: 'Integrations Hub', nameAr: 'مركز التكاملات', descEn: 'API gateway, third-party connectors, webhooks', descAr: 'بوابة API وموصلات الطرف الثالث', category: 'addon', icon: Boxes },
];

// ─── 13 Industry Sectors ────────────────────────────────────────────────

export const INDUSTRY_SECTORS: IndustrySector[] = [
    // 1. Commercial / Trading
    {
        code: 'commercial',
        nameEn: 'Commercial & Trading',
        nameAr: 'الشركات التجارية',
        descEn: 'General trading, wholesale & retail distribution across all commodity types',
        descAr: 'التجارة العامة والتوزيع بالجملة والتجزئة لجميع أنواع السلع',
        icon: Store,
        color: 'blue',
        subActivities: [
            { code: 'building_materials', nameEn: 'Building Materials Trading', nameAr: 'تجارة مواد البناء' },
            { code: 'food_trading', nameEn: 'Food & Beverage Trading', nameAr: 'تجارة المواد الغذائية' },
            { code: 'electronics_trading', nameEn: 'Electronics Trading', nameAr: 'تجارة الإلكترونيات' },
            { code: 'auto_trading', nameEn: 'Automobiles & Spare Parts', nameAr: 'تجارة السيارات وقطع الغيار' },
            { code: 'electrical_appliances', nameEn: 'Electrical Appliances', nameAr: 'تجارة الأجهزة الكهربائية' },
            { code: 'furniture_trading', nameEn: 'Furniture Trading', nameAr: 'تجارة الأثاث' },
            { code: 'textiles_fashion', nameEn: 'Textiles & Fashion', nameAr: 'تجارة الملابس والأقمشة' },
            { code: 'chemicals_trading', nameEn: 'Chemicals Trading', nameAr: 'تجارة المواد الكيماوية' },
            { code: 'grains_trading', nameEn: 'Grains & Agricultural Products', nameAr: 'تجارة الحبوب والمنتجات الزراعية' },
            { code: 'medical_equipment', nameEn: 'Medical Equipment Trading', nameAr: 'تجارة الأجهزة الطبية' },
        ],
        recommendedModules: ['hr', 'accounting', 'crm', 'store', 'inventory', 'logistics', 'integrations', 'rare', 'analytics'],
        defaultPlan: 'pro',
    },

    // 2. Industrial / Manufacturing
    {
        code: 'industrial',
        nameEn: 'Industrial & Manufacturing',
        nameAr: 'الشركات الصناعية',
        descEn: 'Factories, production lines, heavy & light manufacturing across all sectors',
        descAr: 'المصانع وخطوط الإنتاج والصناعات الثقيلة والخفيفة في جميع القطاعات',
        icon: Factory,
        color: 'orange',
        subActivities: [
            { code: 'food_manufacturing', nameEn: 'Food Manufacturing', nameAr: 'صناعة الأغذية' },
            { code: 'heavy_industry', nameEn: 'Heavy Industry & Steel', nameAr: 'الصناعات الثقيلة والحديد' },
            { code: 'plastics', nameEn: 'Plastics Manufacturing', nameAr: 'صناعة البلاستيك' },
            { code: 'aluminum', nameEn: 'Aluminum Industry', nameAr: 'صناعة الألمنيوم' },
            { code: 'cement', nameEn: 'Cement & Building Materials', nameAr: 'صناعة الأسمنت ومواد البناء' },
            { code: 'textiles_mfg', nameEn: 'Textile Manufacturing', nameAr: 'صناعة النسيج' },
            { code: 'chemicals_mfg', nameEn: 'Chemical Manufacturing', nameAr: 'الصناعات الكيماوية' },
            { code: 'electronics_mfg', nameEn: 'Electronics Assembly', nameAr: 'تجميع الإلكترونيات' },
            { code: 'ceramics', nameEn: 'Ceramics & Glass', nameAr: 'صناعة السيراميك والزجاج' },
            { code: 'pharmaceuticals', nameEn: 'Pharmaceuticals', nameAr: 'صناعة الأدوية' },
        ],
        recommendedModules: ['hr', 'accounting', 'inventory', 'projects', 'logistics', 'control_room', 'automation', 'integrations', 'rare', 'analytics'],
        defaultPlan: 'business',
    },

    // 3. Services & Professional
    {
        code: 'professional_services',
        nameEn: 'Services & Professional',
        nameAr: 'الشركات الخدمية والمهنية',
        descEn: 'Consulting, law firms, accounting offices, IT services, and specialized professionals',
        descAr: 'الاستشارات ومكاتب المحاماة والمحاسبة وخدمات تكنولوجيا المعلومات والمتخصصين',
        icon: Briefcase,
        color: 'violet',
        subActivities: [
            { code: 'engineering_consulting', nameEn: 'Engineering Consulting', nameAr: 'الاستشارات الهندسية' },
            { code: 'legal_services', nameEn: 'Law Firms & Legal Services', nameAr: 'المحاماة والخدمات القانونية' },
            { code: 'accounting_services', nameEn: 'Accounting & Audit Firms', nameAr: 'مكاتب المحاسبة والتدقيق' },
            { code: 'it_services', nameEn: 'IT & Technology Services', nameAr: 'خدمات تكنولوجيا المعلومات' },
            { code: 'marketing_services', nameEn: 'Marketing & Advertising', nameAr: 'التسويق والإعلان' },
            { code: 'design_services', nameEn: 'Design & Architecture', nameAr: 'التصميم والهندسة المعمارية' },
            { code: 'training_services', nameEn: 'Training & Coaching', nameAr: 'التدريب والتطوير' },
            { code: 'management_consulting', nameEn: 'Management Consulting', nameAr: 'الاستشارات الإدارية' },
            { code: 'healthcare_services', nameEn: 'Healthcare Services', nameAr: 'الخدمات الصحية' },
            { code: 'education_services', nameEn: 'Educational Institutions', nameAr: 'المؤسسات التعليمية' },
        ],
        recommendedModules: ['hr', 'accounting', 'crm', 'projects', 'documents', 'client_portal', 'meetings', 'rare', 'analytics'],
        defaultPlan: 'pro',
    },

    // 4. Construction & Contracting
    {
        code: 'construction',
        nameEn: 'Construction & Contracting',
        nameAr: 'شركات المقاولات',
        descEn: 'Building construction, infrastructure projects, and specialized contracting services',
        descAr: 'بناء المباني ومشاريع البنية التحتية وخدمات المقاولات المتخصصة',
        icon: HardHat,
        color: 'amber',
        subActivities: [
            { code: 'building_construction', nameEn: 'Building Construction', nameAr: 'بناء المباني' },
            { code: 'road_construction', nameEn: 'Roads & Bridges', nameAr: 'الطرق والجسور' },
            { code: 'infrastructure', nameEn: 'Infrastructure Projects', nameAr: 'مشاريع البنية التحتية' },
            { code: 'electromechanical', nameEn: 'Electromechanical', nameAr: 'الكهروميكانيك' },
            { code: 'finishing', nameEn: 'Finishing & Interior', nameAr: 'التشطيبات والديكور' },
            { code: 'excavation', nameEn: 'Excavation & Earthworks', nameAr: 'الحفر وأعمال التربة' },
            { code: 'plumbing', nameEn: 'Plumbing & HVAC', nameAr: 'السباكة والتكييف' },
            { code: 'structural_steel', nameEn: 'Structural Steel', nameAr: 'الهياكل المعدنية' },
        ],
        recommendedModules: ['hr', 'accounting', 'projects', 'inventory', 'logistics', 'control_room', 'documents', 'automation', 'rare', 'analytics'],
        defaultPlan: 'business',
    },

    // 5. Real Estate
    {
        code: 'real_estate',
        nameEn: 'Real Estate',
        nameAr: 'شركات العقارات',
        descEn: 'Property sales, purchases, development, management, rental, and valuation',
        descAr: 'بيع وشراء وتطوير وإدارة وتأجير وتقييم العقارات',
        icon: Home,
        color: 'emerald',
        subActivities: [
            { code: 'property_sales', nameEn: 'Property Sales', nameAr: 'بيع العقارات' },
            { code: 'property_purchase', nameEn: 'Property Purchase', nameAr: 'شراء العقارات' },
            { code: 'property_development', nameEn: 'Real Estate Development', nameAr: 'التطوير العقاري' },
            { code: 'property_management', nameEn: 'Property Management', nameAr: 'إدارة العقارات' },
            { code: 'property_rental', nameEn: 'Rental & Leasing', nameAr: 'التأجير والإيجار' },
            { code: 'property_valuation', nameEn: 'Property Valuation', nameAr: 'التقييم العقاري' },
            { code: 'property_investment', nameEn: 'Real Estate Investment', nameAr: 'الاستثمار العقاري' },
        ],
        recommendedModules: ['hr', 'accounting', 'crm', 'projects', 'documents', 'client_portal', 'control_room', 'rare', 'analytics'],
        defaultPlan: 'business',
    },

    // 6. Restaurants & F&B
    {
        code: 'restaurants',
        nameEn: 'Restaurants & Food Service',
        nameAr: 'المطاعم والخدمات الغذائية',
        descEn: 'Fine dining, fast food, cafes, bakeries, catering, and cloud kitchens',
        descAr: 'المطاعم الفاخرة والوجبات السريعة والمقاهي والمخابز والتموين',
        icon: Utensils,
        color: 'red',
        subActivities: [
            { code: 'fine_dining', nameEn: 'Fine Dining', nameAr: 'المطاعم الفاخرة' },
            { code: 'fast_food', nameEn: 'Fast Food & QSR', nameAr: 'الوجبات السريعة' },
            { code: 'cafes', nameEn: 'Cafes & Coffee Shops', nameAr: 'المقاهي' },
            { code: 'bakeries', nameEn: 'Bakeries & Pastries', nameAr: 'المخابز والحلويات' },
            { code: 'catering', nameEn: 'Catering Services', nameAr: 'خدمات التموين والكاترينج' },
            { code: 'cloud_kitchen', nameEn: 'Cloud Kitchens', nameAr: 'المطابخ السحابية' },
            { code: 'juice_bars', nameEn: 'Juice Bars & Healthy', nameAr: 'محلات العصائر والصحي' },
        ],
        recommendedModules: ['hr', 'accounting', 'store', 'inventory', 'crm', 'logistics', 'integrations', 'rare', 'analytics'],
        defaultPlan: 'pro',
    },

    // 7. Banking & Exchange
    {
        code: 'banking_exchange',
        nameEn: 'Banking & Financial Exchange',
        nameAr: 'الصرافة والبنوك',
        descEn: 'Currency exchange, banking services, money transfer, and investment firms',
        descAr: 'الصرافة والخدمات المصرفية وتحويل الأموال وشركات الاستثمار',
        icon: Landmark,
        color: 'indigo',
        subActivities: [
            { code: 'currency_exchange', nameEn: 'Currency Exchange', nameAr: 'الصرافة وتبديل العملات' },
            { code: 'banking_services', nameEn: 'Banking Services', nameAr: 'الخدمات المصرفية' },
            { code: 'money_transfer', nameEn: 'Money Transfer', nameAr: 'تحويل الأموال' },
            { code: 'investment_firms', nameEn: 'Investment Firms', nameAr: 'شركات الاستثمار' },
            { code: 'microfinance', nameEn: 'Microfinance', nameAr: 'التمويل الأصغر' },
            { code: 'financial_advisory', nameEn: 'Financial Advisory', nameAr: 'الاستشارات المالية' },
        ],
        recommendedModules: ['hr', 'accounting', 'crm', 'documents', 'control_room', 'automation', 'integrations', 'rare', 'analytics'],
        defaultPlan: 'enterprise',
    },

    // 8. Insurance
    {
        code: 'insurance',
        nameEn: 'Insurance Companies',
        nameAr: 'شركات التأمين',
        descEn: 'Medical, auto, property, life, travel, and commercial insurance services',
        descAr: 'خدمات التأمين الطبي والسيارات والممتلكات والحياة والسفر والتجاري',
        icon: Shield,
        color: 'cyan',
        subActivities: [
            { code: 'medical_insurance', nameEn: 'Medical Insurance', nameAr: 'التأمين الطبي' },
            { code: 'auto_insurance', nameEn: 'Auto Insurance', nameAr: 'تأمين السيارات' },
            { code: 'property_insurance', nameEn: 'Property Insurance', nameAr: 'تأمين الممتلكات' },
            { code: 'life_insurance', nameEn: 'Life Insurance', nameAr: 'تأمين الحياة' },
            { code: 'travel_insurance', nameEn: 'Travel Insurance', nameAr: 'تأمين السفر' },
            { code: 'commercial_insurance', nameEn: 'Commercial Insurance', nameAr: 'التأمين التجاري' },
        ],
        recommendedModules: ['hr', 'accounting', 'crm', 'documents', 'client_portal', 'automation', 'control_room', 'rare', 'analytics'],
        defaultPlan: 'business',
    },

    // 9. Logistics & Supply Chain
    {
        code: 'logistics',
        nameEn: 'Logistics & Supply Chain',
        nameAr: 'شركات اللوجستيات',
        descEn: 'Warehousing, shipping, distribution, packaging, and supply chain management',
        descAr: 'التخزين والشحن والتوزيع والتغليف وإدارة سلسلة التوريد',
        icon: Package,
        color: 'teal',
        subActivities: [
            { code: 'warehousing', nameEn: 'Warehousing & Storage', nameAr: 'التخزين والمستودعات' },
            { code: 'shipping', nameEn: 'Shipping & Freight', nameAr: 'الشحن والنقل البحري' },
            { code: 'distribution', nameEn: 'Distribution Services', nameAr: 'خدمات التوزيع' },
            { code: 'warehouse_management', nameEn: 'Warehouse Management', nameAr: 'إدارة المستودعات' },
            { code: 'packaging', nameEn: 'Packaging Solutions', nameAr: 'حلول التغليف' },
            { code: 'cold_chain', nameEn: 'Cold Chain Logistics', nameAr: 'سلسلة التبريد' },
            { code: 'last_mile', nameEn: 'Last Mile Delivery', nameAr: 'التوصيل للميل الأخير' },
        ],
        recommendedModules: ['hr', 'accounting', 'inventory', 'logistics', 'control_room', 'automation', 'crm', 'integrations', 'rare', 'analytics'],
        defaultPlan: 'business',
    },

    // 10. Charities & NGOs
    {
        code: 'charities',
        nameEn: 'Charities & NGOs',
        nameAr: 'الجمعيات الخيرية',
        descEn: 'Humanitarian, educational, health, environmental, and community organizations',
        descAr: 'المنظمات الإنسانية والتعليمية والصحية والبيئية والمجتمعية',
        icon: Heart,
        color: 'pink',
        subActivities: [
            { code: 'humanitarian', nameEn: 'Humanitarian Aid', nameAr: 'المساعدات الإنسانية' },
            { code: 'educational_ngo', nameEn: 'Educational NGOs', nameAr: 'الجمعيات التعليمية' },
            { code: 'health_ngo', nameEn: 'Health Organizations', nameAr: 'المنظمات الصحية' },
            { code: 'environmental', nameEn: 'Environmental NGOs', nameAr: 'الجمعيات البيئية' },
            { code: 'community', nameEn: 'Community Organizations', nameAr: 'المنظمات المجتمعية' },
            { code: 'relief', nameEn: 'Disaster Relief', nameAr: 'الإغاثة من الكوارث' },
        ],
        recommendedModules: ['hr', 'accounting', 'crm', 'projects', 'documents', 'training', 'rare', 'analytics'],
        defaultPlan: 'pro',
    },

    // 11. Institutions & Embassies
    {
        code: 'institutions',
        nameEn: 'Institutions & Embassies',
        nameAr: 'المؤسسات والسفارات',
        descEn: 'Embassies, consulates, government institutions, and international organizations',
        descAr: 'السفارات والقنصليات والمؤسسات الحكومية والمنظمات الدولية',
        icon: Building2,
        color: 'slate',
        subActivities: [
            { code: 'embassies', nameEn: 'Embassies', nameAr: 'السفارات' },
            { code: 'consulates', nameEn: 'Consulates', nameAr: 'القنصليات' },
            { code: 'government', nameEn: 'Government Institutions', nameAr: 'المؤسسات الحكومية' },
            { code: 'international_orgs', nameEn: 'International Organizations', nameAr: 'المنظمات الدولية' },
            { code: 'semi_government', nameEn: 'Semi-Government Bodies', nameAr: 'الهيئات شبه الحكومية' },
        ],
        recommendedModules: ['hr', 'accounting', 'documents', 'meetings', 'projects', 'control_room', 'automation', 'rare', 'analytics'],
        defaultPlan: 'enterprise',
    },

    // 12. Recruitment Companies
    {
        code: 'recruitment',
        nameEn: 'Recruitment & Staffing',
        nameAr: 'شركات التوظيف',
        descEn: 'Local & international recruitment, temp staffing, executive search, and HR consulting',
        descAr: 'التوظيف المحلي والدولي والمؤقت والبحث التنفيذي واستشارات الموارد البشرية',
        icon: Users,
        color: 'fuchsia',
        subActivities: [
            { code: 'local_recruitment', nameEn: 'Local Recruitment', nameAr: 'التوظيف المحلي' },
            { code: 'international_recruitment', nameEn: 'International Recruitment', nameAr: 'التوظيف الدولي' },
            { code: 'temp_staffing', nameEn: 'Temporary Staffing', nameAr: 'التوظيف المؤقت' },
            { code: 'executive_search', nameEn: 'Executive Search', nameAr: 'البحث التنفيذي' },
            { code: 'hr_consulting', nameEn: 'HR Consulting', nameAr: 'استشارات الموارد البشرية' },
            { code: 'manpower_supply', nameEn: 'Manpower Supply', nameAr: 'توريد العمالة' },
        ],
        recommendedModules: ['hr', 'accounting', 'crm', 'recruitment', 'documents', 'client_portal', 'automation', 'rare', 'analytics'],
        defaultPlan: 'pro',
    },

    // 13. Transport Companies
    {
        code: 'transport',
        nameEn: 'Transport Companies',
        nameAr: 'شركات النقل',
        descEn: 'Domestic & international transport, land, sea, air freight, and passenger services',
        descAr: 'النقل الداخلي والدولي والبري والبحري والجوي وخدمات الركاب',
        icon: Bus,
        color: 'sky',
        subActivities: [
            { code: 'domestic_transport', nameEn: 'Domestic Transport', nameAr: 'النقل الداخلي' },
            { code: 'international_transport', nameEn: 'International Transport', nameAr: 'النقل الدولي' },
            { code: 'land_freight', nameEn: 'Land Freight', nameAr: 'النقل البري' },
            { code: 'sea_freight', nameEn: 'Sea Freight', nameAr: 'النقل البحري' },
            { code: 'air_freight', nameEn: 'Air Freight', nameAr: 'النقل الجوي' },
            { code: 'passenger_transport', nameEn: 'Passenger Transport', nameAr: 'نقل الركاب' },
            { code: 'moving_services', nameEn: 'Moving & Relocation', nameAr: 'خدمات النقل والتغليف' },
        ],
        recommendedModules: ['hr', 'accounting', 'logistics', 'control_room', 'crm', 'inventory', 'automation', 'integrations', 'rare', 'analytics'],
        defaultPlan: 'business',
    },
];

// ─── Helpers ────────────────────────────────────────────────────────────

/** Get a sector by code */
export function getSector(code: string): IndustrySector | undefined {
    return INDUSTRY_SECTORS.find(s => s.code === code);
}

/** Get module definition by code */
export function getModule(code: string): ModuleDef | undefined {
    return MODULE_CATALOG.find(m => m.code === code);
}

/** Get recommended modules for a sector (as full objects) */
export function getSectorModules(sectorCode: string): ModuleDef[] {
    const sector = getSector(sectorCode);
    if (!sector) return [];
    return sector.recommendedModules
        .map(code => getModule(code))
        .filter((m): m is ModuleDef => m !== undefined);
}

/** Convert sector to legacy Industry format for backward compat */
export function sectorToLegacyIndustry(sector: IndustrySector) {
    return {
        code: sector.code,
        name_en: sector.nameEn,
        name_ar: sector.nameAr,
        recommended_modules: sector.recommendedModules,
        default_plan: sector.defaultPlan,
        default_settings: {},
        business_sizes: ['micro', 'small', 'medium', 'large', 'enterprise'] as string[],
    };
}

/** All sectors as legacy format */
export const LEGACY_INDUSTRIES = INDUSTRY_SECTORS.map(sectorToLegacyIndustry);

/** Icon map for OnboardingWizard backward compat */
export const INDUSTRY_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
    INDUSTRY_SECTORS.map(s => [s.code, s.icon])
);
