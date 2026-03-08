# ZIEN Platform — Comprehensive RLS Audit Report

**Date:** March 8, 2026  
**Scope:** All migrations in `supabase/migrations/`  
**Migration Order:** 00001 → 00002 → 00005 → 00006 → 00009 → 00010 → 00012 → 00013 → 00014 → 00015 → 00016 → 00018 → 00019 → 002

---

## EXECUTIVE SUMMARY

| Metric | Count |
|--------|-------|
| **Total tables created** | ~155 (including duplicates) |
| **Unique tables** | ~130 |
| **RLS Enabled + Full CRUD policies** | ~75 |
| **RLS Enabled + SELECT only (missing I/U/D)** | ~25 |
| **NO RLS at all (critical)** | **14** |
| **Policies with recursive subqueries (dangerous)** | **~8** |
| **00018 recursion fix undermined by 002** | **YES — CRITICAL BUG** |

---

## 1. CRITICAL FINDING: Migration 002 Undoes the 00018 Recursion Fix

### The Original Problem
RLS policies on `company_members` contained inline subqueries that queried `company_members` itself, causing **infinite recursion**:

```sql
-- FROM 002_rls_store_invitations.sql (runs AFTER 00018)
CREATE POLICY "Members can see their company members" ON company_members
  FOR SELECT USING (
    company_id IN (SELECT cm.company_id FROM company_members cm  -- QUERIES ITSELF!
                   WHERE cm.user_id = auth.uid() AND cm.status = 'active')
    OR is_founder()
  );
```

### What 00018 Fixed
Migration 00018 correctly:
1. Recreated all helper functions with `SECURITY DEFINER` + `SET search_path = public`
2. Created `auth_user_company_ids()` as a safe replacement for inline subqueries
3. Dropped **all** broken policies on `company_members`
4. Created clean `cm_select`, `cm_insert`, `cm_update`, `cm_delete` policies using `is_company_member()` (SECURITY DEFINER)

### Why the Fix is UNDONE
Migration `002_rls_store_invitations.sql` runs **AFTER** 00018 (lexicographic sort: "002" > "00018") and creates:

| Policy Name | Type | Problem |
|------------|------|---------|
| `"Members can see their company members"` | SELECT | `company_id IN (SELECT cm.company_id FROM company_members cm WHERE ...)` — **RECURSIVE** |
| `"Company GMs can manage members"` | ALL | `EXISTS (SELECT 1 FROM company_members cm WHERE ...)` — **RECURSIVE** |

Since PostgreSQL evaluates **all permissive policies** (no short-circuit), the recursive policies from 002 coexist with the safe policies from 00018. The planner may execute the recursive subquery, causing `infinite recursion detected in policy for relation "company_members"`.

### Fix Required
Add to 002 (or create a new migration 00020):
```sql
DROP POLICY IF EXISTS "Members can see their company members" ON company_members;
DROP POLICY IF EXISTS "Company GMs can manage members" ON company_members;
```

---

## 2. CRITICAL FINDING: 14 Tables Have NO RLS At All

These tables have **neither RLS enabled nor any policies** — any authenticated Supabase client can read/write all rows:

| # | Table | Source | Has company_id? | Risk |
|---|-------|--------|-----------------|------|
| 1 | `integration_usage_logs` | 00005 | ✓ | **HIGH** — billing data leak |
| 2 | `integration_billing_map` | 00005 | ✗ (via usage_log FK) | **HIGH** — financial data |
| 3 | `marketplace_transactions` | 00006 | ✓ | **HIGH** — transaction data |
| 4 | `product_variants` | 00010 | ✗ (product_id FK) | MEDIUM — product details |
| 5 | `project_members` | 00010 | ✗ (project_id FK) | **HIGH** — org structure |
| 6 | `training_attempts` | 00010 | ✗ (assignment_id FK) | MEDIUM — personal data |
| 7 | `chat_channel_members` | 00010 | ✗ (channel_id FK) | **HIGH** — membership leak |
| 8 | `chat_messages` | 00010 | ✗ (channel_id FK) | **CRITICAL** — message content |
| 9 | `pos_order_items` | 00010 | ✗ (order_id FK) | MEDIUM — sales data |
| 10 | `customer_order_items` | 00010 | ✗ (order_id FK) | MEDIUM — sales data |
| 11 | `meeting_sessions` | 00010 | ✗ (meeting_id FK) | **HIGH** — recording URLs |
| 12 | `meeting_participants` | 00010 | ✗ (meeting_id FK) | MEDIUM |
| 13 | `meeting_transcripts` | 00010 | ✗ (meeting_id FK) | **CRITICAL** — transcript content |
| 14 | `meeting_summaries` | 00010 | ✗ (meeting_id FK) | **HIGH** — AI summaries |

