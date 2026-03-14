# ZIEN — القانون المطلق للمنصة
> المرجع الوحيد المعتمد — كل ملف آخر (تقرير / تدقيق / خارطة) ثانوي ويُرجع لهذا الملف
>
> آخر تحديث: 2026-03-09
>
> **قائمة المهام التنفيذية:** [TASKS_TODO.md](TASKS_TODO.md) — 208 مهمة مرتبة حسب المنطق المعماري

---

## جدول الرموز

| رمز | المعنى |
|-----|--------|
| ✅ | تم التنفيذ وموجود في الكود |
| 🟡 | موجود جزئياً أو يحتاج تعديل |
| ❌ | غير موجود ولم يُنفَّذ بعد |

---

## 1) الرؤية العامة

**ZIEN** منصة SaaS متعددة المستأجرين لإدارة الشركات بذكاء اصطناعي.

### الثوابت ✅
- إيميل المؤسس: gm@zien-ai.app
- اسم المنصة: ZIEN
- 15 لغة (en, ar, fr, es, de, tr, ru, zh, ja, ko, pt, it, nl, hi, ur)
- RTL كامل للعربية والأوردو
- مظهر فاتح/داكن/نظام
- RARE AI = المساعد الذكي في كل صفحة

---

## 2) المعمارية المعتمدة

| الطبقة | التقنية | الحالة |
|--------|---------|--------|
| Web Frontend | React + TypeScript + Vite + Tailwind | ✅ |
| Mobile | Flutter + Riverpod | ✅ |
| Worker API | Cloudflare Workers (Hono) | ✅ |
| Database | Supabase PostgreSQL + RLS | ✅ |
| Auth | Supabase Auth (Email/OTP/Google/Apple) | ✅ |
| Storage | Supabase Storage | ✅ |
| Edge Functions | Supabase Edge Functions (Deno) | 🟡 register_company فقط |
| Realtime | Supabase Realtime | 🟡 مهيأ لكن ليس في كل الموديولات |
| AI | OpenAI (gpt-4o-mini / gpt-4o) | ✅ |
| Billing | Stripe | 🟡 endpoints موجودة لكن edge functions ناقصة |
| Email | Resend | ❌ لم يُربط بعد |
| Maps | Google Maps / HERE | ❌ لم يُربط بعد |
| MongoDB | --- | مؤجل حسب البلوبرنت |

---

## 3) هيكل المشروع (Monorepo)

```
/ (root)
├── src/              ← React Web App         ✅
├── worker/           ← Cloudflare Worker API  ✅
├── mobile/           ← Flutter Mobile App     ✅
├── supabase/
│   ├── migrations/   ← 32 migration file      ✅
│   └── functions/    ← Edge Functions          🟡
├── public/           ← Static assets          ✅
├── docs/             ← Architecture docs      ✅
└── ZIEN_CONSTITUTION.md  ← هذا الملف         ✅
```

---

## 4) السكيمة الموحدة (Unified Schema)

> **إحصائية:** 150+ جدول معرّف في الـ migrations مجتمعة

### 4.1 جداول النواة

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| profiles | ✅ | auth.users trigger |
| companies | ✅ | company_id هو مفتاح العزل |
| company_members | ✅ | role_code TEXT (ليس enum) |
| departments | ✅ | |
| modules_catalog | ✅ | |
| company_modules | ✅ | |
| platform_roles | ✅ | في supabase_schema.sql |
| company_types | ✅ | |
| company_type_template_modules | ✅ | |

### 4.2 البروفيجنينج

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| blueprints | ✅ | |
| blueprint_modules | ✅ | |
| seed_packs | ✅ | |
| blueprint_seed_packs | ✅ | |
| provisioning_jobs | ✅ | |
| provisioning_job_steps | ✅ | 00007 migration |
| plan_module_entitlements | ✅ | 00007 migration |
| company_seed_applications | ✅ | 00007 migration |
| industry_blueprints | ✅ | 00015 migration |

### 4.3 الاشتراكات والتسعير

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| subscription_plans | ✅ | |
| company_subscriptions | ✅ | |
| pricing_rules | ✅ | 00012 migration |
| pricing_quotes | ✅ | 00012 migration |
| pricing_quote_items | ✅ | 00012 migration |
| pricing_addons | ✅ | 00010 migration |
| subscription_usage_counters | ✅ | 00010 migration |
| billing_events | ✅ | 00010 migration |

### 4.4 مالية ومحاسبة

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| invoices | ✅ | |
| invoice_items | ✅ | |
| payments | ✅ | |
| tax_settings | ✅ | |
| chart_of_accounts | ✅ | 00010 migration |
| journal_entries | ✅ | 00010 migration |
| journal_lines | ✅ | 00010 migration |
| advances | ✅ | 00010 migration |
| expenses | ✅ | 00010 migration |
| general_ledger | ✅ | 00013 migration |
| cost_centers | ✅ | 00013 migration |
| receipts | ✅ | 00010 migration |

