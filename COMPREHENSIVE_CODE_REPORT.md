# ZIEN Platform - تقرير شامل تفصيلي من الكود

> تم توليده تلقائياً بتاريخ: 2 مارس 2026
> المصدر: التحليل المباشر لكل ملف كود في المشروع (ليس من تقارير سابقة)

---

## 1. نظرة عامة على المنصة

| البند | القيمة |
|-------|--------|
| **اسم المشروع** | ZIEN — Enterprise Intelligence Platform |
| **الوصف** | نظام تشغيل متعدد المستأجرين (Multi-Tenant SaaS) مع وكلاء ذكاء اصطناعي RARE |
| **نوع التطبيق** | ويب (React SPA) + موبايل (Flutter) + باك اند (Cloudflare Worker) + قاعدة بيانات (Supabase/PostgreSQL) |
| **API الرئيسي** | `https://api.plt.zien-ai.app` (Cloudflare Worker) |
| **Supabase URL** | `https://rjrgylhcpnijkfstvcza.supabase.co` |
| **Package ID (موبايل)** | `com.zien.app` |

---

## 2. اللغات والتقنيات المستخدمة

### 2.1 لغات البرمجة

| اللغة | الاستخدام |
|-------|----------|
| **TypeScript** | الويب (React) + Worker (Cloudflare) |
| **Dart** | تطبيق الموبايل (Flutter) |
| **SQL** | مخطط قاعدة البيانات (Supabase/PostgreSQL) |
| **CSS (Tailwind)** | التنسيق المرئي |

### 2.2 التقنيات والأطر (Frameworks)

| التقنية | الإصدار | الاستخدام |
|---------|---------|----------|
| **React** | 19.0.0 | واجهة الويب |
| **Vite** | 6.2.0 | أداة البناء والتطوير |
| **TypeScript** | 5.8.2 | نظام الأنواع |
| **Tailwind CSS** | 4.1.14 | التنسيق المرئي |
| **Flutter** | Dart SDK ^3.7.0 | تطبيق الموبايل |
| **Cloudflare Workers** | Wrangler 3.105 | الخادم/API |
| **Supabase** | JS SDK ^2.97.0 | قاعدة البيانات + المصادقة |
| **Stripe** | SDK ^17.7.0 | الدفع الإلكتروني |

### 2.3 المكتبات الرئيسية (ويب)

| المكتبة | الغرض |
|---------|-------|
| `react-router-dom` 7.13.1 | التوجيه |
| `motion` (Framer Motion) 12.34.3 | الرسوم المتحركة |
| `lucide-react` 0.546.0 | الأيقونات |
| `i18next` + `react-i18next` | الترجمة متعددة اللغات |
| `@supabase/supabase-js` | Backend-as-a-Service |
| `react-hook-form` + `zod` | إدارة النماذج والتحقق |
| `recharts` | الرسوم البيانية |
| `react-markdown` | عرض Markdown |
| `react-turnstile` | حماية CAPTCHA |
| `socket.io-client` | Real-time اتصال |
| `@google/genai` | (مدرجة ولكن AI يتم عبر Worker) |

### 2.4 المكتبات الرئيسية (موبايل)

| المكتبة | الغرض |
|---------|-------|
| `supabase_flutter` 2.8.3 | Supabase |
| `flutter_riverpod` 2.6.1 | إدارة الحالة |
| `go_router` 15.1.2 | التوجيه |
| `google_sign_in` 6.2.2 | دخول Google |
| `sign_in_with_apple` 6.1.4 | دخول Apple |
| `http` 1.2.2 | طلبات HTTP |
| `flutter_svg` 2.0.16 | صور SVG |
| `cached_network_image` 3.4.1 | تخزين الصور |
| `shared_preferences` 2.5.3 | تخزين محلي |
| `flutter_secure_storage` 9.2.4 | تخزين آمن |
| `intl` 0.20.2 | تنسيقات التاريخ/العملة |

---

## 3. هيكل المشروع العام

```
Zienapp-main/
├── src/                          # ← تطبيق الويب (React + TypeScript)
│   ├── main.tsx                  # نقطة الدخول
│   ├── App.tsx                   # التوجيه الرئيسي (153 سطر)
│   ├── types.ts                  # الأنواع الموحدة (459 سطر)
│   ├── i18n.ts                   # نظام الترجمة (785 سطر - 15 لغة)
│   ├── index.css                 # التنسيق الأساسي (Tailwind)
│   ├── components/               # 8 مكونات (1,089 سطر)
│   ├── pages/                    # 31 صفحة (~8,926 سطر)
│   ├── services/                 # 6 خدمات (688 سطر)
│   ├── contexts/                 # 3 سياقات (375 سطر)
│   ├── hooks/                    # 1 Hook (72 سطر)
│   ├── lib/                      # نظام الصلاحيات (162 سطر)
│   └── constants/                # الأصول والترجمات (382 سطر)
│
├── mobile/                       # ← تطبيق الموبايل (Flutter + Dart)
│   ├── lib/                      # الكود الأساسي (~3,876 سطر)
│   │   ├── main.dart             # نقطة الدخول (67 سطر)
│   │   ├── auth/                 # بوابة المصادقة
│   │   ├── config/               # الإعدادات + التوجيه
│   │   ├── models/               # نماذج البيانات (553 سطر)
│   │   ├── screens/              # 3 شاشات (2,614 سطر)
│   │   ├── services/             # مزودات Riverpod (431 سطر)
│   │   ├── theme/                # نظام المظهر (96 سطر)
│   │   └── widgets/              # (فارغ حالياً)
│   ├── android/                  # إعدادات Android
│   ├── ios/                      # إعدادات iOS
│   └── pubspec.yaml              # التبعيات
│
├── worker/                       # ← الخادم (Cloudflare Worker)
│   ├── src/                      # الكود (~3,007 سطر)
│   │   ├── index.ts              # نقطة الدخول + التوجيه
│   │   ├── cors.ts               # إعدادات CORS
│   │   ├── supabase.ts           # عميل Supabase + المصادقة
│   │   ├── permissions.ts        # نظام الصلاحيات
│   │   └── routes/               # 9 وحدات مسارات (~48 نقطة نهاية)
│   ├── wrangler.toml             # إعدادات النشر
│   └── package.json              # التبعيات
│
├── supabase/                     # ← قاعدة البيانات
│   ├── migrations/               # 15 ملف هجرة (~73 جدول)
│   └── functions/                # 1 Edge Function
│
├── server.ts                     # خادم Express محلي (مهمل)
├── vite.config.ts                # إعدادات Vite
├── package.json                  # تبعيات الويب
└── index.html                    # صفحة HTML الرئيسية
```

---

## 4. تطبيق الويب (Web Frontend) — تفصيلي

### 4.1 نقطة الدخول والتوجيه

**main.tsx** (15 سطر): يُنشئ جذر React مع `BrowserRouter` و `React.StrictMode`.

