import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../../constants/assets';
import { Plus, Minus, Search, ShieldCheck } from 'lucide-react';

export default function FAQPage() {
  const { language, t: translate } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: language === 'ar' ? "كيف أقوم بتسجيل شركتي؟" : "How do I register my company?",
      a: language === 'ar' 
        ? "ما عليك سوى النقر فوق الزر 'سجل الآن' في الصفحة الرئيسية واتباع معالج الإعداد الذكي الخاص بنا. ستحتاج إلى تفاصيل شركتك ومعلومات الشخص المسؤول." 
        : "Simply click the 'Register Now' button on the landing page and follow our smart onboarding wizard. You'll need your company details and responsible person information."
    },
    {
      q: language === 'ar' ? "هل بياناتي معزولة عن الشركات الأخرى؟" : "Is my data isolated from other companies?",
      a: language === 'ar' 
        ? "نعم، تستخدم ZIEN بنية متطورة متعددة المستأجرين مع أمان مستوى الصف (RLS) على مستوى قاعدة البيانات. بياناتك معزولة تماماً ولا يتم مشاركتها أبداً." 
        : "Yes, ZIEN uses advanced Multi-Tenant architecture with Row Level Security (RLS) at the database level. Your data is strictly isolated and never shared."
    },
    {
      q: language === 'ar' ? "هل يمكنني تخصيص الوحدات لصناعتي؟" : "Can I customize the modules for my industry?",
      a: language === 'ar' 
        ? "بالتأكيد. عندما تختار نوع صناعتك أثناء التسجيل، نقوم تلقائياً بتوفير الوحدات الأكثر صلة، ولكن يمكنك دائماً إضافة أو إزالة الخدمات لاحقاً." 
        : "Absolutely. When you select your industry type during registration, we auto-provision the most relevant modules, but you can always add or remove services later."
    },
    {
      q: language === 'ar' ? "ما هو RARE AI؟" : "What is RARE AI?",
      a: language === 'ar' 
        ? "RARE AI هي مجموعتنا الخاصة من الوكلاء الأذكياء المصممين لأدوار عمل محددة (الموارد البشرية، المبيعات، المحاسبة). يساعدون في أتمتة المهام المعقدة وتقديم رؤى عميقة." 
        : "RARE AI is our proprietary suite of intelligent agents designed for specific business roles (HR, Sales, Accounting). They help automate complex tasks and provide deep insights."
    },
    {
      q: language === 'ar' ? "هل يمكنني تجربة المنصة قبل الشراء؟" : "Can I try the platform before buying?",
      a: language === 'ar' 
        ? "نعم، نحن نقدم نسخة ديمو تفاعلية كاملة تتيح لك استكشاف جميع الوحدات والخدمات قبل الالتزام بأي خطة مدفوعة." 
        : "Yes, we offer a full interactive demo that allows you to explore all modules and services before committing to any paid plan."
    },
    {
      q: language === 'ar' ? "كيف يتم الاشتراك واحتساب الرسوم؟" : "How do I subscribe and how is billing calculated?",
      a: language === 'ar' 
        ? "نحن نستخدم نظام احتساب ذكي بعد عملية التهيئة (البروفيجنينج). يتم احتساب الرسوم بناءً على الوحدات والخدمات التي تم تفعيلها خصيصاً لشركتك." 
        : "We use a smart billing system after the provisioning process. Billing is calculated based on the specific modules and services activated for your company."
    }
  ];

  return (
    <div className="pt-32 pb-20 px-6 bg-[var(--bg-primary)] min-h-screen">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
        <div className="max-w-3xl">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-6">
              {language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </h1>
            <p className="text-xl text-[var(--text-secondary)]">
              {language === 'ar' ? 'كل ما تحتاج لمعرفته حول ZIEN.' : 'Everything you need to know about ZIEN.'}
            </p>
          </div>

        <div className="relative mb-12">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={language === 'ar' ? 'ابحث عن إجابات...' : 'Search for answers...'} 
            className="w-full glass-card p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className={`w-full p-6 flex items-center justify-between ${language === 'ar' ? 'text-right' : 'text-left'} hover:bg-black/5 transition-colors`}
              >
                <span className="font-bold text-lg">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {openIndex === i ? <Minus className="w-5 h-5 text-brand" /> : <Plus className="w-5 h-5 text-brand" />}
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-[var(--text-secondary)] leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky top-32 space-y-8">
          <div className="glass-card p-8 border-brand/20 bg-gradient-to-br from-brand/5 to-brand-light/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-brand text-white rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">
                {language === 'ar' ? 'الأمان أولاً' : 'Security First'}
              </h2>
            </div>
            <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
              {language === 'ar' 
                ? 'ثقتكم هي أولويتنا. نحن ننفذ تشفيراً بمستوى عسكري وعزلاً صارماً للبيانات لكل مستأجر.' 
                : 'Your trust is our priority. We implement military-grade encryption and strict data isolation for every tenant.'}
            </p>
            <div className="rounded-2xl overflow-hidden border border-[var(--border-soft)] shadow-xl">
              <img 
                src={ASSETS.SECURITY_SHIELD} 
                alt="Security Shield" 
                className="w-full h-auto"
                {...IMAGE_PROPS}
              />
            </div>
          </div>
          
          <div className="glass-card p-8">
            <h3 className="font-bold mb-4">
              {language === 'ar' ? 'لا تزال لديك أسئلة؟' : 'Still have questions?'}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              {language === 'ar' 
                ? 'فريق الدعم لدينا متاح على مدار الساعة طوال أيام الأسبوع لمساعدتك في أي استفسارات فنية أو تجارية.' 
                : 'Our support team is available 24/7 to help you with any technical or business inquiries.'}
            </p>
            <button className="w-full py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition-all">
              {language === 'ar' ? 'اتصل بالدعم' : 'Contact Support'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