**Root Cause:** Migration 00018's `_enable_tenant_rls()` function checks for `company_id` column. Tables without a direct `company_id` (that use parent FK instead) are skipped silently. Step 8 of 00018 only handles `journal_lines`, `task_comments`, and `work_logs` as special cases.

---

## 3. Tables With RLS Enabled But Missing INSERT/UPDATE/DELETE Policies

These tables have RLS enabled and SELECT policies, but **missing write policies** — writes will be silently denied:

| Table | SELECT | INSERT | UPDATE | DELETE | Source | Notes |
|-------|--------|--------|--------|--------|--------|-------|
| `journal_lines` | ✓ (via parent) | ✗ | ✗ | ✗ | 00018 Step 8 | Can read but never write |
| `task_comments` | ✓ (via parent) | ✗ | ✗ | ✗ | 00018 Step 8 | Can read but never write |
| `pricing_rules` | ✓ (TRUE) | ✗ | ✗ | ✗ | 00012 | Intentional: service_role only writes |
| `pricing_quote_items` | ✓ | ✗ | ✗ | ✗ | 00012/00018 | Missing write policies |
| `integration_setup_sessions` | ✓ | ✗ | ✗ | ✗ | 00012/00018 | Missing write policies |
| `integration_health_checks` | ✓ | ✗ | ✗ | ✗ | 00012/00018 | Missing write policies |
| `integration_sync_runs` | ✓ | ✗ | ✗ | ✗ | 00012/00018 | Missing write policies |
| `ai_policy_rules` | ✓ | ✗ | ✗ | ✗ | 00012/00018 | Missing write policies |
| `ai_action_reviews` | ✓ | ✗ | ✗ | ✗ | 00012/00018 | Missing write policies |
| `platform_incidents` | ✓ | ✗ | ✗ | ✗ | 00012 | Missing write for platform_admins |
| `tenant_health_snapshots` | ✓ | ✗ | ✗ | ✗ | 00012/00018 | Intentional: service writes only? |
| `module_runtime_metrics` | ✓ | ✗ | ✗ | ✗ | 00012/00018 | Intentional: service writes only? |
| `approval_workflows` | ✓ | ✗ | ✗ | ✗ | 00012/00018 | GMs should manage workflows |
| `approval_steps` | ✓ (**RECURSIVE!**) | ✗ | ✗ | ✗ | 00012 | Recursive + missing write |
| `platform_audit_log` | ✓ | ✗ | ✗ | ✗ | 00014 | Intentional: audit log is read-only |
| `help_categories` | ✓ | ✗ | ✗ | ✗ | 00016 | Missing admin write policy |
| `academy_tracks` | ✓ | ✗ | ✗ | ✗ | 00016 | Missing admin write policy |
| `academy_lessons` | ✓ | ✗ | ✗ | ✗ | 00016 | Missing admin write policy |
| `academy_quizzes` | ✓ | ✗ | ✗ | ✗ | 00016 | Missing admin write policy |
| `academy_questions` | ✓ | ✗ | ✗ | ✗ | 00016 | Missing admin write policy |
| `content_relations` | ✓ | ✗ | ✗ | ✗ | 00016 | Missing admin write policy |

---

