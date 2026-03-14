# ZIEN - قائمة المهام الشاملة (المنطق اولا)
> المرجع التنفيذي الوحيد — مرتب حسب المنطق المعماري ثم التنفيذ
>
> آخر تحديث: 2026-03-09
>
> المصدر: ZIEN Enterprise Operating Blueprint v2.0 (CSV) + تدقيق الكود الفعلي

---

## الرؤية

**منصة بتخدم Tenants بيوزراتهم — عزل كامل — Engine واحد ماسك كل الخدمات داخل كل شركة**

### الحكم على الوضع الحالي

> Enterprise-capable foundation, but not yet Enterprise-controlled system.

| الملاحظة | التفاصيل | الحالة |
|-----------|----------|--------|
| المشروع متقدم لكن ليس موحد | كود + سكيمة + ووركر + docs موجودة لكن ليست مربوطة بعقد واحد (contract) | يحتاج ربط |
| الراوتينج | React Router v6 + lazy loading موجود، لكن الموديولات داخل Dashboard تستخدم NavLink switch بدلا من nested routes | يحتاج توحيد |
| الصلاحيات | نظام role-based بارقام (100/95/90...) — يحتاج تحول الى Permission-based (Resource.Action.Scope) | تغيير جذري |
| الووركر | Hono + 25 route — لكن بدون validation / versioning / correlation IDs / structured errors | يحتاج تصليب |
| السكيمة | 150+ جدول في الـ migrations لكن مفيش reconciliation بين الكود والبلوبرنت والـ docs | يحتاج مطابقة |

---

## الرموز

| رمز | المعنى |
|-----|--------|
| `[ ]` | لم يبدا |
| `[~]` | بدا جزئيا او موجود ناقص |
| `[x]` | تم بالكامل |

---

# TIER 0: المنطق والمعمارية (اعلى اولوية)

> بدون هذا الطبقة، كل شي فوقها هش. دي الـ foundation الحقيقية.

---

## T0-1: نظام الصلاحيات — Permission Model Migration

**الحالي:** نظام role-based بارقام (getRoleLevel → 100/95/90...). كل role له رقم ثابت. الفحص: `hasLevel(role, minLevel)`.