### 4.5 HR

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| employees | ✅ | |
| attendance | ✅ | |
| leave_requests | ✅ | |
| payroll | ✅ | |
| employee_documents | ✅ | 00010 migration |
| benefits | ✅ | 00010 migration |
| insurance_claims | ✅ | 00010 migration |
| job_posts | ✅ | 00010 migration |
| job_applications | ✅ | 00010 migration |
| training_courses | ✅ | 00010 migration |
| training_assignments | ✅ | 00010 migration |
| training_attempts | ✅ | 00010 migration |
| employee_shifts | ✅ | 00013 migration |
| employee_goals | ✅ | 00013 migration |

### 4.6 CRM / مبيعات

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| clients | ✅ | |
| leads | ✅ | 00010 migration |
| opportunities | ✅ | 00010 migration |
| client_portal_users | ✅ | 00010 migration |
| crm_activities | ✅ | 00013 migration |
| deal_stages | ✅ | 00013 migration |
| quotes (عروض أسعار) | ✅ | |
| contracts | ✅ | |

### 4.7 مشاريع ومهام

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| projects | ✅ | |
| project_members | ✅ | 00010 migration |
| tasks | ✅ | 00010 migration |
| task_comments | ✅ | 00010 migration |
| work_logs | ✅ | 00010 migration |

### 4.8 لوجستيات وتتبع

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| vehicles | ✅ | |
| logistics_tasks | ✅ | |
| drivers | ✅ | 00010 migration |
| routes | ✅ | 00010 migration |
| shipments | ✅ | 00010 migration |
| gps_tracks | ✅ | 00010 migration |
| location_pings | ✅ | 00010 migration |
| geofences | ✅ | 00010 migration |

### 4.9 متجر ومخزون و POS

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| product_categories | ✅ | 00010 migration |
| products | ✅ | 00010 migration |
| product_variants | ✅ | 00010 migration |
| warehouses | ✅ | 00010 migration |
| inventory_items | ✅ | 00010 migration |
| inventory_movements | ✅ | 00010 migration |
| pos_sessions | ✅ | 00010 migration |
| pos_orders | ✅ | 00010 migration |
| pos_order_items | ✅ | 00010 migration |
| customer_orders | ✅ | 00010 migration |
| customer_order_items | ✅ | 00010 migration |

### 4.10 شات واجتماعات

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| chats | ✅ | |
| chat_channels | ✅ | 00010 migration |
| chat_channel_members | ✅ | 00010 migration |
| chat_messages | ✅ | 00010 migration |
| presence_status | ✅ | 00010 migration |
| meetings | ✅ | |
| meeting_rooms | ✅ | 00010 migration |
| meeting_sessions | ✅ | 00010 migration |
| meeting_participants | ✅ | 00010 migration |
| meeting_transcripts | ✅ | 00010 migration |
| meeting_summaries | ✅ | 00010 migration |

### 4.11 AI / Audit / Security

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| ai_usage_logs | ✅ | |
| ai_reports | ✅ | |
| ai_agent_actions | ✅ | 00010 migration |
| ai_policy_rules | ✅ | 00012 migration |
| ai_action_reviews | ✅ | 00012 migration |
| ai_conversation_threads | ✅ | 00012 migration |
| ai_conversation_messages | ✅ | 00012 migration |
| ai_policies | ✅ | 00014 migration |
| supreme_command_queue | ✅ | 00026 migration |
| supreme_ai_heartbeats | ✅ | 00026 migration |
| audit_logs | ✅ | |
| security_events | ✅ | 00010 migration |
| platform_audit_log | ✅ | 00014 migration |

### 4.12 الصلاحيات

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| permissions | ✅ | 00001 migration |
| role_permissions | ✅ | 00001 migration |
| feature_flags | ✅ | 00001 + 00014 migrations |

### 4.13 الانتيجريشنز

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| integrations_catalog | ✅ | 00005 migration |
| tenant_integrations | ✅ | 00005 migration |
| integration_usage_logs | ✅ | 00005 migration |
| integration_billing_map | ✅ | 00005 migration |
| integration_events | ✅ | 00010 migration |
| integration_setup_sessions | ✅ | 00012 migration |
| integration_health_checks | ✅ | 00012 migration |
| integration_sync_runs | ✅ | 00012 migration |
| marketplace_transactions | ✅ | 00006 migration |

### 4.14 منصة الفاوندر

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| platform_admins | ✅ | 00014 migration |
| platform_announcements | ✅ | 00014 migration |
| platform_config | ✅ | 00014 migration |
| platform_incidents | ✅ | 00012 migration |
| tenant_health_snapshots | ✅ | 00012 migration |
| module_runtime_metrics | ✅ | 00012 migration |

### 4.15 الموافقات

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| approval_workflows | ✅ | 00012 migration |
| approval_steps | ✅ | 00012 migration |
| approval_requests | ✅ | 00012 migration |
| approval_actions | ✅ | 00012 migration |

### 4.16 المعرفة والأكاديمية

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| help_categories | ✅ | 00016 migration |
| knowledge_articles | ✅ | 00016 migration |
| faq_categories | ✅ | 00016 migration |
| faq_items | ✅ | 00016 migration |
| faq_votes | ✅ | 00016 migration |
| faq_submissions | ✅ | 00016 migration |
| academy_tracks | ✅ | 00016 migration |
| academy_lessons | ✅ | 00016 migration |
| academy_quizzes | ✅ | 00016 migration |
| academy_questions | ✅ | 00016 migration |
| academy_enrollments | ✅ | 00016 migration |
| academy_attempts | ✅ | 00016 migration |
| academy_certificate_templates | ✅ | 00016 migration |
| academy_issued_certificates | ✅ | 00016 migration |
| ai_prompt_packs | ✅ | 00016 migration |
| content_relations | ✅ | 00016 migration |

