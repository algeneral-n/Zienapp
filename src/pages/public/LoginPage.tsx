import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../../constants/assets';
import { Mail, Lock, ArrowRight, ShieldCheck, Globe, Phone, UserPlus, KeyRound, Smartphone } from 'lucide-react';
import { supabase } from '../../services/supabase';

type AuthView = 'login' | 'forgot' | 'register' | 'set-password' | 'phone-login' | 'otp-verify';

export default function LoginPage() {
  const navigate = useNavigate();
  const { language, t: translate } = useTheme();
  const [view, setView] = useState<AuthView>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
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
        navigate('/dashboard');
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
          redirectTo: `${window.location.origin}/portal`,
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

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: identifier,
        options: {}
      });
      if (authError) throw authError;
      setView('otp-verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckRegistered = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (view === 'forgot') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(identifier, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (authError) throw authError;
        setError(language === 'ar' ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.' : 'Password reset link has been sent to your email.');
      } else if (view === 'register') {
        // For registration, we redirect to the onboarding wizard
        window.location.href = '/onboarding';
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.verifyOtp({
        phone: identifier,
        token: otp,
        type: 'sms'
      });
      if (authError) throw authError;
      if (data.user) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
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
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
                <img
                  src={ASSETS.LOGO_PRIMARY}
                  alt="Logo"
                  className="w-32 h-32 mx-auto relative z-10 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  {...IMAGE_PROPS}
                />
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-1">{t.welcome}</h2>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em]">{t.tagline}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t.emailPhone}</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-black/5 border border-[var(--border-soft)] p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email or 05xxxxxxxx"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">{t.password}</label>
                <button type="button" onClick={() => setView('forgot')} className="text-xs text-blue-600 font-bold hover:underline">{t.forgot}</button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/5 border border-[var(--border-soft)] p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <p className={`text-sm font-medium ${error.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? '...' : t.login}
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.form>
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
              <div className="p-3 bg-blue-600/10 rounded-xl text-blue-600">
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
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-black/5 border border-[var(--border-soft)] p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'ar' ? 'البريد الإلكتروني أو الهاتف المسجل' : 'Registered Email or Phone'}
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
            >
              {loading
                ? (language === 'ar' ? 'جاري التحقق...' : 'Verifying...')
                : (language === 'ar' ? 'التحقق من الهوية' : 'Verify Identity')}
            </button>

            <button type="button" onClick={() => setView('login')} className="w-full text-sm font-bold text-[var(--text-muted)] hover:text-blue-600 transition-colors">
              {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Return to Login'}
            </button>
          </motion.form>
        );

      case 'phone-login':
        return (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handlePhoneSignIn}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold mb-2">
              {language === 'ar' ? 'تسجيل الدخول بالهاتف' : 'Phone Login'}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              {language === 'ar' ? 'أدخل رقم هاتفك لتلقي رمز تسجيل دخول آمن.' : 'Enter your phone number to receive a secure login code.'}
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <div className="relative">
                <Smartphone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-black/5 border border-[var(--border-soft)] p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+971 5x xxx xxxx"
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading
                ? (language === 'ar' ? 'جاري إرسال الرمز...' : 'Sending Code...')
                : (language === 'ar' ? 'إرسال الرمز' : 'Send OTP')}
            </button>
          </motion.form>
        );

      case 'otp-verify':
        return (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleVerifyOtp}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold mb-2">
              {language === 'ar' ? 'التحقق من الرمز' : 'Verify OTP'}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              {language === 'ar' ? `أدخل الرمز المكون من 6 أرقام المرسل إلى ${identifier}` : `Enter the 6-digit code sent to ${identifier}`}
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'رمز التحقق' : 'OTP Code'}
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-black/5 border border-[var(--border-soft)] p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-[1em]"
                maxLength={6}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading
                ? (language === 'ar' ? 'جاري التحقق...' : 'Verifying...')
                : (language === 'ar' ? 'التحقق وتسجيل الدخول' : 'Verify & Sign In')}
            </button>
          </motion.form>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 sm:px-6 py-20 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
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
                  className="w-full bg-white text-gray-700 border border-gray-300 p-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all font-bold text-sm disabled:opacity-50 shadow-sm"
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

              <button
                onClick={() => setView('phone-login')}
                disabled={loading}
                className="w-full mt-4 glass-card p-4 flex items-center justify-center gap-3 hover:bg-black/5 transition-all font-bold text-sm disabled:opacity-50"
              >
                <Phone className="w-5 h-5 text-green-600" />
                {t.phone}
              </button>
            </>
          )}
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {view === 'login' ? (
              <>
                {language === 'ar' ? 'أول مرة هنا؟' : 'First time here?'}
                <button onClick={() => setView('register')} className="text-blue-600 font-bold hover:underline ml-1">{t.register}</button>
              </>
            ) : (
              <button onClick={() => setView('login')} className="text-blue-600 font-bold hover:underline">{language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}</button>
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
