import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../../constants/assets';
import { supabase } from '../../services/supabase';
import GuidedTour from '../../components/GuidedTour';
import { TOUR_STEPS } from '../../constants/tourSteps';
import {
  BookOpen, Play, FileText, Award, ArrowRight, Clock, Users,
  CheckCircle, Star, Target, Layers, Brain, ShieldCheck, BarChart3,
  GraduationCap, Trophy, X, ChevronRight, Video, ClipboardCheck, Loader2,
  PlayCircle
} from 'lucide-react';

type TrackKey = 'all' | 'core' | 'hr' | 'finance' | 'ai' | 'security' | 'crm' | 'logistics';
type TabKey = 'courses' | 'tests' | 'certificates' | 'case-studies';

interface Course {
  id: string;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  track: TrackKey;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_min: number;
  lessons: number;
  students: number;
  rating: number;
  icon: React.ElementType;
}

// Icon map for courses loaded from DB
const TRACK_ICONS: Record<string, React.ElementType> = {
  core: Play,
  hr: Users,
  finance: BarChart3,
  ai: Brain,
  security: ShieldCheck,
  crm: Users,
  logistics: Layers,
};

// Fallback courses — comprehensive real educational content
const FALLBACK_COURSES: Course[] = [
  // ── CORE PLATFORM ──
  {
    id: 'c1', track: 'core', level: 'beginner', duration_min: 15, lessons: 5, students: 1240, rating: 4.9, icon: Play,
    title_en: 'Getting Started with ZIEN', title_ar: 'البدء مع ZIEN',
    desc_en: 'Complete onboarding: register your company, invite team members, configure settings, and navigate the dashboard confidently.',
    desc_ar: 'التسجيل الكامل: تسجيل شركتك ودعوة فريقك وتكوين الإعدادات والتنقل في لوحة التحكم بثقة.'
  },
  {
    id: 'c2', track: 'core', level: 'intermediate', duration_min: 25, lessons: 8, students: 890, rating: 4.8, icon: Layers,
    title_en: 'Multi-Tenant Architecture & Admin', title_ar: 'البنية المتعددة والإدارة',
    desc_en: 'Deep dive into ZIEN\'s multi-tenant isolation, company provisioning, module activation, and admin-level configuration.',
    desc_ar: 'تعمق في عزل المستأجرين وتوفير الشركات وتفعيل الوحدات وتكوين مستوى المدير.'
  },
  // ── HR & PAYROLL ──
  {
    id: 'c3', track: 'hr', level: 'beginner', duration_min: 30, lessons: 10, students: 1560, rating: 4.7, icon: Users,
    title_en: 'HR Fundamentals: Employee Lifecycle', title_ar: 'أساسيات الموارد البشرية: دورة حياة الموظف',
    desc_en: 'Manage the complete employee journey — from hiring and onboarding to directory management, contract tracking, and offboarding.',
    desc_ar: 'إدارة رحلة الموظف الكاملة — من التوظيف والتأهيل إلى إدارة الدليل وتتبع العقود والمغادرة.'
  },
  {
    id: 'c4', track: 'hr', level: 'intermediate', duration_min: 40, lessons: 12, students: 1120, rating: 4.6, icon: Users,
    title_en: 'Payroll, Attendance & Leave', title_ar: 'الرواتب والحضور والإجازات',
    desc_en: 'Configure salary structures, deductions, taxes, overtime. Set up clock-in/out with GPS, manage leave balances and approval workflows.',
    desc_ar: 'إعداد هياكل الرواتب والخصومات والضرائب والعمل الإضافي. تهيئة الحضور بـ GPS وإدارة أرصدة الإجازات وسير عمل الموافقة.'
  },
  // ── FINANCE ──
  {
    id: 'c5', track: 'finance', level: 'beginner', duration_min: 35, lessons: 10, students: 980, rating: 4.8, icon: BarChart3,
    title_en: 'Accounting Essentials', title_ar: 'أساسيات المحاسبة',
    desc_en: 'Chart of Accounts setup, journal entries, invoice creation and tracking, bank reconciliation, and multi-currency support.',
    desc_ar: 'إعداد شجرة الحسابات والقيود اليومية وإنشاء الفواتير وتتبعها ومطابقة البنك ودعم العملات المتعددة.'
  },
  {
    id: 'c6', track: 'finance', level: 'advanced', duration_min: 45, lessons: 14, students: 650, rating: 4.9, icon: BarChart3,
    title_en: 'Financial Reporting & Tax', title_ar: 'التقارير المالية والضرائب',
    desc_en: 'Generate P&L, Balance Sheet, Cash Flow reports. Configure VAT/Tax rules, filing deadlines, and audit trails.',
    desc_ar: 'إنشاء تقارير الربح والخسارة والميزانية العمومية والتدفق النقدي. إعداد قواعد الضريبة والمواعيد والمسارات التدقيقية.'
  },
  // ── AI ──
  {
    id: 'c7', track: 'ai', level: 'beginner', duration_min: 20, lessons: 7, students: 2100, rating: 4.9, icon: Brain,
    title_en: 'RARE AI: Your Smart Assistant', title_ar: 'RARE AI: مساعدك الذكي',
    desc_en: 'Learn to use RARE AI modes (Chat, Analyze, Search, Senate), generate reports, get insights, and automate repetitive tasks.',
    desc_ar: 'تعلم استخدام أوضاع RARE AI (المحادثة، التحليل، البحث، مجلس الشيوخ) وإنشاء التقارير والحصول على رؤى وأتمتة المهام.'
  },
  {
    id: 'c8', track: 'ai', level: 'advanced', duration_min: 35, lessons: 9, students: 780, rating: 4.7, icon: Brain,
    title_en: 'Advanced AI: Senate & Workflows', title_ar: 'متقدم AI: مجلس الشيوخ وسير العمل',
    desc_en: 'Master multi-agent Senate deliberation for complex decisions, create AI-powered automation workflows, and customize AI behavior.',
    desc_ar: 'إتقان تداول مجلس الشيوخ متعدد الوكلاء للقرارات المعقدة وإنشاء سير عمل الأتمتة بالذكاء الاصطناعي وتخصيص سلوك AI.'
  },
  // ── SECURITY ──
  {
    id: 'c9', track: 'security', level: 'intermediate', duration_min: 25, lessons: 8, students: 720, rating: 4.8, icon: ShieldCheck,
    title_en: 'Security & Compliance', title_ar: 'الأمان والامتثال',
    desc_en: 'RLS policies, MFA setup, session management, audit logging, data encryption, and GDPR/SOC2 compliance practices.',
    desc_ar: 'سياسات أمان مستوى الصف وإعداد MFA وإدارة الجلسات وسجلات التدقيق وتشفير البيانات وممارسات الامتثال.'
  },
  {
    id: 'c10', track: 'security', level: 'advanced', duration_min: 30, lessons: 7, students: 460, rating: 4.6, icon: ShieldCheck,
    title_en: 'Admin Security & Access Control', title_ar: 'أمان المدير والتحكم بالوصول',
    desc_en: 'Configure RBAC matrix, IP restrictions, API key management, webhook security, and incident response procedures.',
    desc_ar: 'إعداد مصفوفة RBAC وقيود IP وإدارة مفاتيح API وأمان Webhook وإجراءات الاستجابة للحوادث.'
  },
  // ── CRM ──
  {
    id: 'c11', track: 'crm', level: 'beginner', duration_min: 30, lessons: 9, students: 1350, rating: 4.7, icon: Target,
    title_en: 'CRM & Sales Pipeline Mastery', title_ar: 'إتقان إدارة العملاء وخط المبيعات',
    desc_en: 'Lead capture, scoring, and routing. Kanban pipeline, deal forecasting, client portal setup, and automated follow-ups.',
    desc_ar: 'التقاط العملاء المحتملين وتقييمهم وتوجيههم. خط أنابيب كانبان والتنبؤ بالصفقات وإعداد بوابة العميل والمتابعة التلقائية.'
  },
  {
    id: 'c12', track: 'crm', level: 'intermediate', duration_min: 25, lessons: 7, students: 890, rating: 4.5, icon: Target,
    title_en: 'Client Portal & Communication', title_ar: 'بوابة العميل والتواصل',
    desc_en: 'Set up branded self-service client portal, automated email communications, proposal templates, and satisfaction surveys.',
    desc_ar: 'إعداد بوابة خدمة ذاتية ذات علامة تجارية واتصالات بريد إلكتروني آلية وقوالب العروض واستطلاعات الرضا.'
  },
  // ── LOGISTICS ──
  {
    id: 'c13', track: 'logistics', level: 'beginner', duration_min: 30, lessons: 8, students: 670, rating: 4.6, icon: Layers,
    title_en: 'Logistics & Fleet Management', title_ar: 'إدارة اللوجستيات والأسطول',
    desc_en: 'Real-time vehicle tracking, task dispatch, route optimization, driver management, and delivery confirmation workflows.',
    desc_ar: 'تتبع المركبات في الوقت الفعلي وإرسال المهام وتحسين المسار وإدارة السائقين وسير عمل تأكيد التسليم.'
  },
  {
    id: 'c14', track: 'logistics', level: 'intermediate', duration_min: 25, lessons: 6, students: 430, rating: 4.5, icon: Layers,
    title_en: 'Inventory & Warehouse Operations', title_ar: 'المخزون وعمليات المستودعات',
    desc_en: 'Manage warehouse zones, stock levels, purchase orders, supplier management, and automated reorder points.',
    desc_ar: 'إدارة مناطق المستودعات ومستويات المخزون وأوامر الشراء وإدارة الموردين ونقاط إعادة الطلب التلقائية.'
  },
];