## 4. Remaining Recursive Policies NOT Fixed by 00018

| Table | Policy Name | Type | Recursive Subquery |
|-------|-------------|------|--------------------|
| `company_members` | "Members can see their company members" | SELECT | `company_id IN (SELECT cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid())` |
| `company_members` | "Company GMs can manage members" | ALL | `EXISTS (SELECT 1 FROM company_members cm WHERE ...)` |
| `pricing_quotes` | "pricing_quotes_insert" | INSERT | `company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())` |
| `approval_steps` | "approval_steps_read" | SELECT | Nested: `... FROM approval_workflows WHERE company_id IN (SELECT company_id FROM company_members WHERE ...)` |
| `approval_actions` | "approval_actions_read" | SELECT | Nested: `... FROM approval_requests WHERE company_id IN (SELECT company_id FROM company_members WHERE ...)` |
| `approval_actions` | "approval_actions_insert" | INSERT | Same nested pattern |
| `knowledge_articles` | "knowledge_read" | SELECT | `company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())` |
| `knowledge_articles` | "knowledge_manage" | ALL | `cm.company_id FROM company_members cm WHERE cm.user_id = auth.uid()` |

---

## 5. RLS Helper Functions Audit

| Function | Defined In | SECURITY DEFINER | SET search_path | Status |
|----------|-----------|-----------------|----------------|--------|
| `is_founder()` | 00002, **00018** | ✓ | ✓ (00018) | ✅ Fixed |
| `is_platform_admin()` | 00002, **00018** | ✓ | ✓ (00018) | ✅ Fixed |
| `is_company_member(UUID)` | 00002, **00018** | ✓ | ✓ (00018) | ✅ Fixed |
| `is_company_admin(UUID)` | 00002, **00018** | ✓ | ✓ (00018) | ✅ Fixed (uses COALESCE role_code/role) |
| `has_company_role(UUID, company_role)` | 00002 only | ✓ | **✗ Missing** | ⚠️ No SET search_path |
| `has_permission(UUID, TEXT)` | 00002 only | ✓ | **✗ Missing** | ⚠️ No SET search_path |
| `can_access_department(UUID, UUID)` | 00009 only | ✓ | **✗ Missing** | ⚠️ No SET search_path |
| `current_user_id()` | 00009, **00018** | ✓ | ✓ (00018) | ✅ Fixed |
| `is_platform_founder()` | 00009, **00018** | ✓ | ✓ (00018) | ✅ Fixed |
| `auth_user_company_ids()` | 00018 | ✓ | ✓ | ✅ New |
| `_cm_role(UUID, UUID)` | 00018 | ✓ | ✓ | ✅ New |

**Note:** `has_company_role`, `has_permission`, and `can_access_department` lack `SET search_path = public`. While SECURITY DEFINER already bypasses RLS, the missing `SET search_path` is a **search-path injection vulnerability** — a malicious user could create a schema with a function that shadows `auth.uid()` or other calls inside these functions.

---

## 6. COMPREHENSIVE TABLE: All Tables × RLS Status

Legend:
- ✅ = Policy exists and is non-recursive
- ⚠️ = Policy exists but has recursive subquery
- 🔸 = Covered by FOR ALL policy (which implicitly covers this operation)
- ✗ = No policy for this operation
- `—` = RLS not enabled (wide open)

### A. Core Platform Tables (00001 schema, 00002 + 002 policies)

