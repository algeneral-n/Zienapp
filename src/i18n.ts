import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { TRANSLATIONS } from './constants/translations';

const oldResources = {
  en: {
    "welcome": "Welcome to ZIEN",
    "platform_desc": "The Operating System for Modern Business",
    "register": "Register Now",
    "login": "Login",
    "modules": "Modules",
    "hr": "Human Resources",
    "accounting": "Accounting",
    "logistics": "Logistics",
    "crm": "CRM",
    "founder_page": "Founder Control",
    "employee_portal": "Employee Portal",
    "client_portal": "Client Portal",
    "rare_ai": "RARE AI Agent",
    "academy": "ZIEN Academy",
    "help_center": "Help Center",
    "faq": "FAQ",
    "settings": "Settings",
    "theme": "Theme",
    "language": "Language",
    "light": "Light",
    "dark": "Dark",
    "system": "System",
    "onboarding": "Company Onboarding",
    "company_info": "Company Information",
    "gm_info": "General Manager Information",
    "legal_terms": "Legal Terms & Privacy",
    "payment": "Subscription & Payment",
    "provisioning": "Provisioning Modules...",
    "dashboard": "Dashboard",
    "attendance": "Attendance",
    "leave": "Leave Requests",
    "payroll": "Payroll",
    "invoices": "Invoices",
    "taxes": "Tax Settings",
    "tasks": "Tasks",
    "fleet": "Fleet Management",
    "meetings": "Meetings",
    "chat": "Chat",
    "store": "Global Store",
    "projects": "Project Management",
    "ai_builder": "AI Builder",
    "maintenance": "Maintenance",
    "marketing": "Marketing System",
    "integrations": "Integrations",
    "subscriptions": "Subscriptions",
    "tenants": "Tenants",
    "users": "Users"
  },
  ar: {
    "welcome": "مرحباً بكم في زين",
    "platform_desc": "نظام التشغيل للأعمال الحديثة",
    "register": "سجل الآن",
    "login": "تسجيل الدخول",
    "modules": "الوحدات",
    "hr": "الموارد البشرية",
    "accounting": "المحاسبة",
    "logistics": "الخدمات اللوجستية",
    "crm": "إدارة علاقات العملاء",
    "founder_page": "تحكم المؤسس",
    "employee_portal": "بوابة الموظف",
    "client_portal": "بوابة العميل",
    "rare_ai": "وكيل RARE AI",
    "academy": "أكاديمية زين",
    "help_center": "مركز المساعدة",
    "faq": "الأسئلة الشائعة",
    "settings": "الإعدادات",
    "theme": "المظهر",
    "language": "اللغة",
    "light": "فاتح",
    "dark": "داكن",
    "system": "النظام",
    "onboarding": "تهيئة الشركة",
    "company_info": "معلومات الشركة",
    "gm_info": "معلومات المدير العام",
    "legal_terms": "الشروط القانونية والخصوصية",
    "payment": "الاشتراك والدفع",
    "provisioning": "تهيئة الوحدات...",
    "dashboard": "لوحة القيادة",
    "attendance": "الحضور",
    "leave": "طلبات الإجازة",
    "payroll": "كشوف المرتبات",
    "invoices": "الفواتير",
    "taxes": "إعدادات الضرائب",
    "tasks": "المهام",
    "fleet": "إدارة الأسطول",
    "meetings": "الاجتماعات",
    "chat": "المحادثة",
    "store": "المتجر العالمي",
    "projects": "إدارة المشاريع",
    "ai_builder": "منشئ الذكاء الاصطناعي",
    "maintenance": "الصيانة",
    "marketing": "نظام التسويق",
    "integrations": "التكاملات",
    "subscriptions": "الاشتراكات",
    "tenants": "المستأجرون",
    "users": "المستخدمون"
  }
};

const resources = Object.keys(TRANSLATIONS).reduce((acc, lang) => {
  acc[lang] = { 
    translation: {
      ...(oldResources[lang as keyof typeof oldResources] || {}),
      ...TRANSLATIONS[lang]
    } 
  };
  return acc;
}, {} as Record<string, any>);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
