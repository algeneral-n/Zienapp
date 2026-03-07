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
};
