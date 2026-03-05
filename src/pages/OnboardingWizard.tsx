import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, User, ShieldCheck, CreditCard, 
  Check, ArrowRight, ArrowLeft, Upload, 
  Briefcase, Globe, FileText, Zap, Shield, Loader2,
  Plug, Lock, CheckCircle2, Settings, HelpCircle, Mail, Key
} from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { ASSETS, IMAGE_PROPS } from '../constants/assets';
import { supabase } from '../services/supabase';
import { provisioningService, ProvisioningResult } from '../services/provisioningService';

export default function OnboardingWizard() {
  const { language, t: translate } = useTheme();

  const steps = [
    { id: 'company', title: language === 'ar' ? 'معلومات الشركة' : 'Company Info', icon: Building2 },
    { id: 'type', title: language === 'ar' ? 'نوع النشاط' : 'Industry Type', icon: Briefcase },
    { id: 'questions', title: language === 'ar' ? 'تخصيص ذكي' : 'Smart Setup', icon: HelpCircle },
    { id: 'services', title: language === 'ar' ? 'الخدمات' : 'Services', icon: Settings },
    { id: 'integrations', title: language === 'ar' ? 'الربط' : 'Integrations', icon: Plug },
    { id: 'payment', title: language === 'ar' ? 'الدفع والمستندات' : 'Payment & Docs', icon: CreditCard },
    { id: 'auth', title: language === 'ar' ? 'التوثيق' : 'Verification', icon: Key },
  ];

  const companyTypes = [
    { id: 'commercial', name: language === 'ar' ? 'تجارية' : 'Commercial', icon: '🏢' },
    { id: 'industrial', name: language === 'ar' ? 'صناعية' : 'Industrial', icon: '🏭' },
    { id: 'service', name: language === 'ar' ? 'خدمية' : 'Service', icon: '🤝' },
    { id: 'consulting', name: language === 'ar' ? 'استشارية' : 'Consulting', icon: '💼' },
    { id: 'trading', name: language === 'ar' ? 'تجارة عامة' : 'General Trading', icon: '🚢' },
    { id: 'supermarket', name: language === 'ar' ? 'سوبر ماركت' : 'Supermarket', icon: '🛒' },
    { id: 'building_materials', name: language === 'ar' ? 'مواد بناء' : 'Building Materials', icon: '🧱' },
    { id: 'inventory_sales', name: language === 'ar' ? 'نظام مخزون وبيع' : 'Inventory & Sales', icon: '📦' },
    { id: 'ngo', name: language === 'ar' ? 'هيئات ومنظمات' : 'NGOs', icon: '🌍' },
    { id: 'mall', name: language === 'ar' ? 'مول تجاري' : 'Mall', icon: '🏬' },
    { id: 'bank', name: language === 'ar' ? 'بنك' : 'Bank', icon: '🏦' },
    { id: 'exchange', name: language === 'ar' ? 'صرافة' : 'Exchange', icon: '💱' },
  ];

  const subTypes: Record<string, {id: string, name: string}[]> = {
    commercial: [
      { id: 'retail', name: language === 'ar' ? 'تجزئة' : 'Retail' },
      { id: 'wholesale', name: language === 'ar' ? 'جملة' : 'Wholesale' },
      { id: 'ecommerce', name: language === 'ar' ? 'تجارة إلكترونية' : 'E-commerce' },
    ],
    industrial: [
      { id: 'manufacturing', name: language === 'ar' ? 'تصنيع' : 'Manufacturing' },
      { id: 'assembly', name: language === 'ar' ? 'تجميع' : 'Assembly' },
      { id: 'packaging', name: language === 'ar' ? 'تعبئة وتغليف' : 'Packaging' },
    ],
    service: [
      { id: 'maintenance', name: language === 'ar' ? 'صيانة' : 'Maintenance' },
      { id: 'cleaning', name: language === 'ar' ? 'تنظيف' : 'Cleaning' },
      { id: 'delivery', name: language === 'ar' ? 'توصيل' : 'Delivery' },
    ]
  };

  const availableModules = [
    { id: 'accounting', name: language === 'ar' ? 'المحاسبة والمالية' : 'Accounting & Finance', icon: '📊', basePrice: 50 },
    { id: 'hr', name: language === 'ar' ? 'الموارد البشرية' : 'HR & Payroll', icon: '👥', basePrice: 40 },
    { id: 'crm', name: language === 'ar' ? 'إدارة العملاء والمبيعات' : 'CRM & Sales', icon: '🤝', basePrice: 60 },
    { id: 'inventory', name: language === 'ar' ? 'أنظمة المخزون' : 'Inventory Management', icon: '📦', basePrice: 45 },
    { id: 'logistics', name: language === 'ar' ? 'العمليات الميدانية' : 'Field Operations', icon: '🚚', basePrice: 55 },
    { id: 'pr', name: language === 'ar' ? 'العلاقات العامة' : 'PR & External Relations', icon: '📢', basePrice: 30 },
    { id: 'consulting', name: language === 'ar' ? 'أنظمة الاستشارات' : 'Consulting Systems', icon: '💼', basePrice: 40 },
    { id: 'store', name: language === 'ar' ? 'المتجر الإلكتروني' : 'E-Commerce Store', icon: '🛍️', basePrice: 70 },
  ];

  const availableIntegrations = [
    { id: 'google_workspace', name: 'Google Workspace (Gmail, Drive)', desc: language === 'ar' ? 'ربط البريد والملفات' : 'Email & Files', price: 49, icon: '📧' },
    { id: 'google_gemini', name: 'Google Gemini AI', desc: language === 'ar' ? 'ذكاء اصطناعي متقدم' : 'Advanced AI', price: 99, icon: '✨' },
    { id: 'google_cloud_storage', name: 'Google Cloud Storage', desc: language === 'ar' ? 'تخزين سحابي آمن' : 'Secure Cloud Storage', price: 29, icon: '☁️' },
    { id: 'stripe', name: 'Stripe', desc: language === 'ar' ? 'بوابة الدفع الإلكتروني' : 'Online Payment Gateway', price: 0, icon: '💳' },
    { id: 'google_pay', name: 'Google Pay', desc: language === 'ar' ? 'دفع عبر جوجل' : 'Pay via Google', price: 0, icon: '📱' },
    { id: 'apple_pay', name: 'Apple Pay', desc: language === 'ar' ? 'دفع عبر أبل' : 'Pay via Apple', price: 0, icon: '🍎' },
    { id: 'openai', name: 'OpenAI Advanced', desc: language === 'ar' ? 'نماذج ذكاء اصطناعي' : 'AI Models', price: 149, icon: '🧠' },
  ];

  const smartQuestions = [
    {
      id: 'q1',
      text: language === 'ar' ? 'هل تتعامل مع مبيعات دولية؟' : 'Do you handle international sales?',
      options: [
        { text: language === 'ar' ? 'نعم، بشكل يومي' : 'Yes, daily', action: () => addModule('crm') },
        { text: language === 'ar' ? 'أحياناً' : 'Sometimes', action: () => addModule('crm') },
        { text: language === 'ar' ? 'لا، محلي فقط' : 'No, local only', action: () => {} }
      ]
    },
    {
      id: 'q2',
      text: language === 'ar' ? 'هل لديك فريق عمل ميداني؟' : 'Do you have a field team?',
      options: [
        { text: language === 'ar' ? 'نعم، فريق كبير' : 'Yes, a large team', action: () => addModule('logistics') },
        { text: language === 'ar' ? 'لا، عمل مكتبي' : 'No, office based', action: () => {} }
      ]
    }
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provisioningResult, setProvisioningResult] = useState<ProvisioningResult | null>(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    registrationNumber: '',
    address: '',
    nationality: '',
    ownersNames: '',
    gmName: '',
    gmEmail: '',
    employeeCount: '',
    requiredUsersCount: '',
    
    industry: '',
    subIndustry: '',
    
    modules: [] as string[],
    integrations: [] as string[],
    
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    
    licenseFile: null as File | null,
    idFile: null as File | null,
    
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isProvisioningSim, setIsProvisioningSim] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const addModule = (moduleId: string) => {
    if (!formData.modules.includes(moduleId)) {
      setFormData(prev => ({ ...prev, modules: [...prev.modules, moduleId] }));
    }
  };

  const calculateTotal = () => {
    const users = parseInt(formData.requiredUsersCount) || 1;
    const baseUserPrice = 20; // Base price per user
    
    const modulesPrice = formData.modules.reduce((total, modId) => {
      const mod = availableModules.find(m => m.id === modId);
      return total + (mod?.basePrice || 0);
    }, 0);

    const integrationsPrice = formData.integrations.reduce((total, intId) => {
      const integration = availableIntegrations.find(i => i.id === intId);
      return total + (integration?.price || 0);
    }, 0);
    
    let monthlyTotal = (users * baseUserPrice) + modulesPrice + integrationsPrice;
    
    if (formData.billingCycle === 'yearly') {
      return Math.round((monthlyTotal * 12) * 0.8); // 20% discount for yearly
    }
    return monthlyTotal;
  };

  const validateStep = () => {
    setError('');
    switch (currentStep) {
      case 0:
        if (!formData.companyName || !formData.registrationNumber || !formData.address || !formData.nationality || !formData.ownersNames || !formData.gmName || !formData.gmEmail || !formData.employeeCount || !formData.requiredUsersCount) {
          setError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
          return false;
        }
        if (!formData.gmEmail.includes('@')) {
          setError(language === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email address');
          return false;
        }
        break;
      case 1:
        if (!formData.industry) {
          setError(language === 'ar' ? 'يرجى اختيار نوع النشاط' : 'Please select an industry type');
          return false;
        }
        if (subTypes[formData.industry] && !formData.subIndustry) {
          setError(language === 'ar' ? 'يرجى اختيار النشاط الفرعي' : 'Please select a sub-industry');
          return false;
        }
        break;
      case 3:
        if (formData.modules.length === 0) {
          setError(language === 'ar' ? 'يرجى اختيار وحدة واحدة على الأقل' : 'Please select at least one module');
          return false;
        }
        break;
      case 5:
        if (!formData.licenseFile || !formData.idFile) {
          setError(language === 'ar' ? 'يرجى رفع المستندات المطلوبة' : 'Please upload required documents');
          return false;
        }
        break;
      case 6:
        if (!verificationSent) {
          // Need to send verification first
          return false;
        }
        if (!formData.verificationCode || !formData.newPassword || !formData.confirmPassword) {
          setError(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
          return false;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = async () => {
    if (!validateStep()) return;
    
    if (currentStep === 1) {
      // Start simulated provisioning and questions
      setIsProvisioningSim(true);
      // Auto-select some base modules based on industry
      const baseModules = ['accounting', 'hr'];
      setFormData(prev => ({ ...prev, modules: [...new Set([...prev.modules, ...baseModules])] }));
    }
    
    if (currentStep === 5) {
      // Handle Payment and Document submission
      await handlePaymentAndDocs();
    } else if (currentStep === 6) {
      await handleFinalAuth();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleQuestionAnswer = (action: () => void) => {
    action();
    if (currentQuestionIndex < smartQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsProvisioningSim(false);
      nextStep();
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success && sessionId) {
      // Restore state
      const savedState = localStorage.getItem('zien_onboarding_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setFormData(parsedState);
        setCurrentStep(6); // Move to auth step
        
        // Provision Tenant
        provisioningService.provisionTenant({
          companyName: parsedState.companyName,
          tenantType: parsedState.industry,
          country: parsedState.nationality,
          currency: 'AED',
          employees: parsedState.employeeCount,
          needs: parsedState.integrations,
          language: language
        }).then(result => {
          setProvisioningResult(result);
        });
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled) {
      setError(language === 'ar' ? 'تم إلغاء عملية الدفع' : 'Payment was canceled');
      const savedState = localStorage.getItem('zien_onboarding_state');
      if (savedState) {
        setFormData(JSON.parse(savedState));
        setCurrentStep(5);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [language]);

  const handlePaymentAndDocs = async () => {
    setLoading(true);
    try {
      const amount = calculateTotal();
      
      // Save current state to local storage before redirecting
      localStorage.setItem('zien_onboarding_state', JSON.stringify(formData));

      // Call Stripe Checkout
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: 'Custom Build',
          amount: amount,
          companyName: formData.companyName,
          email: formData.gmEmail,
          billingCycle: formData.billingCycle
        })
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    setLoading(true);
    try {
      // Simulate checking email in Founder DB and sending code
      await new Promise(resolve => setTimeout(resolve, 1500));
      setVerificationSent(true);
    } catch (err) {
      setError(language === 'ar' ? 'فشل إرسال رمز التحقق' : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalAuth = async () => {
    setLoading(true);
    try {
      // Simulate verifying code and setting password
      await new Promise(resolve => setTimeout(resolve, 1500));
      window.location.href = '/dashboard';
    } catch (err) {
      setError(language === 'ar' ? 'رمز التحقق غير صحيح' : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-bold">{language === 'ar' ? 'معلومات الشركة والمدير' : 'Company & Manager Info'}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" placeholder={language === 'ar' ? 'اسم الشركة' : 'Company Name'} className="glass-input" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
              <input type="text" placeholder={language === 'ar' ? 'رقم التسجيل / الرخصة' : 'Registration Number'} className="glass-input" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
              <input type="text" placeholder={language === 'ar' ? 'العنوان' : 'Address'} className="glass-input md:col-span-2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              <input type="text" placeholder={language === 'ar' ? 'الجنسية / بلد التأسيس' : 'Nationality / Country'} className="glass-input" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} />
              <input type="text" placeholder={language === 'ar' ? 'أسماء الملاك' : 'Owners Names'} className="glass-input" value={formData.ownersNames} onChange={e => setFormData({...formData, ownersNames: e.target.value})} />
              <input type="text" placeholder={language === 'ar' ? 'المدير المسؤول' : 'General Manager Name'} className="glass-input" value={formData.gmName} onChange={e => setFormData({...formData, gmName: e.target.value})} />
              <input type="email" placeholder={language === 'ar' ? 'البريد الإلكتروني للمدير' : 'GM Email'} className="glass-input" value={formData.gmEmail} onChange={e => setFormData({...formData, gmEmail: e.target.value})} />
              <input type="number" placeholder={language === 'ar' ? 'عدد الموظفين' : 'Employee Count'} className="glass-input" value={formData.employeeCount} onChange={e => setFormData({...formData, employeeCount: e.target.value})} />
              <input type="number" placeholder={language === 'ar' ? 'عدد المستخدمين المطلوب للنظام' : 'Required Users Count'} className="glass-input" value={formData.requiredUsersCount} onChange={e => setFormData({...formData, requiredUsersCount: e.target.value})} />
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-bold">{language === 'ar' ? 'نوع نشاط الشركة' : 'Company Industry Type'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {companyTypes.map(type => (
                <button 
                  key={type.id}
                  onClick={() => setFormData({...formData, industry: type.id, subIndustry: ''})}
                  className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                    formData.industry === type.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md' : 'border-[var(--border-soft)] hover:border-blue-300'
                  }`}
                >
                  <span className="text-3xl">{type.icon}</span>
                  <span className="font-bold text-sm leading-tight">{type.name}</span>
                </button>
              ))}
            </div>

            {formData.industry && subTypes[formData.industry] && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-6 border-t border-[var(--border-soft)]">
                <h3 className="font-bold text-lg mb-4">{language === 'ar' ? 'النشاط الفرعي' : 'Sub-Industry'}</h3>
                <div className="flex flex-wrap gap-3">
                  {subTypes[formData.industry].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setFormData({...formData, subIndustry: sub.id})}
                      className={`px-6 py-3 rounded-full border-2 font-bold transition-all ${
                        formData.subIndustry === sub.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-[var(--border-soft)] hover:border-blue-300'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-8">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 border-4 border-blue-400 rounded-full animate-spin border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                <Zap size={40} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">{language === 'ar' ? 'جاري تجهيز الخدمات الأساسية...' : 'Auto-provisioning core services...'}</h2>
              <p className="text-[var(--text-secondary)]">{language === 'ar' ? 'يرجى الإجابة على هذه الأسئلة لتخصيص بيئتك بدقة' : 'Please answer these questions to fine-tune your environment'}</p>
            </div>
            
            <div className="max-w-xl mx-auto glass-card p-8 text-left">
              <h3 className="text-xl font-bold mb-6">{smartQuestions[currentQuestionIndex].text}</h3>
              <div className="space-y-3">
                {smartQuestions[currentQuestionIndex].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuestionAnswer(opt.action)}
                    className="w-full p-4 rounded-xl border border-[var(--border-soft)] hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left font-medium flex items-center justify-between group"
                  >
                    {opt.text}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-bold">{language === 'ar' ? 'الخدمات المخصصة لك' : 'Provisioned Services'}</h2>
            <p className="text-[var(--text-secondary)]">{language === 'ar' ? 'تم اختيار هذه الخدمات بناءً على نشاطك وإجاباتك. يمكنك تعديلها.' : 'These services were selected based on your industry and answers. You can customize them.'}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {availableModules.map(mod => {
                const isSelected = formData.modules.includes(mod.id);
                return (
                  <button 
                    key={mod.id}
                    onClick={() => {
                      const newModules = isSelected 
                        ? formData.modules.filter(id => id !== mod.id)
                        : [...formData.modules, mod.id];
                      setFormData({...formData, modules: newModules});
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-3 ${
                      isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md' : 'border-[var(--border-soft)] hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-2xl">{mod.icon}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-[var(--border-soft)]'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-sm leading-tight block">{mod.name}</span>
                      <span className="text-xs text-blue-600 font-bold mt-1 block">+{mod.basePrice} AED</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-3xl font-bold">{language === 'ar' ? 'أنظمة الربط والتكامل' : 'Integrations'}</h2>
            <p className="text-[var(--text-secondary)]">{language === 'ar' ? 'اختر الأنظمة الإضافية التي ترغب بربطها ببيئة عملك.' : 'Select additional systems to integrate with your workspace.'}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {availableIntegrations.map(integration => {
                const isSelected = formData.integrations.includes(integration.id);
                return (
                  <button 
                    key={integration.id}
                    onClick={() => {
                      const newIntegrations = isSelected 
                        ? formData.integrations.filter(id => id !== integration.id)
                        : [...formData.integrations, integration.id];
                      setFormData({...formData, integrations: newIntegrations});
                    }}
                    className={`p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${
                      isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-[var(--border-soft)] hover:border-blue-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-[var(--border-soft)]'}`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="text-3xl">{integration.icon}</div>
                    <div className="flex-1">
                      <span className="font-bold block">{integration.name}</span>
                      <span className="text-xs text-[var(--text-secondary)]">{integration.desc}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-600">{integration.price === 0 ? (language === 'ar' ? 'مجاني' : 'Free') : `+${integration.price}`}</span>
                      {integration.price > 0 && <span className="text-xs text-[var(--text-secondary)] block">AED/mo</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">{language === 'ar' ? 'التسعير والدفع' : 'Pricing & Payment'}</h2>
              <p className="text-[var(--text-secondary)]">{language === 'ar' ? 'تسعير ديناميكي بناءً على اختياراتك وعدد المستخدمين.' : 'Dynamic pricing based on your selections and user count.'}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Summary */}
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-2xl border-[var(--border-soft)]">
                  <h3 className="font-bold text-lg mb-4">{language === 'ar' ? 'ملخص الاشتراك' : 'Subscription Summary'}</h3>
                  
                  <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl mb-6">
                    <button 
                      onClick={() => setFormData({...formData, billingCycle: 'monthly'})}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.billingCycle === 'monthly' ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-[var(--text-secondary)]'}`}
                    >
                      {language === 'ar' ? 'شهري' : 'Monthly'}
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, billingCycle: 'yearly'})}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${formData.billingCycle === 'yearly' ? 'bg-white dark:bg-zinc-800 shadow-sm text-green-600' : 'text-[var(--text-secondary)]'}`}
                    >
                      {language === 'ar' ? 'سنوي (خصم 20%)' : 'Yearly (20% off)'}
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">{language === 'ar' ? 'المستخدمين' : 'Users'} ({formData.requiredUsersCount})</span>
                      <span className="font-bold">{parseInt(formData.requiredUsersCount) * 20} AED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">{language === 'ar' ? 'الخدمات' : 'Modules'} ({formData.modules.length})</span>
                      <span className="font-bold">{formData.modules.reduce((sum, id) => sum + (availableModules.find(m => m.id === id)?.basePrice || 0), 0)} AED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">{language === 'ar' ? 'الربط' : 'Integrations'} ({formData.integrations.length})</span>
                      <span className="font-bold">{formData.integrations.reduce((sum, id) => sum + (availableIntegrations.find(i => i.id === id)?.price || 0), 0)} AED</span>
                    </div>
                    
                    <div className="border-t border-[var(--border-soft)] pt-4 mt-4 flex justify-between items-end">
                      <span className="font-bold text-lg">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                      <div className="text-right">
                        <span className="font-black text-3xl text-blue-600">{calculateTotal()}</span>
                        <span className="text-sm text-[var(--text-secondary)] font-bold ml-1">AED / {formData.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold">{language === 'ar' ? 'المستندات المطلوبة' : 'Required Documents'}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="glass-card p-4 border-dashed border-2 border-blue-200 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all block rounded-xl">
                      <input type="file" className="hidden" onChange={e => setFormData({...formData, licenseFile: e.target.files?.[0] || null})} />
                      <FileText className={`w-6 h-6 mx-auto mb-2 ${formData.licenseFile ? 'text-green-500' : 'text-blue-600'}`} />
                      <div className="text-xs font-bold">{formData.licenseFile ? formData.licenseFile.name : (language === 'ar' ? 'الرخصة' : 'License')}</div>
                    </label>
                    <label className="glass-card p-4 border-dashed border-2 border-blue-200 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all block rounded-xl">
                      <input type="file" className="hidden" onChange={e => setFormData({...formData, idFile: e.target.files?.[0] || null})} />
                      <User className={`w-6 h-6 mx-auto mb-2 ${formData.idFile ? 'text-green-500' : 'text-blue-600'}`} />
                      <div className="text-xs font-bold">{formData.idFile ? formData.idFile.name : (language === 'ar' ? 'هوية المدير' : 'GM ID')}</div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg mb-4">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</h3>
                
                <button className="w-full p-4 glass-card rounded-xl border border-[var(--border-soft)] hover:border-blue-500 flex items-center justify-center gap-3 font-bold transition-all">
                  <span className="text-2xl">📱</span> Pay with Google Pay
                </button>
                <button className="w-full p-4 glass-card rounded-xl border border-[var(--border-soft)] hover:border-blue-500 flex items-center justify-center gap-3 font-bold transition-all">
                  <span className="text-2xl">🍎</span> Pay with Apple Pay
                </button>
                
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-soft)]"></div></div>
                  <div className="relative flex justify-center"><span className="bg-[var(--bg-primary)] px-4 text-xs text-[var(--text-secondary)] uppercase font-bold">OR</span></div>
                </div>

                <div className="glass-card p-6 rounded-xl border-[var(--border-soft)] space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="font-bold">Credit Card (Stripe)</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    {language === 'ar' ? 'سيتم توجيهك إلى بوابة الدفع الآمنة لإتمام العملية.' : 'You will be redirected to a secure payment gateway to complete your transaction.'}
                  </p>
                  <button 
                    onClick={handlePaymentAndDocs}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (language === 'ar' ? `دفع ${calculateTotal()} درهم` : `Pay ${calculateTotal()} AED`)}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 6:
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto space-y-8 py-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold mb-2">{language === 'ar' ? 'توثيق الحساب' : 'Account Verification'}</h2>
              <p className="text-[var(--text-secondary)]">
                {language === 'ar' 
                  ? 'تم إرسال الفاتورة والمستندات للمراجعة. يرجى توثيق بريدك الإلكتروني لإنشاء كلمة المرور والدخول كمدير عام.' 
                  : 'Invoice and docs sent for review. Please verify your email to create a password and login as GM.'}
              </p>
            </div>

            {!verificationSent ? (
              <div className="glass-card p-6 rounded-2xl space-y-4 text-center">
                <Mail className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <p className="font-bold">{formData.gmEmail}</p>
                <button 
                  onClick={sendVerificationCode}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (language === 'ar' ? 'إرسال رمز التحقق' : 'Send Verification Code')}
                </button>
              </div>
            ) : (
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">{language === 'ar' ? 'رمز التحقق' : 'Verification Code'}</label>
                  <input 
                    type="text" 
                    placeholder="123456" 
                    className="glass-input text-center text-2xl tracking-[0.5em] font-mono" 
                    value={formData.verificationCode}
                    onChange={e => setFormData({...formData, verificationCode: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">{language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                  <input 
                    type="password" 
                    className="glass-input" 
                    value={formData.newPassword}
                    onChange={e => setFormData({...formData, newPassword: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">{language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                  <input 
                    type="password" 
                    className="glass-input" 
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-24 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Custom Styles for Inputs to keep it clean */}
        <style dangerouslySetInnerHTML={{__html: `
          .glass-input {
            width: 100%;
            background: rgba(0,0,0,0.03);
            border: 1px solid var(--border-soft);
            padding: 1rem;
            border-radius: 0.75rem;
            outline: none;
            transition: all 0.2s;
          }
          .dark .glass-input {
            background: rgba(255,255,255,0.05);
          }
          .glass-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59,130,246,0.1);
          }
        `}} />

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 relative px-4 md:px-0 overflow-x-auto pb-8 hide-scrollbar">
          <div className="absolute top-5 left-4 md:left-0 right-4 md:right-0 h-1 bg-black/10 dark:bg-white/10 z-0 rounded-full min-w-[600px]" />
          <div 
            className="absolute top-5 left-4 md:left-0 h-1 bg-blue-600 z-0 transition-all duration-500 rounded-full" 
            style={{ width: `calc(${(currentStep / (steps.length - 1)) * 100}% - ${currentStep === 0 ? 0 : 2}rem)`, minWidth: currentStep > 0 ? '50px' : '0' }}
          />
          
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i <= currentStep;
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-3 min-w-[80px]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 border-[var(--bg-primary)] ${
                  isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-gray-200 dark:bg-zinc-800 text-gray-400'
                }`}>
                  {i < currentStep ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap text-center ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        <div className="glass-card p-6 md:p-12 min-h-[500px] flex flex-col border-blue-500/10 shadow-[0_20px_50px_rgba(59,130,246,0.1)] relative">
          {currentStep > 0 && !isProvisioningSim && currentStep !== 6 && (
            <button 
              onClick={prevStep}
              className="absolute top-6 left-6 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all z-20"
              title={language === 'ar' ? 'رجوع' : 'Back'}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          
          <div className="flex-1 mt-8 md:mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep + (isProvisioningSim ? '-sim' : '')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {!isProvisioningSim && (
            <div className="flex items-center justify-end mt-12 pt-8 border-t border-[var(--border-soft)]">
              {error && <p className="text-red-500 text-xs font-bold mr-auto">{error}</p>}
              {currentStep !== 5 && (
                <button 
                  onClick={nextStep}
                  disabled={loading || (currentStep === 6 && !verificationSent)}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                    currentStep === 6 ? (language === 'ar' ? 'دخول للنظام' : 'Enter System') :
                    (language === 'ar' ? 'متابعة' : 'Continue')}
                  {!loading && currentStep !== 6 && <ArrowRight className="w-5 h-5" />}
                  {!loading && currentStep === 6 && <CheckCircle2 className="w-5 h-5" />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