const TRACKS: { key: TrackKey; en: string; ar: string }[] = [
  { key: 'all', en: 'All Tracks', ar: 'جميع المسارات' },
  { key: 'core', en: 'Core Platform', ar: 'المنصة الأساسية' },
  { key: 'hr', en: 'HR & Payroll', ar: 'الموارد البشرية' },
  { key: 'finance', en: 'Finance', ar: 'المالية' },
  { key: 'ai', en: 'RARE AI', ar: 'RARE AI' },
  { key: 'security', en: 'Security', ar: 'الأمان' },
  { key: 'crm', en: 'CRM & Sales', ar: 'المبيعات' },
  { key: 'logistics', en: 'Logistics', ar: 'اللوجستيات' },
];

interface TestItem {
  id: string;
  title_en: string;
  title_ar: string;
  questions: number;
  time_min: number;
  passing: number;
  prereq_en: string;
  prereq_ar: string;
}

const TESTS: TestItem[] = [
  { id: 't1', title_en: 'Platform Fundamentals', title_ar: 'أساسيات المنصة', questions: 30, time_min: 30, passing: 80, prereq_en: 'Getting Started + Multi-Tenant courses', prereq_ar: 'دورتا البدء والبنية المتعددة' },
  { id: 't2', title_en: 'HR Management Certification', title_ar: 'شهادة إدارة الموارد البشرية', questions: 50, time_min: 60, passing: 75, prereq_en: 'Both HR courses', prereq_ar: 'دورتا الموارد البشرية' },
  { id: 't3', title_en: 'Financial Operations Exam', title_ar: 'اختبار العمليات المالية', questions: 40, time_min: 45, passing: 80, prereq_en: 'Both Finance courses', prereq_ar: 'دورتا المالية' },
  { id: 't4', title_en: 'RARE AI Specialist', title_ar: 'متخصص RARE AI', questions: 35, time_min: 40, passing: 85, prereq_en: 'Both AI courses', prereq_ar: 'دورتا الذكاء الاصطناعي' },
  { id: 't5', title_en: 'ZIEN Admin Certification', title_ar: 'شهادة مدير ZIEN', questions: 80, time_min: 90, passing: 85, prereq_en: 'All core courses + 2 specialty tracks', prereq_ar: 'جميع الدورات الأساسية + مسارين تخصصيين' },
];

