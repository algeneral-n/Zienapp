import React, { useState } from 'react';
import { useTheme } from '../../components/ThemeProvider';
import { Mail, Phone, MapPin, Send, Building2 } from 'lucide-react';

export default function ContactPage() {
  const { language } = useTheme();
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  
  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 pb-20 bg-[var(--bg-secondary)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            {language === 'ar' 
              ? 'نحن هنا لمساعدتك. تواصل معنا لأي استفسارات حول منصة زين أو لطلب عرض توضيحي مخصص لشركتك.' 
              : 'We are here to help. Contact us for any inquiries about the ZIEN platform or to request a custom demo for your company.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Info & Map (Left Side) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-8 rounded-3xl border border-[var(--border-soft)] hover:border-brand/30 transition-all shadow-lg">
              <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mb-6">
                <Phone className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{language === 'ar' ? 'تواصل عبر واتساب' : 'WhatsApp Contact'}</h3>
              <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                {language === 'ar' ? 'اختر القسم المناسب للتواصل السريع عبر واتساب.' : 'Choose the appropriate department for quick contact via WhatsApp.'}
              </p>
              <div className="space-y-3">
                <a 
                  href="https://chat.whatsapp.com/HfZlteCotW8Bi6ZsD4GJLs?mode=gi_t" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-md shadow-green-500/20 flex items-center justify-between"
                >
                  <span>{language === 'ar' ? 'الدعم التقني' : 'Technical Support'}</span>
                  <Phone className="w-4 h-4" />
                </a>
                <a 
                  href="https://chat.whatsapp.com/IPu6Tmht8v1GTOwFxZO1Zz?mode=gi_t" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-md shadow-green-500/20 flex items-center justify-between"
                >
                  <span>{language === 'ar' ? 'خدمة العملاء' : 'Customer Service'}</span>
                  <Phone className="w-4 h-4" />
                </a>
                <a 
                  href="https://chat.whatsapp.com/H8W70Tq6ppF0pXvG2LfvJP?mode=gi_t" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-md shadow-green-500/20 flex items-center justify-between"
                >
                  <span>{language === 'ar' ? 'الشكاوى والاقتراحات' : 'Complaints & Suggestions'}</span>
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="glass-card p-8 rounded-3xl border border-[var(--border-soft)] hover:border-brand/30 transition-all shadow-lg">
              <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6">
                <Mail className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Addresses'}</h3>
              <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                {language === 'ar' ? 'أرسل لنا استفساراتك وسنقوم بالرد في أقرب وقت.' : 'Send us your inquiries and we will respond as soon as possible.'}
              </p>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {language === 'ar' ? 'الاستفسارات العامة' : 'General Info'}
                  </span>
                  <a href="mailto:INFO@ZIEN-AI.APP" className="text-lg font-bold text-brand hover:text-brand-hover transition-colors">INFO@ZIEN-AI.APP</a>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {language === 'ar' ? 'الإدارة' : 'Management'}
                  </span>
                  <a href="mailto:GM@ZIEN-AI.APP" className="text-lg font-bold text-brand hover:text-brand-hover transition-colors">GM@ZIEN-AI.APP</a>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-8 rounded-3xl border border-[var(--border-soft)] hover:border-brand/30 transition-all shadow-lg">
              <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{language === 'ar' ? 'المقر الرئيسي' : 'Headquarters'}</h3>
              <p className="text-[var(--text-secondary)] mb-6 font-medium">
                {language === 'ar' ? 'برج أونيكس، دبي، الإمارات العربية المتحدة' : 'The Onyx Tower, Dubai, United Arab Emirates'}
              </p>
              <div className="w-full h-48 rounded-2xl overflow-hidden border border-[var(--border-soft)] relative group">
                <div className="absolute inset-0 bg-brand/10 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3611.838842795493!2d55.16681027616688!3d25.09714803598731!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6b6eb4e0682b%3A0x608e0b2a75850935!2sThe%20Onyx%20Tower%201!5e0!3m2!1sen!2sae!4v1709065123456!5m2!1sen!2sae" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Contact Form (Right Side) */}
          <div className="lg:col-span-3">
            <div className="glass-card p-8 md:p-12 rounded-3xl border border-[var(--border-soft)] shadow-xl h-full flex flex-col">
              <div className="mb-10">
                <h3 className="text-3xl font-black mb-4">{language === 'ar' ? 'أرسل رسالة' : 'Send a Message'}</h3>
                <p className="text-[var(--text-secondary)]">
                  {language === 'ar' 
                    ? 'يرجى ملء النموذج أدناه وسيقوم أحد ممثلينا بالتواصل معك قريباً.' 
                    : 'Please fill out the form below and one of our representatives will contact you shortly.'}
                </p>
              </div>
              
              <form className="space-y-6 flex-1 flex flex-col" onSubmit={(e) => e.preventDefault()}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <input 
                      type="text" 
                      className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-soft)] p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand focus:bg-white dark:focus:bg-black transition-all" 
                      placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      {language === 'ar' ? 'اسم الشركة' : 'Company Name'}
                    </label>
                    <input 
                      type="text" 
                      className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-soft)] p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand focus:bg-white dark:focus:bg-black transition-all" 
                      placeholder={language === 'ar' ? 'أدخل اسم شركتك' : 'Enter your company name'} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input 
                    type="email" 
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-soft)] p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand focus:bg-white dark:focus:bg-black transition-all" 
                    placeholder="example@company.com" 
                  />
                </div>
                
                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="block text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {language === 'ar' ? 'الرسالة' : 'Message'}
                  </label>
                  <textarea 
                    className="w-full flex-1 min-h-[200px] bg-black/5 dark:bg-white/5 border border-[var(--border-soft)] p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand focus:bg-white dark:focus:bg-black transition-all resize-none" 
                    placeholder={language === 'ar' ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?'}
                  ></textarea>
                </div>
                
                <button className="w-full bg-brand text-white py-5 rounded-2xl font-black text-lg hover:bg-brand-hover transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3 group mt-auto">
                  <span>{language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}</span>
                  <Send className={`w-5 h-5 ${language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-transform`} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
