import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Lock, Mail, Chrome, Apple, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const { register, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
    // Redirect to dashboard for demo
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass rounded-3xl shadow-2xl p-8 md:p-12 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-slate-500">Log in to your ZIEN tenant account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold opacity-60">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
              <input {...register('email')} className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary outline-none" placeholder="name@company.com" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold opacity-60">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
              <input type="password" {...register('password')} className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary outline-none" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
            Sign In <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Or continue with</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="btn-secondary flex items-center justify-center gap-2 py-2.5">
            <Chrome className="w-5 h-5" /> Google
          </button>
          <button className="btn-secondary flex items-center justify-center gap-2 py-2.5">
            <Apple className="w-5 h-5" /> Apple
          </button>
        </div>

        <p className="text-center text-sm text-slate-500">
          Don't have an account? <Link to="/onboarding" className="text-primary font-bold hover:underline">Register your company</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
