# ZIEN Platform - Unified Data Model

## 1. Naming Map (Old to Unified)

| Source Project | Old Name | Unified Name | Reason |
|----------------|----------|--------------|--------|
| Provisioning Engine | `tenants` | `companies` | "Companies" is more descriptive for multi-tenant SaaS |
| Provisioning Engine | `tenant_types` | `company_types` | Consistency with `companies` |
| Provisioning Engine | `tenant_modules` | `company_modules` | Consistency |
| Provisioning Engine | `tenant_id` (FK) | `company_id` (FK) | Consistency |
| Flutter/Init | `tenant_members` | `company_members` | Consistency |
| Flutter/Init | `tenant_subscriptions` | `company_subscriptions` | Consistency |
| Provisioning Engine | `modules` | `modules_catalog` | Avoids keyword collision; matches main schema |
| Flutter Models | `titleAr` / `title_ar` | `name_ar` | Unified naming convention |
| Flutter Models | `titleEn` / `title_en` | `name_en` | Unified naming convention |
| Init Migration | `modules_catalog.id` (TEXT PK) | `modules_catalog.id` (UUID PK) + `code` (TEXT UNIQUE) | Supports both UUID lookups and code-based queries |
| Init Migration | `subscription_plans.id` (TEXT PK) | `subscription_plans.id` (UUID PK) + `code` (TEXT UNIQUE) | Consistency |
| Various | `is_core` / `is_paid_addon` | `tier` ENUM (`core`, `addon`, `premium`) | Cleaner than two booleans |
| Provisioning Engine | `uuid_generate_v4()` | `gen_random_uuid()` | No `uuid-ossp` extension needed; uses built-in `pgcrypto` |
| Provisioning Engine | `order_index` | `apply_order` | More descriptive |
| Init Migration | `platform_role` (ENUM on profiles) | `platform_role` (ENUM on profiles) | Keep as-is; cleaner than separate table |
| Main Schema | `platform_roles` (table) | Removed | Replaced by `profiles.platform_role` ENUM |

## 2. Unified ENUMs

```sql
-- Company lifecycle status
CREATE TYPE company_status AS ENUM (
    'pending_review', 'active', 'restricted', 'suspended', 'rejected'
);

-- Platform-level role (on profiles table)
CREATE TYPE platform_role AS ENUM (
    'founder', 'platform_admin', 'platform_support', 'tenant_user'
);

-- Role within a company (on company_members table)
CREATE TYPE company_role AS ENUM (
    'company_gm', 'executive_secretary', 'department_manager',
    'supervisor', 'employee', 'client_user'
);

-- Module pricing tier (on modules_catalog table)
CREATE TYPE module_tier AS ENUM ('core', 'addon', 'premium');

-- Provisioning job lifecycle
CREATE TYPE job_status AS ENUM (
    'pending', 'validating', 'applying_modules', 'seeding',
    'finalizing', 'completed', 'failed', 'rolled_back'
);

-- Seed pack types
CREATE TYPE seed_kind AS ENUM (
    'roles', 'chart_of_accounts', 'tax_config', 'workflows', 'demo_data'
);

-- Billing interval
CREATE TYPE billing_interval AS ENUM ('monthly', 'yearly');

-- Subscription status
CREATE TYPE subscription_status AS ENUM (
    'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'pending_approval'
);

-- Member status within a company
CREATE TYPE member_status AS ENUM ('invited', 'active', 'suspended');
```

## 3. Conflict Resolution Matrix

| Conflict | Schema A | Schema B | Resolution | Rationale |
|----------|----------|----------|------------|-----------|
| Company table name | `companies` (main+init) | `tenants` (provisioning+flutter) | `companies` | Used in 2 of 4 schemas; more business-friendly |
| Module catalog PK | UUID (main) | TEXT (init) | UUID + TEXT `code` UNIQUE | Supports both patterns |
| Subscription plan PK | UUID (main) | TEXT (init) | UUID + TEXT `code` UNIQUE | Consistency with modules |
| Profiles table | Missing (main) | Present (init+flutter) | Add `profiles` | Essential for user identity |
| Company `industry` | Missing (main) | Present (init) | Add to `companies` | Useful for blueprint matching |
| Company `logo_url` | Missing (main) | Present (init) | Add to `companies` | Needed for branding |
| RLS approach | `SECURITY DEFINER` helpers (main) | Inline subqueries (flutter) | `SECURITY DEFINER` helpers | More maintainable and performant |
| UUID generation | `gen_random_uuid()` (main) | `uuid_generate_v4()` (prov) | `gen_random_uuid()` | No extension dependency |
| Role storage | `platform_roles` table (main) | `platform_role` ENUM on profiles (init) | ENUM on profiles | Simpler; 1:1 with user |
| Provisioning `tenants` FK | `tenant_id` | N/A | `company_id` FK to `companies` | Eliminates duplicate entity |

## 4. Unified Table Inventory (~40 tables)