interface CertItem {
  id: string;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  level: 'bronze' | 'silver' | 'gold';
  badge_color: string;
}

const CERTIFICATES: CertItem[] = [
  { id: 'cert1', level: 'bronze', badge_color: 'from-amber-600 to-amber-800', title_en: 'ZIEN Certified User', title_ar: 'مستخدم ZIEN معتمد', desc_en: 'Pass the Platform Fundamentals exam', desc_ar: 'اجتياز اختبار أساسيات المنصة' },
  { id: 'cert2', level: 'silver', badge_color: 'from-gray-400 to-gray-600', title_en: 'ZIEN HR Specialist', title_ar: 'متخصص موارد بشرية ZIEN', desc_en: 'Pass HR Management Certification', desc_ar: 'اجتياز شهادة إدارة الموارد البشرية' },
  { id: 'cert3', level: 'silver', badge_color: 'from-gray-400 to-gray-600', title_en: 'ZIEN Finance Specialist', title_ar: 'متخصص مالي ZIEN', desc_en: 'Pass Financial Operations Exam', desc_ar: 'اجتياز اختبار العمليات المالية' },
  { id: 'cert4', level: 'silver', badge_color: 'from-gray-400 to-gray-600', title_en: 'RARE AI Specialist', title_ar: 'متخصص RARE AI', desc_en: 'Pass RARE AI Specialist exam', desc_ar: 'اجتياز اختبار متخصص RARE AI' },
  { id: 'cert5', level: 'gold', badge_color: 'from-yellow-400 to-yellow-600', title_en: 'ZIEN Certified Administrator', title_ar: 'مدير ZIEN معتمد', desc_en: 'Pass the comprehensive Admin Certification', desc_ar: 'اجتياز شهادة المدير الشاملة' },
];

