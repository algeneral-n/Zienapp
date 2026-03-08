import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  PlayCircle, AlertTriangle, RotateCcw, Download, Share2, ArrowLeft
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

/* ─── Quiz Question Bank ─────────────────────────────────────────────── */
interface QuizQuestion {
  q_en: string; q_ar: string;
  options_en: string[]; options_ar: string[];
  correct: number; // 0-based index
}

const QUIZ_BANK: Record<string, QuizQuestion[]> = {
  t1: [ // Platform Fundamentals
    { q_en: 'What is the main purpose of company provisioning in ZIEN?', q_ar: 'ما الغرض الرئيسي من تزويد الشركة في ZIEN؟', options_en: ['Create social media accounts', 'Set up isolated tenant workspace', 'Install mobile apps', 'Generate PDF reports'], options_ar: ['إنشاء حسابات التواصل', 'إعداد مساحة عمل معزولة', 'تثبيت تطبيقات الهاتف', 'إنشاء تقارير PDF'], correct: 1 },
    { q_en: 'Which role has the highest permission level in ZIEN?', q_ar: 'أي دور لديه أعلى مستوى صلاحيات في ZIEN؟', options_en: ['General Manager', 'Founder', 'Admin', 'Department Manager'], options_ar: ['المدير العام', 'المؤسس', 'المدير', 'مدير القسم'], correct: 1 },
    { q_en: 'What does RLS stand for in ZIEN\'s security model?', q_ar: 'ما معنى RLS في نموذج أمان ZIEN؟', options_en: ['Role Level System', 'Row Level Security', 'Remote Login Service', 'Resource Limit Settings'], options_ar: ['نظام مستوى الدور', 'أمان مستوى الصف', 'خدمة تسجيل الدخول عن بعد', 'إعدادات حدود الموارد'], correct: 1 },
    { q_en: 'How do you invite team members in ZIEN?', q_ar: 'كيف تدعو أعضاء الفريق في ZIEN؟', options_en: ['Share a public link', 'Send email invitation from dashboard', 'They register themselves', 'Call technical support'], options_ar: ['مشاركة رابط عام', 'إرسال دعوة بريد من لوحة التحكم', 'يسجلون أنفسهم', 'الاتصال بالدعم التقني'], correct: 1 },
    { q_en: 'What is multi-tenant architecture?', q_ar: 'ما هي البنية متعددة المستأجرين؟', options_en: ['Multiple servers per user', 'One database per company in isolation', 'Shared login for all companies', 'Multiple admin accounts'], options_ar: ['خوادم متعددة لكل مستخدم', 'قاعدة بيانات واحدة لكل شركة بعزل', 'تسجيل دخول مشترك لجميع الشركات', 'حسابات مدير متعددة'], correct: 1 },
  ],
  t2: [ // HR Management
    { q_en: 'What is the correct order of the employee lifecycle in ZIEN?', q_ar: 'ما الترتيب الصحيح لدورة حياة الموظف في ZIEN؟', options_en: ['Hire → Onboard → Manage → Offboard', 'Register → Login → Work → Logout', 'Interview → Hire → Train → Fire', 'Create → Assign → Track → Delete'], options_ar: ['توظيف → تأهيل → إدارة → مغادرة', 'تسجيل → دخول → عمل → خروج', 'مقابلة → توظيف → تدريب → فصل', 'إنشاء → تعيين → تتبع → حذف'], correct: 0 },
    { q_en: 'Which ZIEN feature handles salary calculations including deductions?', q_ar: 'أي ميزة في ZIEN تتعامل مع حسابات الرواتب بما فيها الخصومات؟', options_en: ['CRM module', 'Payroll engine', 'Accounting journal', 'Invoice generator'], options_ar: ['وحدة CRM', 'محرك الرواتب', 'دفتر المحاسبة', 'مولد الفواتير'], correct: 1 },
    { q_en: 'How does ZIEN verify employee attendance?', q_ar: 'كيف يتحقق ZIEN من حضور الموظفين؟', options_en: ['Manual entry only', 'GPS clock-in/out with photo', 'Email notification', 'Calendar sync'], options_ar: ['إدخال يدوي فقط', 'تسجيل بـ GPS مع صورة', 'إشعار بريد إلكتروني', 'مزامنة التقويم'], correct: 1 },
    { q_en: 'What role level is needed to approve leave requests?', q_ar: 'ما مستوى الدور المطلوب للموافقة على طلبات الإجازة؟', options_en: ['Any employee', 'Supervisor or above (level 55+)', 'Only GM', 'Only Founder'], options_ar: ['أي موظف', 'مشرف أو أعلى (مستوى 55+)', 'المدير العام فقط', 'المؤسس فقط'], correct: 1 },
    { q_en: 'What happens when an employee is offboarded?', q_ar: 'ماذا يحدث عند مغادرة الموظف؟', options_en: ['Account is deleted permanently', 'Access revoked, records archived', 'Nothing changes', 'Only password is changed'], options_ar: ['يُحذف الحساب نهائياً', 'يُسحب الوصول وتُؤرشف السجلات', 'لا شيء يتغير', 'تُغير كلمة المرور فقط'], correct: 1 },
  ],
  t3: [ // Financial Operations
    { q_en: 'What is a Chart of Accounts in ZIEN Accounting?', q_ar: 'ما هي شجرة الحسابات في محاسبة ZIEN؟', options_en: ['A graphical chart of revenue', 'Hierarchical list of all financial accounts', 'A pie chart of expenses', 'Employee salary chart'], options_ar: ['رسم بياني للإيرادات', 'قائمة هرمية لجميع الحسابات المالية', 'مخطط دائري للمصروفات', 'جدول رواتب الموظفين'], correct: 1 },
    { q_en: 'What does bank reconciliation do?', q_ar: 'ماذا تفعل تسوية البنك؟', options_en: ['Creates new bank accounts', 'Matches ZIEN records with bank statements', 'Transfers money between accounts', 'Generates tax returns'], options_ar: ['إنشاء حسابات بنكية جديدة', 'مطابقة سجلات ZIEN مع كشوف البنك', 'تحويل الأموال بين الحسابات', 'إنشاء إقرارات ضريبية'], correct: 1 },
    { q_en: 'Which report shows company profitability?', q_ar: 'أي تقرير يُظهر ربحية الشركة؟', options_en: ['Balance Sheet', 'Profit & Loss (Income Statement)', 'Cash Flow Statement', 'Inventory Report'], options_ar: ['الميزانية العمومية', 'قائمة الربح والخسارة', 'قائمة التدفقات النقدية', 'تقرير المخزون'], correct: 1 },
    { q_en: 'How does ZIEN handle multi-currency transactions?', q_ar: 'كيف يتعامل ZIEN مع المعاملات متعددة العملات؟', options_en: ['Only supports USD', 'Automatic conversion at real-time exchange rates', 'Manual rate entry only', 'Separate databases per currency'], options_ar: ['يدعم الدولار فقط', 'تحويل تلقائي بأسعار صرف فورية', 'إدخال سعر يدوي فقط', 'قواعد بيانات منفصلة لكل عملة'], correct: 1 },
    { q_en: 'What is required for VAT compliance in ZIEN?', q_ar: 'ما المطلوب لامتثال ضريبة القيمة المضافة في ZIEN؟', options_en: ['Nothing, ZIEN ignores taxes', 'Configure tax rules and filing deadlines', 'External software only', 'Manual paper filing'], options_ar: ['لا شيء، ZIEN يتجاهل الضرائب', 'إعداد قواعد الضريبة والمواعيد', 'برنامج خارجي فقط', 'تقديم ورقي يدوي'], correct: 1 },
  ],
  t4: [ // RARE AI Specialist
    { q_en: 'What are the main RARE AI interaction modes?', q_ar: 'ما هي أوضاع التفاعل الرئيسية لـ RARE AI؟', options_en: ['Read, Write, Delete', 'Chat, Analyze, Search, Senate', 'Input, Process, Output', 'Query, Response, Follow-up'], options_ar: ['قراءة، كتابة، حذف', 'محادثة، تحليل، بحث، مجلس الشيوخ', 'إدخال، معالجة، إخراج', 'استعلام، استجابة، متابعة'], correct: 1 },
    { q_en: 'What is "Senate" mode in RARE AI?', q_ar: 'ما هو وضع "مجلس الشيوخ" في RARE AI؟', options_en: ['Government document generator', 'Multi-agent deliberation for group decisions', 'Simple chat conversation', 'Database administration mode'], options_ar: ['مولد وثائق حكومية', 'تداول متعدد الوكلاء للقرارات الجماعية', 'محادثة بسيطة', 'وضع إدارة قاعدة البيانات'], correct: 1 },
    { q_en: 'Which RARE agent handles financial analysis?', q_ar: 'أي وكيل RARE يتعامل مع التحليل المالي؟', options_en: ['HR Agent', 'Accounting Agent', 'Fleet Agent', 'CRM Agent'], options_ar: ['وكيل الموارد البشرية', 'وكيل المحاسبة', 'وكيل الأسطول', 'وكيل المبيعات'], correct: 1 },
    { q_en: 'Can RARE AI generate automated reports?', q_ar: 'هل يمكن لـ RARE AI إنشاء تقارير تلقائية؟', options_en: ['No, only chat is supported', 'Yes, for any module with real-time data', 'Only PDF downloads', 'Only for the founder'], options_ar: ['لا، فقط المحادثة مدعومة', 'نعم، لأي وحدة مع بيانات فورية', 'فقط تنزيلات PDF', 'فقط للمؤسس'], correct: 1 },
    { q_en: 'How does RARE respect role-based access?', q_ar: 'كيف يحترم RARE الوصول القائم على الأدوار؟', options_en: ['It doesn\'t - everyone sees everything', 'Filters responses based on user role and permissions', 'Asks admin for permission each time', 'Uses a separate permission system'], options_ar: ['لا يفعل - الجميع يرى كل شيء', 'يفلتر الردود بناءً على دور المستخدم وصلاحياته', 'يسأل المدير عن الإذن كل مرة', 'يستخدم نظام صلاحيات منفصل'], correct: 1 },
  ],
  t5: [ // Admin Certification  
    { q_en: 'What is the maximum number of roles in ZIEN\'s RBAC?', q_ar: 'ما أقصى عدد للأدوار في نظام RBAC في ZIEN؟', options_en: ['5', '10', '22', 'Unlimited'], options_ar: ['5', '10', '22', 'غير محدود'], correct: 2 },
    { q_en: 'How do API keys work in ZIEN?', q_ar: 'كيف تعمل مفاتيح API في ZIEN؟', options_en: ['One shared key for all', 'Per-company keys with scope restrictions', 'No API access available', 'Keys are optional'], options_ar: ['مفتاح مشترك للجميع', 'مفاتيح لكل شركة مع قيود النطاق', 'لا يتوفر وصول API', 'المفاتيح اختيارية'], correct: 1 },
    { q_en: 'What is the purpose of webhook signatures?', q_ar: 'ما الغرض من توقيعات Webhook؟', options_en: ['Make messages prettier', 'Verify the sender identity and prevent tampering', 'Encrypt the data', 'Speed up delivery'], options_ar: ['جعل الرسائل أجمل', 'التحقق من هوية المرسل ومنع التلاعب', 'تشفير البيانات', 'تسريع التسليم'], correct: 1 },
    { q_en: 'Which action requires the minimum role level of 65 (dept. manager)?', q_ar: 'أي إجراء يتطلب الحد الأدنى لمستوى الدور 65 (مدير قسم)؟', options_en: ['Viewing dashboard', 'Creating new modules', 'Managing employee contracts', 'Platform configuration'], options_ar: ['عرض لوحة التحكم', 'إنشاء وحدات جديدة', 'إدارة عقود الموظفين', 'تكوين المنصة'], correct: 2 },
    { q_en: 'What happens during a security incident in ZIEN?', q_ar: 'ماذا يحدث أثناء حادث أمني في ZIEN؟', options_en: ['System shuts down completely', 'Audit logs capture event, admin is notified, sessions reviewed', 'Nothing happens automatically', 'Only the founder is notified by email'], options_ar: ['يتوقف النظام تماماً', 'سجلات التدقيق تلتقط الحدث، يُخطر المدير، تُراجع الجلسات', 'لا شيء يحدث تلقائياً', 'فقط المؤسس يُخطر عبر البريد'], correct: 1 },
  ],
};

