import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap, PlayCircle, BookOpen, Award, Search, Loader2,
  Video, Sparkles, Users, BarChart3, ShieldCheck, Truck, Brain, Clock,
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../services/supabase';

// ─── Video Prompts for Academy Content Creation ─────────────────────────────
const VIDEO_PROMPTS = [
  {
    id: 'vp1',
    title_en: 'Platform Overview & First Steps',
    title_ar: 'نظرة عامة على المنصة والخطوات الأولى',
    desc_en: 'A cinematic walkthrough of the ZIEN Platform — how to sign up, navigate the dashboard, configure your company, and invite your team. Covers multi-tenant architecture basics.',
    desc_ar: 'جولة سينمائية في منصة ZIEN — كيفية التسجيل، التنقل في لوحة التحكم، إعداد الشركة، ودعوة فريقك. تغطي أساسيات البنية متعددة المستأجرين.',
    icon: Sparkles,
    category: 'core',
    duration: '8-12 min',
    color: 'from-blue-600 to-cyan-500',
    prompt: `Create a professional tutorial video for the ZIEN SaaS Business Platform.
Scene 1: Cinematic intro — ZIEN logo animation with circuit-board node design, steel blue gradient.
Scene 2: Show the login page, explain invite-only access, demonstrate email/Google/Apple auth.
Scene 3: Dashboard overview — sidebar navigation, role-based menu items, theme/language switcher.
Scene 4: Company setup — show OnboardingWizard steps: company name, type, country, modules selection.
Scene 5: Team Management — demonstrate inviting employees, assigning roles (GM, department head, employee).
Scene 6: Quick tour of modules — HR, Accounting, CRM, Store, Projects, Chat, Meetings.
Outro: Certification path CTA, ZIEN Academy branding.
Style: Clean, modern UI recordings with smooth transitions, Arabic + English subtitles, background music (corporate/upbeat).`,
  },
  {
    id: 'vp2',
    title_en: 'HR & Payroll Mastery',
    title_ar: 'إتقان الموارد البشرية والرواتب',
    desc_en: 'Complete guide to employee management, attendance tracking, leave management, payroll processing, and HR analytics with RARE AI assistance.',
    desc_ar: 'دليل شامل لإدارة الموظفين، تتبع الحضور، إدارة الإجازات، معالجة الرواتب، وتحليلات الموارد البشرية بمساعدة RARE AI.',
    icon: Users,
    category: 'hr',
    duration: '15-20 min',
    color: 'from-emerald-600 to-teal-500',
    prompt: `Create a detailed HR module tutorial for ZIEN Platform.
Scene 1: HR Dashboard overview — employee count cards, department breakdown, attendance summary.
Scene 2: Adding employees — profile creation, document upload, contract setup, department assignment.
Scene 3: Attendance system — clock-in/out, GPS tracking for field workers, overtime calculation.
Scene 4: Leave management — request flow, approval workflow, balance tracking, calendar view.
Scene 5: Payroll processing — salary configuration, deductions, bonuses, tax calculation (VAT for UAE/KSA/Egypt).
Scene 6: Performance reviews — 360 feedback, KPI tracking, goals management.
Scene 7: RARE AI integration — "Ask RARE about employee performance trends", auto-generate HR reports.
Scene 8: Reports & analytics — turnover rate, headcount trends, department-level insights.
Style: Split-screen showing UI actions + animated infographics, bilingual subtitles.`,
  },
  {
    id: 'vp3',
    title_en: 'Financial Operations & Accounting',
    title_ar: 'العمليات المالية والمحاسبة',
    desc_en: 'Master invoicing, chart of accounts, journal entries, financial reports, multi-currency support, and tax compliance across GCC countries.',
    desc_ar: 'إتقان الفواتير، شجرة الحسابات، القيود اليومية، التقارير المالية، دعم العملات المتعددة، والامتثال الضريبي في دول الخليج.',
    icon: BarChart3,
    category: 'finance',
    duration: '18-25 min',
    color: 'from-violet-600 to-purple-500',
    prompt: `Create a comprehensive Accounting & Finance tutorial for ZIEN Platform.
Scene 1: Accounting Dashboard — revenue/expense overview, cash flow chart, outstanding invoices.
Scene 2: Chart of Accounts setup — default templates per country, adding custom accounts, hierarchy.
Scene 3: Journal Entries — manual entries, auto-generated from invoices, reversals.
Scene 4: Invoice Management — create invoice, send to client, track payments, recurring invoices.
Scene 5: Expense tracking — employee expenses, approval flow, receipt scanning.
Scene 6: Multi-currency — setting up currencies, exchange rates, cross-currency transactions.
Scene 7: Tax compliance — VAT setup (5% UAE, 15% KSA, 14% Egypt), tax reports, filing preparation.
Scene 8: Financial Reports — P&L, Balance Sheet, Cash Flow Statement, custom date ranges.
Scene 9: RARE AI — "Generate monthly financial summary", "Flag unusual transactions".
Style: Professional, screen recordings with financial data (sample company), animated charts, bilingual.`,
  },
  {
    id: 'vp4',
    title_en: 'RARE AI — Your Intelligent Assistant',
    title_ar: 'RARE AI — مساعدك الذكي',
    desc_en: 'Deep dive into the RARE AI engine — natural language commands, context-aware suggestions, automated workflows, and how AI transforms every module.',
    desc_ar: 'غوص عميق في محرك RARE AI — الأوامر باللغة الطبيعية، الاقتراحات السياقية، الأتمتة، وكيف يحول الذكاء الاصطناعي كل وحدة.',
    icon: Brain,
    category: 'ai',
    duration: '12-15 min',
    color: 'from-amber-500 to-orange-600',
    prompt: `Create an exciting RARE AI showcase video for ZIEN Platform.
Scene 1: Dramatic intro — "Meet RARE" — AI brain animation, particles converging into the RARE logo.
Scene 2: RARE Chat interface — show the floating AI button, open the chat panel.
Scene 3: Demo RARE across modules:
  - HR: "Show me employees with expiring contracts this month" → instant table
  - Finance: "Generate a cash flow forecast for Q2" → chart + insights
  - CRM: "Draft a follow-up email for client Abdullah" → ready-to-send email
  - Projects: "What tasks are overdue in Project Alpha?" → task list with owners
Scene 4: RARE execution mode — "Create an invoice for client XYZ for AED 5,000" → RARE creates it.
Scene 5: Knowledge Base — RARE learns company-specific context, remembers past conversations.
Scene 6: Security — data stays within tenant, no cross-company leaks, audit trail.
Scene 7: Tips & tricks — best prompts, how to train RARE with your data.
Style: Futuristic, dark theme with blue/amber accents, AI-inspired animations, bilingual subtitles.`,
  },
  {
    id: 'vp5',
    title_en: 'CRM, Sales & Client Portal',
    title_ar: 'إدارة العملاء والمبيعات وبوابة العميل',
    desc_en: 'Learn lead management, sales pipeline, client communication, deal tracking, and how to set up and customize the client-facing portal.',
    desc_ar: 'تعلم إدارة العملاء المحتملين، خط المبيعات، التواصل مع العملاء، تتبع الصفقات، وإعداد بوابة العميل.',
    icon: ShieldCheck,
    category: 'crm',
    duration: '14-18 min',
    color: 'from-pink-600 to-rose-500',
    prompt: `Create a CRM & Sales module tutorial for ZIEN Platform.
Scene 1: CRM Dashboard — pipeline overview (kanban board), deal values, conversion rates.
Scene 2: Lead Management — adding leads, source tracking, lead scoring, auto-assignment.
Scene 3: Contact Management — client profiles, communication history, notes, tags.
Scene 4: Sales Pipeline — drag-and-drop stages, deal creation, probability tracking, forecasting.
Scene 5: Communication — email templates, WhatsApp integration, call logging, activity timeline.
Scene 6: Client Portal setup — branding, enabling modules (invoices, projects, support tickets).
Scene 7: Client experience — how clients log in, view their invoices, track project progress.
Scene 8: Reports — sales by team member, pipeline value trends, win/loss analysis.
Style: Dynamic, showing Kanban boards with smooth drag-and-drop, client portal split-screen view, bilingual.`,
  },
  {
    id: 'vp6',
    title_en: 'Logistics, Fleet & GPS Tracking',
    title_ar: 'اللوجستيات والأسطول وتتبع GPS',
    desc_en: 'Complete logistics operations — vehicle management, driver assignment, route planning, shipment tracking, GPS real-time monitoring, and delivery proof.',
    desc_ar: 'العمليات اللوجستية الكاملة — إدارة المركبات، تعيين السائقين، تخطيط المسارات، تتبع الشحنات، مراقبة GPS الحية، وإثبات التسليم.',
    icon: Truck,
    category: 'logistics',
    duration: '12-16 min',
    color: 'from-indigo-600 to-blue-500',
    prompt: `Create a Logistics & Fleet Management tutorial for ZIEN Platform.
Scene 1: Logistics Dashboard — vehicle status overview, active shipments map, delivery stats.
Scene 2: Fleet Management — adding vehicles (plate, model, type), status tracking (available/in-use/maintenance).
Scene 3: Driver Management — assigning drivers to vehicles, license tracking, performance metrics.
Scene 4: Route Planning — create routes with waypoints, estimated distance/duration, map visualization.
Scene 5: Shipment Creation — tracking code generation (ZN-XXXXX), assigning driver/vehicle/route.
Scene 6: GPS Live Tracking — real-time map view, driver location pings, speed monitoring.
Scene 7: Delivery Flow — status updates (pending → picked up → in transit → delivered), proof of delivery photo.
Scene 8: Analytics — delivery success rate, average delivery time, fuel consumption estimates.
Style: Map-focused with animated route lines, real-time location dots, mobile app GPS view, bilingual subtitles.`,
  },
];

