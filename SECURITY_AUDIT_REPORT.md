# ZIEN Platform — Deep Security Audit Report

**Date:** March 8, 2026  
**Scope:** RLS policies, auth mechanisms, tenant isolation, API protection, secrets management  
**Auditor:** Automated code-level analysis

---

## EXECUTIVE SUMMARY

| Category | Status | Rating |
|----------|--------|--------|
| Database RLS Coverage | Mostly complete but with critical gaps | **MEDIUM-HIGH RISK** |
| Worker API Auth | Strong on most routes, **CRITICAL gap on Store** | **CRITICAL** |
| Tenant Isolation (DB Level) | Enforced via RLS + SECURITY DEFINER functions | **GOOD** |
| Tenant Isolation (API Level) | Mixed — some routes use `discoverMembership`, store uses none | **HIGH RISK** |
| Role-Based Access (API) | Good for accounting/AI/founder; missing on HR/CRM/chat | **MEDIUM RISK** |
| Secrets Management | No hardcoded secrets; env vars used properly | **GOOD** |
| CORS | Strict origin allowlist | **GOOD** |
| Frontend Route Protection | Solid ProtectedRoute component | **GOOD** |

---

## 1. DATABASE LAYER — RLS POLICIES

### 1.1 RLS Coverage Summary