| # | Table | RLS? | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|-------|------|--------|--------|--------|--------|-------|
| 1 | `profiles` | ✅ | ✅ | 🔸 | ✅ | 🔸 | 00018 fixes SELECT. admin ALL covers I/D |
| 2 | `modules_catalog` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Public read, admin ALL |
| 3 | `company_types` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Public read, admin ALL |
| 4 | `company_type_template_modules` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Public read, admin ALL |
| 5 | `companies` | ✅ | ✅ | ✅ | ✅ | ✅ | Full CRUD |
| 6 | `company_members` | ✅ | ✅ + ⚠️ | ✅ + ⚠️ | ✅ + ⚠️ | ✅ + ⚠️ | **00018 safe policies + 002 recursive policies coexist!** |
| 7 | `departments` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | 00002 + 002 duplicate policies |
| 8 | `blueprints` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Public read, admin ALL |
| 9 | `blueprint_modules` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Public read, admin ALL |
| 10 | `seed_packs` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Public read, admin ALL |
| 11 | `blueprint_seed_packs` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Public read, admin ALL |
| 12 | `provisioning_jobs` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | SELECT (admin/requestor), admin ALL |
| 13 | `company_modules` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, admin ALL |
| 14 | `subscription_plans` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Public read, admin ALL |
| 15 | `company_subscriptions` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Admin read, admin ALL |
| 16 | `clients` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, employee+ ALL |
| 17 | `invoices` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, supervisor+ ALL |
| 18 | `invoice_items` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Via parent invoice |
| 19 | `payments` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, supervisor+ ALL |
| 20 | `tax_settings` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, company_admin ALL |
| 21 | `employees` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, dept_mgr+ ALL |
| 22 | `attendance` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, supervisor+ ALL |
| 23 | `leave_requests` | ✅ | ✅ | ✅ | ✅ | ✗ | **No DELETE policy** |
| 24 | `payroll` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | dept_mgr+ read, company_admin ALL |
| 25 | `vehicles` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, supervisor+ ALL |
| 26 | `logistics_tasks` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, supervisor+ ALL |
| 27 | `quotes` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, employee+ ALL |
| 28 | `contracts` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, dept_mgr+ ALL |
| 29 | `projects` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, supervisor+ ALL |
| 30 | `meetings` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read + modify |
| 31 | `chats` | ✅ | ✅ | ✅ | ✗ | ✗ | **No UPDATE/DELETE** (maybe intentional) |
| 32 | `company_onboarding_submissions` | ✅ | ✅ | ✅ | ✅ | ✗ | **No DELETE** |
| 33 | `company_documents` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read, dept_mgr+ ALL |
| 34 | `ai_usage_logs` | ✅ | ✅ | ✅ | ✗ | ✗ | SELECT + INSERT only (append-only log) |
| 35 | `ai_reports` | ✅ | ✅ | ✅ | ✗ | ✗ | SELECT + INSERT only |
| 36 | `audit_logs` | ✅ | ✅ | ✅ | ✗ | ✗ | Company_admin read, auth INSERT (intentional) |
| 37 | `permissions` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Public read, admin ALL |
| 38 | `role_permissions` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Public read, admin ALL |
| 39 | `feature_flags` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | 00002 company-scoped + 00014 platform_admins |

### B. Integrations (00005, 00006) — Mostly NO RLS!

| # | Table | RLS? | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|-------|------|--------|--------|--------|--------|-------|
| 40 | `integrations_catalog` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | 002 adds policies. Duplicate created in 00005 + 002 |
| 41 | `tenant_integrations` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | 002 adds policies |
| 42 | `integration_usage_logs` | **—** | **—** | **—** | **—** | **—** | ❌ **NO RLS AT ALL** |
| 43 | `integration_billing_map` | **—** | **—** | **—** | **—** | **—** | ❌ **NO RLS AT ALL** |
| 44 | `marketplace_transactions` | **—** | **—** | **—** | **—** | **—** | ❌ **NO RLS AT ALL** |

### C. Business Domain — WITH company_id (00010, covered by 00018 _enable_tenant_rls)

All get: SELECT(member/admin) + INSERT(member) + UPDATE(member/admin) + DELETE(company_admin/admin)

