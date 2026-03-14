import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Terminal, Send, ChevronDown, ChevronUp, Mic, Zap, X } from 'lucide-react';
import { supabase } from '../../services/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

interface Message {
    role: 'user' | 'ai';
    text: string;
    ts: number;
}

interface AICommandBarProps {
    sectionContext?: string;
}

// ─── Slash commands ─────────────────────────────────────────────────────────

const SLASH_COMMANDS = [
    { cmd: '/status', label: 'Platform Status', prompt: 'Give me a full platform status report including workers, DB, and integrations.' },
    { cmd: '/errors', label: 'Error Analysis', prompt: 'Analyze recent platform errors, patterns, and suggest fixes.' },
    { cmd: '/revenue', label: 'Revenue Insights', prompt: 'Show revenue trends, MRR breakdown, and growth recommendations.' },
    { cmd: '/security', label: 'Security Audit', prompt: 'Run a security audit: RLS status, auth issues, and vulnerability scan.' },
    { cmd: '/tenants', label: 'Tenant Overview', prompt: 'List all tenants with their status, plan, and recent activity.' },
    { cmd: '/health', label: 'Health Check', prompt: 'Run all health checks and report system status across all services.' },
    { cmd: '/ai', label: 'AI Usage', prompt: 'Show AI usage statistics, costs, error rates, and model performance.' },
    { cmd: '/billing', label: 'Billing Status', prompt: 'Show overdue invoices, failed payments, and billing anomalies.' },
    { cmd: '/deploy', label: 'Deploy Status', prompt: 'Check worker deployment status, recent deploys, and rollback options.' },
    { cmd: '/help', label: 'All Commands', prompt: 'List all available slash commands and their descriptions.' },
] as const;

// ─── AI Command Bar (Layer 9) ───────────────────────────────────────────────

export default function AICommandBar({ sectionContext = 'general' }: AICommandBarProps) {
    const { t, i18n } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [listening, setListening] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (expanded) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, expanded]);

    // Load persisted history per section
    useEffect(() => {
        const stored = localStorage.getItem(`founder_cmd_${sectionContext}`);
        if (stored) {
            try { setMessages(JSON.parse(stored)); } catch { /* ignore */ }
        }
    }, [sectionContext]);

    // Persist messages
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(`founder_cmd_${sectionContext}`, JSON.stringify(messages.slice(-50)));
        }
    }, [messages, sectionContext]);

    // Filter slash suggestions while typing
    const filteredCommands = input.startsWith('/')
        ? SLASH_COMMANDS.filter(c => c.cmd.startsWith(input.toLowerCase()))
        : [];

    const sendMessage = useCallback(async (text?: string) => {
        const raw = (text || input).trim();
        if (!raw || sending) return;

        // Resolve slash commands
        let prompt = raw;
        const slashMatch = SLASH_COMMANDS.find(c => c.cmd === raw.split(' ')[0]);
        if (slashMatch) {
            const extra = raw.slice(slashMatch.cmd.length).trim();
            prompt = extra ? `${slashMatch.prompt}\nAdditional context: ${extra}` : slashMatch.prompt;
        }

        setInput('');
        setShowSuggestions(false);
        setMessages(prev => [...prev, { role: 'user', text: raw, ts: Date.now() }]);
        setSending(true);

        // Auto-expand on send
        if (!expanded) setExpanded(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('Not authenticated');

            const res = await fetch(`${API_URL}/api/ai/rare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    prompt: `[Context: Founder OS / ${sectionContext}]\n${prompt}`,
                    mode: 'analyze',
                    agentType: 'gm',
                    language: i18n.language || 'en',
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'ai', text: data.response || 'No response', ts: Date.now() }]);
        } catch (err: any) {
            setMessages(prev => [...prev, { role: 'ai', text: `Error: ${err.message}`, ts: Date.now() }]);
        } finally {
            setSending(false);
        }
    }, [input, sending, sectionContext, i18n.language, expanded]);

    const toggleVoice = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;

        if (listening) {
            recognitionRef.current?.stop();
            setListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
        recognition.onresult = (event: any) => {
            setInput(prev => prev + ' ' + event.results[0][0].transcript);
            setListening(false);
        };
        recognition.onerror = () => setListening(false);
        recognition.onend = () => setListening(false);
        recognitionRef.current = recognition;
        recognition.start();
        setListening(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);
        setShowSuggestions(val.startsWith('/') && val.length > 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
        if (e.key === 'Escape') {
            setShowSuggestions(false);
            if (expanded) setExpanded(false);
        }
        // Tab completion for slash commands
        if (e.key === 'Tab' && filteredCommands.length > 0) {
            e.preventDefault();
            setInput(filteredCommands[0].cmd + ' ');
            setShowSuggestions(false);
        }
    };

    const clearHistory = () => {
        setMessages([]);
        localStorage.removeItem(`founder_cmd_${sectionContext}`);
    };

    return (
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm relative">
            {/* Command bar - always visible */}
            <div className="flex items-center gap-2 px-4 md:px-8 h-14">
                {/* AI indicator */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${sending ? 'bg-amber-500 animate-pulse' : 'bg-blue-600'}`}>
                        <Terminal size={13} className="text-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hidden sm:block">
                        {sectionContext}
                    </span>
                </div>

                {/* Input field */}
                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => { if (input.startsWith('/')) setShowSuggestions(true); }}
                        placeholder={t('ai_command_placeholder') || 'Type a command or /slash...'}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-0 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-400"
                    />

                    {/* Slash command suggestions dropdown */}
                    {showSuggestions && filteredCommands.length > 0 && (
                        <div className="absolute left-0 top-full mt-1 w-72 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 overflow-hidden">
                            {filteredCommands.map(c => (
                                <button
                                    key={c.cmd}
                                    onClick={() => { setInput(c.cmd + ' '); setShowSuggestions(false); inputRef.current?.focus(); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                                >
                                    <span className="text-xs font-mono font-bold text-blue-600">{c.cmd}</span>
                                    <span className="text-[10px] text-zinc-500">{c.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={toggleVoice}
                        className={`p-2 rounded-lg transition-colors ${listening ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                        <Mic size={14} />
                    </button>
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || sending}
                        className="p-2 bg-blue-600 text-white rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
                    >
                        <Send size={14} />
                    </button>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {/* Expandable chat panel */}
            {expanded && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 max-h-[400px] flex flex-col">
                    {/* Chat header */}
                    <div className="flex items-center justify-between px-4 md:px-8 py-2 bg-zinc-50/50 dark:bg-zinc-950/50">
                        <div className="flex items-center gap-2">
                            <Zap size={12} className="text-blue-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                {t('ai_conversation') || 'AI Conversation'} ({messages.length})
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {messages.length > 0 && (
                                <button onClick={clearHistory} className="text-[10px] font-bold text-zinc-400 hover:text-red-500 px-2 py-1 rounded transition-colors">
                                    {t('clear') || 'Clear'}
                                </button>
                            )}
                            <button onClick={() => setExpanded(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded">
                                <X size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-3 space-y-3 max-h-[340px]">
                        {messages.length === 0 && (
                            <div className="py-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">{t('quick_commands') || 'Quick commands'}</p>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {SLASH_COMMANDS.slice(0, 5).map(c => (
                                        <button
                                            key={c.cmd}
                                            onClick={() => sendMessage(c.cmd)}
                                            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-left"
                                        >
                                            <span className="font-mono text-blue-600">{c.cmd}</span>
                                            <span className="block text-zinc-500 mt-0.5">{c.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}

                        {sending && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-2xl">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>
            )}
        </div>
    );
}