export default function Academy() {
  const { company } = useCompany();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (!company?.id) return;
    supabase
      .from('academy_courses')
      .select('id, title, duration_minutes, lesson_count, category')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCourses(data ?? []);
        setLoading(false);
      });
  }, [company?.id]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">ZIEN Academy</h1>
          <p className="text-sm text-zinc-500 font-medium">Master the platform with our professional educational modules.</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input type="text" placeholder="Search courses..." className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium" />
        </div>
      </div>

      {/* ─── Hero Video Section ──────────────────────────────────────── */}
      <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700/50">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Video / Image */}
          <div className="aspect-video md:aspect-auto md:min-h-[320px] relative overflow-hidden">
            <img
              src="https://lh3.googleusercontent.com/p/AF1QipPpNvwslevTyVeP6ONqwPD2GojEk3VLodzDCMdn=w243-h174-n-k-no-nu"
              alt="ZIEN Academy"
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 bg-blue-600/90 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer shadow-2xl shadow-blue-600/40"
              >
                <PlayCircle size={40} className="text-white ml-1" />
              </motion.div>
            </div>
          </div>
          {/* Info */}
          <div className="p-8 md:p-10 flex flex-col justify-center text-white">
            <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-full w-fit mb-4">
              Featured Course
            </span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-3">
              ZIEN Platform Complete Guide
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              From zero to hero — master every module of the ZIEN Platform with hands-on tutorials, 
              real-world scenarios, and RARE AI integration tips.
            </p>
            <div className="flex items-center gap-6 text-xs text-zinc-500 mb-6">
              <span className="flex items-center gap-1.5"><Video size={14} /> 6 Videos</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> ~90 min total</span>
              <span className="flex items-center gap-1.5"><GraduationCap size={14} /> Certificate</span>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all w-fit">
              Start Watching
            </button>
          </div>
        </div>
      </div>

      {/* ─── Video Prompts Section ───────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Video Courses</h2>
            <p className="text-xs text-zinc-500 mt-1">Professional training videos for each platform module</p>
          </div>
          <span className="px-3 py-1.5 bg-blue-600/10 text-blue-600 text-[10px] font-bold rounded-full">
            {VIDEO_PROMPTS.length} Videos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {VIDEO_PROMPTS.map((vp) => (
            <motion.div
              key={vp.id}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-200 dark:border-zinc-800 overflow-hidden group cursor-pointer"
              onClick={() => setExpandedPrompt(expandedPrompt === vp.id ? null : vp.id)}
            >
              {/* Gradient Header */}
              <div className={`h-2 bg-gradient-to-r ${vp.color}`} />
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${vp.color} flex items-center justify-center shrink-0`}>
                    <vp.icon size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                      {vp.title_en}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-medium">{vp.title_ar}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">{vp.desc_en}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Clock size={10} /> {vp.duration}</span>
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">{vp.category}</span>
                  </div>
                  <PlayCircle size={20} className="text-zinc-300 group-hover:text-blue-600 transition-colors" />
                </div>

                {/* Expanded Prompt */}
                {expandedPrompt === vp.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Video Production Prompt</span>
                    </div>
                    <pre className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap font-mono bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 max-h-60 overflow-y-auto leading-relaxed">
                      {vp.prompt}
                    </pre>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(vp.prompt);
                      }}
                      className="mt-3 px-4 py-2 bg-blue-600/10 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600/20 transition-all"
                    >
                      Copy Prompt
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── DB Courses ──────────────────────────────────────────────── */}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-zinc-400" /></div>}

      {!loading && courses.length > 0 && (
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Company Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-800 group cursor-pointer"
              >
                <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden">
                  <PlayCircle size={48} className="text-zinc-300 group-hover:text-blue-600 transition-colors relative z-10" />
                  <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="px-2 py-1 bg-blue-600/10 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded mb-3 inline-block">
                  {course.category || 'General'}
                </span>
                <h3 className="font-black uppercase tracking-tight mb-2 leading-tight">{course.title}</h3>
                <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1"><BookOpen size={12} /> {course.lesson_count || 0} Lessons</div>
                  <div className="flex items-center gap-1"><GraduationCap size={12} /> {course.duration_minutes ? `${course.duration_minutes} min` : '--'}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Certification CTA ───────────────────────────────────────── */}
      <div className="bg-zinc-900 text-white p-10 rounded-[40px] flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Earn Your ZIEN Certification</h2>
          <p className="text-zinc-400 text-sm mb-8 font-medium leading-relaxed">
            Complete the core training modules and pass the assessment to become a certified ZIEN Platform Administrator.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
            Start Certification
          </button>
        </div>
        <div className="absolute right-0 top-0 p-10 opacity-10">
          <Award size={200} />
        </div>
      </div>
    </div>
  );
}