| # | Table | RLS? | S | I | U | D | Notes |
|---|-------|------|---|---|---|---|-------|
| 45 | `chart_of_accounts` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 46 | `journal_entries` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 47 | `advances` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 48 | `expenses` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 49 | `employee_documents` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 50 | `benefits` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 51 | `insurance_claims` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 52 | `job_posts` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 53 | `job_applications` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 54 | `training_courses` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 55 | `training_assignments` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 56 | `leads` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 57 | `opportunities` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 58 | `receipts` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 59 | `client_portal_users` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 60 | `tasks` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 61 | `work_logs` | ✅ | ✅ | ✅ | ✅ | ✅ | Has company_id |
| 62 | `drivers` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 63 | `routes` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 64 | `shipments` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 65 | `gps_tracks` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 66 | `location_pings` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 67 | `geofences` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 68 | `product_categories` | ✅ | ✅ | ✅ | ✅ | ✅ | + 002 adds duplicate FOR ALL |
| 69 | `products` | ✅ | ✅ | ✅ | ✅ | ✅ | + 002 adds duplicate FOR ALL |
| 70 | `warehouses` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 71 | `inventory_items` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 72 | `inventory_movements` | ✅ | ✅ | ✅ | ✅ | ✅ | + 002 adds duplicate FOR ALL |
| 73 | `pos_sessions` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 74 | `pos_orders` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 75 | `customer_orders` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 76 | `chat_channels` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 77 | `presence_status` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 78 | `meeting_rooms` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 79 | `ai_agent_actions` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 80 | `security_events` | ✅ | ✅ | ✅ | ✅ | ✅ | company_id is nullable — NULL rows only visible to platform_admin |
| 81 | `integration_events` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 82 | `pricing_addons` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 83 | `subscription_usage_counters` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| 84 | `billing_events` | ✅ | ✅ | ✅ | ✅ | ✅ | |

### D. Business Domain — WITHOUT company_id — Partially Handled (00018 Step 8)

| # | Table | RLS? | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|-------|------|--------|--------|--------|--------|-------|
| 85 | `journal_lines` | ✅ | ✅ | ✗ | ✗ | ✗ | **SELECT only** via parent journal_entries |
| 86 | `task_comments` | ✅ | ✅ | ✗ | ✗ | ✗ | **SELECT only** via parent tasks |

### E. Business Domain — WITHOUT company_id — ❌ NO RLS AT ALL

| # | Table | RLS? | S | I | U | D | Parent FK | Notes |
|---|-------|------|---|---|---|---|-----------|-------|
| 87 | `product_variants` | **—** | — | — | — | — | products.id | ❌ Skipped by _enable_tenant_rls |
| 88 | `project_members` | **—** | — | — | — | — | projects.id | ❌ Exposes project assignments |
| 89 | `training_attempts` | **—** | — | — | — | — | training_assignments.id | ❌ Quiz answers exposed |
| 90 | `chat_channel_members` | **—** | — | — | — | — | chat_channels.id | ❌ Channel membership exposed |
| 91 | `chat_messages` | **—** | — | — | — | — | chat_channels.id | ❌ **ALL MESSAGES READABLE** |
| 92 | `pos_order_items` | **—** | — | — | — | — | pos_orders.id | ❌ Sales line items |
| 93 | `customer_order_items` | **—** | — | — | — | — | customer_orders.id | ❌ Order line items |
| 94 | `meeting_sessions` | **—** | — | — | — | — | meetings.id | ❌ **Recording URLs exposed** |
| 95 | `meeting_participants` | **—** | — | — | — | — | meetings.id | ❌ |
| 96 | `meeting_transcripts` | **—** | — | — | — | — | meetings.id | ❌ **Transcript content exposed** |
| 97 | `meeting_summaries` | **—** | — | — | — | — | meetings.id | ❌ AI summaries exposed |

### F. Operational Closure (00012)

