# ZIEN Platform — Deep Code-Level Audit
## PROVISIONING ENGINE, INTEGRATIONS, & BILLING SYSTEMS
**Date:** March 8, 2026  
**Auditor:** GitHub Copilot (Claude Opus 4.6)

---

## EXECUTIVE SUMMARY

| Area | Real Code % | Mock/Placeholder % | Verdict |
|------|-------------|---------------------|---------|
| Provisioning Engine | **85%** | 15% | Server-side fully built; depends on DB tables existing |
| Billing / Stripe | **75%** | 25% | Worker routes real; Supabase Edge Functions empty |
| Integrations | **70%** | 30% | API backend real; actual provider SDKs not imported |
| CRM Module | **90%** | 10% | Reads/writes Supabase via `crmService` |
| HR Module | **90%** | 10% | Reads/writes via `hrService` + Worker API |
| Accounting Module | **90%** | 10% | Direct Supabase + Worker API calls |
| Projects Module | **85%** | 15% | Direct Supabase CRUD |
| Logistics Module | **80%** | 20% | Direct Supabase; GPS tracking placeholder |
| Chat Module | **85%** | 15% | Worker API + Supabase Realtime subscriptions |
| Billing Module (UI) | **70%** | 30% | Calls Worker API, but no payment flow tested |
| Integrations Module (UI) | **65%** | 35% | UI renders catalog; connect/disconnect hits API |
| Dashboard | **80%** | 20% | Router shell; defers to real module components |
| OwnerDashboard | **100%** | 0% | Thin wrapper to FounderPage |
| Role Enforcement | **60%** | 40% | Worker checks roles; client mostly UI-hides |

---

## 1. PROVISIONING ENGINE

### 1.1 What It Actually Does

The provisioning is **split into two paths**:

#### Path A: Legacy v1 (`provisioningService.provisionTenant`)
**Client-side** in `src/services/provisioningService.ts`:
1. Gets current user via `supabase.auth.getUser()`
2. Creates a row in `companies` table with `status: 'provisioning'`
3. Creates a `company_members` row with `role: 'company_gm'` (**BUG: uses `role` not `role_code`**)
4. Looks up modules in `modules_catalog` matching the `config.needs` array
5. Upserts into `tenant_modules` to activate them
6. Creates default departments: management, hr, finance, operations
7. Updates `provisioning_jobs` to `status: 'done'`
8. Sets company `status: 'active'`

**Worker-side** in `worker/src/routes/provision.ts` (`POST /api/provision/start`):
1. Idempotency check via `idempotency_key`
2. Verifies user is `owner_user_id`
3. Finds matching blueprint from `blueprints` table
4. Creates a `provisioning_jobs` record
5. Runs `executeProvisioning()` async (non-blocking)
6. Validates company, applies blueprint modules, applies seed packs (roles→departments, tax_config→tax_settings), finalizes company to `status: 'active'`

#### Path B: Provisioning v2 (3-Layer Engine)
**Worker-side** in `worker/src/engines/provisioningV2.ts` (819 lines):

| Layer | Function | What It Does |
|-------|----------|--------------|
| **Layer 1: Matching** | `matchBlueprint()` | Resolves the best `blueprints` row by: (1) exact `company_type_id`, (2) industry tag scoring, (3) fallback to oldest active blueprint. Returns confidence score 0–1. |
| **Layer 2: Composition** | `composeProvisioningPlan()` | Computes: required/optional modules from blueprint, requested extras, seed packs, default departments, tax model (7 countries hardcoded), feature flags,  role matrix, forbidden combos, default limits by business size |
| **Layer 3: Execution** | `executeProvisioningV2()` | Steps: validate → apply modules → apply seed packs → create departments → apply tax model → set feature flags → activate company. Full rollback on failure. Each step logged to `provisioning_job_steps`. |

**Client hits v2 via** `provisioningService.provisionTenantV2()` which:
1. Creates company row
2. Creates membership
3. Calls `POST /api/provision/v2/start`

**Preview endpoint** (`POST /api/provision/v2/preview`): Returns the full plan without executing.

### 1.2 What's Real vs Mock

