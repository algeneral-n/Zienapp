import type { TourStep } from '../components/GuidedTour';

/** Tour steps for each major page/module */
export const TOUR_STEPS: Record<string, TourStep[]> = {
    dashboard_overview: [
        {
            title_en: 'Welcome to your Dashboard',
            title_ar: 'مرحباً في لوحة التحكم',
            desc_en: 'This is your command center. Here you\'ll see key metrics, recent activity, and quick actions for your company.',
            desc_ar: 'هذا هو مركز القيادة. هنا سترى المقاييس الرئيسية والأنشطة الحديثة والإجراءات السريعة لشركتك.',
        },
        {
            target: '[data-tour="sidebar"]',
            title_en: 'Navigation Sidebar',
            title_ar: 'قائمة التنقل الجانبية',
            desc_en: 'Use the sidebar to navigate between all platform modules — HR, Accounting, CRM, Projects, and more.',
            desc_ar: 'استخدم القائمة الجانبية للتنقل بين جميع وحدات المنصة — الموارد البشرية، المحاسبة، إدارة العملاء، المشاريع، والمزيد.',
            placement: 'right',
        },
        {
            target: '[data-tour="search"]',
            title_en: 'Global Search',
            title_ar: 'البحث الشامل',
            desc_en: 'Search across all modules, employees, invoices, and projects from one place.',
            desc_ar: 'ابحث في جميع الوحدات والموظفين والفواتير والمشاريع من مكان واحد.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="notifications"]',
            title_en: 'Notifications',
            title_ar: 'الإشعارات',
            desc_en: 'Stay updated with real-time alerts for approvals, messages, and system events.',
            desc_ar: 'ابق على اطلاع بالتنبيهات الفورية للموافقات والرسائل وأحداث النظام.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="rare-ai"]',
            title_en: 'RARE AI Assistant',
            title_ar: 'مساعد RARE AI',
            desc_en: 'Click the AI button at the bottom-right to chat with RARE — your intelligent assistant that helps with any task.',
            desc_ar: 'انقر على زر الذكاء الاصطناعي في أسفل اليمين للحديث مع RARE — مساعدك الذكي الذي يساعد في أي مهمة.',
            placement: 'top',
        },
    ],

    hr_module: [
        {
            title_en: 'HR & Payroll Module',
            title_ar: 'وحدة الموارد البشرية والرواتب',
            desc_en: 'Manage your entire workforce — employees, departments, attendance, leaves, and payroll processing.',
            desc_ar: 'إدارة القوى العاملة بالكامل — الموظفين والأقسام والحضور والإجازات ومعالجة الرواتب.',
        },
        {
            target: '[data-tour="employee-list"]',
            title_en: 'Employee Directory',
            title_ar: 'دليل الموظفين',
            desc_en: 'View all employees, their roles, departments, and contact info. Click any employee to see their full profile.',
            desc_ar: 'عرض جميع الموظفين وأدوارهم وأقسامهم ومعلومات الاتصال. انقر على أي موظف لعرض ملفه الكامل.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="attendance"]',
            title_en: 'Attendance Tracking',
            title_ar: 'تتبع الحضور',
            desc_en: 'Track clock-in/out times, late arrivals, and generate attendance reports.',
            desc_ar: 'تتبع أوقات الحضور والانصراف والتأخير وإنشاء تقارير الحضور.',
            placement: 'bottom',
        },
    ],

    accounting_module: [
        {
            title_en: 'Accounting & Finance',
            title_ar: 'المحاسبة والمالية',
            desc_en: 'Full financial management — invoices, journal entries, chart of accounts, and financial reports.',
            desc_ar: 'إدارة مالية شاملة — الفواتير والقيود اليومية وشجرة الحسابات والتقارير المالية.',
        },
        {
            target: '[data-tour="invoices"]',
            title_en: 'Invoices',
            title_ar: 'الفواتير',
            desc_en: 'Create, send, and track invoices. Set up recurring invoices for regular clients.',
            desc_ar: 'إنشاء وإرسال وتتبع الفواتير. إعداد فواتير متكررة للعملاء الدائمين.',
            placement: 'bottom',
        },
    ],

    crm_module: [
        {
            title_en: 'CRM & Sales Pipeline',
            title_ar: 'إدارة العملاء وخط المبيعات',
            desc_en: 'Manage leads, contacts, deals, and your entire sales pipeline in one unified view.',
            desc_ar: 'إدارة العملاء المحتملين وجهات الاتصال والصفقات وخط المبيعات بالكامل في عرض موحد.',
        },
        {
            target: '[data-tour="pipeline"]',
            title_en: 'Sales Pipeline',
            title_ar: 'خط المبيعات',
            desc_en: 'Drag and drop deals between stages — from lead to negotiation to closed.',
            desc_ar: 'اسحب وأفلت الصفقات بين المراحل — من العميل المحتمل إلى التفاوض إلى الإغلاق.',
            placement: 'bottom',
        },
    ],

    projects_module: [
        {
            title_en: 'Project Management',
            title_ar: 'إدارة المشاريع',
            desc_en: 'Create and track projects with tasks, milestones, team assignments, and deadlines.',
            desc_ar: 'إنشاء وتتبع المشاريع مع المهام والمراحل وتعيينات الفريق والمواعيد النهائية.',
        },
    ],

    logistics_module: [
        {
            title_en: 'Logistics & Fleet',
            title_ar: 'اللوجستيات والأسطول',
            desc_en: 'Track vehicles, drivers, shipments, and deliveries with real-time GPS monitoring.',
            desc_ar: 'تتبع المركبات والسائقين والشحنات والتسليمات مع مراقبة GPS في الوقت الفعلي.',
        },
    ],

    chat_module: [
        {
            title_en: 'Team Chat',
            title_ar: 'محادثة الفريق',
            desc_en: 'Real-time messaging with channels, direct messages, file sharing, and typing indicators.',
            desc_ar: 'مراسلة فورية مع قنوات ورسائل مباشرة ومشاركة ملفات ومؤشرات الكتابة.',
        },
    ],

    academy: [
        {
            title_en: 'Welcome to ZIEN Academy',
            title_ar: 'مرحباً في أكاديمية ZIEN',
            desc_en: 'Learn how to master every module of the platform through structured courses, video tutorials, and certifications.',
            desc_ar: 'تعلم كيفية إتقان كل وحدة في المنصة من خلال دورات منظمة ودروس فيديو وشهادات.',
        },
        {
            target: '[data-tour="academy-video"]',
            title_en: 'Platform Introduction Video',
            title_ar: 'فيديو تعريفي بالمنصة',
            desc_en: 'Watch the platform overview video to get a quick understanding of ZIEN\'s capabilities.',
            desc_ar: 'شاهد الفيديو التعريفي للمنصة للحصول على فهم سريع لقدرات ZIEN.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="academy-courses"]',
            title_en: 'Learning Tracks',
            title_ar: 'مسارات التعلم',
            desc_en: 'Follow structured learning paths — Core Platform, HR, Finance, AI, CRM, Security, and Logistics.',
            desc_ar: 'اتبع مسارات تعلم منظمة — المنصة الأساسية، الموارد البشرية، المالية، الذكاء الاصطناعي، إدارة العملاء، الأمان، واللوجستيات.',
            placement: 'top',
        },
    ],

    help_center: [
        {
            title_en: 'Help Center',
            title_ar: 'مركز المساعدة',
            desc_en: 'Find answers to common questions, read guides, and get support from our team.',
            desc_ar: 'ابحث عن إجابات للأسئلة الشائعة واقرأ الأدلة واحصل على الدعم من فريقنا.',
        },
        {
            target: '[data-tour="help-search"]',
            title_en: 'Search Articles',
            title_ar: 'البحث في المقالات',
            desc_en: 'Type a keyword to quickly find relevant help articles and guides.',
            desc_ar: 'اكتب كلمة مفتاحية للعثور بسرعة على المقالات والأدلة ذات الصلة.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="help-contact"]',
            title_en: 'Contact Support',
            title_ar: 'تواصل مع الدعم',
            desc_en: 'Can\'t find what you need? Contact us via live chat, email, or phone.',
            desc_ar: 'لم تجد ما تحتاجه؟ تواصل معنا عبر الدردشة المباشرة أو البريد أو الهاتف.',
            placement: 'top',
        },
    ],

    store_module: [
        {
            title_en: 'Global Store',
            title_ar: 'المتجر العالمي',
            desc_en: 'Manage your products, inventory, and online storefront — all connected to your accounting.',
            desc_ar: 'إدارة منتجاتك ومخزونك ومتجرك الإلكتروني — كل شيء مرتبط بمحاسبتك.',
        },
    ],

    meetings_module: [
        {
            title_en: 'Meetings & Calendar',
            title_ar: 'الاجتماعات والتقويم',
            desc_en: 'Schedule meetings, send invitations, and get AI-powered meeting summaries.',
            desc_ar: 'جدولة الاجتماعات وإرسال الدعوات والحصول على ملخصات اجتماعات مدعومة بالذكاء الاصطناعي.',
        },
    ],

    billing_module: [
        {
            title_en: 'Billing & Subscription',
            title_ar: 'الفوترة والاشتراك',
            desc_en: 'Manage your plan, add modules, view invoices, and update payment methods.',
            desc_ar: 'إدارة خطتك وإضافة وحدات وعرض الفواتير وتحديث طرق الدفع.',
        },
    ],

    // ─── New Page Tours ─────────────────────────────────────────────

    landing_page: [
        {
            title_en: 'Welcome to ZIEN Platform',
            title_ar: 'مرحباً بك في منصة ZIEN',
            desc_en: 'ZIEN is an all-in-one enterprise platform powered by RARE AI. Browse our features, register your company, or preview as a guest.',
            desc_ar: 'ZIEN منصة مؤسسية شاملة مدعومة بذكاء RARE AI. تصفح الميزات، سجل شركتك، أو عاين كزائر.',
        },
        {
            target: '[data-tour="hero-cta"]',
            title_en: 'Get Started',
            title_ar: 'ابدأ الآن',
            desc_en: 'Register your company or browse as a guest to preview all platform services.',
            desc_ar: 'سجل شركتك أو تصفح كزائر لمعاينة جميع خدمات المنصة.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="features-grid"]',
            title_en: 'Platform Features',
            title_ar: 'ميزات المنصة',
            desc_en: 'Explore 16+ integrated modules from HR to Accounting, CRM, Projects, and more.',
            desc_ar: 'اكتشف أكثر من 16 وحدة متكاملة من الموارد البشرية إلى المحاسبة وإدارة العلاقات والمشاريع.',
            placement: 'top',
        },
    ],

    employee_portal: [
        {
            title_en: 'Employee Portal',
            title_ar: 'بوابة الموظف',
            desc_en: 'Your personal workspace — access attendance, requests, tasks, payslips, and RARE AI assistant.',
            desc_ar: 'مساحة العمل الشخصية — الحضور والطلبات والمهام وكشوف الرواتب ومساعد RARE AI.',
        },
        {
            target: '[data-tour="attendance"]',
            title_en: 'Attendance & Check-in',
            title_ar: 'الحضور والانصراف',
            desc_en: 'Clock in/out, view your attendance history, and track your working hours.',
            desc_ar: 'سجل حضورك وانصرافك وتابع سجل الحضور وساعات العمل.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="my-requests"]',
            title_en: 'My Requests',
            title_ar: 'طلباتي',
            desc_en: 'Submit leave requests, expense claims, and other HR requests. Track their approval status.',
            desc_ar: 'قدم طلبات إجازة ومصاريف وطلبات موارد بشرية أخرى. تابع حالة الموافقة.',
            placement: 'right',
        },
    ],

    client_portal: [
        {
            title_en: 'Client Portal',
            title_ar: 'بوابة العميل',
            desc_en: 'Your dedicated portal — track projects, view invoices, download documents, and communicate with the team.',
            desc_ar: 'بوابتك المخصصة — تابع المشاريع واعرض الفواتير وحمّل المستندات وتواصل مع الفريق.',
        },
        {
            target: '[data-tour="client-projects"]',
            title_en: 'Your Projects',
            title_ar: 'مشاريعك',
            desc_en: 'View all your active projects, milestones, and deliverables in one place.',
            desc_ar: 'اعرض جميع مشاريعك النشطة والمعالم والمخرجات في مكان واحد.',
            placement: 'bottom',
        },
    ],

    owner_dashboard: [
        {
            title_en: 'Owner Dashboard',
            title_ar: 'لوحة المالك',
            desc_en: 'Full company overview — employees, finances, departments, and AI insights powered by RARE.',
            desc_ar: 'نظرة شاملة على الشركة — الموظفون والمالية والأقسام ورؤى RARE AI.',
        },
        {
            target: '[data-tour="company-stats"]',
            title_en: 'Company Statistics',
            title_ar: 'إحصائيات الشركة',
            desc_en: 'Key metrics: employees, revenue, expenses, and department performance at a glance.',
            desc_ar: 'مقاييس رئيسية: الموظفون والإيرادات والمصروفات وأداء الأقسام بنظرة واحدة.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="modules-nav"]',
            title_en: 'Module Navigation',
            title_ar: 'التنقل بين الوحدات',
            desc_en: 'Access all platform modules from the sidebar — HR, Accounting, CRM, Projects, and more.',
            desc_ar: 'الوصول لجميع وحدات المنصة من الشريط الجانبي — الموارد البشرية والمحاسبة وإدارة العلاقات والمشاريع.',
            placement: 'right',
        },
    ],

    founder_page: [
        {
            title_en: 'Founder Command Center',
            title_ar: 'مركز قيادة المؤسس',
            desc_en: 'Platform-wide management — all tenants, subscriptions, users, revenue, AI, and system health.',
            desc_ar: 'إدارة المنصة بالكامل — جميع المستأجرين والاشتراكات والمستخدمين والإيرادات والذكاء الاصطناعي وصحة النظام.',
        },
        {
            target: '[data-tour="founder-nav"]',
            title_en: 'Management Sections',
            title_ar: 'أقسام الإدارة',
            desc_en: 'Navigate between Tenants, Revenue, Subscriptions, Users, Logs, Maintenance, Reports, and more.',
            desc_ar: 'تنقل بين المستأجرين والإيرادات والاشتراكات والمستخدمين والسجلات والصيانة والتقارير.',
            placement: 'right',
        },
        {
            target: '[data-tour="founder-stats"]',
            title_en: 'Platform Overview',
            title_ar: 'نظرة عامة على المنصة',
            desc_en: 'Real-time statistics: total companies, active users, revenue metrics, and system health score.',
            desc_ar: 'إحصائيات فورية: إجمالي الشركات والمستخدمين النشطين ومقاييس الإيرادات ونقاط صحة النظام.',
            placement: 'bottom',
        },
    ],
};