| # | Table | RLS? | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|-------|------|--------|--------|--------|--------|-------|
| 98 | `pricing_rules` | ✅ | ✅ | ✗ | ✗ | ✗ | Read-only (service_role writes) — intentional |
| 99 | `pricing_quotes` | ✅ | ✅ | ⚠️ | ✗ | ✗ | SELECT fixed by 00018; **INSERT still RECURSIVE** |
| 100 | `pricing_quote_items` | ✅ | ✅ | ✗ | ✗ | ✗ | SELECT only |
| 101 | `integration_setup_sessions` | ✅ | ✅ | ✗ | ✗ | ✗ | SELECT only |
| 102 | `integration_health_checks` | ✅ | ✅ | ✗ | ✗ | ✗ | SELECT only |
| 103 | `integration_sync_runs` | ✅ | ✅ | ✗ | ✗ | ✗ | SELECT only |
| 104 | `ai_policy_rules` | ✅ | ✅ | ✗ | ✗ | ✗ | SELECT only |
| 105 | `ai_action_reviews` | ✅ | ✅ | ✗ | ✗ | ✗ | SELECT only |
| 106 | `ai_conversation_threads` | ✅ | ✅ | ✅ | ✗ | ✗ | User-scoped. **No UPDATE/DELETE** |
| 107 | `ai_conversation_messages` | ✅ | ✅ | ✅ | ✗ | ✗ | User-scoped. **No UPDATE/DELETE** |
| 108 | `platform_incidents` | ✅ | ✅ | ✗ | ✗ | ✗ | Platform admin SELECT only |
| 109 | `tenant_health_snapshots` | ✅ | ✅ | ✗ | ✗ | ✗ | Fixed by 00018. SELECT only |
| 110 | `module_runtime_metrics` | ✅ | ✅ | ✗ | ✗ | ✗ | SELECT only |
| 111 | `approval_workflows` | ✅ | ✅ | ✗ | ✗ | ✗ | Fixed by 00018. **No write policies** |
| 112 | `approval_steps` | ✅ | ⚠️ | ✗ | ✗ | ✗ | **RECURSIVE SELECT** (not fixed by 00018) |
| 113 | `approval_requests` | ✅ | ✅ | ✅ | ✗ | ✗ | Fixed by 00018. No UPDATE/DELETE |
| 114 | `approval_actions` | ✅ | ⚠️ | ⚠️ | ✗ | ✗ | **Both S+I are RECURSIVE** (not fixed) |

### G. HR/CRM Gap-Fill (00013) — Fixed by 00018

| # | Table | RLS? | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|-------|------|--------|--------|--------|--------|-------|
| 115 | `general_ledger` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | FOR ALL via is_company_member (00018 fixed) |
| 116 | `cost_centers` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | FOR ALL (00018 fixed) |
| 117 | `employee_shifts` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | FOR ALL (00018 fixed) |
| 118 | `employee_goals` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | FOR ALL (00018 fixed) |
| 119 | `crm_activities` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | FOR ALL (00018 fixed) |
| 120 | `deal_stages` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | FOR ALL (00018 fixed) |

### H. Founder/Platform Tables (00014)

| # | Table | RLS? | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|-------|------|--------|--------|--------|--------|-------|
| 121 | `platform_audit_log` | ✅ | ✅ | ✗ | ✗ | ✗ | SELECT platform_admins only (intentional) |
| 122 | `ai_policies` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | SELECT + ALL (admin+) |
| 123 | `platform_announcements` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | 00014 + 002 duplicate. Public read + admin ALL |
| 124 | `platform_config` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | super_admin only |
| 125 | `platform_admins` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | super_admin only |

### I. Industry Blueprints (00015)

| # | Table | RLS? | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|-------|------|--------|--------|--------|--------|-------|
| 126 | `industry_blueprints` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Active = public read, service_role ALL |

### J. Content & Knowledge System (00016)