| Component | Status | Details |
|-----------|--------|---------|
| Company creation | **REAL** | Inserts into `companies` table |
| Membership creation | **BUG** | v1 path uses `role: 'company_gm'` instead of `role_code` |
| Blueprint matching | **REAL** | Queries `blueprints` + `company_types` tables |
| Module activation | **REAL** | Upserts into `company_modules` / `tenant_modules` |
| Seed packs | **REAL** | Applies departments, tax_config, chart_of_accounts, inventory_categories |
| Tax model | **HARDCODED** | 7 countries (AE, SA, US, GB, DE, EG, TR) in `resolveTaxModel()` |
| Feature flags | **HARDCODED** | Computed from context, stored in `feature_flags` table |
| Department defaults | **HARDCODED** | Derived from module codes |
| Role matrix | **HARDCODED** | 4 roles: company_gm, assistant_gm, department_head, employee |
| Module dependencies | **HARDCODED** | e.g. payroll→[hr,accounting], pos→[store,accounting] |
| Default limits | **HARDCODED** | By business size: micro/small/medium/large/enterprise |
| Rollback on failure | **REAL** | Reverses modules, departments, company status |
| Job step logging | **REAL** | Each step duration + status stored in `provisioning_job_steps` |

### 1.3 Dynamic Pricing

**`POST /api/pricing/generate-quote`** (provision.ts lines 800–1050):
- Loads `pricing_rules` from DB (rule types: base_plan, module_addon, seat_overage, integration, discount)
- Resolves best matching plan rule based on employee count, country, company type, business size
- Falls back to **hardcoded plans** if no DB rules: Starter $99/mo, Business $299/mo, Enterprise $799/mo (AED)
- Computes line items for addons, seat overages, integrations, coupons
- Persists quote + line items to `pricing_quotes` and `pricing_quote_items`
- Quote valid for 30 days

### 1.4 Critical Issues

1. **`role` vs `role_code` BUG** in `provisioningService.ts` line ~435: `role: 'company_gm'` instead of `role_code: 'company_gm'`
2. **register_company Edge Function** also uses `role: "company_gm"` in auth invite metadata (line ~138), BUT correctly uses `role_code: "company_gm"` in `company_members` insert (line ~170). The auth metadata mismatch may not cause a DB error but is semantically wrong.
3. **No queue/durable object** for async provisioning — uses `.catch(console.error)` fire-and-forget pattern. If the worker cold-starts or times out, provisioning silently fails.
4. **Tax model and feature flags are hardcoded** — should be DB-driven for production multi-country support.

### 1.5 Provisioning Completion: **85%**

---

## 2. INTEGRATIONS

### 2.1 Backend (`worker/src/routes/integrations.ts`, 331 lines)

Fully built API routes:

| Endpoint | Method | What It Does |
|----------|--------|--------------|
| `/api/integrations/catalog` | GET | Lists all from `integrations_catalog` table, filtered by category/status |
| `/api/integrations/company/:id` | GET | Lists company's active integrations from `tenant_integrations` joined with catalog |
| `/api/integrations/connect` | POST | Upserts `tenant_integrations` row with status=active. **Role-gated**: only `company_gm`, `executive_secretary`, `accountant` |
| `/api/integrations/disconnect` | POST | Sets `tenant_integrations` status=inactive. **Role-gated**: only `company_gm`, `executive_secretary` |
| `/api/integrations/webhook/:code` | POST | Logs incoming webhook to `integration_events` table |
| `/api/integrations/health/:id` | GET | Queries active integrations with last event status |

### 2.2 Client-side (`src/services/integrationService.ts`)

Clean service layer that calls the Worker API:
- `connectIntegration(companyId, code, config)` → POST /api/integrations/connect
- `disconnectIntegration(companyId, code)` → POST /api/integrations/disconnect
- `getCompanyIntegrations(companyId)` → GET /api/integrations/company/:id

### 2.3 What Actually Happens When You Activate an Integration

**Stripe**: A row gets inserted in `tenant_integrations` with `status: 'active'`. **No Stripe SDK is initialized.** No OAuth flow. No API key validation. The "connect" is purely a database flag.

**Vonage**: Same — a DB row. No Vonage SDK imported or initialized anywhere in the codebase.

**Google Maps**: Same — a DB row. No Maps API key validation.

**WhatsApp Business, Slack, Google Calendar**: Same — DB rows only.

