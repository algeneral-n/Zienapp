import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../../constants/assets';
import { Plus, Minus, Search, ShieldCheck, Send, CheckCircle, Tag, MessageSquarePlus, ChevronDown } from 'lucide-react';

type FaqCategory = 'all' | 'getting-started' | 'billing' | 'security' | 'modules' | 'ai' | 'technical';

interface FaqItem {
  q_ar: string;
  q_en: string;
  a_ar: string;
  a_en: string;
  category: FaqCategory;
}

const FAQ_DATA: FaqItem[] = [
  {
    category: 'getting-started',
    q_en: "How do I register my company?",
    q_ar: "كيف أقوم بتسجيل شركتي؟",
    a_en: "Simply click the 'Register Now' button on the landing page and follow our smart onboarding wizard. You'll need your company details and responsible person information.",
    a_ar: "ما عليك سوى النقر فوق الزر 'سجل الآن' في الصفحة الرئيسية واتباع معالج الإعداد الذكي الخاص بنا. ستحتاج إلى تفاصيل شركتك ومعلومات الشخص المسؤول."
  },
  {
    category: 'getting-started',
    q_en: "Can I try the platform before buying?",
    q_ar: "هل يمكنني تجربة المنصة قبل الشراء؟",
    a_en: "Yes, we offer a full interactive demo that allows you to explore all modules and services before committing to any paid plan.",
    a_ar: "نعم، نحن نقدم نسخة ديمو تفاعلية كاملة تتيح لك استكشاف جميع الوحدات والخدمات قبل الالتزام بأي خطة مدفوعة."
  },
  {
    category: 'getting-started',
    q_en: "How long does the onboarding take?",
    q_ar: "كم يستغرق التسجيل والإعداد؟",
    a_en: "The entire onboarding process takes less than 5 minutes. Our smart wizard auto-provisions the best modules for your industry type and company size.",
    a_ar: "تستغرق عملية التسجيل والإعداد أقل من 5 دقائق. معالجنا الذكي يقوم تلقائياً بتوفير أفضل الوحدات لنوع صناعتك وحجم شركتك."
  },
  {
    category: 'security',
    q_en: "Is my data isolated from other companies?",
    q_ar: "هل بياناتي معزولة عن الشركات الأخرى؟",
    a_en: "Yes, ZIEN uses advanced Multi-Tenant architecture with Row Level Security (RLS) at the database level. Your data is strictly isolated and never shared.",
    a_ar: "نعم، تستخدم ZIEN بنية متطورة متعددة المستأجرين مع أمان مستوى الصف (RLS) على مستوى قاعدة البيانات. بياناتك معزولة تماماً ولا يتم مشاركتها أبداً."
  },
  {
    category: 'security',
    q_en: "How is my data encrypted?",
    q_ar: "كيف يتم تشفير بياناتي؟",
    a_en: "All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Sensitive fields like passwords are hashed with bcrypt. We also support customer-managed encryption keys on enterprise plans.",
    a_ar: "يتم تشفير جميع البيانات أثناء التخزين باستخدام AES-256 وأثناء النقل باستخدام TLS 1.3. الحقول الحساسة مثل كلمات المرور مشفرة بخوارزمية bcrypt. كما ندعم مفاتيح تشفير يديرها العميل في خطط المؤسسات."
  },
  {
    category: 'security',
    q_en: "Where are your servers located?",
    q_ar: "أين تقع خوادمكم؟",
    a_en: "Our primary infrastructure runs on Cloudflare's global edge network and Supabase (AWS). Data residency options are available for enterprise plans to comply with local regulations.",
    a_ar: "تعمل بنيتنا التحتية الأساسية على شبكة Cloudflare العالمية و Supabase (AWS). تتوفر خيارات إقامة البيانات لخطط المؤسسات للامتثال للوائح المحلية."
  },
  {
    category: 'modules',
    q_en: "Can I customize the modules for my industry?",
    q_ar: "هل يمكنني تخصيص الوحدات لصناعتي؟",
    a_en: "Absolutely. When you select your industry type during registration, we auto-provision the most relevant modules, but you can always add or remove services later.",
    a_ar: "بالتأكيد. عندما تختار نوع صناعتك أثناء التسجيل، نقوم تلقائياً بتوفير الوحدات الأكثر صلة، ولكن يمكنك دائماً إضافة أو إزالة الخدمات لاحقاً."
  },
  {
    category: 'modules',
    q_en: "What modules are available?",
    q_ar: "ما هي الوحدات المتاحة؟",
    a_en: "ZIEN offers HR & Payroll, Accounting & Finance, CRM & Sales, Logistics & Inventory, Store/POS, Project Management, Meetings & Chat, and more. Each module can be enabled or disabled independently.",
    a_ar: "توفر ZIEN وحدات الموارد البشرية والرواتب، المحاسبة والمالية، إدارة علاقات العملاء والمبيعات، اللوجستيات والمخزون، المتجر/نقطة البيع، إدارة المشاريع، الاجتماعات والدردشة، والمزيد. يمكن تفعيل أو تعطيل كل وحدة بشكل مستقل."
  },
  {
    category: 'ai',
    q_en: "What is RARE AI?",
    q_ar: "ما هو RARE AI؟",
    a_en: "RARE AI is our proprietary suite of 24 intelligent agents designed for specific business roles (HR, Sales, Accounting, Legal, etc.). They help automate complex tasks, provide deep insights, and act as virtual team members.",
    a_ar: "RARE AI هي مجموعتنا الخاصة من 24 وكيلاً ذكياً مصممين لأدوار عمل محددة (الموارد البشرية، المبيعات، المحاسبة، القانوني، إلخ). يساعدون في أتمتة المهام المعقدة وتقديم رؤى عميقة ويعملون كأعضاء فريق افتراضيين."
  },
  {
    category: 'ai',
    q_en: "Is RARE AI included in all plans?",
    q_ar: "هل RARE AI متاح في جميع الخطط؟",
    a_en: "Basic AI features are included in all plans. Advanced RARE agents with deeper analytics and automation are available in Professional and Enterprise plans. You can also purchase RARE as an add-on.",
    a_ar: "الميزات الأساسية للذكاء الاصطناعي متاحة في جميع الخطط. وكلاء RARE المتقدمين مع تحليلات وأتمتة أعمق متاحون في خطط Professional و Enterprise. يمكنك أيضاً شراء RARE كإضافة."
  },
  {
    category: 'billing',
    q_en: "How is billing calculated?",
    q_ar: "كيف يتم احتساب الرسوم؟",
    a_en: "We use a monthly or annual subscription model based on the number of users and active modules. You can upgrade or downgrade at any time. Annual plans get a 20% discount.",
    a_ar: "نحن نستخدم نموذج اشتراك شهري أو سنوي بناءً على عدد المستخدمين والوحدات المفعلة. يمكنك الترقية أو التخفيض في أي وقت. الخطط السنوية تحصل على خصم 20%."
  },
  {
    category: 'billing',
    q_en: "What payment methods do you accept?",
    q_ar: "ما هي طرق الدفع المقبولة؟",
    a_en: "We accept all major credit/debit cards (Visa, Mastercard, AMEX), Apple Pay, Google Pay, and bank transfers for enterprise accounts. All payments are processed securely through Network International.",
    a_ar: "نقبل جميع بطاقات الائتمان والخصم الرئيسية (Visa, Mastercard, AMEX)، وApple Pay، وGoogle Pay، والتحويلات البنكية لحسابات المؤسسات. تتم معالجة جميع المدفوعات بشكل آمن عبر Network International."
  },
  {
    category: 'billing',
    q_en: "Can I cancel my subscription anytime?",
    q_ar: "هل يمكنني إلغاء اشتراكي في أي وقت؟",
    a_en: "Yes, you can cancel your subscription at any time from your dashboard. For monthly plans, you'll have access until the end of the billing period. For annual plans, please refer to our refund policy.",
    a_ar: "نعم، يمكنك إلغاء اشتراكك في أي وقت من لوحة التحكم الخاصة بك. للخطط الشهرية، ستحتفظ بالوصول حتى نهاية فترة الفوترة. للخطط السنوية، يرجى الرجوع إلى سياسة الاسترداد."
  },
  {
    category: 'technical',
    q_en: "Does ZIEN support API integrations?",
    q_ar: "هل تدعم ZIEN واجهات برمجة التطبيقات (API)؟",
    a_en: "Yes, ZIEN provides a comprehensive REST API for all modules. You can integrate with third-party tools, ERPs, and custom applications. API documentation is available in your dashboard.",
    a_ar: "نعم، توفر ZIEN واجهة برمجة تطبيقات REST شاملة لجميع الوحدات. يمكنك الدمج مع أدوات الطرف الثالث وأنظمة ERP والتطبيقات المخصصة. وثائق API متاحة في لوحة التحكم."
  },
  {
    category: 'technical',
    q_en: "What languages does the platform support?",
    q_ar: "ما هي اللغات التي تدعمها المنصة؟",
    a_en: "ZIEN supports 15 languages including Arabic, English, French, Spanish, German, Turkish, Urdu, Hindi, Chinese, Japanese, Korean, Portuguese, Russian, Italian, and Malay. The interface is fully RTL-compatible.",
    a_ar: "تدعم ZIEN 15 لغة بما في ذلك العربية والإنجليزية والفرنسية والإسبانية والألمانية والتركية والأردية والهندية والصينية واليابانية والكورية والبرتغالية والروسية والإيطالية والملايو. الواجهة متوافقة تماماً مع RTL."
  }
];