| # | Table | RLS? | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|-------|------|--------|--------|--------|--------|-------|
| 127 | `help_categories` | ✅ | ✅ | ✗ | ✗ | ✗ | **No admin write policy** |
| 128 | `knowledge_articles` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | 00016 (founder ALL) + **00019 adds RECURSIVE policies!** |
| 129 | `faq_categories` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | SELECT + founder ALL |
| 130 | `faq_items` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | SELECT + founder ALL |
| 131 | `faq_votes` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | User-scoped ALL |
| 132 | `faq_submissions` | ✅ | ✗ | ✅ | ✗ | ✗ | **INSERT only — submitters can't read own!** |
| 133 | `academy_tracks` | ✅ | ✅ | ✗ | ✗ | ✗ | **No admin write** |
| 134 | `academy_lessons` | ✅ | ✅ | ✗ | ✗ | ✗ | **No admin write** |
| 135 | `academy_quizzes` | ✅ | ✅ | ✗ | ✗ | ✗ | **No admin write** |
| 136 | `academy_questions` | ✅ | ✅ | ✗ | ✗ | ✗ | **No admin write** |
| 137 | `academy_enrollments` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | User-scoped ALL |
| 138 | `academy_attempts` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | User-scoped ALL |
| 139 | `academy_certificate_templates` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | SELECT + founder ALL |
| 140 | `academy_issued_certificates` | ✅ | ✅ | ✅ | ✗ | ✗ | User read own + founder INSERT. **No UPDATE/DELETE** |
| 141 | `ai_prompt_packs` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | SELECT + founder ALL |
| 142 | `content_relations` | ✅ | ✅ | ✗ | ✗ | ✗ | **SELECT only — no admin write** |

### K. Knowledge Articles (00019) — RECURSIVE!

| # | Table | RLS? | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|-------|------|--------|--------|--------|--------|-------|
| 128b | `knowledge_articles` | ✅ | ⚠️ | 🔸 | 🔸 | 🔸 | **00019 adds "knowledge_read" with RECURSIVE subquery** + "knowledge_manage" FOR ALL also RECURSIVE |

### L. Store, Invitations & Platform (002)

| # | Table | RLS? | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|-------|------|--------|--------|--------|--------|-------|
| 143 | `platform_roles` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | User read own + founder ALL |
| 144 | `tenant_subscriptions` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Member read + founder ALL |
| 145 | `company_invitations` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Admin ALL + user read own |
| 146 | `contact_submissions` | ✅ | ✅ | ✅ | ✗ | ✗ | Anyone INSERT + founder SELECT. No U/D |
| 147 | `marketing_campaigns` | ✅ | 🔸 | 🔸 | 🔸 | 🔸 | Founder ALL only |
| 148 | `store_customers` | ✅ | 🔸 | 🔸 | 🔸 | 🔸 | Member ALL |
| 149 | `orders` | ✅ | 🔸 | 🔸 | 🔸 | 🔸 | Member ALL |
| 150 | `order_items` | ✅ | 🔸 | 🔸 | 🔸 | 🔸 | Via parent order |
| 151 | `store_settings` | ✅ | 🔸 | 🔸 | 🔸 | 🔸 | Member ALL |
| 152 | `help_articles` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Auth read + founder ALL |
| 153 | `support_tickets` | ✅ | 🔸 | 🔸 | 🔸 | 🔸 | Member/founder ALL |
| 154 | `academy_courses` | ✅ | ✅ | 🔸 | 🔸 | 🔸 | Published read + founder ALL |

---

## 7. PRIORITY FIX LIST

### P0 — Critical (data exposure / recursion crash)

| # | Issue | Fix |
|---|-------|-----|
| 1 | **002 re-adds recursive policies on company_members** | Create migration 00020: DROP the two recursive policies |
| 2 | **chat_messages has NO RLS** — all messages from all companies readable | Enable RLS + add policy via parent `chat_channels.company_id` |
| 3 | **meeting_transcripts has NO RLS** — transcript content exposed | Enable RLS + add policy via parent `meetings.company_id` |
| 4 | **meeting_sessions has NO RLS** — recording URLs exposed | Enable RLS + add policy via parent `meetings.company_id` |
| 5 | **00019 knowledge_articles "knowledge_read" is RECURSIVE** | Replace inline subquery with `is_company_member()` |

### P1 — High (data leak or write denied)