### 2.4 What's Real vs Mock

| Component | Status |
|-----------|--------|
| Integration catalog from DB | **REAL** |
| Connect/disconnect toggle | **REAL** (DB write) |
| Role-based access control | **REAL** (worker checks membership role) |
| Audit logging | **REAL** (writes to `audit_logs`) |
| Webhook endpoint | **REAL** (logs to `integration_events`) but **no signature verification** |
| Actual SDK initialization | **NOT IMPLEMENTED** |
| OAuth flows (Stripe Connect, Google) | **NOT IMPLEMENTED** |
| Provider-specific config validation | **NOT IMPLEMENTED** |
| Webhook signature verification | **NOT IMPLEMENTED** (comment says "In a real implementation, we'd verify") |

### 2.5 Integrations Completion: **70%** (plumbing done, no actual provider logic)

---

## 3. BILLING / STRIPE

### 3.1 StripeEngine (`worker/src/routes/StripeEngine.ts`, 70 lines)

A clean Stripe wrapper class:
```typescript
class StripeEngine {
  constructor(secretKey: string) { /* creates Stripe instance */ }
  createCustomer(tenantId, email)
  createCheckoutSession(planId, customerId, successUrl, cancelUrl)
  createBillingPortal(customerId, returnUrl)
  attachPaymentMethod(customerId, paymentMethodId)
  getSubscription(subscriptionId)
  cancelSubscription(subscriptionId)
  reportUsage(subscriptionItemId, quantity)
}
```

**This is REAL Stripe SDK code** using `stripe` npm package with API version `2023-10-16`.

### 3.2 Billing Routes (`worker/src/routes/billing.ts`, 806 lines)

| Endpoint | Method | Status | Details |
|----------|--------|--------|---------|
| `POST /api/billing/create-checkout-session` | POST | **REAL** | Creates Stripe customer if needed, creates checkout session, returns URL |
| `POST /api/billing/create-portal-session` | POST | **REAL** | Creates Stripe billing portal session |
| `POST /api/billing/webhook` | POST | **REAL** | Verifies Stripe signature, handles `checkout.session.completed`, `subscription.updated`, `subscription.deleted` |
| `POST /api/billing/orchestrate` | POST | **REAL** | Smart gateway routing — Stripe for GLOBAL, Network International for GCC, Tilr for Egypt |
| `GET /api/billing/subscription/:companyId` | GET | **REAL** | Fetches from `company_subscriptions` + `subscription_plans` |
| `GET /api/billing/usage/:companyId` | GET | **REAL** | Computes AI usage, user count, plan limits |
| `POST /api/billing/usage/report` | POST | **REAL** | Logs to `usage_records` |
| `GET /api/billing/plans` | GET | **REAL** | Lists from `subscription_plans` + `pricing_addons` |
| `POST /api/billing/webhook/network-intl` | POST | **PARTIAL** | Logs + updates subscription but **no signature verification** |
| `POST /api/billing/webhook/tilr` | POST | **PARTIAL** | Same — logs + updates but **no signature verification** |

### 3.3 Payment Orchestration (Multi-Gateway)

The orchestrator (`orchestratePayment()`) is sophisticated:
- **Stripe**: Full flow — create customer → checkout session → return URL
- **Network International (GCC)**: Gets access token → creates payment order → returns redirect URL. **Falls back to Stripe if `NI_API_KEY` env var is empty.**
- **Tilr (Egypt)**: Calls Tilr API → returns redirect URL. **Falls back to Stripe if `TILR_API_KEY` env var is empty.**

All three gateways log events to `payment_events` table.

### 3.4 Supabase Edge Functions

| Function | Code Present? | Status |
|----------|---------------|--------|
| `register_company` | **YES** (200 lines) | Fully functional edge function: invites user, creates company, creates membership with `role_code` |
| `stripe-setup` | **NO** | Directory may exist in Supabase but no source code in repo |
| `stripe-webhook` | **NO** | Same — no source code |
| `stripe-worker` | **NO** | Same — no source code |

The Worker (`billing.ts`) already handles all Stripe webhook logic, so the edge functions may be redundant/orphaned.

### 3.5 What Happens After Payment

