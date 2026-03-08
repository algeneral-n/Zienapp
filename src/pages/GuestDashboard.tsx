import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink, Routes, Route } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';
import { HeaderControls } from '../components/HeaderControls';
import {
  Eye, Lock, BarChart3, Users, Briefcase, ShieldCheck,
  Building2, Globe2, Zap, MessageSquare, Package, Truck,
  GraduationCap, Wrench, CreditCard, LayoutDashboard,
  Calendar, ClipboardList, LogOut, Timer, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export default function GuestDashboard() {
  const navigate = useNavigate();
  const { language } = useTheme();
  const isAr = language === 'ar';
  const [timeLeft, setTimeLeft] = useState(0);

  // Check guest token validity
  useEffect(() => {
    const token = localStorage.getItem('zien:guestToken');
    const expiry = Number(localStorage.getItem('zien:guestExpiry') || 0);
    if (!token || Date.now() > expiry) {
      localStorage.removeItem('zien:guestToken');
      localStorage.removeItem('zien:guestEmail');
      localStorage.removeItem('zien:guestExpiry');
      navigate('/guest');
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        localStorage.removeItem('zien:guestToken');
        localStorage.removeItem('zien:guestEmail');
        localStorage.removeItem('zien:guestExpiry');
        navigate('/guest');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const guestEmail = localStorage.getItem('zien:guestEmail') || 'visitor';

  const handleExit = () => {
    localStorage.removeItem('zien:guestToken');
    localStorage.removeItem('zien:guestEmail');
    localStorage.removeItem('zien:guestExpiry');
    navigate('/');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const t = {
    preview: isAr ? 'وضع المعاينة' : 'Preview Mode',
    readOnly: isAr ? 'عرض فقط - للتجربة' : 'Read Only - For evaluation',
    exit: isAr ? 'خروج' : 'Exit Preview',
    register: isAr ? 'سجل الآن للوصول الكامل' : 'Register now for full access',
    timeRemaining: isAr ? 'الوقت المتبقي' : 'Time remaining',
    overview: isAr ? 'نظرة عامة' : 'Overview',
    modules: isAr ? 'الخدمات' : 'Modules',
  };

  const modules = [
    { icon: BarChart3, name: isAr ? 'لوحة التحكم' : 'Dashboard', desc: isAr ? 'إحصائيات ومقاييس الأداء' : 'Analytics and performance metrics', color: 'blue', path: '' },
    { icon: Users, name: isAr ? 'الموارد البشرية' : 'HR Management', desc: isAr ? 'إدارة الموظفين والحضور' : 'Employee and attendance management', color: 'violet' },
    { icon: CreditCard, name: isAr ? 'المحاسبة' : 'Accounting', desc: isAr ? 'الفواتير والتقارير المالية' : 'Invoices and financial reports', color: 'emerald' },
    { icon: Truck, name: isAr ? 'اللوجستيات' : 'Logistics', desc: isAr ? 'سلسلة التوريد والشحن' : 'Supply chain and shipping', color: 'orange' },
    { icon: Briefcase, name: isAr ? 'إدارة العملاء' : 'CRM', desc: isAr ? 'إدارة العلاقات والصفقات' : 'Relationships and deals management', color: 'pink' },
    { icon: GraduationCap, name: isAr ? 'الأكاديمية' : 'Academy', desc: isAr ? 'التدريب والشهادات' : 'Training and certifications', color: 'amber' },
    { icon: Package, name: isAr ? 'المتجر' : 'Store', desc: isAr ? 'المنتجات والطلبات' : 'Products and orders', color: 'cyan' },
    { icon: ClipboardList, name: isAr ? 'المشاريع' : 'Projects', desc: isAr ? 'إدارة المهام والمعالم' : 'Tasks and milestones management', color: 'indigo' },
    { icon: Calendar, name: isAr ? 'الاجتماعات' : 'Meetings', desc: isAr ? 'الجدولة وغرف الفيديو' : 'Scheduling and video rooms', color: 'rose' },
    { icon: MessageSquare, name: isAr ? 'المحادثات' : 'Chat', desc: isAr ? 'التواصل الفوري والقنوات' : 'Real-time messaging and channels', color: 'teal' },
    { icon: Wrench, name: isAr ? 'التكاملات' : 'Integrations', desc: isAr ? 'ربط الأدوات الخارجية' : 'Connect external tools', color: 'slate' },
    { icon: Globe2, name: isAr ? 'بوابة العملاء' : 'Portal Builder', desc: isAr ? 'إنشاء بوابة مخصصة' : 'Build a custom client portal', color: 'sky' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Guest Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye size={18} />
            <span className="text-sm font-bold">{t.preview}</span>
            <span className="text-xs opacity-80 hidden sm:inline">({t.readOnly})</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono">
              <Timer size={14} />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-50 transition-all"
            >
              {t.register}
            </button>
            <button
              onClick={handleExit}
              className="text-white/80 hover:text-white text-xs flex items-center gap-1 font-bold"
            >
              <LogOut size={14} />
              {t.exit}
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg">Z</div>
            <span className="text-lg font-black tracking-tight uppercase">ZIEN</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">{t.preview}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>{guestEmail}</span>
            <HeaderControls />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<OverviewSection modules={modules} isAr={isAr} navigate={navigate} />} />
        </Routes>
      </main>
    </div>
  );
}

// ─── Overview Section ──────────────────────────────────────────────────────

function OverviewSection({ modules, isAr, navigate }: { modules: any[]; isAr: boolean; navigate: any }) {
  const t = {
    welcome: isAr ? 'مرحباً بك في منصة ZIEN' : 'Welcome to ZIEN Platform',
    explore: isAr ? 'اكتشف الخدمات المتاحة' : 'Explore available services',
    stats: isAr ? 'إحصائيات المنصة' : 'Platform Statistics',
    companies: isAr ? 'شركة مسجلة' : 'Registered Companies',
    modules_t: isAr ? 'خدمة متاحة' : 'Available Modules',
    integrations: isAr ? 'تكامل خارجي' : 'External Integrations',
    uptime: isAr ? 'وقت التشغيل' : 'Platform Uptime',
    aiPowered: isAr ? 'مدعوم بذكاء RARE AI' : 'Powered by RARE AI',
    kickstart: isAr ? 'ابدأ الآن' : 'Get Started',
    lockIcon: isAr ? 'سجل للوصول الكامل' : 'Register for full access',
  };

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-8 text-white"
      >
        <h1 className="text-3xl font-black tracking-tight mb-2">{t.welcome}</h1>
        <p className="text-blue-100 mb-6">{t.explore}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value="150+" label={t.companies} />
          <StatCard value="16" label={t.modules_t} />
          <StatCard value="40+" label={t.integrations} />
          <StatCard value="99.9%" label={t.uptime} />
        </div>
      </motion.div>

      {/* AI Badge */}
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <Zap size={14} className="text-blue-500" />
        <span className="font-bold uppercase tracking-widest">{t.aiPowered}</span>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {modules.map((mod, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:shadow-blue-600/5 transition-all cursor-pointer overflow-hidden"
          >
            {/* Lock Overlay */}
            <div className="absolute inset-0 bg-white/60 dark:bg-zinc-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10 backdrop-blur-[1px]">
              <div className="text-center">
                <Lock size={24} className="mx-auto text-blue-600 mb-2" />
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{t.lockIcon}</p>
                <button
                  onClick={() => navigate('/register')}
                  className="mt-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-700"
                >
                  {t.kickstart}
                </button>
              </div>
            </div>

            <div className={`w-12 h-12 bg-${mod.color}-100 dark:bg-${mod.color}-900/30 rounded-xl flex items-center justify-center mb-4`}>
              <mod.icon size={22} className={`text-${mod.color}-600`} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight mb-1">{mod.name}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{mod.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-zinc-900 dark:bg-zinc-800 rounded-3xl p-8 text-center text-white"
      >
        <ShieldCheck size={32} className="mx-auto mb-4 text-blue-400" />
        <h2 className="text-2xl font-black tracking-tight mb-2">
          {isAr ? 'جاهز للبدء؟' : 'Ready to get started?'}
        </h2>
        <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
          {isAr ? 'سجل شركتك الآن واحصل على وصول كامل لجميع الخدمات مع ذكاء RARE AI' : 'Register your company now and get full access to all services with RARE AI intelligence'}
        </p>
        <button
          onClick={() => navigate('/register')}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          {isAr ? 'سجل شركتك' : 'Register Your Company'}
        </button>
      </motion.div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white/10 rounded-2xl p-4 text-center">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs text-blue-100 mt-1">{label}</p>
    </div>
  );
}