const LEVEL_LABELS = {
  beginner: { en: 'Beginner', ar: 'مبتدئ' },
  intermediate: { en: 'Intermediate', ar: 'متوسط' },
  advanced: { en: 'Advanced', ar: 'متقدم' },
};

/* ─── Academy Video Embed ────────────────────────────────────────────── */
function AcademyVideo({ isAr }: { isAr: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
      className="w-full mb-12" data-tour="academy-video">
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-violet-600/20 via-blue-500/10 to-cyan-500/20 p-1.5 shadow-2xl shadow-blue-600/15">
        <div className="relative rounded-[1.6rem] overflow-hidden bg-black">
          <div className="absolute top-4 left-4 z-10">
            <span className="px-4 py-1.5 bg-blue-600/90 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-lg">
              <Video size={12} /> {isAr ? 'مقدمة الأكاديمية' : 'Academy Intro'}
            </span>
          </div>
          <iframe
            src={ASSETS.VIDEO_DRIVE}
            className="w-full aspect-video"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{ border: 'none' }}
            title={isAr ? 'مقدمة أكاديمية ZIEN' : 'ZIEN Academy Intro'}
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-blue-600" /> {isAr ? 'تعرف على الأكاديمية' : 'Discover the Academy'}</span>
        <span className="w-1 h-1 bg-zinc-400 rounded-full" />
        <span>{isAr ? 'دورات وشهادات معتمدة' : 'Certified courses & credentials'}</span>
      </div>
    </motion.div>
  );
}

