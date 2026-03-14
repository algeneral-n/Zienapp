import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Send, Mic, Sparkles,
  HelpCircle, BarChart2,
  Zap, FileText, Maximize2,
  MessageSquare, Info,
  Upload, Volume2, Phone,
  Globe, Shield, Briefcase, Radio,
  Users, FileCheck, CalendarDays,
  TrendingUp, ClipboardList, Headphones,
  MoreHorizontal
} from 'lucide-react';
import Markdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import { generateRAREAnalysis, generatePublicAIResponse, generateTTS, RAREAgentType } from '../services/aiService';
import { RAREMode, RAREContext, RAREQuickAction, Language, ThemeMode, AIContextMode } from '../types';
import { useTheme } from './ThemeProvider';
import { usePermissions } from '../hooks/usePermissions';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

// ─── Mode Configuration ──────────────────────────────────────────────────────

const MODE_CONFIG: Record<AIContextMode, {
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  labelKey: string;
}> = {
  public: { icon: Globe, colorClass: 'text-blue-500', bgClass: 'bg-blue-500', labelKey: 'ai_mode_public' },
  client: { icon: Briefcase, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500', labelKey: 'ai_mode_client' },
  tenant: { icon: Shield, colorClass: 'text-brand', bgClass: 'bg-brand', labelKey: 'ai_mode_tenant' },
  realtime: { icon: Radio, colorClass: 'text-orange-500', bgClass: 'bg-orange-500', labelKey: 'ai_mode_realtime' },
};

interface FloatingActionsProps {
  user?: any;
  pageContext?: { pageType: 'public' | 'protected'; pageKey: string; companyId?: string; role?: string; modules?: string[] };
}

export default function FloatingActions({ user, pageContext }: FloatingActionsProps) {
  const location = useLocation();
  const { mode: themeMode } = useTheme();
  const { t: translate, i18n } = useTranslation();
  const { profile } = useAuth();
  const { company, membership } = useCompany();
  const { role: permRole, isPlatform: isFounder, isAdmin: isPlatformAdmin } = usePermissions();
  const language = i18n.language as Language;
  const mode = themeMode as ThemeMode;

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isRAREVisible, setIsRAREVisible] = useState(true);
  const [activeMode, setActiveMode] = useState<RAREMode>('help');
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'ai'; text: string; mode?: RAREMode }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isListening, setIsListening] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; data: string; mimeType: string }[]>([]);
  const [fastMode, setFastMode] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Auto-detect AI context mode ──────────────────────────────────────────
  const aiContextMode = useMemo((): AIContextMode => {
    const path = location.pathname;
    const isAuthenticated = !!user || !!profile;

    // Not authenticated = Public mode
    if (!isAuthenticated) return 'public';

    // Client portal = Client mode
    if (path.includes('/client')) return 'client';

    // Realtime pages (meetings, voice calls, live chat)
    if (path.includes('/meetings') || path.includes('/voice') || path.includes('/call')) return 'realtime';

    // Authenticated + inside platform = Tenant mode
    return 'tenant';
  }, [location.pathname, user, profile]);

  const modeConfig = MODE_CONFIG[aiContextMode];
  const ModeIcon = modeConfig.icon;

  // ─── Welcome message based on mode ────────────────────────────────────────
  useEffect(() => {
    const welcomeMessages: Record<AIContextMode, { en: string; ar: string }> = {
      public: {
        en: 'Hello! I am RARE, your ZIEN AI assistant. I can help you learn about our platform, answer questions, generate images, translate text, and more. How can I help you today?',
        ar: 'مرحبًا! أنا RARE، مساعدك الذكي في ZIEN. يمكنني مساعدتك في التعرف على منصتنا، الإجابة على أسئلتك، إنشاء الصور، ترجمة النصوص، والمزيد. كيف يمكنني مساعدتك اليوم؟',
      },
      client: {
        en: 'Welcome to your Client Portal! I can help you check invoices, contracts, support tickets, and meeting schedules. What would you like to know?',
        ar: 'مرحبًا ببوابة العميل! يمكنني مساعدتك في مراجعة الفواتير والعقود وتذاكر الدعم وجداول الاجتماعات. ماذا تريد أن تعرف؟',
      },
      tenant: {
        en: `Hello! I'm RARE, your ${company?.name || 'company'} AI assistant. I have full context of your role and modules. Ask me anything about your work!`,
        ar: `مرحبًا! أنا RARE، مساعدك الذكي في ${company?.name || 'شركتك'}. لدي سياق كامل لدورك والوحدات المتاحة. اسألني أي شيء عن عملك!`,
      },
      realtime: {
        en: 'Real-time mode active! I can help you during live meetings, calls, and chat sessions. I can summarize discussions, take notes, and suggest actions.',
        ar: 'وضع الوقت الحقيقي نشط! يمكنني مساعدتك خلال الاجتماعات والمكالمات والمحادثات المباشرة. يمكنني تلخيص النقاشات وتسجيل الملاحظات واقتراح الإجراءات.',
      },
    };
    const msg = welcomeMessages[aiContextMode];
    setMessages([{ id: 'welcome', role: 'ai', text: language === 'ar' ? msg.ar : msg.en }]);
  }, [aiContextMode, language, company?.name]);

  // ─── Quick actions per mode ────────────────────────────────────────────────
  const quickActions = useMemo((): RAREQuickAction[] => {
    switch (aiContextMode) {
      case 'public':
        return [
          { id: 'features', label: language === 'ar' ? 'مميزات المنصة' : 'Platform Features', mode: 'help', prompt: language === 'ar' ? 'ما هي مميزات منصة زين؟' : 'What are the features of ZIEN platform?' },
          { id: 'pricing', label: language === 'ar' ? 'الأسعار' : 'Pricing', mode: 'help', prompt: language === 'ar' ? 'ما هي خطط الأسعار المتاحة؟' : 'What pricing plans are available?' },
          { id: 'demo', label: language === 'ar' ? 'عرض تجريبي' : 'Demo', mode: 'help', prompt: language === 'ar' ? 'أريد رؤية عرض تجريبي للمنصة' : 'I want to see a demo of the platform' },
          { id: 'faq', label: language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ', mode: 'help', prompt: language === 'ar' ? 'ما هي الأسئلة الشائعة؟' : 'Show me frequently asked questions' },
        ];
      case 'client':
        return [
          { id: 'invoices', label: language === 'ar' ? 'فواتيري' : 'My Invoices', mode: 'help', prompt: language === 'ar' ? 'اعرض فواتيري الأخيرة' : 'Show my recent invoices' },
          { id: 'contracts', label: language === 'ar' ? 'العقود' : 'Contracts', mode: 'help', prompt: language === 'ar' ? 'ما حالة عقودي؟' : 'What is the status of my contracts?' },
          { id: 'tickets', label: language === 'ar' ? 'تذاكر الدعم' : 'Support Tickets', mode: 'help', prompt: language === 'ar' ? 'اعرض تذاكر الدعم المفتوحة' : 'Show my open support tickets' },
          { id: 'meetings', label: language === 'ar' ? 'الاجتماعات' : 'Meetings', mode: 'help', prompt: language === 'ar' ? 'ما مواعيد اجتماعاتي القادمة؟' : 'What are my upcoming meetings?' },
        ];
      case 'tenant': {
        const role = membership?.role || '';
        const actions: RAREQuickAction[] = [
          { id: 'explain', label: translate('explain_page'), mode: 'help', prompt: 'Can you explain what I can do on this page?' },
        ];
        if (role === 'company_gm' || role === 'assistant_gm' || isFounder) {
          actions.push({ id: 'kpis', label: language === 'ar' ? 'مؤشرات الأداء' : 'KPIs', mode: 'analyze', prompt: language === 'ar' ? 'أعطني ملخص مؤشرات الأداء' : 'Give me a KPI summary' });
          actions.push({ id: 'approvals', label: language === 'ar' ? 'الموافقات المعلقة' : 'Pending Approvals', mode: 'act', prompt: language === 'ar' ? 'ما الموافقات المعلقة؟' : 'What approvals are pending?' });
        }
        if (['hr_officer', 'hr_manager'].includes(role)) {
          actions.push({ id: 'hr_report', label: language === 'ar' ? 'تقرير الحضور' : 'Attendance Report', mode: 'analyze', prompt: 'Generate an attendance summary report' });
          actions.push({ id: 'leave', label: language === 'ar' ? 'طلبات الإجازة' : 'Leave Requests', mode: 'act', prompt: 'Show pending leave requests' });
        }
        if (['accountant', 'finance_manager'].includes(role)) {
          actions.push({ id: 'finance', label: language === 'ar' ? 'تحليل مالي' : 'Financial Analysis', mode: 'analyze', prompt: 'Analyze current financial data' });
          actions.push({ id: 'invoice', label: translate('create_invoice'), mode: 'act', prompt: 'Help me draft a new invoice' });
        }
        if (['sales_rep', 'sales_manager'].includes(role)) {
          actions.push({ id: 'pipeline', label: language === 'ar' ? 'خط الأنابيب' : 'Sales Pipeline', mode: 'analyze', prompt: 'Show sales pipeline summary' });
        }
        if (actions.length < 3) {
          actions.push({ id: 'analyze', label: translate('analyze_data'), mode: 'analyze', prompt: 'Analyze the current page data' });
        }
        return actions;
      }
      case 'realtime':
        return [
          { id: 'summarize', label: language === 'ar' ? 'تلخيص المحادثة' : 'Summarize', mode: 'analyze', prompt: language === 'ar' ? 'لخص المحادثة الحالية' : 'Summarize the current discussion' },
          { id: 'actions', label: language === 'ar' ? 'بنود العمل' : 'Action Items', mode: 'act', prompt: language === 'ar' ? 'ما بنود العمل من هذا الاجتماع؟' : 'What are the action items from this meeting?' },
          { id: 'notes', label: language === 'ar' ? 'ملاحظات' : 'Take Notes', mode: 'help', prompt: language === 'ar' ? 'سجل ملاحظات هذا الاجتماع' : 'Take notes for this meeting' },
        ];
    }
  }, [aiContextMode, language, membership?.role, isFounder, translate]);

  // ─── TTS ───────────────────────────────────────────────────────────────────
  const speakResponse = async (text: string) => {
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      return;
    }
    try {
      setIsSpeaking(true);
      const blobUrl = await generateTTS(text);
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(blobUrl); };
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(blobUrl); };
      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  };

  // ─── Voice Input ───────────────────────────────────────────────────────────
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'ar' ? 'متصفحك لا يدعم التعرف على الصوت.' : 'Your browser does not support speech recognition.');
      return;
    }
    if (isListening) { setIsListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      setInput(prev => prev + ' ' + event.results[0][0].transcript);
    };
    recognition.start();
  };

  // ─── File Upload ───────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setSelectedFiles(prev => [...prev, { name: file.name, data: base64, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));

  // ─── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOpenRare = () => { setIsPanelOpen(true); setIsRAREVisible(true); };
    window.addEventListener('open-rare-chat', handleOpenRare);
    return () => window.removeEventListener('open-rare-chat', handleOpenRare);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const t1 = setTimeout(() => { if (!isPanelOpen) setShowGreeting(true); }, 2000);
    const t2 = setTimeout(() => setShowGreeting(false), 8000);
    const t3 = setTimeout(() => setShowTooltip(false), 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Context + Agent Detection ─────────────────────────────────────────────
  const getContext = (): RAREContext => {
    const path = location.pathname;
    let pageCode = 'landing';
    let moduleCode: string | undefined;

    if (path.includes('/portal')) pageCode = 'employee_portal';
    else if (path.includes('/owner')) pageCode = 'owner_dashboard';
    else if (path.includes('/client')) pageCode = 'client_portal';
    else if (path.includes('/onboarding') || path.includes('/register')) pageCode = 'onboarding';
    else if (path.includes('/dashboard')) {
      pageCode = 'dashboard';
      const moduleMatch = path.match(/\/dashboard\/([^/]+)/);
      if (moduleMatch) { moduleCode = moduleMatch[1]; pageCode = moduleMatch[1]; }
    }

    const companyRole = membership?.role || 'employee';
    const effectiveRole = isFounder ? 'founder' : isPlatformAdmin ? 'platform_admin' : companyRole;

    return { pageCode, moduleCode, userRole: effectiveRole as any, companyName: company?.name || 'ZIEN Platform', language, theme: mode };
  };

  const getAgentType = (context: RAREContext): RAREAgentType => {
    if (isFounder || isPlatformAdmin) return 'founder';
    const path = location.pathname;
    if (path.includes('accounting')) return 'accounting';
    if (path.includes('hr')) return 'hr';
    if (path.includes('sales') || path.includes('crm')) return 'sales';
    if (path.includes('logistics')) return 'fleet';
    if (path.includes('projects')) return 'projects';
    if (path.includes('store')) return 'store';
    const role = membership?.role || '';
    if (role === 'company_gm' || role === 'assistant_gm') return 'gm';
    if (role === 'executive_secretary') return 'secretary';
    if (role === 'accountant') return 'accounting';
    if (role === 'department_manager' || role === 'hr_officer') return 'hr';
    return 'secretary';
  };

  // ─── Send Message (mode-aware) ─────────────────────────────────────────────
  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() && selectedFiles.length === 0) return;

    setMessages(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'user', text: textToSend, mode: activeMode }]);
    setInput('');
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';
      const companyId = company?.id || '';
      const token = (await supabase.auth.getSession())?.data?.session?.access_token || '';
      const trimmed = textToSend.trim();

      // ─── Command prefix routing (available in all modes) ──────────
      if (trimmed.startsWith('/translate ') || trimmed.startsWith('/ترجم ')) {
        const parts = trimmed.replace(/^\/(translate|ترجم)\s+/, '').split(/\s+/);
        const targetLang = parts[0] || 'en';
        const textToTranslate = parts.slice(1).join(' ');
        if (!textToTranslate) {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: language === 'ar' ? 'استخدم: /ترجم en النص المراد ترجمته' : 'Usage: /translate ar text to translate' }]);
          setIsLoading(false); return;
        }
        const res = await fetch(`${API_URL}/api/ai/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ text: textToTranslate, targetLang, companyId }),
        });
        const data = await res.json();
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: data.translated || data.error || 'Translation failed', mode: activeMode }]);
        setIsLoading(false); return;
      }

      if (trimmed.startsWith('/image ') || trimmed.startsWith('/صورة ')) {
        const prompt = trimmed.replace(/^\/(image|صورة)\s+/, '');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: language === 'ar' ? '⏳ جاري إنشاء الصورة...' : '⏳ Generating image...' }]);
        const res = await fetch(`${API_URL}/api/ai/generate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ prompt, companyId }),
        });
        const data = await res.json();
        const imgMsg = data.imageUrl ? `![Generated Image](${data.imageUrl})\n\n${data.revisedPrompt || ''}` : (data.error || 'Image generation failed');
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { id: Date.now().toString(), role: 'ai', text: imgMsg, mode: activeMode }; return u; });
        setIsLoading(false); return;
      }

      if (trimmed.startsWith('/file ') || trimmed.startsWith('/ملف ')) {
        const content = trimmed.replace(/^\/(file|ملف)\s+/, '');
        const pipeIdx = content.indexOf('|');
        let fileType = 'custom', title = 'Document', instructions = content;
        if (pipeIdx > -1) {
          const header = content.substring(0, pipeIdx).trim().split(/\s+/);
          fileType = header[0] || 'custom';
          title = header.slice(1).join(' ') || 'Document';
          instructions = content.substring(pipeIdx + 1).trim();
        }
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: language === 'ar' ? '⏳ جاري إنشاء المستند...' : '⏳ Generating document...' }]);
        const res = await fetch(`${API_URL}/api/ai/generate-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ type: fileType, title, instructions, companyId, language }),
        });
        const data = await res.json();
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { id: Date.now().toString(), role: 'ai', text: data.content || data.error || 'File generation failed', mode: activeMode }; return u; });
        setIsLoading(false); return;
      }

      if (trimmed.startsWith('/read ') || trimmed.startsWith('/اقرأ ')) {
        const instruction = trimmed.replace(/^\/(read|اقرأ)\s+/, '');
        const fileData = selectedFiles.length > 0 ? selectedFiles[0] : null;
        const payload: any = { instruction, companyId, language };
        if (fileData) {
          if (fileData.mimeType?.startsWith('image/')) payload.imageBase64 = fileData.data;
          else payload.textContent = atob(fileData.data);
        }
        const res = await fetch(`${API_URL}/api/ai/read-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: data.analysis || data.error || 'File analysis failed', mode: activeMode }]);
        setSelectedFiles([]);
        setIsLoading(false); return;
      }

      // ─── Mode-specific handling ───────────────────────────────────
      let aiResponse: string | null = null;
      const context = getContext();
      const agentType = getAgentType(context);

      switch (aiContextMode) {
        case 'public': {
          try {
            const imageData = selectedFiles.find(f => f.mimeType.startsWith('image/'))?.data;
            aiResponse = await generatePublicAIResponse(textToSend, language, imageData);
          } catch {
            aiResponse = language === 'ar'
              ? 'خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة مرة أخرى لاحقاً.'
              : 'AI service is currently unavailable. Please try again later.';
          }
          break;
        }

        case 'client': {
          // Client portal mode — limited tenant data, no sensitive information
          const clientContext = [
            'AI Mode: CLIENT PORTAL (restricted access)',
            `User: Client user`,
            `Company: ${company?.name || 'N/A'}`,
            'Access: Invoices, Contracts, Support Tickets, Meetings only',
            'RESTRICTION: Do NOT expose internal employee data, financials, HR, or operational details',
          ].join('\n');
          const clientPrompt = `[CLIENT CONTEXT]\n${clientContext}\n\n[CLIENT QUERY]\n${textToSend}`;
          try {
            aiResponse = await generateRAREAnalysis('support', clientPrompt, {
              ...context, companyId: company?.id || '', mode: activeMode, language,
              files: selectedFiles.map(f => ({ data: f.data, mimeType: f.mimeType })),
            });
          } catch {
            aiResponse = language === 'ar'
              ? 'خدمة الذكاء الاصطناعي غير متاحة حالياً.'
              : 'AI service is currently unavailable.';
          }
          break;
        }

        case 'tenant': {
          // Full internal mode — role+page+module+company context
          const roleContext = [
            `AI Mode: TENANT INTERNAL (full access per role)`,
            `User Role: ${membership?.role || profile?.platformRole || 'unknown'}`,
            `Company: ${company?.name || 'N/A'}`,
            `Current Page: ${context.pageCode}${context.moduleCode ? ' / ' + context.moduleCode : ''}`,
            `Agent Mode: ${activeMode}`,
            `Permissions: ${permRole || 'standard employee access'}`,
            isFounder ? 'Platform Access: FOUNDER (full platform control)' : '',
            isPlatformAdmin ? 'Platform Access: ADMIN (platform-level management)' : '',
          ].filter(Boolean).join('\n');
          const enhancedPrompt = `[CONTEXT]\n${roleContext}\n\n[USER QUERY]\n${textToSend}`;
          try {
            aiResponse = await generateRAREAnalysis(agentType, enhancedPrompt, {
              ...context, companyId: company?.id || '', mode: activeMode, language,
              files: selectedFiles.map(f => ({ data: f.data, mimeType: f.mimeType })),
            });
          } catch {
            aiResponse = language === 'ar'
              ? 'خدمة الذكاء الاصطناعي غير متاحة حالياً.'
              : 'AI service is currently unavailable.';
          }
          break;
        }

        case 'realtime': {
          // Real-time mode — meeting/call context with summarization focus
          const rtContext = [
            'AI Mode: REAL-TIME (meeting/call assistant)',
            `Company: ${company?.name || 'N/A'}`,
            `User: ${membership?.role || 'participant'}`,
            'Capabilities: Summarize, take notes, extract action items, real-time translation',
          ].join('\n');
          const rtPrompt = `[REALTIME CONTEXT]\n${rtContext}\n\n[USER QUERY]\n${textToSend}`;
          try {
            aiResponse = await generateRAREAnalysis('meetings', rtPrompt, {
              ...context, companyId: company?.id || '', mode: activeMode, language,
              files: selectedFiles.map(f => ({ data: f.data, mimeType: f.mimeType })),
            });
          } catch {
            aiResponse = language === 'ar'
              ? 'خدمة الذكاء الاصطناعي غير متاحة حالياً.'
              : 'AI service is currently unavailable.';
          }
          break;
        }
      }

      setMessages(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'ai', text: aiResponse!, mode: activeMode }]);
      setSelectedFiles([]);
    } catch (error) {
      console.error('[RARE] Error:', error);
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9), role: 'ai',
        text: language === 'ar' ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Sorry, an error occurred. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const context = getContext();
  const agentType = getAgentType(context);

  const getAgentLabel = () => {
    const labels: Record<AIContextMode, { en: string; ar: string }> = {
      public: { en: 'Public Assistant', ar: 'المساعد العام' },
      client: { en: 'Client Support', ar: 'دعم العميل' },
      tenant: {
        en: (() => {
          switch (agentType) {
            case 'accounting': return 'Finance Agent';
            case 'hr': return 'HR Agent';
            case 'sales': return 'Sales Agent';
            case 'gm': return 'GM Agent';
            case 'founder': return 'Founder Agent';
            default: return 'Work Assistant';
          }
        })(),
        ar: (() => {
          switch (agentType) {
            case 'accounting': return 'وكيل المالية';
            case 'hr': return 'وكيل الموارد البشرية';
            case 'sales': return 'وكيل المبيعات';
            case 'gm': return 'وكيل المدير العام';
            case 'founder': return 'وكيل المؤسس';
            default: return 'مساعد العمل';
          }
        })(),
      },
      realtime: { en: 'Live Assistant', ar: 'المساعد المباشر' },
    };
    const l = labels[aiContextMode];
    return language === 'ar' ? l.ar : l.en;
  };

  const getModeLabel = () => {
    const labels: Record<AIContextMode, { en: string; ar: string }> = {
      public: { en: 'Public', ar: 'عام' },
      client: { en: 'Client', ar: 'عميل' },
      tenant: { en: 'Internal', ar: 'داخلي' },
      realtime: { en: 'Live', ar: 'مباشر' },
    };
    const l = labels[aiContextMode];
    return language === 'ar' ? l.ar : l.en;
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        initial={{ opacity: 0, x: language === 'ar' ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setIsRAREVisible(!isRAREVisible)}
        className={`fixed bottom-10 ${language === 'ar' ? 'left-0' : 'right-0'} z-[101] p-2 bg-brand text-white ${language === 'ar' ? 'rounded-r-xl rounded-l-none' : 'rounded-l-xl rounded-r-none'} shadow-xl hover:bg-brand-hover transition-all`}
        title={isRAREVisible ? (language === 'ar' ? 'إخفاء RARE' : 'Hide RARE') : (language === 'ar' ? 'إظهار RARE' : 'Show RARE')}
      >
        <Sparkles className={`w-4 h-4 ${isRAREVisible ? 'opacity-100' : 'opacity-50'}`} />
      </motion.button>

      {/* Floating RARE Container */}
      <div className={`fixed bottom-8 ${language === 'ar' ? 'left-8' : 'right-8'} z-[100] flex flex-col items-end gap-4`}>
        <AnimatePresence>
          {/* Greeting Tooltip */}
          {isRAREVisible && !isPanelOpen && (
            <div className="relative group">
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: showGreeting ? 1 : 0, y: showGreeting ? 0 : 10, scale: showGreeting ? 1 : 0.9 }}
                className={`absolute ${language === 'ar' ? 'right-20' : 'right-20'} bottom-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-4 pointer-events-none z-[120] ${showGreeting ? '' : 'hidden'}`}
              >
                <div className="flex items-start gap-3">
                  <img src={ASSETS.RARE_CHARACTER} alt="RARE" className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0" {...IMAGE_PROPS} />
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {language === 'ar'
                      ? 'مرحبًا! أنا رير، مساعدك الذكي. موجود هنا عشان أساعدك!'
                      : 'Hi! I\'m RARE, your AI assistant. I\'m here to help!'}
                  </p>
                </div>
                <div className={`absolute bottom-3 ${language === 'ar' ? '-left-2' : '-right-2'} w-3 h-3 bg-white dark:bg-zinc-900 border-r border-b border-zinc-200 dark:border-zinc-700 rotate-[-45deg]`} />
              </motion.div>

              {/* Main Button */}
              <motion.button
                drag
                dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
                initial={{ scale: 0, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0, rotate: 180 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setIsPanelOpen(true); setShowGreeting(false); }}
                onMouseEnter={() => setShowGreeting(true)}
                onMouseLeave={() => setShowGreeting(false)}
                className="w-16 h-16 rounded-full shadow-2xl overflow-hidden border-4 border-white dark:border-zinc-800 bg-white relative group cursor-grab active:cursor-grabbing"
              >
                <img
                  src="https://lh3.googleusercontent.com/p/AF1QipN2YjssfAFq4DmfPDprA9w13UVqNyEXmnkrGR0i=w243-h406-n-k-no-nu"
                  alt="RARE AI"
                  className="w-full h-full object-cover pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-brand/10 group-hover:bg-transparent transition-colors pointer-events-none" />
                {/* Mode indicator dot */}
                <div className={`absolute -top-1 -right-1 w-5 h-5 ${modeConfig.bgClass} border-2 border-white rounded-full pointer-events-none flex items-center justify-center`}>
                  <ModeIcon className="w-2.5 h-2.5 text-white" />
                </div>
              </motion.button>
            </div>
          )}
        </AnimatePresence>

        {/* RARE Panel */}
        <AnimatePresence>
          {isPanelOpen && (
            <motion.div
              initial={isMobile ? { y: '100%' } : { x: language === 'ar' ? '-100%' : '100%', opacity: 0 }}
              animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
              exit={isMobile ? { y: '100%' } : { x: language === 'ar' ? '-100%' : '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed ${isMobile ? 'bottom-0 left-0 right-0 h-[85vh]' : `top-0 ${language === 'ar' ? 'left-0' : 'right-0'} h-screen ${isMaximized ? 'w-[700px]' : 'w-[450px]'}`} bg-[var(--bg-primary)] shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[110] flex flex-col border-l border-[var(--border-soft)]`}
            >
              {/* Header with mode indicator */}
              <div className={`p-5 ${modeConfig.bgClass} text-white flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden border border-white/30">
                    <img src={ASSETS.RARE_CHARACTER} alt="RARE" className="w-full h-full object-cover" {...IMAGE_PROPS} />
                  </div>
                  <div>
                    <div className="font-bold text-base flex items-center gap-2">
                      RARE AI
                      <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {getModeLabel()}
                      </span>
                    </div>
                    <div className="text-xs opacity-90 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      {getAgentLabel()} • {language === 'ar' ? 'متصل' : 'Connected'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* VoIP call button (realtime mode) */}
                  {aiContextMode === 'realtime' && (
                    <button className="p-2 hover:bg-white/10 rounded-xl transition-all" title="Voice Call">
                      <Phone className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all hidden md:block"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIsPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="px-4 py-2 border-b border-[var(--border-soft)] bg-[var(--surface-2)] flex gap-1 shrink-0">
                {(Object.entries(MODE_CONFIG) as [AIContextMode, typeof MODE_CONFIG['public']][]).map(([m, cfg]) => {
                  const Icon = cfg.icon;
                  const isActive = aiContextMode === m;
                  const isAvailable = m === 'public' || (m === 'client' && location.pathname.includes('/client'))
                    || (m === 'tenant' && !!user) || (m === 'realtime' && (location.pathname.includes('/meetings') || location.pathname.includes('/voice')));
                  return (
                    <div
                      key={m}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isActive ? `${cfg.colorClass} bg-[var(--surface-1)] shadow-sm border border-[var(--border-soft)]` : 'text-[var(--text-muted)]'
                        } ${isAvailable ? '' : 'opacity-30 cursor-not-allowed'}`}
                      title={m.charAt(0).toUpperCase() + m.slice(1)}
                    >
                      <Icon className="w-3 h-3" />
                      {m === 'public' ? (language === 'ar' ? 'عام' : 'Public') :
                        m === 'client' ? (language === 'ar' ? 'عميل' : 'Client') :
                          m === 'tenant' ? (language === 'ar' ? 'داخلي' : 'Internal') :
                            language === 'ar' ? 'مباشر' : 'Live'}
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--surface-2)] flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleSend(action.prompt)}
                    className="whitespace-nowrap px-3 py-1.5 bg-[var(--surface-1)] text-brand rounded-xl text-xs font-bold hover:bg-brand-light transition-all border border-[var(--border-soft)] shadow-sm flex items-center gap-1.5"
                  >
                    {action.id === 'features' && <HelpCircle className="w-3 h-3" />}
                    {action.id === 'pricing' && <TrendingUp className="w-3 h-3" />}
                    {action.id === 'demo' && <Sparkles className="w-3 h-3" />}
                    {action.id === 'faq' && <MessageSquare className="w-3 h-3" />}
                    {action.id === 'invoices' && <FileText className="w-3 h-3" />}
                    {action.id === 'contracts' && <FileCheck className="w-3 h-3" />}
                    {action.id === 'tickets' && <Headphones className="w-3 h-3" />}
                    {action.id === 'meetings' && <CalendarDays className="w-3 h-3" />}
                    {action.id === 'explain' && <Info className="w-3 h-3" />}
                    {action.id === 'kpis' && <BarChart2 className="w-3 h-3" />}
                    {action.id === 'approvals' && <ClipboardList className="w-3 h-3" />}
                    {action.id === 'analyze' && <BarChart2 className="w-3 h-3" />}
                    {action.id === 'summarize' && <FileText className="w-3 h-3" />}
                    {action.id === 'actions' && <ClipboardList className="w-3 h-3" />}
                    {action.id === 'notes' && <FileText className="w-3 h-3" />}
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth">
                {messages.map((msg) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                      ? `${modeConfig.bgClass} text-white rounded-tr-none shadow-lg`
                      : 'bg-[var(--surface-1)] border border-[var(--border-soft)] rounded-tl-none shadow-md text-[var(--text-primary)]'
                      }`}>
                      <div className="markdown-body"><Markdown>{msg.text}</Markdown></div>
                      {msg.role === 'ai' && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-700 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1 opacity-40">
                            <ModeIcon className="w-3 h-3" />
                            RARE v3 • {getModeLabel()}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => speakResponse(msg.text)}
                              className={`p-1.5 rounded-lg transition-all ${isSpeaking ? 'bg-brand/10 text-brand animate-pulse' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-brand'}`}
                              title={language === 'ar' ? 'استمع' : 'Listen'}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text);
                                const btn = document.getElementById(`copy-${msg.id}`);
                                if (btn) { btn.textContent = language === 'ar' ? '✓' : '✓'; setTimeout(() => { btn.textContent = language === 'ar' ? 'نسخ' : 'Copy'; }, 1500); }
                              }}
                              className="p-1.5 px-2.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-brand transition-all"
                              title={language === 'ar' ? 'نسخ' : 'Copy'}
                            >
                              <span id={`copy-${msg.id}`}>{language === 'ar' ? 'نسخ' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--surface-1)] border border-[var(--border-soft)] p-4 rounded-2xl rounded-tl-none flex flex-col gap-2 shadow-md">
                      <div className="flex gap-1.5">
                        <div className={`w-2 h-2 ${modeConfig.bgClass} rounded-full animate-bounce`} />
                        <div className={`w-2 h-2 ${modeConfig.bgClass} rounded-full animate-bounce [animation-delay:0.2s]`} />
                        <div className={`w-2 h-2 ${modeConfig.bgClass} rounded-full animate-bounce [animation-delay:0.4s]`} />
                      </div>
                      <span className="text-[10px] text-gray-400 animate-pulse uppercase font-bold tracking-widest">{translate('thinking')}</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-[var(--surface-1)] border-t border-[var(--border-soft)] shrink-0">
                {selectedFiles.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-brand-light text-brand px-3 py-1.5 rounded-xl text-xs font-bold border border-brand-muted">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="max-w-[100px] truncate">{file.name}</span>
                        <button onClick={() => removeFile(idx)} className="hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-all" title="Upload">
                    <Upload className="w-5 h-5" />
                  </button>
                  <button onClick={toggleListening} className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`} title="Voice">
                    <Mic className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={translate('ask_rare')}
                      className="w-full bg-[var(--surface-2)] border border-[var(--border-soft)] p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand/50 text-sm text-[var(--text-primary)] pr-11"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-2 ${modeConfig.bgClass} text-white rounded-lg hover:opacity-90 transition-all shadow-lg disabled:opacity-50`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setFastMode(!fastMode)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${fastMode ? 'bg-brand/10 text-brand border-brand/30' : 'border-[var(--border-soft)] text-[var(--text-muted)]'}`}
                  >
                    <Zap className="w-3 h-3" /> Fast
                  </button>
                  <button
                    onClick={() => setWebSearch(!webSearch)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${webSearch ? 'bg-brand/10 text-brand border-brand/30' : 'border-[var(--border-soft)] text-[var(--text-muted)]'}`}
                  >
                    <MoreHorizontal className="w-3 h-3" /> Web
                  </button>
                  {aiContextMode === 'realtime' && (
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-300 bg-orange-50 text-orange-600">
                      <Phone className="w-3 h-3" /> {language === 'ar' ? 'اتصال' : 'Call'}
                    </button>
                  )}
                </div>

                {/* Status Bar */}
                <div className={`mt-3 flex items-center justify-between p-2.5 rounded-lg border ${aiContextMode === 'public' ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' :
                  aiContextMode === 'client' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800' :
                    aiContextMode === 'realtime' ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800' :
                      'bg-brand-light border-brand-muted'
                  }`}>
                  <div className="flex items-center gap-2">
                    <ModeIcon className={`w-4 h-4 ${modeConfig.colorClass}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${modeConfig.colorClass}`}>
                      {getModeLabel()} • {messages.filter(m => m.role === 'user').length} {language === 'ar' ? 'استعلام' : 'queries'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${modeConfig.colorClass}`}>
                    {membership?.role || profile?.platformRole || 'visitor'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
