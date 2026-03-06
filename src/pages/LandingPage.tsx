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
  Building2, Users2, Briefcase, AlertCircle
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

  const slides = [
    {
      title: translate('hero_title_1'),
      subtitle: translate('hero_sub_1'),
      image: ASSETS.LANDING_1,
      accent: "blue"
    },
    {
      title: translate('hero_title_2'),
      subtitle: translate('hero_sub_2'),
      image: ASSETS.LANDING_2,
      accent: "cyan"
    },
    {
      title: translate('hero_title_3'),
      subtitle: translate('hero_sub_3'),
      image: ASSETS.MODULES_OVERVIEW,
      accent: "indigo"
    }
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
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
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
    heroTitle: slides[currentSlide].title,
    heroSub: slides[currentSlide].subtitle,
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
      <section className="pt-32 pb-20 px-6 relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
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
              <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-lg leading-relaxed">
                {t.heroSub}
              </p>
              <div className="flex flex-wrap gap-4">
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
              </div>
            </motion.div>
          </AnimatePresence>

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
                  src={slides[currentSlide].image}
                  alt="Platform"
                  className="w-full h-full object-cover rounded-[2.8rem] bg-white"
                  {...IMAGE_PROPS}
                />
              </div>

              {/* Floating AI Agent Card */}
              <div className="absolute -bottom-6 -left-6 glass-card p-6 max-w-xs animate-bounce-slow">
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
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 h-3 rounded-full transition-all ${currentSlide === i ? 'bg-blue-600 w-8' : 'bg-black/20'}`}
            />
          ))}
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

                  <div className="aspect-video rounded-3xl bg-slate-900 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent" />
                    <div className="z-10 text-center">
                      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md group-hover:scale-110 transition-transform cursor-pointer">
                        <Play className="w-8 h-8 text-white fill-current" />
                      </div>
                      <p className="text-white font-bold">{translate('watch_demo')}</p>
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

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[var(--border-soft)]">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <img src={ASSETS.LOGO_PRIMARY} alt="Logo" className="w-8 h-8 object-contain grayscale" {...IMAGE_PROPS} />
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap justify-center gap-3 text-xs font-bold">
            {[
              { label: translate('features'), path: '/features' },
              { label: translate('industries'), path: '/industries' },
              { label: translate('pricing'), path: '/pricing' },
              { label: translate('academy'), path: '/academy' },
              { label: translate('help'), path: '/help' },
              { label: translate('contact'), path: '/contact' },
              { label: translate('privacy'), path: '/privacy' },
              { label: translate('terms'), path: '/terms' },
              { label: 'Founder', path: '/owner', hidden: true },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`px-4 py-2 rounded-full glass-card border border-[var(--border-soft)] hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 ${link.hidden ? 'opacity-0 hover:opacity-100' : ''
                  }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* WhatsApp Support Links */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: translate('technical_support'), url: 'https://chat.whatsapp.com/H8W70Tq6ppF0pXvG2LfvJP?mode=gi_t' },
              { label: translate('customer_service'), url: 'https://chat.whatsapp.com/HfZlteCotW8Bi6ZsD4GJLs?mode=gi_t' },
              { label: translate('complaints_suggestions'), url: 'https://chat.whatsapp.com/IPu6Tmht8v1GTOwFxZO1Zz?mode=gi_t' },
            ].map((wa) => (
              <a
                key={wa.url}
                href={wa.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {wa.label}
              </a>
            ))}
          </div>

          {/* Emails */}
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[var(--text-secondary)]">
            <a href="mailto:INFO@ZIEN-AI.APP" className="hover:text-blue-600 transition-colors font-medium">INFO@ZIEN-AI.APP</a>
            <span className="text-[var(--border-soft)]">|</span>
            <a href="mailto:GM@ZIEN-AI.APP" className="hover:text-blue-600 transition-colors font-medium">GM@ZIEN-AI.APP</a>
          </div>

          <div className="text-sm text-[var(--text-secondary)]">
            © 2024 ZIEN AI. {translate('all_rights_reserved')}
          </div>
        </div>
      </footer>
    </div>
  );
}
