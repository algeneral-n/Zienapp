import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, ArrowRight, Github, Chrome } from 'lucide-react';
import { HeaderControls } from '../components/HeaderControls';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call the API
    // For now, let's redirect based on role
    if (email.toLowerCase() === 'gm@zien-ai.app') {
      navigate('/founder');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <nav className="p-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">Z</div>
          <span className="text-xl font-black tracking-tighter uppercase">Zien</span>
        </Link>
        <HeaderControls />
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-blue-600/20 mx-auto mb-8">Z</div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Welcome Back</h1>
            <p className="text-zinc-500 font-medium">Enter your credentials to access ZIEN</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] shadow-xl border border-zinc-200 dark:border-zinc-800">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm font-medium"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm font-medium"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-zinc-300 text-blue-600 focus:ring-blue-600" />
                  <span className="text-zinc-500">Remember me</span>
                </label>
                <a href="#" className="text-blue-600 hover:text-blue-700">Forgot Password?</a>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                Sign In <ArrowRight size={18} />
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100 dark:border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                <span className="bg-white dark:bg-zinc-900 px-4 text-zinc-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-bold text-sm">
                <Chrome size={18} /> Google
              </button>
              <button className="flex items-center justify-center gap-2 py-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-bold text-sm">
                <Github size={18} /> GitHub
              </button>
            </div>
          </div>

          <p className="text-center mt-8 text-sm font-medium text-zinc-500">
            Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline">Register your company</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