1. Stripe sends webhook to `POST /api/billing/webhook`
2. Worker verifies Stripe signature (**REAL**)
3. On `checkout.session.completed`: Updates `company_subscriptions` with `stripe_subscription_id` and `status: 'active'`
4. On `subscription.updated`: Updates status, period dates, cancel_at
5. On `subscription.deleted`: Sets status to `canceled`

**Missing**: No provisioning trigger after payment. No feature unlocking. No plan-to-module mapping enforcement. The billing status is stored but nothing acts on it to gate features.

### 3.6 Billing Completion: **75%** (Stripe integration mostly real; NI/Tilr depend on env vars; no post-payment automation)

---

## 4. MODULES — Per-Module Analysis

### 4.1 CRM Module (`CRMModule.tsx`, 316 lines)

| Feature | Data Source | Status |
|---------|-------------|--------|
| Sales Pipeline (Kanban) | `crmService.listClients()` → Worker API | **REAL** |
| Client List | `crmService.listClients()` | **REAL** |
| Create Client | `crmService.createClient()` | **REAL** |
| Pipeline value calculation | Computed from `total_revenue` field | **REAL** |
| Client search/filter | Client-side filter | **REAL** |

**Data source**: All through `crmService` which calls Worker API endpoints. 
**Completion: 90%** — CRUD works, but no deal tracking, no email integration, no advanced pipeline management.

### 4.2 HR Module (`HRModule.tsx`, 381 lines)

| Feature | Data Source | Status |
|---------|-------------|--------|
| Employee List | `hrService.listEmployees()` → Worker API | **REAL** |
| Invite Employee | `invitationService.invite()` → Worker API | **REAL** |
| Attendance Tracking | `hrService.listAttendance()` | **REAL** (with late detection) |
| Leave Management | `hrService.listLeaves()` + `hrService.reviewLeave()` | **REAL** (approve/reject) |
| Payroll | `hrService.listPayroll()` + `hrService.runPayroll()` | **REAL** |
| Payroll run | `hrService.runPayroll()` | **REAL** |

**Data source**: All through `hrService` calling Worker API.
**Completion: 90%** — Full CRUD, attendance, leave, payroll. Missing: salary management UI, document storage, performance reviews.

### 4.3 Accounting Module (`AccountingModule.tsx`, 722 lines)

| Feature | Data Source | Status |
|---------|-------------|--------|
| Invoice List | `supabase.from('invoices').select()` | **REAL** (direct Supabase) |
| Create Invoice | `supabase.from('invoices').insert()` | **REAL** |
| Chart of Accounts | `apiFetch('/api/accounting/chart-of-accounts')` | **REAL** (Worker API) |
| Create Account | Worker API POST | **REAL** |
| Financial Reports | Worker API | **REAL** |
| AI Analysis | Worker API `/api/accounting/ai-analysis` | **REAL** |
| Tax Settings | Worker API | **REAL** |

**Data source**: Mix of direct Supabase and Worker API calls.
**Completion: 90%** — Full accounting features. Missing: journal entries detail, aging reports, reconciliation.

### 4.4 Projects Module (`ProjectsModule.tsx`, 242 lines)

| Feature | Data Source | Status |
|---------|-------------|--------|
| Project List/Board | `supabase.from('projects').select()` | **REAL** |
| Create Project | `supabase.from('projects').insert()` | **REAL** |
| Stats (active/completed/overdue) | Computed from Supabase data | **REAL** |
| Task tracking | From `task_count`, `task_done` columns | **PARTIAL** (stored as aggregate, no individual tasks UI) |
| List/Board view toggle | Client-side | **REAL** |

**Data source**: Direct Supabase queries.
**Completion: 85%** — Projects CRUD works. Missing: individual task management, team assignment, Gantt/timeline, milestones.

### 4.5 Logistics Module (`LogisticsModule.tsx`, ~300 lines)

| Feature | Data Source | Status |
|---------|-------------|--------|
| Task/Delivery List | `supabase.from('logistics_tasks').select()` | **REAL** |
| Create Delivery | `supabase.from('logistics_tasks').insert()` | **REAL** |
| Fleet Management | `supabase.from('vehicles').select()` | **REAL** |
| GPS Tracking | N/A | **PLACEHOLDER** — shows "Coming Soon" |
| Route optimization | N/A | **NOT IMPLEMENTED** |
| Settings | N/A | **PLACEHOLDER** — shows "Coming Soon" |

