import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../../constants/assets';
import { Mail, Lock, ArrowRight, ShieldCheck, Globe, Phone, UserPlus, KeyRound, Building2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Turnstile } from 'react-turnstile';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

type AuthView = 'login' | 'forgot' | 'register' | 'set-password';
type LoginMode = 'team' | 'client';

export default function LoginPage() {
  const navigate = useNavigate();
  const { language, t: translate } = useTheme();
  const [view, setView] = useState<AuthView>('login');
  const [loginMode, setLoginMode] = useState<LoginMode>('team');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });

      if (authError) throw authError;
      if (data.user) {
        navigate(loginMode === 'client' ? '/client' : '/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      if (authError) throw authError;
    } catch (err: any) {
      setError(`Failed to initiate ${provider} login.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckRegistered = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (view === 'forgot') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(identifier, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (authError) throw authError;
        setSuccess(language === 'ar' ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.' : 'Password reset link has been sent to your email.');
      } else if (view === 'register') {
        // Check if email is allowed to register (invite-only system)
        const res = await fetch(`${API_URL}/api/auth/check-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier.trim().toLowerCase() }),
        });
        const data = await res.json() as { allowed?: boolean; message?: string; full_name?: string };

        if (!data.allowed) {
          setError(language === 'ar'
            ? 'هذا البريد غير مصرح له بالتسجيل. تواصل مع مسؤول النظام.'
            : 'This email is not authorized to register. Contact your administrator.');
          return;
        }

        // Email is allowed — move to set-password view
        if (data.full_name) setFullName(data.full_name);
        setView('set-password');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: identifier.trim().toLowerCase(),
          password,
          full_name: fullName,
        }),
      });
      const data = await res.json() as { success?: boolean; message?: string; existing?: boolean; error?: string };

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Registration failed');
      }

      // Success! Show message and redirect to login
      setSuccess(language === 'ar'
        ? 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.'
        : 'Account created successfully! You can now sign in.');
      setPassword('');
      setConfirmPassword('');

      // Auto-redirect to login after 2 seconds
      setTimeout(() => {
        setView('login');
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const t = {
    login: language === 'ar' ? 'تسجيل الدخول' : 'Sign In',
    register: language === 'ar' ? 'تسجيل حساب' : 'Register Account',
    forgot: language === 'ar' ? 'نسيت كلمة السر؟' : 'Forgot?',
    emailPhone: language === 'ar' ? 'البريد الإلكتروني أو رقم الهاتف' : 'Email or Phone Number',
    password: language === 'ar' ? 'كلمة المرور' : 'Password',
    continueWith: language === 'ar' ? 'أو المتابعة باستخدام' : 'Or continue with',
    google: language === 'ar' ? 'تسجيل الدخول بجوجل' : 'Sign in with Google',
    apple: language === 'ar' ? 'تسجيل الدخول بأبل' : 'Sign in with Apple',
    phone: language === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    secure: language === 'ar' ? 'آمن' : 'Secure',
    encrypted: language === 'ar' ? 'مشفر' : 'Encrypted',
    realtime: language === 'ar' ? 'فوري' : 'Real-time',
    welcome: language === 'ar' ? 'مرحباً بك' : 'Welcome Back',
    tagline: language === 'ar' ? 'بوابة ذكاء المؤسسات' : 'Enterprise Intelligence Portal'
  };

  const renderView = () => {
    switch (view) {
      case 'login':
        return (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleLogin}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-brand-light0 blur-3xl opacity-20 animate-pulse"></div>
                <img
                  src={ASSETS.LOGO_PRIMARY}
                  alt="Logo"
                  className="w-32 h-32 mx-auto relative z-10 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  {...IMAGE_PROPS}
                />
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-1">{t.welcome}</h2>
              <p className="text-[10px] text-brand font-black uppercase tracking-[0.2em]">{t.tagline}</p>
            </div>

            {/* Login Mode Tabs — Team vs Client */}
            <div className="flex rounded-xl bg-[var(--surface-2)] p-1 mb-2">
              <button
                type="button"
                onClick={() => setLoginMode('team')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${loginMode === 'team'
                    ? 'bg-brand text-white shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
              >
                {language === 'ar' ? 'فريق العمل' : 'Team Member'}
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('client')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${loginMode === 'client'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
              >
                {language === 'ar' ? 'بوابة العملاء' : 'Client Portal'}
              </button>
            </div>

            {loginMode === 'client' && (
              <p className="text-[10px] text-cyan-600 font-bold text-center">
                {language === 'ar'
                  ? 'سجل دخول بالبريد المسجل لدى الشركة المتعاملة'
                  : 'Sign in with the email registered by your service provider'}
              </p>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{t.emailPhone}</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-soft)] p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-brand/50"
                  placeholder="Email or 05xxxxxxxx"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">{t.password}</label>
                <button type="button" onClick={() => setView('forgot')} className="text-xs text-brand font-bold hover:underline">{t.forgot}</button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-soft)] p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-brand/50"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <p className={`text-sm font-medium text-red-500`}>{error}</p>}
            {success && <p className="text-sm font-medium text-green-500">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white py-4 rounded-xl font-bold hover:bg-brand-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
            >
              {loading ? '...' : t.login}
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.form >
        );

      case 'forgot':
      case 'register':
        return (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleCheckRegistered}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand/10 rounded-xl text-brand">
                {view === 'forgot' ? <KeyRound className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {view === 'forgot'
                    ? (language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password')
                    : (language === 'ar' ? 'تنشيط الحساب' : 'Activate Account')}
                </h2>
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">
                  {language === 'ar' ? 'التحقق مطلوب' : 'Verification Required'}
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {view === 'forgot'
                ? (language === 'ar'
                  ? 'أدخل بريدك الإلكتروني المسجل أو رقم هاتفك. إذا تم العثور عليه، يمكنك تعيين كلمة مرور جديدة على الفور.'
                  : 'Enter your registered email or phone number. If found, you can set a new password immediately.')
                : (language === 'ar'
                  ? 'أدخل البريد الإلكتروني أو رقم الهاتف الذي قدمه مسؤول النظام لإعداد كلمة مرور حسابك.'
                  : 'Enter the email or phone number provided by your administrator to set up your account password.')}
            </p>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'البريد الإلكتروني أو الهاتف' : 'Email or Phone'}
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-soft)] p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-brand/50"
                  placeholder={language === 'ar' ? 'البريد الإلكتروني أو الهاتف المسجل' : 'Registered Email or Phone'}
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white py-4 rounded-xl font-bold hover:bg-brand-hover transition-all disabled:opacity-50 shadow-lg shadow-brand/20"
            >
              {loading
                ? (language === 'ar' ? 'جاري التحقق...' : 'Verifying...')
                : (language === 'ar' ? 'التحقق من الهوية' : 'Verify Identity')}
            </button>

            <button type="button" onClick={() => setView('login')} className="w-full text-sm font-bold text-[var(--text-muted)] hover:text-brand transition-colors">
              {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Return to Login'}
            </button>
          </motion.form>
        );

      case 'set-password':
        return (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSetPassword}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {language === 'ar' ? 'إنشاء كلمة المرور' : 'Create Password'}
                </h2>
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">
                  {identifier}
                </p>
              </div>
            </div>

            {fullName && (
              <p className="text-sm text-[var(--text-secondary)]">
                {language === 'ar' ? `مرحباً ${fullName}` : `Welcome ${fullName}`}
              </p>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-soft)] p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand/50"
                placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
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
            {success && <p className="text-green-500 text-sm font-medium">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 shadow-lg shadow-green-600/20"
            >
              {loading
                ? (language === 'ar' ? 'جاري إنشاء الحساب...' : 'Creating Account...')
                : (language === 'ar' ? 'إنشاء الحساب' : 'Create Account')}
            </button>

            <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); }} className="w-full text-sm font-bold text-[var(--text-muted)] hover:text-brand transition-colors">
              {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Return to Login'}
            </button>
          </motion.form>
        );

    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 sm:px-6 py-20 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="glass-card p-6 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.15)] border-white/20 dark:border-white/5 backdrop-blur-2xl rounded-[2.5rem]">
          {renderView()}

          {view === 'login' && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-soft)]"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--surface-1)] px-2 text-[var(--text-muted)]">{t.continueWith}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleOAuthLogin('google')}
                  disabled={loading}
                  className="w-full bg-white text-gray-700 border border-gray-300 p-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-[var(--surface-2)] transition-all font-bold text-sm disabled:opacity-50 shadow-sm"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  {t.google}
                </button>
                <button
                  onClick={() => handleOAuthLogin('apple')}
                  disabled={loading}
                  className="w-full bg-black text-white p-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-black/90 transition-all font-bold text-sm disabled:opacity-50 shadow-sm"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" /></svg>
                  {t.apple}
                </button>
              </div>

              {TURNSTILE_SITE_KEY && (
                <div className="flex justify-center mt-4">
                  <Turnstile
                    sitekey={TURNSTILE_SITE_KEY}
                    onVerify={(token) => setTurnstileToken(token)}
                    theme="auto"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {view === 'login' ? (
              <span className="flex flex-col gap-2 items-center">
                <span>
                  {language === 'ar' ? 'لديك دعوة؟' : 'Have an invitation?'}
                  <button onClick={() => setView('register')} className="text-brand font-bold hover:underline ml-1">
                    {language === 'ar' ? 'تنشيط الحساب' : 'Activate Account'}
                  </button>
                </span>
                <span>
                  {language === 'ar' ? 'شركة جديدة؟' : 'New company?'}
                  <button onClick={() => navigate('/register')} className="text-brand font-bold hover:underline ml-1">
                    {language === 'ar' ? 'تسجيل شركة' : 'Register Company'}
                  </button>
                </span>
                <span>
                  <button onClick={() => navigate('/guest')} className="text-cyan-600 font-bold hover:underline">
                    {language === 'ar' ? 'تصفح كزائر' : 'Browse as Guest'}
                  </button>
                </span>
              </span>
            ) : (
              <button onClick={() => { setView('login'); setError(''); setSuccess(''); }} className="text-brand font-bold hover:underline">{language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}</button>
            )}
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            <span>{t.secure}</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <span>{t.encrypted}</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <span>{t.realtime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
