# ZIEN Master Blueprint (Single File)
**الإصدار:** 1.0  
**الهدف:** ملف مرجعي واحد يجمع الصورة الكاملة للمشروع: المعمارية، السكيمات، الجداول، البروفيجنينج، الووركر، الصفحات، الموبايل، الويب، المفاتيح، وخطة التنفيذ.

---

## 1) الرؤية العامة للمنصة
ZIEN منصة SaaS متعددة المستأجرين (Multi-Tenant) لإدارة الأعمال، مبنية على:
- Web: React + TypeScript
- Mobile: Flutter
- API: Cloudflare Workers
- Data/Auth/Realtime/Storage: Supabase
- AI: RARE AI Agents
- Billing: Stripe +apple pay+googlepay
-الخدمات الاساسية الموجوده غير الخدمات التي ستنشا من البروفيجانينج (الحسابات والضرائب +اتش ار متكامل +التسويق والمبيعات والسي ارم +الدارة المشاريع والمهام وتتيع العمليات الميدانيه وتعقب السائقين والميدانيين +الاجتماعات والشات المقنن والجماعي مع دعم الايه اي+بوابتين دخل للموظفين والعاملين الاولي البوابه الخاصه بالغياب والحضور والاجازات واوراق الشخصيه وبيانات الشركة وسجلاته البوابه الثانيه هي للمهام والادوار والمشاريع وادواره الخاصه وبياناته الخاصه بكل عمل مع دعم ايه اي وتقارير يوميه اسبوعيه شهريه سنويه -بوابه العملاء والتي سيتم الدخول اليها من خلال توكن يصدر من خلال المدير العام او مدراء الاقسام وقسم المبيعات والتسويق -اللمتجر الالكتروني العالمي مع بي او اس -ا)
- Provisioning Engine: إنشاء خدمات وموديولات حسب نوع الشركة

### الثوابت
1. عزل كامل Multi-Tenant+multi users
2. عزل كامل Roles داخل الشركة
3. ترجمة احترافية 15 لغة(arabic-english-french-italy-greek-hindi-urdu-chineese-bangali-russia-spanish-dutch-turkey-persian-japaneese)
4. RARE AI زر عائم + صفحة مركزية+agent for each service
5. التسعير ديناميكي بعد البروفيجنينج
6. البروفيجنينج هو قلب المنصة يبدا بتسجيل اسم الشركه ومعلوماتها الكامله ورفع صوره للرخصة +المدير المسؤول وايميله ورقم الهاتف مع صوره اثبات الشخصية علي ان يكون الايميل والهاتف هم بوابه الدخول للمدير وبداية صفحته الذي سينشيئ منها الادوار والصلاحيات واليوزرات الاخري الخاصه بالشركةحيث لايسمح بدخول منصه زين الا الايميلات المسجله من خلال تسجيل الشركه والبروفيجانينج والايميلات التي تسجل من خلال منصة التنانت والمدير المسؤول انواع الشركات التي يحتويها البروفجانينج ويكون قادر علي انشاء وتخصيص موديولاتها وخدماتها 
-تجاريه صناعيه-مهنيه-استشاريه-مقاولات -عقارات -تامينات -الصرافه والبنوك-الجمعيات الخيريه-المؤسسات الدوليه والسفاات-التجزئه والجمله والمخزون -ثم اختيار النشاط المحدد 
توفير لكل نوع العشرات من فئات الانشطه لكل نوع ثم عدد الموظفين ثم توافر فورم لكتابه ماهية الشركة وانواع الخدمات المطلوبه وعليه يتم انشاء الخدمات من خلال البروفيجانينج وبعدها يتم اختيار الخدمات ويمكن تعديلها وتخصيصها ثم تعرض صفحة الانتيجريشن(الدعاية والاعلان -التواصل -التخزين ولبيانات اللادوات الذكيه لكل من الحسابات والاتش ار والتسويق والدعاية )
7. الانتيجريشنز إضافات مدفوعة حسب الحاجة

---

## 2) المعمارية المعتمدة
### طبقات النظام
- **Frontend Web:** صفحات عامة + محمية + موديولات + Floating RARE
- **Frontend Mobile:** Flutter + Auth + تبويبات + موديولات تدريجية
- **API Layer (Workers):** Auth / Billing / AI / Provisioning / Integrations
- **Data Layer (Supabase):** Postgres + RLS + Realtime + Storage

---

