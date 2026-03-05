import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { ArrowLeft, CheckCircle2, Zap, Shield, BarChart3, Users, Globe, MessageSquare, ShoppingBag, Briefcase, ArrowRight } from 'lucide-react';

const FEATURE_DATA: Record<string, {
  icon: any;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  bullets: string[];
  image: string;
  detailsEn: string[];
  detailsAr: string[];
}> = {
  accounting: {
    icon: BarChart3,
    titleEn: "Accounting & Finance",
    titleAr: "المحاسبة والمالية",
    descEn: "A complete financial management suite designed for modern enterprises. From automated invoicing to tax compliance, every financial process is streamlined and AI-enhanced.",
    descAr: "مجموعة إدارة مالية كاملة مصممة للمؤسسات الحديثة. من الفوترة الآلية إلى الامتثال الضريبي، كل عملية مالية مبسطة ومعززة بالذكاء الاصطناعي.",
    bullets: ['accounting_bullet_1', 'accounting_bullet_2', 'accounting_bullet_3'],
    image: "https://lh3.googleusercontent.com/p/AF1QipM4Z8Hvn9cMYSRqtQNgp3ZlnnyHqSRIDaSQAKDN=s1360-w1360-h1020-rw",
    detailsEn: [
      "Generate professional invoices and receipts automatically with customizable templates",
      "Track expenses, revenue, and profit margins in real-time dashboards",
      "Multi-currency support with live exchange rates for international operations",
      "Automated VAT calculation and tax reporting compliant with UAE regulations",
      "Bank reconciliation and payment gateway integrations",
      "AI-powered financial forecasting and anomaly detection by RARE",
    ],
    detailsAr: [
      "إنشاء فواتير وإيصالات احترافية تلقائياً مع قوالب قابلة للتخصيص",
      "تتبع المصروفات والإيرادات وهوامش الربح في لوحات معلومات فورية",
      "دعم متعدد العملات مع أسعار صرف حية للعمليات الدولية",
      "حساب ضريبة القيمة المضافة تلقائياً وتقارير ضريبية متوافقة مع لوائح الإمارات",
      "تسوية بنكية وتكامل مع بوابات الدفع",
      "تنبؤات مالية واكتشاف الشذوذ بالذكاء الاصطناعي من RARE",
    ],
  },
  crm: {
    icon: Users,
    titleEn: "CRM & Sales",
    titleAr: "إدارة علاقات العملاء والمبيعات",
    descEn: "Manage your entire sales pipeline from lead capture to deal closure. Built-in client portal keeps customers engaged and informed.",
    descAr: "إدارة خط مبيعاتك بالكامل من التقاط العملاء المحتملين إلى إغلاق الصفقات. بوابة عملاء مدمجة تبقي العملاء متفاعلين ومطلعين.",
    bullets: ['crm_bullet_1', 'crm_bullet_2', 'crm_bullet_3'],
    image: "https://lh3.googleusercontent.com/p/AF1QipOxcyDh5pI5H6Es3o-98m8D9fynSp8fBCvvrW_g=s1360-w1360-h1020-rw",
    detailsEn: [
      "Visual drag-and-drop sales pipeline with customizable stages",
      "Automated lead scoring based on engagement and behavior patterns",
      "Client portal with self-service access to invoices, quotes, and project status",
      "Email and WhatsApp integration for seamless communication tracking",
      "Quotation and proposal generation with e-signature support",
      "RARE AI suggests next best actions and predicts deal outcomes",
    ],
    detailsAr: [
      "خط مبيعات بصري بالسحب والإفلات مع مراحل قابلة للتخصيص",
      "تسجيل العملاء المحتملين تلقائياً بناءً على أنماط التفاعل والسلوك",
      "بوابة عملاء بخدمة ذاتية للوصول إلى الفواتير والعروض وحالة المشاريع",
      "تكامل مع البريد الإلكتروني وواتساب لتتبع التواصل بسلاسة",
      "إنشاء عروض الأسعار والمقترحات مع دعم التوقيع الإلكتروني",
      "RARE AI يقترح أفضل الإجراءات التالية ويتنبأ بنتائج الصفقات",
    ],
  },
  hr: {
    icon: Shield,
    titleEn: "HR & Payroll",
    titleAr: "الموارد البشرية والرواتب",
    descEn: "Complete employee lifecycle management from recruitment to exit, with automated payroll processing and compliance.",
    descAr: "إدارة كاملة لدورة حياة الموظف من التوظيف حتى المغادرة، مع معالجة رواتب آلية وامتثال.",
    bullets: ['hr_bullet_1', 'hr_bullet_2', 'hr_bullet_3'],
    image: "https://lh3.googleusercontent.com/p/AF1QipO9w_lR54InzNIU6W8D9AH8XRFzLL6SUwVPdJcN=s1360-w1360-h1020-rw",
    detailsEn: [
      "Biometric and GPS-based attendance tracking with shift management",
      "Leave management with approval workflows and balance calculations",
      "Automated payroll with WPS file generation for UAE compliance",
      "Employee self-service portal for documents, payslips, and requests",
      "Performance reviews, KPIs, and goal tracking",
      "RARE AI analyzes workforce patterns and suggests optimization",
    ],
    detailsAr: [
      "تتبع الحضور بالبصمة وGPS مع إدارة الورديات",
      "إدارة الإجازات مع سير عمل الموافقات وحساب الأرصدة",
      "رواتب آلية مع إنشاء ملفات WPS للامتثال في الإمارات",
      "بوابة خدمة ذاتية للموظفين للمستندات وكشوف الرواتب والطلبات",
      "تقييمات الأداء ومؤشرات الأداء الرئيسية وتتبع الأهداف",
      "RARE AI يحلل أنماط القوى العاملة ويقترح التحسينات",
    ],
  },
  'rare-ai': {
    icon: Zap,
    titleEn: "RARE AI Agents",
    titleAr: "وكلاء RARE AI",
    descEn: "Intelligent AI assistants embedded in every department. RARE understands your business context and provides actionable insights.",
    descAr: "مساعدون ذكاء اصطناعي متضمنون في كل قسم. RARE يفهم سياق عملك ويقدم رؤى قابلة للتنفيذ.",
    bullets: ['rare_bullet_1', 'rare_bullet_2', 'rare_bullet_3'],
    image: "https://www.cyberark.com/wp-content/uploads/2025/03/ai-agents-collaborative-intelligence1.jpg",
    detailsEn: [
      "Department-specific AI agents: RARE Accounting, RARE HR, RARE CRM, RARE GM",
      "Natural language queries — ask questions in plain English or Arabic",
      "Automated data analysis with visual charts and trend detection",
      "Smart notifications and anomaly alerts across all modules",
      "Document understanding — upload PDFs, invoices, contracts for instant analysis",
      "Continuous learning from your business data while maintaining security",
    ],
    detailsAr: [
      "وكلاء ذكاء اصطناعي لكل قسم: RARE للمحاسبة، RARE للموارد البشرية، RARE للمبيعات، RARE للمدير العام",
      "استعلامات بلغة طبيعية — اطرح أسئلة بالعربية أو الإنجليزية",
      "تحليل بيانات تلقائي مع رسوم بيانية واكتشاف الاتجاهات",
      "إشعارات ذكية وتنبيهات الشذوذ عبر جميع الوحدات",
      "فهم المستندات — ارفع ملفات PDF والفواتير والعقود للتحليل الفوري",
      "تعلم مستمر من بيانات عملك مع الحفاظ على الأمان",
    ],
  },
  logistics: {
    icon: Globe,
    titleEn: "Logistics & Fleet",
    titleAr: "الخدمات اللوجستية والأسطول",
    descEn: "Real-time fleet management and field operations with smart routing and automated task dispatching.",
    descAr: "إدارة أسطول فورية وعمليات ميدانية مع توجيه ذكي وإرسال مهام تلقائي.",
    bullets: ['logistics_bullet_1', 'logistics_bullet_2', 'logistics_bullet_3'],
    image: "https://lh3.googleusercontent.com/p/AF1QipOO2HzMRuorxrjfQkOsJ_3ZfKUVWT5x718CeF6s=s1360-w1360-h1020-rw",
    detailsEn: [
      "Real-time GPS tracking of fleet vehicles with live map view",
      "Smart route optimization to reduce fuel costs and delivery times",
      "Automated task assignment and dispatching to field workers",
      "Proof of delivery with photo capture and digital signatures",
      "Vehicle maintenance scheduling and cost tracking",
      "RARE AI predicts delivery times and optimizes fleet utilization",
    ],
    detailsAr: [
      "تتبع GPS فوري لمركبات الأسطول مع عرض خريطة حي",
      "تحسين المسارات الذكي لتقليل تكاليف الوقود وأوقات التسليم",
      "تعيين المهام والإرسال التلقائي للعاملين الميدانيين",
      "إثبات التسليم مع التقاط الصور والتوقيعات الرقمية",
      "جدولة صيانة المركبات وتتبع التكاليف",
      "RARE AI يتنبأ بأوقات التسليم ويحسن استخدام الأسطول",
    ],
  },
  'project-management': {
    icon: Briefcase,
    titleEn: "Project Management",
    titleAr: "إدارة المشاريع",
    descEn: "End-to-end project management with Kanban boards, Gantt charts, and team collaboration tools.",
    descAr: "إدارة مشاريع شاملة مع لوحات كانبان ومخططات جانت وأدوات التعاون الجماعي.",
    bullets: ['pm_bullet_1', 'pm_bullet_2', 'pm_bullet_3'],
    image: "https://lh3.googleusercontent.com/p/AF1QipPwN6JEeKaXorclLqLX6pWvPluB__YEcTvMo6Ef=s1360-w1360-h1020-rw",
    detailsEn: [
      "Kanban boards with drag-and-drop task management",
      "Gantt chart view for timeline planning and dependencies",
      "Milestone tracking with automated progress reports",
      "Multi-level approval workflows for tasks and deliverables",
      "Time tracking and resource allocation across projects",
      "RARE AI identifies bottlenecks and suggests timeline adjustments",
    ],
    detailsAr: [
      "لوحات كانبان بإدارة المهام بالسحب والإفلات",
      "عرض مخطط جانت لتخطيط الجداول الزمنية والتبعيات",
      "تتبع المراحل الرئيسية مع تقارير تقدم تلقائية",
      "سير عمل موافقات متعددة المستويات للمهام والمخرجات",
      "تتبع الوقت وتخصيص الموارد عبر المشاريع",
      "RARE AI يحدد العقبات ويقترح تعديلات على الجدول الزمني",
    ],
  },
  'global-store': {
    icon: ShoppingBag,
    titleEn: "Global Store",
    titleAr: "المتجر العالمي",
    descEn: "Full e-commerce solution integrated with your inventory and accounting for seamless online selling.",
    descAr: "حل تجارة إلكترونية كامل متكامل مع المخزون والمحاسبة لبيع سلس عبر الإنترنت.",
    bullets: ['store_bullet_1', 'store_bullet_2', 'store_bullet_3'],
    image: "https://lh3.googleusercontent.com/p/AF1QipMPZljVEc-2ZIfQBXj4-jbm2U-Lwng67FH5wfDL=s1360-w1360-h1020-rw",
    detailsEn: [
      "Multi-channel selling: web store, mobile app, and marketplace integrations",
      "Inventory management synced with accounting and warehouse",
      "Order processing with automated fulfillment workflows",
      "Product catalog with variants, pricing tiers, and promotions",
      "Payment gateway integration with multiple currency support",
      "RARE AI recommends pricing strategies and predicts demand",
    ],
    detailsAr: [
      "بيع متعدد القنوات: متجر ويب، تطبيق جوال، وتكامل مع الأسواق",
      "إدارة مخزون مرتبطة بالمحاسبة والمستودع",
      "معالجة الطلبات مع سير عمل تنفيذ تلقائي",
      "كتالوج منتجات مع متغيرات ومستويات أسعار وعروض ترويجية",
      "تكامل بوابات الدفع مع دعم متعدد العملات",
      "RARE AI يوصي باستراتيجيات التسعير ويتنبأ بالطلب",
    ],
  },
  'meetings-chat': {
    icon: MessageSquare,
    titleEn: "Meetings & Chat",
    titleAr: "الاجتماعات والدردشة",
    descEn: "Unified communication platform with video conferencing, team chat, and AI-powered meeting summaries.",
    descAr: "منصة اتصالات موحدة مع مؤتمرات فيديو ودردشة جماعية وملخصات اجتماعات بالذكاء الاصطناعي.",
    bullets: ['meetings_bullet_1', 'meetings_bullet_2', 'meetings_bullet_3'],
    image: "https://lh3.googleusercontent.com/p/AF1QipPGjbkIguKi4eV3p_wr4Js4-O_Hv-AkhlGWz88-=s1360-w1360-h1020-rw",
    detailsEn: [
      "HD video conferencing with screen sharing and recording",
      "Team chat channels organized by department or project",
      "AI-powered meeting transcription and smart summaries",
      "Action item extraction and automatic task creation",
      "Calendar integration with scheduling and reminders",
      "RARE AI generates meeting notes and follow-up tasks automatically",
    ],
    detailsAr: [
      "مؤتمرات فيديو عالية الدقة مع مشاركة الشاشة والتسجيل",
      "قنوات دردشة جماعية منظمة حسب القسم أو المشروع",
      "نسخ اجتماعات بالذكاء الاصطناعي وملخصات ذكية",
      "استخراج بنود العمل وإنشاء المهام تلقائياً",
      "تكامل التقويم مع الجدولة والتذكيرات",
      "RARE AI ينشئ ملاحظات الاجتماعات ومهام المتابعة تلقائياً",
    ],
  },
};

