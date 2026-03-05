import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../../constants/assets';
import { CheckCircle2, Zap, Shield, BarChart3, Users, Globe, MessageSquare, ShoppingBag, Briefcase, Video, ArrowRight } from 'lucide-react';

export default function FeaturesPage() {
  const { language, t: translate } = useTheme();
  
  const mainFeatures = [
    { 
      icon: BarChart3, 
      title: language === 'ar' ? "المحاسبة والمالية" : "Accounting & Finance", 
      desc: language === 'ar' ? "الفواتير الآلية، تتبع الضرائب، والتقارير المالية." : "Automated invoicing, tax tracking, and financial reporting.", 
      image: "https://lh3.googleusercontent.com/p/AF1QipM4Z8Hvn9cMYSRqtQNgp3ZlnnyHqSRIDaSQAKDN=s1360-w1360-h1020-rw" 
    },
    { 
      icon: Users, 
      title: language === 'ar' ? "إدارة علاقات العملاء والمبيعات" : "CRM & Sales", 
      desc: language === 'ar' ? "إدارة خطوط الأنابيب، تتبع العملاء المحتملين، وبوابة العملاء." : "Pipeline management, lead tracking, and client portal.", 
      image: "https://lh3.googleusercontent.com/p/AF1QipOxcyDh5pI5H6Es3o-98m8D9fynSp8fBCvvrW_g=s1360-w1360-h1020-rw" 
    },
    { 
      icon: Shield, 
      title: language === 'ar' ? "الموارد البشرية والرواتب" : "HR & Payroll", 
      desc: language === 'ar' ? "الحضور، إدارة الإجازات، ومعالجة الرواتب الآمنة." : "Attendance, leave management, and secure payroll processing.", 
      image: "https://lh3.googleusercontent.com/p/AF1QipO9w_lR54InzNIU6W8D9AH8XRFzLL6SUwVPdJcN=s1360-w1360-h1020-rw" 
    },
    { 
      icon: Zap, 
      title: language === 'ar' ? "وكلاء RARE AI" : "RARE AI Agents", 
      desc: language === 'ar' ? "مساعدون أذكياء لكل قسم." : "Intelligent assistants for every department.", 
      image: "https://www.cyberark.com/wp-content/uploads/2025/03/ai-agents-collaborative-intelligence1.jpg" 
    },
    { 
      icon: Globe, 
      title: language === 'ar' ? "الخدمات اللوجستية والأسطول" : "Logistics & Fleet", 
      desc: language === 'ar' ? "تتبع في الوقت الفعلي وإرسال المهام للعمليات الميدانية." : "Real-time tracking and task dispatching for field operations.", 
      image: "https://lh3.googleusercontent.com/p/AF1QipOO2HzMRuorxrjfQkOsJ_3ZfKUVWT5x718CeF6s=s1360-w1360-h1020-rw" 
    },
  ];

  const secondaryFeatures = [
    { 
      icon: Briefcase, 
      title: language === 'ar' ? "إدارة المشاريع" : "Project Management", 
      desc: language === 'ar' ? "تتبع المهام، الموافقات، والتعاون الجماعي." : "Task tracking, approvals, and team collaboration.",
      image: "https://lh3.googleusercontent.com/p/AF1QipPwN6JEeKaXorclLqLX6pWvPluB__YEcTvMo6Ef=s1360-w1360-h1020-rw"
    },
    { 
      icon: ShoppingBag, 
      title: language === 'ar' ? "المتجر العالمي" : "Global Store", 
      desc: language === 'ar' ? "تكامل التجارة الإلكترونية المرتبط بمخزونك." : "E-commerce integration linked to your inventory.",
      image: "https://lh3.googleusercontent.com/p/AF1QipMPZljVEc-2ZIfQBXj4-jbm2U-Lwng67FH5wfDL=s1360-w1360-h1020-rw"
    },
    { 
      icon: MessageSquare, 
      title: language === 'ar' ? "الاجتماعات والدردشة" : "Meetings & Chat", 
      desc: language === 'ar' ? "اتصالات موحدة مع ملخصات مدعومة بالذكاء الاصطناعي." : "Unified communication with AI-powered summaries.",
      image: "https://lh3.googleusercontent.com/p/AF1QipPGjbkIguKi4eV3p_wr4Js4-O_Hv-AkhlGWz88-=s1360-w1360-h1020-rw"
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
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-400 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <f.icon className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight">{f.title}</h2>
        <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
          {f.desc}
        </p>
        <ul className="space-y-4">
          {[1, 2, 3].map(item => (
            <li key={item} className="flex items-center gap-3 font-medium">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              {language === 'ar' ? 'تكامل معياري متقدم' : 'Advanced modular integration'}
            </li>
          ))}
        </ul>
        <button className="flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all">
          {language === 'ar' ? `تعرف على المزيد حول ${f.title}` : `Learn more about ${f.title}`} <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="flex-1 w-full"
      >
        <div className="glass-card p-4 rounded-[2.5rem] shadow-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
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
    <div className="pt-32 pb-20 px-6 bg-[var(--bg-primary)] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6">
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
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          {secondaryFeatures.map((f, i) => renderFeature(f, i + mainFeatures.length))}
        </div>
      </div>
    </div>
  );
}
