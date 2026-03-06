import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../../constants/assets';
import { Lock, UserPlus, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

interface InviteInfo {
    email: string;
    full_name: string;
    company_name?: string;
    role?: string;
}

export default function AcceptInvitePage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { language } = useTheme();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [inviteValid, setInviteValid] = useState<boolean | null>(null);
    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setInviteValid(false);
            return;
        }
        // We can't easily validate without an endpoint, so show form directly
        // The server will validate when accepting
        setInviteValid(true);
    }, [token]);

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError(language === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/accept-invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password,
                    full_name: fullName || undefined,
                }),
            });

            const data = await res.json() as { success?: boolean; error?: string; message?: string };

            if (!res.ok || !data.success) {
                throw new Error(data.error || data.message || 'Failed to accept invitation');
            }

            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (inviteValid === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
        );
    }

    if (inviteValid === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <XCircle className="w-16 h-16 mx-auto text-red-500" />
                    <h2 className="text-2xl font-bold">{language === 'ar' ? 'رابط دعوة غير صالح' : 'Invalid Invitation Link'}</h2>
                    <p className="text-[var(--text-secondary)]">
                        {language === 'ar'
                            ? 'هذا الرابط غير صالح أو منتهي الصلاحية. تواصل مع مسؤول النظام.'
                            : 'This link is invalid or has expired. Please contact your administrator.'}
                    </p>
                    <button onClick={() => navigate('/login')} className="bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-hover transition-all">
                        {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Go to Login'}
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                    <h2 className="text-2xl font-bold">{language === 'ar' ? 'تم إنشاء حسابك بنجاح!' : 'Account Created Successfully!'}</h2>
                    <p className="text-[var(--text-secondary)]">
                        {language === 'ar'
                            ? 'سيتم تحويلك لصفحة تسجيل الدخول...'
                            : 'Redirecting to login page...'}
                    </p>
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-brand" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-md w-full relative z-10">
                <div className="glass-card p-6 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.15)] border-white/20 dark:border-white/5 backdrop-blur-2xl rounded-[2.5rem]">
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleAccept}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <img
                                src={ASSETS.LOGO_PRIMARY}
                                alt="ZIEN"
                                className="w-20 h-20 mx-auto mb-4 object-contain"
                                {...IMAGE_PROPS}
                            />
                            <h2 className="text-2xl font-bold">
                                {language === 'ar' ? 'قبول الدعوة' : 'Accept Invitation'}
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] mt-2">
                                {language === 'ar'
                                    ? 'أنشئ كلمة مرور لتفعيل حسابك'
                                    : 'Create a password to activate your account'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-[var(--surface-2)] border border-[var(--border-soft)] p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand/50"
                                placeholder={language === 'ar' ? 'الاسم الكامل' : 'Your full name'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {language === 'ar' ? 'كلمة المرور' : 'Password'}
                            </label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[var(--surface-2)] border border-[var(--border-soft)] p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-brand/50"
                                    placeholder="••••••••"
                                    minLength={8}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                            </label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[var(--surface-2)] border border-[var(--border-soft)] p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-brand/50"
                                    placeholder="••••••••"
                                    minLength={8}
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    {language === 'ar' ? 'إنشاء الحساب' : 'Create Account'}
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full text-sm font-bold text-[var(--text-muted)] hover:text-brand transition-colors"
                        >
                            {language === 'ar' ? 'لديك حساب بالفعل؟ سجل الدخول' : 'Already have an account? Sign in'}
                        </button>
                    </motion.form>
                </div>
            </div>
        </div>
    );
}
