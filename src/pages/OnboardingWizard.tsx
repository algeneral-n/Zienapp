import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, User, ShieldCheck, CreditCard,
  Check, ArrowRight, ArrowLeft, Upload,
  Zap, Shield, Loader2, Eye, EyeOff, CheckCircle2,
  Globe, FileCheck, AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import { supabase } from '../services/supabase';
import { orchestratePayment } from '../services/billingService';
import { provisioningService, type ProvisioningV2Result, type ProvisioningStatus } from '../services/provisioningService';
import { INDUSTRY_SECTORS, INDUSTRY_ICON_MAP, LEGACY_INDUSTRIES, MODULE_CATALOG } from '../data/industries';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

// ─── Industry icon mapping (from central data) ──────────────────────────────

const industryIconMap = INDUSTRY_ICON_MAP;

// ─── Country list ────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: 'AE', name_en: 'United Arab Emirates', name_ar: 'الإمارات العربية المتحدة' },
  { code: 'SA', name_en: 'Saudi Arabia', name_ar: 'المملكة العربية السعودية' },
  { code: 'EG', name_en: 'Egypt', name_ar: 'مصر' },
  { code: 'BH', name_en: 'Bahrain', name_ar: 'البحرين' },
  { code: 'OM', name_en: 'Oman', name_ar: 'عُمان' },
  { code: 'QA', name_en: 'Qatar', name_ar: 'قطر' },
  { code: 'KW', name_en: 'Kuwait', name_ar: 'الكويت' },
  { code: 'JO', name_en: 'Jordan', name_ar: 'الأردن' },
  { code: 'LB', name_en: 'Lebanon', name_ar: 'لبنان' },
  { code: 'IQ', name_en: 'Iraq', name_ar: 'العراق' },
  { code: 'MA', name_en: 'Morocco', name_ar: 'المغرب' },
  { code: 'TN', name_en: 'Tunisia', name_ar: 'تونس' },
  { code: 'TR', name_en: 'Turkey', name_ar: 'تركيا' },
  { code: 'PK', name_en: 'Pakistan', name_ar: 'باكستان' },
  { code: 'IN', name_en: 'India', name_ar: 'الهند' },
  { code: 'GB', name_en: 'United Kingdom', name_ar: 'المملكة المتحدة' },
  { code: 'US', name_en: 'United States', name_ar: 'الولايات المتحدة' },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface Industry {
  code: string;
  name_en: string;
  name_ar: string;
  recommended_modules: string[];
  default_plan: string;
  default_settings: Record<string, unknown>;
  business_sizes: string[];
}

interface Plan {
  code: string;
  name_en: string;
  name_ar: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_users: number | null;
  features: Record<string, unknown>;
}

interface VerificationResult {
  is_valid: boolean;
  confidence: number;
  document_type: string;
  details: string;
  issues: string[];
}

// ─── Fallback modules (from central catalog) ────────────────────────────────

const ALL_MODULES = MODULE_CATALOG.map(m => ({ code: m.code, name_en: m.nameEn, name_ar: m.nameAr }));

