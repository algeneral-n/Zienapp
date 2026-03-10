import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Search, ChevronDown, ChevronUp, BookOpen, MessageCircle,
    Mail, Phone, Loader2, HelpCircle, FileText, ExternalLink,
    Plus, X, Send, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface HelpArticle {
    id: string;
    title: string;
    body: string;
    category_id: string | null;
    tags: string[];
    is_published: boolean;
    view_count: number;
    created_at: string;
}

interface HelpCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    sort_order: number;
}

export default function HelpCenter() {
    const { language } = useTheme();
    const { user } = useAuth();
    const [articles, setArticles] = useState<HelpArticle[]>([]);
    const [categories, setCategories] = useState<HelpCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCat, setActiveCat] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'articles' | 'tickets'>('articles');
    const [tickets, setTickets] = useState<any[]>([]);
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [ticketForm, setTicketForm] = useState({ subject: '', description: '', priority: 'medium' });
    const [ticketSaving, setTicketSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [{ data: arts }, { data: cats }, { data: tix }] = await Promise.all([
                    supabase.from('help_articles').select('*').eq('is_published', true).order('created_at', { ascending: false }),
                    supabase.from('help_categories').select('*').order('sort_order'),
                    user?.id ? supabase.from('support_tickets').select('*').eq('submitted_by', user.id).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
                ]);
                setArticles(arts || []);
                setCategories(cats || []);
                setTickets(tix || []);
            } catch { /* ignore */ } finally { setLoading(false); }
        })();
    }, [user?.id]);

    const createTicket = async () => {
        if (!user?.id || !ticketForm.subject) return;
        setTicketSaving(true);
        const { data, error } = await supabase.from('support_tickets').insert({
            submitted_by: user.id,
            title: ticketForm.subject,
            description: ticketForm.description || null,
            priority: ticketForm.priority,
            status: 'open',
        }).select().single();
        setTicketSaving(false);
        if (!error && data) {
            setTickets(prev => [data, ...prev]);
            setShowTicketForm(false);
            setTicketForm({ subject: '', description: '', priority: 'medium' });
        }
    };

    const filtered = articles.filter(a => {
        const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.body?.toLowerCase().includes(search.toLowerCase());
        const matchCat = !activeCat || a.category_id === activeCat;
        return matchSearch && matchCat;
    });

    // Track view on expand
    const handleExpand = async (id: string) => {
        const newId = expandedId === id ? null : id;
        setExpandedId(newId);
        if (newId) {
            await supabase.from('help_articles').update({ view_count: (articles.find(a => a.id === id)?.view_count || 0) + 1 }).eq('id', id);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-black uppercase tracking-tighter">{language === 'ar' ? 'مركز المساعدة' : 'Help Center'}</h1>
                <p className="text-sm text-zinc-500 mt-2">{language === 'ar' ? 'ابحث عن إجابات أسئلتك أو تواصل مع فريق الدعم' : 'Find answers to your questions or reach out to our support team'}</p>
            </div>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                    type="text"
                    placeholder={language === 'ar' ? 'ابحث في المقالات...' : 'Search articles...'}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 justify-center">
                <button onClick={() => setActiveView('articles')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeView === 'articles' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    <FileText size={14} className="inline mr-1" />{language === 'ar' ? 'المقالات' : 'Articles'}
                </button>
                <button onClick={() => setActiveView('tickets')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeView === 'tickets' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    <MessageCircle size={14} className="inline mr-1" />{language === 'ar' ? 'تذاكر الدعم' : 'My Tickets'} {tickets.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{tickets.length}</span>}
                </button>
            </div>

            {activeView === 'articles' && <>
                {/* Categories */}
                {categories.length > 0 && (
                    <div className="flex gap-2 flex-wrap justify-center">
                        <button
                            onClick={() => setActiveCat(null)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!activeCat ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}
                        >
                            {language === 'ar' ? 'الكل' : 'All'}
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCat(cat.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCat === cat.id ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Articles Accordion */}
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16 text-zinc-400">
                            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="font-bold">{language === 'ar' ? 'لم يتم العثور على مقالات' : 'No articles found'}</p>
                            <p className="text-xs mt-1">{language === 'ar' ? 'حاول تغيير البحث أو الفئة' : 'Try adjusting your search or category'}</p>
                        </div>
                    ) : filtered.map((article, i) => (
                        <motion.div
                            key={article.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden"
                        >
                            <button
                                onClick={() => handleExpand(article.id)}
                                className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText size={16} className="text-blue-600 flex-shrink-0" />
                                    <span className="font-bold text-sm">{article.title}</span>
                                </div>
                                {expandedId === article.id ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
                            </button>
                            <AnimatePresence>
                                {expandedId === article.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 pt-0 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                            {article.body}
                                            {article.tags?.length > 0 && (
                                                <div className="flex gap-2 mt-4">
                                                    {article.tags.map(tag => (
                                                        <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </>}

            {activeView === 'tickets' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black uppercase text-sm tracking-wider">{language === 'ar' ? 'تذاكر الدعم الخاصة بك' : 'Your Support Tickets'}</h3>
                        <button onClick={() => setShowTicketForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700"><Plus size={14} />{language === 'ar' ? 'تذكرة جديدة' : 'New Ticket'}</button>
                    </div>

                    {showTicketForm && (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
                            <input value={ticketForm.subject} onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))} placeholder={language === 'ar' ? 'الموضوع' : 'Subject'} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
                            <textarea value={ticketForm.description} onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))} placeholder={language === 'ar' ? 'وصف المشكلة' : 'Describe your issue...'} rows={3} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm resize-none" />
                            <div className="flex items-center gap-3">
                                <select value={ticketForm.priority} onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))} className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs">
                                    <option value="low">{language === 'ar' ? 'منخفض' : 'Low'}</option>
                                    <option value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                                    <option value="high">{language === 'ar' ? 'عالي' : 'High'}</option>
                                    <option value="urgent">{language === 'ar' ? 'عاجل' : 'Urgent'}</option>
                                </select>
                                <div className="flex-1" />
                                <button onClick={() => setShowTicketForm(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                                <button onClick={createTicket} disabled={ticketSaving || !ticketForm.subject} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50">{ticketSaving ? '...' : language === 'ar' ? 'إرسال' : 'Submit'}</button>
                            </div>
                        </div>
                    )}

                    {tickets.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400"><HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm font-bold">{language === 'ar' ? 'لا توجد تذاكر' : 'No tickets yet'}</p></div>
                    ) : tickets.map(t => (
                        <div key={t.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.status === 'open' ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600' : t.status === 'resolved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>
                                {t.status === 'resolved' ? <CheckCircle2 size={18} /> : t.status === 'open' ? <AlertCircle size={18} /> : <Clock size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{t.title}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${t.priority === 'urgent' ? 'bg-red-500/10 text-red-600' : t.priority === 'high' ? 'bg-amber-500/10 text-amber-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{t.priority}</span>
                                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${t.status === 'open' ? 'bg-blue-500/10 text-blue-600' : t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{t.status}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Support Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
                {[
                    { icon: MessageCircle, title: language === 'ar' ? 'محادثة مباشرة' : 'Live Chat', desc: language === 'ar' ? 'تحدث مع فريق الدعم' : 'Chat with our support team', action: language === 'ar' ? 'ابدأ محادثة' : 'Start Chat', color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
                    { icon: Mail, title: language === 'ar' ? 'بريد الدعم' : 'Email Support', desc: 'support@zien-ai.app', action: language === 'ar' ? 'أرسل بريد' : 'Send Email', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
                    { icon: Phone, title: language === 'ar' ? 'اتصل بنا' : 'Call Us', desc: '+971 4 XXX XXXX', action: language === 'ar' ? 'اتصل الآن' : 'Call Now', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
                ].map(card => (
                    <div key={card.title} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${card.color}`}><card.icon size={20} /></div>
                        <h3 className="font-bold text-sm">{card.title}</h3>
                        <p className="text-xs text-zinc-500 mt-1">{card.desc}</p>
                        <button className="mt-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">{card.action}</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
