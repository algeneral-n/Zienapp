import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../../constants/assets';
import GuidedTour from '../../components/GuidedTour';
import { TOUR_STEPS } from '../../constants/tourSteps';
import { CheckCircle2, Zap, Shield, BarChart3, Users, Globe, MessageSquare, ShoppingBag, Briefcase, Video, ArrowRight, PlayCircle } from 'lucide-react';

/* ─── External Video Embed ────────────────────────────────────────────── */
function FeaturesVideo({ language }: { language: string }) {
  const isAr = language === 'ar';
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
      className="w-full mb-24">
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-violet-500/20 p-1.5 shadow-2xl shadow-blue-600/15">
        <div className="relative rounded-[1.6rem] overflow-hidden bg-black">
          <div className="absolute top-4 left-4 z-10">
            <span className="px-4 py-1.5 bg-blue-600/90 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-lg">
              <Video size={12} /> {isAr ? 'عرض المنصة' : 'Platform Demo'}
            </span>
          </div>
          <video
            src={ASSETS.VIDEO_GPHOTO}
            className="w-full aspect-video"
            controls
            autoPlay
            muted
            playsInline
            poster="/splash.gif"
            style={{ border: 'none' }}
            title={isAr ? 'عرض منصة ZIEN' : 'ZIEN Platform Demo'}
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-blue-600" /> {isAr ? 'شاهد كيف تعمل ZIEN' : 'See how ZIEN works'}</span>
        <span className="w-1 h-1 bg-zinc-400 rounded-full" />
        <span>{isAr ? 'عرض تفاعلي كامل' : 'Full interactive walkthrough'}</span>
      </div>
    </motion.div>
  );
}