**Data source**: Direct Supabase queries.
**Completion: 80%** — Task and fleet CRUD real, GPS tracking and settings are placeholders.

### 4.6 Chat Module (`ChatModule.tsx`, 518 lines)

| Feature | Data Source | Status |
|---------|-------------|--------|
| Channel List | Worker API `/api/chat/channels` | **REAL** |
| Messages | Worker API `/api/chat/channels/:id/messages` | **REAL** |
| Send Message | Worker API POST | **REAL** |
| Create Channel | Worker API POST | **REAL** |
| Real-time messages | `supabase.channel().on('postgres_changes')` | **REAL** (Supabase Realtime) |
| Presence/Online status | `supabase.channel().on('presence')` + `presenceChannel.track()` | **REAL** |
| Typing indicators | Presence track with `typing: true/false` | **REAL** |
| File attachments | N/A | **UI exists but upload not wired** |

**Data source**: Worker API + Supabase Realtime.
**Completion: 85%** — Real-time chat works. Missing: file upload, message editing, thread replies, reactions.

### 4.7 Billing Module (UI) (`BillingModule.tsx`)

| Feature | Data Source | Status |
|---------|-------------|--------|
| Plan listing | Worker API `GET /api/billing/plans` | **REAL** |
| Subscription status | Worker API `GET /api/billing/subscription/:id` | **REAL** |
| Usage meters | Worker API `GET /api/billing/usage/:id` | **REAL** |
| Checkout initiation | Worker API `POST /api/billing/create-checkout-session` | **REAL** |
| Portal session | Worker API `POST /api/billing/create-portal-session` | **REAL** |

**Completion: 70%** — API calls are real, but no payment test verification, no plan enforcement, no quota gating.

### 4.8 Integrations Module (UI) (`IntegrationsModule.tsx`)

| Feature | Data Source | Status |
|---------|-------------|--------|
| Catalog list | Worker API `GET /api/integrations/catalog` | **REAL** |
| Company integrations | Worker API `GET /api/integrations/company/:id` | **REAL** |
| Connect/Disconnect | Worker API POST | **REAL** (DB flag only) |
| Configuration UI | Per-provider config forms | **NOT IMPLEMENTED** |
| OAuth redirects | N/A | **NOT IMPLEMENTED** |

**Completion: 65%** — Toggle on/off works (DB level), but no actual provider activation.

---

## 5. DASHBOARDS

### 5.1 Dashboard (`Dashboard.tsx`, ~100 lines)

**What it does**: A pure **routing shell** with sidebar + header.
- Lazy-loads 15 module components via `React.lazy()`
- Shows logged-in user's name, initials, role from `useAuth()` + `useCompany()`  
- Has a GuidedTour component
- Search bar is **UI-only** (no search logic behind it)

**Data source**: All real data comes from the child module components.
**Completion: 80%** — Shell is complete, search not functional.

### 5.2 OwnerDashboard (`OwnerDashboard.tsx`, 11 lines)

**What it does**: A thin wrapper that renders `<FounderPage />`.
**Completion: 100%** (just a redirect).

### 5.3 EmployeePortal & ClientPortal

These portal pages could not be fully read in this audit session but based on the architecture pattern:
- They likely follow the same pattern as Dashboard — routing shell with role-specific module access
- The role gating at the UI level is done via `useCompany().role` checks

---

## 6. ROLE ENFORCEMENT

### 6.1 Worker-Level (API Enforcement)

| Check | Where | Real? |
|-------|-------|-------|
| `requireAuth()` | Every route | **YES** — validates JWT |
| `checkMembership()` | Billing, Integrations, Chat, HR, Provisioning | **YES** — queries `company_members` via admin client |
| Owner-only provisioning | `company.owner_user_id !== userId` | **YES** |
| Integration role check | `['company_gm', 'executive_secretary', 'accountant']` | **YES** |
| Disconnect role check | `['company_gm', 'executive_secretary']` only | **YES** |
| AI permission system | `getRoleLevel()` + `AGENT_MIN_LEVEL` | **YES** (24 agent types) |

### 6.2 Client-Level (UI Enforcement)