**Tables WITH RLS enabled and policies (from 00002_rls_policies.sql):**
All 39 core tables from the unified schema have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`:
- `profiles`, `modules_catalog`, `company_types`, `company_type_template_modules`
- `companies`, `company_members`, `departments`, `blueprints`, `blueprint_modules`
- `seed_packs`, `blueprint_seed_packs`, `provisioning_jobs`, `company_modules`
- `subscription_plans`, `company_subscriptions`
- `clients`, `invoices`, `invoice_items`, `payments`, `tax_settings`
- `employees`, `attendance`, `leave_requests`, `payroll`
- `vehicles`, `logistics_tasks`, `quotes`, `contracts`, `projects`
- `meetings`, `chats`
- `company_onboarding_submissions`, `company_documents`
- `ai_usage_logs`, `ai_reports`, `audit_logs`
- `permissions`, `role_permissions`, `feature_flags`

**Tables from 00010_business_domain_tables.sql (70+ tables) — CREATED WITHOUT RLS:**
These tables were created in migration 00010 with **NO RLS policies at all**. Migration 00018 attempted to fix this with a bulk `_enable_tenant_rls()` function, but this migration **may not have been applied yet** (user must manually run in Supabase Dashboard).

Affected tables include:
- `chart_of_accounts`, `journal_entries`, `journal_lines`, `advances`, `expenses`
- `employee_documents`, `benefits`, `insurance_claims`, `job_posts`, `job_applications`
- `training_courses`, `training_assignments`, `training_attempts`
- `leads`, `opportunities`, `receipts`, `client_portal_users`
- `project_members`, `tasks`, `task_comments`, `work_logs`
- `drivers`, `routes`, `shipments`, `gps_tracks`, `location_pings`, `geofences`
- `warehouses`, `inventory_items`, `pos_sessions`, `pos_orders`, `pos_order_items`
- `customer_orders`, `customer_order_items`
- `chat_channels`, `chat_channel_members`, `chat_messages`, `presence_status`
- `meeting_rooms`, `meeting_sessions`, `meeting_participants`, `meeting_transcripts`, `meeting_summaries`
- `ai_agent_actions`, `security_events`, `integration_events`
- `pricing_addons`, `subscription_usage_counters`, `billing_events`
- `product_variants`

### 1.2 CRITICAL: RLS Recursion Bug

**File:** `supabase/migrations/00002_rls_policies.sql` (lines 79-84)  
**File:** `supabase/migrations/00018_fix_rls_recursion.sql` (comprehensive fix)

The original `company_members_select` policy uses `is_company_member(company_id)` which queries `company_members` — creating **infinite recursion**. Migration 00018 fixes this with `SECURITY DEFINER` + `SET search_path = public` on all helper functions and uses `auth_user_company_ids()` to break the recursion chain.

**STATUS:** Fix written in 00018 but user must manually apply via Supabase Dashboard SQL Editor. **If not applied, all user-scoped queries to company_members fail with infinite recursion.**

### 1.3 CRITICAL: Migration 00013 Uses Recursive Patterns

**File:** `supabase/migrations/00013_missing_tables_and_hr_crm.sql` (lines 51-53, 76-78, etc.)

```sql
-- VULNERABLE PATTERN (causes recursion):
CREATE POLICY general_ledger_tenant_isolation ON general_ledger
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));
```

This queries `company_members` directly without using the `SECURITY DEFINER` helper function. If `company_members` has RLS enabled, this causes infinite recursion. Migration 00018 fixes these with `is_company_member(company_id)` but again, must be applied.

### 1.4 Dual Schema Confusion (role vs role_code)

**Unified Schema** (`00001_unified_schema.sql` line 180): Uses `role company_role` (enum type)  
**Production Schema** (`supabase_schema.sql` line 78): Uses `role_code TEXT` with CHECK constraint  

Migration 00018 handles this with `_cm_role()` helper that tries `role_code` first, falls back to `role::TEXT`. But the `is_company_admin()` function at line 93 of 00018 uses `COALESCE(role_code, role::TEXT) = 'company_gm'` which may fail if only one column exists.

**RISK:** If the wrong migration set is applied, role checks silently fail, potentially granting or denying access incorrectly.

### 1.5 SECURITY DEFINER Functions — Good Pattern

**File:** `supabase/migrations/00018_fix_rls_recursion.sql` (lines 37-107)

All helper functions use the correct pattern:
```sql
CREATE OR REPLACE FUNCTION is_company_member(target_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = target_company_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;
```

`SECURITY DEFINER` + `SET search_path = public` ensures these bypass RLS when called from within RLS policies, preventing recursion and search path injection attacks.

### 1.6 Policy Write Permissions — Overly Permissive

**File:** `supabase_schema.sql` (lines 403-420)

```sql
-- OVERLY PERMISSIVE: ANY member can do ALL operations
CREATE POLICY "Members can manage their company clients" ON clients FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company invoices" ON invoices FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company payroll" ON payroll FOR ALL USING (is_company_member(company_id));
CREATE POLICY "Members can manage their company audit logs" ON audit_logs FOR ALL USING (is_company_member(company_id));
```

The `supabase_schema.sql` file gives `FOR ALL` (SELECT/INSERT/UPDATE/DELETE) to ANY company member. This means a `trainee` or `client_user` can DELETE payroll records, audit logs, and invoices at the DB level.

The **unified schema** (`00002_rls_policies.sql`) is better — it uses `has_company_role()` for write operations (e.g., payroll requires `department_manager`, invoices require `supervisor`). **However, whichever migration ran last wins**, and there's no guarantee of ordering.

### 1.7 Missing Tables Without Any RLS

The following tables from migration 00012 and 00014 have RLS enabled but with patterns that may not work:

- `ai_conversation_threads` — **NO SELECT policy for users themselves** (only the 00018 fix targets specific tables)
- `ai_conversation_messages` — **NO direct policy** (relies on parent thread but no policy exists)
- `platform_incidents` — No policy defined in 00012
- `pricing_rules` — No policies at all (global pricing config)

**File:** `supabase/migrations/00014_founder_platform_tables.sql` uses a different admin check pattern:
```sql
CREATE POLICY platform_audit_log_read ON platform_audit_log
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM platform_admins WHERE is_active = true)
    );