// ═════════════════════════════════════════════════════════════════════════════
export default function OnboardingWizard() {
  const { language, t: translate } = useTheme();
  const isAr = language === 'ar';

  // ─── Steps ────────────────────────────────────────────────────────────
  const steps = [
    { id: 'industry', title: isAr ? 'القطاع' : 'Industry', icon: Globe },
    { id: 'company', title: isAr ? 'الشركة' : 'Company', icon: Building2 },
    { id: 'manager', title: isAr ? 'المدير العام' : 'GM Account', icon: User },
    { id: 'modules', title: isAr ? 'الوحدات' : 'Modules', icon: Zap },
    { id: 'docs', title: isAr ? 'المستندات' : 'Documents', icon: Upload },
    { id: 'billing', title: isAr ? 'الخطة' : 'Plan', icon: CreditCard },
    { id: 'review', title: isAr ? 'مراجعة' : 'Review', icon: ShieldCheck },
  ];

  // ─── State ────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Data
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [fetchingIndustries, setFetchingIndustries] = useState(true);
  const [fetchingPlans, setFetchingPlans] = useState(false);

  // Form data
  const [companyName, setCompanyName] = useState('');
  const [companyNameAr, setCompanyNameAr] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [country, setCountry] = useState('AE');
  const [city, setCity] = useState('');
  const [employeeCount, setEmployeeCount] = useState('1-10');
  const [gmName, setGmName] = useState('');
  const [gmEmail, setGmEmail] = useState('');
  const [gmPhone, setGmPhone] = useState('');
  const [gmPassword, setGmPassword] = useState('');
  const [gmPasswordConfirm, setGmPasswordConfirm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Documents
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [licenseVerification, setLicenseVerification] = useState<VerificationResult | null>(null);
  const [idVerification, setIdVerification] = useState<VerificationResult | null>(null);
  const [verifyingLicense, setVerifyingLicense] = useState(false);
  const [verifyingId, setVerifyingId] = useState(false);

  // Auto-save
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Provisioning / result
  const [provisioningResult, setProvisioningResult] = useState<ProvisioningV2Result | null>(null);
  const [provisioningStatus, setProvisioningStatus] = useState<ProvisioningStatus | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ─── Fetch industries on mount ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setFetchingIndustries(true);
      try {
        const res = await fetch(`${API_URL}/api/onboarding/industries`);
        if (res.ok) {
          const data = (await res.json()) as { industries: Industry[] };
          if (data.industries?.length > 0) {
            setIndustries(data.industries);
            setFetchingIndustries(false);
            return;
          }
        }
      } catch {
        // fallback
      }
      // Fallback industries if API fails — use central data
      setIndustries(LEGACY_INDUSTRIES);
      setFetchingIndustries(false);
    })();
  }, []);

  // ─── Fetch plans on mount ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setFetchingPlans(true);
      try {
        const res = await fetch(`${API_URL}/api/onboarding/plans`);
        if (res.ok) {
          const data = (await res.json()) as { plans: Plan[] };
          if (data.plans?.length > 0) {
            setPlans(data.plans);
          }
        }
      } catch {
        // No plans available — show message
      }
      setFetchingPlans(false);
    })();
  }, []);

  // ─── Auto-select modules when industry changes ────────────────────────
  useEffect(() => {
    if (selectedIndustry) {
      setSelectedModules(selectedIndustry.recommended_modules || []);
      if (selectedIndustry.default_plan) {
        setSelectedPlan(selectedIndustry.default_plan);
      }
    }
  }, [selectedIndustry]);

  // ─── Provisioning polling ─────────────────────────────────────────────
  useEffect(() => {
    if (!provisioningResult?.jobId) return;
    const interval = setInterval(async () => {
      try {
        const s = await provisioningService.getStatus(provisioningResult.jobId);
        setProvisioningStatus(s);
        if (s.status === 'done' || s.status === 'error') {
          clearInterval(interval);
        }
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [provisioningResult?.jobId]);

  // ─── Auto-save (debounced) ────────────────────────────────────────────
  const autoSave = useCallback(async (stepCompleted: number) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/onboarding/save-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            application_id: applicationId || undefined,
            company_name: companyName,
            company_name_ar: companyNameAr,
            industry_code: selectedIndustry?.code || '',
            country,
            city,
            employee_count: employeeCount,
            cr_number: crNumber,
            gm_name: gmName,
            gm_email: gmEmail,
            gm_phone: gmPhone,
            selected_modules: selectedModules,
            plan_code: selectedPlan,
            billing_cycle: billingCycle,
            step_completed: stepCompleted,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { application: { id: string } };
          if (data.application?.id && !applicationId) {
            setApplicationId(data.application.id);
          }
        }
      } catch {
        // auto-save failure is non-blocking
      }
    }, 1500);
  }, [applicationId, companyName, companyNameAr, selectedIndustry, country, city, employeeCount, crNumber, gmName, gmEmail, gmPhone, selectedModules, selectedPlan, billingCycle]);

  // ─── Toggle module ────────────────────────────────────────────────────
  const toggleModule = (code: string) => {
    setSelectedModules(prev =>
      prev.includes(code) ? prev.filter(m => m !== code) : [...prev, code],
    );
  };

  // ─── Upload document to Supabase Storage + verify ─────────────────────
  const uploadAndVerify = async (file: File, docType: 'license' | 'id') => {
    const ext = file.name.split('.').pop() || 'jpg';
    const folder = applicationId || `draft-${Date.now()}`;
    const storagePath = `${folder}/${docType}_${Date.now()}.${ext}`;

    // Upload to Supabase Storage (public bucket for onboarding)
    const { error: upErr } = await supabase.storage
      .from('company-docs')
      .upload(storagePath, file, { cacheControl: '3600', upsert: true });

    if (upErr) {
      setError(isAr ? 'فشل رفع الملف. حاول مرة أخرى.' : 'Failed to upload file. Try again.');
      return;
    }

    // Save URL to auto-save
    if (docType === 'license') {
      setLicenseFile(file);
    } else {
      setIdFile(file);
    }

    // Trigger AI verification
    const setVerifying = docType === 'license' ? setVerifyingLicense : setVerifyingId;
    const setResult = docType === 'license' ? setLicenseVerification : setIdVerification;

    setVerifying(true);
    try {
      const res = await fetch(`${API_URL}/api/onboarding/verify-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId || folder,
          document_type: docType,
          file_url: storagePath,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { verification: VerificationResult };
        setResult(data.verification);
      }
    } catch {
      // verification non-blocking
    }
    setVerifying(false);
  };

  // ─── Validation ───────────────────────────────────────────────────────
  const validateStep = (): boolean => {
    setError('');
    switch (currentStep) {
      case 0: // Industry
        if (!selectedIndustry) {
          setError(isAr ? 'اختر القطاع' : 'Select an industry');
          return false;
        }
        return true;
      case 1: // Company
        if (!companyName.trim()) {
          setError(isAr ? 'أدخل اسم الشركة' : 'Enter company name');
          return false;
        }
        if (!country) {
          setError(isAr ? 'اختر الدولة' : 'Select a country');
          return false;
        }
        return true;
      case 2: // GM
        if (!gmName.trim() || !gmEmail.trim() || !gmPassword) {
          setError(isAr ? 'أكمل جميع الحقول المطلوبة' : 'Complete all required fields');
          return false;
        }
        if (gmPassword.length < 8) {
          setError(isAr ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
          return false;
        }
        if (gmPassword !== gmPasswordConfirm) {
          setError(isAr ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmEmail)) {
          setError(isAr ? 'بريد إلكتروني غير صالح' : 'Invalid email address');
          return false;
        }
        return true;
      case 3: // Modules
        if (selectedModules.length === 0) {
          setError(isAr ? 'اختر وحدة واحدة على الأقل' : 'Select at least one module');
          return false;
        }
        return true;
      case 4: // Documents — optional but encouraged
        return true;
      case 5: // Plan
        if (!selectedPlan) {
          setError(isAr ? 'اختر خطة' : 'Select a plan');
          return false;
        }
        return true;
      case 6: // Review
        if (!agreedToTerms) {
          setError(isAr ? 'يجب الموافقة على الشروط' : 'You must agree to the terms');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // ─── Navigation ───────────────────────────────────────────────────────
  const nextStep = () => {
    if (!validateStep()) return;
    if (currentStep === steps.length - 1) {
      handleSubmit();
    } else {
      const next = currentStep + 1;
      setCurrentStep(next);
      autoSave(next);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // ─── Submit registration ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError('');

    try {
      // 1. Register company + GM user via Worker API
      const regRes = await fetch(`${API_URL}/api/auth/register-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          company_name_ar: companyNameAr || companyName,
          industry: selectedIndustry?.code || '',
          company_size: employeeCount,
          cr_number: crNumber || '',
          country,
          city: city || '',
          gm_email: gmEmail,
          gm_password: gmPassword,
          gm_name: gmName,
          gm_phone: gmPhone || '',
          selected_modules: selectedModules,
          billing_cycle: billingCycle,
        }),
      });
      const regData = (await regRes.json()) as {
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

      // 2. Sign in with the newly created credentials
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: gmEmail,
        password: gmPassword,
      });

      // 3. Upload documents in the background (if signed in)
      if (authData?.user) {
        if (licenseFile) {
          const path = `${companyId}/trade_license_${Date.now()}.${licenseFile.name.split('.').pop()}`;
          const { data: uploaded } = await supabase.storage.from('company-docs').upload(path, licenseFile, { upsert: true });
          if (uploaded) {
            await supabase.from('companies').update({ business_license_url: path }).eq('id', companyId);
          }
        }
        if (idFile) {
          const path = `${companyId}/gm_id_${Date.now()}.${idFile.name.split('.').pop()}`;
          const { data: uploaded } = await supabase.storage.from('company-docs').upload(path, idFile, { upsert: true });
          if (uploaded) {
            await supabase.from('companies').update({ responsible_person_id_url: path }).eq('id', companyId);
          }
        }
      }

      // 4. Submit application record for Founder review
      if (applicationId) {
        await fetch(`${API_URL}/api/onboarding/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            application_id: applicationId,
            gm_password: '***', // Don't send real password
            agreed_to_terms: true,
          }),
        });
      }

      // 5. Start V2 provisioning
      const empCount = parseInt(employeeCount, 10) || 5;
      const businessSize = empCount > 200 ? 'enterprise' : empCount > 50 ? 'large' : empCount > 10 ? 'medium' : 'small';

      const v2Result = await provisioningService.startV2({
        companyId,
        country,
        industry: selectedIndustry?.code || '',
        employeeCount: empCount,
        requestedModules: selectedModules,
        businessSize: businessSize as 'micro' | 'small' | 'medium' | 'large' | 'enterprise',
      });

      // 6. Orchestrate payment
      const regionMap: Record<string, string> = { AE: 'AE', SA: 'SA', EG: 'EG', BH: 'BH', OM: 'OM', QA: 'QA', KW: 'KW' };
      const region = regionMap[country] || 'GLOBAL';
      try {
        const payResult = await orchestratePayment(
          companyId,
          selectedPlan,
          region as 'AE' | 'SA' | 'EG' | 'BH' | 'OM' | 'QA' | 'KW' | 'GLOBAL',
          billingCycle,
          `${window.location.origin}/dashboard?payment=success`,
          `${window.location.origin}/dashboard?payment=cancelled`,
        );
        if (payResult.url) {
          window.location.href = payResult.url;
          return;
        }
      } catch {
        // Payment skipped — show provisioning
      }

      // 7. Show provisioning status
      setProvisioningResult(v2Result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || (isAr ? 'فشل التسجيل. حاول مرة أخرى.' : 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Provisioning Status
  // ═══════════════════════════════════════════════════════════════════════

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
          {isDone ? (isAr ? 'تم تجهيز بيئة عملك بنجاح!' : 'Your Workspace is Ready!')
            : isError ? (isAr ? 'حدث خطأ أثناء التجهيز' : 'Provisioning Error')
              : (isAr ? 'جاري تجهيز بيئة عملك' : 'Provisioning Your Workspace')}
        </h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          {isDone ? (isAr ? 'تم تفعيل جميع الوحدات وإنشاء الأدوار. يمكنك الآن تسجيل الدخول.' : 'All modules activated and roles created. You can now sign in.')
            : isError ? (provisioningStatus?.error || (isAr ? 'يرجى المحاولة مرة أخرى.' : 'Please try again or contact support.'))
              : (isAr ? 'نحن نفعّل الوحدات وننشئ الأدوار ونزرع البيانات الافتراضية.' : 'Activating modules, creating roles, and seeding default data.')}
        </p>
        <div className="glass-card p-6 max-w-sm mx-auto text-left space-y-3">
          {[
            { label: isAr ? 'إنشاء الحساب' : 'Account Created', done: true },
            { label: isAr ? 'إنشاء الشركة' : 'Company Created', done: true },
            { label: isAr ? 'تفعيل الوحدات' : 'Activating Modules', done: isDone },
            { label: isAr ? 'زرع البيانات الافتراضية' : 'Seeding Data', done: isDone },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm font-bold ${item.done ? 'text-emerald-600' : i === 2 && !isDone ? 'text-blue-600' : 'opacity-40'}`}>
              {item.done ? <Check className="w-4 h-4" /> : i === 2 && !isDone ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
              {item.label}
            </div>
          ))}
        </div>
        {isDone && (
          <button onClick={() => { window.location.href = '/login'; }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">
            {isAr ? 'تسجيل الدخول' : 'Sign In Now'}
          </button>
        )}
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Submission Success
  // ═══════════════════════════════════════════════════════════════════════

  const renderSubmissionSuccess = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-12">
      <div className="w-24 h-24 bg-emerald-600/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
        <CheckCircle2 className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-bold">{isAr ? 'تم استلام طلبك بنجاح!' : 'Application Received!'}</h2>
      <p className="text-[var(--text-secondary)] max-w-md mx-auto">
        {isAr ? 'تم إرسال طلبك للمراجعة. سيتم إبلاغك بمجرد الموافقة على حسابك.' : 'Your application has been submitted for review. You will be notified once approved.'}
      </p>
      <button onClick={() => { window.location.href = '/login'; }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">
        {isAr ? 'الذهاب لتسجيل الدخول' : 'Go to Login'}
      </button>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Document upload card
  // ═══════════════════════════════════════════════════════════════════════

  const renderDocCard = (
    docType: 'license' | 'id',
    file: File | null,
    setFile: (f: File | null) => void,
    verification: VerificationResult | null,
    verifying: boolean,
    title: string,
  ) => {
    return (
      <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-soft)]">
        <label className="p-8 text-center cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-600/5 transition-all block">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              if (f) uploadAndVerify(f, docType);
            }}
          />
          <Upload className={`w-10 h-10 mx-auto mb-4 ${file ? 'text-emerald-500' : 'text-blue-600'}`} />
          <div className="font-bold text-sm">{file ? file.name : title}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">PDF, JPG, PNG — {isAr ? 'حد أقصى 10MB' : 'Max 10MB'}</div>
        </label>

        {/* Verification Status */}
        {verifying && (
          <div className="px-6 pb-4 flex items-center gap-2 text-blue-600 text-xs font-bold">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isAr ? 'جاري التحقق بالذكاء الاصطناعي...' : 'AI verifying document...'}
          </div>
        )}

        {verification && !verifying && (
          <div className={`px-6 pb-4 ${verification.is_valid ? 'text-emerald-600' : 'text-amber-600'}`}>
            <div className="flex items-center gap-2 text-xs font-bold mb-1">
              {verification.is_valid ? <FileCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {verification.is_valid
                ? (isAr ? `تم التحقق — ${verification.confidence}% ثقة` : `Verified — ${verification.confidence}% confidence`)
                : (isAr ? 'يحتاج مراجعة' : 'Needs review')}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)]">{verification.details}</p>
            {verification.issues?.length > 0 && (
              <ul className="text-[10px] text-[var(--text-secondary)] mt-1 list-disc list-inside">
                {verification.issues.map((iss, i) => <li key={i}>{iss}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Step Content
  // ═══════════════════════════════════════════════════════════════════════

  const renderStep = () => {
    switch (currentStep) {
      // ═══ STEP 0: Industry ═══
      case 0: {
        // Map selected industry code to INDUSTRY_SECTORS for sub-activities
        const activeSector = INDUSTRY_SECTORS.find(s => s.code === selectedIndustry?.code);
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">{isAr ? 'اختر قطاع عملك' : 'Select Your Industry'}</h2>
              <p className="text-[var(--text-secondary)] text-sm">{isAr ? 'سنخصص بيئة عملك والوحدات بناءً على قطاعك ونشاطك' : "We'll customize your workspace and modules based on your industry and activity"}</p>
            </div>

            {fetchingIndustries ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {industries.map(ind => {
                  const Icon = industryIconMap[ind.code] || Building2;
                  const isSelected = selectedIndustry?.code === ind.code;
                  return (
                    <button
                      key={ind.code}
                      onClick={() => setSelectedIndustry(ind)}
                      className={`p-4 rounded-2xl border-2 text-center transition-all group ${isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10 shadow-lg shadow-blue-600/10' : 'border-[var(--border-soft)] hover:border-blue-300 hover:shadow-md'}`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-blue-600' : 'text-zinc-400 group-hover:text-blue-500'} transition-colors`} />
                      <span className="font-bold text-[11px] block leading-tight">{isAr ? ind.name_ar : ind.name_en}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sub-Activities for selected sector */}
            {activeSector && activeSector.subActivities.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-500">{isAr ? 'اختر نشاطك الفرعي (اختياري)' : 'Select your sub-activity (optional)'}</h3>
                <div className="flex flex-wrap gap-2">
                  {activeSector.subActivities.map(act => (
                    <span key={act.code} className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/30 cursor-default">
                      {isAr ? act.nameAr : act.nameEn}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {selectedIndustry && (
              <div className="glass-card p-4 rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-600/5">
                <p className="text-xs text-blue-600 font-bold">
                  {isAr ? `سيتم تفعيل ${selectedIndustry.recommended_modules.length} وحدات تلقائياً لقطاع ${selectedIndustry.name_ar}` : `${selectedIndustry.recommended_modules.length} modules will be auto-selected for ${selectedIndustry.name_en}`}
                </p>
              </div>
            )}
          </motion.div>
        );
      }

      // ═══ STEP 1: Company Info ═══
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{isAr ? 'معلومات الشركة' : 'Company Information'}</h2>
                  <p className="text-[var(--text-secondary)] text-sm">{isAr ? 'ستكون هذه المعلومات أساس بيئة عملك على ZIEN' : 'This information will form the foundation of your ZIEN workspace'}</p>
                </div>
                <div className="grid gap-4">
                  <input type="text" placeholder={isAr ? 'اسم الشركة (بالإنجليزية) *' : 'Company Name (English) *'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                  <input type="text" placeholder={isAr ? 'اسم الشركة (بالعربية)' : 'Company Name (Arabic - optional)'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" dir="rtl" value={companyNameAr} onChange={e => setCompanyNameAr(e.target.value)} />
                  <input type="text" placeholder={isAr ? 'رقم الرخصة التجارية / السجل التجاري' : 'Trade License / CR Number'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={crNumber} onChange={e => setCrNumber(e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <select value={country} onChange={e => setCountry(e.target.value)} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{isAr ? c.name_ar : c.name_en}</option>
                      ))}
                    </select>
                    <input type="text" placeholder={isAr ? 'المدينة' : 'City'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={city} onChange={e => setCity(e.target.value)} />
                  </div>
                  <select value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="1-10">{isAr ? '1-10 موظفين' : '1-10 Employees'}</option>
                    <option value="11-50">{isAr ? '11-50 موظف' : '11-50 Employees'}</option>
                    <option value="51-200">{isAr ? '51-200 موظف' : '51-200 Employees'}</option>
                    <option value="201+">{isAr ? '+201 موظف' : '201+ Employees'}</option>
                  </select>
                </div>
              </div>
              <div className="hidden md:block w-48 h-48 glass-card p-6 rounded-[3rem] overflow-hidden shadow-2xl relative group flex-shrink-0">
                <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
                <img src={ASSETS.LOGO_SHIELD} alt="ZIEN" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" {...IMAGE_PROPS} />
              </div>
            </div>
          </motion.div>
        );

      // ═══ STEP 2: GM Account ═══
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">{isAr ? 'حساب المدير العام' : 'General Manager Account'}</h2>
              <p className="text-[var(--text-secondary)] text-sm">{isAr ? 'سيكون هذا حساب المدير العام مع صلاحيات كاملة' : 'This will be the GM account with full company permissions'}</p>
            </div>
            <div className="grid gap-4">
              <input type="text" placeholder={isAr ? 'الاسم الكامل *' : 'Full Name *'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={gmName} onChange={e => setGmName(e.target.value)} />
              <input type="email" placeholder={isAr ? 'البريد الإلكتروني الرسمي *' : 'Official Email *'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={gmEmail} onChange={e => setGmEmail(e.target.value)} />
              <input type="tel" placeholder={isAr ? 'رقم الهاتف (اختياري)' : 'Phone Number (optional)'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={gmPhone} onChange={e => setGmPhone(e.target.value)} />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder={isAr ? 'كلمة المرور (8 أحرف على الأقل) *' : 'Password (min 8 characters) *'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 pr-12" value={gmPassword} onChange={e => setGmPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <input type="password" placeholder={isAr ? 'تأكيد كلمة المرور *' : 'Confirm Password *'} className="w-full glass-card p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={gmPasswordConfirm} onChange={e => setGmPasswordConfirm(e.target.value)} />
              {gmPassword && gmPassword.length >= 8 && gmPassword === gmPasswordConfirm && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold"><Check size={14} />{isAr ? 'كلمة المرور متطابقة' : 'Passwords match'}</div>
              )}
            </div>
          </motion.div>
        );

      // ═══ STEP 3: Modules ═══
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">{isAr ? 'الوحدات والأنظمة' : 'Modules & Systems'}</h2>
              <p className="text-[var(--text-secondary)] text-sm">{isAr ? 'تم اختيار الوحدات الموصى بها لقطاعك تلقائياً. يمكنك التعديل.' : 'Recommended modules for your industry are pre-selected. You can customize.'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_MODULES.map(mod => {
                const isActive = selectedModules.includes(mod.code);
                const isRecommended = selectedIndustry?.recommended_modules?.includes(mod.code);
                return (
                  <label key={mod.code} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${isActive ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10' : 'border-[var(--border-soft)] hover:border-blue-300'}`}>
                    <input type="checkbox" checked={isActive} onChange={() => toggleModule(mod.code)} className="w-5 h-5 rounded accent-blue-600" />
                    <div className="flex-1">
                      <span className="font-bold text-sm block">{isAr ? mod.name_ar : mod.name_en}</span>
                      {isRecommended && <span className="text-[10px] text-blue-600 font-bold uppercase">{isAr ? 'موصى به' : 'Recommended'}</span>}
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{isAr ? `${selectedModules.length} وحدات محددة` : `${selectedModules.length} modules selected`}</p>
          </motion.div>
        );

      // ═══ STEP 4: Documents ═══
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">{isAr ? 'رفع المستندات' : 'Upload Documents'}</h2>
              <p className="text-[var(--text-secondary)] text-sm">{isAr ? 'ارفع الرخصة التجارية وهوية المدير العام للتحقق السريع. يتم فحص المستندات بالذكاء الاصطناعي.' : 'Upload your trade license and GM ID for fast verification. Documents are AI-analyzed.'}</p>
            </div>
            <div className="grid gap-6">
              {renderDocCard('license', licenseFile, setLicenseFile, licenseVerification, verifyingLicense, isAr ? 'الرخصة التجارية' : 'Trade License / Business Registration')}
              {renderDocCard('id', idFile, setIdFile, idVerification, verifyingId, isAr ? 'هوية المدير العام (جواز سفر / هوية)' : 'GM Identity (Passport / ID Card)')}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{isAr ? 'اختياري — لكن يسرّع عملية التفعيل بشكل ملحوظ' : 'Optional — but significantly speeds up account activation'}</p>
          </motion.div>
        );

      // ═══ STEP 5: Plan & Payment ═══
      case 5: {
        const currentPlan = plans.find(p => p.code === selectedPlan);
        const price = currentPlan ? (billingCycle === 'yearly' ? currentPlan.price_yearly : currentPlan.price_monthly) : 0;
        const currency = currentPlan?.currency || 'AED';

        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">{isAr ? 'اختر خطتك' : 'Choose Your Plan'}</h2>
              <p className="text-[var(--text-secondary)] text-sm">{isAr ? 'يمكنك ترقية أو تغيير الخطة لاحقاً' : 'You can upgrade or change your plan anytime'}</p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setBillingCycle('monthly')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'glass-card hover:border-blue-300'}`}>
                {isAr ? 'شهري' : 'Monthly'}
              </button>
              <button onClick={() => setBillingCycle('yearly')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'glass-card hover:border-blue-300'}`}>
                {isAr ? 'سنوي (وفّر 17%)' : 'Yearly (Save 17%)'}
              </button>
            </div>

            {/* Plans */}
            {fetchingPlans ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : plans.length > 0 ? (
              <div className="grid gap-3">
                {plans.filter(p => p.code !== 'custom').map(plan => {
                  const isSelected = selectedPlan === plan.code;
                  const planPrice = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
                  return (
                    <button key={plan.code} onClick={() => setSelectedPlan(plan.code)} className={`p-5 rounded-2xl border-2 text-left transition-all ${isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10 shadow-lg shadow-blue-600/10' : 'border-[var(--border-soft)] hover:border-blue-300'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-lg block">{isAr ? plan.name_ar : plan.name_en}</span>
                          <span className="text-xs text-zinc-500 font-bold">{plan.max_users ? `${plan.max_users} ${isAr ? 'مستخدم' : 'users'}` : (isAr ? 'غير محدود' : 'Unlimited')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold block">{planPrice} <span className="text-sm">{plan.currency}</span></span>
                          <span className="text-xs text-[var(--text-secondary)]">/ {billingCycle === 'yearly' ? (isAr ? 'سنة' : 'year') : (isAr ? 'شهر' : 'month')}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                <p className="text-sm">{isAr ? 'لم يتم تحميل الخطط. سيتم تحديد السعر بعد التسجيل.' : 'Plans will be configured after registration.'}</p>
              </div>
            )}

            {/* Summary */}
            {currentPlan && (
              <div className="glass-card p-5 rounded-2xl space-y-3">
                <h3 className="font-bold text-[10px] uppercase tracking-widest text-zinc-500">{isAr ? 'ملخص التكلفة' : 'COST SUMMARY'}</h3>
                <div className="flex justify-between text-sm">
                  <span>{isAr ? currentPlan.name_ar : currentPlan.name_en}</span>
                  <span className="font-bold">{price} {currency}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>{selectedModules.length} {isAr ? 'وحدات' : 'modules'}</span>
                  <span className="text-xs">{billingCycle === 'yearly' ? (isAr ? 'فوترة سنوية' : 'Billed yearly') : (isAr ? 'فوترة شهرية' : 'Billed monthly')}</span>
                </div>
                <div className="border-t border-[var(--border-soft)] pt-3 flex justify-between font-bold text-lg">
                  <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-blue-600">{price} {currency}</span>
                </div>
              </div>
            )}
          </motion.div>
        );
      }

      // ═══ STEP 6: Review & Confirm ═══
      case 6: {
        const reviewPlan = plans.find(p => p.code === selectedPlan);
        const reviewPrice = reviewPlan ? (billingCycle === 'yearly' ? reviewPlan.price_yearly : reviewPlan.price_monthly) : 0;

        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">{isAr ? 'مراجعة وتأكيد' : 'Review & Confirm'}</h2>
              <p className="text-[var(--text-secondary)] text-sm">{isAr ? 'راجع بياناتك قبل الإرسال' : 'Review your information before submitting'}</p>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">{isAr ? 'القطاع' : 'Industry'}</span>
                  <span className="font-bold">{selectedIndustry ? (isAr ? selectedIndustry.name_ar : selectedIndustry.name_en) : '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">{isAr ? 'الشركة' : 'Company'}</span>
                  <span className="font-bold">{companyName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">{isAr ? 'المدير العام' : 'GM'}</span>
                  <span className="font-bold">{gmName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">{isAr ? 'الدولة' : 'Location'}</span>
                  <span className="font-bold">{COUNTRIES.find(c => c.code === country)?.[isAr ? 'name_ar' : 'name_en'] || country}{city ? `, ${city}` : ''}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">{isAr ? 'الخطة' : 'Plan'}</span>
                  <span className="font-bold">{reviewPlan ? (isAr ? reviewPlan.name_ar : reviewPlan.name_en) : selectedPlan} — {reviewPrice} {reviewPlan?.currency || 'AED'}/{billingCycle === 'yearly' ? (isAr ? 'سنة' : 'yr') : (isAr ? 'شهر' : 'mo')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">{isAr ? 'المستندات' : 'Documents'}</span>
                  <span className="font-bold">
                    {licenseVerification?.is_valid && idVerification?.is_valid ? (isAr ? 'تم التحقق' : 'Verified') :
                      licenseFile || idFile ? (isAr ? 'مرفقة' : 'Attached') : (isAr ? 'غير مرفقة' : 'None')}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-2">{isAr ? 'الوحدات' : 'Modules'}</span>
                <div className="flex flex-wrap gap-2">
                  {selectedModules.map(code => (
                    <span key={code} className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-600/10">{code}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="glass-card p-5 h-36 overflow-y-auto text-xs text-[var(--text-secondary)] leading-relaxed rounded-2xl">
              <p className="mb-3 font-bold text-[var(--text-primary)]">{isAr ? '1. عزل البيانات وأمنها' : '1. Data Isolation & Security'}</p>
              <p className="mb-4">{isAr ? 'تطبق ZIEN عزلاً صارماً بآلية RLS. بياناتك محمية ولا يمكن لأي مستأجر آخر الوصول إليها.' : 'ZIEN employs strict RLS isolation. Your data is protected and never accessible to other tenants.'}</p>
              <p className="mb-3 font-bold text-[var(--text-primary)]">{isAr ? '2. سياسة الخصوصية' : '2. Privacy Policy'}</p>
              <p>{isAr ? 'لا نبيع بياناتك. جميع المعلومات تُستخدم فقط لتقديم وتحسين خدماتنا.' : 'We do not sell your data. All information is used solely for providing and improving our services.'}</p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" className="w-6 h-6 rounded-lg accent-blue-600" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} />
              <span className="font-medium group-hover:text-blue-600 transition-colors text-sm">{isAr ? 'أوافق على الشروط والسياسات وأؤكد صحة البيانات' : 'I agree to the terms & policies and confirm the data is accurate'}</span>
            </label>
          </motion.div>
        );
      }
      default:
        return null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Logo + Title */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black uppercase tracking-tighter">{isAr ? 'تسجيل شركة جديدة' : 'Register Your Company'}</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{isAr ? 'ZIEN — نظام تشغيل الأعمال الذكي' : 'ZIEN — Intelligent Business Operating System'}</p>
        </div>

        {/* Progress Bar */}
        {!provisioningResult && !submitted && (
          <div className="flex items-center justify-between mb-10 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 z-0" />
            <div className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} />
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i <= currentStep;
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
                    {i < currentStep ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <Icon className="w-4 h-4 md:w-5 md:h-5" />}
                  </div>
                  <span className={`text-[9px] md:text-[10px] font-bold hidden sm:block ${isActive ? 'text-blue-600' : 'text-zinc-400'}`}>{step.title}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Content Card */}
        <div className="glass-card p-8 md:p-12 min-h-[480px] flex flex-col border-blue-500/10 shadow-[0_20px_50px_rgba(59,130,246,0.08)] relative">
          {provisioningResult ? renderProvisioningStatus() : submitted ? renderSubmissionSuccess() : (
            <>
              {currentStep > 0 && (
                <button onClick={prevStep} className="absolute top-4 left-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all z-20" title={isAr ? 'رجوع' : 'Back'}>
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
              <div className="flex items-center justify-end mt-10 pt-6 border-t border-[var(--border-soft)]">
                {error && <p className="text-red-500 text-xs font-bold mr-auto">{error}</p>}
                <button onClick={nextStep} disabled={loading} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (currentStep === steps.length - 1 ? (isAr ? 'إكمال التسجيل' : 'Complete Registration') : (isAr ? 'متابعة' : 'Continue'))}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Auto-save indicator */}
        {applicationId && !provisioningResult && !submitted && (
          <p className="text-center text-[10px] text-zinc-400 mt-3">{isAr ? 'يتم حفظ بياناتك تلقائياً' : 'Your data is being auto-saved'}</p>
        )}
      </div>
    </div>
  );
}
