import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Mic, Search, Globe, UserCircle, FileText, Settings, Volume2, StopCircle, UploadCloud } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { askRARE } from '../services/rareService';

export function FloatingRARE() {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useTheme();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: language === 'ar' ? 'مرحباً! أنا RARE، مساعدك الذكي في ZIEN. كيف يمكنني مساعدتك في إدارة عملك اليوم؟' : 'Hello! I am RARE, your ZIEN AI assistant. How can I help you manage your business today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeRole, setActiveRole] = useState('gm');
  const [activeContext, setActiveContext] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const roles = [
    { id: 'gm', name: language === 'ar' ? 'المدير العام' : 'General Manager', icon: UserCircle },
    { id: 'hr', name: language === 'ar' ? 'مدير الموارد البشرية' : 'HR Manager', icon: UserCircle },
    { id: 'sales', name: language === 'ar' ? 'مدير المبيعات' : 'Sales Manager', icon: UserCircle },
    { id: 'finance', name: language === 'ar' ? 'المدير المالي' : 'Finance Manager', icon: UserCircle },
  ];

  const contexts = [
    { id: 'q3_report', name: language === 'ar' ? 'تحليل تقرير الربع الثالث' : 'Analyze Q3 Report' },
    { id: 'employee_contracts', name: language === 'ar' ? 'مراجعة عقود الموظفين' : 'Review Employee Contracts' },
    { id: 'sales_forecast', name: language === 'ar' ? 'توقعات المبيعات' : 'Sales Forecast' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Voice Command Parsing
    const lowerText = text.toLowerCase();
    let commandExecuted = false;

    if (lowerText.includes('dashboard') || lowerText.includes('لوحة القيادة')) {
      navigate('/portal');
      commandExecuted = true;
    } else if (lowerText.includes('settings') || lowerText.includes('الاعدادات')) {
      navigate('/portal/settings');
      commandExecuted = true;
    } else if (lowerText.includes('academy') || lowerText.includes('الاكاديمية')) {
      navigate('/academy');
      commandExecuted = true;
    } else if (lowerText.includes('help') || lowerText.includes('المساعدة')) {
      navigate('/help');
      commandExecuted = true;
    }

    if (commandExecuted) {
      setMessages(prev => [...prev, { role: 'assistant', content: language === 'ar' ? 'جاري تنفيذ الأمر...' : 'Executing command...' }]);
      setIsTyping(false);
      return;
    }

    try {
      const contextData = {
        role: roles.find(r => r.id === activeRole)?.name,
        activeContext: activeContext ? contexts.find(c => c.id === activeContext)?.name : 'General',
        language: language
      };
      const response = await askRARE(text, contextData);
      setMessages(prev => [...prev, { role: 'assistant', content: response || '' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: language === 'ar' ? 'عذراً، واجهت خطأ.' : "I'm sorry, I encountered an error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoiceCommand = () => {
    if (isListening) {
      setIsListening(false);
      // If we had a recognition instance, we would stop it here
      // For now, we'll just rely on the onend event or manual stop
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          handleSend(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        alert(language === 'ar' ? 'متصفحك لا يدعم التعرف على الصوت.' : 'Your browser does not support speech recognition.');
      }
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 w-[400px] h-[600px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                    R
                  </div>
                  <div>
                    <h3 className="font-bold text-sm bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">RARE AI Agent</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{language === 'ar' ? 'معزول ومخصص للصلاحيات' : 'Tenant Isolated • Role Aware'}</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              {/* Role & Context Selectors */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <select 
                  value={activeRole}
                  onChange={(e) => setActiveRole(e.target.value)}
                  className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select 
                  value={activeContext || ''}
                  onChange={(e) => setActiveContext(e.target.value || null)}
                  className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">{language === 'ar' ? 'السياق العام' : 'General Context'}</option>
                  {contexts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/50">
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm border border-zinc-100 dark:border-zinc-700'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-sm border border-zinc-100 dark:border-zinc-700 flex gap-1 items-center shadow-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              {isListening && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="mb-3 flex items-center justify-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg"
                >
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  <span className="text-xs font-bold">{language === 'ar' ? 'جاري الاستماع...' : 'Listening...'}</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ height: ['4px', '12px', '4px'] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                        className="w-1 bg-blue-500 rounded-full"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-2 border border-transparent focus-within:border-blue-500/50 transition-colors">
                <button 
                  onClick={toggleVoiceCommand}
                  className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-blue-500'}`}
                >
                  {isListening ? <StopCircle size={18} /> : <Mic size={18} />}
                </button>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={language === 'ar' ? 'اسأل RARE أي شيء...' : 'Ask RARE anything...'} 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none px-2"
                  disabled={isListening}
                />
                <button 
                  onClick={() => handleSend()} 
                  disabled={!input.trim() || isListening}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
              
              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex gap-3">
                  <button className="text-[10px] text-zinc-500 flex items-center gap-1 hover:text-blue-500 transition-colors font-medium">
                    <Globe size={12} /> {language === 'ar' ? 'بحث الويب' : 'Web Search'}
                  </button>
                  <button className="text-[10px] text-zinc-500 flex items-center gap-1 hover:text-purple-500 transition-colors font-medium">
                    <Search size={12} /> {language === 'ar' ? 'تحليل عميق' : 'Deep Analytics'}
                  </button>
                </div>
                <button className="text-[10px] text-zinc-500 flex items-center gap-1 hover:text-green-500 transition-colors font-medium" title={language === 'ar' ? 'فهم المحتوى' : 'Content Understanding'}>
                  <UploadCloud size={12} /> {language === 'ar' ? 'رفع ملف' : 'Upload File'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full shadow-2xl overflow-hidden border-4 border-white dark:border-zinc-800 bg-white relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <img 
          src="https://lh3.googleusercontent.com/p/AF1QipN2YjssfAFq4DmfPDprA9w13UVqNyEXmnkrGR0i=w243-h406-n-k-no-nu" 
          alt="RARE AI" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Notification Dot */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-zinc-800 rounded-full animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
