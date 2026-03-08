import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import { Mail, ArrowRight, ShieldCheck, Eye, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

type GuestStep = 'email' | 'otp' | 'success';

export default function GuestVerifyPage() {
    const navigate = useNavigate();
    const { language } = useTheme();
    const [step, setStep] = useState<GuestStep>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const isAr = language === 'ar';

    const t = {
        title: isAr ? 'معاينة الخدمات' : 'Preview Services',
        subtitle: isAr ? 'اكتشف منصة ZIEN بدون حساب' : 'Explore ZIEN Platform without an account',
        emailLabel: isAr ? 'أدخل بريدك الإلكتروني' : 'Enter your email',
        emailPlaceholder: isAr ? 'name@example.com' : 'name@example.com',
        sendCode: isAr ? 'إرسال كود التحقق' : 'Send Verification Code',
        otpTitle: isAr ? 'أدخل كود التحقق' : 'Enter Verification Code',
        otpSent: isAr ? 'تم إرسال الكود إلى بريدك' : 'Code sent to your email',
        verify: isAr ? 'تحقق والمعاينة' : 'Verify and Preview',
        resend: isAr ? 'إعادة الإرسال' : 'Resend Code',
        successTitle: isAr ? 'تم التحقق' : 'Verified',
        successMsg: isAr ? 'جاري تحميل المعاينة...' : 'Loading preview...',
        backToLogin: isAr ? 'العودة لتسجيل الدخول' : 'Back to Login',
        guestNote: isAr ? 'وضع المعاينة: عرض فقط بدون تعديل' : 'Preview Mode: View only, no modifications',
        secure: isAr ? 'اتصال آمن' : 'Secure Connection',
        noAccount: isAr ? 'لا يلزم إنشاء حساب' : 'No account required',
    };

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/guest/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send code');
            }

            setStep('otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) {
            setError(isAr ? 'أدخل الكود كاملاً' : 'Enter the full 6-digit code');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/guest/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), otp: code }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid code');
            }

            // Store guest token
            localStorage.setItem('zien:guestToken', data.token);
            localStorage.setItem('zien:guestEmail', email.trim());
            localStorage.setItem('zien:guestExpiry', String(Date.now() + data.expiresIn * 1000));

            setStep('success');
            // Navigate to preview after brief animation
            setTimeout(() => {
                navigate('/guest/preview');
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    // Auto-submit when all 6 digits are entered
    useEffect(() => {
        if (otp.every(d => d !== '') && step === 'otp' && !loading) {
            handleVerifyOTP({ preventDefault: () => { } } as React.FormEvent);
        }
    }, [otp]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/20">
                        <Eye className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">{t.title}</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-2">{t.subtitle}</p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === 'email' && (
                            <motion.form
                                key="email"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleRequestOTP}
                                className="p-8 space-y-6"
                            >
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">{t.emailLabel}</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t.emailPlaceholder}
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                                        <AlertCircle size={16} /> {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                                    {t.sendCode}
                                </button>

                                <div className="flex items-center gap-2 justify-center text-xs text-zinc-400">
                                    <ShieldCheck size={14} />
                                    <span>{t.noAccount}</span>
                                </div>
                            </motion.form>
                        )}

                        {step === 'otp' && (
                            <motion.form
                                key="otp"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleVerifyOTP}
                                className="p-8 space-y-6"
                            >
                                <div className="text-center">
                                    <h2 className="text-lg font-black">{t.otpTitle}</h2>
                                    <p className="text-xs text-zinc-500 mt-1">{t.otpSent}: <strong className="text-blue-600">{email}</strong></p>
                                </div>

                                {/* OTP Input */}
                                <div className="flex justify-center gap-3" dir="ltr">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => { otpRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleOTPChange(i, e.target.value)}
                                            onKeyDown={e => handleOTPKeyDown(i, e)}
                                            className="w-12 h-14 text-center text-2xl font-black bg-zinc-100 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-500 text-sm font-medium justify-center">
                                        <AlertCircle size={16} /> {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || otp.some(d => !d)}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                    {t.verify}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setOtp(['', '', '', '', '', '']); setError(''); handleRequestOTP({ preventDefault: () => { } } as React.FormEvent); }}
                                    className="w-full text-xs text-blue-600 font-bold hover:underline"
                                >
                                    {t.resend}
                                </button>
                            </motion.form>
                        )}

                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-12 text-center space-y-4"
                            >
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="text-green-600" size={40} />
                                </div>
                                <h2 className="text-2xl font-black">{t.successTitle}</h2>
                                <p className="text-sm text-zinc-500">{t.successMsg}</p>
                                <Loader2 className="animate-spin mx-auto text-blue-600" size={24} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer links */}
                <div className="mt-6 text-center space-y-3">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm text-blue-600 font-bold hover:underline"
                    >
                        {t.backToLogin}
                    </button>
                    <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                        <ShieldCheck size={12} />
                        <span>{t.secure}</span>
                        <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                        <span>{t.guestNote}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