const CATEGORIES: { key: FaqCategory; en: string; ar: string }[] = [
  { key: 'all', en: 'All', ar: 'الكل' },
  { key: 'getting-started', en: 'Getting Started', ar: 'البدء' },
  { key: 'billing', en: 'Billing', ar: 'الفوترة' },
  { key: 'security', en: 'Security', ar: 'الأمان' },
  { key: 'modules', en: 'Modules', ar: 'الوحدات' },
  { key: 'ai', en: 'RARE AI', ar: 'RARE AI' },
  { key: 'technical', en: 'Technical', ar: 'تقني' },
];

export default function FAQPage() {
  const { language } = useTheme();
  const isAr = language === 'ar';
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('all');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitForm, setSubmitForm] = useState({ name: '', email: '', question: '' });
  const [submitted, setSubmitted] = useState(false);

  const filteredFaqs = useMemo(() => {
    let items = FAQ_DATA;
    if (activeCategory !== 'all') {
      items = items.filter(f => f.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(f =>
        f.q_en.toLowerCase().includes(q) || f.q_ar.includes(q) ||
        f.a_en.toLowerCase().includes(q) || f.a_ar.includes(q)
      );
    }
    return items;
  }, [activeCategory, searchQuery]);

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would POST to the API
    console.log('Question submitted:', submitForm);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowSubmitForm(false);
      setSubmitForm({ name: '', email: '', question: '' });
    }, 3000);
  };

  return (
    <div className="pt-32 pb-20 px-6 bg-[var(--bg-primary)] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            {isAr ? 'كل ما تحتاج لمعرفته حول ZIEN. لم تجد إجابتك؟ أرسل سؤالك لنا.' : 'Everything you need to know about ZIEN. Can\'t find your answer? Submit your question to us.'}
          </p>
        </div>

        {/* Search + Submit Button */}
        <div className="max-w-2xl mx-auto mb-8 flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن إجابات...' : 'Search for answers...'}
              className="w-full glass-card p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all whitespace-nowrap"
          >
            <MessageSquarePlus className="w-5 h-5" />
            {isAr ? 'اطرح سؤال' : 'Ask a Question'}
          </button>
        </div>

        {/* Question Submission Form */}
        <AnimatePresence>
          {showSubmitForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="max-w-2xl mx-auto mb-10 overflow-hidden"
            >
              <div className="glass-card p-8 border border-blue-500/20 bg-gradient-to-br from-blue-600/5 to-cyan-600/5">
                {submitted ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">
                      {isAr ? 'تم إرسال سؤالك بنجاح!' : 'Question Submitted Successfully!'}
                    </h3>
                    <p className="text-[var(--text-secondary)]">
                      {isAr ? 'سنراجع سؤالك ونضيفه إلى قائمة الأسئلة الشائعة قريباً.' : 'We\'ll review your question and add it to the FAQ soon.'}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitQuestion} className="space-y-4">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                      <MessageSquarePlus className="w-5 h-5 text-blue-600" />
                      {isAr ? 'اطرح سؤالك' : 'Ask Your Question'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        value={submitForm.name}
                        onChange={e => setSubmitForm(p => ({ ...p, name: e.target.value }))}
                        placeholder={isAr ? 'الاسم' : 'Your Name'}
                        className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-primary)] outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="email"
                        required
                        value={submitForm.email}
                        onChange={e => setSubmitForm(p => ({ ...p, email: e.target.value }))}
                        placeholder={isAr ? 'البريد الإلكتروني' : 'Your Email'}
                        className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-primary)] outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <textarea
                      required
                      rows={3}
                      value={submitForm.question}
                      onChange={e => setSubmitForm(p => ({ ...p, question: e.target.value }))}
                      placeholder={isAr ? 'اكتب سؤالك هنا...' : 'Type your question here...'}
                      className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-primary)] outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowSubmitForm(false)}
                        className="px-5 py-2.5 rounded-xl border border-[var(--border-soft)] hover:bg-[var(--bg-secondary)] transition-all"
                      >
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
                      >
                        <Send className="w-4 h-4" />
                        {isAr ? 'إرسال' : 'Submit'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setOpenIndex(null); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'glass-card hover:bg-blue-600/10'
                }`}
            >
              {isAr ? cat.ar : cat.en}
            </button>
          ))}
        </div>

        {/* FAQ + Sidebar Grid */}
        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* FAQ List - 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">
                  {isAr ? 'لم يتم العثور على نتائج' : 'No results found'}
                </h3>
                <p className="text-[var(--text-secondary)]">
                  {isAr ? 'جرب البحث بكلمات مختلفة أو اطرح سؤالك.' : 'Try different search terms or submit your question.'}
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq, i) => {
                const catLabel = CATEGORIES.find(c => c.key === faq.category);
                return (
                  <div key={`${faq.category}-${i}`} className="glass-card overflow-hidden">
                    <button
                      onClick={() => setOpenIndex(openIndex === i ? null : i)}
                      className={`w-full p-6 flex items-center justify-between gap-4 ${isAr ? 'text-right' : 'text-left'} hover:bg-black/5 transition-colors`}
                    >
                      <div className="flex-1">
                        <span className="font-bold text-lg block">{isAr ? faq.q_ar : faq.q_en}</span>
                        <span className="inline-flex items-center gap-1 mt-2 text-xs px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600">
                          <Tag className="w-3 h-3" />
                          {catLabel ? (isAr ? catLabel.ar : catLabel.en) : faq.category}
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {openIndex === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 pb-6 text-[var(--text-secondary)] leading-relaxed"
                        >
                          {isAr ? faq.a_ar : faq.a_en}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}

            {/* Stats */}
            <div className="text-center pt-4 text-sm text-[var(--text-secondary)]">
              {isAr
                ? `عرض ${filteredFaqs.length} من ${FAQ_DATA.length} سؤال`
                : `Showing ${filteredFaqs.length} of ${FAQ_DATA.length} questions`}
            </div>
          </div>

          {/* Sidebar */}
          <div className="sticky top-32 space-y-8">
            <div className="glass-card p-8 border-blue-500/20 bg-gradient-to-br from-blue-600/5 to-cyan-600/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">
                  {isAr ? 'الأمان أولاً' : 'Security First'}
                </h2>
              </div>
              <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
                {isAr
                  ? 'ثقتكم هي أولويتنا. نحن ننفذ تشفيراً بمستوى عسكري وعزلاً صارماً للبيانات لكل مستأجر.'
                  : 'Your trust is our priority. We implement military-grade encryption and strict data isolation for every tenant.'}
              </p>
              <div className="rounded-2xl overflow-hidden border border-[var(--border-soft)] shadow-xl">
                <img
                  src={ASSETS.FEATURE_SECURITY_ALT}
                  alt="Security Shield"
                  className="w-full h-auto"
                  {...IMAGE_PROPS}
                />
              </div>
            </div>

            <div className="glass-card p-8">
              <h3 className="font-bold mb-4">
                {isAr ? 'لا تزال لديك أسئلة؟' : 'Still have questions?'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {isAr
                  ? 'فريق الدعم لدينا متاح على مدار الساعة طوال أيام الأسبوع لمساعدتك في أي استفسارات فنية أو تجارية.'
                  : 'Our support team is available 24/7 to help you with any technical or business inquiries.'}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { setShowSubmitForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  {isAr ? 'اطرح سؤال' : 'Ask a Question'}
                </button>
                <a
                  href="https://wa.me/971501234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 border border-[var(--border-soft)] rounded-xl font-bold hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center gap-2"
                >
                  {isAr ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
