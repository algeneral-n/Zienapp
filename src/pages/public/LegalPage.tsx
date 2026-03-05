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
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <Shield className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-bold mb-2">{language === 'ar' ? 'تشفير البيانات' : 'Data Encryption'}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{language === 'ar' ? 'يتم تشفير جميع البيانات أثناء النقل وعند الراحة باستخدام معايير AES-256.' : 'All data is encrypted in transit and at rest using AES-256 standards.'}</p>
              </div>
              <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                <Lock className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="font-bold mb-2">{language === 'ar' ? 'عزل المستأجرين' : 'Tenant Isolation'}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{language === 'ar' ? 'نستخدم RARE AI Shield لضمان عدم وصول أي مستخدم لبيانات شركة أخرى.' : 'We use RARE AI Shield to ensure no user can access another company\'s data.'}</p>
              </div>
            </div>
            <h3 className="text-lg font-bold">{language === 'ar' ? 'شهادات الامتثال' : 'Compliance Certifications'}</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>{language === 'ar' ? 'تشفير AES-256 لجميع البيانات المخزنة والمنقولة' : 'AES-256 encryption for all stored and transmitted data'}</li>
              <li>{language === 'ar' ? 'TLS 1.3 لتأمين جميع الاتصالات' : 'TLS 1.3 for all communications security'}</li>
              <li>{language === 'ar' ? 'أمان مستوى الصف (RLS) لعزل بيانات المستأجرين بالكامل' : 'Row Level Security (RLS) for complete tenant data isolation'}</li>
              <li>{language === 'ar' ? 'مصادقة ثنائية العامل (2FA) لجميع الحسابات' : 'Two-factor authentication (2FA) for all accounts'}</li>
              <li>{language === 'ar' ? 'سجلات تدقيق شاملة لجميع تغييرات البيانات' : 'Comprehensive audit logs for all data changes'}</li>
              <li>{language === 'ar' ? 'نسخ احتياطي يومي للبيانات مع استرداد الكوارث' : 'Daily data backups with disaster recovery'}</li>
              <li>{language === 'ar' ? 'الامتثال لقوانين حماية البيانات في الإمارات' : 'Compliance with UAE data protection regulations'}</li>
            </ul>
            <h3 className="text-lg font-bold">{language === 'ar' ? 'اختبارات الاختراق' : 'Penetration Testing'}</h3>
            <p>
              {language === 'ar'
                ? 'يتم إجراء اختبارات اختراق دورية من قبل أطراف ثالثة مستقلة. نحن نصلح أي ثغرات مكتشفة خلال 24-72 ساعة حسب الخطورة.'
                : 'Regular penetration tests are conducted by independent third parties. We remediate any discovered vulnerabilities within 24-72 hours depending on severity.'}
            </p>
          </div>
        );
      case 'retention':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{language === 'ar' ? 'سياسة الاحتفاظ بالبيانات' : 'Data Retention Policy'}</h2>
            <p>
              {language === 'ar'
                ? 'توضح هذه السياسة كيفية احتفاظنا ببياناتك وحذفها. نحن ملتزمون بالحد الأدنى من الاحتفاظ بالبيانات اللازم لتقديم خدماتنا.'
                : 'This policy outlines how we retain and delete your data. We are committed to minimal data retention necessary to provide our services.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '1. بيانات الحساب النشط' : '1. Active Account Data'}</h3>
            <p>
              {language === 'ar'
                ? 'يتم الاحتفاظ بجميع بيانات شركتك طوال فترة اشتراكك النشط. تشمل هذه البيانات: معلومات الشركة، بيانات الموظفين، السجلات المالية، سجلات الاستخدام، وكل المحتوى الذي تم إنشاؤه على المنصة.'
                : 'All your company data is retained throughout your active subscription period. This includes: company information, employee data, financial records, usage logs, and all content created on the platform.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '2. بعد إلغاء الاشتراك' : '2. After Subscription Cancellation'}</h3>
            <p>
              {language === 'ar'
                ? 'عند إلغاء اشتراكك، نحتفظ ببياناتك لمدة 90 يوماً كفترة سماح. خلال هذه الفترة يمكنك إعادة تفعيل حسابك واستعادة جميع بياناتك. بعد 90 يوماً، يتم حذف البيانات نهائياً ولا يمكن استردادها.'
                : 'Upon subscription cancellation, we retain your data for 90 days as a grace period. During this period, you can reactivate your account and recover all your data. After 90 days, data is permanently deleted and cannot be recovered.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '3. سجلات التدقيق' : '3. Audit Logs'}</h3>
            <p>
              {language === 'ar'
                ? 'يتم الاحتفاظ بسجلات التدقيق والأمان لمدة 12 شهراً من تاريخ إنشائها للامتثال التنظيمي. يمكن طلب تمديد فترة الاحتفاظ لخطط المؤسسات.'
                : 'Audit and security logs are retained for 12 months from creation date for regulatory compliance. Extended retention periods can be requested for enterprise plans.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '4. النسخ الاحتياطية' : '4. Backups'}</h3>
            <p>
              {language === 'ar'
                ? 'يتم الاحتفاظ بالنسخ الاحتياطية اليومية لمدة 30 يوماً. النسخ الاحتياطية الأسبوعية محتفظ بها لمدة 90 يوماً. يتم تشفير جميع النسخ الاحتياطية ولا يمكن الوصول إليها إلا عبر إجراءات أمنية صارمة.'
                : 'Daily backups are retained for 30 days. Weekly backups are retained for 90 days. All backups are encrypted and accessible only through strict security procedures.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '5. حق الحذف' : '5. Right to Deletion'}</h3>
            <p>
              {language === 'ar'
                ? 'يحق لك طلب حذف جميع بياناتك في أي وقت عبر التواصل مع فريق الدعم. سنقوم بحذف بياناتك خلال 30 يوم عمل مع إصدار شهادة حذف.'
                : 'You have the right to request deletion of all your data at any time by contacting our support team. We will delete your data within 30 business days and issue a deletion certificate.'}
            </p>
          </div>
        );
      case 'refund':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{language === 'ar' ? 'سياسة الاسترداد' : 'Refund Policy'}</h2>
            <p>
              {language === 'ar'
                ? 'نحن نؤمن برضا عملائنا. تحدد هذه السياسة شروط وأحكام استرداد المبالغ المدفوعة.'
                : 'We believe in customer satisfaction. This policy outlines the terms and conditions for refunds.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '1. الاشتراكات الشهرية' : '1. Monthly Subscriptions'}</h3>
            <p>
              {language === 'ar'
                ? 'يمكنك إلغاء اشتراكك الشهري في أي وقت. ستحتفظ بالوصول إلى خدماتك حتى نهاية فترة الفوترة الحالية. لا يتم استرداد الأيام المتبقية من الشهر الحالي.'
                : 'You can cancel your monthly subscription at any time. You will retain access to your services until the end of the current billing period. Remaining days in the current month are not refunded.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '2. الاشتراكات السنوية' : '2. Annual Subscriptions'}</h3>
            <p>
              {language === 'ar'
                ? 'للخطط السنوية، يحق لك استرداد كامل خلال أول 30 يوماً من الاشتراك (ضمان استرداد الأموال). بعد 30 يوماً، يمكنك إلغاء الاشتراك السنوي واستلام استرداد تناسبي للأشهر المتبقية غير المستخدمة (الحد الأدنى 3 أشهر متبقية).'
                : 'For annual plans, you are entitled to a full refund within the first 30 days of subscription (money-back guarantee). After 30 days, you can cancel the annual subscription and receive a prorated refund for remaining unused months (minimum 3 months remaining).'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '3. الإضافات (Add-ons)' : '3. Add-ons'}</h3>
            <p>
              {language === 'ar'
                ? 'يمكن إلغاء الإضافات في أي وقت. يتم إيقاف التجديد التلقائي وتستمر الخدمة حتى نهاية الفترة المدفوعة. لا يتم استرداد إضافات المستخدمين الإضافيين جزئياً.'
                : 'Add-ons can be cancelled at any time. Auto-renewal is stopped and the service continues until the end of the paid period. Extra user add-ons are not partially refundable.'}
            </p>
            <h3 className="text-lg font-bold">{language === 'ar' ? '4. كيفية طلب الاسترداد' : '4. How to Request a Refund'}</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>{language === 'ar' ? 'تواصل مع فريق الدعم عبر البريد الإلكتروني: billing@zien-ai.app' : 'Contact support via email: billing@zien-ai.app'}</li>
              <li>{language === 'ar' ? 'أو من خلال نموذج الاتصال في صفحة الدعم' : 'Or through the contact form on the support page'}</li>
              <li>{language === 'ar' ? 'سيتم معالجة طلبك خلال 5-10 أيام عمل' : 'Your request will be processed within 5-10 business days'}</li>
              <li>{language === 'ar' ? 'يتم إرجاع المبلغ بنفس طريقة الدفع الأصلية' : 'Refunds are returned via the original payment method'}</li>
            </ul>
            <h3 className="text-lg font-bold">{language === 'ar' ? '5. الحالات غير القابلة للاسترداد' : '5. Non-Refundable Cases'}</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>{language === 'ar' ? 'الحسابات المعلقة بسبب انتهاك شروط الاستخدام' : 'Accounts suspended due to terms of service violations'}</li>
              <li>{language === 'ar' ? 'رسوم الإعداد لمرة واحدة (إن وجدت) في خطط المؤسسات' : 'One-time setup fees (if any) on enterprise plans'}</li>
              <li>{language === 'ar' ? 'الخدمات المخصصة أو التطوير حسب الطلب' : 'Custom services or on-demand development'}</li>
            </ul>
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
                  activeTab === s.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'glass-card hover:bg-black/5'
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