export default function AcademyPage() {
  const { language } = useTheme();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<TabKey>('courses');
  const [activeTrack, setActiveTrack] = useState<TrackKey>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('academy_courses')
          .select('*')
          .order('created_at', { ascending: true });

        if (error || !data || data.length === 0) {
          // Use fallback if table doesn't exist or is empty
          setCourses(FALLBACK_COURSES);
        } else {
          const mapped: Course[] = data.map((row: any) => ({
            id: row.id,
            title_en: row.title_en || row.title || '',
            title_ar: row.title_ar || row.title || '',
            desc_en: row.desc_en || row.description || '',
            desc_ar: row.desc_ar || row.description || '',
            track: (row.track || 'core') as TrackKey,
            level: (row.level || 'beginner') as Course['level'],
            duration_min: row.duration_min || 30,
            lessons: row.lessons || 0,
            students: row.students || 0,
            rating: row.rating || 0,
            icon: TRACK_ICONS[row.track] || BookOpen,
          }));
          setCourses(mapped);
        }
      } catch {
        setCourses(FALLBACK_COURSES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredCourses = activeTrack === 'all' ? courses : courses.filter(c => c.track === activeTrack);

  const totalLessons = courses.reduce((sum, c) => sum + c.lessons, 0);
  const totalStudents = courses.reduce((sum, c) => sum + c.students, 0);

  const tabs: { key: TabKey; en: string; ar: string; icon: React.ElementType }[] = [
    { key: 'courses', en: 'Courses', ar: 'الدورات', icon: BookOpen },
    { key: 'tests', en: 'Tests & Exams', ar: 'الاختبارات', icon: ClipboardCheck },
    { key: 'certificates', en: 'Certificates', ar: 'الشهادات', icon: Award },
    { key: 'case-studies', en: 'Case Studies', ar: 'دراسات حالة', icon: FileText },
  ];

  return (
    <div className="pt-32 pb-20 px-6 bg-[var(--bg-primary)] min-h-screen">
      <GuidedTour tourKey="academy_public" steps={TOUR_STEPS.academy} />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-600 rounded-full text-sm font-bold mb-6">
            <GraduationCap className="w-4 h-4" />
            {isAr ? `${courses.length} دورة • 5 اختبارات • 5 شهادات` : `${courses.length} Courses • 5 Exams • 5 Certificates`}
          </div>
          <h1 className="text-5xl font-bold mb-4">
            {isAr ? 'أكاديمية ZIEN' : 'ZIEN Academy'}
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
            {isAr
              ? 'تعلم كيفية الاستفادة من القوة الكاملة لـ ZIEN من خلال دوراتنا التدريبية المعتمدة واحصل على شهاداتك.'
              : 'Master the full power of ZIEN through certified training courses and earn your professional credentials.'}
          </p>
        </div>

        {/* Video Hero */}
        <AcademyVideo isAr={isAr} />

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { value: String(courses.length), label_en: 'Courses', label_ar: 'دورة', icon: BookOpen },
            { value: totalLessons > 0 ? `${totalLessons}+` : '0', label_en: 'Lessons', label_ar: 'درس', icon: Video },
            { value: '5', label_en: 'Certifications', label_ar: 'شهادة', icon: Award },
            { value: totalStudents > 0 ? totalStudents.toLocaleString() : '0', label_en: 'Students', label_ar: 'طالب', icon: Users },
          ].map((s, i) => (
            <div key={i} className="glass-card p-5 text-center">
              <s.icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">{isAr ? s.label_ar : s.label_en}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'glass-card hover:bg-blue-600/10'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {isAr ? tab.ar : tab.en}
            </button>
          ))}
        </div>

        {/* ===== TAB: COURSES ===== */}
        {activeTab === 'courses' && (
          <>
            {/* Track Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              {TRACKS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTrack(t.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTrack === t.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-[var(--bg-secondary)] hover:bg-blue-600/10'
                    }`}
                >
                  {isAr ? t.ar : t.en}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16 text-[var(--text-secondary)]">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-bold">{isAr ? 'لا توجد دورات في هذا المسار حاليا' : 'No courses in this track yet'}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {filteredCourses.map(course => {
                  const trackLabel = TRACKS.find(t => t.key === course.track);
                  const levelLabel = LEVEL_LABELS[course.level];
                  return (
                    <motion.div
                      key={course.id}
                      whileHover={{ y: -4 }}
                      className="glass-card p-6 flex flex-col cursor-pointer group"
                      onClick={() => setSelectedCourse(course)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2 py-1 bg-blue-600/10 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded">
                          {trackLabel ? (isAr ? trackLabel.ar : trackLabel.en) : course.track}
                        </span>
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${course.level === 'beginner' ? 'bg-emerald-100 text-emerald-700' :
                          course.level === 'intermediate' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {isAr ? levelLabel.ar : levelLabel.en}
                        </span>
                      </div>
                      <div className="w-10 h-10 bg-blue-600/10 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <course.icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold mb-2 group-hover:text-blue-600 transition-colors">
                        {isAr ? course.title_ar : course.title_en}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] mb-4 flex-1">
                        {isAr ? course.desc_ar : course.desc_en}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] pt-4 border-t border-[var(--border-soft)]">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration_min} {isAr ? 'د' : 'min'}</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.lessons} {isAr ? 'درس' : 'lessons'}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /> {course.rating}</span>
                        <span className="flex items-center gap-1 ml-auto"><Users className="w-3 h-3" /> {course.students.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== TAB: TESTS ===== */}
        {activeTab === 'tests' && (
          <div className="max-w-4xl mx-auto space-y-6 mb-16">
            <div className="glass-card p-6 bg-gradient-to-r from-blue-600/5 to-cyan-600/5 border-blue-500/20 mb-8">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                {isAr ? 'كيف تعمل الاختبارات' : 'How Tests Work'}
              </h3>
              <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                <li>{isAr ? '1. أكمل الدورات المطلوبة في كل مسار' : '1. Complete the required courses in each track'}</li>
                <li>{isAr ? '2. ابدأ الاختبار عندما تكون جاهزاً (محدد بالوقت)' : '2. Start the exam when ready (timed)'}</li>
                <li>{isAr ? '3. أسئلة اختيار من متعدد + سيناريوهات عملية' : '3. Multiple-choice + practical scenario questions'}</li>
                <li>{isAr ? '4. احصل على نتيجتك فوراً + شهادتك الرقمية' : '4. Get your score instantly + your digital certificate'}</li>
              </ul>
            </div>

            {TESTS.map(test => (
              <motion.div key={test.id} whileHover={{ x: 4 }} className="glass-card p-6 flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{isAr ? test.title_ar : test.title_en}</h3>
                  <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)] mt-1">
                    <span>{test.questions} {isAr ? 'سؤال' : 'questions'}</span>
                    <span>{test.time_min} {isAr ? 'دقيقة' : 'minutes'}</span>
                    <span>{isAr ? `نسبة النجاح: ${test.passing}%` : `Passing: ${test.passing}%`}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    <span className="font-semibold">{isAr ? 'المتطلبات: ' : 'Prerequisites: '}</span>
                    {isAr ? test.prereq_ar : test.prereq_en}
                  </p>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all whitespace-nowrap">
                  {isAr ? 'ابدأ الاختبار' : 'Start Exam'}
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* ===== TAB: CERTIFICATES ===== */}
        {activeTab === 'certificates' && (
          <div className="max-w-5xl mx-auto mb-16">
            <div className="text-center mb-10">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">{isAr ? 'شهادات ZIEN المعتمدة' : 'ZIEN Professional Certificates'}</h2>
              <p className="text-[var(--text-secondary)]">
                {isAr ? 'أثبت خبرتك واحصل على شهادات رقمية قابلة للمشاركة.' : 'Prove your expertise and earn shareable digital certificates.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CERTIFICATES.map(cert => (
                <motion.div key={cert.id} whileHover={{ y: -4 }} className="glass-card p-6 text-center">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${cert.badge_color} flex items-center justify-center shadow-lg`}>
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{isAr ? cert.title_ar : cert.title_en}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">{isAr ? cert.desc_ar : cert.desc_en}</p>
                  <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${cert.level === 'bronze' ? 'bg-amber-100 text-amber-800' :
                    cert.level === 'silver' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {cert.level === 'bronze' ? (isAr ? 'برونزي' : 'Bronze') :
                      cert.level === 'silver' ? (isAr ? 'فضي' : 'Silver') :
                        (isAr ? 'ذهبي' : 'Gold')}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Certification Path */}
            <div className="mt-12 glass-card p-8 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-[32px]">
              <div className="flex items-center gap-4 mb-6">
                <GraduationCap className="w-8 h-8 text-yellow-400" />
                <h3 className="text-2xl font-bold">{isAr ? 'مسار الشهادة الذهبية' : 'Gold Certification Path'}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {[
                  isAr ? 'أساسيات المنصة' : 'Platform Fundamentals',
                  isAr ? 'تخصص واحد' : '1 Specialty',
                  isAr ? 'تخصص ثاني' : '2nd Specialty',
                  isAr ? 'اختبار المدير' : 'Admin Exam',
                  isAr ? 'شهادة ذهبية' : 'Gold Certificate',
                ].map((step, i, arr) => (
                  <React.Fragment key={i}>
                    <span className={`px-3 py-1.5 rounded-lg font-medium ${i === arr.length - 1 ? 'bg-yellow-500 text-black' : 'bg-white/10'}`}>
                      {step}
                    </span>
                    {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-white/40" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: CASE STUDIES ===== */}
        {activeTab === 'case-studies' && (
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {[
              {
                title_en: "How 'Gulf Trading' Saved 40% in Accounting Time",
                title_ar: "كيف وفرت شركة 'الخليج للتجارة' 40% من وقت المحاسبة",
                desc_en: "An in-depth study on integrating RARE Accounting into a major trading firm in Dubai, reducing manual reconciliation by 40%.",
                desc_ar: "دراسة متعمقة حول دمج RARE Accounting في شركة تجارية كبرى في دبي، مما قلل التسوية اليدوية بنسبة 40%.",
                tags: ["Accounting", "RARE AI", "Efficiency"],
                metric: '40%', metric_label_en: 'Time Saved', metric_label_ar: 'توفير الوقت'
              },
              {
                title_en: "HR Automation for 500 Employees at 'Al Noor Factories'",
                title_ar: "أتمتة الموارد البشرية لـ 500 موظف في 'مصانع النور'",
                desc_en: "How ZIEN helped manage a massive workforce and reduce payroll errors from 12% to under 0.5%.",
                desc_ar: "كيف ساعدت ZIEN في إدارة القوى العاملة الضخمة وتقليل أخطاء الرواتب من 12% إلى أقل من 0.5%.",
                tags: ["HR", "Automation", "Manufacturing"],
                metric: '0.5%', metric_label_en: 'Error Rate', metric_label_ar: 'نسبة الأخطاء'
              },
              {
                title_en: "Scaling Logistics for 'Desert Express' in 3 Months",
                title_ar: "توسيع اللوجستيات لـ 'ديزرت إكسبرس' في 3 أشهر",
                desc_en: "How a growing logistics company used ZIEN to manage 200+ daily shipments with real-time inventory tracking.",
                desc_ar: "كيف استخدمت شركة لوجستيات متنامية ZIEN لإدارة أكثر من 200 شحنة يومياً مع تتبع المخزون الحي.",
                tags: ["Logistics", "Inventory", "Growth"],
                metric: '200+', metric_label_en: 'Daily Shipments', metric_label_ar: 'شحنة يومياً'
              },
              {
                title_en: "RARE AI Cuts Customer Response Time by 70%",
                title_ar: "RARE AI يقلل وقت الرد على العملاء بنسبة 70%",
                desc_en: "A retail chain in Sharjah deployed RARE CRM agents to automate customer inquiries and order tracking.",
                desc_ar: "نشرت سلسلة بيع بالتجزئة في الشارقة وكلاء RARE CRM لأتمتة استفسارات العملاء وتتبع الطلبات.",
                tags: ["CRM", "RARE AI", "Retail"],
                metric: '70%', metric_label_en: 'Faster Response', metric_label_ar: 'استجابة أسرع'
              },
            ].map((study, i) => (
              <motion.div key={i} whileHover={{ y: -4 }} className="glass-card p-8 border-blue-500/10 hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    {study.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider">{tag}</span>
                    ))}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-blue-600">{study.metric}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{isAr ? study.metric_label_ar : study.metric_label_en}</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{isAr ? study.title_ar : study.title_en}</h3>
                <p className="text-[var(--text-secondary)] mb-6 leading-relaxed text-sm">{isAr ? study.desc_ar : study.desc_en}</p>
                <button className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all text-sm">
                  {isAr ? 'اقرأ الدراسة كاملة' : 'Read Full Study'} <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Course Detail Modal */}
        <AnimatePresence>
          {selectedCourse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedCourse(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[var(--bg-primary)] rounded-3xl p-8 max-w-lg w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                    <selectedCourse.icon className="w-6 h-6" />
                  </div>
                  <button onClick={() => setSelectedCourse(null)} className="p-2 hover:bg-black/5 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-2xl font-bold mb-2">{isAr ? selectedCourse.title_ar : selectedCourse.title_en}</h2>
                <p className="text-[var(--text-secondary)] mb-6">{isAr ? selectedCourse.desc_ar : selectedCourse.desc_en}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[var(--bg-secondary)] p-3 rounded-xl text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <div className="font-bold">{selectedCourse.duration_min} {isAr ? 'دقيقة' : 'min'}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{isAr ? 'المدة' : 'Duration'}</div>
                  </div>
                  <div className="bg-[var(--bg-secondary)] p-3 rounded-xl text-center">
                    <BookOpen className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <div className="font-bold">{selectedCourse.lessons}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{isAr ? 'درس' : 'Lessons'}</div>
                  </div>
                  <div className="bg-[var(--bg-secondary)] p-3 rounded-xl text-center">
                    <Star className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                    <div className="font-bold">{selectedCourse.rating}/5</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{isAr ? 'التقييم' : 'Rating'}</div>
                  </div>
                  <div className="bg-[var(--bg-secondary)] p-3 rounded-xl text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <div className="font-bold">{selectedCourse.students.toLocaleString()}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{isAr ? 'طالب' : 'Students'}</div>
                  </div>
                </div>

                {/* Mock lesson list */}
                <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
                  {Array.from({ length: Math.min(selectedCourse.lessons, 6) }, (_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-secondary)]">
                      <div className="w-6 h-6 bg-blue-600/10 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</div>
                      <span className="text-sm flex-1">{isAr ? `الدرس ${i + 1}` : `Lesson ${i + 1}`}</span>
                      <Play className="w-4 h-4 text-[var(--text-secondary)]" />
                    </div>
                  ))}
                  {selectedCourse.lessons > 6 && (
                    <div className="text-xs text-center text-[var(--text-secondary)] pt-1">
                      +{selectedCourse.lessons - 6} {isAr ? 'دروس أخرى' : 'more lessons'}
                    </div>
                  )}
                </div>

                <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  {isAr ? 'ابدأ الدورة' : 'Start Course'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
