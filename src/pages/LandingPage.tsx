import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import { ThemeVariant, Language, ThemeMode } from '../types';
import { supabase } from '../services/supabase';
import { 
  Globe, Moon, Sun, Layout, ShieldCheck, Zap, 
  ArrowRight, Menu, X, CheckCircle2, Star, 
  ChevronLeft, ChevronRight, Play, Users, 
  BarChart3, Shield, Globe2, Upload, Loader2,
  Building2, Users2, Briefcase, Check, Copy
} from 'lucide-react';

export default function LandingPage({ onNavigate }: { onNavigate: (to: string) => void }) {
  const { language, mode, variant, setMode, setVariant, setLanguage, t: translate } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Demo States
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoStep, setDemoStep] = useState(1);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<any>(null);
  const [demoForm, setDemoForm] = useState({
    companyName: '',
    industry: '',
    services: [] as string[],
    addons: [] as string[],
    notes: ''
  });

  const slides = [
    {
      title: translate('hero_title_1') !== 'hero_title_1' ? translate('hero_title_1') : translate('hero_title'),
      subtitle: translate('hero_sub_1') !== 'hero_sub_1' ? translate('hero_sub_1') : translate('hero_sub'),
      image: ASSETS.LANDING_1,
      accent: "blue"
    },
    {
      title: translate('hero_title_2') !== 'hero_title_2' ? translate('hero_title_2') : translate('hero_title'),
      subtitle: translate('hero_sub_2') !== 'hero_sub_2' ? translate('hero_sub_2') : translate('hero_sub'),
      image: ASSETS.LANDING_2,
      accent: "cyan"
    },
    {
      title: translate('hero_title_3') !== 'hero_title_3' ? translate('hero_title_3') : translate('hero_title'),
      subtitle: translate('hero_sub_3') !== 'hero_sub_3' ? translate('hero_sub_3') : translate('hero_sub'),
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

  const handleCreateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demoStep < 3) {
      setDemoStep(demoStep + 1);
      return;
    }
    setDemoLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data, error } = await supabase
        .from('demo_requests')
        .insert([
          {
            company_name: demoForm.companyName,
            industry: demoForm.industry,
            services: demoForm.services,
            addons: demoForm.addons,
            notes: demoForm.notes,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating demo:', error);
        // Fallback for demo purposes if table doesn't exist
        setDemoResult({
          ...demoForm,
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          timestamp: new Date().toLocaleString(),
          demoUrl: `https://demo.zien-ai.app/${demoForm.companyName.toLowerCase().replace(/\s+/g, '-')}`
        });
      } else {
        setDemoResult({
          ...demoForm,
          id: data.id,
          timestamp: new Date(data.created_at).toLocaleString(),
          demoUrl: `https://demo.zien-ai.app/${demoForm.companyName.toLowerCase().replace(/\s+/g, '-')}`
        });
      }
    } catch (err) {
       console.error('Unexpected error:', err);
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
    industries: translate('industries'),
    rareAi: language === 'ar' ? 'مدعوم بذكاء RARE' : "Powered by RARE AI",
    createDemo: language === 'ar' ? 'إنشاء ديمو مخصص' : 'Create Custom Demo',
    joinNow: language === 'ar' ? 'انضم الآن' : 'Join Now'
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Slider */}
      <section className="pt-12 pb-20 px-6 relative overflow-hidden min-h-[90vh] flex items-center">
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
                  onClick={() => onNavigate('/register')}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center gap-2"
                >
                  {t.joinNow}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowDemoModal(true)}
                  className="glass-card px-8 py-4 rounded-2xl font-bold text-lg hover:bg-black/5 transition-all flex items-center gap-2 border-blue-500/30 hover:border-blue-500"
                >
                  <Play className="w-5 h-5 text-blue-600" />
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
                    <div className="text-sm font-bold text-blue-600">RARE AI Active</div>
                    <div className="text-xs text-[var(--text-secondary)]">Intelligent Enterprise Shield</div>
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
          <div key="demo-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200 dark:border-zinc-800"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 border-b border-[var(--border-soft)] flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    <Zap className="w-8 h-8 text-blue-600" />
                    {t.createDemo}
                  </h2>
                  <p className="text-[var(--text-secondary)] mt-1">
                    {language === 'ar' ? 'قم ببناء بيئة تجريبية مخصصة لشركتك في ثوانٍ.' : 'Build a custom demo environment for your company in seconds.'}
                  </p>
                </div>
                <button type="button" onClick={() => setShowDemoModal(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                {!demoResult ? (
                  <form onSubmit={handleCreateDemo} className="space-y-8">
                    
                    <div className="flex items-center gap-2 mb-4">
                      {[1, 2, 3].map(s => (
                        <div key={s} className={`h-1.5 rounded-full transition-all ${demoStep >= s ? 'w-8 bg-blue-600' : 'w-4 bg-zinc-200 dark:bg-zinc-800'}`} />
                      ))}
                    </div>

                    {demoStep === 1 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <h3 className="text-lg font-bold border-b border-[var(--border-soft)] pb-2 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          {language === 'ar' ? 'معلومات الشركة' : 'Company Information'}
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-[var(--text-primary)]">
                              {language === 'ar' ? 'اسم الشركة' : 'Company Name'} <span className="text-red-500">*</span>
                            </label>
                            <input 
                              required
                              type="text" 
                              value={demoForm.companyName}
                              onChange={e => setDemoForm({...demoForm, companyName: e.target.value})}
                              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-[var(--border-soft)] p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-[var(--text-primary)]"
                              placeholder="e.g. ZIEN Tech"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-[var(--text-primary)]">
                              {language === 'ar' ? 'قطاع العمل' : 'Industry'} <span className="text-red-500">*</span>
                            </label>
                            <select 
                              required
                              value={demoForm.industry}
                              onChange={e => setDemoForm({...demoForm, industry: e.target.value})}
                              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-[var(--border-soft)] p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand transition-all appearance-none text-[var(--text-primary)]"
                            >
                              <option value="">{language === 'ar' ? 'اختر القطاع...' : 'Select Industry...'}</option>
                              <option value="Retail">{language === 'ar' ? 'تجزئة / سوبر ماركت' : 'Retail / Supermarket'}</option>
                              <option value="Manufacturing">{language === 'ar' ? 'صناعة / مصانع' : 'Manufacturing / Factories'}</option>
                              <option value="Agricultural">{language === 'ar' ? 'زراعية' : 'Agricultural'}</option>
                              <option value="Insurance">{language === 'ar' ? 'تأمينية' : 'Insurance'}</option>
                              <option value="Banking">{language === 'ar' ? 'مصارف وبنوك' : 'Banking & Finance'}</option>
                              <option value="NGO">{language === 'ar' ? 'هيئات خيرية ودولية' : 'Charities & NGOs'}</option>
                              <option value="Contracting">{language === 'ar' ? 'مقاولات' : 'Contracting'}</option>
                              <option value="RealEstate">{language === 'ar' ? 'عقارات' : 'Real Estate'}</option>
                              <option value="Consulting">{language === 'ar' ? 'استشارات / خدمات' : 'Consulting / Services'}</option>
                              <option value="Trading">{language === 'ar' ? 'تجارة / استيراد وتصدير' : 'Trading / Import & Export'}</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {demoStep === 2 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <h3 className="text-lg font-bold border-b border-[var(--border-soft)] pb-2 flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-brand" />
                          {language === 'ar' ? 'تخصيص الوحدات الأساسية' : 'Core Modules Customization'}
                        </h3>
                        <div className="space-y-4">
                          <label className="text-sm font-bold text-[var(--text-primary)]">
                            {language === 'ar' ? 'اختر الخدمات التي ترغب في تجربتها:' : 'Select the services you want to try:'} <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { id: 'Accounting', icon: BarChart3, label: language === 'ar' ? 'المحاسبة والمالية' : 'Accounting & Finance' },
                              { id: 'HR', icon: Users, label: language === 'ar' ? 'الموارد البشرية' : 'HR & Payroll' },
                              { id: 'CRM', icon: Globe2, label: language === 'ar' ? 'إدارة العملاء والمبيعات' : 'CRM & Sales' },
                              { id: 'Logistics', icon: Zap, label: language === 'ar' ? 'العمليات الميدانية' : 'Field Operations' },
                              { id: 'Inventory', icon: Building2, label: language === 'ar' ? 'أنظمة المخزون' : 'Inventory Management' },
                              { id: 'PR', icon: Users2, label: language === 'ar' ? 'العلاقات العامة' : 'PR & External Relations' },
                              { id: 'ConsultingSys', icon: Briefcase, label: language === 'ar' ? 'أنظمة الاستشارات' : 'Consulting Systems' },
                              { id: 'Store', icon: Layout, label: language === 'ar' ? 'المتجر الإلكتروني' : 'E-Commerce Store' }
                            ].map(service => {
                              const isSelected = demoForm.services.includes(service.id);
                              const Icon = service.icon;
                              return (
                                <button
                                  key={service.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) setDemoForm({...demoForm, services: demoForm.services.filter(s => s !== service.id)});
                                    else setDemoForm({...demoForm, services: [...demoForm.services, service.id]});
                                  }}
                                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center group ${isSelected ? 'border-blue-600 bg-blue-600/10' : 'border-[var(--border-soft)] hover:border-blue-600/50'}`}
                                >
                                  <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-[var(--text-secondary)]'}`} />
                                  <span className={`text-xs font-bold ${isSelected ? 'text-blue-600' : 'text-[var(--text-secondary)]'}`}>{service.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {demoStep === 3 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <h3 className="text-lg font-bold border-b border-[var(--border-soft)] pb-2 flex items-center gap-2">
                          <Globe2 className="w-5 h-5 text-blue-600" />
                          {language === 'ar' ? 'التكاملات والبيانات' : 'Integrations & Data'}
                        </h3>
                        <div className="space-y-4">
                          <label className="text-sm font-bold text-[var(--text-primary)]">
                            {language === 'ar' ? 'اختر التكاملات المطلوبة:' : 'Select required integrations:'}
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'Stripe', label: 'Stripe Payments' },
                              { id: 'Google', label: 'Google Maps & APIs' },
                              { id: 'Meta', label: 'Meta (FB/IG/WA)' },
                              { id: 'Vonage', label: 'Vonage Video/SMS' }
                            ].map(addon => (
                              <label key={addon.id} className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-soft)] cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--text-primary)]">
                                <input 
                                  type="checkbox" 
                                  checked={demoForm.addons.includes(addon.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setDemoForm({...demoForm, addons: [...demoForm.addons, addon.id]});
                                    else setDemoForm({...demoForm, addons: demoForm.addons.filter(a => a !== addon.id)});
                                  }}
                                  className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" 
                                />
                                <span className="text-sm font-bold">{addon.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-[var(--text-primary)]">
                            {language === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}
                          </label>
                          <textarea 
                            value={demoForm.notes}
                            onChange={e => setDemoForm({...demoForm, notes: e.target.value})}
                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-[var(--border-soft)] p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px] text-[var(--text-primary)]"
                            placeholder={language === 'ar' ? 'أي متطلبات خاصة؟' : 'Any special requirements?'}
                          />
                        </div>
                      </motion.div>
                    )}

                    <div className="flex items-center gap-4 pt-4">
                      {demoStep > 1 && (
                        <button 
                          type="button"
                          onClick={() => setDemoStep(demoStep - 1)}
                          className="flex-1 py-4 border-2 border-[var(--border-soft)] rounded-2xl font-bold hover:bg-black/5 transition-all text-[var(--text-primary)]"
                        >
                          {language === 'ar' ? 'السابق' : 'Previous'}
                        </button>
                      )}
                      <button 
                        disabled={demoLoading || (demoStep === 1 && !demoForm.companyName) || (demoStep === 2 && demoForm.services.length === 0)}
                        className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        {demoLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>{language === 'ar' ? 'جاري التجهيز...' : 'Provisioning...'}</span>
                          </>
                        ) : (
                          <span>{demoStep === 3 ? (language === 'ar' ? 'إنشاء الديمو الآن' : 'Create Demo Now') : (language === 'ar' ? 'التالي' : 'Next')}</span>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 space-y-8"
                  >
                    <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black mb-2">{language === 'ar' ? 'تم إنشاء الديمو بنجاح!' : 'Demo Created Successfully!'}</h3>
                      <p className="text-[var(--text-secondary)]">{language === 'ar' ? 'بيئتك التجريبية جاهزة الآن. يمكنك الوصول إليها عبر الرابط التالي:' : 'Your demo environment is ready. You can access it via the following link:'}</p>
                    </div>
                    
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-[var(--border-soft)] space-y-4">
                      <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-[var(--border-soft)]">
                        <code className="text-blue-600 font-bold truncate">{demoResult.demoUrl}</code>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(demoResult.demoUrl);
                            alert(language === 'ar' ? 'تم النسخ!' : 'Copied!');
                          }}
                          className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-zinc-500">
                        <Zap className="w-4 h-4" />
                        <span>ID: {demoResult.id}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => window.open(demoResult.demoUrl, '_blank')}
                        className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
                      >
                        {language === 'ar' ? 'دخول الديمو الآن' : 'Enter Demo Now'}
                      </button>
                      <button 
                        onClick={() => { setShowDemoModal(false); setDemoResult(null); setDemoStep(1); }}
                        className="w-full py-4 font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
                      >
                        {language === 'ar' ? 'إغلاق' : 'Close'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modular Suite / Features Grid */}
      <section id="features" className="py-20 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{language === 'ar' ? 'مجموعة الوحدات المتكاملة' : 'Integrated Modular Suite'}</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              {language === 'ar' ? 'كل ما تحتاجه لإدارة أعمالك في منصة واحدة مدعومة بالذكاء الاصطناعي.' : 'Everything you need to manage your business in one AI-powered platform.'}
            </p>
          </div>

          <div className="grid md:grid-cols-6 lg:grid-cols-12 gap-6">
            {[
              { 
                title: language === 'ar' ? "المحاسبة والمالية" : "Accounting & Finance", 
                desc: language === 'ar' ? "إدارة الفواتير، المدفوعات، الاشتراكات، وإعدادات الضرائب حسب الدولة." : "Manage invoices, payments, subscriptions, and tax settings by country.", 
                icon: BarChart3,
                span: "md:col-span-3 lg:col-span-4"
              },
              { 
                title: language === 'ar' ? "المبيعات والتسويق" : "Sales & Marketing", 
                desc: language === 'ar' ? "إدارة علاقات العملاء (CRM)، عروض الأسعار، العقود، وبوابة العملاء." : "CRM, quotes, contracts, and a dedicated client portal.", 
                icon: Users,
                span: "md:col-span-3 lg:col-span-4"
              },
              { 
                title: language === 'ar' ? "RARE AI Agents" : "RARE AI Agents", 
                desc: language === 'ar' ? "وكلاء ذكاء اصطناعي متخصصون للتحليلات والتوصيات الذكية." : "Specialized AI agents for smart analytics and recommendations.", 
                icon: Zap,
                span: "md:col-span-6 lg:col-span-4",
                highlight: true
              },
              { 
                title: language === 'ar' ? "الموارد البشرية" : "Human Resources", 
                desc: language === 'ar' ? "ملفات الموظفين، التوظيف، الحضور، الرواتب، والإجازات." : "Employee files, hiring, attendance, payroll, and leaves.", 
                icon: Shield,
                span: "md:col-span-2 lg:col-span-3"
              },
              { 
                title: language === 'ar' ? "العمليات الميدانية" : "Field Operations", 
                desc: language === 'ar' ? "تتبع الخرائط، إدارة المركبات، ودعم CarPlay/Android Auto." : "Map tracking, vehicle management, and CarPlay/Android Auto support.", 
                icon: Globe2,
                span: "md:col-span-2 lg:col-span-3"
              },
              { 
                title: language === 'ar' ? "الاجتماعات والدردشة" : "Meetings & Chat", 
                desc: language === 'ar' ? "اجتماعات الأقسام، دردشة خاصة/جماعية، وملخصات AI." : "Department meetings, private/group chat, and AI summaries.", 
                icon: Users2,
                span: "md:col-span-2 lg:col-span-3"
              },
              { 
                title: language === 'ar' ? "بوابة الموظف" : "Employee Portal", 
                desc: language === 'ar' ? "بوابة شخصية لكل موظف للوصول إلى بياناته الخاصة." : "Personal portal for each employee to access their private data.", 
                icon: ShieldCheck,
                span: "md:col-span-6 lg:col-span-3"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`${feature.span} glass-card p-8 hover:border-blue-600/50 transition-all group relative overflow-hidden ${feature.highlight ? 'bg-blue-600/5 border-blue-600/20' : ''}`}
              >
                {feature.highlight && (
                  <div className="absolute top-0 right-0 p-4">
                    <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                      Premium
                    </div>
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.highlight ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-brand/10 text-brand'}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <button 
              onClick={() => onNavigate('/features')}
              className="inline-flex items-center gap-2 text-brand font-bold hover:gap-3 transition-all"
            >
              {language === 'ar' ? 'عرض جميع الميزات بالتفصيل' : 'View all features in detail'} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[var(--border-soft)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2 opacity-50">
            <img src={ASSETS.LOGO_PRIMARY} alt="Logo" className="w-8 h-8 object-contain grayscale" {...IMAGE_PROPS} />
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs font-bold">
            {[
              { label: translate('features'), path: '/features' },
              { label: translate('industries'), path: '/industries' },
              { label: 'Academy', path: '/academy' },
              { label: 'Help', path: '/help' },
              { label: 'Contact', path: '/contact' },
              { label: translate('privacy'), path: '/privacy' },
              { label: translate('terms'), path: '/terms' },
              { label: 'Founder', path: '/owner', hidden: true },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`px-4 py-2 rounded-full glass-card border border-[var(--border-soft)] hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 ${
                  link.hidden ? 'opacity-0 hover:opacity-100' : ''
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            © 2024 ZIEN AI. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </div>
        </div>
      </footer>
    </div>
  );
}
