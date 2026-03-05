import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { Shield, Lock, FileText, Scale, RefreshCcw, Database } from 'lucide-react';

export default function LegalPage() {
  const { language } = useTheme();
  const [activeTab, setActiveTab] = useState('terms');

  const sections = [
    { id: 'terms', title: language === 'ar' ? 'شروط الخدمة' : 'Terms of Service', icon: FileText },
    { id: 'privacy', title: language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy', icon: Lock },
    { id: 'aup', title: language === 'ar' ? 'الاستخدام المقبول' : 'Acceptable Use', icon: Scale },
    { id: 'retention', title: language === 'ar' ? 'الاحتفاظ بالبيانات' : 'Data Retention', icon: Database },
    { id: 'refund', title: language === 'ar' ? 'سياسة الاسترداد' : 'Refund Policy', icon: RefreshCcw },
    { id: 'security', title: language === 'ar' ? 'الأمن والامتثال' : 'Security & Compliance', icon: Shield },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'terms':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}</h2>
            <p>
              {language === 'ar' 
                ? 'من خلال الوصول إلى منصة ZIEN واستخدامها، فإنك توافق على الالتزام بهذه الشروط والأحكام. توفر ZIEN منصة SaaS متعددة المستأجرين لإدارة الأعمال.' 
                : 'By accessing and using ZIEN Platform, you agree to be bound by these terms and conditions. ZIEN provides a multi-tenant SaaS platform for business management.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '1. تسجيل الحساب' : '1. Account Registration'}</h3>
            <p>
              {language === 'ar' 
                ? 'يجب عليك تقديم معلومات دقيقة وكاملة عند إنشاء حساب. أنت مسؤول عن الحفاظ على أمن بيانات اعتماد حسابك.' 
                : 'You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '2. توفير الخدمة' : '2. Service Provisioning'}</h3>
            <p>
              {language === 'ar' 
                ? 'يتم توفير الخدمات بناءً على الصناعة المختارة وخطة الاشتراك الخاصة بك. نحن نحتفظ بالحق في تعديل أو إيقاف الخدمات مع إشعار مسبق.' 
                : 'Services are provisioned based on your selected industry and subscription plan. We reserve the right to modify or discontinue services with notice.'}
            </p>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</h2>
            <p>
              {language === 'ar' 
                ? 'نحن نقدر خصوصيتك. تشرح هذه السياسة كيفية جمعنا لبياناتك واستخدامها وحمايتها.' 
                : 'We value your privacy. This policy explains how we collect, use, and protect your data.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '1. جمع البيانات' : '1. Data Collection'}</h3>
            <p>
              {language === 'ar' 
                ? 'نحن نجمع المعلومات التي تقدمها أثناء التسجيل واستخدام المنصة. يتضمن ذلك بيانات الشركة وتفاصيل الموظفين وسجلات الاستخدام.' 
                : 'We collect information you provide during registration and usage of the platform. This includes company data, employee details, and usage logs.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '2. عزل البيانات' : '2. Data Isolation'}</h3>
            <p>
              {language === 'ar' 
                ? 'بياناتك معزولة تماماً عن المستأجرين الآخرين باستخدام أمان مستوى الصف (RLS). نحن لا نشارك بياناتك مع أطراف ثالثة دون موافقتك.' 
                : 'Your data is strictly isolated from other tenants using Row Level Security (RLS). We do not share your data with third parties without your consent.'}
            </p>
          </div>
        );
      case 'aup':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{language === 'ar' ? 'سياسة الاستخدام المقبول' : 'Acceptable Use Policy'}</h2>
            <p>
              {language === 'ar' 
                ? 'تحدد هذه السياسة الاستخدامات المحظورة لخدماتنا لضمان بيئة آمنة لجميع المستخدمين.' 
                : 'This policy outlines prohibited uses of our services to ensure a safe environment for all users.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '1. الأنشطة المحظورة' : '1. Prohibited Activities'}</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>{language === 'ar' ? 'استخدام المنصة لأي غرض غير قانوني.' : 'Using the platform for any illegal purpose.'}</li>
              <li>{language === 'ar' ? 'محاولة اختراق أو تعطيل أمن المنصة.' : 'Attempting to hack or disrupt platform security.'}</li>
              <li>{language === 'ar' ? 'إرسال رسائل غير مرغوب فيها أو بريد عشوائي.' : 'Sending unsolicited messages or spam.'}</li>
              <li>{language === 'ar' ? 'انتحال شخصية مستخدمين آخرين أو شركات أخرى.' : 'Impersonating other users or companies.'}</li>
            </ul>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{language === 'ar' ? 'الأمن والامتثال' : 'Security & Compliance'}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-brand-light rounded-2xl border border-brand-muted">
                <Shield className="w-8 h-8 text-brand mb-4" />
                <h3 className="font-bold mb-2">{language === 'ar' ? 'تشفير البيانات' : 'Data Encryption'}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{language === 'ar' ? 'يتم تشفير جميع البيانات أثناء النقل وعند الراحة باستخدام معايير AES-256.' : 'All data is encrypted in transit and at rest using AES-256 standards.'}</p>
              </div>
              <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                <Lock className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="font-bold mb-2">{language === 'ar' ? 'عزل المستأجرين' : 'Tenant Isolation'}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{language === 'ar' ? 'نستخدم RARE AI Shield لضمان عدم وصول أي مستخدم لبيانات شركة أخرى.' : 'We use RARE AI Shield to ensure no user can access another company\'s data.'}</p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="py-12 text-center text-[var(--text-secondary)]">
            {language === 'ar' 
              ? `يتم تحديث محتوى ${sections.find(s => s.id === activeTab)?.title} حالياً.` 
              : `Content for ${sections.find(s => s.id === activeTab)?.title} is being updated.`}
          </div>
        );
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 bg-[var(--bg-primary)] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {language === 'ar' ? 'مركز القانون والثقة' : 'Legal & Trust Center'}
          </h1>
          <p className="text-[var(--text-secondary)]">
            {language === 'ar' 
              ? 'الشفافية والأمن والامتثال هي جوهر ZIEN.' 
              : 'Transparency, security, and compliance are at the core of ZIEN.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-2">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl font-bold transition-all ${
                  activeTab === s.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'glass-card hover:bg-black/5'
                }`}
              >
                <s.icon className="w-5 h-5" />
                {s.title}
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 glass-card p-8 md:p-12">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
