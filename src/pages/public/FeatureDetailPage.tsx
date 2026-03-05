import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { ArrowLeft, CheckCircle2, Zap, Shield, BarChart3, Users, Globe, MessageSquare, ShoppingBag, Briefcase, Video, Layout, ShieldCheck, Users2 } from 'lucide-react';

export default function FeatureDetailPage({ id, onNavigate }: { id: string, onNavigate: (to: string) => void }) {
  const { language } = useTheme();

  const featuresData: Record<string, any> = {
    'accounting': {
      icon: BarChart3,
      title: language === 'ar' ? "المحاسبة والمالية" : "Accounting & Finance",
      desc: language === 'ar' ? "إدارة الفواتير، المدفوعات، الاشتراكات، وإعدادات الضرائب حسب الدولة." : "Manage invoices, payments, subscriptions, and tax settings by country.",
      image: "https://lh3.googleusercontent.com/p/AF1QipM4Z8Hvn9cMYSRqtQNgp3ZlnnyHqSRIDaSQAKDN=s1360-w1360-h1020-rw",
      details: language === 'ar' ? [
        "إصدار فواتير ذكية وتتبع المدفوعات",
        "إدارة الضرائب المتعددة والامتثال المحلي",
        "تقارير مالية وتحليلات فورية",
        "ربط مباشر مع بوابات الدفع العالمية",
        "إدارة الميزانيات والمصروفات بدقة"
      ] : [
        "Smart invoicing and payment tracking",
        "Multi-tax management and local compliance",
        "Real-time financial reporting and analytics",
        "Direct integration with global payment gateways",
        "Accurate budget and expense management"
      ]
    },
    'sales': {
      icon: Users,
      title: language === 'ar' ? "المبيعات والتسويق" : "Sales & Marketing",
      desc: language === 'ar' ? "إدارة علاقات العملاء (CRM)، عروض الأسعار، العقود، وبوابة العملاء." : "CRM, quotes, contracts, and a dedicated client portal.",
      image: "https://lh3.googleusercontent.com/p/AF1QipOxcyDh5pI5H6Es3o-98m8D9fynSp8fBCvvrW_g=s1360-w1360-h1020-rw",
      details: language === 'ar' ? [
        "إدارة مسار المبيعات والعملاء المحتملين",
        "إنشاء عروض أسعار وعقود احترافية",
        "بوابة مخصصة للعملاء للتواصل والمتابعة",
        "تتبع أداء فريق المبيعات",
        "حملات تسويقية مستهدفة"
      ] : [
        "Sales pipeline and lead management",
        "Professional quotes and contract generation",
        "Dedicated client portal for communication",
        "Sales team performance tracking",
        "Targeted marketing campaigns"
      ]
    },
    'hr': {
      icon: Shield,
      title: language === 'ar' ? "الموارد البشرية" : "Human Resources",
      desc: language === 'ar' ? "ملفات الموظفين، التوظيف، الحضور، الرواتب، والإجازات." : "Employee files, hiring, attendance, payroll, and leaves.",
      image: "https://lh3.googleusercontent.com/p/AF1QipO9w_lR54InzNIU6W8D9AH8XRFzLL6SUwVPdJcN=s1360-w1360-h1020-rw",
      details: language === 'ar' ? [
        "إدارة شاملة لملفات الموظفين",
        "تتبع الحضور والانصراف آلياً",
        "معالجة الرواتب وإدارة طلبات الإجازات",
        "تقييم الأداء والمكافآت",
        "نظام توظيف وتتبع المتقدمين"
      ] : [
        "Comprehensive employee file management",
        "Automated attendance tracking",
        "Payroll processing and leave management",
        "Performance evaluation and rewards",
        "Recruitment and applicant tracking system"
      ]
    },
    'fleet': {
      icon: Globe,
      title: language === 'ar' ? "العمليات الميدانية والأسطول" : "Field Agents & Fleet",
      desc: language === 'ar' ? "تتبع الخرائط، إدارة المركبات، ودعم CarPlay/Android Auto." : "Map tracking, vehicle management, and CarPlay/Android Auto support.",
      image: "https://lh3.googleusercontent.com/p/AF1QipOO2HzMRuorxrjfQkOsJ_3ZfKUVWT5x718CeF6s=s1360-w1360-h1020-rw",
      details: language === 'ar' ? [
        "تتبع حي للمركبات والوكلاء الميدانيين",
        "تكامل مع CarPlay و Android Auto",
        "إدارة مهام الصيانة وجدولة الرحلات",
        "تحسين مسارات التوصيل",
        "تقارير استهلاك الوقود وكفاءة الأسطول"
      ] : [
        "Live tracking of vehicles and field agents",
        "CarPlay and Android Auto integration",
        "Maintenance task management and trip scheduling",
        "Delivery route optimization",
        "Fuel consumption and fleet efficiency reports"
      ]
    },
    'ai': {
      icon: Zap,
      title: "RARE AI Agents",
      desc: language === 'ar' ? "وكلاء ذكاء اصطناعي متخصصون (محاسبة، مبيعات، موارد بشرية، إلخ) للتحليلات والتوصيات." : "Specialized AI agents (Accounting, Sales, HR, etc.) for analytics and recommendations.",
      image: "https://www.cyberark.com/wp-content/uploads/2025/03/ai-agents-collaborative-intelligence1.jpg",
      details: language === 'ar' ? [
        "مساعد ذكي لكل قسم في الشركة",
        "تحليلات تنبؤية وتوصيات استراتيجية",
        "أتمتة المهام الروتينية وصياغة التقارير",
        "تحليل المشاعر في تواصل العملاء",
        "اكتشاف الأنماط والفرص المخفية"
      ] : [
        "Smart assistant for every company department",
        "Predictive analytics and strategic recommendations",
        "Routine task automation and report drafting",
        "Sentiment analysis in customer communication",
        "Discovering hidden patterns and opportunities"
      ]
    },
    'meetings': {
      icon: Users2,
      title: language === 'ar' ? "الاجتماعات والدردشة" : "Meetings & Chat",
      desc: language === 'ar' ? "اجتماعات الأقسام، دردشة خاصة/جماعية، وملخصات مدعومة بالذكاء الاصطناعي." : "Department meetings, private/group chat, and AI-powered summaries.",
      image: "https://lh3.googleusercontent.com/p/AF1QipPGjbkIguKi4eV3p_wr4Js4-O_Hv-AkhlGWz88-=s1360-w1360-h1020-rw",
      details: language === 'ar' ? [
        "مكالمات فيديو وصوت عالية الجودة",
        "مساحات عمل جماعية ودردشة فورية",
        "تلخيص الاجتماعات تلقائياً بالذكاء الاصطناعي",
        "مشاركة الشاشة والملفات بأمان",
        "جدولة ذكية متكاملة مع التقويم"
      ] : [
        "High-quality video and audio calls",
        "Team workspaces and instant messaging",
        "Automatic AI-powered meeting summaries",
        "Secure screen and file sharing",
        "Smart scheduling integrated with calendar"
      ]
    },
    'admin': {
      icon: Briefcase,
      title: language === 'ar' ? "المهام الإدارية والشكاوى" : "Admin Tasks & Complaints",
      desc: language === 'ar' ? "إدارة المهام، الأوامر الإدارية، المرفقات، ونظام الشكاوى." : "Task management, administrative orders, attachments, and complaints system.",
      image: "https://lh3.googleusercontent.com/p/AF1QipPwN6JEeKaXorclLqLX6pWvPluB__YEcTvMo6Ef=s1360-w1360-h1020-rw",
      details: language === 'ar' ? [
        "تتبع المهام وتعيين المسؤوليات",
        "إدارة الأوامر الإدارية والتعاميم",
        "نظام متكامل لمعالجة الشكاوى والاقتراحات",
        "أرشفة إلكترونية للوثائق والمرفقات",
        "تتبع سير العمل والموافقات"
      ] : [
        "Task tracking and responsibility assignment",
        "Management of administrative orders and circulars",
        "Integrated system for handling complaints and suggestions",
        "Electronic archiving of documents and attachments",
        "Workflow and approval tracking"
      ]
    },
    'store': {
      icon: Layout,
      title: language === 'ar' ? "المتجر المخصص" : "Customized Store",
      desc: language === 'ar' ? "متجر مخصص للمستأجر مرتبط ببوابة العملاء للمنتجات والخدمات." : "Tenant-customized store linked to client portal for products/services.",
      image: "https://lh3.googleusercontent.com/p/AF1QipMPZljVEc-2ZIfQBXj4-jbm2U-Lwng67FH5wfDL=s1360-w1360-h1020-rw",
      details: language === 'ar' ? [
        "واجهة متجر قابلة للتخصيص بالكامل",
        "إدارة المنتجات والخدمات والأسعار",
        "تكامل مباشر مع بوابة العملاء والمدفوعات",
        "إدارة المخزون والطلبات",
        "عروض ترويجية وكوبونات خصم"
      ] : [
        "Fully customizable storefront interface",
        "Product, service, and pricing management",
        "Direct integration with client portal and payments",
        "Inventory and order management",
        "Promotions and discount coupons"
      ]
    },
    'portal': {
      icon: ShieldCheck,
      title: language === 'ar' ? "بوابة الموظف" : "Employee Portal",
      desc: language === 'ar' ? "بوابة شخصية لكل موظف للوصول إلى الحضور، الإجازات، والرواتب." : "Personal portal for each employee to access attendance, leaves, and payroll.",
      image: "https://picsum.photos/seed/portal/1360/1020",
      details: language === 'ar' ? [
        "لوحة تحكم شخصية لكل موظف",
        "تقديم ومتابعة طلبات الإجازات والمغادرات",
        "الوصول إلى قسائم الرواتب والوثائق الشخصية",
        "تحديث البيانات الشخصية",
        "التواصل الداخلي والتعاميم"
      ] : [
        "Personalized dashboard for every employee",
        "Submit and track leave and departure requests",
        "Access to payslips and personal documents",
        "Update personal information",
        "Internal communication and circulars"
      ]
    }
  };

  const feature = id ? featuresData[id] : null;

  if (!feature) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{language === 'ar' ? 'الميزة غير موجودة' : 'Feature not found'}</h1>
          <button onClick={() => onNavigate('/features')} className="text-brand hover:underline">
            {language === 'ar' ? 'العودة إلى الميزات' : 'Back to Features'}
          </button>
        </div>
      </div>
    );
  }

  const Icon = feature.icon;

  return (
    <div className="pt-32 pb-20 px-6 bg-[var(--bg-primary)] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => onNavigate('/features')} className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-brand transition-colors mb-8">
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          {language === 'ar' ? 'العودة إلى الميزات' : 'Back to Features'}
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-12 rounded-[2.5rem] border-[var(--border-soft)] shadow-xl"
        >
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-brand to-brand-light text-white rounded-3xl flex items-center justify-center shadow-lg shadow-brand/20 flex-shrink-0">
              <Icon className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">{feature.title}</h1>
              <p className="text-xl text-[var(--text-secondary)]">{feature.desc}</p>
            </div>
          </div>

          <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-soft)]">
            <img 
              src={feature.image} 
              alt={feature.title} 
              className="w-full h-auto object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              {language === 'ar' ? 'الميزات الرئيسية' : 'Key Features'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {feature.details.map((detail: string, idx: number) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-soft)]">
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-lg font-medium">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
