import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../components/ThemeProvider';
import { INDUSTRY_SECTORS, MODULE_CATALOG, getSectorModules, type ModuleDef } from '../../data/industries';
import {
  CheckCircle2, Zap, ArrowRight, Boxes,
  Layers, Users, BarChart3, Shield, Globe, MessageSquare,
  ShoppingBag, Briefcase, FileText, Truck, Warehouse,
  GraduationCap, Wrench, Banknote,
} from 'lucide-react';

// Feature detail bullets per module (for the detailed view)
const MODULE_BULLETS: Record<string, { en: string[]; ar: string[] }> = {
  hr: {
    en: ['Employee records & contracts', 'Attendance & time tracking', 'Leave management & approvals', 'Payroll processing & payslips', 'Performance reviews'],
    ar: ['سجلات الموظفين والعقود', 'الحضور وتتبع الوقت', 'إدارة الإجازات والموافقات', 'معالجة الرواتب وكشوف المرتبات', 'تقييم الأداء'],
  },
  accounting: {
    en: ['General ledger & chart of accounts', 'Automated invoicing & billing', 'Tax calculation (VAT/GST)', 'Financial reports & statements', 'Multi-currency support'],
    ar: ['دفتر الأستاذ وشجرة الحسابات', 'الفوترة الآلية والفواتير', 'حساب الضرائب (ضريبة القيمة المضافة)', 'التقارير والقوائم المالية', 'دعم العملات المتعددة'],
  },
  crm: {
    en: ['Sales pipeline management', 'Lead tracking & scoring', 'Contact & deal management', 'Email & activity tracking', 'Sales forecasting'],
    ar: ['إدارة خط المبيعات', 'تتبع العملاء المحتملين', 'إدارة جهات الاتصال والصفقات', 'تتبع البريد والنشاطات', 'التنبؤ بالمبيعات'],
  },
  projects: {
    en: ['Task boards & Gantt charts', 'Milestone tracking', 'Team collaboration', 'Time tracking & logging', 'Document sharing'],
    ar: ['لوحات المهام ومخططات جانت', 'تتبع المعالم', 'التعاون الجماعي', 'تتبع الوقت والتسجيل', 'مشاركة المستندات'],
  },
  store: {
    en: ['Product catalog & categories', 'Point of sale (POS)', 'E-commerce storefront', 'Order management', 'Promotions & discounts'],
    ar: ['كتالوج المنتجات والفئات', 'نقاط البيع (POS)', 'واجهة المتجر الإلكتروني', 'إدارة الطلبات', 'العروض والخصومات'],
  },
  inventory: {
    en: ['Stock tracking & levels', 'Warehouse management', 'Transfer & adjustments', 'Barcode scanning', 'Low stock alerts'],
    ar: ['تتبع المخزون والمستويات', 'إدارة المستودعات', 'التحويلات والتعديلات', 'مسح الباركود', 'تنبيهات نفاد المخزون'],
  },
  logistics: {
    en: ['Fleet GPS tracking', 'Route optimization', 'Delivery management', 'Driver assignment', 'Fuel & maintenance logs'],
    ar: ['تتبع الأسطول بالـ GPS', 'تحسين المسارات', 'إدارة التوصيل', 'تعيين السائقين', 'سجلات الوقود والصيانة'],
  },
  rare: {
    en: ['24 specialized AI agents', 'Department-specific assistance', 'Data analysis & insights', 'Automated recommendations', 'Multi-language support'],
    ar: ['24 وكيل ذكاء اصطناعي متخصص', 'مساعدة حسب القسم', 'تحليل البيانات والرؤى', 'توصيات آلية', 'دعم متعدد اللغات'],
  },
  control_room: {
    en: ['Real-time operations dashboard', 'KPI monitoring', 'Alert management', 'Live activity feed', 'Custom widgets'],
    ar: ['لوحة العمليات الحية', 'مراقبة مؤشرات الأداء', 'إدارة التنبيهات', 'بث النشاطات المباشر', 'أدوات مخصصة'],
  },
  automation: {
    en: ['Custom workflow builder', 'Trigger-based actions', 'Approval chains', 'Scheduled tasks', 'Integration webhooks'],
    ar: ['منشئ سير العمل المخصص', 'إجراءات بناءً على المشغلات', 'سلاسل الموافقات', 'المهام المجدولة', 'ربط API وWebhooks'],
  },
  analytics: {
    en: ['BI dashboards', 'Custom report builder', 'Predictive insights', 'Data export & visualization', 'Trend analysis'],
    ar: ['لوحات ذكاء الأعمال', 'منشئ التقارير المخصصة', 'رؤى تنبؤية', 'تصدير البيانات والرسوم', 'تحليل الاتجاهات'],
  },
  documents: {
    en: ['Document management', 'Template library', 'Version control', 'Digital signatures', 'Approval workflows'],
    ar: ['إدارة المستندات', 'مكتبة القوالب', 'التحكم بالإصدارات', 'التوقيعات الرقمية', 'سير عمل الموافقات'],
  },
  recruitment: {
    en: ['Job posting management', 'Applicant tracking', 'Interview scheduling', 'Hiring pipeline', 'Onboarding automation'],
    ar: ['إدارة الإعلانات الوظيفية', 'تتبع المتقدمين', 'جدولة المقابلات', 'خط التوظيف', 'أتمتة الإلحاق'],
  },
  training: {
    en: ['Course management (LMS)', 'Certifications tracking', 'Skill assessments', 'Learning paths', 'Progress reports'],
    ar: ['إدارة الدورات (LMS)', 'تتبع الشهادات', 'تقييم المهارات', 'مسارات التعلم', 'تقارير التقدم'],
  },
  client_portal: {
    en: ['Customer self-service', 'Ticket management', 'Invoice viewing', 'Project updates', 'Knowledge base'],
    ar: ['الخدمة الذاتية للعملاء', 'إدارة التذاكر', 'عرض الفواتير', 'تحديثات المشاريع', 'قاعدة المعرفة'],
  },
  integrations: {
    en: ['API gateway', 'Third-party connectors', 'Webhook management', 'Data sync', 'Custom integrations'],
    ar: ['بوابة API', 'موصلات الطرف الثالث', 'إدارة Webhooks', 'مزامنة البيانات', 'تكاملات مخصصة'],
  },
};

