import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, PlayCircle, BookOpen, Award, Search, CheckCircle2, ArrowLeft, Play, FileText, Check } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';

type Lesson = {
  id: string;
  title: { en: string; ar: string };
  duration: string;
  type: 'text' | 'quiz';
  content?: { en: string; ar: string };
};

type Course = {
  id: string;
  title: { en: string; ar: string };
  desc: { en: string; ar: string };
  duration: string;
  category: { en: string; ar: string };
  lessons: Lesson[];
};

const coursesData: Course[] = [
  { 
    id: 'c1',
    title: { en: 'ZIEN Platform Mastery', ar: 'احتراف منصة ZIEN' }, 
    desc: { en: 'Learn how to navigate, manage tenants, and use the core features of ZIEN as a Founder or GM.', ar: 'تعلم كيفية التنقل، إدارة الشركات، واستخدام الميزات الأساسية لمنصة ZIEN كمؤسس أو مدير عام.' },
    duration: '45 mins', 
    category: { en: 'Core', ar: 'أساسي' },
    lessons: [
      { id: 'l1', title: { en: 'Introduction to Multi-Tenant Architecture', ar: 'مقدمة في البنية متعددة الشركات' }, duration: '5:00', type: 'text', content: { en: 'ZIEN uses a strict Row Level Security (RLS) model to ensure each tenant\'s data is completely isolated. Every database query automatically filters by the current user\'s company_id.', ar: 'تستخدم ZIEN نموذج أمان على مستوى الصف (RLS) صارم لضمان عزل بيانات كل شركة تماماً. كل استعلام في قاعدة البيانات يقوم تلقائياً بالتصفية حسب company_id للمستخدم الحالي.' } },
      { id: 'l2', title: { en: 'Managing Roles & Permissions (RLS)', ar: 'إدارة الأدوار والصلاحيات (RLS)' }, duration: '10:00', type: 'text', content: { en: 'Roles in ZIEN are hierarchical. The General Manager (GM) has full access, while Department Managers can only see data within their department. RLS policies enforce these rules at the database level.', ar: 'الأدوار في ZIEN هرمية. يمتلك المدير العام (GM) وصولاً كاملاً، بينما يمكن لمديري الأقسام رؤية البيانات داخل قسمهم فقط. تفرض سياسات RLS هذه القواعد على مستوى قاعدة البيانات.' } },
      { id: 'l3', title: { en: 'The Founder Control Center', ar: 'مركز تحكم المؤسس' }, duration: '8:00', type: 'text', content: { en: 'The Founder page is a centralized dashboard for managing all tenants, viewing platform analytics, and configuring global integrations like Stripe and Vonage.', ar: 'صفحة المؤسس هي لوحة تحكم مركزية لإدارة جميع الشركات، عرض تحليلات المنصة، وتكوين التكاملات العالمية مثل Stripe و Vonage.' } },
      { id: 'l4', title: { en: 'Platform Basics Quiz', ar: 'اختبار أساسيات المنصة' }, duration: '10 mins', type: 'quiz' },
    ]
  },
  { 
    id: 'c2',
    title: { en: 'Advanced HR & Employee Portal', ar: 'الموارد البشرية المتقدمة وبوابة الموظف' }, 
    desc: { en: 'Master employee tracking, payroll, attendance, and the self-service portal.', ar: 'احتراف تتبع الموظفين، الرواتب، الحضور، وبوابة الخدمة الذاتية.' },
    duration: '2 hours', 
    category: { en: 'HR', ar: 'الموارد البشرية' },
    lessons: [
      { id: 'l5', title: { en: 'Employee Onboarding & Document Management', ar: 'تأهيل الموظفين وإدارة المستندات' }, duration: '15:00', type: 'text', content: { en: 'When adding a new employee, you must upload their ID and contract. ZIEN automatically sends them an email to set up their portal password.', ar: 'عند إضافة موظف جديد، يجب عليك رفع هويته وعقده. تقوم ZIEN تلقائياً بإرسال بريد إلكتروني لهم لإعداد كلمة مرور البوابة الخاصة بهم.' } },
      { id: 'l6', title: { en: 'Payroll Processing & Attendance Tracking', ar: 'معالجة الرواتب وتتبع الحضور' }, duration: '20:00', type: 'text', content: { en: 'Attendance is tracked daily. At the end of the month, the payroll module calculates salaries based on attendance, deductions, and bonuses automatically.', ar: 'يتم تتبع الحضور يومياً. في نهاية الشهر، يقوم نظام الرواتب بحساب الرواتب بناءً على الحضور، الخصومات، والمكافآت تلقائياً.' } },
      { id: 'l7', title: { en: 'Leave Requests & Approvals Workflow', ar: 'طلبات الإجازة ومسار الموافقات' }, duration: '12:00', type: 'text', content: { en: 'Employees submit leave requests via their portal. Managers receive a notification and can approve or reject the request, which automatically updates the payroll.', ar: 'يقدم الموظفون طلبات الإجازة عبر بوابتهم. يتلقى المديرون إشعاراً ويمكنهم الموافقة أو الرفض، مما يؤدي إلى تحديث الرواتب تلقائياً.' } },
    ]
  },
  { 
    id: 'c3',
    title: { en: 'Accounting, Invoicing & Stripe Integration', ar: 'المحاسبة، الفواتير وتكامل Stripe' }, 
    desc: { en: 'Learn how to manage invoices, taxes, financial reports, and process payments via Stripe.', ar: 'تعلم كيفية إدارة الفواتير، الضرائب، التقارير المالية، ومعالجة المدفوعات عبر Stripe.' },
    duration: '1.5 hours', 
    category: { en: 'Finance', ar: 'المالية' },
    lessons: [
      { id: 'l8', title: { en: 'Creating & Managing Invoices', ar: 'إنشاء وإدارة الفواتير' }, duration: '12:00', type: 'text', content: { en: 'Invoices can be generated from quotes or created manually. They support multiple currencies and automatically apply the correct tax rate based on the client\'s location.', ar: 'يمكن إنشاء الفواتير من عروض الأسعار أو إنشاؤها يدوياً. تدعم عملات متعددة وتطبق تلقائياً معدل الضريبة الصحيح بناءً على موقع العميل.' } },
      { id: 'l9', title: { en: 'Tax Settings by Country', ar: 'إعدادات الضرائب حسب الدولة' }, duration: '10:00', type: 'text', content: { en: 'ZIEN allows you to configure tax rates (e.g., VAT) per country. You can also set manual overrides for specific products or services.', ar: 'تتيح لك ZIEN تكوين معدلات الضرائب (مثل ضريبة القيمة المضافة) لكل دولة. يمكنك أيضاً تعيين تجاوزات يدوية لمنتجات أو خدمات معينة.' } },
      { id: 'l10', title: { en: 'Stripe Payment Gateway Setup', ar: 'إعداد بوابة الدفع Stripe' }, duration: '15:00', type: 'text', content: { en: 'To accept online payments, link your Stripe account in the Integrations settings. Invoices will then include a "Pay Now" button for clients.', ar: 'لقبول المدفوعات عبر الإنترنت، اربط حساب Stripe الخاص بك في إعدادات التكامل. ستتضمن الفواتير بعد ذلك زر "ادفع الآن" للعملاء.' } },
    ]
  },
  { 
    id: 'c4',
    title: { en: 'Mastering RARE AI Agents', ar: 'احتراف وكلاء الذكاء الاصطناعي RARE' }, 
    desc: { en: 'Leverage role-aware AI to automate tasks, generate reports, and get business insights.', ar: 'استفد من الذكاء الاصطناعي المدرك للأدوار لأتمتة المهام، إنشاء التقارير، والحصول على رؤى الأعمال.' },
    duration: '1 hour', 
    category: { en: 'AI', ar: 'الذكاء الاصطناعي' },
    lessons: [
      { id: 'l11', title: { en: 'Interacting with Floating RARE', ar: 'التفاعل مع RARE العائم' }, duration: '10:00', type: 'text', content: { en: 'Click the floating RARE icon to open the chat. RARE knows your role and only provides information you are authorized to see.', ar: 'انقر على أيقونة RARE العائمة لفتح الدردشة. يعرف RARE دورك ويقدم فقط المعلومات المصرح لك برؤيتها.' } },
      { id: 'l12', title: { en: 'Using Voice Commands', ar: 'استخدام الأوامر الصوتية' }, duration: '8:00', type: 'text', content: { en: 'Click the microphone icon to speak to RARE. You can say "Open Dashboard" or "Navigate to Settings" to move around the app hands-free.', ar: 'انقر على أيقونة الميكروفون للتحدث إلى RARE. يمكنك قول "افتح لوحة القيادة" أو "انتقل إلى الإعدادات" للتنقل في التطبيق بدون استخدام اليدين.' } },
      { id: 'l13', title: { en: 'Generating AI Reports & Summaries', ar: 'إنشاء تقارير وملخصات الذكاء الاصطناعي' }, duration: '12:00', type: 'text', content: { en: 'Ask RARE to "Summarize Q3 Sales" or "Generate an HR report for this month". RARE will analyze the database and provide a formatted summary.', ar: 'اطلب من RARE "تلخيص مبيعات الربع الثالث" أو "إنشاء تقرير موارد بشرية لهذا الشهر". سيقوم RARE بتحليل قاعدة البيانات وتقديم ملخص منسق.' } },
    ]
  },
  { 
    id: 'c5',
    title: { en: 'Sales, CRM & Client Portal', ar: 'المبيعات، إدارة علاقات العملاء وبوابة العميل' }, 
    desc: { en: 'Manage leads, quotes, contracts, and provide a seamless client portal experience.', ar: 'إدارة العملاء المحتملين، عروض الأسعار، العقود، وتوفير تجربة سلسة عبر بوابة العميل.' },
    duration: '1.5 hours', 
    category: { en: 'Sales', ar: 'المبيعات' },
    lessons: [
      { id: 'l14', title: { en: 'CRM Basics & Lead Tracking', ar: 'أساسيات CRM وتتبع العملاء' }, duration: '15:00', type: 'text', content: { en: 'Add leads manually or capture them from your landing page. Track their status from "New" to "Closed Won" using the Kanban board.', ar: 'أضف العملاء المحتملين يدوياً أو التقطهم من صفحتك المقصودة. تتبع حالتهم من "جديد" إلى "مغلق بنجاح" باستخدام لوحة كانبان.' } },
      { id: 'l15', title: { en: 'Quotes to Contracts Workflow', ar: 'مسار العمل من عروض الأسعار إلى العقود' }, duration: '12:00', type: 'text', content: { en: 'Convert a winning quote into a contract with one click. Contracts can be sent to clients for digital signature via the Client Portal.', ar: 'حول عرض السعر الفائز إلى عقد بنقرة واحدة. يمكن إرسال العقود للعملاء للتوقيع الرقمي عبر بوابة العميل.' } },
      { id: 'l16', title: { en: 'Configuring the Client Portal', ar: 'إعداد بوابة العميل' }, duration: '10:00', type: 'text', content: { en: 'The Client Portal allows your customers to view their invoices, sign contracts, and submit support tickets. Customize it with your company logo and colors.', ar: 'تتيح بوابة العميل لعملائك عرض فواتيرهم، توقيع العقود، وتقديم تذاكر الدعم. قم بتخصيصها بشعار شركتك وألوانها.' } },
    ]
  },
];

