import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Send, Mic, Sparkles,
  HelpCircle, BarChart2,
  Zap, FileText, Maximize2, Minimize2,
  MoreHorizontal, MessageSquare, Info,
  CheckCircle2, AlertCircle, History, Upload
} from 'lucide-react';
import Markdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import { generateRAREAnalysis, RAREAgentType } from '../services/geminiService';
import { RAREMode, RAREContext, RAREQuickAction, Language, ThemeMode } from '../types';
import { useTheme } from './ThemeProvider';
import { usePermissions } from '../hooks/usePermissions';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';

interface PageContext {
  pageType: 'public' | 'protected';
  pageKey: string;
  companyId?: string;
  role?: string;
  modules?: string[];
}

interface FloatingActionsProps {
  user?: any;
  pageContext?: PageContext;
}

export default function FloatingActions({ user, pageContext }: FloatingActionsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const showBack = location.pathname !== '/' && location.pathname !== '';
  const { mode: themeMode } = useTheme();
  const { t: translate, i18n } = useTranslation();
  const { profile } = useAuth();
  const { company, membership } = useCompany();
  const { permissions, isFounder, isPlatformAdmin } = usePermissions();
  const language = i18n.language as Language;
  const mode = themeMode as ThemeMode;

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isRAREVisible, setIsRAREVisible] = useState(true);
  const [activeMode, setActiveMode] = useState<RAREMode>('help');
  const [messages, setMessages] = useState<{ id: string, role: 'user' | 'ai', text: string, mode?: RAREMode }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isListening, setIsListening] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ name: string, data: string, mimeType: string }[]>([]);
  const [fastMode, setFastMode] = useState(false);
  const [webSearch, setWebSearch] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'ar' ? 'متصفحك لا يدعم التعرف على الصوت.' : 'Your browser does not support speech recognition.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + ' ' + transcript);
    };

    recognition.start();
  };

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

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { role: 'ai', text: language === 'ar' ? 'مرحبا! أنا RARE، مساعدك الذكي في ZIEN. كيف يمكنني مساعدتك اليوم؟' : 'Hello! I am RARE, your ZIEN intelligence assistant. How can I help you today?' }
      ]);
    }
  }, [language]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Context Detection - Role-aware
  const getContext = (): RAREContext => {
    const path = window.location.pathname;
    let pageCode = 'landing';
    let moduleCode = undefined;

    if (path.includes('/portal')) {
      pageCode = 'employee_portal';
    } else if (path.includes('/owner')) {
      pageCode = 'owner_dashboard';
    } else if (path.includes('/client')) {
      pageCode = 'client_portal';
    } else if (path.includes('/onboarding') || path.includes('/register')) {
      pageCode = 'onboarding';
    } else if (path.includes('/dashboard')) {
      pageCode = 'dashboard';
      // Detect active module from path
      const moduleMatch = path.match(/\/dashboard\/([^/]+)/);
      if (moduleMatch) {
        moduleCode = moduleMatch[1];
        pageCode = moduleMatch[1];
      }
    }

    // Use real role from membership/profile instead of deprecated UserRole
    const companyRole = membership?.role || 'employee';
    const platformRole = profile?.platformRole || 'user';
    const effectiveRole = isFounder ? 'founder' : isPlatformAdmin ? 'platform_admin' : companyRole;

    return {
      pageCode,
      moduleCode,
      userRole: effectiveRole as any,
      companyName: company?.name || 'ZIEN Platform',
      language,
      theme: mode,
    };
  };

  const getAgentType = (context: RAREContext): RAREAgentType => {
    if (isFounder || isPlatformAdmin) return 'founder';

    const path = window.location.pathname;
    if (path.includes('accounting')) return 'accounting';
    if (path.includes('hr')) return 'hr';
    if (path.includes('sales') || path.includes('crm')) return 'sales';
    if (path.includes('logistics')) return 'fleet';
    if (path.includes('projects')) return 'pm';
    if (path.includes('store')) return 'sales';

    const role = membership?.role || '';
    if (role === 'company_gm' || role === 'assistant_gm') return 'gm';
    if (role === 'executive_secretary') return 'secretary';
    if (role === 'accountant') return 'accounting';
    if (role === 'hr_manager') return 'hr';

    return 'secretary';
  };

  const getQuickActions = (mode: RAREMode, agentType: RAREAgentType): RAREQuickAction[] => {
    const actions: RAREQuickAction[] = [];

    actions.push({ id: 'explain', label: translate('explain_page'), mode: 'help', prompt: 'Can you explain what I can do on this page?' });

    if (agentType === 'accounting') {
      actions.push({ id: 'analyze', label: translate('analyze_data'), mode: 'analyze', prompt: 'Analyze the current financial data.' });
      actions.push({ id: 'invoice', label: translate('create_invoice'), mode: 'act', prompt: 'Help me draft a new invoice.' });
    } else if (agentType === 'hr') {
      actions.push({ id: 'analyze', label: translate('analyze_data'), mode: 'analyze', prompt: 'Analyze employee attendance and performance.' });
      actions.push({ id: 'employee', label: language === 'ar' ? 'إضافة موظف' : 'Add Employee', mode: 'act', prompt: 'I want to add a new employee.' });
    } else {
      actions.push({ id: 'analyze', label: translate('analyze_data'), mode: 'analyze', prompt: 'Analyze the current page data.' });
    }

    return actions;
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() && selectedFiles.length === 0) return;

    setMessages(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'user', text: textToSend, mode: activeMode }]);
    setInput('');
    setIsLoading(true);

    const context = getContext();
    const agentType = getAgentType(context);

    // Build role-aware system context for the AI
    const roleContext = [
      `User Role: ${membership?.role || profile?.platformRole || 'unknown'}`,
      `Company: ${company?.name || 'N/A'}`,
      `Current Page: ${context.pageCode}${context.moduleCode ? ' / ' + context.moduleCode : ''}`,
      `Agent Mode: ${activeMode}`,
      `Permissions: ${permissions.length > 0 ? permissions.slice(0, 10).join(', ') : 'standard employee access'}`,
      isFounder ? 'Platform Access: FOUNDER (full platform control)' : '',
      isPlatformAdmin ? 'Platform Access: ADMIN (platform-level management)' : '',
    ].filter(Boolean).join('\n');

    const enhancedPrompt = `[CONTEXT]\n${roleContext}\n\n[USER QUERY]\n${textToSend}`;

    try {
      const response = await generateRAREAnalysis(agentType, enhancedPrompt, {
        ...context,
        companyId: company?.id || '',
        mode: activeMode,
        files: selectedFiles.map(f => ({ data: f.data, mimeType: f.mimeType }))
      });

      setMessages(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'ai', text: response, mode: activeMode }]);
      setSelectedFiles([]);
    } catch (error) {
      console.error('[RARE] AI response error:', error);
      const errMsg = error instanceof Error ? error.message : '';
      let fallback: string;
      if (errMsg.includes('Not authenticated') || errMsg.includes('401')) {
        fallback = language === 'ar'
          ? 'يرجى تسجيل الدخول أولاً لاستخدام الذكاء الاصطناعي RARE.'
          : 'Please log in first to use RARE AI.';
      } else {
        fallback = language === 'ar'
          ? `عذراً، حدث خطأ: ${errMsg || 'خطأ في خدمة الذكاء الاصطناعي'}. يرجى المحاولة مرة أخرى.`
          : `Sorry, an error occurred: ${errMsg || 'AI service error'}. Please try again.`;
      }
      setMessages(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'ai', text: fallback, mode: activeMode }]);
    } finally {
      setIsLoading(false);
    }
  };

  const context = getContext();
  const agentType = getAgentType(context);
  const quickActions = getQuickActions(activeMode, agentType);

  const getAgentLabel = () => {
    switch (agentType) {
      case 'accounting': return translate('rare_accounting');
      case 'hr': return translate('rare_hr');
      case 'sales': return translate('rare_crm');
      case 'gm': return translate('rare_gm');
      case 'founder': return translate('rare_founder');
      default: return translate('rare_assistant');
    }
  };

  return (
    <>
      {/* Global Back Button */}
      <AnimatePresence>
        {showBack && !isPanelOpen && (
          <motion.button
            initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
            onClick={() => navigate('/')}
            className={`fixed top-6 ${language === 'ar' ? 'right-6' : 'left-6'} z-[100] p-3 glass-card rounded-full hover:bg-white/20 transition-all shadow-xl border-white/20 group`}
          >
            <History className={`w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Toggle Button for RARE Visibility */}
      <motion.button
        initial={{ opacity: 0, x: language === 'ar' ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setIsRAREVisible(!isRAREVisible)}
        className={`fixed bottom-10 ${language === 'ar' ? 'left-0' : 'right-0'} z-[101] p-2 bg-brand text-white rounded-l-none rounded-r-xl ${language === 'ar' ? 'rounded-r-xl rounded-l-none' : 'rounded-l-xl rounded-r-none'} shadow-xl hover:bg-brand-hover transition-all group`}
        title={isRAREVisible ? translate('hide_rare') : translate('show_rare')}
      >
        <Sparkles className={`w-4 h-4 ${isRAREVisible ? 'opacity-100' : 'opacity-50'}`} />
      </motion.button>

      {/* Floating RARE Button Container */}
      <div
        className={`fixed bottom-8 ${language === 'ar' ? 'left-8' : 'right-8'} z-[100] flex flex-col items-end gap-4`}
      >
        <AnimatePresence>
          {isRAREVisible && showTooltip && !isPanelOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute bottom-full mb-4 ${language === 'ar' ? 'left-0' : 'right-0'} whitespace-nowrap`}
            >
              <div className="bg-[var(--surface-1)] text-brand text-xs font-bold px-4 py-2 rounded-2xl shadow-2xl border border-[var(--border-soft)] flex items-center gap-2">
                <span className="animate-bounce font-bold">R</span>
                {translate('rare_tooltip')}
                <div className={`absolute -bottom-1 ${language === 'ar' ? 'left-4' : 'right-4'} w-2 h-2 bg-[var(--surface-1)] border-r border-b border-[var(--border-soft)] rotate-45`} />
              </div>
            </motion.div>
          )}

          {isRAREVisible && !isPanelOpen && (
            <motion.button
              drag
              dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 180 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPanelOpen(true)}
              className="w-16 h-16 rounded-full shadow-2xl overflow-hidden border-4 border-white dark:border-zinc-800 bg-white relative group cursor-grab active:cursor-grabbing"
            >
              <img
                src="https://lh3.googleusercontent.com/p/AF1QipN2YjssfAFq4DmfPDprA9w13UVqNyEXmnkrGR0i=w243-h406-n-k-no-nu"
                alt="RARE AI"
                className="w-full h-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-brand/10 group-hover:bg-transparent transition-colors pointer-events-none" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full pointer-events-none" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* RARE Assistant Panel / Side Panel */}
        <AnimatePresence>
          {isPanelOpen && (
            <motion.div
              initial={isMobile ? { y: '100%' } : { x: language === 'ar' ? '-100%' : '100%', opacity: 0 }}
              animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
              exit={isMobile ? { y: '100%' } : { x: language === 'ar' ? '-100%' : '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed ${isMobile ? 'bottom-0 left-0 right-0 h-[85vh]' : `top-0 ${language === 'ar' ? 'left-0' : 'right-0'} h-screen w-[450px]`} bg-[var(--bg-primary)] shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[110] flex flex-col border-l border-[var(--border-soft)]`}
            >
              {/* Header */}
              <div className="p-6 bg-brand text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden border border-white/30">
                    <img src={ASSETS.RARE_CHARACTER} alt="RARE" className="w-full h-full object-cover" {...IMAGE_PROPS} />
                  </div>
                  <div>
                    <div className="font-bold text-lg flex items-center gap-2">
                      {translate('rare_assistant')}
                    </div>
                    <div className="text-xs opacity-90 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      {getAgentLabel()} • {translate('connected')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all hidden md:block"
                    title={translate('maximize')}
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsPanelOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="px-6 py-4 border-b border-[var(--border-soft)] bg-[var(--surface-2)] flex gap-3 overflow-x-auto no-scrollbar shrink-0">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleSend(action.prompt)}
                    className="whitespace-nowrap px-4 py-2 bg-[var(--surface-1)] text-brand rounded-xl text-xs font-bold hover:bg-brand-light transition-all border border-[var(--border-soft)] shadow-sm flex items-center gap-2"
                  >
                    {action.id === 'explain' && <Info className="w-3.5 h-3.5" />}
                    {action.id === 'analyze' && <BarChart2 className="w-3.5 h-3.5" />}
                    {action.id === 'invoice' && <FileText className="w-3.5 h-3.5" />}
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {messages.map((msg, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user'
                      ? 'bg-brand text-white rounded-tr-none shadow-xl'
                      : 'bg-[var(--surface-1)] border border-[var(--border-soft)] rounded-tl-none shadow-md text-[var(--text-primary)]'
                      }`}>
                      <div className="markdown-body">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                      {msg.role === 'ai' && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] opacity-50 font-bold uppercase tracking-wider">
                          <span>RARE Engine v2.5</span>
                          <div className="flex gap-2">
                            <button className="hover:text-brand">Copy</button>
                            <button className="hover:text-brand">Share</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[var(--border-soft)] p-5 rounded-3xl rounded-tl-none flex flex-col gap-3 shadow-md">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-brand rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-brand rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-brand rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[10px] text-gray-400 animate-pulse uppercase font-bold tracking-widest">{translate('thinking')}</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-[var(--border-soft)] shrink-0">
                {selectedFiles.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-brand-light text-brand px-3 py-1.5 rounded-xl text-xs font-bold border border-brand-muted">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="max-w-[100px] truncate">{file.name}</span>
                        <button onClick={() => removeFile(idx)} className="hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-2xl text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-all"
                    title="Upload Files"
                  >
                    <Upload className="w-6 h-6" />
                  </button>
                  <button
                    onClick={toggleListening}
                    className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}
                    title="Voice Input"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={translate('ask_rare')}
                      className="w-full bg-[var(--surface-2)] border border-[var(--border-soft)] p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand/50 text-sm text-[var(--text-primary)] pr-12"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand text-white rounded-xl hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* AI Tools Toggles */}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => setFastMode(!fastMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${fastMode ? 'bg-brand/10 text-brand border-brand/30' : 'border-[var(--border-soft)] text-[var(--text-muted)] hover:border-brand/30'}`}
                  >
                    <Zap className="w-3 h-3" />
                    Fast
                  </button>
                  <button
                    onClick={() => setWebSearch(!webSearch)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${webSearch ? 'bg-brand/10 text-brand border-brand/30' : 'border-[var(--border-soft)] text-[var(--text-muted)] hover:border-brand/30'}`}
                  >
                    <MoreHorizontal className="w-3 h-3" />
                    Web
                  </button>
                </div>

                {/* Usage Indicator */}
                <div className="mt-4 flex items-center justify-between p-3 bg-brand-light rounded-xl border border-brand-muted">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-brand" />
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
                      {translate('usage')}: {messages.filter(m => m.role === 'user').length} {translate('queries')}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-brand uppercase tracking-widest">
                    {membership?.role || profile?.platformRole || 'user'}
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
