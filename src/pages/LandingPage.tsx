import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import { Language, ThemeMode } from '../types';
import { provisioningService, ProvisioningResult, ProvisioningStatus } from '../services/provisioningService';
import { supabase } from '../services/supabase';
import {
  Globe, Moon, Sun, Layout, ShieldCheck, Zap,
  ArrowRight, Menu, X, CheckCircle2, Star,
  ChevronLeft, ChevronRight, Play, Users,
  BarChart3, Shield, Globe2, Upload, Loader2,
  Building2, Users2, Briefcase, AlertCircle, Eye
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { language, mode, variant, setMode, setVariant, setLanguage, t: translate } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Demo States
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<ProvisioningResult | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoForm, setDemoForm] = useState({
    companyName: '',
    employees: '',
    services: [] as string[],
    image: null as File | null
  });

  const textSlides = [
    { title: translate('hero_title_1'), subtitle: translate('hero_sub_1') },
    { title: translate('hero_title_2'), subtitle: translate('hero_sub_2') },
    { title: translate('hero_title_3'), subtitle: translate('hero_sub_3') },
  ];

  const landingImages = [
    '/landing images/ChatGPT Image Feb 21, 2026, 11_00_26 AM.png',
    '/landing images/ChatGPT Image Feb 21, 2026, 11_00_28 AM - Copy.png',
    '/landing images/ChatGPT Image Feb 21, 2026, 11_00_29 AM.png',
    '/landing images/ChatGPT Image Feb 21, 2026, 11_00_32 AM.png',
    '/landing images/ChatGPT Image Feb 21, 2026, 11_00_45 AM.png',
    '/landing images/ChatGPT Image Feb 21, 2026, 11_00_48 AM.png',
    '/landing images/Gemini_Generated_Image_507n4c507n4c507n.png',
    '/landing images/Gemini_Generated_Image_7sz6lf7sz6lf7sz6 (1).png',
    '/landing images/Gemini_Generated_Image_a3mulda3mulda3mu.png',
    '/landing images/Gemini_Generated_Image_bfgslvbfgslvbfgs - Copy.png',
    '/landing images/Gemini_Generated_Image_bfgslvbfgslvbfgs.png',
    '/landing images/Gemini_Generated_Image_e3el6de3el6de3el.png',
    '/landing images/Gemini_Generated_Image_nqkfntnqkfntnqkf - Copy.png',
    '/landing images/Gemini_Generated_Image_qbonk7qbonk7qbon.png',
    '/landing images/Gemini_Generated_Image_ytphr1ytphr1ytph.png',
  ];

  const languages: { code: Language; label: string }[] = [
    { code: 'ar', label: 'العربية' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'ru', label: 'Русский' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ur', label: 'اردو' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português' },
    { code: 'nl', label: 'Nederlands' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % landingImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const [demoStep, setDemoStep] = useState(0);
  const demoSteps = [translate('demo_analyzing'), translate('demo_provisioning'), translate('demo_rare'), translate('demo_securing'), translate('demo_ready')];

  const handleCreateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoLoading(true);
    setDemoStep(0);
    setDemoError(null);

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setDemoError(translate('must_login_demo'));
      setDemoLoading(false);
      return;
    }

    try {
      setDemoStep(0);
      // Step 1: Start provisioning via real API
      const result = await provisioningService.provisionTenant({
        companyName: demoForm.companyName,
        tenantType: 'demo',
        country: 'AE',
        currency: 'AED',
        employees: demoForm.employees || '10',
        needs: demoForm.services,
        language: language,
      });

      setDemoStep(1);

      // Step 2-4: Poll status until done
      if (result.status !== 'done') {
        let attempts = 0;
        const maxAttempts = 30;
        while (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 2000));
          attempts++;
          try {
            const status = await provisioningService.getStatus(result.jobId);
            const progress = Math.min(
              Math.floor((status.completedSteps / Math.max(status.totalSteps, 1)) * (demoSteps.length - 1)),
              demoSteps.length - 2
            );
            setDemoStep(progress + 1);

            if (status.status === 'done') {
              setDemoStep(demoSteps.length - 1);
              break;
            }
            if (status.status === 'error') {
              throw new Error(status.error || 'Provisioning failed');
            }
          } catch (pollErr: any) {
            if (attempts >= maxAttempts) throw pollErr;
          }
        }
      } else {
        // Already done (fallback provisioning)
        setDemoStep(demoSteps.length - 1);
      }

      setDemoResult(result);
    } catch (err: any) {
      console.error('Demo provisioning error:', err);
      setDemoError(err?.message || translate('error_provisioning'));
    } finally {
      setDemoLoading(false);
    }
  };

  const t = {
    heroTitle: textSlides[currentSlide % textSlides.length].title,
    heroSub: textSlides[currentSlide % textSlides.length].subtitle,
    register: translate('register'),
    login: translate('login'),
    features: translate('features'),
    pricing: translate('pricing'),
    industries: translate('industries'),
    rareAi: translate('powered_by_rare'),
    createDemo: translate('create_demo'),
    joinNow: translate('join_now')
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Slider */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden min-h-[90vh] flex flex-col items-center justify-center">
        <div className="max-w-7xl mx-auto w-full relative z-10">
          {/* Top Row: Text + Image */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide % textSlides.length}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6">
                    <Zap className="w-4 h-4 fill-current" />
                    {t.rareAi}
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                    {t.heroTitle}
                  </h1>
                  <p className="text-xl text-[var(--text-secondary)] mb-6 max-w-lg leading-relaxed">
                    {t.heroSub}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="aspect-video rounded-[3rem] bg-gradient-to-br from-blue-600 to-cyan-400 p-1 shadow-2xl overflow-hidden">
                  <img
                    src={landingImages[currentSlide]}
                    alt="Platform"
                    className="w-full h-full object-cover rounded-[2.8rem] bg-white"
                  />
                </div>

                {/* Image Description Card */}
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl px-5 py-3 shadow-lg border border-white/20">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {translate(`landing_img_${currentSlide + 1}` as any)}
                    </p>
                  </div>
                </div>

                {/* Floating AI Agent Card */}
                <div className="absolute -bottom-6 -left-6 glass-card p-6 max-w-xs animate-bounce-slow hidden lg:block">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                      <img src={ASSETS.RARE_AGENT} alt="RARE AI" className="w-full h-full object-cover" {...IMAGE_PROPS} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-blue-600">{translate('rare_ai_active')}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{translate('intelligent_shield')}</div>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-blue-500" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slider Controls */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setCurrentSlide((prev) => (prev - 1 + landingImages.length) % landingImages.length)} className="w-8 h-8 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur flex items-center justify-center hover:bg-white transition shadow">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-32 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${((currentSlide + 1) / landingImages.length) * 100}%` }} className="h-full bg-blue-600 rounded-full" transition={{ duration: 0.3 }} />
            </div>
            <span className="text-xs font-bold text-[var(--text-secondary)] min-w-[2.5rem] text-center">{currentSlide + 1}/{landingImages.length}</span>
            <button onClick={() => setCurrentSlide((prev) => (prev + 1) % landingImages.length)} className="w-8 h-8 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur flex items-center justify-center hover:bg-white transition shadow">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons - Fixed Below Images */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <button
              onClick={() => navigate('/register')}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center gap-2"
            >
              {t.joinNow}
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowDemoModal(true)}
              className="glass-card px-8 py-4 rounded-2xl font-bold text-lg hover:bg-black/5 transition-all"
            >
              {t.createDemo}
            </button>
            <button
              onClick={() => navigate('/guest')}
              className="border border-blue-600/30 text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-2"
            >
              <Eye className="w-5 h-5" />
              {translate('browse_as_guest')}
            </button>
          </div>
        </div>
      </section>

      {/* Demo Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-card p-8 md:p-10 shadow-2xl overflow-hidden"
            >
              {!demoResult ? (
                <form onSubmit={handleCreateDemo} className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold">{t.createDemo}</h2>
                    <button type="button" onClick={() => setShowDemoModal(false)} className="p-2 hover:bg-black/5 rounded-full">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold opacity-60 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> {translate('company_name')}
                      </label>
                      <input
                        required
                        type="text"
                        value={demoForm.companyName}
                        onChange={e => setDemoForm({ ...demoForm, companyName: e.target.value })}
                        className="w-full bg-black/5 border border-[var(--border-soft)] p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. ZIEN Tech"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold opacity-60 flex items-center gap-2">
                        <Users2 className="w-4 h-4" /> {translate('employees')}
                      </label>
                      <input
                        required
                        type="number"
                        value={demoForm.employees}
                        onChange={e => setDemoForm({ ...demoForm, employees: e.target.value })}
                        className="w-full bg-black/5 border border-[var(--border-soft)] p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold opacity-60 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> {translate('requested_services')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Accounting', 'HR', 'CRM', 'Logistics', 'AI Assistant'].map(service => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => {
                            const services = demoForm.services.includes(service)
                              ? demoForm.services.filter(s => s !== service)
                              : [...demoForm.services, service];
                            setDemoForm({ ...demoForm, services });
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${demoForm.services.includes(service)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-black/5 border-[var(--border-soft)] hover:border-blue-400'
                            }`}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold opacity-60 flex items-center gap-2">
                      <Upload className="w-4 h-4" /> {translate('attach_images')}
                    </label>
                    <label className="w-full border-2 border-dashed border-[var(--border-soft)] p-8 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-all">
                      <input
                        type="file"
                        className="hidden"
                        onChange={e => setDemoForm({ ...demoForm, image: e.target.files?.[0] || null })}
                      />
                      <Upload className={`w-8 h-8 mb-2 ${demoForm.image ? 'text-green-500' : 'text-blue-600'}`} />
                      <span className="text-xs font-bold">{demoForm.image ? demoForm.image.name : translate('click_upload')}</span>
                    </label>
                  </div>

                  <button
                    disabled={demoLoading}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex flex-col items-center justify-center gap-2 min-h-[80px]"
                  >
                    {demoLoading ? (
                      <>
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>{demoSteps[demoStep]}</span>
                        </div>
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mt-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((demoStep + 1) / demoSteps.length) * 100}%` }}
                            className="h-full bg-white"
                          />
                        </div>
                      </>
                    ) : t.createDemo}
                  </button>

                  {demoError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{demoError}</span>
                    </div>
                  )}
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="w-8 h-8" /> {translate('demo_success')}
                    </h2>
                    <button onClick={() => setShowDemoModal(false)} className="p-2 hover:bg-black/5 rounded-full">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="glass-card p-6 border-green-500/20 space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
                      <span className="text-sm font-bold opacity-60">{translate('company_name')}</span>
                      <span className="font-bold">{demoForm.companyName}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
                      <span className="text-sm font-bold opacity-60">{translate('employees')}</span>
                      <span className="font-bold">{demoForm.employees}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
                      <span className="text-sm font-bold opacity-60">{translate('company_id')}</span>
                      <span className="font-bold font-mono text-xs">{demoResult.companyId.substring(0, 12)}...</span>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-bold opacity-60">{translate('active_services')}</span>
                      <div className="flex flex-wrap gap-2">
                        {demoForm.services.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate('/register')}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
                    >
                      {translate('start_free')}
                    </button>
                    <button
                      onClick={() => { setDemoResult(null); setDemoError(null); }}
                      className="px-8 py-4 glass-card rounded-2xl font-bold hover:bg-black/5 transition-all"
                    >
                      {translate('edit_data')}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{translate('features_title')}</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              {translate('features_subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: translate('accounting'),
                desc: translate('accounting_desc'),
                icon: BarChart3
              },
              {
                title: translate('crm_sales'),
                desc: translate('crm_sales_desc'),
                icon: Users
              },
              {
                title: translate('hr'),
                desc: translate('hr_desc'),
                icon: Shield
              },
              {
                title: translate('logistics'),
                desc: translate('logistics_desc'),
                icon: Globe2
              },
              {
                title: "RARE AI",
                desc: translate('rare_ai_desc'),
                icon: Zap
              },
              {
                title: translate('security'),
                desc: translate('security_desc'),
                icon: ShieldCheck
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 hover:border-blue-500/50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