export default function FeaturesPage() {
  const { language, t: translate } = useTheme();
  const navigate = useNavigate();

  const mainFeatures = [
    {
      icon: BarChart3,
      slug: 'accounting',
      title: language === 'ar' ? "المحاسبة والمالية" : "Accounting & Finance",
      desc: language === 'ar' ? "الفواتير الآلية، تتبع الضرائب، والتقارير المالية." : "Automated invoicing, tax tracking, and financial reporting.",
      image: "https://lh3.googleusercontent.com/p/AF1QipM4Z8Hvn9cMYSRqtQNgp3ZlnnyHqSRIDaSQAKDN=s1360-w1360-h1020-rw",
      bullets: ['accounting_bullet_1', 'accounting_bullet_2', 'accounting_bullet_3'],
    },
    {
      icon: Users,
      slug: 'crm',
      title: language === 'ar' ? "إدارة علاقات العملاء والمبيعات" : "CRM & Sales",
      desc: language === 'ar' ? "إدارة خطوط الأنابيب، تتبع العملاء المحتملين، وبوابة العملاء." : "Pipeline management, lead tracking, and client portal.",
      image: "https://lh3.googleusercontent.com/p/AF1QipOxcyDh5pI5H6Es3o-98m8D9fynSp8fBCvvrW_g=s1360-w1360-h1020-rw",
      bullets: ['crm_bullet_1', 'crm_bullet_2', 'crm_bullet_3'],
    },
    {
      icon: Shield,
      slug: 'hr',
      title: language === 'ar' ? "الموارد البشرية والرواتب" : "HR & Payroll",
      desc: language === 'ar' ? "الحضور، إدارة الإجازات، ومعالجة الرواتب الآمنة." : "Attendance, leave management, and secure payroll processing.",
      image: "https://lh3.googleusercontent.com/p/AF1QipO9w_lR54InzNIU6W8D9AH8XRFzLL6SUwVPdJcN=s1360-w1360-h1020-rw",
      bullets: ['hr_bullet_1', 'hr_bullet_2', 'hr_bullet_3'],
    },
    {
      icon: Zap,
      slug: 'rare-ai',
      title: language === 'ar' ? "وكلاء RARE AI" : "RARE AI Agents",
      desc: language === 'ar' ? "مساعدون أذكياء لكل قسم." : "Intelligent assistants for every department.",
      image: "https://www.cyberark.com/wp-content/uploads/2025/03/ai-agents-collaborative-intelligence1.jpg",
      bullets: ['rare_bullet_1', 'rare_bullet_2', 'rare_bullet_3'],
    },
    {
      icon: Globe,
      slug: 'logistics',
      title: language === 'ar' ? "الخدمات اللوجستية والأسطول" : "Logistics & Fleet",
      desc: language === 'ar' ? "تتبع في الوقت الفعلي وإرسال المهام للعمليات الميدانية." : "Real-time tracking and task dispatching for field operations.",
      image: "https://lh3.googleusercontent.com/p/AF1QipOO2HzMRuorxrjfQkOsJ_3ZfKUVWT5x718CeF6s=s1360-w1360-h1020-rw",
      bullets: ['logistics_bullet_1', 'logistics_bullet_2', 'logistics_bullet_3'],
    },
  ];

  const secondaryFeatures = [
    {
      icon: Briefcase,
      slug: 'project-management',
      title: language === 'ar' ? "إدارة المشاريع" : "Project Management",
      desc: language === 'ar' ? "تتبع المهام، الموافقات، والتعاون الجماعي." : "Task tracking, approvals, and team collaboration.",
      image: "https://lh3.googleusercontent.com/p/AF1QipPwN6JEeKaXorclLqLX6pWvPluB__YEcTvMo6Ef=s1360-w1360-h1020-rw",
      bullets: ['pm_bullet_1', 'pm_bullet_2', 'pm_bullet_3'],
    },
    {
      icon: ShoppingBag,
      slug: 'global-store',
      title: language === 'ar' ? "المتجر العالمي" : "Global Store",
      desc: language === 'ar' ? "تكامل التجارة الإلكترونية المرتبط بمخزونك." : "E-commerce integration linked to your inventory.",
      image: "https://lh3.googleusercontent.com/p/AF1QipMPZljVEc-2ZIfQBXj4-jbm2U-Lwng67FH5wfDL=s1360-w1360-h1020-rw",
      bullets: ['store_bullet_1', 'store_bullet_2', 'store_bullet_3'],
    },
    {
      icon: MessageSquare,
      slug: 'meetings-chat',
      title: language === 'ar' ? "الاجتماعات والدردشة" : "Meetings & Chat",
      desc: language === 'ar' ? "اتصالات موحدة مع ملخصات مدعومة بالذكاء الاصطناعي." : "Unified communication with AI-powered summaries.",
      image: "https://lh3.googleusercontent.com/p/AF1QipPGjbkIguKi4eV3p_wr4Js4-O_Hv-AkhlGWz88-=s1360-w1360-h1020-rw",
      bullets: ['meetings_bullet_1', 'meetings_bullet_2', 'meetings_bullet_3'],
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
          {f.bullets.map((bulletKey: string, idx: number) => (
            <li key={idx} className="flex items-center gap-3 font-medium">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              {translate(bulletKey)}
            </li>
          ))}
        </ul>
        <button
          onClick={() => navigate(`/features/${f.slug}`)}
          className="flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all"
        >
          {translate('learn_more_about')} {f.title} <ArrowRight className="w-5 h-5" />
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
            {translate('enterprise_grade')}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            {translate('everything_to_scale')}
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
            {translate('features_hero_desc')}
          </p>
        </div>

        {/* Platform Video */}
        <FeaturesVideo language={language} />

        {/* Main Feature Sections */}
        <div className="space-y-32">
          {mainFeatures.map((f, i) => renderFeature(f, i))}
        </div>

        {/* Secondary Feature Sections */}
        <div className="mt-40 space-y-32">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-6">{translate('more_solutions')}</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          {secondaryFeatures.map((f, i) => renderFeature(f, i + mainFeatures.length))}
        </div>
      </div>
    </div>
  );
}
