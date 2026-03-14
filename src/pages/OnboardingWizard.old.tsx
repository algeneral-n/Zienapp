import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, User, ShieldCheck, CreditCard,
  Check, ArrowRight, ArrowLeft, Upload,
  Briefcase, Zap, Shield, Loader2,
  Store, Factory, HardHat, Eye, EyeOff, CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import { supabase } from '../services/supabase';
import { provisioningService, type ProvisioningResult, type ProvisioningStatus } from '../services/provisioningService';
import { getPlans, orchestratePayment, type Plan } from '../services/billingService';

const industryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  store: Store,
  factory: Factory,
  'hard-hat': HardHat,
  briefcase: Briefcase,
  building: Building2,
};

// ─── Available modules per industry ─────────────────────────────────────────
const INDUSTRY_MODULES: Record<string, { code: string; name_en: string; name_ar: string; default: boolean }[]> = {
  supermarket: [
    { code: 'hr', name_en: 'HR & Employees', name_ar: 'الموارد البشرية', default: true },
    { code: 'accounting', name_en: 'Accounting', name_ar: 'المحاسبة', default: true },
    { code: 'store', name_en: 'Store & POS', name_ar: 'المتجر ونقاط البيع', default: true },
    { code: 'inventory', name_en: 'Inventory', name_ar: 'إدارة المخزون', default: true },
    { code: 'crm', name_en: 'CRM', name_ar: 'إدارة العملاء', default: false },
    { code: 'integrations', name_en: 'Integrations', name_ar: 'التكاملات', default: false },
  ],
  industrial: [
    { code: 'hr', name_en: 'HR & Employees', name_ar: 'الموارد البشرية', default: true },
    { code: 'accounting', name_en: 'Accounting', name_ar: 'المحاسبة', default: true },
    { code: 'inventory', name_en: 'Inventory', name_ar: 'إدارة المخزون', default: true },
    { code: 'projects', name_en: 'Projects', name_ar: 'إدارة المشاريع', default: true },
    { code: 'quality', name_en: 'Quality Control', name_ar: 'مراقبة الجودة', default: false },
    { code: 'integrations', name_en: 'Integrations', name_ar: 'التكاملات', default: false },
  ],
  engineering: [
    { code: 'hr', name_en: 'HR & Employees', name_ar: 'الموارد البشرية', default: true },
    { code: 'accounting', name_en: 'Accounting', name_ar: 'المحاسبة', default: true },
    { code: 'projects', name_en: 'Projects', name_ar: 'إدارة المشاريع', default: true },
    { code: 'crm', name_en: 'CRM', name_ar: 'إدارة العملاء', default: true },
    { code: 'documents', name_en: 'Documents', name_ar: 'إدارة الوثائق', default: false },
    { code: 'integrations', name_en: 'Integrations', name_ar: 'التكاملات', default: false },
  ],
  trading: [
    { code: 'hr', name_en: 'HR & Employees', name_ar: 'الموارد البشرية', default: true },
    { code: 'accounting', name_en: 'Accounting', name_ar: 'المحاسبة', default: true },
    { code: 'store', name_en: 'Store & POS', name_ar: 'المتجر ونقاط البيع', default: true },
    { code: 'crm', name_en: 'CRM', name_ar: 'إدارة العملاء', default: true },
    { code: 'inventory', name_en: 'Inventory', name_ar: 'إدارة المخزون', default: false },
    { code: 'integrations', name_en: 'Integrations', name_ar: 'التكاملات', default: false },
  ],
  commercial: [
    { code: 'hr', name_en: 'HR & Employees', name_ar: 'الموارد البشرية', default: true },
    { code: 'accounting', name_en: 'Accounting', name_ar: 'المحاسبة', default: true },
    { code: 'store', name_en: 'Store & POS', name_ar: 'المتجر ونقاط البيع', default: true },
    { code: 'crm', name_en: 'CRM', name_ar: 'إدارة العملاء', default: true },
    { code: 'inventory', name_en: 'Inventory', name_ar: 'إدارة المخزون', default: true },
    { code: 'integrations', name_en: 'Integrations', name_ar: 'التكاملات', default: false },
  ],
};