export default function FeatureDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language, t: translate } = useTheme();

  const feature = slug ? FEATURE_DATA[slug] : null;

  if (!feature) {
    return (
      <div className="pt-32 pb-20 px-6 bg-[var(--bg-primary)] min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Feature not found</h1>
        <button onClick={() => navigate('/features')} className="text-blue-600 font-bold hover:underline">
          {translate('back')} → {translate('features')}
        </button>
      </div>
    );
  }

  const Icon = feature.icon;
  const title = language === 'ar' ? feature.titleAr : feature.titleEn;
  const desc = language === 'ar' ? feature.descAr : feature.descEn;
  const details = language === 'ar' ? feature.detailsAr : feature.detailsEn;

  return (
    <div className="pt-32 pb-20 px-6 bg-[var(--bg-primary)] min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => navigate('/features')}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-blue-600 font-bold mb-12 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> {translate('features')}
        </button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row gap-12 items-center mb-20"
        >
          <div className="flex-1 space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-400 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">{title}</h1>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed">{desc}</p>
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                {translate('start_free')}
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="glass-card px-8 py-3 font-bold hover:bg-blue-50 transition-all"
              >
                {translate('contact')}
              </button>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="glass-card p-4 rounded-[2.5rem] shadow-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <img
                src={feature.image}
                alt={title}
                className="w-full aspect-video object-cover rounded-[2rem] shadow-lg border border-[var(--border-soft)]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </motion.div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold mb-8 tracking-tight">
            {language === 'ar' ? 'المميزات الرئيسية' : 'Key Capabilities'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {details.map((detail, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="flex items-start gap-4 p-5 glass-card"
              >
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                <span className="text-[var(--text-primary)] font-medium leading-relaxed">{detail}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick feature highlights from translation keys */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-10 text-center"
        >
          <h3 className="text-2xl font-bold mb-4">
            {language === 'ar' ? 'جاهز للبدء؟' : 'Ready to get started?'}
          </h3>
          <p className="text-[var(--text-secondary)] mb-6">
            {language === 'ar'
              ? 'ابدأ تجربتك المجانية اليوم واكتشف كيف يمكن لـ ZIEN تحويل عملياتك.'
              : 'Start your free trial today and discover how ZIEN can transform your operations.'}
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 inline-flex items-center gap-2"
          >
            {translate('start_free')} <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
