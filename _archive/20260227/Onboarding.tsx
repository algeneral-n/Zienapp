import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, ShieldCheck, CreditCard, CheckCircle2, ArrowRight, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  industry: z.string().min(1, "Please select an industry"),
  gmName: z.string().min(2, "GM name is required"),
  gmEmail: z.string().email("Invalid email"),
  plan: z.string(),
});

type FormData = z.infer<typeof schema>;

const Onboarding: React.FC = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plan: 'starter' }
  });

  const industries = [
    { id: 'retail', name: 'Retail / Supermarket' },
    { id: 'industrial', name: 'Industrial / Factory' },
    { id: 'trading', name: 'Trading Company' },
    { id: 'engineering', name: 'Engineering Consultancy' }
  ];

  const plans = [
    { id: 'starter', name: 'Starter', price: '59 AED', users: '15 Users' },
    { id: 'pro', name: 'Pro', price: '159 AED', users: '20 Users' },
    { id: 'business', name: 'Business', price: '499 AED', users: '50 Users' }
  ];

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Call our API to create a Stripe session
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: data.plan,
          companyId: 'temp_id', // Would be generated in real app
          email: data.gmEmail
        }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Progress Bar */}
        <div className="mb-8 flex justify-between items-center px-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step >= i ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                {i}
              </div>
              {i < 4 && <div className={`w-12 h-1 rounded-full ${step > i ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`} />}
            </div>
          ))}
        </div>

        <div className="glass rounded-3xl shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 md:p-12 space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                      <Building2 className="text-primary" /> Company Profile
                    </h2>
                    <p className="text-slate-500">Tell us about your business to get started.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase tracking-wider opacity-60">Company Name</label>
                      <input {...register('companyName')} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. ZIEN Retail LLC" />
                      {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase tracking-wider opacity-60">Industry Type</label>
                      <select {...register('industry')} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary outline-none">
                        <option value="">Select Industry</option>
                        {industries.map(ind => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                      </select>
                      {errors.industry && <p className="text-red-500 text-xs">{errors.industry.message}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2">
                      Continue <ArrowRight className="w-5 h-5" />
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
                  className="p-8 md:p-12 space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                      <ShieldCheck className="text-primary" /> Verification
                    </h2>
                    <p className="text-slate-500">Upload legal documents for platform approval.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="font-semibold">Business License</p>
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm opacity-60">Click or drag to upload license</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="font-semibold">Responsible Person ID</p>
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm opacity-60">Click or drag to upload ID</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold opacity-60">GM Full Name</label>
                        <input {...register('gmName')} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold opacity-60">GM Email</label>
                        <input {...register('gmEmail')} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button type="button" onClick={prevStep} className="btn-secondary flex items-center gap-2">
                      <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2">
                      Continue <ArrowRight className="w-5 h-5" />
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
                  className="p-8 md:p-12 space-y-8"
                >
                  <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-bold">Choose your plan</h2>
                    <p className="text-slate-500">Select a subscription that fits your company size.</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((p) => (
                      <label key={p.id} className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${watch('plan') === p.id ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-primary/50'}`}>
                        <input type="radio" {...register('plan')} value={p.id} className="absolute opacity-0" />
                        <p className="text-lg font-bold mb-1">{p.name}</p>
                        <p className="text-2xl font-black text-primary mb-4">{p.price}<span className="text-sm font-normal opacity-60">/mo</span></p>
                        <ul className="space-y-2 text-sm opacity-80">
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> {p.users}</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> All Modules</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> RARE AI Basic</li>
                        </ul>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <button type="button" onClick={prevStep} className="btn-secondary flex items-center gap-2">
                      <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2">
                      Continue <ArrowRight className="w-5 h-5" />
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
                  className="p-8 md:p-12 space-y-8 text-center"
                >
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <CreditCard className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold">Ready to Launch?</h2>
                    <p className="text-slate-500">You will be redirected to Stripe for secure payment.</p>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl text-left space-y-4">
                    <div className="flex justify-between font-bold">
                      <span>{watch('plan').toUpperCase()} Plan</span>
                      <span className="text-primary">{plans.find(p => p.id === watch('plan'))?.price}</span>
                    </div>
                    <div className="text-sm opacity-60">
                      By clicking "Pay & Provision", you agree to our Terms of Service and Privacy Policy.
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button type="button" onClick={prevStep} className="btn-secondary flex items-center gap-2">
                      <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                      Pay & Provision
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