// Pricing plans are now fetched dynamically from the billing API

export default function OnboardingWizard() {
  const { language, t: translate } = useTheme();

  const steps = [
    { id: 'company', title: language === 'ar' ? 'معلومات الشركة' : 'Company Info', icon: Building2 },
    { id: 'manager', title: language === 'ar' ? 'حساب المدير' : 'GM Account', icon: User },
    { id: 'industry', title: language === 'ar' ? 'القطاع والوحدات' : 'Industry & Modules', icon: Zap },
    { id: 'docs', title: language === 'ar' ? 'رفع المستندات' : 'Upload Docs', icon: Upload },
    { id: 'billing', title: language === 'ar' ? 'الخطة والدفع' : 'Plan & Payment', icon: CreditCard },
    { id: 'terms', title: language === 'ar' ? 'الشروط والتأكيد' : 'Terms & Confirm', icon: ShieldCheck },
  ];

  const industries = [
    { id: 'supermarket', name: language === 'ar' ? 'سوبر ماركت / تجزئة' : 'Supermarket / Retail', icon: 'store' },
    { id: 'industrial', name: language === 'ar' ? 'صناعي / مصنع' : 'Industrial / Factory', icon: 'factory' },
    { id: 'engineering', name: language === 'ar' ? 'استشارات هندسية' : 'Engineering Consultancy', icon: 'hard-hat' },
    { id: 'trading', name: language === 'ar' ? 'شركة تجارية' : 'Trading Company', icon: 'briefcase' },
    { id: 'commercial', name: language === 'ar' ? 'مركز تجاري / مول' : 'Commercial Center / Mall', icon: 'building' },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [provisioningResult, setProvisioningResult] = useState<ProvisioningResult | null>(null);
  const [provisioningStatus, setProvisioningStatus] = useState<ProvisioningStatus | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [employeeCount, setEmployeeCount] = useState('1-10');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [fetchingPlans, setFetchingPlans] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    companyNameAr: '',
    tradeLicenseNumber: '',
    country: '',
    city: '',
    industry: '',
    gmName: '',
    gmEmail: '',
    gmPassword: '',
    gmPasswordConfirm: '',
    agreedToTerms: false,
    plan: 'pro',
    licenseFile: null as File | null,
    idFile: null as File | null,
  });

  // Auto-select default modules when industry changes
  useEffect(() => {
    if (formData.industry && INDUSTRY_MODULES[formData.industry]) {
      const defaults = INDUSTRY_MODULES[formData.industry].filter(m => m.default).map(m => m.code);
      setSelectedModules(defaults);
    }
  }, [formData.industry]);

  // Poll provisioning status
  useEffect(() => {
    if (!provisioningResult || provisioningResult.status === 'done' || provisioningResult.status === 'error') return;
    const interval = setInterval(async () => {
      try {
        const status = await provisioningService.getStatus(provisioningResult.jobId);
        setProvisioningStatus(status);
        if (status.status === 'done' || status.status === 'error') clearInterval(interval);
      } catch { /* ignore polling errors */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [provisioningResult]);

  // Fetch plans from billing API on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetchingPlans(true);
      try {
        const { plans: fetched } = await getPlans();
        if (!cancelled) setPlans(fetched.filter(p => p.is_active));
      } catch {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setFetchingPlans(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Dynamic pricing from API plans
  const selectedPlan = plans.find(p => p.code === formData.plan) || plans[0];
  const planPrice = selectedPlan
    ? (billingCycle === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly)
    : 0;
  const planCurrency = selectedPlan?.currency || 'AED';

  const toggleModule = (code: string) => {
    setSelectedModules(prev => prev.includes(code) ? prev.filter(m => m !== code) : [...prev, code]);
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0:
        if (!formData.companyName || !formData.tradeLicenseNumber || !formData.country || !formData.city) {
          setError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
          return false;
        }
        break;
      case 1:
        if (!formData.gmName || !formData.gmEmail || !formData.gmPassword) {
          setError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
          return false;
        }
        if (!formData.gmEmail.includes('@')) {
          setError(language === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email address');
          return false;
        }
        if (formData.gmPassword.length < 8) {
          setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
          return false;
        }
        if (formData.gmPassword !== formData.gmPasswordConfirm) {
          setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
          return false;
        }
        break;
      case 2:
        if (!formData.industry) {
          setError(language === 'ar' ? 'يرجى اختيار قطاع العمل' : 'Please select an industry');
          return false;
        }
        if (selectedModules.length === 0) {
          setError(language === 'ar' ? 'يرجى اختيار وحدة واحدة على الأقل' : 'Please select at least one module');
          return false;
        }
        break;
      case 3: break; // docs are optional
      case 4:
        if (!formData.plan) {
          setError(language === 'ar' ? 'يرجى اختيار خطة' : 'Please select a plan');
          return false;
        }
        break;
      case 5:
        if (!formData.agreedToTerms) {
          setError(language === 'ar' ? 'يجب الموافقة على الشروط للمتابعة' : 'You must agree to terms to continue');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const nextStep = async () => {
    if (!validateStep()) return;
    if (currentStep === steps.length - 1) {
      await handleCompleteRegistration();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  /** Upload a file to Supabase Storage */
  const uploadFile = async (file: File, companyId: string, docType: string): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'pdf';
    const path = `${companyId}/${docType}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('company-docs').upload(path, file, { upsert: true });
    if (upErr) { console.error(`Upload ${docType}:`, upErr.message); return null; }
    return path;
  };

  const handleCompleteRegistration = async () => {
    setLoading(true);
    setError('');
    const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

    try {
      // 1. Register company + GM user via Worker API (server-side user creation)
      const regRes = await fetch(`${API_URL}/api/auth/register-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.companyName,
          company_name_ar: formData.companyNameAr || formData.companyName,
          industry: formData.industry,
          company_type: formData.industry || 'startup',
          company_size: employeeCount,
          cr_number: formData.tradeLicenseNumber || '',
          country: formData.country,
          city: formData.city || '',
          gm_email: formData.gmEmail,
          gm_password: formData.gmPassword,
          gm_name: formData.gmName,
          gm_phone: phoneNumber || '',
          selected_modules: selectedModules,
          billing_cycle: billingCycle,
        }),
      });
      const regData = await regRes.json() as {
        success?: boolean;
        error?: string;
        company?: { id: string; name: string; slug: string };
        user?: { id: string; email: string };
        message?: string;
      };

      if (!regRes.ok || !regData.success) {
        throw new Error(regData.error || regData.message || 'Registration failed');
      }

      const companyId = regData.company!.id;
      const userId = regData.user!.id;

      // 2. Sign in with the newly created credentials
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.gmEmail,
        password: formData.gmPassword,
      });

      // 3. Upload documents (if signed in successfully)
      if (authData?.user) {
        if (formData.licenseFile) {
          const licensePath = await uploadFile(formData.licenseFile, companyId, 'trade_license');
          if (licensePath) {
            await supabase.from('companies').update({ trade_license_url: licensePath }).eq('id', companyId);
          }
        }
        if (formData.idFile) {
          await uploadFile(formData.idFile, companyId, 'gm_id');
        }
      }

      // 4. Start V2 provisioning (blueprint → plan → execute)
      const empCount = parseInt(employeeCount, 10) || 5;
      const businessSize = empCount > 200 ? 'enterprise' : empCount > 50 ? 'large' : empCount > 10 ? 'medium' : 'small';
      const v2Result = await provisioningService.startV2({
        companyId: companyId,
        country: formData.country,
        industry: formData.industry,
        employeeCount: empCount,
        requestedModules: selectedModules,
        businessSize: businessSize as 'micro' | 'small' | 'medium' | 'large' | 'enterprise',
      });

      // 7. Orchestrate payment (region-aware gateway selection)
      const regionMap: Record<string, string> = { UAE: 'AE', 'Saudi Arabia': 'SA', Egypt: 'EG', Bahrain: 'BH', Oman: 'OM', Qatar: 'QA', Kuwait: 'KW' };
      const region = regionMap[formData.country] || 'GLOBAL';
      try {
        const payResult = await orchestratePayment(
          companyId,
          formData.plan,
          region as 'AE' | 'SA' | 'EG' | 'BH' | 'OM' | 'QA' | 'KW' | 'GLOBAL',
          billingCycle,
          `${window.location.origin}/dashboard?payment=success`,
          `${window.location.origin}/dashboard?payment=cancelled`,
        );
        if (payResult.url) {
          window.location.href = payResult.url;
          return;
        }
      } catch (payErr) {
        console.warn('Payment orchestration skipped:', payErr);
      }

      // 8. Show provisioning status
      setProvisioningResult({
        tenantId: companyId,
        companyId: companyId,
        jobId: v2Result.jobId,
        status: v2Result.status as ProvisioningResult['status'],
      });
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'فشل التسجيل. حاول مرة أخرى.' : 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ─── Provisioning Status Screen ───────────────────────────────────────────

  const renderProvisioningStatus = () => {
    if (!provisioningResult) return null;
    const isDone = provisioningResult.status === 'done' || provisioningStatus?.status === 'done';
    const isError = provisioningResult.status === 'error' || provisioningStatus?.status === 'error';

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-12">
        <div className={`w-24 h-24 ${isDone ? 'bg-emerald-600/10 text-emerald-600' : isError ? 'bg-red-600/10 text-red-600' : 'bg-blue-600/10 text-blue-600'} rounded-full flex items-center justify-center mx-auto mb-8`}>
          {isDone ? <CheckCircle2 className="w-12 h-12" /> : isError ? <Shield className="w-12 h-12" /> : <Loader2 className="w-12 h-12 animate-spin" />}
        </div>
        <h2 className="text-3xl font-bold">
          {isDone ? (language === 'ar' ? 'تم تجهيز بيئة عملك بنجاح!' : 'Your Workspace is Ready!') :
            isError ? (language === 'ar' ? 'حدث خطأ أثناء التجهيز' : 'Provisioning Error') :
              (language === 'ar' ? 'جاري تجهيز بيئة عملك' : 'Provisioning Your Workspace')}
        </h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          {isDone ? (language === 'ar' ? 'تم تفعيل جميع الوحدات وإنشاء الأدوار. يمكنك الآن تسجيل الدخول.' : 'All modules activated and roles created. You can now sign in.') :
            isError ? (provisioningStatus?.error || (language === 'ar' ? 'يرجى المحاولة مرة أخرى أو التواصل مع الدعم.' : 'Please try again or contact support.')) :
              (language === 'ar' ? 'نحن نقوم بتفعيل الوحدات وإنشاء الأدوار وزرع البيانات.' : 'Activating modules, creating roles, and seeding default data.')}
        </p>
        <div className="glass-card p-6 max-w-sm mx-auto text-left space-y-3">
          {[
            { label: language === 'ar' ? 'إنشاء الحساب' : 'Account Created', done: true },
            { label: language === 'ar' ? 'إنشاء الشركة' : 'Company Created', done: true },
            { label: language === 'ar' ? 'تفعيل الوحدات' : 'Activating Modules', done: isDone },
            { label: language === 'ar' ? 'زرع البيانات' : 'Seeding Data', done: isDone },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm font-bold ${item.done ? 'text-emerald-600' : i === 2 && !isDone ? 'text-blue-600' : 'opacity-40'}`}>
              {item.done ? <Check className="w-4 h-4" /> : i === 2 && !isDone ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
              {item.label}
            </div>
          ))}
        </div>
        {isDone && (
          <button onClick={() => window.location.href = '/login'} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">
            {language === 'ar' ? 'تسجيل الدخول' : 'Sign In Now'}
          </button>
        )}
      </motion.div>
    );
  };

  // ─── Step Renderer ────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      // ═══ STEP 0: Company Info ═══
      case 0:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-6">
                <h2 className="text-3xl font-bold">{language === 'ar' ? 'أخبرنا عن شركتك' : 'Tell us about your company'}</h2>
                <p className="text-[var(--text-secondary)] text-sm">{language === 'ar' ? 'ستكون هذه المعلومات أساس بيئة عملك على ZIEN' : 'This information will form the foundation of your ZIEN workspace'}</p>
                <div className="grid gap-4">
                  <input id="company-name" name="companyName" autoComplete="organization" type="text" placeholder={language === 'ar' ? 'اسم الشركة (بالإنجليزية)' : 'Company Name (English)'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                  <input id="company-name-ar" name="companyNameAr" type="text" placeholder={language === 'ar' ? 'اسم الشركة (بالعربية)' : 'Company Name (Arabic - optional)'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" dir="rtl" value={formData.companyNameAr} onChange={e => setFormData({ ...formData, companyNameAr: e.target.value })} />
                  <input id="trade-license" name="tradeLicenseNumber" type="text" placeholder={translate('license_number')} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.tradeLicenseNumber} onChange={e => setFormData({ ...formData, tradeLicenseNumber: e.target.value })} />
                  <div className="grid grid-cols-2 gap-4">
                    <input id="country" name="country" autoComplete="country-name" type="text" placeholder={language === 'ar' ? 'الدولة' : 'Country'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                    <input id="city" name="city" autoComplete="address-level2" type="text" placeholder={language === 'ar' ? 'المدينة' : 'City'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                  </div>
                  <select id="employee-count" name="employeeCount" value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="1-10">{language === 'ar' ? '1-10 موظفين' : '1-10 Employees'}</option>
                    <option value="11-50">{language === 'ar' ? '11-50 موظف' : '11-50 Employees'}</option>
                    <option value="51-200">{language === 'ar' ? '51-200 موظف' : '51-200 Employees'}</option>
                    <option value="201+">{language === 'ar' ? '+201 موظف' : '201+ Employees'}</option>
                  </select>
                </div>
              </div>
              <div className="hidden md:block w-64 h-64 glass-card p-6 rounded-[3rem] overflow-hidden shadow-2xl relative group">
                <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
                <img src={ASSETS.LOGO_SHIELD} alt="ZIEN Shield" className="w-full h-full object-contain relative z-10 drop-shadow-2xl animate-float" {...IMAGE_PROPS} />
              </div>
            </div>
          </motion.div>
        );

      // ═══ STEP 1: GM Account ═══
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-bold">{language === 'ar' ? 'حساب المدير العام' : 'General Manager Account'}</h2>
            <p className="text-[var(--text-secondary)] text-sm">{language === 'ar' ? 'سيكون هذا حساب المدير العام مع صلاحيات كاملة' : 'This will be the GM account with full company permissions'}</p>
            <div className="grid gap-4">
              <input id="gm-name" name="gmName" autoComplete="name" type="text" placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.gmName} onChange={e => setFormData({ ...formData, gmName: e.target.value })} />
              <input id="gm-email" name="gmEmail" autoComplete="email" type="email" placeholder={language === 'ar' ? 'البريد الإلكتروني الرسمي' : 'Official Email'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.gmEmail} onChange={e => setFormData({ ...formData, gmEmail: e.target.value })} />
              <input id="gm-phone" name="phone" autoComplete="tel" type="tel" placeholder={language === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (optional)'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
              <div className="relative">
                <input id="gm-password" name="password" autoComplete="new-password" type={showPassword ? 'text' : 'password'} placeholder={language === 'ar' ? 'كلمة المرور (8 أحرف على الأقل)' : 'Password (min 8 characters)'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 pr-12" value={formData.gmPassword} onChange={e => setFormData({ ...formData, gmPassword: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <input id="gm-password-confirm" name="passwordConfirm" autoComplete="new-password" type="password" placeholder={language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.gmPasswordConfirm} onChange={e => setFormData({ ...formData, gmPasswordConfirm: e.target.value })} />
              {formData.gmPassword && formData.gmPassword.length >= 8 && formData.gmPassword === formData.gmPasswordConfirm && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold"><Check size={14} /> {language === 'ar' ? 'كلمة المرور متطابقة' : 'Passwords match'}</div>
              )}
            </div>
          </motion.div>
        );

      // ═══ STEP 2: Industry & Modules ═══
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-bold">{language === 'ar' ? 'القطاع والوحدات' : 'Industry & Modules'}</h2>
            <p className="text-[var(--text-secondary)] text-sm">{language === 'ar' ? 'اختر قطاعك وسنختار الوحدات المناسبة تلقائياً.' : "Select your industry and we'll auto-select recommended modules."}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {industries.map(ind => {
                const IconComp = industryIconMap[ind.icon];
                return (
                  <button key={ind.id} onClick={() => setFormData({ ...formData, industry: ind.id })} className={`p-4 rounded-2xl border-2 text-center transition-all ${formData.industry === ind.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10' : 'border-[var(--border-soft)] hover:border-blue-300'}`}>
                    {IconComp && <IconComp className="w-6 h-6 text-blue-600 mx-auto mb-2" />}
                    <span className="font-bold text-xs block">{ind.name}</span>
                  </button>
                );
              })}
            </div>
            {formData.industry && INDUSTRY_MODULES[formData.industry] && (
              <div className="mt-6">
                <h3 className="font-bold text-sm mb-3">{language === 'ar' ? 'الوحدات المتاحة' : 'Available Modules'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INDUSTRY_MODULES[formData.industry].map(mod => (
                    <label key={mod.code} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedModules.includes(mod.code) ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10' : 'border-[var(--border-soft)] hover:border-blue-300'}`}>
                      <input id={`module-${mod.code}`} name={`module-${mod.code}`} type="checkbox" checked={selectedModules.includes(mod.code)} onChange={() => toggleModule(mod.code)} className="w-5 h-5 rounded accent-blue-600" />
                      <div>
                        <span className="font-bold text-sm block">{language === 'ar' ? mod.name_ar : mod.name_en}</span>
                        {mod.default && <span className="text-[10px] text-blue-600 font-bold uppercase">{language === 'ar' ? 'موصى به' : 'Recommended'}</span>}
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-3">{language === 'ar' ? `${selectedModules.length} وحدات محددة` : `${selectedModules.length} modules selected`}</p>
              </div>
            )}
          </motion.div>
        );

      // ═══ STEP 3: Upload Docs ═══
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-bold">{language === 'ar' ? 'رفع المستندات' : 'Upload Documents'}</h2>
            <p className="text-[var(--text-secondary)] text-sm">{language === 'ar' ? 'هذه المستندات اختيارية لكنها تسرع عملية التحقق.' : 'These documents are optional but speed up verification.'}</p>
            <div className="grid gap-6">
              <label className="glass-card p-8 border-dashed border-2 border-blue-200 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-600/5 transition-all block rounded-2xl">
                <input id="license-file" name="licenseFile" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setFormData({ ...formData, licenseFile: e.target.files?.[0] || null })} />
                <Upload className={`w-10 h-10 mx-auto mb-4 ${formData.licenseFile ? 'text-emerald-500' : 'text-blue-600'}`} />
                <div className="font-bold">{formData.licenseFile ? formData.licenseFile.name : (language === 'ar' ? 'الرخصة التجارية' : 'Trade License')}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">PDF, JPG, PNG ({language === 'ar' ? 'حد أقصى 10MB' : 'Max 10MB'})</div>
              </label>
              <label className="glass-card p-8 border-dashed border-2 border-blue-200 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-600/5 transition-all block rounded-2xl">
                <input id="id-file" name="idFile" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setFormData({ ...formData, idFile: e.target.files?.[0] || null })} />
                <User className={`w-10 h-10 mx-auto mb-4 ${formData.idFile ? 'text-emerald-500' : 'text-blue-600'}`} />
                <div className="font-bold">{formData.idFile ? formData.idFile.name : (language === 'ar' ? 'هوية المدير العام' : 'GM Identity (Passport/ID)')}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">PDF, JPG, PNG ({language === 'ar' ? 'حد أقصى 10MB' : 'Max 10MB'})</div>
              </label>
            </div>
          </motion.div>
        );

      // ═══ STEP 4: Plan & Payment ═══
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-bold">{language === 'ar' ? 'اختر خطتك' : 'Choose Your Plan'}</h2>
            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setBillingCycle('monthly')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'glass-card hover:border-blue-300'}`}>
                {language === 'ar' ? 'شهري' : 'Monthly'}
              </button>
              <button onClick={() => setBillingCycle('yearly')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'glass-card hover:border-blue-300'}`}>
                {language === 'ar' ? 'سنوي (وفّر أكثر)' : 'Yearly (Save more)'}
              </button>
            </div>
            {/* Plan Cards */}
            {fetchingPlans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : plans.length > 0 ? (
              <div className="grid gap-4">
                {plans.map(plan => {
                  const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
                  return (
                    <button key={plan.code} onClick={() => setFormData({ ...formData, plan: plan.code })} className={`p-6 rounded-2xl border-2 text-left transition-all ${formData.plan === plan.code ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10' : 'border-[var(--border-soft)] hover:border-blue-300'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xl block">{language === 'ar' ? plan.name_ar : plan.name_en}</span>
                          <div className="flex gap-4 mt-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                            <span>{plan.max_users} {language === 'ar' ? 'مستخدم' : 'users'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold block">{price} {plan.currency}</span>
                          <span className="text-xs text-[var(--text-secondary)]">/ {billingCycle === 'yearly' ? (language === 'ar' ? 'سنة' : 'year') : (language === 'ar' ? 'شهر' : 'month')}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                <p>{language === 'ar' ? 'لم يتم تحميل الخطط. سيتم احتساب السعر عند التسجيل.' : 'Plans could not be loaded. Pricing will be calculated on registration.'}</p>
              </div>
            )}
            {/* Cost Summary */}
            <div className="glass-card p-6 rounded-2xl space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'ملخص التكلفة' : 'Cost Summary'}</h3>
              <div className="flex justify-between text-sm">
                <span>{selectedPlan ? (language === 'ar' ? selectedPlan.name_ar : selectedPlan.name_en) : formData.plan}</span>
                <span className="font-bold">{planPrice} {planCurrency}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>{selectedModules.length} {language === 'ar' ? 'وحدات' : 'modules'}</span>
                <span className="text-xs">{billingCycle === 'yearly' ? (language === 'ar' ? 'فوترة سنوية' : 'Billed yearly') : (language === 'ar' ? 'فوترة شهرية' : 'Billed monthly')}</span>
              </div>
              <div className="border-t border-[var(--border-soft)] pt-3 flex justify-between font-bold text-lg">
                <span>{billingCycle === 'yearly' ? (language === 'ar' ? 'الإجمالي السنوي' : 'Yearly Total') : (language === 'ar' ? 'الإجمالي الشهري' : 'Monthly Total')}</span>
                <span className="text-blue-600">{planPrice} {planCurrency}</span>
              </div>
            </div>
          </motion.div>
        );

      // ═══ STEP 5: Terms & Confirm ═══
      case 5:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-bold">{language === 'ar' ? 'مراجعة وتأكيد' : 'Review & Confirm'}</h2>
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">{language === 'ar' ? 'الشركة' : 'Company'}</span>
                  <span className="font-bold">{formData.companyName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">{language === 'ar' ? 'القطاع' : 'Industry'}</span>
                  <span className="font-bold capitalize">{formData.industry}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">{language === 'ar' ? 'المدير' : 'GM'}</span>
                  <span className="font-bold">{formData.gmName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">{language === 'ar' ? 'الخطة' : 'Plan'}</span>
                  <span className="font-bold">{selectedPlan ? (language === 'ar' ? selectedPlan.name_ar : selectedPlan.name_en) : formData.plan} — {planPrice} {planCurrency}/{billingCycle === 'yearly' ? (language === 'ar' ? 'سنة' : 'yr') : (language === 'ar' ? 'شهر' : 'mo')}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">{language === 'ar' ? 'الوحدات' : 'Modules'}</span>
                <div className="flex flex-wrap gap-2">
                  {selectedModules.map(code => (
                    <span key={code} className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-600/10">{code}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="glass-card p-6 h-40 overflow-y-auto text-xs text-[var(--text-secondary)] leading-relaxed rounded-2xl">
              <p className="mb-3 font-bold text-[var(--text-primary)]">{language === 'ar' ? '1. عزل البيانات وأمنها' : '1. Data Isolation & Security'}</p>
              <p className="mb-4">{language === 'ar' ? 'تطبق ZIEN عزلاً صارماً بآلية RLS. بياناتك محمية ولا يمكن لأي مستأجر آخر الوصول إليها.' : 'ZIEN employs strict RLS isolation. Your data is protected and never accessible to other tenants.'}</p>
              <p className="mb-3 font-bold text-[var(--text-primary)]">{language === 'ar' ? '2. سياسة الخصوصية' : '2. Privacy Policy'}</p>
              <p>{language === 'ar' ? 'لا نبيع بياناتك. جميع المعلومات تُستخدم فقط لتقديم وتحسين خدماتنا.' : 'We do not sell your data. All information is used solely for providing and improving our services.'}</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input id="agree-terms" name="agreedToTerms" type="checkbox" className="w-6 h-6 rounded-lg accent-blue-600" checked={formData.agreedToTerms} onChange={e => setFormData({ ...formData, agreedToTerms: e.target.checked })} />
              <span className="font-medium group-hover:text-blue-600 transition-colors">{language === 'ar' ? 'أوافق على الشروط والسياسات وأؤكد صحة البيانات' : 'I agree to the terms & policies and confirm the data is accurate'}</span>
            </label>
          </motion.div>
        );
      default:
        return null;
    }
  };

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white -translate-y-1/2 z-0" />
          <div className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} />
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i <= currentStep;
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white text-gray-400'}`}>
                  {i < currentStep ? <Check className="w-5 h-5 md:w-6 md:h-6" /> : <Icon className="w-5 h-5 md:w-6 md:h-6" />}
                </div>
                <span className={`text-[10px] md:text-xs font-bold hidden sm:block ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{step.title}</span>
              </div>
            );
          })}
        </div>

        <div className="glass-card p-8 md:p-12 min-h-[500px] flex flex-col border-blue-500/10 shadow-[0_20px_50px_rgba(59,130,246,0.1)] relative">
          {provisioningResult ? renderProvisioningStatus() : (
            <>
              {currentStep > 0 && (
                <button onClick={prevStep} className="absolute top-4 left-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all z-20" title={language === 'ar' ? 'رجوع' : 'Back'}>
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.div key={currentStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex items-center justify-end mt-12 pt-8 border-t border-[var(--border-soft)]">
                {error && <p className="text-red-500 text-xs font-bold mr-auto">{error}</p>}
                <button onClick={nextStep} disabled={loading} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (currentStep === steps.length - 1 ? (language === 'ar' ? 'إكمال التسجيل' : 'Complete Registration') : (language === 'ar' ? 'متابعة' : 'Continue'))}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