### 4.17 التسويق والبريد

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| email_template_config | ✅ | 00021 migration |
| email_subscribers | ✅ | 00022 migration |
| email_campaigns | ✅ | 00022 migration |

### 4.18 بنية تحتية إضافية

| الجدول | الحالة | ملاحظات |
|--------|--------|---------|
| template_categories | ✅ | 004 migration |
| document_templates | ✅ | 004 migration |
| template_renders | ✅ | 004 migration |
| smart_notification_rules | ✅ | 004 migration |
| notification_routing_configs | ✅ | 004 migration |
| email_notification_channels | ✅ | 004 migration |
| resource_tagging | ✅ | 004 migration |
| custom_fields | ✅ | 004 migration |
| company_onboarding_submissions | ✅ | |
| company_documents | ✅ | |

---

## 5) RLS والأمان

| العنصر | الحالة | ملاحظات |
|--------|--------|---------|
| دالة auth_user_company_ids() | ✅ | SECURITY DEFINER + SET search_path في migration 00018 |
| عزل company_members بدون recursion | 🟡 | migration 002 تعيد السياسات القديمة (ترتيب lexicographic!) |
| RLS على كل الجداول الأساسية | 🟡 | migration 00028 تضيف RLS لكن 14+ جدول بدون حماية (chat_messages, meeting_transcripts...) |
| audit_logs لكل عملية AI حساسة | ✅ | ai_usage_logs + ai_agent_actions مع action_level |
| Worker يستخدم admin client | ✅ | checkMembership/discoverMembership في worker/src/supabase.ts |

### ⚠️ مشاكل أمنية معروفة
1. **Migration 002 تلغي إصلاح 00018**: بسبب الترتيب الأبجدي "002" > "00018" تعود السياسات الدائرية
2. **14 جدول بدون RLS**: chat_messages, meeting_transcripts, meeting_sessions, وغيرها
3. **register_company يستخدم `role` بدلاً من `role_code`**: supabase/functions/register_company/index.ts

---

## 6) البروفيجنينج

| العنصر | الحالة | ملاحظات |
|--------|--------|---------|
| POST /api/provision/start (v1) | ✅ | worker/src/routes/provision.ts |
| POST /api/provision/v2/start (3-layer) | ✅ | |
| POST /api/provision/v2/preview (dry-run) | ✅ | |
| GET /api/provision/status/:id | ✅ | |
| POST /api/provision/retry | ✅ | |
| GET /api/provision/blueprints | ✅ | |
| POST /api/pricing/generate-quote | ✅ | |
| GET /api/pricing/quote/:id | ✅ | |
| GET /api/pricing/rules | ✅ | |
| OnboardingWizard يستدعي provision/start | 🟡 | يحتاج تأكيد الربط |
| صفحة provisioning status | 🟡 | يحتاج تأكيد |

---

## 7) الانتيجريشنز

### 7.1 الفئات المطلوبة حسب البلوبرنت

| الفئة | المزودين | الحالة |
|-------|----------|--------|
| Payment | Stripe, Tabby, Tamara | 🟡 Stripe endpoints موجودة، edge functions ناقصة الكود |
| Marketing | Meta Ads, Google Ads, Mailchimp, WhatsApp Business | 🟡 worker/src/routes/marketing.ts موجود |
| Meetings & Comms | Vonage, Twilio, Zoom | 🟡 Vonage route موجود |
| Maps & Tracking | Google Maps, HERE Maps | ❌ لا يوجد ربط فعلي |
| Storage | AWS S3, Supabase Storage | ✅ Supabase Storage |
| AI | OpenAI, Google Gemini, ElevenLabs | ✅ OpenAI + Voice route |

### 7.2 صفحة الانتيجريشنز
| العنصر | الحالة |
|--------|--------|
| IntegrationsModule.tsx (Web) | ✅ |
| عرض الكتالوج | ✅ |
| ربط/فصل فعلي للمزود | 🟡 API موجود connect/disconnect |

---

## 8) التسعير الديناميكي

| العنصر | الحالة |
|--------|--------|
| جداول pricing_rules / pricing_quotes / pricing_quote_items | ✅ |
| API generate-quote | ✅ |
| pricing_addons + usage counters | ✅ |
| billing_events | ✅ |
| Stripe checkout session | ✅ worker/src/routes/billing.ts |
| Stripe webhook | 🟡 route موجود لكن edge function code مفقود |
| Stripe portal session | ✅ |

---

## 9) الصفحات

### 9.1 Public Pages