export default function FeaturesPage() {
  const { language, t: translate } = useTheme();
  const navigate = useNavigate();
  const isAr = language === 'ar';

  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // Group modules by category
  const coreModules = MODULE_CATALOG.filter(m => m.category === 'core');
  const addonModules = MODULE_CATALOG.filter(m => m.category === 'addon');
  const premiumModules = MODULE_CATALOG.filter(m => m.category === 'premium');

  const renderModuleCard = (mod: ModuleDef, i: number, highlighted = false) => {
    const bullets = MODULE_BULLETS[mod.code];
    const Icon = mod.icon;
    return (
      <motion.div
        key={mod.code}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.05 }}
        className={`glass-card p-6 rounded-[24px] hover:shadow-lg transition-all group ${highlighted ? 'border-blue-500/30 ring-2 ring-blue-500/20' : ''}`}
      >
        <div className="w-12 h-12 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold mb-2">{isAr ? mod.nameAr : mod.nameEn}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">{isAr ? mod.descAr : mod.descEn}</p>
        {bullets && (
          <ul className="space-y-2">
            {(isAr ? bullets.ar : bullets.en).map((b, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${mod.category === 'premium' ? 'text-amber-600' : mod.category === 'addon' ? 'text-violet-600' : 'text-emerald-600'}`}>
            {mod.category === 'premium' ? (isAr ? 'متقدم' : 'Premium') : mod.category === 'addon' ? (isAr ? 'إضافي' : 'Add-on') : (isAr ? 'أساسي' : 'Core')}
          </span>
        </div>
      </motion.div>
    );
  };

  // If a sector is selected, show its specific modules
  const sectorObj = INDUSTRY_SECTORS.find(s => s.code === selectedSector);
  const sectorModules = sectorObj ? getSectorModules(sectorObj.code) : [];

  return (
    <div className="pt-32 pb-20 px-6 bg-[var(--bg-primary)] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6">
            <Zap className="w-4 h-4 fill-current" />
            {translate('enterprise_grade')}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            {isAr ? 'كل ما تحتاجه لإدارة أعمالك' : 'Everything You Need to Run Your Business'}
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
            {isAr
              ? '18+ وحدة متكاملة تعمل معاً داخل منظومة واحدة. تحكم واحد، تكامل كامل، لجميع القطاعات.'
              : '18+ integrated modules working together in one unified system. One control, full integration, for all industries.'}
          </p>
        </div>

        {/* Sector Filter */}
        <div className="mb-12">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 text-center">
            {isAr ? 'فلتر حسب القطاع' : 'Filter by Industry'}
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedSector(null)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${!selectedSector ? 'bg-blue-600 text-white shadow-lg' : 'glass-card hover:border-blue-400'}`}
            >
              {isAr ? 'الكل' : 'All Modules'}
            </button>
            {INDUSTRY_SECTORS.map(sector => {
              const SIcon = sector.icon;
              return (
                <button
                  key={sector.code}
                  onClick={() => setSelectedSector(sector.code)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${selectedSector === sector.code ? 'bg-blue-600 text-white shadow-lg' : 'glass-card hover:border-blue-400'}`}
                >
                  <SIcon className="w-3.5 h-3.5" />
                  {isAr ? sector.nameAr : sector.nameEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sector-specific info */}
        {sectorObj && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 p-6 rounded-[24px] bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-700/30">
            <div className="flex items-center justify-center gap-3 mb-2">
              <sectorObj.icon className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold">{isAr ? sectorObj.nameAr : sectorObj.nameEn}</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{isAr ? sectorObj.descAr : sectorObj.descEn}</p>
            <p className="text-xs font-bold text-blue-600 mt-2">{sectorModules.length} {isAr ? 'وحدة موصى بها لهذا القطاع' : 'modules recommended for this sector'}</p>
          </motion.div>
        )}

        {/* Modules Grid */}
        {selectedSector ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {sectorModules.map((mod, i) => renderModuleCard(mod, i, true))}
          </div>
        ) : (
          <>
            {/* Core Modules */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <Layers className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold">{isAr ? 'الوحدات الأساسية' : 'Core Modules'}</h2>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{isAr ? 'مضمنة في كل خطة' : 'Included in every plan'}</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coreModules.map((mod, i) => renderModuleCard(mod, i))}
              </div>
            </div>

            {/* Add-on Modules */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <Boxes className="w-6 h-6 text-violet-600" />
                <h2 className="text-2xl font-bold">{isAr ? 'الوحدات الإضافية' : 'Add-on Modules'}</h2>
                <span className="text-xs font-bold bg-violet-100 text-violet-700 px-3 py-1 rounded-full">{isAr ? 'حسب الحاجة' : 'As needed'}</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {addonModules.map((mod, i) => renderModuleCard(mod, i))}
              </div>
            </div>

            {/* Premium Modules */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <Zap className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl font-bold">{isAr ? 'الوحدات المتقدمة' : 'Premium Modules'}</h2>
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">{isAr ? 'للمؤسسات' : 'Enterprise'}</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {premiumModules.map((mod, i) => renderModuleCard(mod, i))}
              </div>
            </div>
          </>
        )}

        {/* CTA */}
        <div className="text-center py-16">
          <h2 className="text-3xl font-bold mb-4">{isAr ? 'جاهز للبدء؟' : 'Ready to Get Started?'}</h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
            {isAr ? 'سجّل شركتك الآن واحصل على كل الوحدات المناسبة لقطاعك.' : 'Register your company now and get all modules tailored to your industry.'}
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 inline-flex items-center gap-2"
          >
            {isAr ? 'سجّل شركتك' : 'Register Your Company'} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