```
This is NOT recursive (platform_admins has no RLS triggering issue), but it's inconsistent with the rest of the codebase that uses `is_platform_admin()`.

---

## 2. WORKER API LAYER — Authentication & Authorization

### 2.1 Auth Middleware (`worker/src/supabase.ts`)

**STRENGTH:** The `requireAuth()` function at lines 68-87 properly:
- Extracts Bearer token from Authorization header
- Creates a user-scoped Supabase client
- Calls `supabase.auth.getUser()` to validate the JWT server-side
- Returns userId, email, and scoped client
- Throws on invalid/expired tokens

**STRENGTH:** `checkMembership()` and `discoverMembership()` use admin client to bypass RLS recursion.

### 2.2 CRITICAL VULNERABILITY: Store Routes — NO AUTH, NO TENANT ISOLATION

**File:** `worker/src/routes/store.ts` (entire file, 183 lines)

```typescript
export async function handleStore(request: Request, env: Env, path: string): Promise<Response> {
    const supabase = getSupabase(env);  // SERVICE_ROLE_KEY — bypasses ALL RLS
    // ...
    // GET /api/store/products?company_id=xxx
    if (path === '/api/store/products' && method === 'GET') {
        const companyId = url.searchParams.get('company_id');
        // NO auth check — anyone can read any company's products
```

**CRITICAL FINDINGS:**
1. **No `requireAuth()` call** — endpoints are completely unauthenticated
2. **Uses `SUPABASE_SERVICE_ROLE_KEY`** — bypasses ALL Row Level Security
3. **company_id comes from query parameter** — any unauthenticated caller can read/write/delete ANY company's products, orders, and customers
4. **DELETE has no ownership check** — `DELETE /api/store/products/:id` deletes any product by ID with zero auth

This is the most severe vulnerability in the codebase. An attacker can:
- Read all products, orders, and customer data for ANY company
- Create fake orders and products in ANY company
- Delete any product by ID
- Access analytics for any company

### 2.3 Route-by-Route Auth Analysis

| Route File | Auth? | Membership Check? | Role Check? | Uses Admin Client? |
|---|---|---|---|---|
| `auth.ts` | Partial (some public) | Yes (for protected) | No | Yes |
| `ai.ts` | **Yes** | **Yes (checkMembership)** | **Yes (AGENT_MIN_LEVEL + action)** | No |
| `accounting.ts` | **Yes** | **Yes** | **Yes (level 40+ read, 65+ write)** | Via user client |
| `billing.ts` | Partial (webhooks public) | Yes for user routes | Admin check for sensitive | Yes |
| `controlRoom.ts` | **Yes** | **Yes (checkMembership)** | No role check | Admin client for queries |
| `founder.ts` | **Yes** | **Yes (platform_admins table)** | **Yes (super_admin/admin/viewer)** | Yes |
| `hr.ts` | **Yes** | **Yes (discoverMembership)** | **No role-level check** | Admin client |
| `crm.ts` | **Yes** | **Yes (discoverMembership)** | **No role-level check** | Admin client |
| `chat.ts` | **Yes** | **Yes (discoverMembership)** | No | Admin client |
| `projects.ts` | **Yes** | **Yes (discoverMembership)** | No | Admin client |
| `logistics.ts` | **Yes** | **Yes (discoverMembership)** | No | Admin client |
| `meetings.ts` | **Yes** | **Yes (discoverMembership)** | No | Admin client |
| **`store.ts`** | **NO** | **NO** | **NO** | **SERVICE_ROLE (bypasses RLS)** |
| `provision.ts` | **Yes** | Partial | No | Yes |
| `integrations.ts` | **Yes** | **Yes** | No | Admin client |
| `vonage.ts` | Depends | Depends | No | Depends |

### 2.4 HR/CRM/Chat/Projects/Logistics — Missing Write Role Checks

**File:** `worker/src/routes/hr.ts` (lines 38-52)

```typescript
export async function handleHR(...) {
    const { userId, supabase } = await requireAuth(request, env);
    const membership = await discoverMembership(env, userId);
    if (!membership) return errorResponse('No active company membership', 403);
    const companyId = membership.company_id;
    const userRole = membership.role;
    const adminClient = createAdminClient(env);
    // userRole is captured but NEVER checked for write operations
```

`userRole` is fetched but **never validated** for any endpoint. A `trainee` (level 15) or `client_user` (level 10) can:
- Create/update/delete employees
- Run payroll
- Approve/reject leave requests
- Create departments

The same pattern exists in `crm.ts`, `chat.ts`, `projects.ts`, `logistics.ts`, and `meetings.ts`.

**CONTRAST:** `accounting.ts` correctly checks role level:
```typescript
async function verifyAccountingAccess(env, userId, companyId, requireWriteLevel = false) {
    const level = getRoleLevel(membership.role);
    if (requireWriteLevel && level < 65) {
        return { error: errorResponse('Insufficient permissions...', 403) };
    }
```

### 2.5 `discoverMembership` vs `checkMembership` — Company Isolation Gap

**File:** `worker/src/supabase.ts` (lines 48-58)

`discoverMembership()` returns the user's **first active membership** (any company):
```typescript
export async function discoverMembership(env, userId) {
    const { data } = await admin
        .from('company_members')
        .select('id, company_id, role:role_code')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
    return data;
}
```

Routes using `discoverMembership` (HR, CRM, chat, projects, logistics, meetings) **ignore the `X-Company-Id` header** and always use the first company. In a multi-tenant scenario where a user belongs to multiple companies, the user cannot specify which company to target — it's always the first one returned by the DB.

Routes using `checkMembership` (accounting, controlRoom, AI) take `X-Company-Id` from the header and validate membership for that specific company. This is the correct pattern.

### 2.6 Register Company — Weak Turnstile Enforcement

**File:** `worker/src/routes/auth.ts` (lines 262-273)

```typescript
// 1. Verify Turnstile if provided
if (body.turnstile_token && env.TURNSTILE_SECRET_KEY) {
    // ... verification
}
```

Turnstile verification is **conditional** — it only runs if `body.turnstile_token` is provided AND `env.TURNSTILE_SECRET_KEY` is set. An attacker can simply omit the token to bypass CAPTCHA protection entirely. This should be **required**, not optional.

### 2.7 Register Company — User Enumeration

**File:** `worker/src/routes/auth.ts` (lines 275-278)

```typescript
const { data: existingUser } = await admin.auth.admin.listUsers();
const alreadyExists = existingUser?.users?.find(
    (u: { email?: string }) => u.email?.toLowerCase() === gmEmail,
);
```

**PERFORMANCE + SECURITY:** This lists ALL users to find one email. With thousands of users, this is extremely slow. More critically, the response differentiates between "email already has a company" (409) and "email doesn't exist" (continues), enabling email enumeration.

Also: `listUsers()` without pagination returns a limited batch. If the target email is beyond the first page, the check silently passes, allowing duplicate accounts.

---

## 3. FRONTEND LAYER

### 3.1 ProtectedRoute Component — GOOD

**File:** `src/components/ProtectedRoute.tsx`

Properly checks:
1. Authentication state (redirects to `/login`)
2. Company membership (redirects to `/no-access` if no companies)
3. Platform roles (founder/admin bypass)
4. Company roles (optional per-route)
5. Module activation (optional per-route)

**Minor gap:** Role check uses OR logic with a flat array comparison. Doesn't use `getRoleLevel` hierarchy — a route could allow `supervisor` but not `department_manager` (higher role), though this is configurable per-route.

### 3.2 Supabase Client — Correct

**File:** `src/services/supabase.ts`

Uses `VITE_SUPABASE_ANON_KEY` (public anon key, safe to expose in frontend) with env validation. No service keys exposed.

### 3.3 CompanyContext — Dual-Path Fetch

**File:** `src/contexts/CompanyContext.tsx` (lines 117-139)

```typescript
// Fetch memberships via worker API (bypasses RLS recursion)
if (API_URL && session?.access_token) {
    const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
    });
    // ...
}
// Fallback: direct Supabase query (works when RLS is fixed)
if (!memberRows) {
    const { data } = await supabase
        .from('company_members')
        .select('*, companies(*)')
        .eq('user_id', user.id)
        .eq('status', 'active');
```

Has a worker API primary path and Supabase fallback. The fallback will cause infinite recursion if 00018 hasn't been applied. The worker path correctly uses admin client.

### 3.4 AuthContext — No Rate Limiting

**File:** `src/contexts/AuthContext.tsx` (lines 109-112)

```typescript
const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
};
```

No client-side rate limiting or attempt counting. Supabase has built-in rate limiting, but the frontend doesn't provide any user feedback about it.

---

## 4. CORS CONFIGURATION

**File:** `worker/src/cors.ts`

```typescript
const ALLOWED_ORIGINS = [
    'https://www.zien-ai.app',
    'https://zien-ai.app',
    'http://localhost:5173',     // Vite dev
    'http://localhost:3000',
];
```

**GOOD:** Strict origin allowlist. Validates per-request.  
**MINOR:** `localhost` origins should be removed or gated behind an environment check for production deployments.

---

## 5. SECRETS MANAGEMENT

### 5.1 Worker Environment Variables

**File:** `worker/src/index.ts` (lines 28-51)

All secrets are in `Env` interface, loaded from Cloudflare Worker environment (wrangler secrets):
- `SUPABASE_SERVICE_ROLE_KEY` — never exposed to frontend
- `OPENAI_API_KEY`, `GOOGLE_API_KEY` — only used server-side in AI routes
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — only in billing routes
- `TURNSTILE_SECRET_KEY` — only in auth routes

**No hardcoded secrets found** in any source file.

### 5.2 Service Role Key Usage

The `SUPABASE_SERVICE_ROLE_KEY` is used via `createAdminClient()` in:
- `checkMembership()` / `discoverMembership()` — intentional RLS bypass
- `store.ts` — **UNINTENTIONAL full bypass** (the store creates its own admin client inline)
- `founder.ts` — intentional (founder-only endpoints)
- Most business routes via `createAdminClient(env)` — used for cross-table queries

**CONCERN:** Many business routes (HR, CRM, chat, etc.) create admin clients for routine queries. This means RLS is effectively bypassed for the majority of API operations, with security relying entirely on the `requireAuth()` + `discoverMembership()` checks in code rather than DB-level RLS.

---

## 6. CRITICAL VULNERABILITIES — PRIORITIZED

### P0 — CRITICAL (Exploit immediately possible)

| # | Vulnerability | File | Impact |
|---|---|---|---|
| 1 | **Store routes: zero authentication, service-role client** | `worker/src/routes/store.ts` (all lines) | Any anonymous internet user can read/write/delete products, orders, customers for ANY company |
| 2 | **70+ business tables may lack RLS** if migration 00018 not applied | `supabase/migrations/00018_fix_rls_recursion.sql` | Direct Supabase API access (anon key) can read/write all business data |

### P1 — HIGH (Authenticated user can exceed their permissions)

| # | Vulnerability | File | Impact |
|---|---|---|---|
| 3 | **HR/CRM/Chat/Projects/Logistics/Meetings: no write-level role checks** | `worker/src/routes/hr.ts`, `crm.ts`, `chat.ts`, `projects.ts`, `logistics.ts`, `meetings.ts` | Any employee can run payroll, delete employees, manage HR data |
| 4 | **Turnstile CAPTCHA is optional** on company registration | `worker/src/routes/auth.ts:262` | Bots can mass-register companies |
| 5 | **discoverMembership uses first company only** | `worker/src/supabase.ts:48` | Multi-company users always act on wrong company for 6+ route groups |
| 6 | **supabase_schema.sql grants FOR ALL to any member** | `supabase_schema.sql:403-420` | If this schema was applied, DB-level role checks are missing |

### P2 — MEDIUM

| # | Vulnerability | File | Impact |
|---|---|---|---|
| 7 | **User enumeration via register-company** | `worker/src/routes/auth.ts:275` | Attacker can discover valid emails |
| 8 | **listUsers() without pagination** | `worker/src/routes/auth.ts:275` | Duplicate accounts possible if >1000 users |
| 9 | **Localhost in CORS origins** | `worker/src/cors.ts:5-6` | No direct exploit, but should be env-gated |
| 10 | **role vs role_code column confusion** | `00001_unified_schema.sql` vs `supabase_schema.sql` | Role checks may silently fail |

---

## 7. RECOMMENDATIONS

### Immediate (P0 — do now)

1. **Fix store.ts** — Add `requireAuth()`, `checkMembership()`, and role-level checks:
```typescript
export async function handleStore(request: Request, env: Env, path: string) {
    const { userId } = await requireAuth(request, env);
    const companyId = request.headers.get('X-Company-Id') || new URL(request.url).searchParams.get('company_id');
    const membership = await checkMembership(env, userId, companyId);
    if (!membership) return errorResponse('Not authorized', 403);
    // ... rest of routes
}
```

2. **Apply migration 00018** — Run the full SQL in Supabase Dashboard SQL Editor immediately.

### Short-term (P1 — this week)

3. **Add role-level checks to HR/CRM/Chat/Projects/Logistics/Meetings** using the existing `getRoleLevel()` + `MODULE_ACCESS` pattern from `worker/src/permissions.ts`. Follow the `accounting.ts` pattern.

4. **Make Turnstile required** for company registration:
```typescript
if (!body.turnstile_token || !env.TURNSTILE_SECRET_KEY) {
    return errorResponse('Captcha verification required', 400);
}
```

5. **Replace `discoverMembership` with `checkMembership`** in all routes, requiring `X-Company-Id` header.

### Medium-term (P2)

6. **Remove localhost from CORS** in production or gate behind `env.ENVIRONMENT !== 'production'`.
7. **Replace `listUsers()` with `getUserByEmail()`** in register-company flow.
8. **Standardize on role_code TEXT column** across all migrations.
9. **Audit admin client usage** — Use user-scoped clients where possible, admin client only when needed.

---

## 8. FILE-BY-FILE SECURITY MATRIX

| File | Auth | Membership | Role Check | RLS | Secrets Safe |
|---|---|---|---|---|---|
| `worker/src/routes/store.ts` | **NONE** | **NONE** | **NONE** | **Bypassed** | Yes |
| `worker/src/routes/hr.ts` | Yes | Yes | **NONE** | Bypassed (admin) | Yes |
| `worker/src/routes/crm.ts` | Yes | Yes | **NONE** | Bypassed (admin) | Yes |
| `worker/src/routes/chat.ts` | Yes | Yes | **NONE** | Bypassed (admin) | Yes |
| `worker/src/routes/projects.ts` | Yes | Yes | **NONE** | Bypassed (admin) | Yes |
| `worker/src/routes/logistics.ts` | Yes | Yes | **NONE** | Bypassed (admin) | Yes |
| `worker/src/routes/meetings.ts` | Yes | Yes | **NONE** | Bypassed (admin) | Yes |
| `worker/src/routes/ai.ts` | Yes | Yes | **Yes** | Via checkMembership | Yes |
| `worker/src/routes/accounting.ts` | Yes | Yes | **Yes** (L40/L65) | Via user client | Yes |
| `worker/src/routes/founder.ts` | Yes | Yes (platform_admins) | **Yes** (3-tier) | Admin | Yes |
| `worker/src/routes/billing.ts` | Partial | Yes | Partial | Admin | Yes |
| `worker/src/routes/controlRoom.ts` | Yes | Yes | **NONE** | Admin | Yes |
| `worker/src/routes/auth.ts` | Partial (public endpoints) | Yes (for protected) | No | Admin | Yes |
| `worker/src/routes/provision.ts` | Yes | Partial | No | Admin | Yes |
| `worker/src/routes/integrations.ts` | Yes | Yes | No | Admin | Yes |
| `src/components/ProtectedRoute.tsx` | Yes | Yes | Yes (configurable) | N/A | N/A |
| `src/contexts/AuthContext.tsx` | N/A (is auth provider) | N/A | N/A | Via anon key | Yes |
| `src/contexts/CompanyContext.tsx` | Yes | Yes (dual path) | N/A | Via anon+worker | Yes |
| `src/lib/permissions.ts` | N/A (utility) | N/A | Yes (defines hierarchy) | N/A | N/A |

---

## 9. POSITIVE SECURITY PATTERNS

1. **SECURITY DEFINER functions** with `SET search_path = public` — correct PostgreSQL security pattern
2. **Comprehensive role hierarchy** in `src/lib/permissions.ts` and `worker/src/permissions.ts` — 25+ roles with numeric levels
3. **AI permission gating** — Agent access AND action level both checked
4. **Invite-only registration** — Users must be in `allowed_signups` table
5. **JWT validation server-side** — `requireAuth()` calls `getUser()`, not just `getSession()`
6. **Worker keeps all secrets** — API keys never reach the browser
7. **CORS strict allowlist** — No wildcard origins
8. **Founder routes triple-gated** — JWT + platform_admins table + role hierarchy (super_admin/admin/viewer)

---

*End of audit. The most critical action item is fixing `store.ts` (P0-1) and applying migration 00018 (P0-2).*