| الصفحة | المسار | الحالة |
|--------|--------|--------|
| Landing | / | ✅ |
| Features | /features | ✅ |
| Feature Detail | /features/:slug | ✅ |
| Register (OnboardingWizard) | /register | ✅ |
| Login | /login | ✅ (Email/OTP/Google/Apple + Turnstile) |
| Academy | /academy | ✅ |
| FAQ | /faq | ✅ |
| Contact | /contact | ✅ |
| Help Center | /help | ✅ |
| Industries | /industries | ✅ |
| Integrations | /integrations | ✅ |
| Legal (Privacy/Terms) | /privacy, /terms | ✅ |
| Accept Invite | /invite/:token | ✅ |
| Guest Portal | /guest, /guest/preview/* | ✅ |

### 9.2 Protected Company Pages (Dashboard Modules)

| الموديول | الملف | الحالة | ربط API حقيقي؟ |
|----------|-------|--------|-----------------|
| Overview | Overview.tsx | ✅ | 🟡 |
| HR | HRModule.tsx | ✅ | 🟡 worker/src/routes/hr.ts |
| Accounting | AccountingModule.tsx | ✅ | 🟡 worker/src/routes/accounting.ts |
| CRM | CRMModule.tsx | ✅ | 🟡 worker/src/routes/crm.ts |
| Logistics | LogisticsModule.tsx | ✅ | 🟡 worker/src/routes/logistics.ts |
| Projects | ProjectsModule.tsx | ✅ | 🟡 worker/src/routes/projects.ts |
| Store | StoreModule.tsx | ✅ | 🟡 worker/src/routes/store.ts |
| Chat | ChatModule.tsx | ✅ | 🟡 worker/src/routes/chat.ts |
| Meetings | MeetingsModule.tsx | ✅ | 🟡 worker/src/routes/meetings.ts |
| Billing | BillingModule.tsx | ✅ | ✅ worker/src/routes/billing.ts |
| RARE AI Center | RAREManagement.tsx | ✅ | ✅ worker/src/routes/ai.ts |
| Academy | Academy.tsx | ✅ | 🟡 |
| Help Center | HelpCenter.tsx | ✅ | 🟡 |
| Settings | SettingsPage.tsx | ✅ | |
| Profile | ProfilePage.tsx | ✅ | |
| Integrations | IntegrationsModule.tsx | ✅ | 🟡 worker/src/routes/integrations.ts |
| Portal Builder | PortalBuilder.tsx | ✅ | 🟡 |
| Employee Portal | EmployeePortal | ✅ | |
| Client Portal | ClientPortal | ✅ | |

> 🟡 = الموديول موجود ويعرض UI لكن يحتاج تأكيد أن كل العمليات تستدعي API حقيقي بدلاً من بيانات محلية

### 9.3 Founder Platform (/founder)

| التاب | المسار | الحالة |
|-------|--------|--------|
| Tenants | /founder/ | ✅ TenantManagement |
| Revenue | /founder/revenue | ✅ RevenueAnalytics |
| Subscriptions | /founder/subscriptions | ✅ SubscriptionManager |
| Users | /founder/users | ✅ UserManagement |
| Logs | /founder/logs | ✅ SystemLogs |
| RARE AI Builder | /founder/ai | ✅ AIBuilder |
| Marketing | /founder/marketing | ✅ MarketingSystem |
| Integrations | /founder/integrations | ✅ IntegrationControl |
| Platform Health | /founder/health | ✅ PlatformHealth |
| Maintenance | /founder/maintenance | ✅ MaintenancePanel |
| Reports | /founder/reports | ✅ ReportsCenter |
| Security | /founder/security | ✅ SecurityDashboard |
| Chat Builder | /founder/chat | ✅ ChatBuilder |
| Support | /founder/support | ✅ SupportTickets |
| Voice AI | /founder/voice | ✅ VoiceControl |
| Incidents | /founder/incidents | ✅ IncidentsAlerts |
| Provisioning | /founder/provisioning | ✅ ProvisioningOps |

> **Founder API Backend:** worker/src/routes/founder.ts يحتوي فقط على CRUD للمستأجرين (tenants).
> باقي الأقسام (Revenue, Subscriptions, Users, Logs, AI Builder...) تحتاج ربط ببيانات حقيقية من DB.

---

## 10) RARE AI — نظام الذكاء الاصطناعي

### 10.1 المكونات

| العنصر | الحالة |
|--------|--------|
| زر عائم دائم (FloatingActions.tsx) | ✅ |
| أوضاع: Help / Analyze / Report / Act / Approve / Delete / Search | ✅ |
| 24 وكيل (Agent) حسب القسم والدور | ✅ |
| صفحة مركزية RARE AI Center | ✅ RAREManagement.tsx |
| Senate (multi-model) | ✅ POST /api/ai/senate |
| Maestro (smart routing) | ✅ POST /api/ai/maestro |
| Supreme AI | ✅ POST /api/supreme/* + جداول |
| Public AI (Landing) | ✅ POST /api/ai/public |
| Text-to-Speech | ✅ POST /api/ai/tts |
| Usage tracking | ✅ GET /api/ai/usage |
| متاح Agents list | ✅ GET /api/ai/agents |

### 10.2 أوضاع العمل (Action Levels)

| الوضع | مستوى الخطورة | الحد الأدنى للرول |
|-------|---------------|-------------------|
| help | read_only | 20 (الكل) |
| analyze | read_only | 20 (الكل) |
| report | read_only | 20 (الكل) |
| act | modify | 60 (supervisor+) |
| approve | sensitive | 85 (assistant_gm+) |
| delete | sensitive | 85 (assistant_gm+) |

### 10.3 الوكلاء الـ 24

accounting, hr, sales, fleet, meetings, gm, secretary, founder, general, marketing, projects, store, inventory, maintenance, crm, legal, quality, training, procurement, finance, safety, support, analytics, integrations

### 10.4 دعم اللغات في AI ✅

خريطة LANG_NAMES مع 15 لغة — buildSystemPrompt يرسل تعليمات اللغة ديناميكياً.

### 10.5 ما يحتاج تحسين 🟡

| العنصر | الحالة |
|--------|--------|
| بحث الإنترنت (web_search) | 🟡 موجود في وضع search فقط — يحتاج توسيع |
| ربط AI بكل موديول فعلياً (بيانات حقيقية) | ❌ كل agent يرد بنصوص عامة — لا يقرأ DB |
| AI Founder analytics (يحلل بيانات المنصة فعلياً) | ❌ |
| AI conversation history | ✅ جداول ai_conversation_threads/messages موجودة |
| AI action confirmation للحساسات | ✅ action_level + AGENT_MIN_LEVEL |

---

## 11) Worker Routes

### المُسجَّلة في worker/src/index.ts

| Route | Handler | الحالة |
|-------|---------|--------|
| GET /api/health | handleHealth | ✅ |
| POST /api/ai/public | handlePublicAI | ✅ |
| POST /api/ai/tts | handleTTS | ✅ |
| ALL /api/ai/* | handleAI | ✅ (rare, senate, maestro, usage, agents) |
| ALL /api/auth/* | handleAuth | ✅ (verify-turnstile, me, invite) |
| ALL /api/provision/* | handleProvision | ✅ (start, v2/start, v2/preview, status, retry, blueprints, pricing) |
| ALL /api/billing/* | handleBilling | ✅ (checkout, portal, webhook, subscription) |
| ALL /api/integrations/* | handleIntegrations | ✅ (catalog, company, connect, disconnect, webhooks, health) |
| ALL /api/accounting/* | handleAccounting | ✅ |
| ALL /api/controlRoom/* | handleControlRoom | ✅ |
| ALL /api/store/* | handleStore | ✅ |
| ALL /api/hr/* | handleHR | ✅ |
| ALL /api/crm/* | handleCRM | ✅ |
| ALL /api/founder/* | handleFounder | ✅ (tenants CRUD + suspend) |
| ALL /api/projects/* | handleProjects | ✅ |
| ALL /api/logistics/* | handleLogisticsV2 | ✅ |
| ALL /api/meetings/* | handleMeetings | ✅ |
| ALL /api/chat/* | handleChat | ✅ |
| ALL /api/marketing/* | handleMarketing | ✅ |
| ALL /api/voice/* | handleVoice | ✅ |
| ALL /api/vonage/* | handleVonage | ✅ |
| ALL /api/email/* | handleEmail | ✅ |
| ALL /api/guest/* | handleGuest | ✅ |
| ALL /api/notifications/* | handleNotifications | ✅ |
| ALL /api/supreme/* | handleSupreme | ✅ |

---

## 12) مفاتيح البيئة

### Web (.env)
| المفتاح | الحالة |
|---------|--------|
| VITE_SUPABASE_URL | ✅ |
| VITE_SUPABASE_ANON_KEY | ✅ |
| VITE_TURNSTILE_SITE_KEY | ✅ |
| VITE_API_URL | ✅ |

### Worker (wrangler.toml secrets)
| المفتاح | الحالة |
|---------|--------|
| SUPABASE_URL | ✅ |
| SUPABASE_SERVICE_ROLE_KEY | ✅ |
| STRIPE_SECRET_KEY | ✅ |
| STRIPE_WEBHOOK_SECRET | ✅ |
| GEMINI_API_KEY | ✅ |
| TURNSTILE_SECRET_KEY | ✅ |
| VONAGE_API_KEY | ✅ |
| VONAGE_API_SECRET | ✅ |
| RESEND_API_KEY | ❌ لم يُرصد |
| META/GOOGLE/MAPS keys | ❌ لم يُرصد |

### Mobile
| المفتاح | الحالة |
|---------|--------|
| Supabase URL + Anon Key | ✅ mobile/lib/config/supabase_config.dart |

---

## 13) Seed Data

| البيانات | الحالة |
|----------|--------|
| Industries (13 قطاع) | 🟡 معرّفة في البلوبرنت، يحتاج تأكيد وجودها في DB |
| Blueprints | 🟡 الجداول موجودة لكن يحتاج تأكيد seed data |
| Seed Packs (roles, departments, tax...) | 🟡 |

---

## 14) الموبايل (Flutter)

### 14.1 الشاشات الموجودة (18 شاشة)

| الشاشة | الملف | الحالة |
|--------|-------|--------|
| Home | home_screen.dart | ✅ |
| Login | login_screen.dart | ✅ |
| Register | register_screen.dart | ✅ |
| Employee Portal | employee_portal_screen.dart | ✅ |
| Accounting | accounting_screen.dart | ✅ |
| Billing | billing_screen.dart | ✅ |
| HR | hr_screen.dart | ✅ |
| CRM | crm_screen.dart | ✅ |
| Projects | projects_screen.dart | ✅ |
| Logistics | logistics_screen.dart | ✅ |
| Meetings | meetings_screen.dart | ✅ |
| Chat | chat_screen.dart | ✅ |
| Store | store_screen.dart | ✅ |
| Settings | settings_screen.dart | ✅ |
| Tasks | tasks_screen.dart | ✅ |
| RARE AI | rare_screen.dart | ✅ |
| Supreme Access | supreme_access_screen.dart | ✅ |
| Academy | academy_screen.dart | ✅ |

### 14.2 البنية التحتية

| العنصر | الحالة |
|--------|--------|
| Riverpod state management | ✅ |
| GoRouter navigation | ✅ |
| 15 locale مدعومة | ✅ |
| RTL support | ✅ |
| Dark/Light theme | ✅ |
| Local notifications | ✅ |
| Supabase Flutter SDK | ✅ |

### 14.3 المفقود حسب البلوبرنت

| العنصر | الحالة |
|--------|--------|
| Company Switcher | ❌ |
| Driver Tracking Map | ❌ |
| Approvals workflow | ❌ |
| Client Portal Mobile | ❌ |
| Push Notifications (Firebase) | ❌ |

---

## 15) الترجمة

| اللغة | التغطية | ملاحظات |
|-------|---------|---------|
| English (en) | ✅ 100% | |
| Arabic (ar) | ✅ 100% | |
| French (fr) | 🟡 ~20% | صفحة هبوط فقط |
| Spanish (es) | 🟡 ~20% | صفحة هبوط فقط |
| German (de) | 🟡 ~20% | صفحة هبوط فقط |
| Turkish (tr) | 🟡 ~20% | صفحة هبوط فقط |
| Russian (ru) | 🟡 ~20% | صفحة هبوط فقط |
| Chinese (zh) | 🟡 ~20% | صفحة هبوط فقط |
| Japanese (ja) | 🟡 ~20% | صفحة هبوط فقط |
| Korean (ko) | 🟡 ~20% | صفحة هبوط فقط |
| Portuguese (pt) | 🟡 ~20% | صفحة هبوط فقط |
| Italian (it) | 🟡 ~20% | صفحة هبوط فقط |
| Dutch (nl) | 🟡 ~20% | صفحة هبوط فقط |
| Hindi (hi) | 🟡 ~20% | صفحة هبوط فقط |
| Urdu (ur) | 🟡 ~20% | صفحة هبوط فقط |

> **المطلوب**: إكمال ~80 مفتاح ترجمة × 13 لغة = ~1040 ترجمة جديدة

---

## 16) أفضل استخدام لكل تقنية (حسب البلوبرنت)

| التقنية | الاستخدام | الحالة |
|---------|-----------|--------|
| Supabase | Auth + DB + RLS + Realtime + Storage + Edge | ✅ |
| Cloudflare Workers | API Gateway + AI + Provisioning + Webhooks | ✅ |
| MongoDB | مؤجل — Postgres + JSONB يكفي حالياً | ✅ لم يُضف |
| Stripe | Billing + Subscriptions | 🟡 |
| Resend | Email (invites, notifications) | ❌ |
| Vonage | Voice/SMS | 🟡 route موجود |

---

## 17) خطة التنفيذ (Phases حسب البلوبرنت)

| المرحلة | المحتوى | الحالة |
|---------|---------|--------|
| Phase 0 | اعتماد هذا الملف + تثبيت naming | ✅ هذا الملف |
| Phase 1 | Unified Schema + RLS + Seeds | ✅ جداول كاملة، RLS يحتاج إصلاح |
| Phase 2 | Worker APIs (Auth/Provision/Billing/AI/Integrations) | ✅ كل الـ routes مسجلة |
| Phase 3 | Public Web + Register + Provisioning status | ✅ |
| Phase 4 | Company Portal + تحويل modules لـ real data | 🟡 |
| Phase 5 | Founder Control Plane | 🟡 UI موجود، backend محدود |
| Phase 6 | Mobile MVP | ✅ 18 شاشة |
| Phase 7 | Advanced Integrations | 🟡 |

---

---

# قائمة المهام الشاملة — TODO

> مرتبة حسب الأولوية داخل كل فئة

---

## أ) أمان وبنية تحتية (أعلى أولوية)

- [ ] **SEC-1**: إصلاح ترتيب migrations — إعادة تسمية 002_rls_store_invitations.sql إلى 00019_rls_store_invitations.sql حتى لا تلغي إصلاح 00018
- [ ] **SEC-2**: إضافة RLS للـ 14 جدول المكشوفة (chat_messages, meeting_transcripts, meeting_sessions, presence_status, gps_tracks, location_pings, وغيرها)
- [ ] **SEC-3**: إصلاح register_company edge function — تغيير `role` إلى `role_code` في supabase/functions/register_company/index.ts
- [ ] **SEC-4**: تأكيد Seed Data موجود في DB (industries, blueprints, seed_packs, modules_catalog)

---

## ب) الويب — Web

### ب.1 ربط الموديولات ببيانات حقيقية (static → real)

- [ ] **WEB-1**: HRModule — ربط كل العمليات (employees, attendance, leave, payroll) بـ /api/hr/*
- [ ] **WEB-2**: AccountingModule — ربط (chart_of_accounts, journal_entries, expenses) بـ /api/accounting/*
- [ ] **WEB-3**: CRMModule — ربط (leads, opportunities, clients, activities) بـ /api/crm/*
- [ ] **WEB-4**: LogisticsModule — ربط (vehicles, drivers, shipments, routes, GPS) بـ /api/logistics/*
- [ ] **WEB-5**: ProjectsModule — ربط (projects, tasks, members, work_logs) بـ /api/projects/*
- [ ] **WEB-6**: StoreModule — ربط (products, inventory, POS, orders) بـ /api/store/*
- [ ] **WEB-7**: ChatModule — ربط Supabase Realtime فعلي للرسائل الفورية
- [ ] **WEB-8**: MeetingsModule — ربط (rooms, sessions, participants, transcripts) بـ /api/meetings/*
- [ ] **WEB-9**: Academy — ربط (tracks, lessons, quizzes, enrollments, certificates) ببيانات حقيقية
- [ ] **WEB-10**: HelpCenter — ربط (knowledge_articles, faq_items) ببيانات حقيقية
- [ ] **WEB-11**: Overview dashboard — ربط بإحصائيات حقيقية من كل الموديولات

### ب.2 تحسينات

- [ ] **WEB-12**: توحيد صفحات Login القديمة وحذف المكرر (_archive/ موجود)
- [ ] **WEB-13**: إنشاء صفحة provisioning status/تقدم بعد التسجيل
- [ ] **WEB-14**: تحويل PricingPage من ثابتة إلى dynamic (تقرأ من pricing_rules)
- [ ] **WEB-15**: PortalBuilder — تفعيل بناء بوابات مخصصة للعملاء

---

## ج) الفاوندر — Founder

### ج.1 Backend (worker/src/routes/founder.ts)

> **الحالي:** فقط CRUD للمستأجرين (tenants list, get, update, suspend)

- [ ] **FND-1**: Revenue Analytics API — endpoint يعيد إحصائيات الإيرادات الفعلية من billing_events + company_subscriptions
- [ ] **FND-2**: Subscription Manager API — CRUD لخطط الاشتراك + تفعيل/تعطيل + إحصائيات
- [ ] **FND-3**: User Management API — قائمة كل المستخدمين + البحث + تعطيل حساب
- [ ] **FND-4**: System Logs API — قراءة audit_logs + platform_audit_log + security_events
- [ ] **FND-5**: AI Builder API — إدارة ai_policies + ai_prompt_packs + ai_policy_rules
- [ ] **FND-6**: Marketing API — إدارة email_campaigns + email_subscribers + platform_announcements
- [ ] **FND-7**: Integration Control API — إدارة integrations_catalog + health + sync status
- [ ] **FND-8**: Platform Health API — قراءة tenant_health_snapshots + module_runtime_metrics + platform_incidents
- [ ] **FND-9**: Maintenance API — إدارة feature_flags + platform_config + صيانة مجدولة
- [ ] **FND-10**: Reports API — تقارير يومي/أسبوعي/شهري مبنية على البيانات الفعلية
- [ ] **FND-11**: Security Dashboard API — security_events + أحداث مشبوهة + RLS health
- [ ] **FND-12**: Support/Tickets API — complaints + ticket tracking
- [ ] **FND-13**: Incidents/Alerts API — platform_incidents + إشعارات
- [ ] **FND-14**: Provisioning Ops API — إدارة provisioning_jobs + retry + إحصائيات

### ج.2 Frontend (ربط الأقسام ببيانات حقيقية)

- [ ] **FND-15**: ربط TenantManagement ببيانات حقيقية ✅ (الوحيد المربوط)
- [ ] **FND-16**: ربط RevenueAnalytics بـ FND-1
- [ ] **FND-17**: ربط SubscriptionManager بـ FND-2
- [ ] **FND-18**: ربط UserManagement بـ FND-3
- [ ] **FND-19**: ربط SystemLogs بـ FND-4
- [ ] **FND-20**: ربط AIBuilder بـ FND-5
- [ ] **FND-21**: ربط MarketingSystem بـ FND-6
- [ ] **FND-22**: ربط IntegrationControl بـ FND-7
- [ ] **FND-23**: ربط PlatformHealth بـ FND-8
- [ ] **FND-24**: ربط MaintenancePanel بـ FND-9
- [ ] **FND-25**: ربط ReportsCenter بـ FND-10
- [ ] **FND-26**: ربط SecurityDashboard بـ FND-11
- [ ] **FND-27**: ربط SupportTickets بـ FND-12
- [ ] **FND-28**: ربط IncidentsAlerts بـ FND-13
- [ ] **FND-29**: ربط ProvisioningOps بـ FND-14

### ج.3 AI للفاوندر

- [ ] **FND-30**: تفعيل founder agent ليقرأ بيانات المنصة الفعلية (tenants count, revenue, health)
- [ ] **FND-31**: AI Builder — واجهة لتعديل system prompts وسياسات AI بدون كود
- [ ] **FND-32**: تقارير AI تلقائية يومية/أسبوعية للفاوندر

---

## د) الموبايل — Mobile

- [ ] **MOB-1**: Company Switcher — اختيار شركة عند وجود عضويات متعددة
- [ ] **MOB-2**: Driver Tracking Map — خريطة تتبع فعلية (Google Maps / HERE)
- [ ] **MOB-3**: Approvals Workflow — شاشة موافقات (approval_requests)
- [ ] **MOB-4**: Client Portal Mobile — بوابة عميل للموبايل
- [ ] **MOB-5**: Push Notifications — Firebase Cloud Messaging
- [ ] **MOB-6**: ربط كل الشاشات الـ 18 ببيانات حقيقية عبر Worker API (مطابقة للويب)

---

## هـ) الترجمة — Translations

- [ ] **TR-1**: إكمال ترجمة French (fr) — ~60 مفتاح ناقص
- [ ] **TR-2**: إكمال ترجمة Spanish (es) — ~60 مفتاح ناقص
- [ ] **TR-3**: إكمال ترجمة German (de) — ~60 مفتاح ناقص
- [ ] **TR-4**: إكمال ترجمة Turkish (tr) — ~60 مفتاح ناقص
- [ ] **TR-5**: إكمال ترجمة Russian (ru) — ~60 مفتاح ناقص
- [ ] **TR-6**: إكمال ترجمة Chinese (zh) — ~60 مفتاح ناقص
- [ ] **TR-7**: إكمال ترجمة Japanese (ja) — ~60 مفتاح ناقص
- [ ] **TR-8**: إكمال ترجمة Korean (ko) — ~60 مفتاح ناقص
- [ ] **TR-9**: إكمال ترجمة Portuguese (pt) — ~60 مفتاح ناقص
- [ ] **TR-10**: إكمال ترجمة Italian (it) — ~60 مفتاح ناقص
- [ ] **TR-11**: إكمال ترجمة Dutch (nl) — ~60 مفتاح ناقص
- [ ] **TR-12**: إكمال ترجمة Hindi (hi) — ~60 مفتاح ناقص
- [ ] **TR-13**: إكمال ترجمة Urdu (ur) — ~60 مفتاح ناقص
- [ ] **TR-14**: Mobile i18n — تفعيل ملفات الترجمة في Flutter (ARB files)
- [ ] **TR-15**: الفاوندر — ترجمة labels أقسام الفاوندر الـ 17

---

## و) الذكاء الاصطناعي — AI Integration

### و.1 AI حقيقي (ربط بالبيانات)

- [ ] **AI-1**: ربط كل Agent ببيانات حقيقية — accounting agent يقرأ journal_entries, hr agent يقرأ employees/attendance, etc.
- [ ] **AI-2**: AI Founder mode — قراءة إحصائيات المنصة الكاملة (عدد شركات، إيرادات، صحة النظام)
- [ ] **AI-3**: AI meeting summarizer — POST /api/ai/summarize-meeting يلخص meeting_transcripts فعلياً
- [ ] **AI-4**: AI document generator — POST /api/ai/generate-document ينشئ مستندات من القوالب
- [ ] **AI-5**: AI Supreme mode — task automation + scheduled reports + autonomous monitoring

### و.2 توسيع AI

- [ ] **AI-6**: بحث إنترنت في كل الأوضاع (حالياً فقط في search mode)
- [ ] **AI-7**: RAG — ربط knowledge_articles + faq_items كمعلومات context للـ agents
- [ ] **AI-8**: AI conversation memory — حفظ واسترجاع من ai_conversation_threads
- [ ] **AI-9**: Voice AI — تحسين TTS + إضافة STT (Speech-to-Text) للموبايل
- [ ] **AI-10**: AI Academy Tutor — مساعد تعليمي ذكي مربوط بالمحتوى التعليمي

---

## ز) انتيجريشنز — Integrations

- [ ] **INT-1**: Stripe Edge Functions — كتابة كود stripe-setup + stripe-webhook + stripe-worker في supabase/functions/
- [ ] **INT-2**: Resend Email — ربط SDK في Worker لإرسال دعوات/إشعارات فعلية
- [ ] **INT-3**: Google Maps / HERE Maps — ربط حقيقي لتتبع GPS في Logistics
- [ ] **INT-4**: Meta / Google Ads — ربط Marketing APIs
- [ ] **INT-5**: WhatsApp Business — إرسال إشعارات عبر واتساب

---

## ح) Edge Functions

- [ ] **EDGE-1**: إصلاح register_company (role → role_code)
- [ ] **EDGE-2**: كتابة stripe-setup edge function
- [ ] **EDGE-3**: كتابة stripe-webhook edge function
- [ ] **EDGE-4**: كتابة stripe-worker edge function

---

## ملخص الأرقام

| الفئة | عدد المهام | أولوية |
|-------|-----------|--------|
| أمان وبنية تحتية | 4 | 🔴 عاجل |
| الويب | 15 | 🟠 عالي |
| الفاوندر | 32 | 🟠 عالي |
| الموبايل | 6 | 🟡 متوسط |
| الترجمة | 15 | 🟡 متوسط |
| الذكاء الاصطناعي | 10 | 🟠 عالي |
| الانتيجريشنز | 5 | 🟡 متوسط |
| Edge Functions | 4 | 🟠 عالي |
| **المجموع** | **91** | |

---

> هذا الملف هو القانون المطلق. أي تغيير يتم في الكود يُحدَّث هنا. لا تقارير إضافية.