/* ─── Course Lesson Content ──────────────────────────────────────────── */
interface LessonContent {
  title_en: string; title_ar: string;
  content_en: string; content_ar: string;
  duration_min: number;
}

function getCourseLessons(courseId: string): LessonContent[] {
  const base: Record<string, LessonContent[]> = {
    c1: [
      { title_en: 'Creating Your Account', title_ar: 'إنشاء حسابك', content_en: 'Learn how to register on ZIEN Platform, verify your email, and set up Two-Factor Authentication for maximum security.', content_ar: 'تعلم كيفية التسجيل في منصة ZIEN والتحقق من بريدك الإلكتروني وإعداد المصادقة الثنائية لأقصى درجات الأمان.', duration_min: 3 },
      { title_en: 'Company Registration', title_ar: 'تسجيل الشركة', content_en: 'Step-by-step guide to registering your company: name, trade license, industry selection, and choosing your subscription plan.', content_ar: 'دليل خطوة بخطوة لتسجيل شركتك: الاسم والرخصة التجارية واختيار القطاع وخطة الاشتراك.', duration_min: 4 },
      { title_en: 'Inviting Team Members', title_ar: 'دعوة أعضاء الفريق', content_en: 'How to send invitations via email, assign roles (from Employee to GM), and manage pending invitations.', content_ar: 'كيفية إرسال الدعوات عبر البريد وتعيين الأدوار (من موظف إلى مدير عام) وإدارة الدعوات المعلقة.', duration_min: 3 },
      { title_en: 'Dashboard Navigation', title_ar: 'التنقل في لوحة التحكم', content_en: 'Master the main dashboard: sidebar modules, quick stats, notification center, and personalization settings.', content_ar: 'إتقان لوحة التحكم الرئيسية: وحدات الشريط الجانبي والإحصائيات السريعة ومركز الإشعارات وإعدادات التخصيص.', duration_min: 3 },
      { title_en: 'Using RARE AI Assistant', title_ar: 'استخدام مساعد RARE AI', content_en: 'Introduction to RARE AI: how to ask questions, switch modes (Chat, Analyze, Search), and get module-specific help.', content_ar: 'مقدمة عن RARE AI: كيفية طرح الأسئلة وتبديل الأوضاع (محادثة، تحليل، بحث) والحصول على مساعدة خاصة بالوحدات.', duration_min: 2 },
    ],
    c7: [
      { title_en: 'What is RARE AI?', title_ar: 'ما هو RARE AI؟', content_en: 'RARE (Responsive Autonomous Reasoning Engine) is ZIEN\'s built-in AI system. It understands your business context and provides module-specific assistance.', content_ar: 'RARE (محرك التفكير الذاتي المستجيب) هو نظام الذكاء الاصطناعي المدمج في ZIEN. يفهم سياق عملك ويقدم مساعدة خاصة بكل وحدة.', duration_min: 3 },
      { title_en: 'Chat Mode', title_ar: 'وضع المحادثة', content_en: 'Ask RARE anything in natural language. It can help with HR questions, accounting guidance, project updates, and more — all filtered by your role permissions.', content_ar: 'اسأل RARE أي شيء بلغة طبيعية. يمكنه المساعدة في أسئلة الموارد البشرية وإرشادات المحاسبة وتحديثات المشاريع والمزيد — مع تصفية حسب صلاحياتك.', duration_min: 3 },
      { title_en: 'Analyze Mode', title_ar: 'وضع التحليل', content_en: 'Upload documents, financial statements, or contracts. RARE analyzes them and provides summaries, insights, and recommendations.', content_ar: 'ارفع المستندات أو البيانات المالية أو العقود. يحللها RARE ويقدم ملخصات ورؤى وتوصيات.', duration_min: 3 },
      { title_en: 'Search Mode', title_ar: 'وضع البحث', content_en: 'Semantic search across your company data — employees, invoices, projects, documents. RARE finds what you need with context-aware ranking.', content_ar: 'البحث الدلالي عبر بيانات شركتك — الموظفين والفواتير والمشاريع والمستندات. يجد RARE ما تحتاجه مع ترتيب مدرك للسياق.', duration_min: 3 },
      { title_en: 'Senate Mode', title_ar: 'وضع مجلس الشيوخ', content_en: 'For complex decisions: multiple AI agents (HR, Finance, Legal, Operations) deliberate together and provide a balanced recommendation.', content_ar: 'للقرارات المعقدة: عدة وكلاء ذكاء اصطناعي (موارد بشرية، مالية، قانونية، عمليات) يتداولون معاً ويقدمون توصية متوازنة.', duration_min: 3 },
      { title_en: 'AI-Powered Reports', title_ar: 'التقارير المدعومة بالذكاء', content_en: 'Generate professional reports with AI insights: financial summaries, employee performance reviews, project status reports, and KPI dashboards.', content_ar: 'إنشاء تقارير احترافية مع رؤى الذكاء الاصطناعي: ملخصات مالية ومراجعات أداء الموظفين وتقارير حالة المشاريع ولوحات KPI.', duration_min: 3 },
      { title_en: 'Customizing AI Behavior', title_ar: 'تخصيص سلوك AI', content_en: 'Configure AI preferences: language, response style, module focus, and automation triggers. Set up recurring AI tasks.', content_ar: 'تكوين تفضيلات AI: اللغة وأسلوب الرد وتركيز الوحدة ومحفزات الأتمتة. إعداد مهام AI المتكررة.', duration_min: 2 },
    ],
  };
  return base[courseId] || Array.from({ length: 5 }, (_, i) => ({
    title_en: `Lesson ${i + 1}`, title_ar: `الدرس ${i + 1}`,
    content_en: 'This lesson covers essential concepts and practical exercises. Content is loaded from the academy database when available.',
    content_ar: 'يغطي هذا الدرس المفاهيم الأساسية والتمارين العملية. يتم تحميل المحتوى من قاعدة بيانات الأكاديمية عند توفره.',
    duration_min: Math.floor(Math.random() * 5) + 2,
  }));
}

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
          <video
            src={ASSETS.VIDEO_GPHOTO}
            className="w-full aspect-video"
            controls
            autoPlay
            muted
            playsInline
            poster="/splash.gif"
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

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<TestItem | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizCurrentQ, setQuizCurrentQ] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);

  // Lesson viewer state
  const [viewingLessons, setViewingLessons] = useState(false);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [lessonContent, setLessonContent] = useState<LessonContent[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  // Quiz timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (activeQuiz && !quizSubmitted && quizTimeLeft > 0) {
      timerRef.current = setInterval(() => setQuizTimeLeft(t => { if (t <= 1) { setQuizSubmitted(true); return 0; } return t - 1; }), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [activeQuiz, quizSubmitted, quizTimeLeft]);

  const startQuiz = useCallback((test: TestItem) => {
    const questions = QUIZ_BANK[test.id] || [];
    setQuizQuestions(questions);
    setQuizAnswers(new Array(questions.length).fill(null));
    setQuizCurrentQ(0);
    setQuizSubmitted(false);
    setQuizTimeLeft(test.time_min * 60);
    setActiveQuiz(test);
  }, []);

  const submitQuiz = useCallback(() => {
    setQuizSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const quizScore = quizSubmitted ? quizAnswers.reduce((acc, ans, i) => acc + (ans === quizQuestions[i]?.correct ? 1 : 0), 0) : 0;
  const quizPercent = quizQuestions.length > 0 ? Math.round((quizScore / quizQuestions.length) * 100) : 0;
  const quizPassed = activeQuiz ? quizPercent >= activeQuiz.passing : false;

  const startLessons = useCallback((course: Course) => {
    setLessonContent(getCourseLessons(course.id));
    setLessonIndex(0);
    setCompletedLessons(new Set());
    setViewingLessons(true);
    setSelectedCourse(course);
  }, []);

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
                <button onClick={() => startQuiz(test)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all whitespace-nowrap">
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

                {/* Real lesson list */}
                <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
                  {getCourseLessons(selectedCourse.id).slice(0, 6).map((lesson, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-secondary)]">
                      <div className="w-6 h-6 bg-blue-600/10 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</div>
                      <span className="text-sm flex-1">{isAr ? lesson.title_ar : lesson.title_en}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">{lesson.duration_min}{isAr ? 'د' : 'm'}</span>
                      <Play className="w-4 h-4 text-[var(--text-secondary)]" />
                    </div>
                  ))}
                  {getCourseLessons(selectedCourse.id).length > 6 && (
                    <div className="text-xs text-center text-[var(--text-secondary)] pt-1">
                      +{getCourseLessons(selectedCourse.id).length - 6} {isAr ? 'دروس أخرى' : 'more lessons'}
                    </div>
                  )}
                </div>

                <button onClick={() => { startLessons(selectedCourse); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  {isAr ? 'ابدأ الدورة' : 'Start Course'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== QUIZ MODAL ===== */}
        <AnimatePresence>
          {activeQuiz && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => { setActiveQuiz(null); if (timerRef.current) clearInterval(timerRef.current); }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[var(--bg-primary)] rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

                {!quizSubmitted ? (
                  <>
                    {/* Quiz header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold">{isAr ? activeQuiz.title_ar : activeQuiz.title_en}</h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {isAr ? `سؤال ${quizCurrentQ + 1} من ${quizQuestions.length}` : `Question ${quizCurrentQ + 1} of ${quizQuestions.length}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${quizTimeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
                          <Clock className="w-4 h-4 inline-block mr-1" />
                          {Math.floor(quizTimeLeft / 60)}:{String(quizTimeLeft % 60).padStart(2, '0')}
                        </div>
                        <button onClick={() => { setActiveQuiz(null); if (timerRef.current) clearInterval(timerRef.current); }} className="p-2 hover:bg-black/5 rounded-lg">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 mb-6">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((quizCurrentQ + 1) / quizQuestions.length) * 100}%` }} />
                    </div>

                    {/* Question */}
                    {quizQuestions[quizCurrentQ] && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold mb-4">
                          {isAr ? quizQuestions[quizCurrentQ].q_ar : quizQuestions[quizCurrentQ].q_en}
                        </h3>
                        <div className="space-y-3">
                          {(isAr ? quizQuestions[quizCurrentQ].options_ar : quizQuestions[quizCurrentQ].options_en).map((opt, oi) => (
                            <button key={oi} onClick={() => { const newAnswers = [...quizAnswers]; newAnswers[quizCurrentQ] = oi; setQuizAnswers(newAnswers); }}
                              className={`w-full text-start p-4 rounded-xl border-2 transition-all ${quizAnswers[quizCurrentQ] === oi
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10'
                                : 'border-[var(--border-soft)] hover:border-blue-300'}`}>
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--bg-secondary)] text-xs font-bold mr-3">
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                      <button onClick={() => setQuizCurrentQ(q => Math.max(0, q - 1))} disabled={quizCurrentQ === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-[var(--bg-secondary)] transition-all">
                        <ArrowLeft className="w-4 h-4" /> {isAr ? 'السابق' : 'Previous'}
                      </button>
                      <div className="flex gap-1.5">
                        {quizQuestions.map((_, qi) => (
                          <button key={qi} onClick={() => setQuizCurrentQ(qi)}
                            className={`w-3 h-3 rounded-full transition-all ${qi === quizCurrentQ ? 'bg-blue-600 scale-125' : quizAnswers[qi] !== null ? 'bg-blue-300' : 'bg-[var(--bg-secondary)]'}`} />
                        ))}
                      </div>
                      {quizCurrentQ < quizQuestions.length - 1 ? (
                        <button onClick={() => setQuizCurrentQ(q => q + 1)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
                          {isAr ? 'التالي' : 'Next'} <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={submitQuiz} disabled={quizAnswers.some(a => a === null)}
                          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50">
                          <CheckCircle className="w-4 h-4" /> {isAr ? 'تسليم' : 'Submit'}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  /* Quiz Results */
                  <div className="text-center py-4">
                    <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${quizPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {quizPassed ? <Trophy className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
                    </div>
                    <h2 className="text-3xl font-black mb-2">{quizPercent}%</h2>
                    <p className="text-xl font-bold mb-1">
                      {quizPassed ? (isAr ? 'مبروك! نجحت! 🎉' : 'Congratulations! You Passed! 🎉') : (isAr ? 'لم تنجح هذه المرة' : 'Not Passed This Time')}
                    </p>
                    <p className="text-[var(--text-secondary)] mb-6">
                      {isAr ? `${quizScore} من ${quizQuestions.length} إجابات صحيحة • الحد الأدنى: ${activeQuiz.passing}%` : `${quizScore} of ${quizQuestions.length} correct • Minimum: ${activeQuiz.passing}%`}
                    </p>

                    {quizPassed && (
                      <div className="glass-card p-6 mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-300/30">
                        <Award className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
                        <h3 className="font-bold">{isAr ? 'شهادتك جاهزة!' : 'Your Certificate is Ready!'}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">{isAr ? activeQuiz.title_ar : activeQuiz.title_en}</p>
                        <div className="flex justify-center gap-3">
                          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">
                            <Download className="w-4 h-4" /> {isAr ? 'تحميل PDF' : 'Download PDF'}
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] rounded-lg text-sm font-bold">
                            <Share2 className="w-4 h-4" /> {isAr ? 'مشاركة' : 'Share'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show correct answers */}
                    <div className="text-start space-y-3 mt-6 max-h-60 overflow-y-auto">
                      {quizQuestions.map((q, qi) => (
                        <div key={qi} className={`p-3 rounded-xl border-2 ${quizAnswers[qi] === q.correct ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : 'border-red-300 bg-red-50 dark:bg-red-900/10'}`}>
                          <p className="text-sm font-bold mb-1">{qi + 1}. {isAr ? q.q_ar : q.q_en}</p>
                          <p className="text-xs">
                            <span className="text-emerald-700 dark:text-emerald-400">✓ {isAr ? q.options_ar[q.correct] : q.options_en[q.correct]}</span>
                            {quizAnswers[qi] !== q.correct && quizAnswers[qi] !== null && (
                              <span className="text-red-600 dark:text-red-400 block">✗ {isAr ? q.options_ar[quizAnswers[qi]!] : q.options_en[quizAnswers[qi]!]}</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center gap-3 mt-6">
                      {!quizPassed && (
                        <button onClick={() => startQuiz(activeQuiz)} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
                          <RotateCcw className="w-4 h-4" /> {isAr ? 'أعد الاختبار' : 'Retry'}
                        </button>
                      )}
                      <button onClick={() => setActiveQuiz(null)} className="px-5 py-2 bg-[var(--bg-secondary)] rounded-xl text-sm font-bold">
                        {isAr ? 'إغلاق' : 'Close'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== LESSON VIEWER MODAL ===== */}
        <AnimatePresence>
          {viewingLessons && selectedCourse && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
              onClick={() => { setViewingLessons(false); setSelectedCourse(null); }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[var(--bg-primary)] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col sm:flex-row" onClick={e => e.stopPropagation()}>

                {/* Sidebar - lesson list */}
                <div className="w-full sm:w-72 bg-[var(--bg-secondary)] p-4 overflow-y-auto border-b sm:border-b-0 sm:border-r border-[var(--border-soft)] max-h-48 sm:max-h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm">{isAr ? selectedCourse.title_ar : selectedCourse.title_en}</h3>
                    <button onClick={() => { setViewingLessons(false); setSelectedCourse(null); }} className="sm:hidden p-1 hover:bg-black/5 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mb-3">
                    {completedLessons.size}/{lessonContent.length} {isAr ? 'مكتمل' : 'completed'}
                    <div className="w-full bg-[var(--bg-primary)] rounded-full h-1.5 mt-1">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(completedLessons.size / Math.max(1, lessonContent.length)) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    {lessonContent.map((lesson, i) => (
                      <button key={i} onClick={() => setLessonIndex(i)}
                        className={`w-full text-start flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${i === lessonIndex ? 'bg-blue-600 text-white' : 'hover:bg-[var(--bg-primary)]'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${completedLessons.has(i) ? 'bg-emerald-500 text-white' : i === lessonIndex ? 'bg-white/20 text-white' : 'bg-[var(--bg-primary)]'}`}>
                          {completedLessons.has(i) ? <CheckCircle className="w-3 h-3" /> : i + 1}
                        </div>
                        <span className="truncate">{isAr ? lesson.title_ar : lesson.title_en}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-[var(--text-secondary)] mb-1">{isAr ? `الدرس ${lessonIndex + 1}` : `Lesson ${lessonIndex + 1}`}</p>
                      <h2 className="text-2xl font-bold">{isAr ? lessonContent[lessonIndex]?.title_ar : lessonContent[lessonIndex]?.title_en}</h2>
                    </div>
                    <button onClick={() => { setViewingLessons(false); setSelectedCourse(null); }} className="hidden sm:block p-2 hover:bg-black/5 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mb-8">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lessonContent[lessonIndex]?.duration_min} {isAr ? 'دقيقة' : 'min'}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${completedLessons.has(lessonIndex) ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {completedLessons.has(lessonIndex) ? (isAr ? 'مكتمل' : 'Completed') : (isAr ? 'جديد' : 'New')}
                    </span>
                  </div>

                  <div className="prose dark:prose-invert max-w-none mb-8">
                    <p className="text-[var(--text-secondary)] leading-relaxed text-base">
                      {isAr ? lessonContent[lessonIndex]?.content_ar : lessonContent[lessonIndex]?.content_en}
                    </p>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-[var(--border-soft)]">
                    <button onClick={() => setLessonIndex(i => Math.max(0, i - 1))} disabled={lessonIndex === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-[var(--bg-secondary)]">
                      <ArrowLeft className="w-4 h-4" /> {isAr ? 'السابق' : 'Previous'}
                    </button>

                    {!completedLessons.has(lessonIndex) ? (
                      <button onClick={() => setCompletedLessons(s => new Set(s).add(lessonIndex))}
                        className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700">
                        <CheckCircle className="w-4 h-4" /> {isAr ? 'إكمال الدرس' : 'Mark Complete'}
                      </button>
                    ) : (
                      <span className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                        <CheckCircle className="w-4 h-4" /> {isAr ? 'مكتمل' : 'Done'}
                      </span>
                    )}

                    {lessonIndex < lessonContent.length - 1 ? (
                      <button onClick={() => { setCompletedLessons(s => new Set(s).add(lessonIndex)); setLessonIndex(i => i + 1); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                        {isAr ? 'التالي' : 'Next'} <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => { setCompletedLessons(s => new Set(s).add(lessonIndex)); setViewingLessons(false); setSelectedCourse(null); }}
                        className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700">
                        <GraduationCap className="w-4 h-4" /> {isAr ? 'إنهاء الدورة' : 'Finish Course'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