## 3) هيكل المشاريع (Monorepo)
```text
zien/
  apps/
    web/
    mobile/
  infrastructure/
    supabase/
      migrations/
      seeds/
      functions/
    workers/
  packages/
    shared-types/ ()
  docs/
```

---

## 4) السكيمة الموحدة (Unified Schema)

### 4.1 الجداول الأساسية
#### profiles
- id (uuid) = auth.users.id
- display_name, avatar_url, phone, locale
- created_at, updated_at

#### companies
- id, name, slug
- industry_code, company_type
- logo_url, country_code, currency_code, timezone
- status (draft/provisioning/active/suspended)
- owner_user_id
- provisioning_status
- created_at, updated_at

#### company_members
- id, company_id, user_id
- role_code
- department_id
- status
- invited_by
- created_at, updated_at

#### departments
- id, company_id, code, name, manager_user_id
- created_at, updated_at

### 4.2 الأدوار
#### أدوار المنصة
- platform_founderهو جزء بعيد عن موديولات النظام الاساسيه هو ليس شركة او تنانت انما كنترول بيج للمنصة كامله الاشتراكات والمستخدمين والموديولات والصينه والانتيجريشنز والصفحات الخارجيه والتتبع والمراقبه ونظام الامان مع الدعم الشامل بايه اي وسوبريم اكسسز انتري لايه اي مع بيلدر شات ايه اي لانشاء خدامات مخصصه للتنانت او خدمات عامه وتحكم كامل بتعديل يو اي المنصة كامله 
- platform_admin
- platform_ops
- platform_support
- platform_finance

#### أدوار الشركة
- company_gm
- executive_secretary
- department_manager
- supervisor
- senior_employee
- employee
- trainee
- new_hire
- field_employee
- driver
- sales_rep
- accountant
- hr_officer
- client_user

### 4.3 كتالوج الموديولات
#### modules_catalog
- id (uuid)
- code (unique)
- name_ar, name_en
- category
- is_core
- requires_subscription
- dependency_codes (text[])
- default_config (jsonb)

#### company_modules
- id, company_id, module_id
- status (enabled/disabled/trial/pending_setup)
- source (provisioning/manual/integration)
- config (jsonb)
- enabled_by, enabled_at

### 4.4 البروفيجنينج
#### blueprints
- id, code
- name_ar, name_en
- industry_code
- business_size
- rules (jsonb)
- active

#### blueprint_modules
- blueprint_id, module_id
- is_required
- default_enabled
- sort_order
- default_config

#### seed_packs
- id, code
- pack_type (roles/tax/workflows/templates/departments/chart_of_accounts)
- payload (jsonb)
- version
- active

#### blueprint_seed_packs
- blueprint_id, seed_pack_id, apply_order

#### provisioning_jobs
- id, company_id, blueprint_id
- status (queued/running/done/error)
- step, progress
- request_payload
- resolved_modules
- logs
- idempotency_key (unique)
- started_by, started_at, finished_at
- error_message

#### provisioning_job_steps (موصى به)
- job_id, step_code, status
- started_at, finished_at
- details, error_message

### 4.5 جداول الأعمال الأساسية (مختصرة)
#### مالية ومحاسبة
- invoices, invoice_lines, payments
- tax_rates
- chart_of_accounts, journal_entries, journal_lines
- payroll_runs, payroll_items, advances
- company_subscriptions

#### HR
- employees, employee_documents
- attendance_logs, leave_requests
- benefits, insurance_claims
- job_posts, job_applications
- training_courses, training_assignments, training_attempts

#### CRM / مبيعات
- clients, leads, opportunities
- quotes, contracts, receipts
- client_portal_users

#### مشاريع ومهام
- projects, project_members
- tasks, task_comments, work_logs

#### لوجستيات وتتبّع
- vehicles, drivers, routes
- shipments, delivery_tasks
- gps_tracks, location_pings

#### متجر ومخزون وPOS
- products, product_variants
- inventory_items, inventory_movements, warehouses
- pos_sessions, pos_orders, pos_order_items
- customer_orders

#### شات واجتماعات
- chat_channels, chat_members, chat_messages
- presence_status
- meeting_rooms, meeting_sessions
- meeting_transcripts, meeting_summaries

#### AI / Audit / Integrations
- ai_usage_logs
- ai_agent_actions
- audit_logs
- security_events
- integration_connections
- integration_events

### 4.6 الانتيجريشنز
#### integration_providers
- code (stripe, vonage, meta_ads, google_ads, whatsapp, maps, storage...)
- category
- name_ar, name_en
- is_paid_addon
- default_price_model