**App.tsx** (153 سطر): يوفر الهيكل الرئيسي مع:
- `ErrorBoundary` → `ThemeProvider` → `ToastProvider` → `AuthProvider` → `CompanyProvider` → `AppRoutes`
- التوجيه يدوي عبر `window.location.pathname` (ليس React Router `<Routes>`)
- Lazy loading لجميع الصفحات عبر `React.lazy()`

### 4.2 المسارات المُعرّفة

| المسار | الصفحة | الحماية |
|--------|--------|---------|
| `/` | LandingPage | عام |
| `/login` | LoginPage | عام |
| `/register` | OnboardingWizard | عام |
| `/auth/callback` | AuthCallback | عام |
| `/features` | FeaturesPage | عام |
| `/faq` | FAQPage | عام |
| `/contact` | ContactPage | عام |
| `/industries` | IndustriesPage | عام |
| `/academy` | AcademyPage | عام |
| `/help` | HelpCenterPage | عام |
| `/privacy` و `/terms` | LegalPage | عام |
| `/dashboard` و `/dashboard/*` | Dashboard | محمي (مصادقة) |
| `/owner` و `/owner/*` | OwnerDashboard/FounderPage | محمي (FOUNDER / PLATFORM_ADMIN) |
| `/portal` | EmployeePortal | محمي (مصادقة) |
| `/client` | ClientPortal | محمي (CLIENT_USER + GM + Secretary) |
| `/no-access` | NoAccessPage | عام |

### 4.3 الصفحات العامة (Public Pages) — 8 ملفات / ~2,004 سطر

| الصفحة | الأسطر | الوصف |
|--------|--------|-------|
| **LandingPage.tsx** | 518 | صفحة هبوط تسويقية: بطل متحرك (3 شرائح)، شبكة ميزات، نموذج تجريبي للتهيئة، تذييل |
| **LoginPage.tsx** | 439 | تسجيل دخول: بريد/كلمة سر + OAuth (Google/GitHub) + تسجيل جديد مع تأكيد البريد |
| **FeaturesPage.tsx** | 138 | عرض ميزات المنصة |
| **FAQPage.tsx** | 398 | أسئلة شائعة قابلة للبحث بتصنيفات |
| **AcademyPage.tsx** | 492 | صفحة الأكاديمية: دورات تعليمية مع تصفية |
| **ContactPage.tsx** | 211 | نموذج اتصال + معلومات الشركة |
| **IndustriesPage.tsx** | 40 | القطاعات المدعومة |
| **HelpCenterPage.tsx** | 35 | غلاف لمركز المساعدة |
| **LegalPage.tsx** | 251 | سياسة الخصوصية وشروط الاستخدام بتبويبات |

### 4.4 صفحات لوحة القيادة (Dashboard Modules) — 13 وحدة / ~3,373 سطر

Dashboard.tsx (89 سطر) هو الغلاف الرئيسي مع `Sidebar` + `HeaderControls` ويُحمّل 13 وحدة عبر `React.lazy`:

| الوحدة | الأسطر | المسار | الوصف | جداول Supabase |
|--------|--------|--------|-------|---------------|
| **Overview** | 182 | `/dashboard/` | مؤشرات أساسية: موظفين، إيرادات، مهام، إجازات | `company_members`, `invoices`, `projects`, `leave_requests` |
| **HRModule** | 334 | `/dashboard/hr/*` | موظفين، حضور، إجازات، أقسام (4 مسارات فرعية) | `employees`, `attendance`, `leave_requests`, `departments` |
| **AccountingModule** | 242 | `/dashboard/accounting/*` | فواتير، مدفوعات، ضرائب، دليل حسابات | `invoices`, `payments`, `tax_settings`, `chart_of_accounts` |
| **CRMModule** | 195 | `/dashboard/crm/*` | جهات اتصال، صفقات، خط الأنبوب | `contacts`, `deals` |
| **LogisticsModule** | 255 | `/dashboard/logistics/*` | مركبات، مهام لوجستية، تتبع | `vehicles`, `logistics_tasks` |
| **ProjectsModule** | 219 | `/dashboard/projects` | إدارة مشاريع ومهام | `projects` |
| **StoreModule** | 281 | `/dashboard/store` | متجر ونقاط بيع | جداول المتجر |
| **MeetingsModule** | 277 | `/dashboard/meetings` | جدولة اجتماعات | جداول الاجتماعات |
| **RAREManagement** | 387 | `/dashboard/rare` | إدارة وكلاء الذكاء الاصطناعي | `ai_usage_logs` |
| **IntegrationsModule** | 243 | `/dashboard/integrations` | إدارة التكاملات | `integrations_catalog`, `tenant_integrations` |
| **PortalBuilder** | 513 | `/dashboard/portal-builder` | أداة بناء بوابة العميل (تعديل مرئي) | جداول الإعدادات |
| **Academy** | 74 | `/dashboard/academy` | نظام إدارة التعلم | `courses` |
| **HelpCenter** | 171 | `/dashboard/help` | مركز مساعدة داخلي + تذاكر | `support_tickets` |

### 4.5 البوابات الرئيسية

#### EmployeePortal.tsx — 708 سطر
بوابة الموظف مع 7 تبويبات:
- **لوحة القيادة**: حضور اليوم، رصيد الإجازات، الراتب القادم، المهام
- **المحاسبة**: فواتير + مدفوعات + ضرائب
- **الموارد البشرية**: دليل الموظفين + المستندات
- **الرواتب**: صفحة PayrollPage كاملة (356 سطر)
- **المبيعات**: إدارة العملاء
- **اللوجستيات**: المركبات والمهام
- **المحادثة**: محادثة فورية عبر Supabase Realtime

**يتضمن RARE AI مساعد عائم**: شات ذكي مع `generateRAREAnalysis()` من geminiService.

#### ClientPortal.tsx — 476 سطر
بوابة العميل مع 5 أقسام:
- نظرة عامة (إحصائيات الفواتير)
- عروض الأسعار
- العقود
- الفواتير
- تذاكر الدعم (إنشاء + عرض)

#### FounderPage.tsx — 731 سطر
مركز تحكم المؤسس مع 7 أقسام فرعية:
- **إدارة المستأجرين**: قائمة شركات مع بحث
- **تحليلات الإيرادات**: MRR/ARR/توزيع الخطط
- **AI Builder**: قائمة وكلاء RARE
- **نظام التسويق**: الحملات CRUD + الإعلانات
- **التكاملات**: الكتالوج + اتصالات المستأجرين
- **صحة المنصة**: حالة API، عدد المستخدمين
- **الأمان**: سجل تدقيق AI، إجراءات حساسة

### 4.6 معالج التسجيل (OnboardingWizard.tsx) — 576 سطر

معالج من 6 خطوات:
1. **معلومات الشركة**: اسم، نوع، بلد، مدينة
2. **حساب المدير العام**: اسم، بريد، هاتف، كلمة سر
3. **القطاع والوحدات**: اختيار القطاع → اقتراح الوحدات تلقائياً
4. **رفع المستندات**: رخصة تجارية + هوية المدير
5. **الخطة والدفع**: حاسبة أسعار (Starter $99/Business $299/Enterprise $799)
6. **الشروط والتأكيد**: الموافقة + إطلاق التهيئة