export default function Academy() {
  const { t, language } = useTheme();
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = coursesData.filter(c => 
    c.title.en.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.title.ar.includes(searchQuery)
  );

  const handleLessonComplete = (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons([...completedLessons, lessonId]);
    }
  };

  const calculateProgress = (course: Course) => {
    const completedInCourse = course.lessons.filter(l => completedLessons.includes(l.id)).length;
    return Math.round((completedInCourse / course.lessons.length) * 100);
  };

  return (
    <div className="space-y-8 pb-20">
      <AnimatePresence mode="wait">
        {!activeCourse ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">{t('academy_title') || (language === 'ar' ? 'أكاديمية ZIEN' : 'ZIEN Academy')}</h1>
                <p className="text-sm text-zinc-500 font-medium">{t('academy_desc') || (language === 'ar' ? 'احترف المنصة مع وحداتنا التعليمية الاحترافية.' : 'Master the platform with our professional educational modules.')}</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-zinc-400`} size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_courses') || (language === 'ar' ? 'ابحث عن دورة...' : 'Search courses...')} 
                  className={`w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none`} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCourses.map((course) => {
                const progress = calculateProgress(course);
                return (
                  <motion.div
                    key={course.id}
                    whileHover={{ y: -5 }}
                    onClick={() => setActiveCourse(course)}
                    className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-800 group cursor-pointer shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                  >
                    <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden">
                      <PlayCircle size={48} className="text-zinc-300 group-hover:text-blue-500 transition-colors relative z-10" />
                      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded mb-3 inline-block">
                      {language === 'ar' ? course.category.ar : course.category.en}
                    </span>
                    <h3 className="font-black uppercase tracking-tight mb-2 leading-tight">{language === 'ar' ? course.title.ar : course.title.en}</h3>
                    <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">
                      <div className="flex items-center gap-1"><BookOpen size={12} /> {course.lessons.length} {t('lessons') || (language === 'ar' ? 'دروس' : 'Lessons')}</div>
                      <div className="flex items-center gap-1"><GraduationCap size={12} /> {course.duration}</div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mb-1">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-bold text-right">{progress}%</div>
                  </motion.div>
                );
              })}
            </div>

            <div className="bg-zinc-900 text-white p-10 rounded-[40px] flex items-center justify-between overflow-hidden relative">
              <div className="relative z-10 max-w-lg">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">{t('earn_certification') || (language === 'ar' ? 'احصل على شهادة ZIEN' : 'Earn Your ZIEN Certification')}</h2>
                <p className="text-zinc-400 text-sm mb-8 font-medium leading-relaxed">
                  {t('certification_desc') || (language === 'ar' ? 'أكمل وحدات التدريب الأساسية واجتز التقييم لتصبح مسؤول منصة ZIEN معتمد.' : 'Complete the core training modules and pass the assessment to become a certified ZIEN Platform Administrator.')}
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                  {t('start_certification') || (language === 'ar' ? 'ابدأ التقييم' : 'Start Certification')}
                </button>
              </div>
              <div className="absolute right-0 top-0 p-10 opacity-10">
                <Award size={200} />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="course" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <button 
              onClick={() => { setActiveCourse(null); setActiveLesson(null); }}
              className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={16} className={language === 'ar' ? 'rotate-180' : ''} /> {t('back_to_courses') || (language === 'ar' ? 'العودة للدورات' : 'Back to Courses')}
            </button>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-6">
                {activeLesson ? (
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    {activeLesson.type === 'text' ? (
                      <div className="p-8 min-h-[300px] flex flex-col justify-center">
                        <FileText size={48} className="text-blue-600 mb-6 opacity-20" />
                        <h3 className="text-2xl font-bold mb-4">{language === 'ar' ? activeLesson.title.ar : activeLesson.title.en}</h3>
                        <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
                          {language === 'ar' ? activeLesson.content?.ar : activeLesson.content?.en}
                        </p>
                      </div>
                    ) : (
                      <div className="aspect-video bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center p-8 text-center">
                        <FileText size={48} className="text-blue-600 mb-4" />
                        <h3 className="text-2xl font-bold mb-2">{language === 'ar' ? activeLesson.title.ar : activeLesson.title.en}</h3>
                        <p className="text-zinc-500 mb-6">{t('answer_questions') || (language === 'ar' ? 'أجب على الأسئلة لاختبار معرفتك.' : 'Answer the questions to test your knowledge.')}</p>
                        <button 
                          onClick={() => handleLessonComplete(activeLesson.id)}
                          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
                        >
                          {t('start_quiz') || (language === 'ar' ? 'ابدأ الاختبار' : 'Start Quiz')}
                        </button>
                      </div>
                    )}
                    <div className="p-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{language === 'ar' ? activeLesson.title.ar : activeLesson.title.en}</h2>
                        <p className="text-sm text-zinc-500">{activeLesson.duration}</p>
                      </div>
                      {activeLesson.type === 'text' && (
                        <button 
                          onClick={() => handleLessonComplete(activeLesson.id)}
                          className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${completedLessons.includes(activeLesson.id) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                          {completedLessons.includes(activeLesson.id) ? <><CheckCircle2 size={18} /> {t('completed') || (language === 'ar' ? 'مكتمل' : 'Completed')}</> : (t('mark_complete') || (language === 'ar' ? 'تحديد كمكتمل' : 'Mark as Complete'))}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-xs font-bold uppercase tracking-widest rounded-full mb-4 inline-block">
                      {language === 'ar' ? activeCourse.category.ar : activeCourse.category.en}
                    </span>
                    <h1 className="text-3xl font-black mb-4">{language === 'ar' ? activeCourse.title.ar : activeCourse.title.en}</h1>
                    <p className="text-zinc-500 leading-relaxed mb-8">{language === 'ar' ? activeCourse.desc.ar : activeCourse.desc.en}</p>
                    
                    <div className="flex items-center gap-6 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                      <div className="flex-1">
                        <div className="text-sm font-bold mb-1">{t('course_progress') || (language === 'ar' ? 'تقدم الدورة' : 'Course Progress')}</div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mb-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${calculateProgress(activeCourse)}%` }}></div>
                        </div>
                        <div className="text-xs text-zinc-500 font-bold">{calculateProgress(activeCourse)}% {t('completed') || (language === 'ar' ? 'مكتمل' : 'Completed')}</div>
                      </div>
                      <button 
                        onClick={() => setActiveLesson(activeCourse.lessons[0])}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                      >
                        <Play size={18} /> {t('start_learning') || (language === 'ar' ? 'ابدأ التعلم' : 'Start Learning')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar: Lesson List */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm h-fit">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-bold text-lg">{t('course_content') || (language === 'ar' ? 'محتوى الدورة' : 'Course Content')}</h3>
                  <p className="text-xs text-zinc-500">{activeCourse.lessons.length} {t('lessons') || (language === 'ar' ? 'دروس' : 'lessons')} • {activeCourse.duration}</p>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {activeCourse.lessons.map((lesson, index) => {
                    const isCompleted = completedLessons.includes(lesson.id);
                    const isActive = activeLesson?.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full p-4 flex items-start gap-4 text-left transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isActive ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCompleted ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'}`}>
                          {isCompleted ? <Check size={14} /> : lesson.type === 'text' ? <FileText size={14} /> : <FileText size={14} />}
                        </div>
                        <div>
                          <div className={`font-bold text-sm mb-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            {index + 1}. {language === 'ar' ? lesson.title.ar : lesson.title.en}
                          </div>
                          <div className="text-xs text-zinc-500">{lesson.duration}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