**المطلوب (البلوبرنت):** Permission-based بصيغة `Resource.Action.Scope`:
- `hr.view` / `hr.write` / `accounting.view` / `accounting.write` / `founder.control`
- `user_permission_overrides` — allow/deny لكل مستخدم فردي
- فحص على مستوى Module + Action + Scope (شركة/قسم/شخصي)
- الماتريكس: 20 permission × 18 role (مرفقة في البلوبرنت)

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[x]` T0-1a: تصميم schema الصلاحيات الجديد | permissions, role_permissions, user_permission_overrides | ✅ Sprint 1 |
| `[x]` T0-1b: Migration تضيف الجداول + seed data للماتريكس | supabase/migrations/00029_permission_model.sql | ✅ Sprint 1 |
| `[x]` T0-1c: دالة DB `has_permission(user_id, company_id, permission_code)` | SECURITY DEFINER function | ✅ Sprint 1 |
| `[x]` T0-1d: دالة DB `user_effective_permissions(user_id, company_id)` | تجمع role_permissions + overrides | ✅ Sprint 1 |
| `[x]` T0-1e: Worker middleware `requirePermission(permissionCode)` | worker/src/middleware/permissions.ts | ✅ Sprint 1 (in supabase.ts guardEndpoint) |
| `[ ]` T0-1f: تحديث كل route handler لاستخدام permission checks بدلا من role level | worker/src/routes/*.ts | |
| `[x]` T0-1g: Frontend context `usePermissions()` hook | src/hooks/usePermissions.ts | ✅ Sprint 1 |
| `[x]` T0-1h: Frontend guard component `<RequirePermission code="hr.write">` | src/components/RequirePermission.tsx | ✅ Sprint 1 |
| `[ ]` T0-1i: تحديث ProtectedRoute ليفحص permissions مع الـ roles | src/components/ProtectedRoute.tsx | |
| `[ ]` T0-1j: Admin UI لادارة صلاحيات المستخدمين (overrides) | Founder + Company Admin | |

**الماتريكس المرجعية (من البلوبرنت):**
```
permission_code    | founder | platform_admin | company_gm | assistant_gm | dept_manager | hr_officer | accountant | supervisor | employee | client_user
dashboard.view     | Y       | Y              | Y          | Y            | Y            | Y          | Y          | Y          | Y        | Y
company.manage     |         |                | Y          | Y            |              |            |            |            |          |
members.manage     |         |                | Y          | Y            |              | Y          |            |            |          |
hr.view            |         |                | Y          | Y            | Y            | Y          |            | Y          |          |
hr.write           |         |                | Y          | Y            |              | Y          |            |            |          |
accounting.view    |         |                | Y          | Y            |              |            | Y          |            |          |
accounting.write   |         |                | Y          | Y            |              |            | Y          |            |          |
crm.view           |         |                | Y          | Y            | Y            |            |            |            |          | Y
crm.write          |         |                | Y          | Y            | Y            |            |            |            |          |
projects.view      |         |                | Y          | Y            | Y            |            |            | Y          | Y        |
projects.write     |         |                | Y          | Y            | Y            |            |            | Y          |          |
logistics.view     |         |                | Y          | Y            | Y            |            |            | Y          |          |
logistics.write    |         |                | Y          | Y            | Y            |            |            | Y          |          |
store.view         |         |                | Y          | Y            | Y            |            |            |            |          |
store.write        |         |                | Y          | Y            | Y            |            |            |            |          |
integrations.manage| Y       | Y              | Y          | Y            |              |            |            |            |          |
billing.view       | Y       | Y              | Y          | Y            |              |            | Y          |            |          |
billing.manage     | Y       | Y              | Y          | Y            |              |            | Y          |            |          |
ai.general         | Y       | Y              | Y          | Y            | Y            | Y          | Y          | Y          | Y        | Y
ai.sensitive       | Y       | Y              | Y          | Y            |              | Y          | Y          |            |          |
founder.control    | Y       | Y              |            |              |              |            |            |            |          |
```

---

## T0-2: Module Shell Standard — نمط موحد لكل موديول

**الحالي:** كل موديول ad-hoc (CRMModule 254 سطر، HRModule 240 سطر) — لا يوجد هيكل مشترك.

**المطلوب (البلوبرنت):** كل موديول يلتزم بنفس الـ shell:

```
1. List (قائمة + pagination + sorting)
2. Filters / Search / Saved Views
3. Detail View (صفحة تفصيلية)
4. Create / Edit Form (نموذج موحد)
5. Timeline (تاريخ التغييرات)
6. Attachments (مرفقات)
7. Comments / Activity (تعليقات)
8. AI Side Panel (لوحة AI جانبية)
9. Permission-aware Actions (ازرار حسب الصلاحيات)
10. Audit Snippet (سطر تدقيق)
```

**Technical hooks مطلوبة:**
- `routeId`, `moduleCode`, `requiredPermissions`
- empty/loading/error states
- export hooks, event emission hooks
- mobile-friendly layout contract

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[x]` T0-2a: تصميم ModuleShell component + types | src/components/shell/ModuleShell.tsx, types.ts | ✅ Sprint 2 |
| `[x]` T0-2b: GenericList — قائمة قابلة لاعادة الاستخدام (pagination, sort, search) | src/components/shell/GenericList.tsx | ✅ Sprint 2 |
| `[x]` T0-2c: GenericDetail — صفحة تفصيل مع tabs | src/components/shell/GenericDetail.tsx | ✅ Sprint 2 |
| `[x]` T0-2d: GenericForm — builder نماذج ديناميكي | src/components/shell/GenericForm.tsx | ✅ Sprint 2 |
| `[x]` T0-2e: TimelinePanel — log التغييرات | src/components/shell/TimelinePanel.tsx | ✅ Sprint 2 |
| `[x]` T0-2f: AttachmentsPanel — رفع وعرض مرفقات | src/components/shell/AttachmentsPanel.tsx | ✅ Sprint 2 |
| `[x]` T0-2g: CommentsPanel — تعليقات ونشاطات | src/components/shell/CommentsPanel.tsx | ✅ Sprint 2 |
| `[x]` T0-2h: AISidePanel — اتصال RARE بكل موديول | src/components/shell/AISidePanel.tsx | ✅ Sprint 2 |
| `[x]` T0-2i: PermissionActions — ازرار ذكية حسب الصلاحيات | src/components/shell/PermissionActions.tsx | ✅ Sprint 2 |
| `[x]` T0-2j: تحويل HRModule كاول pilot (يثبت النمط) | src/pages/modules/HRModule.tsx | ✅ Sprint 2 |
| `[ ]` T0-2k: تحويل باقي الموديولات (Accounting, CRM, Projects, Logistics, Store, Chat, Meetings) | src/pages/modules/*.tsx | |

---

## T0-3: API Contract Standards — تصليب الووركر

**الحالي:** Hono + 25 route. لا يوجد: validation, versioning, correlation IDs, structured error codes, audit hooks.

**المطلوب (البلوبرنت):**
- OpenAPI spec
- Versioning: `/v1/...`
- Error model: `{ error: { code, message, details, correlation_id } }`
- Idempotency keys لكل POST mutation
- Pagination: `{ data, meta: { page, per_page, total, has_more } }`
- Auth: Bearer JWT في كل request
- Correlation ID: `x-correlation-id` header تتبع الطلب عبر كل الطبقات

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[x]` T0-3a: Correlation ID middleware (يولد/يقرا x-correlation-id) | worker/src/middleware/correlation.ts | ✅ Sprint 1 |
| `[x]` T0-3b: Request validation middleware (zod schemas) | worker/src/middleware/validation.ts | ✅ Sprint 1 |
| `[x]` T0-3c: Structured error response format | worker/src/utils/errors.ts | ✅ Sprint 1 |
| `[x]` T0-3d: Standardized pagination helper | worker/src/utils/pagination.ts | ✅ Sprint 1 |
| `[ ]` T0-3e: Idempotency key middleware لـ POST mutations | worker/src/middleware/idempotency.ts | |
| `[ ]` T0-3f: Audit hook middleware (يسجل كل request في audit_logs) | worker/src/middleware/audit.ts | |
| `[ ]` T0-3g: API versioning prefix `/v1` | worker/src/index.ts | |
| `[ ]` T0-3h: تحويل كل route handler لاستخدام zod validation | worker/src/routes/*.ts | |
| `[ ]` T0-3i: Error codes catalog (enum مع كل الاكواد) | worker/src/constants/errorCodes.ts | |
| `[ ]` T0-3j: Health endpoint يرجع build version + DB health + queue depth | worker/src/routes/health.ts | |

---

## T0-4: Domain Events Architecture

**الحالي:** فقط `payment_events` للـ audit. لا يوجد event-driven architecture.

**المطلوب (البلوبرنت):** 28 حدث معياري (canonical domain events) مع:
- `correlation_id` + `causation_id` لكل event
- `entity_type` + `entity_id` + `actor_id`
- Producers و Consumers محددين لكل event
- جدول `domain_events` + `event_subscriptions`

**الاحداث المعيارية:**
```
company.created / company.provisioning.started / company.provisioning.completed / company.provisioning.failed
member.invited / member.joined
module.enabled / module.disabled
integration.connected / integration.health.failed
invoice.paid / subscription.payment_failed
ai.action.executed / ai.action.denied
```

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[x]` T0-4a: جدول domain_events + event_subscriptions + analytics_events | supabase/migrations/00030_domain_events.sql | ✅ Sprint 2 |
| `[x]` T0-4b: Helper function `emit_domain_event()` في Worker | worker/src/utils/domainEvents.ts | ✅ Sprint 2 |
| `[x]` T0-4c: اضافة emit لكل provisioning step | worker/src/routes/provision.ts | ✅ Sprint 2 |
| `[x]` T0-4d: اضافة emit لكل billing/payment event | worker/src/routes/billing.ts | ✅ Sprint 2 |
| `[x]` T0-4e: اضافة emit لكل AI action | worker/src/routes/ai.ts | ✅ Sprint 2 |
| `[x]` T0-4f: اضافة emit لكل member invite/join | worker/src/routes/auth.ts | ✅ Sprint 2 |
| `[x]` T0-4g: اضافة emit لكل module enable/disable | worker/src/routes/provision.ts | ✅ Sprint 2 |
| `[x]` T0-4h: اضافة emit لكل integration connect/disconnect | worker/src/routes/integrations.ts | ✅ Sprint 2 |

---

## T0-5: Entitlement Engine — محرك الاستحقاقات

**الحالي:** لا يوجد فحص entitlements. كل module مفعل = متاح بالكامل.

**المطلوب (البلوبرنت):**
- جدول `entitlements` (company_id, feature_code, limit_value, reset_period)
- Usage counters لكل meter: users, branches, transactions, meetings, storage_gb, ai_tokens
- Enforcement في كل API call: "هل الشركة مسموح لها؟"
- Soft limits (تحذير) و Hard limits (منع)

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[x]` T0-5a: Migration لجدول entitlements + subscription_usage_counters المحدثة | supabase/migrations/00032 | ✅ Sprint 3 |
| `[x]` T0-5b: Worker function `checkEntitlement(companyId, featureCode)` | worker/src/utils/entitlements.ts | ✅ Sprint 3 |
| `[x]` T0-5c: Worker function `incrementUsage(companyId, meter, amount)` | worker/src/utils/entitlements.ts | ✅ Sprint 3 |
| `[x]` T0-5d: Middleware `requireEntitlement(featureCode)` | worker/src/utils/entitlements.ts | ✅ Sprint 3 (util not middleware) |
| `[x]` T0-5e: اضافة entitlement checks في AI routes (ai_tokens meter) | worker/src/routes/ai.ts | ✅ Sprint 3 |
| `[x]` T0-5f: اضافة entitlement checks في Provisioning (modules limit) | worker/src/routes/provision.ts | ✅ Sprint 3 |
| `[x]` T0-5g: Frontend banner "وصلت للحد الاقصى — رقي اشتراكك" | src/components/EntitlementBanner.tsx | ✅ Sprint 3 |

---

## T0-6: Provisioning Engine — Rollback + Missing Steps

**الحالي:** 3-layer engine (match/compose/execute) — يعمل. لكن: NO rollback، خطوات ناقصة.

**المطلوب (البلوبرنت — 9 خطوات):**
1. Validation
2. Activity & Needs Analysis (تحليل النشاط)
3. Blueprint Matching
4. Module Resolution
5. Create Default Portals (بوابات موظفين + عملاء)
6. Seed Data Application
7. Dynamic Pricing Calculation
8. Subscription Creation
9. Finalize

**Rollback:**
- كل step يعلن: reversible / compensatable
- جدول `provisioning_rollbacks` + `provisioning_rollback_steps`
- partial cleanup اذا فشل step في النص
- `POST /api/provision/rollback/:id` (admin only)

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[~]` T0-6a: Steps 1-4 موجودة (validation, matching, composition) | worker/src/engines/provisioningV2.ts | |
| `[ ]` T0-6b: Step 5 — Create Default Portals (employee + client) | worker/src/engines/provisioningV2.ts | |
| `[ ]` T0-6c: Step 7 — Dynamic Pricing Calculation ربط فعلي بـ pricing | worker/src/engines/provisioningV2.ts | |
| `[ ]` T0-6d: Step 8 — Auto-create Subscription (Stripe/internal) | worker/src/engines/provisioningV2.ts | |
| `[x]` T0-6e: Migration جدول provisioning_rollbacks | supabase/migrations/00032 | ✅ Sprint 3 |
| `[x]` T0-6f: Rollback logic في كل step (reversible/compensatable) | worker/src/routes/provision.ts | ✅ Sprint 3 |
| `[x]` T0-6g: `POST /api/provision/rollback/:id` endpoint | worker/src/routes/provision.ts | ✅ Sprint 3 |

---

# TIER 1: الامان وسلامة البيانات

---

## T1-1: RLS Migration Ordering Fix

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[ ]` T1-1a: اعادة تسمية 002_rls_store_invitations.sql الى 00019_rls_store_invitations.sql | supabase/migrations/ | |
| `[ ]` T1-1b: تشغيل SQL من migration 00018 في Supabase Dashboard | supabase/migrations/00018_fix_rls_recursion.sql | |
| `[ ]` T1-1c: اضافة RLS policy للـ 14 جدول المكشوفة | chat_messages, meeting_transcripts, meeting_sessions, presence_status, gps_tracks, location_pings, etc. | |
| `[ ]` T1-1d: تدقيق 00020_fix_002_rls_and_missing_tables.sql يغطي كل الثغرات | supabase/migrations/00020 | |

---

## T1-2: Schema Reconciliation

**المشكلة:** اسماء جداول مختلفة بين البلوبرنت والكود + جداول ناقصة.

| جدول البلوبرنت | ما يقابله في الكود | الحالة |
|----------------|-------------------|--------|
| session_devices | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| visitor_profiles | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| user_permission_overrides | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| module_shell_registry | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| provisioning_rollbacks | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| provisioning_artifacts | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| pricing_components (بدل pricing_rules) | pricing_rules موجود | `[~]` مطابقة |
| pricing_tiers | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| entitlements | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| ai_model_routing_rules | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| ai_budget_policies | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| ai_confirmation_rules | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| ai_tool_access_rules | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| ai_sensitive_action_registry | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| company_ai_settings | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| document_embeddings | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| domain_events | 00030_domain_events.sql | `[x]` ✅ Sprint 2 |
| search_index | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| retention_policies | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| abandoned_signups | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| internal_offers | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| tenant_overview (view?) | 00031 materialized view | `[x]` ✅ Sprint 2 |
| founder_reports | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |
| founder_commands | 00031_schema_reconciliation.sql | `[x]` ✅ Sprint 2 |

---

## T1-3: Security Hardening

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[ ]` T1-3a: register_company يستخدم role بدلا من role_code — اصلاح | supabase/functions/register_company/index.ts | |
| `[ ]` T1-3b: Session device tracking (login/logout يسجل device info) | session_devices table + auth routes | |
| `[ ]` T1-3c: Rate limiting على AI endpoints | worker/src/routes/ai.ts | |
| `[ ]` T1-3d: SECURITY DEFINER على كل helper functions | supabase functions | |
| `[ ]` T1-3e: Step-up auth للعمليات الحساسة (delete, approve, ai.sensitive) | worker middleware | |

---

# TIER 2: محرك التنانت (Multi-Tenant Isolation)

---

## T2-1: Tenant Lifecycle

**المطلوب (البلوبرنت):**
```
draft → provisioning → trialing → active → restricted → suspended → churned → archived → rejected
```

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[x]` T2-1a: company_status enum يشمل كل الحالات | supabase/migrations/00032 | ✅ Sprint 3 — added draft/provisioning/trialing/churned/archived |
| `[x]` T2-1b: State machine transitions (من يقدر يغير من حالة لحالة) | worker/src/utils/tenantLifecycle.ts | ✅ Sprint 3 |
| `[x]` T2-1c: Auto-restrict عند تجاوز usage limits | worker/src/utils/tenantLifecycle.ts | ✅ Sprint 3 — autoRestrict() |
| `[x]` T2-1d: Auto-suspend عند فشل الدفع | worker/src/utils/tenantLifecycle.ts | ✅ Sprint 3 — autoSuspend() |
| `[~]` T2-1e: Churn detection + tracking (abandoned_signups) | analytics | Sprint 3 partial — transitions logged, full analytics later |
| `[x]` T2-1f: Reactivation flow (suspended → active) | worker/src/routes/provision.ts | ✅ Sprint 3 — via /api/provision/transition |

---

## T2-2: Visitor & Client Portal Flows

**الحالي:** Guest preview موجود. Client portal موجود. لكن ينقص: visitor tracking + lead conversion.

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[ ]` T2-2a: Visitor flow: ادخل ايميل → اذا ليس عميل/مدير → read-only + CTA | src/pages/guest/ | |
| `[ ]` T2-2b: Visitor-to-lead conversion tracking | visitor_profiles + abandoned_signups | |
| `[ ]` T2-2c: Client portal: العميل يرى عقوده وفواتيره ومشاريعه فقط | src/pages/ClientPortal | |
| `[ ]` T2-2d: Demo request flow (visitor يطلب ديمو → founder يوافق → tenant ديمو) | OnboardingWizard + founder.ts | |

---

## T2-3: Company Type Blueprints

**الحالي:** Blueprints + blueprint_modules + seed_packs موجودة. لكن: هل يوجد seed data فعلي؟

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[ ]` T2-3a: Seed data لعشر انواع شركات (commercial, professional, consulting, construction, real_estate, insurance, fx_banking, non_profit, international_orgs, retail) | supabase seed migration | |
| `[ ]` T2-3b: كل نوع شركة له blueprint + modules + seed_packs مطابقة | blueprints table | |
| `[ ]` T2-3c: تاكيد modules_catalog فيه كل الموديولات (9 groups × modules) | modules_catalog seed | |
| `[ ]` T2-3d: تاكيد OnboardingWizard يعرض انواع الشركات فعليا | src/pages/OnboardingWizard.tsx | |

---

# TIER 3: محرك التسعير والفوترة

---

## T3-1: Pricing Engine

**الحالي:** pricing_rules + pricing_quotes + generate-quote API موجودين. لكن ينقص: pricing_components, pricing_tiers, formula enforcement.

**صيغة البلوبرنت:**
```
total = base_fee + modules_fixed + seats_tier + branches_tier + usage_overage + integrations_addons + ai_usage + storage_usage
```

**الاحجام:** micro (1-5), small (6-25), medium (26-100), large (101+)
**العدادات:** users, branches, transactions, meetings, storage_gb, ai_tokens

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[x]` T3-1a: Migration pricing_components + pricing_tiers | supabase/migrations/ | ✅ 00033 |
| `[x]` T3-1b: تحديث generate-quote ليستخدم formula الجديدة | worker/src/routes/billing.ts | ✅ pricing_rules extended |
| `[x]` T3-1c: Billing breakdown يتخزن في company_subscriptions.billing_breakdown | | ✅ column + createSubscriptionHandler |
| `[x]` T3-1d: Usage metering pipeline (يحسب كل شهر ويحدث counters) | worker cron او scheduled job | ✅ meter_usage() RPC |

---

## T3-2: Stripe Integration Completion

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[x]` T3-2a: Stripe checkout session creation | worker/src/routes/billing.ts | ✅ createSubscriptionHandler |
| `[x]` T3-2b: Stripe webhook handler | worker/src/routes/billing.ts | ✅ + dunning flow |
| `[x]` T3-2c: Stripe subscription lifecycle (create/update/cancel) | worker/src/routes/billing.ts | ✅ StripeEngine enhanced |
| `[x]` T3-2d: Stripe customer portal session | worker/src/routes/billing.ts | ✅ exists |
| `[x]` T3-2e: Dunning flow (payment_failed → past_due → restrict → suspend) | billing webhook + tenant lifecycle | ✅ invoice.payment_failed handler |
| `[x]` T3-2f: Network International + Tilr completion | worker/src/routes/billing.ts | ✅ comprehensive |

---

# TIER 4: حوكمة الذكاء الاصطناعي (AI Governance)

---

## T4-1: AI Policy Engine

**الحالي:** Permission check = numeric role level. ai_policy_rules موجود لكن لا يُستخدم فعليا.

**المطلوب (البلوبرنت — 6 جداول حوكمة):**
- `ai_action_policies` — لكل module/agent: mode, action_level, min_role, require_confirmation, budget_limit
- `ai_model_routing_rules` — route_key → preferred_model, fallback_models, max_tokens, temperature
- `ai_budget_policies` — company/module budget limits (daily/monthly)
- `ai_confirmation_rules` — actions that require human confirmation
- `ai_tool_access_rules` — which tools each agent can access
- `ai_sensitive_action_registry` — catalog of sensitive actions

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[x]` T4-1a: Migration الجداول الستة + seed data | supabase/migrations/ | ✅ 00033 |
| `[x]` T4-1b: Worker policy engine: قبل كل AI call يفحص policies | worker/src/utils/aiPolicyEngine.ts | ✅ preflightAICheck |
| `[x]` T4-1c: Budget tracking: كل AI call يحسب tokens ويفحص budget | worker/src/routes/ai.ts | ✅ check_ai_budget RPC |
| `[x]` T4-1d: Model routing: يختار model حسب route_key بدلا من hardcoded | worker/src/routes/ai.ts | ✅ resolve_ai_model RPC |
| `[x]` T4-1e: Confirmation flow: AI يطلب تاكيد قبل sensitive actions | worker/src/routes/ai.ts + frontend | ✅ requireApproval + reviews UI |
| `[x]` T4-1f: Founder AI Builder UI: ادارة policies/routing/budgets | src/pages/founder/AIBuilder.tsx | ✅ 7 tabs |

---

## T4-2: AI Data Binding — ربط الوكلاء بالبيانات الحقيقية

**الحالي:** كل agent يرد بنصوص عامة — لا يقرا DB فعليا.

**المطلوب:** كل agent يقرا البيانات الفعلية للشركة/الموديول:

| المهمة | Agent | جداول يقراها | الحالة |
|--------|-------|-------------|--------|
| `[ ]` T4-2a | accounting | journal_entries, invoices, expenses, tax_settings | |
| `[ ]` T4-2b | hr | employees, attendance, leave_requests, payroll | |
| `[ ]` T4-2c | crm/sales | clients, leads, opportunities, crm_activities | |
| `[ ]` T4-2d | projects | projects, tasks, work_logs | |
| `[ ]` T4-2e | logistics/fleet | vehicles, drivers, shipments, gps_tracks | |
| `[ ]` T4-2f | store | products, orders, inventory_items | |
| `[ ]` T4-2g | founder | companies, subscriptions, revenue, health, incidents | |
| `[ ]` T4-2h | meetings | meeting_sessions, transcripts, summaries | |
| `[ ]` T4-2i | marketing | campaigns, subscribers, analytics | |

---

## T4-3: RAG — Knowledge Base

**الحالي:** knowledge_articles + help_articles موجودين. لكن لا يوجد embeddings ولا retrieval.

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[ ]` T4-3a: Migration document_embeddings table | supabase/migrations/ | |
| `[ ]` T4-3b: Embedding pipeline: document → chunks → embeddings | worker/src/utils/ragPipeline.ts | |
| `[ ]` T4-3c: Retrieval: AI agents يبحثون في knowledge base قبل الرد | worker/src/routes/ai.ts | |
| `[ ]` T4-3d: Knowledge admin UI (upload/manage documents per company) | src/pages/modules/ | |

---

# TIER 5: Founder OS — لوحة تحكم الفاوندر

> **الحالي:** 17 tab UI موجود. Backend: فقط CRUD tenants.
> **المطلوب:** 7 لوحات رئيسية (البلوبرنت) + AI modes + مؤشرات حقيقية

---

## T5-1: Control Room

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[ ]` T5-1a: API endpoint `/api/founder/control-room` يعيد: tenant health, worker/API health, queue depth, AI cost, billing failures, integration failures | worker/src/routes/founder.ts | |
| `[ ]` T5-1b: Frontend Control Room dashboard بمؤشرات حقيقية | src/pages/founder/ | |

---

## T5-2: Tenant Command Center

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[~]` T5-2a: CRUD tenants (create/suspend/reactivate) | worker/src/routes/founder.ts | موجود |
| `[ ]` T5-2b: Inspect modules per tenant | | |
| `[ ]` T5-2c: Inspect usage per tenant | | |
| `[ ]` T5-2d: Support timeline per tenant | | |
| `[ ]` T5-2e: Tenant recovery flow | | |

---

## T5-3: Commercial Engine

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[ ]` T5-3a: Pricing policies management | | |
| `[ ]` T5-3b: Coupon / dunning / upsell engine | | |
| `[ ]` T5-3c: Internal offers (abandoned signups segmentation) | | |
| `[ ]` T5-3d: Growth dashboards (MRR, churn, activation conversion) | | |

---

## T5-4: ربط كل Frontend tabs ببيانات حقيقية

| Tab | Backend API | الحالة |
|-----|------------|--------|
| `[~]` TenantManagement | `/api/founder/tenants` | موجود |
| `[ ]` RevenueAnalytics | `/api/founder/revenue` | |
| `[ ]` SubscriptionManager | `/api/founder/subscriptions` | |
| `[ ]` UserManagement | `/api/founder/users` | |
| `[ ]` SystemLogs | `/api/founder/logs` | |
| `[ ]` AIBuilder | `/api/founder/ai` | |
| `[ ]` MarketingSystem | `/api/founder/marketing` | |
| `[ ]` IntegrationControl | `/api/founder/integrations` | |
| `[ ]` PlatformHealth | `/api/founder/health` | |
| `[ ]` MaintenancePanel | `/api/founder/maintenance` | |
| `[ ]` ReportsCenter | `/api/founder/reports` | |
| `[ ]` SecurityDashboard | `/api/founder/security` | |
| `[ ]` SupportTickets | `/api/founder/support` | |
| `[ ]` IncidentsAlerts | `/api/founder/incidents` | |
| `[ ]` ProvisioningOps | `/api/founder/provisioning` | |

---

## T5-5: Founder AI Modes

**البلوبرنت يحدد 6 modes للفاوندر:**
```
Help / Analyze / Act / Report / Optimize / Recover
```

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[ ]` T5-5a: Founder agent يقرا بيانات المنصة الفعلية | worker/src/routes/ai.ts | |
| `[ ]` T5-5b: Optimize mode: اقتراحات تحسين الاداء | | |
| `[ ]` T5-5c: Recover mode: اقتراحات حل المشاكل | | |
| `[ ]` T5-5d: AI Reports Engine: تقارير تلقائية يومي/اسبوعي/شهري | founder_reports table + cron job | |

---

## T5-6: AI Commands (Founder Chat)

**البلوبرنت:** الفاوندر يكتب اوامر طبيعية → المنصة تنفذها.

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[ ]` T5-6a: Migration founder_commands table | supabase/migrations/ | |
| `[ ]` T5-6b: Intent parser: "اوقف شركة X" → parsed_intent: suspend_tenant | worker/src/routes/ai.ts | |
| `[ ]` T5-6c: Command execution engine | worker/src/utils/commandEngine.ts | |
| `[ ]` T5-6d: Confirmation flow للاوامر الحساسة | | |

---

# TIER 6: تنفيذ الموديولات (Module Implementation)

> بعد تجهيز Shell Standard (T0-2) كل موديول يُحول للنمط الموحد ويُربط ببيانات حقيقية.

---

## T6-1: ربط كل Web Module بالـ Worker API

| الموديول | الـ API | الحالة |
|----------|--------|--------|
| `[~]` HRModule | `/api/hr/*` (employees, attendance, leave, payroll) | route موجود، ربط UI ناقص |
| `[~]` AccountingModule | `/api/accounting/*` (invoices, chart_of_accounts, journal_entries) | route موجود، ربط UI ناقص |
| `[~]` CRMModule | `/api/crm/*` (leads, opportunities, clients, activities) | route موجود، ربط UI ناقص |
| `[~]` ProjectsModule | `/api/projects/*` (projects, tasks, members, work_logs) | route موجود، ربط UI ناقص |
| `[~]` LogisticsModule | `/api/logistics/*` (vehicles, drivers, shipments, routes, GPS) | route موجود، ربط UI ناقص |
| `[~]` StoreModule | `/api/store/*` (products, inventory, POS, orders) | route موجود، ربط UI ناقص |
| `[~]` ChatModule | Supabase Realtime (channels, messages, presence) | route موجود، Realtime ناقص |
| `[~]` MeetingsModule | `/api/meetings/*` (rooms, sessions, transcripts) | route موجود، ربط UI ناقص |
| `[~]` BillingModule | `/api/billing/*` | مربوط جزئيا |
| `[ ]` Academy | `/api/academy/*` (tracks, lessons, quizzes, certificates) | |
| `[ ]` HelpCenter | `/api/help/*` (articles, faq) | |
| `[ ]` PortalBuilder | `/api/portal-builder/*` | |
| `[ ]` Overview Dashboard | aggregate من كل الموديولات | |

---

# TIER 7: الموبايل (Flutter)

---

## T7-1: Mobile Core Features

| المهمة | الملفات | الحالة |
|--------|---------|--------|
| `[ ]` T7-1a: Company Switcher — اختيار شركة عند عضويات متعددة | mobile/lib/screens/ | |
| `[ ]` T7-1b: Driver Tracking Map — خريطة GPS فعلية | mobile/lib/screens/ | |
| `[ ]` T7-1c: Approvals Workflow — شاشة موافقات | mobile/lib/screens/ | |
| `[ ]` T7-1d: Client Portal Mobile — بوابة عميل | mobile/lib/screens/ | |
| `[ ]` T7-1e: Push Notifications — Firebase Cloud Messaging | mobile/ | |

---

## T7-2: ربط شاشات الموبايل بـ Worker API

> كل الـ 18 شاشة الموجودة تحتاج تاكيد انها تستدعي Worker API وليس mock data.

| المهمة | الحالة |
|--------|--------|
| `[ ]` T7-2a: مراجعة كل screen وتاكيد API binding | |
| `[ ]` T7-2b: Mobile i18n — تفعيل ARB files لكل الـ 15 لغة | |

---

# TIER 8: الانتيجريشنز

---

| المهمة | المزود | الحالة |
|--------|-------|--------|
| `[~]` T8-1: Stripe (checkout + webhooks) | Stripe | جزئي |
| `[ ]` T8-2: Resend — ارسال ايميلات دعوات وتنبيهات فعلية | Resend | |
| `[ ]` T8-3: Google Maps / HERE — تتبع GPS في Logistics | Maps | |
| `[ ]` T8-4: WhatsApp Business — اشعارات واتساب | WhatsApp | |
| `[ ]` T8-5: Google/Meta/YouTube Ads — ربط حملات تسويقية | Ads APIs | |
| `[ ]` T8-6: Apple Pay / Google Pay payments | Payment | |
| `[ ]` T8-7: Vonage — اكمال Voice/SMS integration | Vonage | |

---

# TIER 9: الترجمات

---

## T9-1: Web Translations (13 لغة × ~60 مفتاح ناقص)

| اللغة | الحالة |
|-------|--------|
| `[ ]` French (fr) | ~20% → 100% |
| `[ ]` Spanish (es) | ~20% → 100% |
| `[ ]` German (de) | ~20% → 100% |
| `[ ]` Turkish (tr) | ~20% → 100% |
| `[ ]` Russian (ru) | ~20% → 100% |
| `[ ]` Chinese (zh) | ~20% → 100% |
| `[ ]` Japanese (ja) | ~20% → 100% |
| `[ ]` Korean (ko) | ~20% → 100% |
| `[ ]` Portuguese (pt) | ~20% → 100% |
| `[ ]` Italian (it) | ~20% → 100% |
| `[ ]` Dutch (nl) | ~20% → 100% |
| `[ ]` Hindi (hi) | ~20% → 100% |
| `[ ]` Urdu (ur) | ~20% → 100% |

---

## T9-2: Founder Labels + Mobile i18n

| المهمة | الحالة |
|--------|--------|
| `[ ]` T9-2a: ترجمة labels الفاوندر الـ 17 tab | |
| `[ ]` T9-2b: Mobile ARB files لكل 15 لغة | |

---

# TIER 10: المراقبة والعمليات (Observability & Operations)

---

## T10-1: Monitoring & Alerting

| المهمة | الحالة |
|--------|--------|
| `[ ]` T10-1a: API response time tracking (p50, p95, p99) | |
| `[ ]` T10-1b: Error rate per endpoint | |
| `[ ]` T10-1c: Queue depth (provisioning jobs) | |
| `[ ]` T10-1d: AI cost per tenant tracking | |
| `[ ]` T10-1e: Alerting rules (billing failure, integration down, queue congestion) | |

---

## T10-2: Operational Runbooks

**البلوبرنت يحدد 10 runbooks:**

| Runbook | الحالة |
|---------|--------|
| `[ ]` Provisioning stuck → retry/rollback | |
| `[ ]` Worker crash → restart/scale | |
| `[ ]` Queue congestion → identify/clear | |
| `[ ]` Integration failure → disable/retry/alert | |
| `[ ]` Billing failure → dunning/restrict/suspend | |
| `[ ]` AI mis-action → review/revert/alert | |
| `[ ]` Portal downtime → failover/restore | |
| `[ ]` DB slow queries → identify/optimize | |
| `[ ]` DB overload → read replica/scaling | |
| `[ ]` Security incident → lockdown/investigate/report | |

---

# Edge Functions

| المهمة | الحالة |
|--------|--------|
| `[ ]` EF-1: اصلاح register_company (role → role_code) | |
| `[ ]` EF-2: كتابة stripe-setup edge function | |
| `[ ]` EF-3: كتابة stripe-webhook edge function | |
| `[ ]` EF-4: كتابة stripe-worker edge function | |

---

# ملخص الارقام

| الطبقة | الفئة | عدد المهام | الاولوية |
|--------|-------|-----------|----------|
| TIER 0 | المنطق والمعمارية | ~52 | CRITICAL — بدون هذا كل شي هش |
| TIER 1 | الامان وسلامة البيانات | ~23 | CRITICAL |
| TIER 2 | محرك التنانت | ~12 | HIGH |
| TIER 3 | التسعير والفوترة | ~10 | HIGH |
| TIER 4 | حوكمة AI | ~22 | HIGH |
| TIER 5 | Founder OS | ~28 | HIGH |
| TIER 6 | تنفيذ الموديولات | ~13 | MEDIUM |
| TIER 7 | الموبايل | ~7 | MEDIUM |
| TIER 8 | الانتيجريشنز | ~7 | MEDIUM |
| TIER 9 | الترجمات | ~15 | LOW |
| TIER 10 | المراقبة والعمليات | ~15 | LOW |
| Edge | Edge Functions | ~4 | HIGH |
| **المجموع** | | **~208** | |

---

# ترتيب التنفيذ الموصى (Execution Order)

```
Sprint 1: T0-1 (Permissions) + T0-3 (API Standards) + T1-1 (RLS Fix)
          ↳ الاساس: بدون صلاحيات صحيحة وعقد API موحد، كل شي يتبني على ارض هشة

Sprint 2: T0-2 (Module Shell) + T0-4 (Domain Events) + T1-2 (Schema Reconciliation)
          ↳ البنية: نمط موحد لكل module + events تتبع كل شي + الجداول المفقودة

Sprint 3: T0-5 (Entitlements) + T0-6 (Provisioning Rollback) + T2-1 (Tenant Lifecycle)  ✅ DONE
          ↳ المحرك: فحص استحقاقات + rollback لو فشل + دورة حياة الشركة

Sprint 4: T3 (Pricing/Billing) + T4-1 (AI Policies)  ✅ DONE
          ↳ الكاشير + الحوكمة: تسعير ديناميكي + سياسات AI

Sprint 5: T4-2 (AI Data Binding) + T5 (Founder OS Backend)
          ↳ البيانات الحقيقية: AI يقرا DB + Founder يشوف مؤشرات حقيقية

Sprint 6: T6 (Module Implementation) + T8 (Integrations)
          ↳ التنفيذ: كل module يتحول للنمط الموحد + الربط الخارجي

Sprint 7: T7 (Mobile) + T9 (Translations) + T10 (Observability)
          ↳ التلميع: موبايل + ترجمات + مراقبة
```

---

# خريطة الملفات الرئيسية

| الملف / المسار | الغرض |
|----------------|-------|
| worker/src/index.ts | نقطة دخول الووركر — 25 route handler |
| worker/src/routes/*.ts | Route handlers (ai, billing, provision, auth, founder, etc.) |
| worker/src/engines/provisioningV2.ts | محرك البروفيجنينج 3 طبقات |
| worker/src/supabase.ts | Admin client helpers (checkMembership, discoverMembership) |
| worker/src/permissions.ts | نسخة الووركر من permissions (numeric levels) |
| src/App.tsx | React Router v6 — كل الـ routes |
| src/lib/permissions.ts | Permission system (numeric role levels) |
| src/contexts/AuthContext.tsx | Auth state management |
| src/components/ProtectedRoute.tsx | Route guard component |
| src/components/FloatingActions.tsx | RARE AI زر عائم |
| src/pages/FounderPage.tsx | Founder OS — 17 tabs |
| src/pages/modules/*.tsx | Business modules (HR, CRM, Accounting, etc.) |
| src/constants/translations.ts | 15 لغة × ~80 مفتاح |
| mobile/lib/screens/*.dart | Flutter screens (18 شاشة) |
| supabase/migrations/*.sql | 32 migration file (150+ جدول) |
| supabase/functions/register_company/ | Edge function (يحتاج اصلاح role→role_code) |
| ZIEN_CONSTITUTION.md | القانون المطلق — inventory كامل |
| TASKS_TODO.md | هذا الملف — قائمة المهام التنفيذية |

---

# مبادئ التنفيذ (غير قابلة للتفاوض)

1. **لا mock ولا placeholder** — كل عملية تستدعي backend حقيقي او تعرض "غير متاح"
2. **لا نصوص مؤقتة في UI** — كل string يكون production-ready
3. **لا emoji في UI او logs او workflows**
4. **Secrets ابدا في الموبايل** — فقط VPS/env/wrangler.toml
5. **Auth: Supabase JWT** — يتم التحقق في الووركر. Step-up للعمليات الحساسة
6. **UI Kit واحد فقط** — لا تنسيق عشوائي
7. **كل تغيير في الكود يُحدث في TASKS_TODO.md**

---

> هذا الملف هو المرجع التنفيذي. ZIEN_CONSTITUTION.md هو المرجع الحالة/الوصف. الاثنان يعملان معا.