**العمليات**:
- `supabase.auth.signUp()` → إنشاء حساب
- `supabase.from('profiles').upsert()` → إنشاء ملف تعريف
- `provisioningService.provisionTenant()` → تهيئة الشركة + العضوية + العامل
- `supabase.storage.from('company-docs').upload()` → رفع مستندات
- استطلاع حالة التهيئة عبر `provisioningService.getStatus()`

---

## 5. المكونات (Components) — 8 ملفات / ~1,089 سطر

| المكون | الأسطر | الوصف |
|--------|--------|-------|
| **FloatingActions.tsx** | 500 | **المكون الأكثر تعقيداً** — مساعد RARE AI عائم قابل للسحب: شات ذكي واعٍ بالسياق، إدخال صوتي (Web Speech API)، رفع ملفات، عرض Markdown، دعم RTL، استجابة للجوال |
| **ThemeProvider.tsx** | 113 | مزود المظهر واللغة: light/dark/system + 15 لغة + glass variant + RTL (عربي/أردو) |
| **Header.tsx** | 118 | شريط تنقل عام: شعار + روابط + مبدّل لغة/مظهر + أزرار تسجيل/دخول |
| **Toast.tsx** | 117 | نظام إشعارات: 4 أنواع (نجاح/خطأ/تحذير/معلومات) مع اختفاء تلقائي (4.5 ثانية) |
| **ProtectedRoute.tsx** | 109 | بوابة تأمين متعددة الطبقات: فحص مصادقة → عزل مستأجر → دور المنصة → دور الشركة → فحص الوحدة |
| **Sidebar.tsx** | 109 | شريط جانبي قابل للطي: 13 بند تنقل مُفلتر حسب مستوى الدور |
| **ErrorBoundary.tsx** | 63 | معالج أخطاء React: واجهة بديلة مع أزرار "حاول مجدداً" و "الصفحة الرئيسية" |
| **HeaderControls.tsx** | 60 | مبدّلات لغة/مظهر مضغوطة للصفحات الداخلية |

---

## 6. الخدمات (Services) — 6 ملفات / ~688 سطر