### Platform Layer (3 tables)
| Table | Source | Purpose |
|-------|--------|---------|
| `profiles` | init + flutter | 1:1 with `auth.users`, stores display_name, avatar, platform_role |
| `modules_catalog` | main + init + prov (merged) | Module registry with UUID PK + code UNIQUE + tier ENUM + dependencies JSONB |
| `company_types` | main + prov `tenant_types` (merged) | Business archetypes with bilingual names |

### Company Core (4 tables)
| Table | Source | Purpose |
|-------|--------|---------|
| `companies` | main + init (merged) | Tenant record with full branding, geo, status |
| `company_members` | main + init (merged) | Multi-company membership per user; company_role ENUM |
| `company_type_template_modules` | main | Default modules per company type |
| `departments` | main + init (merged) | Org units per company |

### Provisioning Engine (5 tables)
| Table | Source | Purpose |
|-------|--------|---------|
| `blueprints` | prov (adapted) | Template per company_type with version + rules |
| `blueprint_modules` | prov (adapted) | Modules linked to blueprints |
| `seed_packs` | prov (adapted) | Seed data payloads (roles, CoA, tax, workflows) |
| `blueprint_seed_packs` | prov (adapted) | Ordered seed packs per blueprint |
| `provisioning_jobs` | prov (enhanced) | Job queue with 8 statuses + idempotency + snapshot |

### Billing (2 tables)
| Table | Source | Purpose |
|-------|--------|---------|
| `subscription_plans` | main + init (merged) | Plans with UUID PK + code UNIQUE |
| `company_subscriptions` | main `tenant_subscriptions` (renamed) | Stripe binding per company |

### Company Modules (1 table)
| Table | Source | Purpose |
|-------|--------|---------|
| `company_modules` | init `tenant_modules` + prov `tenant_modules` (merged) | Active modules per company |

### Business Modules (16 tables)
| Table | Source | Purpose |
|-------|--------|---------|
| `clients` | main | CRM clients |
| `invoices` | main | Accounting invoices |
| `invoice_items` | main | Invoice line items |
| `payments` | main | Payment records |
| `tax_settings` | main | Tax configuration |
| `employees` | main | HR employee records |
| `attendance` | main | HR attendance tracking |
| `leave_requests` | main | HR leave management |
| `payroll` | main | HR payroll |
| `vehicles` | main | Fleet vehicles |
| `logistics_tasks` | main | Fleet task management |
| `quotes` | main | CRM quotes |
| `contracts` | main | CRM contracts |
| `projects` | main | Project management |
| `meetings` | main | Communication meetings |
| `chats` | main | Communication chat messages |

### Onboarding (2 tables)
| Table | Source | Purpose |
|-------|--------|---------|
| `company_onboarding_submissions` | main | KYC review flow |
| `company_documents` | main | Company file attachments |

### AI and Audit (3 tables)
| Table | Source | Purpose |
|-------|--------|---------|
| `ai_usage_logs` | main | AI token usage tracking |
| `ai_reports` | main | Generated AI reports |
| `audit_logs` | main | System-wide audit trail |

### RBAC and Feature Flags (3 tables) -- NEW
| Table | Source | Purpose |
|-------|--------|---------|
| `permissions` | new | Permission registry (code-based) |
| `role_permissions` | new | Maps roles to permissions (RBAC) |
| `feature_flags` | new | Per-company feature toggles |

## 5. Entity Relationship Summary

```
auth.users (Supabase managed)
    |
    v (1:1)
profiles
    |
    v (1:N)
company_members -----> companies
    |                      |
    |                      +--> company_types --> company_type_template_modules --> modules_catalog
    |                      |
    |                      +--> company_modules --> modules_catalog
    |                      |
    |                      +--> company_subscriptions --> subscription_plans
    |                      |
    |                      +--> departments
    |                      |
    |                      +--> provisioning_jobs --> blueprints
    |                      |                              |
    |                      |                              +--> blueprint_modules --> modules_catalog
    |                      |                              +--> blueprint_seed_packs --> seed_packs
    |                      |
    |                      +--> [All 16 business module tables]
    |                      |
    |                      +--> audit_logs
    |                      +--> ai_usage_logs
    |                      +--> ai_reports
    |                      +--> feature_flags
    |
    v
permissions <-- role_permissions (maps company_role to permissions)
```

## 6. Key Design Decisions

1. **Identity vs Membership**: `profiles` = who you are; `company_members` = your role in a company. One user can be `company_gm` in Company A and `employee` in Company B.

2. **Provisioning is Data-Driven**: All provisioning logic reads from `blueprints`, `blueprint_modules`, `seed_packs` tables. Adding a new company type = inserting rows, not deploying code.

3. **Idempotent Provisioning**: `provisioning_jobs.idempotency_key` UNIQUE prevents duplicate provisioning. `snapshot` JSONB freezes all decisions at execution time for auditability.

4. **RBAC is Flexible**: `role_permissions` maps roles to fine-grained permissions. Can be extended without schema changes.

5. **Feature Flags per Company**: `feature_flags` table allows gradual rollout of modules per company.

6. **All business tables are company-scoped**: Every business table has `company_id` FK with `ON DELETE CASCADE` and RLS enforced via `is_company_member()`.