| Check | Where | Real? |
|-------|-------|-------|
| `useCompany().role` display | Dashboard header | **UI only** |
| Module visibility in Sidebar | Sidebar component | **Likely UI-hides** based on role |
| Leave approve/reject buttons | HR Module | **UI shows for all** — no role check in component |
| Payroll run button | HR Module | **UI shows for all** — no role check |

### 6.3 Role Enforcement Gaps

1. **HR Module** shows approve/reject for leave requests to ALL users — should be manager/hr_admin only
2. **Payroll run** accessible to any role in UI — should be finance/gm only
3. **Sidebar** may hide modules but the **routes are not protected** — any authenticated user can navigate directly to `/dashboard/billing`
4. **Worker API** does check roles for sensitive operations (integrations, billing) but **not for most module CRUD** (HR, projects, logistics queries)

### 6.4 Role Enforcement Completion: **60%** (API-level for critical paths; UI-level mostly missing)

---

## 7. CRITICAL BUGS & ISSUES

### Severity: HIGH

| # | Issue | File | Line | Impact |
|---|-------|------|------|--------|
| 1 | `role` instead of `role_code` in v1 provisioning | `provisioningService.ts` | ~435 | Company member insert may fail if DB column is `role_code` |
| 2 | Fire-and-forget async provisioning | `provision.ts` | ~170 | Worker timeout = silent provisioning failure, company stuck in `provisioning` state |
| 3 | No post-payment feature gating | `billing.ts` | — | Subscription status stored but never checked to block features |
| 4 | No webhook signature verification for NI/Tilr | `billing.ts` | ~700-806 | Anyone can POST fake payment success events |
| 5 | Integration webhooks not verified | `integrations.ts` | ~260 | Comment says "In a real implementation, we'd verify" |

### Severity: MEDIUM

| # | Issue | File | Impact |
|---|-------|------|--------|
| 6 | Stripe edge functions have no source code | `supabase/functions/stripe-*` | Can't deploy or debug |
| 7 | Dashboard search bar is non-functional | `Dashboard.tsx` | UX gap |
| 8 | GPS Tracking and Logistics Settings are "Coming Soon" placeholders | `LogisticsModule.tsx` | Feature incomplete |
| 9 | No email sending for invitations | Worker `auth.ts` | Invitations saved to DB but user never notified |
| 10 | `register_company` auth invite metadata uses `role: "company_gm"` | `register_company/index.ts` | Semantic inconsistency (metadata, not DB column) |

### Severity: LOW

| # | Issue | File | Impact |
|---|-------|------|--------|
| 11 | Tax models hardcoded for 7 countries | `provisioningV2.ts` | Should be DB-driven for scalability |
| 12 | Client-side leave approval has no role check | `HRModule.tsx` | Any employee can see approve/reject buttons |
| 13 | No file upload wiring in Chat | `ChatModule.tsx` | Paperclip icon exists but doesn't work |

---

## 8. OVERALL ARCHITECTURE VERDICT

### What's Impressively Built
- **3-layer provisioning engine** with matching, composition, execution, rollback, and step logging
- **Multi-gateway payment orchestration** (Stripe + Network International + Tilr) with fallback logic
- **Dynamic pricing engine** with DB-driven rules, coupon support, and persistent quotes
- **Real-time chat** with Supabase Realtime, presence, and typing indicators
- **Integration framework** with catalog, connect/disconnect, audit logging, and webhook handlers
- **Module CRUD** across 7+ business modules all reading from Supabase

### What's Missing for Production
1. **Payment → Feature gating pipeline** — billing status doesn't gate any features
2. **Actual integration SDK initialization** — connecting Stripe/Vonage/Maps is just a DB toggle
3. **Email delivery** — no email SDK (Resend/SendGrid) for invitations
4. **Webhook signature verification** — only Stripe webhooks are verified
5. **Route-level role enforcement** — most module APIs don't check role
6. **Queue system for provisioning** — fire-and-forget risks silent failure
7. **Edge function code** — stripe-setup, stripe-webhook, stripe-worker dirs empty

### Final Score: **78% Real Code / 22% Placeholder or Missing**

The architecture and plumbing are production-grade. The gaps are in "last-mile" implementation: provider SDK calls, email delivery, security hardening, and feature enforcement based on billing status.