| الخدمة | الأسطر | الوصف |
|--------|--------|-------|
| **supabase.ts** | 20 | تهيئة عميل Supabase (بيئة: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`) |
| **geminiService.ts** | 80 | عميل RARE AI: يرسل طلبات مصادقة إلى `POST /api/ai/rare` على Worker. لا يكشف مفاتيح API. يوفر `generateRAREAnalysis()` و `generateBusinessReport()` |
| **rareService.ts** | 46 | غلاف مبسط لـ RARE: `askRARE(prompt)` مع معالجة أخطاء (لا يطرح استثناءات أبداً) |
| **rareKnowledgeBase.ts** | 222 | قاعدة معرفة RARE: 12 وحدة + 10 أدوار + 10 أسئلة شائعة + بانٍ لنص النظام (`buildSystemPrompt`) |
| **invitationService.ts** | 145 | CRUD للدعوات: `invite()`, `validate()`, `accept()`, `listForCompany()`, `revoke()` — عبر `company_invitations` |
| **provisioningService.ts** | 175 | تهيئة المستأجر: `provisionTenant()` مع 3 محاولات + fallback مباشر → `getStatus()` للاستطلاع |

### 6.1 نقاط API المستخدمة من الويب

| النقطة | الطريقة | الخدمة |
|--------|---------|--------|
| `/api/ai/rare` | POST | geminiService, rareService |
| `/api/provision/start` | POST | provisioningService |
| `/api/provision/status/:id` | GET | provisioningService |
| `/api/health` | GET | FounderPage |
| `/api/ai/agents` | GET | FounderPage |
| `/api/ai/usage` | GET | FounderPage |

---

## 7. إدارة الحالة (State Management)

### 7.1 الويب — React Context

| السياق | الملف | المحتويات |
|--------|-------|-----------|
| **AuthContext** | 147 سطر | الجلسة، المستخدم، الملف الشخصي، `signInWithEmail`, `signInWithOtp`, `signInWithProvider` (Google/Apple/Slack), `signUp`, `signOut`, `refreshProfile` |
| **CompanyContext** | 225 سطر | الشركات، الشركة النشطة، العضوية، الوحدات، الأقسام، `switchCompany`, `hasModule` — مع حفظ في localStorage |
| **ThemeContext** | (داخل ThemeProvider) | المظهر، اللغة، المتغير، RTL |

### 7.2 الموبايل — Riverpod

| المزود | النوع | المحتويات |
|-------|------|-----------|
| `supabaseProvider` | Provider | عميل Supabase |
| `authStateProvider` | StreamProvider | حالة المصادقة |
| `sessionProvider` | Provider | الجلسة الحالية |
| `currentUserProvider` | Provider | المستخدم الحالي |
| `isAuthenticatedProvider` | Provider | فحص المصادقة |
| `profileProvider` | FutureProvider | الملف الشخصي |
| `authNotifierProvider` | Provider | مُخطِر للتوجيه |
| `companyNotifierProvider` | StateNotifierProvider | إدارة الشركة متعددة المستأجرين |
| `activeCompanyProvider` | Provider | الشركة النشطة |
| `currentRoleProvider` | Provider | الدور الحالي |

---

## 8. نظام الصلاحيات والأدوار

### 8.1 أدوار المنصة (Platform Roles)

| الدور | المستوى | الوصف |
|-------|---------|-------|
| `founder` | 100 | مؤسس المنصة |
| `platform_admin` | 95 | مسؤول المنصة |
| `platform_support` | 90 | دعم المنصة |
| `tenant_user` | 15 | مستخدم عادي |

### 8.2 أدوار الشركة (Company Roles) — 15 دور

| الدور | المستوى | الوصف |
|-------|---------|-------|
| `company_gm` | 85 | المدير العام |
| `assistant_gm` | 80 | نائب المدير |
| `executive_secretary` | 75 | السكرتير التنفيذي |
| `department_manager` | 65 | مدير قسم |
| `supervisor` | 55 | مشرف |
| `senior_employee` | 50 | موظف أول |
| `hr_officer` | 47 | مسؤول موارد بشرية |
| `accountant` | 45 | محاسب |
| `employee` | 40 | موظف |
| `sales_rep` | 38 | مندوب مبيعات |
| `field_employee` | 35 | موظف ميداني |
| `driver` | 30 | سائق |
| `new_hire` | 25 | موظف جديد |
| `trainee` | 20 | متدرب |
| `client_user` | 10 | مستخدم عميل |

### 8.3 مستويات الصلاحيات

| الإجراء | المستوى المطلوب |
|---------|----------------|
| VIEW | 10 |
| VIEW_TEAM | 35 |
| EDIT_BASIC | 35 |
| MODULE_READ | 45 |
| MODULE_WRITE | 60 |
| APPROVE | 65 |
| ADMIN | 85 |
| PLATFORM | 95 |

### 8.4 صلاحيات الوحدات (MODULE_ACCESS)

| الوحدة | قراءة | كتابة |
|--------|-------|-------|
| dashboard | 10 | 85 |
| hr | 40 | 65 |
| accounting | 40 | 65 |
| logistics | 35 | 55 |
| crm | 35 | 55 |
| projects | 35 | 55 |
| store | 35 | 55 |
| meetings | 25 | 55 |
| rare (AI) | 25 | 65 |
| integrations | 55 | 85 |
| portal_builder | 65 | 85 |
| academy | 10 | 75 |
| help | 10 | 55 |

### 8.5 صلاحيات وكلاء AI (24 نوع)

```
accounting(45), hr(45), sales(35), fleet(35), meetings(25), gm(85),
secretary(75), founder(95), general(10), marketing(55), projects(35),
store(35), inventory(45), maintenance(35), crm(35), legal(65),
quality(55), training(45), procurement(55), finance(65), safety(45),
support(10), analytics(55), integrations(65)
```

### 8.6 مستويات إجراءات AI

| الإجراء | المستوى |
|---------|---------|
| help | 10 |
| analyze | 25 |
| report | 35 |
| act | 55 |
| approve | 65 |
| delete | 75 |
| transfer | 75 |
| payroll_run | 80 |
| terminate | 85 |

---

## 9. نظام المظاهر (Themes)

### 9.1 الألوان

| اللون | Hex | الاستخدام |
|-------|-----|----------|
| **Primary Blue** | `#2563EB` (Tailwind blue-600) | اللون الأساسي |
| **Primary Dark** | `#1D4ED8` / `#1E40AF` | المتغير الداكن |
| **Accent Green** | `#10B981` (emerald-500) | حالات النجاح |
| **Surface Light** | `#F8FAFC` | خلفية فاتحة |
| **Surface Dark** | `#0F172A` | خلفية داكنة |
| **Theme Color** | `#2563EB` | Meta theme-color |
| **Background** | `#0F172A` | PWA background |

### 9.2 الخطوط

| الخط | الاستخدام |
|------|----------|
| **Inter** (300-700) | النص الأساسي (`font-sans`) |
| **Space Grotesk** (300-700) | العناوين (`font-display`) |

### 9.3 أوضاع المظهر

| الوضع | الوصف |
|-------|-------|
| `light` | فاتح (افتراضي) |
| `dark` | داكن |
| `system` | يتبع نظام التشغيل |

### 9.4 متغيرات المظهر

| المتغير | الوصف |
|---------|-------|
| `default` | عادي |
| `glass` | زجاجي (backdrop-blur) |

### 9.5 أنماط CSS المخصصة

```css
.glass      → bg-white/80 + backdrop-blur-md + border
.btn-primary → px-6 py-3 bg-primary rounded-xl
.btn-secondary → px-6 py-3 bg-slate-100 rounded-xl
```

### 9.6 Material 3 (موبايل)

- استدارة الحقول: 12px
- استدارة الأزرار: 12px
- استدارة البطاقات: 16px
- حقول مملوءة (Filled inputs)
- أزرار مرتفعة (Elevated buttons)

---

## 10. نظام الترجمة (i18n) — 15 لغة

### 10.1 اللغات المدعومة

| الرمز | اللغة | RTL | نسبة التغطية |
|-------|-------|-----|-------------|
| `en` | English | لا | 100% (~60 مفتاح) |
| `ar` | العربية | **نعم** | 100% (~60 مفتاح) |
| `fr` | Français | لا | ~70% |
| `es` | Español | لا | ~70% |
| `de` | Deutsch | لا | ~70% |
| `tr` | Türkçe | لا | ~70% |
| `ru` | Русский | لا | ~70% |
| `zh` | 中文 | لا | ~70% |
| `ja` | 日本語 | لا | ~70% |
| `ko` | 한국어 | لا | ~70% |
| `hi` | हिन्दी | لا | ~70% |
| `ur` | اردو | **نعم** | ~70% |
| `it` | Italiano | لا | ~70% |
| `pt` | Português | لا | ~70% |
| `nl` | Nederlands | لا | ~70% |

### 10.2 نظام الترجمة المزدوج

يوجد نظامان للترجمة يعملان معاً:
1. **i18next** (i18n.ts — 785 سطر): النظام الأساسي مع `react-i18next` + كاشف اللغة التلقائي
2. **ThemeProvider translations** (translations.ts — 335 سطر): قاموس ترجمة مخصص يُستخدم عبر `useTheme().t(key)`

### 10.3 مفاتيح الترجمة الرئيسية

```
welcome, platform_desc, register, login, modules, hr, accounting,
logistics, crm, founder_page, employee_portal, client_portal, rare_ai,
academy, help_center, faq, settings, theme, language, light, dark,
system, onboarding, company_info, gm_info, legal_terms, payment,
provisioning, dashboard, attendance, leave, payroll, invoices, taxes,
tasks, fleet, meetings, chat, store, projects, ai_builder, maintenance,
marketing, integrations, subscriptions, tenants, users
```

---

## 11. تطبيق الموبايل (Flutter Mobile) — تفصيلي

### 11.1 معلومات عامة

| البند | القيمة |
|-------|--------|
| Dart SDK | ^3.7.0 |
| الحد الأدنى Android SDK | 23 (Android 6.0) |
| معرّف التطبيق | `com.zien.app` |
| فريق Apple | BN4DXG557F |
| AGP | 8.11.1 |
| Kotlin | 2.2.20 |
| إجمالي الأسطر | ~3,876 |

### 11.2 الشاشات

#### LoginScreen (423 سطر) — شاشة تسجيل الدخول
5 طرق مصادقة:
1. **بريد + كلمة سر**: `signInWithPassword()`
2. **OTP عبر الهاتف**: `signInWithOtp()` → `verifyOTP()` (رمز من 6 أرقام)
3. **Google OAuth**: `signInWithOAuth(OAuthProvider.google)` مع redirect `com.zien.app://login-callback`
4. **Apple OAuth**: `signInWithOAuth(OAuthProvider.apple)` مع نفس redirect
5. **استعادة كلمة المرور**: `resetPasswordForEmail()`

#### HomeScreen (1,327 سطر) — الشاشة الرئيسية (4 تبويبات)

**التبويب 1: Dashboard**
- يستدعي Worker API: `GET /api/control-room/overview` مع `X-Company-Id`
- يعرض: جدار الحالة (فريق/وحدات/أقسام/تكاملات)، الماليات (إيرادات/مستحقات)، استخدام AI
- مبدّل شركات لمستخدمي متعددي الشركات
- دعم السحب للتحديث

**التبويب 2: Modules**
- يعرض الوحدات النشطة مع أيقونات مرتبطة بالرمز

**التبويب 3: AI Tab (RARE AI Chat)**
- **وضع Maestro** (افتراضي): `POST /api/ai/maestro` — توجيه تلقائي للاستعلام
- **وضع يدوي**: `POST /api/ai/rare` — اختيار الوكيل والوضع يدوياً
- تحميل الوكلاء: `GET /api/ai/agents`
- واجهة شات كاملة مع فقاعات رسائل، شارات الوكيل/الوضع، اقتراحات سريعة
- اختيار الوكيل (FilterChips) + اختيار الوضع (ChoiceChips: help/analyze/act/report)

**التبويب 4: Settings**
- معلومات المستخدم + قائمة إعدادات (معظمها "غير متاح بعد")
- تسجيل خروج

#### EmployeePortalScreen (864 سطر) — بوابة الموظف (5 تبويبات)

| التبويب | الجداول المُستعلمة | العمليات |
|---------|-------------------|---------|
| Dashboard | `attendance`, `leave_requests`, `payroll`, `projects` | SELECT |
| Attendance | `attendance` | SELECT, INSERT, UPDATE (تسجيل حضور/انصراف) |
| Leave | `leave_requests` | SELECT (مع ألوان الحالة) |
| Payroll | `payroll` | SELECT (آخر 12 سجل) |
| Tasks | `projects` | SELECT (آخر 20) |

### 11.3 النماذج (Models) — 553 سطر

| النموذج | الحقول | الملف |
|---------|--------|-------|
| `Profile` | id, email, fullName, displayName, avatarUrl, phone, platformRole, isActive | profile.dart (63 سطر) |
| `Company` | 28 حقل (انظر section 13) | company.dart (176 سطر) |
| `CompanyMember` | id, companyId, userId, role, departmentId, branchId, status, isPrimary | company.dart |
| `Department` | id, companyId, code, name, managerId, isActive | company.dart |
| `ModuleCatalog` | id, code, nameAr, nameEn, icon, tier, dependencies, isActive | module.dart (90 سطر) |
| `CompanyModule` | id, companyId, moduleId, isActive, config, activatedAt, moduleCode | module.dart |

### 11.4 التعدادات (Enums) — 217 سطر في enums.dart

10 تعدادات تطابق الويب تماماً:
`PlatformRole`, `CompanyRole` (مع مستوى رقمي), `CompanyStatus`, `MemberStatus`, `ModuleTier`, `JobStatus`, `BillingInterval`, `SubscriptionStatus`, `RAREAgentType` (24 نوع), `RAREMode` (9 أوضاع), `AppLanguage` (15 لغة مع علم RTL)

### 11.5 الأصول والخطوط

| المجلد | المحتوى |
|--------|---------|
| `assets/fonts/` | فارغ |
| `assets/icons/` | `.gitkeep` فقط |
| `assets/images/` | `.gitkeep` فقط |

### 11.6 المسارات المُعرّفة (GoRouter)

| المسار | الشاشة | الحالة |
|--------|--------|--------|
| `/login` | LoginScreen | يعمل |
| `/` | HomeScreen | يعمل |
| `/employee` | EmployeePortalScreen | يعمل |
| `/dashboard` | - | مُعرّف، غير مُوصَّل |
| `/modules` | - | مُعرّف، غير مُوصَّل |
| `/rare` | - | مُعرّف، غير مُوصَّل |
| `/settings` | - | مُعرّف، غير مُوصَّل |
| `/settings/profile` | - | مُعرّف، غير مُوصَّل |
| `/settings/company` | - | مُعرّف، غير مُوصَّل |

### 11.7 الاختبارات

ملف واحد: `test/widget_test.dart` — اختبار دخان فارغ. **لا توجد اختبارات حقيقية.**

---

## 12. الخادم (Cloudflare Worker) — تفصيلي

### 12.1 إعدادات النشر

| البند | القيمة |
|-------|--------|
| اسم العامل | `zien-api` |
| النطاق | `api.plt.zien-ai.app` |
| تاريخ التوافق | 2024-12-01 |
| أعلام التوافق | `nodejs_compat` |
| المتغيرات البيئية | `ENVIRONMENT=production`, `SUPABASE_URL` |
| الأسرار | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_API_KEY`, `OPENAI_API_KEY`, `TURNSTILE_SECRET_KEY` |

### 12.2 CORS — الأصول المسموح بها

```
https://www.zien-ai.app
https://zien-ai.app
http://localhost:5173
http://localhost:3000
```

### 12.3 وحدات المسارات (9 وحدات) — ~48 نقطة نهاية

#### 1. Health (12 سطر)
| النقطة | الطريقة | الوصف |
|--------|---------|-------|
| `/health` | GET | فحص الصحة |
| `/api/health` | GET | فحص الصحة |

#### 2. Auth (60 سطر)
| النقطة | الطريقة | المصادقة | الوصف |
|--------|---------|---------|-------|
| `/api/auth/verify-turnstile` | POST | لا | التحقق من Cloudflare Turnstile |
| `/api/auth/me` | GET | JWT | ملف المستخدم + العضويات |

#### 3. AI (615 سطر) — أكبر وحدة
| النقطة | الطريقة | المصادقة | الوصف |
|--------|---------|---------|-------|
| `/api/ai/rare` | POST | JWT + دور | استعلام RARE Agent (Gemini 2.0 Flash) |
| `/api/ai/senate` | POST | JWT + مستوى 90+ | مداولة متعددة النماذج (Gemini + GPT-4o-mini) |
| `/api/ai/maestro` | POST | JWT | تصنيف مهمة ذكي + توجيه تلقائي |
| `/api/ai/usage` | GET | JWT + مستوى 60+ | تحليلات الاستخدام |
| `/api/ai/agents` | GET | JWT | قائمة الوكلاء المتاحة |

**الميزات الداخلية:**
- `checkPermission()` — تصنيف رباعي: `read_only`/`suggest`/`modify`/`sensitive`
- `buildSystemPrompt()` — 24 نص نظام مخصص لكل وكيل
- `handleMaestro()` — خطوتان: تصنيف المهمة عبر Gemini → تنفيذ مع الوكيل المناسب
- `handleSenate()` — تحليل Gemini أساسي + رأي معاكس اختياري من OpenAI

#### 4. Billing (633 سطر)
| النقطة | الطريقة | المصادقة | الوصف |
|--------|---------|---------|-------|
| `/api/billing/create-checkout-session` | POST | JWT (مالك) | إنشاء جلسة دفع Stripe |
| `/api/billing/create-portal-session` | POST | JWT | بوابة فوترة Stripe |
| `/api/billing/webhook` | POST | توقيع Stripe | معالجة أحداث Stripe |
| `/api/billing/webhook/network-intl` | POST | - | أحداث Network International |
| `/api/billing/webhook/tilr` | POST | - | أحداث Tilr |
| `/api/billing/subscription/:companyId` | GET | JWT + عضو | تفاصيل الاشتراك |
| `/api/billing/orchestrate` | POST | JWT (مالك) | توجيه بوابة الدفع حسب المنطقة |
| `/api/billing/usage/:companyId` | GET | JWT + عضو | استخدام AI/مستخدمين |
| `/api/billing/usage/report` | POST | JWT | تقرير استخدام |
| `/api/billing/plans` | GET | عام | قائمة خطط الاشتراك |

**توجيه بوابات الدفع:**
- `AE/SA/BH/OM/QA/KW` → Network International
- `EG` → Tilr
- باقي العالم → Stripe

#### 5. Provision (285 سطر)
| النقطة | الطريقة | المصادقة | الوصف |
|--------|---------|---------|-------|
| `/api/provision/start` | POST | JWT (مالك) | بدء تهيئة غير متزامنة (متساوي القوة) |
| `/api/provision/status/:jobId` | GET | JWT | حالة المهمة |
| `/api/provision/retry` | POST | JWT (مالك) | إعادة المحاولة |
| `/api/provision/blueprints` | GET | JWT | قائمة المخططات |
| `/api/provision/estimate-price` | POST | JWT | تقدير السعر |

**خط أنابيب التهيئة (4 خطوات):**
1. التحقق → 2. تطبيق وحدات المخطط → 3. بذر البيانات (أقسام، ضرائب) → 4. تفعيل الشركة

**التسعير:**
- Starter: $99/شهر (≤5 مقاعد)
- Business: $299/شهر (≤25 مقعد)
- Enterprise: $799/شهر (غير محدود)

#### 6. Integrations (266 سطر)
| النقطة | الطريقة | الوصف |
|--------|---------|-------|
| `/api/integrations/catalog` | GET | كتالوج التكاملات |
| `/api/integrations/company/:companyId` | GET | تكاملات الشركة |
| `/api/integrations/connect` | POST | تفعيل تكامل |
| `/api/integrations/disconnect` | POST | إلغاء تكامل |
| `/api/integrations/webhook/:code` | POST | استقبال webhook |
| `/api/integrations/health/:companyId` | GET | حالة صحة التكاملات |

#### 7. Accounting (618 سطر)
| النقطة | الطريقة | المستوى | الوصف |
|--------|---------|---------|-------|
| `/api/accounting/chart-of-accounts` | GET/POST | 40+/65+ | دليل الحسابات |
| `/api/accounting/journal` | GET/POST | 40+/65+ | قيود يومية (قيد مزدوج مع فحص مدين=دائن) |
| `/api/accounting/ledger/:accountCode` | GET | 40+ | دفتر أستاذ مع رصيد متحرك |
| `/api/accounting/invoices` | GET/POST | 40+/65+ | فواتير مع حساب ضريبة القيمة المضافة تلقائي |
| `/api/accounting/tax/calculate` | POST | 65+ | حاسبة ضرائب (AE=5%, SA=15%, EG=14%, BH=10%) |
| `/api/accounting/reports/trial-balance` | GET | 40+ | ميزان المراجعة |
| `/api/accounting/reports/income-statement` | GET | 40+ | قائمة الدخل |
| `/api/accounting/reports/balance-sheet` | GET | 40+ | الميزانية العمومية |
| `/api/accounting/cost-centers` | GET/POST | 40+/65+ | مراكز التكلفة |
| `/api/accounting/ai/forecast` | POST | 65+ | توقعات مالية بالذكاء الاصطناعي (Gemini) |

#### 8. Control Room (107 سطر)
| النقطة | الطريقة | الوصف |
|--------|---------|-------|
| `/api/control-room/overview` | GET | لوحة بيانات شاملة: الفريق/الوحدات/الأقسام/الماليات/AI |

#### 9. Store (159 سطر)
| النقطة | الطريقة | الوصف |
|--------|---------|-------|
| `/api/store/products` | GET/POST/DELETE | إدارة المنتجات |
| `/api/store/orders` | GET/POST | إدارة الطلبات (خصم مخزون تلقائي) |
| `/api/store/customers` | GET/POST | عملاء المتجر |
| `/api/store/analytics` | GET | إحصائيات المتجر |

### 12.4 StripeEngine (67 سطر)

| الدالة | Stripe API |
|--------|------------|
| `createCustomer()` | `customers.create` |
| `createCheckoutSession()` | `checkout.sessions.create` (subscription) |
| `createBillingPortal()` | `billingPortal.sessions.create` |
| `attachPaymentMethod()` | `paymentMethods.attach` + `customers.update` |
| `getSubscription()` | `subscriptions.retrieve` |
| `cancelSubscription()` | `subscriptions.del` |
| `reportUsage()` | `subscriptionItems.createUsageRecord` |

### 12.5 اختبارات Worker

ملف واحد: `StripeEngine.test.ts` (73 سطر) — 7 اختبارات Vitest مع Stripe SDK مُزيّف.

---

## 13. قاعدة البيانات (Supabase/PostgreSQL) — تفصيلي

### 13.1 ملخص المخطط

| البند | العدد |
|-------|-------|
| **الجداول** | 73 |
| **الفهارس** | ~104 |
| **سياسات RLS** | ~60 |
| **أنواع Enum** | 9 |
| **ملفات الهجرة** | 15 |
| **Edge Functions** | 1 |

### 13.2 فئات الجداول

#### طبقة المنصة (6 جداول)
`profiles`, `modules_catalog`, `company_types`, `company_type_template_modules`, `permissions`, `role_permissions`

#### نواة الشركة (3 جداول)
`companies` (28 عمود), `company_members`, `departments`

#### محرك التهيئة (9 جداول)
`blueprints`, `blueprint_modules`, `seed_packs`, `blueprint_seed_packs`, `provisioning_jobs`, `provisioning_job_steps`, `plan_module_entitlements`, `company_seed_applications`, `company_modules`

#### الفوترة (5 جداول)
`subscription_plans`, `company_subscriptions`, `pricing_addons`, `subscription_usage_counters`, `billing_events`

#### المحاسبة والمالية (12 جدول)
`clients`, `invoices`, `invoice_items`, `payments`, `tax_settings`, `chart_of_accounts`, `journal_entries`, `journal_lines`, `advances`, `expenses`, `receipts`, `quotes`, `contracts`

#### الموارد البشرية (11 جدول)
`employees`, `attendance`, `leave_requests`, `payroll`, `employee_documents`, `benefits`, `insurance_claims`, `job_posts`, `job_applications`, `training_courses`, `training_assignments`, `training_attempts`

#### إدارة علاقات العملاء (3 جداول)
`leads`, `opportunities`, `client_portal_users`

#### المشاريع والمهام (5 جداول)
`projects`, `project_members`, `tasks`, `task_comments`, `work_logs`

#### اللوجستيات والتتبع (8 جداول)
`vehicles`, `logistics_tasks`, `drivers`, `routes`, `shipments`, `gps_tracks`, `location_pings`, `geofences`

#### المتجر ونقاط البيع (11 جدول)
`product_categories`, `products`, `product_variants`, `warehouses`, `inventory_items`, `inventory_movements`, `pos_sessions`, `pos_orders`, `pos_order_items`, `customer_orders`, `customer_order_items`, `store_customers`, `orders`, `order_items`, `store_settings`

#### الاتصالات (11 جدول)
`chats`, `chat_channels`, `chat_channel_members`, `chat_messages`, `presence_status`, `meetings`, `meeting_rooms`, `meeting_sessions`, `meeting_participants`, `meeting_transcripts`, `meeting_summaries`

#### AI والتدقيق (6 جداول)
`ai_usage_logs`, `ai_reports`, `ai_agent_actions`, `audit_logs`, `security_events`, `feature_flags`

#### التكاملات (5 جداول)
`integrations_catalog`, `tenant_integrations`, `integration_usage_logs`, `integration_billing_map`, `marketplace_transactions`, `integration_events`

#### التهيئة والمنصة (7 جداول)
`company_onboarding_submissions`, `company_documents`, `company_invitations`, `contact_submissions`, `marketing_campaigns`, `platform_announcements`, `help_articles`, `support_tickets`, `academy_courses`

### 13.3 Supabase Edge Function

**register_company/index.ts** (172 سطر):
- يعمل على Deno
- يستقبل بيانات تسجيل الشركة
- يحل نوع الشركة من الرمز
- يولّد slug فريد
- يدعو المالك عبر البريد (`auth.admin.inviteUserByEmail()`)
- ينشئ الشركة في `companies`
- ينشئ العضوية في `company_members` (company_gm)
- يتراجع عند الخطأ
- يُرجع `company_id` + `slug` + `invited_user_id`

### 13.4 بيانات البذر (Seed Data)

**خطط الاشتراك** (00003):
- `starter` — $99/شهر، $990/سنة، 5 مستخدمين
- `business` — $299/شهر، $2990/سنة، 25 مستخدم
- `enterprise` — $799/شهر، $7990/سنة، غير محدود
- `free_trial` — مجاني، 3 مستخدمين

**الوحدات** (00003 — 12 وحدة):
`hr`, `accounting`, `logistics`, `crm`, `store`, `meetings`, `fleet`, `maintenance`, `projects`, `marketing`, `ai_engine`, `portal_builder`

**الصلاحيات** (00003 — 15 صلاحية):
`view_dashboard`, `manage_employees`, `view_attendance`, `manage_leave`, `manage_invoices`, `view_reports`, `manage_fleet`, `manage_meetings`, `manage_inventory`, `manage_projects`, `admin_panel`, `manage_subscriptions`, `manage_integrations`, `system_settings`, `ai_full_access`

**أنواع الشركات** (00004 — 9 أنواع):
`trading`, `services`, `construction`, `tech`, `restaurant`, `retail`, `manufacturing`, `healthcare`, `education`

**المخططات** (00004 — 9 مخططات مع وحدات ومجموعات بذر مُرتبطة)

---

## 14. الخدمات الخارجية المتصلة

| الخدمة | الاستخدام | مكان الاتصال |
|--------|----------|-------------|
| **Supabase** | قاعدة بيانات + مصادقة + تخزين + Realtime | الويب + الموبايل + Worker |
| **Google Gemini API** | نموذج `gemini-2.0-flash` للذكاء الاصطناعي | Worker (`ai.ts`) |
| **OpenAI API** | نموذج `gpt-4o-mini` لمداولات Senate | Worker (`ai.ts`) |
| **Stripe** | الدفع (العالمي) | Worker (`billing.ts` + `StripeEngine.ts`) |
| **Network International** | الدفع (الخليج) | Worker (`billing.ts`) — webhook فقط |
| **Tilr** | الدفع (مصر) | Worker (`billing.ts`) — webhook فقط |
| **Cloudflare Turnstile** | حماية CAPTCHA | Worker (`auth.ts`) |
| **Google OAuth** | تسجيل دخول اجتماعي | Supabase Auth (الويب + الموبايل) |
| **Apple OAuth** | تسجيل دخول اجتماعي | Supabase Auth (الموبايل) |
| **GitHub OAuth** | تسجيل دخول اجتماعي | Supabase Auth (الويب) |
| **Slack OIDC** | تسجيل دخول اجتماعي | Supabase Auth (الويب) |

---

## 15. نظام RARE AI — تفصيلي

### 15.1 البنية

```
[المستخدم] → [الويب/الموبايل] → POST /api/ai/rare → [Worker]
                                                          ↓
                                                  [checkPermission]
                                                          ↓
                                                  [buildSystemPrompt]
                                                          ↓
                                                  [Google Gemini API]
                                                          ↓
                                                  [تسجيل الاستخدام]
                                                          ↓
                                                  [الاستجابة]
```

### 15.2 الأوضاع الثلاثة

| الوضع | الوصف | المصادقة |
|-------|-------|---------|
| **RARE** | استعلام مباشر لوكيل محدد | JWT + دور + مستوى |
| **Maestro** | توجيه تلقائي: تصنيف → اختيار وكيل → تنفيذ | JWT |
| **Senate** | مداولة: تحليل Gemini + رأي معاكس GPT-4o-mini | JWT + مستوى 90+ |

### 15.3 الوكلاء (24 نوع)

```
accounting, hr, sales, fleet, meetings, gm, secretary, founder,
general, marketing, projects, store, inventory, maintenance, crm,
legal, quality, training, procurement, finance, safety, support,
analytics, integrations
```

### 15.4 قاعدة المعرفة (rareKnowledgeBase.ts)

- **MODULE_KNOWLEDGE**: 12 وحدة مع وصف + ميزات + جداول
- **ROLE_KNOWLEDGE**: 10 أدوار مع مستوى + وصف + صلاحيات
- **PLATFORM_FAQ**: 10 أسئلة وأجوبة
- **buildSystemPrompt()**: يبني نص نظام واعٍ بالدور والوحدة والمنطقة

---

## 16. نظام التهيئة (Provisioning) — تفصيلي

### 16.1 التدفق الكامل

```
[معالج التسجيل]
    ↓
[1] supabase.auth.signUp() — إنشاء حساب
    ↓
[2] supabase.from('profiles').upsert() — إنشاء ملف تعريف
    ↓
[3] provisioningService.provisionTenant({config})
    ↓
    ├── [3a] INSERT companies — إنشاء الشركة
    ├── [3b] INSERT company_members — عضوية المالك (company_gm)
    └── [3c] POST /api/provision/start — بدء Worker
              ↓
              [Worker: executeProvisioning()]
              ├── Step 1: التحقق من المخطط
              ├── Step 2: تطبيق وحدات المخطط
              ├── Step 3: بذر البيانات (أقسام + ضرائب)
              └── Step 4: تفعيل الشركة
    ↓
[4] supabase.storage.upload — رفع مستندات
    ↓
[5] INSERT company_subscriptions — إنشاء اشتراك
    ↓
[6] استطلاع الحالة عبر getStatus()
```

### 16.2 Fallback (احتياطي)

إذا فشل Worker (3 محاولات مع تراجع أسّي)، يتم التهيئة مباشرة عبر Supabase:
1. إنشاء `provisioning_jobs`
2. تحميل وتثبيت الوحدات من `modules_catalog`
3. إنشاء الأقسام الافتراضية
4. تحديث حالة المهمة إلى `completed`

---

## 17. خطط التسعير والفوترة

### 17.1 الخطط

| الخطة | شهري | سنوي | المقاعد | الميزات |
|-------|------|------|--------|---------|
| **Free Trial** | $0 | $0 | 3 | وحدات أساسية |
| **Starter** | $99 | $990 | 5 | وحدات أساسية + دعم |
| **Business** | $299 | $2,990 | 25 | كل الوحدات + AI + تكاملات |
| **Enterprise** | $799 | $7,990 | غير محدود | كل شيء + Senate AI + أولوية |

### 17.2 بوابات الدفع (3 بوابات)

| البوابة | المنطقة | الحالة |
|---------|---------|--------|
| **Stripe** | عالمي | نشطة بالكامل |
| **Network International** | AE, SA, BH, OM, QA, KW | Webhook فقط (قيد الإعداد) |
| **Tilr** | EG | Webhook فقط (قيد الإعداد) |

---

## 18. PWA (Progressive Web App)

| البند | القيمة |
|-------|--------|
| اسم التطبيق | ZIEN — Enterprise Intelligence Platform |
| الاسم القصير | ZIEN |
| نوع العرض | standalone |
| الاتجاه | portrait-primary |
| لون الخلفية | `#0F172A` |
| لون المظهر | `#2563EB` |
| الأيقونات | 192x192, 512x512, 512x512 maskable |
| الأذونات | camera, microphone, geolocation |

---

## 19. تحسين الأداء (Code Splitting)

```javascript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-ui': ['motion', 'lucide-react', 'clsx', 'tailwind-merge'],
  'vendor-charts': ['recharts'],
  'vendor-supabase': ['@supabase/supabase-js'],
  'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
  'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
  'vendor-misc': ['react-markdown', 'react-turnstile', 'socket.io-client'],
}
```

---

## 20. إحصائيات الكود الإجمالية

### 20.1 حسب المنطقة

| المنطقة | الملفات | الأسطر |
|---------|---------|--------|
| ويب — الصفحات | 31 | ~8,926 |
| ويب — المكونات | 8 | ~1,089 |
| ويب — الخدمات | 6 | ~688 |
| ويب — السياقات/Hooks/Lib | 5 | ~609 |
| ويب — الثوابت | 2 | ~382 |
| ويب — البنية التحتية | 5 | ~238 |
| **إجمالي الويب** | **57** | **~11,932** |
| موبايل — Dart | 16 | ~3,876 |
| Worker — TypeScript | 13 | ~3,007 |
| قاعدة البيانات — SQL | 13 | ~3,332 |
| Edge Function | 1 | 172 |
| **الإجمالي الكلي** | **~100** | **~22,319** |

### 20.2 حسب اللغة

| اللغة | الأسطر |
|-------|--------|
| TypeScript/TSX (ويب + Worker) | ~14,939 |
| Dart (موبايل) | ~3,876 |
| SQL (قاعدة البيانات) | ~3,332 |
| CSS | ~50 |
| HTML | ~22 |
| JSON (configs) | ~100 |

### 20.3 أكبر الملفات

| الملف | الأسطر |
|-------|--------|
| `mobile/lib/screens/home_screen.dart` | 1,327 |
| `00010_business_domain_tables.sql` | 1,037 |
| `mobile/lib/screens/employee_portal_screen.dart` | 864 |
| `src/i18n.ts` | 785 |
| `00001_unified_schema.sql` | 778 |
| `src/pages/FounderPage.tsx` | 731 |
| `src/pages/EmployeePortal.tsx` | 708 |
| `worker/src/routes/billing.ts` | 633 |
| `00011_seed_base.sql` | 625 |
| `worker/src/routes/ai.ts` | 615 |
| `worker/src/routes/accounting.ts` | 618 |
| `src/pages/OnboardingWizard.tsx` | 576 |
| `src/pages/LandingPage.tsx` | 518 |
| `src/pages/modules/PortalBuilder.tsx` | 513 |
| `src/components/FloatingActions.tsx` | 500 |

---

## 21. ملخص الحالة الحالية

### 21.1 ما يعمل فعلياً

| المكون | الحالة | التفاصيل |
|--------|--------|---------|
| **الويب — الصفحات العامة** | يعمل | 8 صفحات كاملة مع تنقل وترجمة |
| **الويب — المصادقة** | يعمل | Email/Password + OAuth (Google/GitHub) + التحقق من البريد |
| **الويب — التوجيه** | يعمل | توجيه يدوي مع Lazy Loading |
| **الويب — لوحة القيادة** | يعمل | Sidebar + 13 وحدة |
| **الويب — الصلاحيات** | يعمل | نظام كامل (19 دور + فحص وحدات + فحص AI) |
| **الويب — التهيئة** | يعمل | 6 خطوات + fallback مباشر |
| **الويب — RARE AI** | يعمل | شات عائم + 24 وكيل + 3 أوضاع |
| **الويب — المظاهر** | يعمل | Light/Dark/System + Glass + 15 لغة + RTL |
| **الموبايل — المصادقة** | يعمل | 5 طرق (Email/Phone OTP/Google/Apple/Reset) |
| **الموبايل — الرئيسية** | يعمل | 4 تبويبات (Dashboard/Modules/AI/Settings) |
| **الموبايل — بوابة الموظف** | يعمل | 5 تبويبات مع Supabase مباشر |
| **Worker — AI** | يعمل | RARE + Maestro + Senate |
| **Worker — المحاسبة** | يعمل | 14 نقطة نهاية مع قيد مزدوج |
| **Worker — الفوترة** | يعمل جزئياً | Stripe نشط، Network/Tilr webhook فقط |
| **قاعدة البيانات** | يعمل | 73 جدول + 104 فهرس + 60 سياسة RLS |

### 21.2 ما يحتاج تطوير

| المكون | التفاصيل |
|--------|---------|
| **الموبايل — المسارات** | 5 مسارات مُعرّفة لكنها غير مُوصَّلة (`/dashboard`, `/modules`, `/rare`, `/settings`, `/settings/profile`) |
| **الموبايل — Widgets** | مجلد `widgets/` فارغ — كل الكود في الشاشات |
| **الموبايل — أصول** | الخطوط/الأيقونات/الصور فارغة |
| **الموبايل — اختبارات** | لا توجد اختبارات حقيقية |
| **الموبايل — إعدادات** | صفحات الإعدادات (الملف، الشركة، المظهر، اللغة) تظهر "غير متاح بعد" |
| **Worker — Network Intl** | بوابة الدفع (الخليج) — webhook فقط، لم تُربط بعد |
| **Worker — Tilr** | بوابة الدفع (مصر) — webhook فقط، لم تُربط بعد |
| **Worker — اختبارات** | فقط StripeEngine مُختبر (7 اختبارات) |
| **الخادم المحلي** | `server.ts` مهمل — كل API على Worker |

---

> **نهاية التقرير** — تم تحليل ~100 ملف كود و ~22,319 سطر عبر 4 منصات (ويب + موبايل + Worker + قاعدة بيانات)
