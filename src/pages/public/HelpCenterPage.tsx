import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../../constants/assets';
import GuidedTour from '../../components/GuidedTour';
import { TOUR_STEPS } from '../../constants/tourSteps';
import {
    Search, ChevronDown, ChevronUp, BookOpen, MessageCircle, Mail, Phone,
    HelpCircle, FileText, Rocket, Users, CreditCard, Package, Brain, ShieldCheck,
    PlayCircle, Video, ArrowRight,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface HelpArticle { title_en: string; title_ar: string; body_en: string; body_ar: string }
interface HelpTopic {
    id: string; icon: React.ElementType; title_en: string; title_ar: string;
    desc_en: string; desc_ar: string; color: string; articles: HelpArticle[];
    contactType?: 'chat' | 'email' | 'phone' | 'docs';
    contactLabel_en?: string; contactLabel_ar?: string;
}

/* ─── Help Topics ────────────────────────────────────────────────────────── */
const HELP_TOPICS: HelpTopic[] = [
    {
        id: 'getting-started', icon: Rocket, color: 'from-blue-600 to-cyan-500',
        title_en: 'Getting Started', title_ar: 'البدء مع المنصة',
        desc_en: 'Set up your company, invite team members, and navigate the dashboard.',
        desc_ar: 'إعداد شركتك ودعوة أعضاء الفريق والتنقل في لوحة التحكم.',
        contactType: 'docs', contactLabel_en: 'View Full Guide', contactLabel_ar: 'عرض الدليل الكامل',
        articles: [
            {
                title_en: 'How to register your company', title_ar: 'كيفية تسجيل شركتك',
                body_en: 'Go to /register and fill in your company details: name, type, country, currency, and number of employees. Select the modules you need (HR, Accounting, CRM, etc.). After registration, you\'ll be redirected to the dashboard.',
                body_ar: 'اذهب إلى /register واملأ بيانات شركتك: الاسم، النوع، الدولة، العملة، وعدد الموظفين. اختر الوحدات التي تحتاجها. بعد التسجيل ستتم إعادة توجيهك إلى لوحة التحكم.'
            },
            {
                title_en: 'Inviting team members', title_ar: 'دعوة أعضاء الفريق',
                body_en: 'Navigate to Dashboard → HR → Invitations. Enter the employee\'s email, select their role (Department Head, Employee, etc.), and send the invite. They\'ll receive an email with a link to activate their account.',
                body_ar: 'انتقل إلى لوحة التحكم ← الموارد البشرية ← الدعوات. أدخل بريد الموظف الإلكتروني وحدد دوره وأرسل الدعوة. سيتلقى رابط تفعيل حسابه.'
            },
            {
                title_en: 'Navigating the dashboard', title_ar: 'التنقل في لوحة التحكم',
                body_en: 'The sidebar gives you access to all modules. The top bar has search and notifications. Use the theme switcher for dark/light mode. The RARE AI assistant is always available via the floating button.',
                body_ar: 'القائمة الجانبية تتيح الوصول لجميع الوحدات. الشريط العلوي به البحث والإشعارات. استخدم مبدل السمة للوضع المظلم/الفاتح. مساعد RARE متاح دائمًا عبر الزر العائم.'
            },
        ],
    },
    {
        id: 'user-management', icon: Users, color: 'from-emerald-600 to-teal-500',
        title_en: 'User Management', title_ar: 'إدارة المستخدمين',
        desc_en: 'Manage roles, permissions, departments, and employee profiles.',
        desc_ar: 'إدارة الأدوار والصلاحيات والأقسام وملفات الموظفين.',
        contactType: 'chat', contactLabel_en: 'Ask Support', contactLabel_ar: 'اسأل الدعم',
        articles: [
            {
                title_en: 'Understanding roles & permissions', title_ar: 'فهم الأدوار والصلاحيات',
                body_en: 'ZIEN uses RBAC. Roles: Company GM (full), Assistant GM, Secretary, Department Head, Accountant, HR Officer, Logistics Coordinator, Sales Manager, Employee (basic), Client User. Each has specific view/create/edit/delete permissions.',
                body_ar: 'تستخدم ZIEN التحكم بالأدوار. الأدوار الرئيسية: المدير العام (كامل)، مساعد المدير، السكرتير، رئيس القسم، المحاسب، مسؤول الموارد البشرية، منسق اللوجستيات، مدير المبيعات، موظف (أساسي)، مستخدم عميل.'
            },
            {
                title_en: 'Changing employee roles', title_ar: 'تغيير أدوار الموظفين',
                body_en: 'Only Company GM and Assistant GM can change roles. Go to HR → Employee Profile → Edit Role. Changes take effect immediately.',
                body_ar: 'فقط المدير العام ومساعده يمكنهم تغيير الأدوار. اذهب إلى الموارد البشرية ← ملف الموظف ← تعديل الدور. التغييرات تسري فورًا.'
            },
        ],
    },
    {
        id: 'billing', icon: CreditCard, color: 'from-violet-600 to-purple-500',
        title_en: 'Billing & Plans', title_ar: 'الفوترة والخطط',
        desc_en: 'Subscription plans, payment methods, invoices, and upgrades.',
        desc_ar: 'خطط الاشتراك وطرق الدفع والفواتير والترقيات.',
        contactType: 'email', contactLabel_en: 'Contact Billing', contactLabel_ar: 'تواصل مع الفوترة',
        articles: [
            {
                title_en: 'Available subscription plans', title_ar: 'خطط الاشتراك المتاحة',
                body_en: 'Three tiers: Starter (up to 10 employees, core modules), Professional (up to 100, all modules, priority support), Enterprise (unlimited, custom SLA, dedicated manager). All include RARE AI, multi-language, and mobile access.',
                body_ar: 'ثلاث مستويات: المبتدئ (حتى 10 موظفين)، المهني (حتى 100 موظف، جميع الوحدات)، المؤسسي (غير محدود، اتفاقية مخصصة). الكل يشمل RARE AI ودعم متعدد اللغات.'
            },
            {
                title_en: 'Updating payment methods', title_ar: 'تحديث طرق الدفع',
                body_en: 'Dashboard → Billing → Payment Methods. Add credit card or bank account via Stripe. Set a default payment method and remove old ones anytime.',
                body_ar: 'لوحة التحكم ← الفوترة ← طرق الدفع. أضف بطاقة ائتمان عبر Stripe. حدد طريقة دفع افتراضية.'
            },
        ],
    },
    {
        id: 'modules', icon: Package, color: 'from-amber-500 to-orange-600',
        title_en: 'Modules Guide', title_ar: 'دليل الوحدات',
        desc_en: 'Deep-dive into HR, Accounting, CRM, Projects, Logistics, and more.',
        desc_ar: 'تعرف بعمق على الموارد البشرية والمحاسبة وإدارة العملاء والمشاريع واللوجستيات.',
        contactType: 'docs', contactLabel_en: 'Open Academy', contactLabel_ar: 'افتح الأكاديمية',
        articles: [
            {
                title_en: 'HR Module overview', title_ar: 'وحدة الموارد البشرية',
                body_en: 'Covers Employee Directory, Attendance (clock-in/out, GPS, overtime), Leave Management (request/approval), Payroll (salary, deductions, bonuses, tax), and HR Analytics (turnover, headcount).',
                body_ar: 'تغطي دليل الموظفين، الحضور (الحضور/انصراف، GPS)، إدارة الإجازات، الرواتب (الراتب، الخصومات، المكافآت)، وتحليلات الموارد البشرية.'
            },
            {
                title_en: 'Accounting Module overview', title_ar: 'وحدة المحاسبة',
                body_en: 'Chart of Accounts, Journal Entries, Invoicing (create, track, recurring), Tax Management (VAT), Financial Reports (P&L, Balance Sheet, Cash Flow).',
                body_ar: 'شجرة الحسابات، القيود اليومية، الفوترة (إنشاء، تتبع، متكررة)، إدارة الضرائب، التقارير المالية (الربح والخسارة، الميزانية).'
            },
            {
                title_en: 'CRM Module overview', title_ar: 'وحدة إدارة العملاء',
                body_en: 'Lead Management, Sales Pipeline (Kanban view), Contact Database, Deals (forecasting, revenue tracking), Client Portal (branded self-service).',
                body_ar: 'إدارة العملاء المحتملين، خط المبيعات (كانبان)، قاعدة بيانات جهات الاتصال، الصفقات، بوابة العميل.'
            },
        ],
    },
    {
        id: 'ai', icon: Brain, color: 'from-pink-600 to-rose-500',
        title_en: 'RARE AI Assistant', title_ar: 'مساعد RARE AI',
        desc_en: 'Learn how to use RARE AI for intelligent assistance across all modules.',
        desc_ar: 'تعلم كيفية استخدام RARE AI للمساعدة الذكية عبر جميع الوحدات.',
        contactType: 'chat', contactLabel_en: 'Chat with RARE', contactLabel_ar: 'تحدث مع RARE',
        articles: [
            {
                title_en: 'What is RARE AI?', title_ar: 'ما هو RARE AI؟',
                body_en: 'RARE (Reasoning & Analysis for Rapid Execution) understands your company context, analyzes data across modules, generates reports, answers in 15+ languages. Access via the floating AI button on any page.',
                body_ar: 'RARE (التفكير والتحليل للتنفيذ السريع) يفهم سياق شركتك، يحلل البيانات، ينشئ التقارير، ويجيب بأكثر من 15 لغة. يمكنك الوصول إليه عبر زر AI العائم.'
            },
            {
                title_en: 'RARE AI modes', title_ar: 'أوضاع RARE AI',
                body_en: 'Modes: Chat (Q&A), Analyze (deep data analysis), Search (web info), Senate (multi-agent deliberation for complex decisions). Switch modes from the AI panel.',
                body_ar: 'الأوضاع: محادثة (أسئلة وأجوبة)، تحليل (بيانات عميقة)، بحث (معلومات الويب)، مجلس الشيوخ (تداول متعدد الوكلاء). بدّل الأوضاع من لوحة AI.'
            },
        ],
    },
    {
        id: 'security', icon: ShieldCheck, color: 'from-indigo-600 to-blue-500',
        title_en: 'Security & Privacy', title_ar: 'الأمان والخصوصية',
        desc_en: 'Data protection, multi-tenant isolation, authentication, and compliance.',
        desc_ar: 'حماية البيانات وعزل المستأجرين والمصادقة والامتثال.',
        contactType: 'email', contactLabel_en: 'Security Team', contactLabel_ar: 'فريق الأمان',
        articles: [
            {
                title_en: 'Multi-tenant data isolation', title_ar: 'عزل بيانات المستأجرين',
                body_en: 'Every company has isolated data via Row-Level Security (RLS). Service role keys never exposed to client. All API calls verify company membership.',
                body_ar: 'كل شركة لديها بيانات معزولة عبر سياسات أمان مستوى الصف (RLS). مفاتيح الخدمة لا تُعرض للعميل. كل استدعاء API يتحقق من عضوية الشركة.'
            },
            {
                title_en: 'Authentication options', title_ar: 'خيارات المصادقة',
                body_en: 'Email/Password, Google OAuth, Apple Sign-In, Phone OTP, Magic Link. MFA available. Sessions auto-refresh and persist across tabs.',
                body_ar: 'بريد/كلمة مرور، Google OAuth، Apple Sign-In، هاتف OTP، رابط سحري. MFA متاح. الجلسات تتجدد تلقائيًا.'
            },
        ],
    },
];

/* ─── Video Embed ────────────────────────────────────────────────────────── */
function VideoSection({ className = '' }: { className?: string }) {
    return (
        <div className={`relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-violet-500/20 p-1.5 ${className}`}>
            <div className="relative rounded-[1.6rem] overflow-hidden bg-black">
                <div className="absolute top-4 left-4 z-10">
                    <span className="px-4 py-1.5 bg-blue-600/90 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-lg">
                        <Video size={12} /> Platform Guide
                    </span>
                </div>
                <video
                    src={ASSETS.VIDEO_GPHOTO}
                    className="w-full aspect-video object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    poster={ASSETS.LOGO_SHIELD}
                />
            </div>
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function HelpCenterPage() {
    const { language } = useTheme();
    const isAr = language === 'ar';
    const [search, setSearch] = useState('');
    const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

    const filteredTopics = HELP_TOPICS.filter(t => {
        if (!search) return true;
        const q = search.toLowerCase();
        return t.title_en.toLowerCase().includes(q) || t.title_ar.includes(q) ||
            t.desc_en.toLowerCase().includes(q) || t.desc_ar.includes(q) ||
            t.articles.some(a => a.title_en.toLowerCase().includes(q) || a.title_ar.includes(q) || a.body_en.toLowerCase().includes(q) || a.body_ar.includes(q));
    });

    const handleContact = (type?: string) => {
        switch (type) {
            case 'chat': window.open('mailto:support@zien-ai.app?subject=Support Request', '_blank'); break;
            case 'email': window.open('mailto:billing@zien-ai.app?subject=Billing Inquiry', '_blank'); break;
            case 'phone': window.open('tel:+97144420000', '_self'); break;
            case 'docs': window.open('/academy', '_self'); break;
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-28 pb-20 px-4">
            <GuidedTour tourKey="help_center_public" steps={TOUR_STEPS.help_center} />

            <div className="max-w-5xl mx-auto">
                {/* ─ Header ─ */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-600 rounded-full text-sm font-bold mb-6">
                        <HelpCircle className="w-4 h-4" />
                        {isAr ? `${HELP_TOPICS.length} أقسام • ${HELP_TOPICS.reduce((s, t) => s + t.articles.length, 0)} مقال` : `${HELP_TOPICS.length} Topics • ${HELP_TOPICS.reduce((s, t) => s + t.articles.length, 0)} Articles`}
                    </div>
                    <h1 className="text-5xl font-bold mb-4">{isAr ? 'مركز المساعدة' : 'Help Center'}</h1>
                    <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                        {isAr ? 'ابحث عن إجابات أسئلتك أو تواصل مع فريق الدعم' : 'Find answers to your questions or reach out to our support team'}
                    </p>
                </div>

                {/* ─ Search ─ */}
                <div className="relative max-w-xl mx-auto mb-10" data-tour="help-search">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input type="text" placeholder={isAr ? 'ابحث في المقالات...' : 'Search articles & guides...'}
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-lg shadow-blue-600/5" />
                </div>

                {/* ─ Video ─ */}
                <div className="mb-12">
                    <VideoSection className="shadow-2xl shadow-blue-600/10 border border-[var(--border-soft)]" />
                </div>

                {/* ─ Help Topic Cards ─ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {filteredTopics.map(topic => (
                        <motion.div key={topic.id} whileHover={{ y: -2 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden group">
                            <div className={`h-1.5 bg-gradient-to-r ${topic.color}`} />
                            <div className="p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${topic.color} flex items-center justify-center shrink-0`}>
                                        <topic.icon size={22} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">{isAr ? topic.title_ar : topic.title_en}</h3>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1">{isAr ? topic.desc_ar : topic.desc_en}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    {topic.articles.map((article, i) => {
                                        const artId = `${topic.id}-${i}`;
                                        return (
                                            <div key={i} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                                                <button onClick={() => setExpandedArticle(expandedArticle === artId ? null : artId)}
                                                    className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors text-left">
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={14} className="text-blue-600 shrink-0" />
                                                        <span className="text-sm font-medium">{isAr ? article.title_ar : article.title_en}</span>
                                                    </div>
                                                    {expandedArticle === artId ? <ChevronUp size={14} className="text-zinc-400 shrink-0" /> : <ChevronDown size={14} className="text-zinc-400 shrink-0" />}
                                                </button>
                                                <AnimatePresence>
                                                    {expandedArticle === artId && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                            <div className="px-3 pb-3 text-sm text-[var(--text-secondary)] leading-relaxed">{isAr ? article.body_ar : article.body_en}</div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                                {topic.contactType && (
                                    <button onClick={() => handleContact(topic.contactType)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white rounded-xl text-sm font-bold transition-all group/btn">
                                        {topic.contactType === 'chat' && <MessageCircle size={14} />}
                                        {topic.contactType === 'email' && <Mail size={14} />}
                                        {topic.contactType === 'phone' && <Phone size={14} />}
                                        {topic.contactType === 'docs' && <BookOpen size={14} />}
                                        {isAr ? topic.contactLabel_ar : topic.contactLabel_en}
                                        <ArrowRight size={14} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ─ Direct Contact ─ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12" data-tour="help-contact">
                    {([
                        { icon: MessageCircle, title_en: 'Live Chat', title_ar: 'محادثة مباشرة', desc_en: 'Chat with our support team', desc_ar: 'تحدث مع فريق الدعم', action_en: 'Start Chat', action_ar: 'ابدأ محادثة', color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10', onClick: () => window.open('mailto:support@zien-ai.app?subject=Live Chat Request', '_blank') },
                        { icon: Mail, title_en: 'Email Support', title_ar: 'بريد الدعم', desc_en: 'support@zien-ai.app', desc_ar: 'support@zien-ai.app', action_en: 'Send Email', action_ar: 'أرسل بريد', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10', onClick: () => window.open('mailto:support@zien-ai.app', '_blank') },
                        { icon: Phone, title_en: 'Call Us', title_ar: 'اتصل بنا', desc_en: '+971 4 442 0000', desc_ar: '+971 4 442 0000', action_en: 'Call Now', action_ar: 'اتصل الآن', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10', onClick: () => window.open('tel:+97144420000', '_self') },
                    ] as const).map(card => (
                        <motion.div key={card.title_en} whileHover={{ y: -2 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${card.color}`}>
                                <card.icon size={20} />
                            </div>
                            <h3 className="font-bold text-sm">{isAr ? card.title_ar : card.title_en}</h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">{isAr ? card.desc_ar : card.desc_en}</p>
                            <button onClick={card.onClick}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto">
                                {isAr ? card.action_ar : card.action_en} <ArrowRight size={12} />
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* ─ RARE CTA ─ */}
                <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-[32px] p-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <img src={ASSETS.RARE_AGENT} alt="RARE" className="w-12 h-12 rounded-full border-2 border-white/20" {...IMAGE_PROPS} />
                        <div>
                            <h3 className="text-xl font-bold">{isAr ? 'لم تجد إجابتك؟' : "Didn't find your answer?"}</h3>
                            <p className="text-sm text-zinc-400">{isAr ? 'اسأل RARE AI مباشرة' : 'Ask RARE AI directly'}</p>
                        </div>
                    </div>
                    <p className="text-zinc-400 text-sm mb-6 max-w-lg mx-auto">
                        {isAr ? 'مساعد RARE AI يمكنه الإجابة على أي سؤال حول المنصة. فقط انقر على زر AI في أسفل الشاشة.' : 'RARE AI can answer any question about the platform. Click the AI button at the bottom of the screen.'}
                    </p>
                    <div className="flex justify-center gap-4">
                        <a href="/academy" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                            <BookOpen size={16} /> {isAr ? 'أكاديمية ZIEN' : 'ZIEN Academy'}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
