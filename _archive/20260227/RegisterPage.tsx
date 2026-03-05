import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Building2, User, Shield, CreditCard, 
  ArrowRight, ArrowLeft, Upload, CheckCircle2,
  Store, Factory, Briefcase, Truck, HardHat,
  Zap
} from 'lucide-react';
import { HeaderControls } from '../components/HeaderControls';

const COMPANY_TYPES = [
  { id: 'retail', name: 'Retail / Supermarket', icon: Store, color: 'bg-blue-500' },
  { id: 'industrial', name: 'Industrial / Factory', icon: Factory, color: 'bg-orange-500' },
  { id: 'trading', name: 'Trading Company', icon: Briefcase, color: 'bg-blue-600' },
  { id: 'logistics', name: 'Logistics / Fleet', icon: Truck, color: 'bg-indigo-500' },
  { id: 'engineering', name: 'Engineering Consultancy', icon: HardHat, color: 'bg-amber-500' }
];

const PLANS = [
  { id: 'starter', name: 'Starter', price: '59', users: '15', features: '12 uses/service' },
  { id: 'pro', name: 'Pro', price: '159', users: '20', features: '25 uses/service' },
  { id: 'business', name: 'Business', price: '499', users: '50', features: '40 uses/service' }
];

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    companyType: '',
    gmName: '',
    gmEmail: '',
    gmPhone: '',
    plan: 'pro'
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call the API and Stripe
    setStep(5); // Show provisioning
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <nav className="p-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">Z</div>
          <span className="text-xl font-black tracking-tighter uppercase">Zien</span>
        </Link>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
                {s < 4 && <div className={`w-8 h-0.5 rounded-full ${step > s ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800'}`} />}
              </div>
            ))}
          </div>
          <HeaderControls />
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-zinc-900 p-10 rounded-[40px] shadow-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="mb-10">
                  <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Company Information</h2>
                  <p className="text-zinc-500 font-medium">Tell us about your business to get started.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input 
                          type="text" 
                          value={formData.companyName}
                          onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm font-medium"
                          placeholder="Acme Corp"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Industry Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {COMPANY_TYPES.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setFormData({...formData, companyType: type.id})}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${formData.companyType === type.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${type.color}`}>
                              <type.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tight">{type.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl p-8 flex flex-col justify-center text-center">
                    <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Shield size={32} />
                    </div>
                    <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">Secure Isolation</h3>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                      Your company data will be fully isolated using ZIEN's production-grade RLS architecture.
                    </p>
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button 
                    onClick={nextStep}
                    disabled={!formData.companyName || !formData.companyType}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Next Step <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-zinc-900 p-10 rounded-[40px] shadow-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="mb-10">
                  <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">General Manager</h2>
                  <p className="text-zinc-500 font-medium">Information for the primary platform administrator.</p>
                </div>

                <div className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input 
                        type="text" 
                        value={formData.gmName}
                        onChange={(e) => setFormData({...formData, gmName: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm font-medium"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Email Address</label>
                      <input 
                        type="email" 
                        value={formData.gmEmail}
                        onChange={(e) => setFormData({...formData, gmEmail: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm font-medium"
                        placeholder="gm@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Phone Number</label>
                      <input 
                        type="tel" 
                        value={formData.gmPhone}
                        onChange={(e) => setFormData({...formData, gmPhone: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm font-medium"
                        placeholder="+971 50 000 0000"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-between">
                  <button onClick={prevStep} className="text-zinc-500 font-bold flex items-center gap-2 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button 
                    onClick={nextStep}
                    disabled={!formData.gmName || !formData.gmEmail}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Next Step <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-zinc-900 p-10 rounded-[40px] shadow-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="mb-10">
                  <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Legal & Documents</h2>
                  <p className="text-zinc-500 font-medium">Upload required business documents for verification.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center hover:border-blue-600 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Upload size={24} />
                    </div>
                    <h4 className="font-bold mb-1 uppercase tracking-tight">Business License</h4>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">PDF, JPG or PNG (Max 5MB)</p>
                  </div>
                  <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center hover:border-blue-600 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Upload size={24} />
                    </div>
                    <h4 className="font-bold mb-1 uppercase tracking-tight">GM Identity (ID/Passport)</h4>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">PDF, JPG or PNG (Max 5MB)</p>
                  </div>
                </div>

                <div className="mt-10 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 rounded border-zinc-300 text-blue-600 focus:ring-blue-600" />
                    <span className="text-xs text-zinc-500 font-medium leading-relaxed">
                      I hereby confirm that all provided information is accurate and I accept ZIEN's <a href="#" className="text-blue-600 font-bold hover:underline">Terms of Service</a>, <a href="#" className="text-blue-600 font-bold hover:underline">Privacy Policy</a>, and <a href="#" className="text-blue-600 font-bold hover:underline">Data Processing Agreement</a>.
                    </span>
                  </label>
                </div>

                <div className="mt-10 flex justify-between">
                  <button onClick={prevStep} className="text-zinc-500 font-bold flex items-center gap-2 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button 
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Next Step <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-zinc-900 p-10 rounded-[40px] shadow-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="mb-10 text-center">
                  <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Select Your Plan</h2>
                  <p className="text-zinc-500 font-medium">Choose the best fit for your company scale.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setFormData({...formData, plan: plan.id})}
                      className={`p-8 rounded-[32px] border-2 transition-all text-left flex flex-col ${formData.plan === plan.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200'}`}
                    >
                      <h4 className="font-black text-xl uppercase tracking-tight mb-1">{plan.name}</h4>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-3xl font-black">{plan.price}</span>
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">AED / mo</span>
                      </div>
                      <ul className="space-y-3 mb-8 flex-1">
                        <li className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-blue-600" /> Up to {plan.users} Users
                        </li>
                        <li className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-blue-600" /> {plan.features}
                        </li>
                        <li className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-blue-600" /> RARE AI Basic
                        </li>
                      </ul>
                      <div className={`w-full py-3 rounded-xl text-center text-xs font-bold uppercase tracking-widest transition-all ${formData.plan === plan.id ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                        {formData.plan === plan.id ? 'Selected' : 'Select Plan'}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-10 flex justify-between items-center">
                  <button onClick={prevStep} className="text-zinc-500 font-bold flex items-center gap-2 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button 
                    onClick={handleRegister}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Complete & Pay <CreditCard size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-blue-600/20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap size={48} />
                  </motion.div>
                </div>
                <h2 className="text-4xl font-black tracking-tighter uppercase mb-4">Provisioning Your Workspace</h2>
                <p className="text-xl text-zinc-500 font-medium mb-8">
                  Configuring modules for <span className="text-blue-600 font-bold">{formData.companyName}</span> based on <span className="text-blue-600 font-bold">{formData.companyType}</span> template.
                </p>
                <div className="max-w-md mx-auto space-y-4">
                  {[
                    'Creating isolated database schema...',
                    'Setting up RLS policies...',
                    'Activating core business modules...',
                    'Initializing RARE AI agents...'
                  ].map((text, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.5 }}
                      className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-zinc-400"
                    >
                      <CheckCircle2 size={16} className="text-blue-600" /> {text}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
