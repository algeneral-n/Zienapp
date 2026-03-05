import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { Link } from 'react-router-dom';
import { CheckCircle2, Zap, Shield, BarChart3, Users, Globe, MessageSquare, ShoppingBag, Briefcase, Video, ArrowRight, Layout, ShieldCheck, Users2 } from 'lucide-react';

export default function FeaturesPage({ onNavigate }: { onNavigate: (to: string) => void }) {
  const { language, t: translate } = useTheme();
  
  const mainFeatures = [
    { 
      id: 'accounting',
      icon: BarChart3, 
      title: language === 'ar' ? "المحاسبة والمالية" : "Accounting & Finance", 
      desc: language === 'ar' ? "إدارة الفواتير، المدفوعات، الاشتراكات، وإعدادات الضرائب حسب الدولة." : "Manage invoices, payments, subscriptions, and tax settings by country.", 
      image: "https://lh3.googleusercontent.com/p/AF1QipM4Z8Hvn9cMYSRqtQNgp3ZlnnyHqSRIDaSQAKDN=s1360-w1360-h1020-rw",
      bullets: language === 'ar' ? [
        "إصدار فواتير ذكية وتتبع المدفوعات",
        "إدارة الضرائب المتعددة والامتثال المحلي",
        "تقارير مالية وتحليلات فورية"
      ] : [
        "Smart invoicing and payment tracking",
        "Multi-tax management and local compliance",
        "Real-time financial reporting and analytics"
      ]
    },
    { 
      id: 'sales',
      icon: Users, 
      title: language === 'ar' ? "المبيعات والتسويق" : "Sales & Marketing", 
      desc: language === 'ar' ? "إدارة علاقات العملاء (CRM)، عروض الأسعار، العقود، وبوابة العملاء." : "CRM, quotes, contracts, and a dedicated client portal.", 
      image: "https://lh3.googleusercontent.com/p/AF1QipOxcyDh5pI5H6Es3o-98m8D9fynSp8fBCvvrW_g=s1360-w1360-h1020-rw",
      bullets: language === 'ar' ? [
        "إدارة مسار المبيعات والعملاء المحتملين",
        "إنشاء عروض أسعار وعقود احترافية",
        "بوابة مخصصة للعملاء للتواصل والمتابعة"
      ] : [
        "Sales pipeline and lead management",
        "Professional quotes and contract generation",
        "Dedicated client portal for communication"
      ]
    },
    { 
      id: 'hr',
      icon: Shield, 
      title: language === 'ar' ? "الموارد البشرية" : "Human Resources", 
      desc: language === 'ar' ? "ملفات الموظفين، التوظيف، الحضور، الرواتب، والإجازات." : "Employee files, hiring, attendance, payroll, and leaves.", 
      image: "https://lh3.googleusercontent.com/p/AF1QipO9w_lR54InzNIU6W8D9AH8XRFzLL6SUwVPdJcN=s1360-w1360-h1020-rw",
      bullets: language === 'ar' ? [
        "إدارة شاملة لملفات الموظفين",
        "تتبع الحضور والانصراف آلياً",
        "معالجة الرواتب وإدارة طلبات الإجازات"
      ] : [
        "Comprehensive employee file management",
        "Automated attendance tracking",
        "Payroll processing and leave management"
      ]
    },
    { 
      id: 'fleet',
      icon: Globe, 
      title: language === 'ar' ? "العمليات الميدانية والأسطول" : "Field Agents & Fleet", 
      desc: language === 'ar' ? "تتبع الخرائط، إدارة المركبات، ودعم CarPlay/Android Auto." : "Map tracking, vehicle management, and CarPlay/Android Auto support.", 
      image: "https://lh3.googleusercontent.com/p/AF1QipOO2HzMRuorxrjfQkOsJ_3ZfKUVWT5x718CeF6s=s1360-w1360-h1020-rw",
      bullets: language === 'ar' ? [
        "تتبع حي للمركبات والوكلاء الميدانيين",
        "تكامل مع CarPlay و Android Auto",
        "إدارة مهام الصيانة وجدولة الرحلات"
      ] : [
        "Live tracking of vehicles and field agents",
        "CarPlay and Android Auto integration",
        "Maintenance task management and trip scheduling"
      ]
    },
    { 
      id: 'ai',
      icon: Zap, 
      title: "RARE AI Agents", 
      desc: language === 'ar' ? "وكلاء ذكاء اصطناعي متخصصون (محاسبة، مبيعات، موارد بشرية، إلخ) للتحليلات والتوصيات." : "Specialized AI agents (Accounting, Sales, HR, etc.) for analytics and recommendations.", 
      image: "https://www.cyberark.com/wp-content/uploads/2025/03/ai-agents-collaborative-intelligence1.jpg",
      bullets: language === 'ar' ? [
        "مساعد ذكي لكل قسم في الشركة",
        "تحليلات تنبؤية وتوصيات استراتيجية",
        "أتمتة المهام الروتينية وصياغة التقارير"
      ] : [
        "Smart assistant for every company department",
        "Predictive analytics and strategic recommendations",
        "Routine task automation and report drafting"
      ]
    },
  ];

  const secondaryFeatures = [
    { 
      id: 'meetings',
      icon: Users2, 
      title: language === 'ar' ? "الاجتماعات والدردشة" : "Meetings & Chat", 
      desc: language === 'ar' ? "اجتماعات الأقسام، دردشة خاصة/جماعية، وملخصات مدعومة بالذكاء الاصطناعي." : "Department meetings, private/group chat, and AI-powered summaries.",
      image: "https://lh3.googleusercontent.com/p/AF1QipPGjbkIguKi4eV3p_wr4Js4-O_Hv-AkhlGWz88-=s1360-w1360-h1020-rw",
      bullets: language === 'ar' ? [
        "مكالمات فيديو وصوت عالية الجودة",
        "مساحات عمل جماعية ودردشة فورية",
        "تلخيص الاجتماعات تلقائياً بالذكاء الاصطناعي"
      ] : [
        "High-quality video and audio calls",
        "Team workspaces and instant messaging",
        "Automatic AI-powered meeting summaries"
      ]
    },
    { 
      id: 'admin',
      icon: Briefcase, 
      title: language === 'ar' ? "المهام الإدارية والشكاوى" : "Admin Tasks & Complaints", 
      desc: language === 'ar' ? "إدارة المهام، الأوامر الإدارية، المرفقات، ونظام الشكاوى." : "Task management, administrative orders, attachments, and complaints system.",
      image: "https://lh3.googleusercontent.com/p/AF1QipPwN6JEeKaXorclLqLX6pWvPluB__YEcTvMo6Ef=s1360-w1360-h1020-rw",
      bullets: language === 'ar' ? [
        "تتبع المهام وتعيين المسؤوليات",
        "إدارة الأوامر الإدارية والتعاميم",
        "نظام متكامل لمعالجة الشكاوى والاقتراحات"
      ] : [
        "Task tracking and responsibility assignment",
        "Management of administrative orders and circulars",
        "Integrated system for handling complaints and suggestions"
      ]
    },
    { 
      id: 'store',
      icon: Layout, 
      title: language === 'ar' ? "المتجر المخصص" : "Customized Store", 
      desc: language === 'ar' ? "متجر مخصص للمستأجر مرتبط ببوابة العملاء للمنتجات والخدمات." : "Tenant-customized store linked to client portal for products/services.",
      image: "https://lh3.googleusercontent.com/p/AF1QipMPZljVEc-2ZIfQBXj4-jbm2U-Lwng67FH5wfDL=s1360-w1360-h1020-rw",
      bullets: language === 'ar' ? [
        "واجهة متجر قابلة للتخصيص بالكامل",
        "إدارة المنتجات والخدمات والأسعار",
        "تكامل مباشر مع بوابة العملاء والمدفوعات"
      ] : [
        "Fully customizable storefront interface",
        "Product, service, and pricing management",
        "Direct integration with client portal and payments"
      ]
    },
    { 
      id: 'portal',
      icon: ShieldCheck, 
      title: language === 'ar' ? "بوابة الموظف" : "Employee Portal", 
      desc: language === 'ar' ? "بوابة شخصية لكل موظف للوصول إلى الحضور، الإجازات، والرواتب." : "Personal portal for each employee to access attendance, leaves, and payroll.",
      image: "https://picsum.photos/seed/portal/1360/1020",
      bullets: language === 'ar' ? [
        "لوحة تحكم شخصية لكل موظف",
        "تقديم ومتابعة طلبات الإجازات والمغادرات",
        "الوصول إلى قسائم الرواتب والوثائق الشخصية"
      ] : [
        "Personalized dashboard for every employee",
        "Submit and track leave and departure requests",
        "Access to payslips and personal documents"
      ]
    },
  ];

  const renderFeature = (f: any, i: number) => (
    <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 items-center`}>
      <motion.div 
        initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex-1 space-y-8"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-brand to-brand-light text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
          <f.icon className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight">{f.title}</h2>
        <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
          {f.desc}
        </p>
        <ul className="space-y-4">
          {f.bullets.map((bullet: string, idx: number) => (
            <li key={idx} className="flex items-center gap-3 font-medium">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <button onClick={() => onNavigate(`/features/${f.id}`)} className="inline-flex items-center gap-2 text-brand font-bold hover:gap-3 transition-all">
          {language === 'ar' ? `تعرف على المزيد حول ${f.title}` : `Learn more about ${f.title}`} <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="flex-1 w-full"
      >
        <div className="glass-card p-4 rounded-[2.5rem] shadow-2xl bg-gradient-to-br from-brand/10 to-brand-light/10 border-brand/20">
          <img 
            src={f.image} 
            alt={f.title} 
            className="w-full aspect-video object-cover rounded-[2rem] shadow-lg border border-[var(--border-soft)]"
            referrerPolicy="no-referrer"
          />
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="pt-12 pb-20 px-6 bg-[var(--bg-primary)] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-light text-brand text-sm font-bold mb-6">
            <Zap className="w-4 h-4 fill-current" />
            {language === 'ar' ? 'ميزات على مستوى المؤسسات' : 'Enterprise Grade Features'}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            {language === 'ar' ? 'كل ما تحتاجه للتوسع' : 'Everything you need to scale'}
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
            {language === 'ar' 
              ? 'مجموعة شاملة من الأدوات المصممة للتعامل مع كل جانب من جوانب عمليات عملك بدقة مدفوعة بالذكاء الاصطناعي.' 
              : 'A comprehensive suite of tools designed to handle every aspect of your business operations with AI-driven precision.'}
          </p>
        </div>

        {/* Main Feature Sections */}
        <div className="space-y-32">
          {mainFeatures.map((f, i) => renderFeature(f, i))}
        </div>

        {/* Secondary Feature Sections */}
        <div className="mt-40 space-y-32">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-6">{language === 'ar' ? 'المزيد من الحلول المتكاملة' : 'More Integrated Solutions'}</h2>
            <div className="w-24 h-1 bg-brand mx-auto rounded-full"></div>
          </div>
          {secondaryFeatures.map((f, i) => renderFeature(f, i + mainFeatures.length))}
        </div>
      </div>
    </div>
  );
}