#### company_integrations
- company_id, provider_id
- status
- connected_by
- config (بدون أسرار)
- secrets_ref
- billing_status
- last_healthcheck_at

---

## 5) RLS والسيكيوريتي (العزل الكامل)

### دوال مساعدة (Security Definer)
- current_user_id()
- is_platform_founder()
- is_company_member(company_id)
- is_company_role(company_id, roles[])
- is_company_admin(company_id)
- can_access_department(company_id, department_id)

### قواعد أساسية
1. أي جدول فيه company_id => فقط أعضاء الشركة
2. التعديل/الحذف حسب الدور + صلاحية الموديول
3. الجداول الحساسة (رواتب/قيود/اشتراكات) محمية بأدوار محددة
4. Founder يرى مؤشرات مجمعة لا بيانات حساسة
5. كل أوامر AI التنفيذية تمر عبر Permission + Audit

### طبقات حماية إضافية
- Turnstile
- Rate limiting
- Audit logs
- Vault/Secrets
- Password leak protection
- 2FA لاحقًا

---

## 6) البروفيجنينج (التركيبة الصحيحة)

### 6.1 مدخلات التسجيل
- النشاط الرئيسي/الفرعي
- عدد الموظفين/الفروع
- الدولة/العملة/اللغة
- الخدمات المطلوبة
- هل يوجد POS/مخزون/توصيل/بوابة عميل/اجتماعات/تسويق/دفع
- بيانات المدير العام
- بيانات الفوترة

### 6.2 خطوات محرك البروفيجنينج
1. **Validation + Idempotency**
2. **Blueprint Matching**
3. **Resolve Module Graph** (dependencies)
4. **Create Company Baseline**
5. **Enable Modules**
6. **Apply Seed Packs**
7. **Generate Dynamic Pricing**
8. **Integrations Recommendations**
9. **Finalize (active / pending_payment)**

### 6.3 API (Worker)
#### POST /api/provision/start
- يبدأ provisioning job
- ينشئ company / يربط blueprint / يفعّل modules / seed / pricing

#### GET /api/provision/status/:jobId
- متابعة status / progress / step / logs

#### POST /api/provision/retry/:jobId
- إعادة تشغيل خطوة فاشلة (للإدارة)

### 6.4 تحسينات ضرورية على فكرتك الحالية
- إضافة provisioning_job_steps
- إضافة idempotency_key
- تخزين dependencies داخل modules_catalog
- إخراج dynamic pricing من provisioning
- إضافة integration recommendations كجزء من الـ output
- تنفيذ async باستخدام Queue (Cloudflare Queues أو pgmq)

---

## 7) الانتيجريشنز (النموذج الشامل)

### 7.1 الفئات
#### Payment
- Stripe (أساسي)
- Apple Pay / Google Pay (عبر Stripe غالبًا)
- مزودات محلية (Telr / غيره)
- Billing + webhooks جاهزة

#### Marketing
- Meta Ads
- Google Ads
- YouTube Ads
- WhatsApp Business
- Email provider
- Tracking + attribution + عمولة

#### Meetings & Comms
- Vonage Video
- Team chat
- Transcript + AI Summary

#### Maps & Tracking
- Maps provider
- GPS tracking
- Routes analytics

#### Storage
- Supabase Storage
- R2 / S3 (اختياري)

#### AI
- Gemini (حالي)
- OpenAI (اختياري)
- Voice / OCR لاحقًا

### 7.2 صفحة الانتيجريشنز
- Public showcase + Auth-gated activation
- يظهر للمستخدم غير المسجل للعرض فقط
- التفعيل والدفع حسب الصلاحية (GM / Accounting / قسم مختص)

---

## 8) التسعير الديناميكي

### لماذا؟
لأن التسعير يعتمد على:
- نوع الشركة
- عدد المستخدمين
- الموديولات
- الفروع
- Add-ons (Integrations)
- AI usage
- Storage
- Meetings

### النموذج المقترح
- Base platform fee
- Module pricing
- Seat pricing (شرائح)
- Add-ons pricing
- Usage billing

### جداول التسعير
- pricing_plans
- pricing_plan_modules
- pricing_addons
- company_subscriptions
- subscription_usage_counters
- billing_events

---

## 9) صفحات  (المطلوب النهائي)

