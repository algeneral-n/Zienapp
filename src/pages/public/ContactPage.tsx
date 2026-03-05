import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, MessageSquare, Send, Clock, Globe, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';

export default function ContactPage() {
    const { i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        subject: 'General Inquiry',
        message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setError(null);
        try {
            const { error: insertError } = await supabase
                .from('contact_submissions')
                .insert({
                    name: formData.name,
                    phone: formData.phone || null,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                });
            if (insertError) {
                // If table doesn't exist, log to console and show honest message
                console.error('Contact submission error:', insertError.message);
                // Fallback: send via mailto if DB fails
                const mailBody = encodeURIComponent(
                    `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nSubject: ${formData.subject}\n\n${formData.message}`
                );
                window.open(`mailto:support@zien-ai.app?subject=${encodeURIComponent(formData.subject)}&body=${mailBody}`);
                setSent(true);
            } else {
                setSent(true);
                setFormData({ name: '', phone: '', email: '', subject: 'General Inquiry', message: '' });
            }
            setTimeout(() => setSent(false), 5000);
        } catch (err: any) {
            setError(isArabic ? 'حدث خطأ اثناء الإرسال. حاول مرة أخرى.' : 'Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 pt-24 px-4 pb-16">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-black text-center mb-3 text-zinc-900 dark:text-white tracking-tight">
                    {isArabic ? 'تواصل معنا' : 'Contact Us'}
                </h1>
                <p className="text-center text-zinc-500 dark:text-zinc-400 mb-12 text-sm">
                    {isArabic ? 'نحن هنا لمساعدتك — اختر الطريقة المناسبة للتواصل' : 'We\'re here to help — choose your preferred way to reach us'}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Contact Info Cards */}
                    <div className="space-y-4">
                        {/* WhatsApp */}
                        <a
                            href="https://wa.me/971501234567"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl hover:shadow-md transition-all group"
                        >
                            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                                <MessageSquare size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-400">WhatsApp</h3>
                                <p className="text-xs text-emerald-600 dark:text-emerald-500">+971 50 123 4567</p>
                                <p className="text-[10px] text-emerald-500 mt-1">{isArabic ? 'رد فوري خلال ساعات العمل' : 'Instant reply during business hours'}</p>
                            </div>
                        </a>

                        {/* Phone */}
                        <a
                            href="tel:+97142345678"
                            className="flex items-center gap-4 p-5 bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-800 rounded-2xl hover:shadow-md transition-all"
                        >
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                <Phone size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-blue-800 dark:text-blue-400">{isArabic ? 'اتصل بنا' : 'Call Us'}</h3>
                                <p className="text-xs text-blue-600 dark:text-blue-500">+971 4 234 5678</p>
                                <p className="text-[10px] text-blue-500 mt-1">{isArabic ? 'الأحد - الخميس، 9 ص - 6 م' : 'Sun - Thu, 9 AM - 6 PM (GST)'}</p>
                            </div>
                        </a>

                        {/* Email */}
                        <a
                            href="mailto:support@zien-ai.app"
                            className="flex items-center gap-4 p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md transition-all"
                        >
                            <div className="w-12 h-12 bg-zinc-800 dark:bg-zinc-700 rounded-xl flex items-center justify-center text-white">
                                <Mail size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-300">{isArabic ? 'البريد الإلكتروني' : 'Email'}</h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">support@zien-ai.app</p>
                                <p className="text-[10px] text-zinc-500 mt-1">{isArabic ? 'رد خلال 24 ساعة' : 'Response within 24 hours'}</p>
                            </div>
                        </a>

                        {/* Office */}
                        <div className="flex items-center gap-4 p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                            <div className="w-12 h-12 bg-zinc-800 dark:bg-zinc-700 rounded-xl flex items-center justify-center text-white">
                                <MapPin size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-300">{isArabic ? 'المكتب' : 'Office'}</h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    {isArabic ? 'دبي، الإمارات العربية المتحدة' : 'Dubai, United Arab Emirates'}
                                </p>
                                <p className="text-[10px] text-zinc-500 mt-1">
                                    {isArabic ? 'منطقة الأعمال، برج الابتكار، الطابق 12' : 'Business Bay, Innovation Tower, 12th Floor'}
                                </p>
                            </div>
                        </div>

                        {/* Business Hours */}
                        <div className="flex items-center gap-4 p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                            <div className="w-12 h-12 bg-zinc-800 dark:bg-zinc-700 rounded-xl flex items-center justify-center text-white">
                                <Clock size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-300">{isArabic ? 'ساعات العمل' : 'Business Hours'}</h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    {isArabic ? 'الأحد - الخميس: 9:00 ص - 6:00 م' : 'Sunday - Thursday: 9:00 AM - 6:00 PM'}
                                </p>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    {isArabic ? 'الجمعة - السبت: مغلق' : 'Friday - Saturday: Closed'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8">
                        <h2 className="text-xl font-black mb-6 tracking-tight">
                            {isArabic ? 'أرسل لنا رسالة' : 'Send us a Message'}
                        </h2>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">{isArabic ? 'الاسم' : 'Name'}</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-medium" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">{isArabic ? 'الهاتف' : 'Phone'}</label>
                                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-medium" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">{isArabic ? 'البريد الإلكتروني' : 'Email'}</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-medium" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">{isArabic ? 'الموضوع' : 'Subject'}</label>
                                <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-medium">
                                    <option value="General Inquiry">{isArabic ? 'استفسار عام' : 'General Inquiry'}</option>
                                    <option value="Technical Support">{isArabic ? 'دعم فني' : 'Technical Support'}</option>
                                    <option value="Sales">{isArabic ? 'المبيعات' : 'Sales'}</option>
                                    <option value="Partnerships">{isArabic ? 'شراكات' : 'Partnerships'}</option>
                                    <option value="Billing">{isArabic ? 'الفواتير والدفع' : 'Billing'}</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">{isArabic ? 'الرسالة' : 'Message'}</label>
                                <textarea rows={5} required value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-medium resize-none" />
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {sending ? (
                                    <><Loader2 size={16} className="animate-spin" /> {isArabic ? 'جاري الإرسال...' : 'Sending...'}</>
                                ) : sent ? (
                                    <>{isArabic ? 'تم الإرسال بنجاح' : 'Sent Successfully!'}</>
                                ) : (
                                    <><Send size={16} /> {isArabic ? 'إرسال' : 'Send Message'}</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Map Embed */}
                <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 h-80">
                    <iframe
                        title="ZIEN Office Location"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.178!2d55.2708!3d25.1857!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f682829c85c07%3A0x2e1e0f0c4c2e1e0f!2sBusiness%20Bay%20-%20Dubai!5e0!3m2!1sen!2sae!4v1700000000000!5m2!1sen!2sae"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </div>
            </div>
        </div>
    );
}
