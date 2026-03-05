import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Search, MessageSquare, Book, Phone, ChevronDown, Bug, Lightbulb, Send, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';

export default function HelpCenter() {
  const { t, language } = useTheme();
  const [activeTab, setActiveTab] = useState<'faq' | 'complaint' | 'bug'>('faq');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const faqs = [
    { 
      q: t('faq_q1') || (language === 'ar' ? 'كيف أضيف شركة جديدة؟' : 'How do I add a new company?'), 
      a: t('faq_a1') || (language === 'ar' ? 'اذهب إلى صفحة المؤسس > الشركات > إضافة شركة جديدة. اتبع معالج الإعداد.' : 'Go to the Founder Page > Tenants > Add New Company. Follow the onboarding wizard.') 
    },
    { 
      q: t('faq_q2') || (language === 'ar' ? 'هل يمكنني تخصيص الوحدات لكل شركة؟' : 'Can I customize the modules per tenant?'), 
      a: t('faq_a2') || (language === 'ar' ? 'نعم، ZIEN تدعم التجهيز بناءً على الصناعة. يمكنك تفعيل/تعطيل الوحدات في إعدادات الشركة.' : 'Yes, ZIEN supports industry-based provisioning. You can enable/disable modules in the Tenant Settings.') 
    },
    { 
      q: t('faq_q3') || (language === 'ar' ? 'هل بياناتي آمنة؟' : 'Is my data secure?'), 
      a: t('faq_a3') || (language === 'ar' ? 'بالتأكيد. نستخدم Supabase RLS لضمان العزل التام بين الشركات.' : 'Absolutely. We use Supabase RLS (Row Level Security) to ensure complete isolation between tenants.') 
    },
    { 
      q: t('faq_q4') || (language === 'ar' ? 'كيف يعمل الذكاء الاصطناعي RARE؟' : 'How does RARE AI work?'), 
      a: t('faq_a4') || (language === 'ar' ? 'RARE هو وكيل ذكاء اصطناعي يدرك الأدوار ويتكامل مع بيانات شركتك لتقديم رؤى وأتمتة.' : 'RARE is a role-aware AI agent that integrates with your specific company data to provide insights and automation.') 
    },
  ];

  const handleComplaintSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type');
    const subject = formData.get('subject');
    const details = formData.get('details');
    
    // Send to info@zien-ai.app for suggestions/inquiries
    window.location.href = `mailto:info@zien-ai.app?subject=${encodeURIComponent(`[${type}] ${subject}`)}&body=${encodeURIComponent(details as string)}`;
    
    setFormStatus('submitting');
    setTimeout(() => {
      setFormStatus('success');
      setTimeout(() => setFormStatus('idle'), 3000);
    }, 1500);
  };

  const handleBugSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const location = formData.get('location');
    const steps = formData.get('steps');
    const expected = formData.get('expected');
    
    // Send to gm@zien-ai.app for bugs/errors
    const body = `Location: ${location}\n\nSteps to reproduce:\n${steps}\n\nExpected outcome:\n${expected}`;
    window.location.href = `mailto:gm@zien-ai.app?subject=${encodeURIComponent(`[BUG REPORT] Issue in ${location}`)}&body=${encodeURIComponent(body)}`;
    
    setFormStatus('submitting');
    setTimeout(() => {
      setFormStatus('success');
      setTimeout(() => setFormStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-20">
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">
          {t('how_can_we_help') || (language === 'ar' ? 'كيف يمكننا مساعدتك؟' : 'How can we help?')}
        </h1>
        <div className="max-w-2xl mx-auto relative">
          <Search className={`absolute ${language === 'ar' ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 text-zinc-400`} size={24} />
          <input 
            type="text" 
            placeholder={t('search_help') || (language === 'ar' ? 'ابحث عن مقالات، أدلة، أو أسئلة شائعة...' : 'Search for articles, guides, or FAQs...')}
            className={`w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 ${language === 'ar' ? 'pr-16 pl-8' : 'pl-16 pr-8'} text-lg font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none`}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('faq')}
          className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'faq' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500'}`}
        >
          <Book size={18} /> {t('faq')}
        </button>
        <button 
          onClick={() => setActiveTab('complaint')}
          className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'complaint' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500'}`}
        >
          <Lightbulb size={18} /> {t('complaints_suggestions') || (language === 'ar' ? 'الشكاوى والاقتراحات' : 'Complaints & Suggestions')}
        </button>
        <button 
          onClick={() => setActiveTab('bug')}
          className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'bug' ? 'bg-red-600 text-white' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500'}`}
        >
          <Bug size={18} /> {t('report_bug') || (language === 'ar' ? 'الإبلاغ عن خطأ' : 'Report a Bug')}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'faq' && (
          <motion.div key="faq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <button className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <span className="font-bold text-sm">{faq.q}</span>
                  <ChevronDown size={18} className="text-zinc-400" />
                </button>
                <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-500 font-medium leading-relaxed border-t border-zinc-100 dark:border-zinc-800">
                  {faq.a}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'complaint' && (
          <motion.div key="complaint" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto">
            <form onSubmit={handleComplaintSubmit} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold mb-2">{t('complaints_suggestions') || (language === 'ar' ? 'الشكاوى والاقتراحات' : 'Complaints & Suggestions')}</h2>
                <p className="text-zinc-500 text-sm">{t('complaints_desc') || (language === 'ar' ? 'نحن نستمع إليك. شاركنا أفكارك أو مشاكلك لتحسين المنصة.' : 'We are listening. Share your thoughts or issues to help us improve.')}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">{t('message_type') || (language === 'ar' ? 'نوع الرسالة' : 'Message Type')}</label>
                  <select name="type" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 outline-none focus:border-blue-500">
                    <option value="Suggestion">{t('suggestion') || (language === 'ar' ? 'اقتراح تحسين' : 'Improvement Suggestion')}</option>
                    <option value="Complaint">{t('complaint') || (language === 'ar' ? 'شكوى خدمة' : 'Service Complaint')}</option>
                    <option value="Inquiry">{t('inquiry') || (language === 'ar' ? 'استفسار عام' : 'General Inquiry')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">{t('subject') || (language === 'ar' ? 'الموضوع' : 'Subject')}</label>
                  <input name="subject" required type="text" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 outline-none focus:border-blue-500" placeholder={t('subject_placeholder') || (language === 'ar' ? 'عنوان مختصر' : 'Brief title')} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">{t('details') || (language === 'ar' ? 'التفاصيل' : 'Details')}</label>
                  <textarea name="details" required rows={5} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 outline-none focus:border-blue-500 resize-none" placeholder={t('details_placeholder') || (language === 'ar' ? 'اشرح بالتفصيل...' : 'Explain in detail...')}></textarea>
                </div>
              </div>

              <button disabled={formStatus !== 'idle'} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                {formStatus === 'idle' && <><Send size={18} /> {t('submit') || (language === 'ar' ? 'إرسال' : 'Submit')}</>}
                {formStatus === 'submitting' && <span className="animate-pulse">{t('submitting') || (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...')}</span>}
                {formStatus === 'success' && <><CheckCircle2 size={18} /> {t('submitted_success') || (language === 'ar' ? 'تم الإرسال بنجاح' : 'Submitted Successfully')}</>}
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === 'bug' && (
          <motion.div key="bug" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto">
            <form onSubmit={handleBugSubmit} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-red-200 dark:border-red-900/30 space-y-6 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400 flex items-center gap-2"><Bug /> {t('report_tech_bug') || (language === 'ar' ? 'الإبلاغ عن خطأ تقني' : 'Report a Technical Bug')}</h2>
                <p className="text-zinc-500 text-sm">{t('bug_desc') || (language === 'ar' ? 'واجهت مشكلة في النظام؟ أخبرنا لنقوم بإصلاحها فوراً.' : 'Encountered a system issue? Let us know so we can fix it immediately.')}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">{t('where_bug') || (language === 'ar' ? 'أين حدث الخطأ؟' : 'Where did the bug occur?')}</label>
                  <select name="location" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 outline-none focus:border-red-500">
                    <option value="Accounting">{t('accounting') || (language === 'ar' ? 'المحاسبة' : 'Accounting')}</option>
                    <option value="HR">{t('hr') || (language === 'ar' ? 'الموارد البشرية' : 'HR')}</option>
                    <option value="Sales">{t('crm') || (language === 'ar' ? 'المبيعات' : 'Sales')}</option>
                    <option value="Other">{t('other') || (language === 'ar' ? 'أخرى' : 'Other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">{t('steps_reproduce') || (language === 'ar' ? 'خطوات إعادة إنتاج الخطأ' : 'Steps to reproduce')}</label>
                  <textarea name="steps" required rows={4} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 outline-none focus:border-red-500 resize-none" placeholder={t('steps_placeholder') || (language === 'ar' ? '1. ذهبت إلى...\n2. ضغطت على...\n3. حدث الخطأ...' : '1. I went to...\n2. I clicked on...\n3. The error happened...')}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">{t('expected_outcome') || (language === 'ar' ? 'ما الذي كنت تتوقعه؟' : 'What did you expect to happen?')}</label>
                  <textarea name="expected" required rows={2} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 outline-none focus:border-red-500 resize-none"></textarea>
                </div>
              </div>

              <button disabled={formStatus !== 'idle'} type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                {formStatus === 'idle' && <><Send size={18} /> {t('submit_report') || (language === 'ar' ? 'إرسال التقرير' : 'Submit Report')}</>}
                {formStatus === 'submitting' && <span className="animate-pulse">{t('submitting') || (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...')}</span>}
                {formStatus === 'success' && <><CheckCircle2 size={18} /> {t('report_received') || (language === 'ar' ? 'تم استلام التقرير' : 'Report Received')}</>}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