### 9.1 Public Pages
1. **Landing /**  
   Hero قوي + زر سجل الآن + Header (لوغو أكبر) + Footer + RARE AIالمميزات+زر انشاء ديمو حقيقي +بوابهدخول الزائرين والعملاء ويت التخصيص اذا كان عميل مع توكن او بدون فقط لرؤيه المنصة وخدماتها واذا كان كذلك يتم التحقق منه من خلال الايميل 
التكاملات
الأسئلة الشائعة
الأكاديمية
المساعدة
اتصل بنا
القطاعات
اللغة
EN
AR
FR
ES
DE
TR
RU
ZH
JA
KO
HI
UR
IT
PT
NL
نمط المظهر

افتراضي

زجاجي

أخضر داكن
المظهر
فاتح
داكن
النظام
تسجيل الدخول
تسجيل ج
2. **Register /register**  
   Workflow تسجيل شركة -> تشغيل provisioning -> حالة التقدم -> اقتراح الانتيجريشنز
3. **Login /login**  
   Email / Phone OTP / Google / Apple + Turnstile + callback
4. **Academy /academy**  
   تدريب + اختبارات + شهادات + RARE tutor
5. **FAQ /faq**  
   أسئلة شائعة + بحث + أسئلة الجمهور
6. **Contact /contact**  
   فورم + هاتف + واتساب + إيميل + خريطة
7. **Legal /privacy /terms ...**
8. **Integrations /integrations**  
   صفحة عرض وربط الانتيجريشنز

### 9.2 Protected Company Pages
- Employee Portal
- Client Portal
- HR Portal
- Accounting Portal
- Sales/CRM Portal
- Logistics Portal
- Global Store + POS
- Projects & Tasks
- Meetings & Chat
- RARE AI Center

### 9.3 Founder Platform (/owner)
- شركات/اشتراكات/تحليلات
- provisioning health
- blueprint builder
- modules catalog manager
- integrations catalog
- security monitoring
- support & complaints
- تقارير يومية/أسبوعية/شهرية

---

## 10) RARE AI (كل صفحة + كل دور)

### مكونات RARE
- زر عائم دائم
- أوضاع: Help / Analyze / Act / Report
- Agents حسب القسم والرول
- صفحة مركزية RARE AI Center

### طبقة الأمان
أي أمر تنفيذي:
1. فهم الأمر
2. فحص الصلاحية
3. تأكيد (لو حساس)
4. Audit log
5. تنفيذ
6. إرجاع النتيجة

---

## 11) Worker Routes (المستهدف)

### Health
- GET /api/health

### Auth
- POST /api/auth/verify-turnstile
- GET /api/auth/me
- POST /api/auth/preauth (اختياري)
- POST /api/auth/invite (اختياري)

### Provisioning
- POST /api/provision/start
- GET /api/provision/status/:id
- POST /api/provision/retry/:id
- GET /api/provision/blueprints
- POST /api/provision/estimate-price

### Billing
- POST /api/billing/create-checkout-session
- POST /api/billing/create-portal-session
- POST /api/billing/webhook
- GET /api/billing/subscription

### AI / RARE
- POST /api/ai/rare
- POST /api/ai/summarize-meeting
- POST /api/ai/generate-document

### Integrations
- GET /api/integrations/catalog
- GET /api/integrations/company
- POST /api/integrations/connect/:provider
- POST /api/integrations/disconnect/:provider
- POST /api/integrations/webhooks/:provider
- GET /api/integrations/health/:provider

---

## 12) مفاتيح البيئة (Env & Secrets)

### Web (.env)
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TURNSTILE_SITE_KEY=
VITE_API_URL=
VITE_APP_NAME=ZIEN
VITE_APP_VERSION=1.0.0
```

### Worker Vars/Secrets
- Vars:
  - SUPABASE_URL
  - PUBLIC_APP_URL
  - APP_ENV
- Secrets:
  - SUPABASE_SERVICE_ROLE_KEY
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
  - GEMINI_API_KEY
  - TURNSTILE_SECRET_KEY
  - VONAGE_API_KEY
  - VONAGE_API_SECRET
  - META/GOOGLE/MAPS/EMAIL keys

### Mobile
- Supabase URL
- Supabase Anon Key
- API URL
- OAuth/deep links
- لا يوجد Service Role

---

## 13) Seed Data (اللازم)

### Industries
- supermarket
- manufacturing
- trading
- services
- consulting
- logistics
- contracting
- real_estate
- charity
- media_production
- customs_import_export
- mall_retail
- technicians_services

### Blueprints (أمثلة)
- bp_supermarket_small
- bp_manufacturing_medium
- bp_trading_default
- bp_services_consulting
- bp_logistics_delivery
- bp_real_estate_agency

### Seed Packs (أمثلة)
- sp_roles_default
- sp_departments_default
- sp_tax_ae_vat
- sp_invoice_templates_basic
- sp_hr_leave_policies_default
- sp_chart_of_accounts_trading
- sp_chart_of_accounts_services
- sp_inventory_defaults
- sp_pos_receipt_template

---

## 14) الويب (React) — المطلوب الآن

### الموجود والقوي
- Public pages جيدة
- Login production ممتازة
- Worker routes أساسية موجودة
- EmployeePortal فيه chat + AI

### المطلوب (أولوية)
1. حذف/توحيد صفحات Login القديمة
2. توحيد routes + ProtectedRoute
3. تحديث provisioningService لاستخدام companies بدل tenants
4. ربط OnboardingWizard بـ /api/provision/start
5. إنشاء صفحة provisioning status
6. إنشاء Integrations Hub page
7. إزالة PricingPage الثابتة أو تحويلها إلى dynamic explainer

### تحويل الموديولات من static -> real
- Overview
- HR
- Accounting
- CRM
- Logistics
- Payroll
(كلها بخدمات API/DB حقيقية)

---

## 15) الموبايل (Flutter) — المطلوب النهائي

### MVP
- Auth (جاهز تقريبًا)
- Company switcher
- Dashboard overview
- Tasks
- Attendance
- Chat
- Notifications
- RARE AI quick assistant
- Settings/Profile

### Phase 2
- HR workflows
- Approvals
- Sales follow-up
- Driver tracking map
- Meetings + summaries
- Client portal mobile

### هيكلة Flutter المقترحة
```text
lib/
  main.dart
  app.dart
  config/
  auth/
  models/
  services/
  pages/
  widgets/
  theme/
```

---

## 16) أفضل استخدام لكل تقنية

### Supabase
ممتاز لـ:
- Auth
- DB + RLS
- Realtime
- Storage
- Edge Functions (بعض العمليات)

### Cloudflare Workers
ممتاز لـ:
- API gateway
- Webhooks
- AI orchestration
- Provisioning orchestration
- Integrations orchestration
- حماية الأسرار

### MongoDB Atlas
القرار الآن: **لا تضيفه حاليًا**
- سيزيد التعقيد بدون مكسب واضح الآن
- Postgres + JSONB يكفي جدًا
- أضفه لاحقًا فقط عند حاجة فعلية (document-heavy / event-heavy)

---

## 17) خطة التنفيذ العملية

### Phase 0
- اعتماد هذا الملف كمرجع
- تثبيت naming والأدوار

### Phase 1
- Unified schema + RLS + seeds

### Phase 2
- Worker APIs الأساسية (Auth / Provision / Billing / AI / Integrations)

### Phase 3
- Public web + Register workflow + provisioning status

### Phase 4
- Company portal + تحويل الموديولات لـ real data

### Phase 5
- Founder control plane

### Phase 6
- Mobile MVP

### Phase 7
- Advanced integrations (Vonage / Marketing / Maps / Usage billing)

---

## 18) Deliverables المطلوبة
- MASTER_BLUEPRINT.md (هذا الملف)
- SCHEMA_UNIFIED.sql
- SEED_BASE.sql
- WORKER_API_SPEC.md
- PROVISIONING_RULES.md
- ROLE_PERMISSION_MATRIX.md
- I18N_KEYS_MASTER.json

---

## 19) ملاحظات تنفيذية حاسمة
1. لا تبدأ بدمج UI قبل تثبيت السكيمة
2. لا تضيف Mongo الآن
3. وحّد tenants -> companies
4. اجعل التسعير مخرجًا من البروفيجنينج
5. الانتيجريشنز جزء من رحلة ما بعد البروفيجنينج
6. كل أوامر AI التنفيذية لازم Audit + Permission
7. لا تستخدم mock data في الموديولات الجديدة
8. ثبّت i18n keys مركزيًا

---

## 20) ملخص تنفيذي
الفكرة الكبيرة واضحة جدًا ومتماسكة:
- منصة أعمال شاملة
- provisioning ذكي
- AI واعي بالرول والصفحة
- multi-tenant قوي
- integrations مدفوعة
- web + mobile بنفس المنطق

الخطوة الصحيحة الآن:
- Unified schema + provisioning + workers
- ثم تحويل واجهاتك الحالية تدريجيًا من static إلى real data