| # | Issue | Fix |
|---|-------|-----|
| 6 | `integration_usage_logs` — no RLS (billing data) | Enable RLS + tenant policies |
| 7 | `integration_billing_map` — no RLS (financial data) | Enable RLS + tenant policies via parent |
| 8 | `marketplace_transactions` — no RLS | Enable RLS + tenant policies |
| 9 | `chat_channel_members` — no RLS (membership leak) | Enable RLS + parent-FK policy |
| 10 | `project_members` — no RLS (org structure) | Enable RLS + parent-FK policy |
| 11 | `meeting_summaries` — no RLS | Enable RLS + parent-FK policy |
| 12 | `meeting_participants` — no RLS | Enable RLS + parent-FK policy |
| 13 | `journal_lines` — SELECT only, no write | Add INSERT/UPDATE/DELETE via parent |
| 14 | `task_comments` — SELECT only, no write | Add INSERT/UPDATE/DELETE via parent |
| 15 | `approval_steps` — RECURSIVE SELECT | Fix to use `auth_user_company_ids()` |
| 16 | `approval_actions` — RECURSIVE S+I | Fix to use `auth_user_company_ids()` |
| 17 | `pricing_quotes` INSERT — RECURSIVE | Fix to use `is_company_member()` |

### P2 — Medium (missing write policies, incomplete coverage)

| # | Issue | Fix |
|---|-------|-----|
| 18 | `product_variants` — no RLS | Enable RLS + parent-FK policy |
| 19 | `pos_order_items` — no RLS | Enable RLS + parent-FK policy |
| 20 | `customer_order_items` — no RLS | Enable RLS + parent-FK policy |
| 21 | `training_attempts` — no RLS | Enable RLS + parent-FK policy |
| 22 | `help_categories` — no admin write | Add founder/admin ALL policy |
| 23 | `academy_tracks/lessons/quizzes/questions` — no admin write | Add founder/admin ALL policies |
| 24 | `content_relations` — no admin write | Add founder/admin ALL policy |
| 25 | `faq_submissions` — INSERT only, no read for submitter | Add user SELECT policy |
| 26 | `has_company_role()` — missing SET search_path | Recreate with SET search_path = public |
| 27 | `has_permission()` — missing SET search_path | Recreate with SET search_path = public |
| 28 | `can_access_department()` — missing SET search_path | Recreate with SET search_path = public |

---

## 8. DUPLICATE / CONFLICTING TABLE DEFINITIONS

| Table | Created In | Conflict |
|-------|-----------|---------|
| `feature_flags` | 00001 (company-scoped, has company_id) + 00014 (platform-scoped, flag_key UNIQUE) | IF NOT EXISTS → 00001 schema wins. 00014 policies still work (don't reference columns) |
| `platform_announcements` | 00014 + 002 | Different schemas. First creation wins. Duplicate policies. |
| `knowledge_articles` | 00016 + 00019 | 00016 creates first with content_id/slug. 00019 schema ignored. But 00019 ADDS recursive policies! |
| `product_categories` | 00010 + 002 | 00010 schema wins. 002 adds duplicate FOR ALL policy |
| `products` | 00010 + 002 | 00010 schema wins. 002 adds duplicate FOR ALL policy |
| `inventory_movements` | 00010 + 002 | 00010 schema wins. 002 adds duplicate FOR ALL policy |
| `integrations_catalog` | 00005 + 002 | 00005 schema wins. 002 adds RLS policies (00005 has none) |
| `tenant_integrations` | 00005 + 002 | 00005 schema wins. 002 adds RLS policies |

---

## 9. MIGRATION ORDER ISSUES

The file `002_rls_store_invitations.sql` sorts **after** all `000XX` files lexicographically ("002" > "00018"). This means:

1. **00018** drops recursive company_members policies → **002** recreates them → **recursion returns**
2. **002** creates tables + RLS that may conflict with 00018's dynamic policy creation
3. **002** references `is_company_member()` and `is_founder()` from 00002 — this works since 00002 runs first

**Recommendation:** Rename `002_rls_store_invitations.sql` to `00020_rls_store_invitations.sql` and remove all company_members policies from it (since 00018 already handles them correctly).
