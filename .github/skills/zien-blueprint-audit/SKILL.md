---
name: zien-blueprint-audit
description: '**WORKFLOW SKILL** — Audit the ZIEN platform codebase against the Enterprise Operating Blueprint (القانون المطلق). USE FOR: gap analysis between blueprint and code; reconciling schema/API/permissions/modules with blueprint sections; planning implementation sprints; verifying compliance after changes; generating reconciliation reports. USE WHEN: user says "audit", "gap analysis", "blueprint compliance", "ما الفرق", "reconciliation", "what is missing", "compare to blueprint", "verify against constitution". DO NOT USE FOR: general coding tasks unrelated to blueprint compliance.'
argument-hint: 'Section number or area to audit (e.g., "section 8 provisioning", "all", "schema only")'
---

# ZIEN Blueprint-to-Code Reconciliation Audit

## Purpose

This skill systematically compares the ZIEN Enterprise Operating Blueprint (the project's absolute constitution) against the actual codebase, identifying what is **complete**, **partial**, **missing**, or **divergent**. It produces actionable gap reports and prioritized implementation plans.

## When to Use

- Before starting a new implementation sprint
- After completing a task, to verify blueprint compliance
- When asking "what's the gap between blueprint and code?"
- When planning which section to build next
- When onboarding to understand current platform state

## Source of Truth

The Enterprise Operating Blueprint is the **absolute law** (القانون المطلق) for the ZIEN platform. It defines:
- What tables must exist and their columns
- What API routes must exist and their contracts
- What permissions must be enforced
- What modules, integrations, and surfaces must work
- What operational capabilities must be in place

**Blueprint location**: [./references/blueprint-sections.md](./references/blueprint-sections.md)

## Audit Procedure

### Phase 1: Scope Selection

Determine what to audit. The blueprint has 21 sections:

| # | Section | Code Areas to Check |
|---|---------|-------------------|
| 0 | Metadata | Project config, README |
| 1 | Vision & Tenets | Architecture adherence |
| 2 | Product Surfaces | Routes in App.tsx, pages/ |
| 3 | Architecture | Layer separation, bounded contexts |
| 4 | Access & Journeys | Login flow, routing guards, visitor mode |
| 5 | Security & Access | RLS policies, helper functions, permission model |
| 6 | Unified Schema | supabase_schema.sql, migrations/, actual DB |
| 7 | Modules & Catalog | modules_catalog table, company_modules, module shells |
| 8 | Provisioning Engine | worker/src/routes/provision.ts, provisioning tables |
| 9 | Pricing & Billing | worker/src/routes/billing.ts, pricing tables, Stripe |
| 10 | Integrations | integrations_catalog, tenant_integrations, worker routes |
| 11 | AI Governance | ai_action_policies, ai_usage_logs, worker/src/routes/ai.ts |
| 12 | Founder OS | FounderPage.tsx, founder tables, control room API |
| 13 | Business Modules | HR/CRM/Accounting/Projects/Logistics/Store/Chat modules |
| 14 | Execution Mappings | Page→API→DB→Permission chains |
| 15 | Domain Events | domain_events table, event taxonomy, analytics |
| 16 | API Contracts | OpenAPI specs, error model, versioning |
| 17 | Operational Runbooks | Automated recovery, incident handling |
| 18 | Monitoring | Metrics, logs, alerts, dashboards |
| 19 | Scaling | Caching, rate limiting, backups |
| 20 | Deliverables | Generated docs and reports |
| 21 | Implementation Order | Sequence compliance |

**Decision**: Audit a specific section, a group of related sections, or all sections.

### Phase 2: Evidence Collection

For each section being audited, collect evidence from these locations:

#### Schema Audit
1. Read `supabase_schema.sql` — what tables/columns are defined
2. Read `supabase/migrations/` — what migrations exist
3. Read `supabase/migrations_unified/` — unified migration state
4. Compare against blueprint Section 6 (Unified Schema) + section-specific tables

#### API Audit
1. Read `worker/src/routes/` — what routes are implemented
2. Read `worker/src/index.ts` or main entry — what routes are registered
3. Compare against blueprint Section 14 (Execution Mappings) + Section 16 (API Contracts)

#### Frontend Audit
1. Read `src/App.tsx` — what routes/pages are registered
2. Read `src/pages/` — what pages exist and their content depth
3. Read `src/pages/modules/` — what module UIs exist
4. Compare against blueprint Section 2 (Product Surfaces) + Section 13 (Business Modules)

#### Mobile Audit
1. Read `mobile/lib/screens/` — what screens exist
2. Read `mobile/lib/services/` — what API connections exist
3. Compare against blueprint mobile surface requirements

#### Permission Audit
1. Read RLS files in `supabase/migrations/`
2. Read `src/constants/` for role/permission definitions
3. Read `worker/src/` for permission checks in routes
4. Compare against blueprint Section 5 (Security) + Permission Matrix

#### AI Audit
1. Read `worker/src/routes/ai.ts` — agent types, modes, policies
2. Read `src/services/geminiService.ts` — client-side AI integration
3. Read `src/services/rareKnowledgeBase.ts` — knowledge base
4. Compare against blueprint Section 11 (AI Governance)

### Phase 3: Gap Classification

For each blueprint item, classify as:

| Status | Symbol | Meaning |
|--------|--------|---------|
| **Complete** | ✅ | Exists in code, matches blueprint spec |
| **Partial** | 🟡 | Exists but incomplete or simplified |
| **Divergent** | ⚠️ | Exists but deviates from blueprint |
| **Missing** | ❌ | Not found in codebase |
| **N/A** | ➖ | Deferred (marked `later` or `future` in blueprint) |

### Phase 4: Report Generation

Produce a structured report with this format:

```markdown
# Blueprint Reconciliation Report — [Section Name]
**Date**: YYYY-MM-DD
**Section**: [number] — [title]
**Overall Status**: X% compliant

## Summary
- ✅ Complete: N items
- 🟡 Partial: N items  
- ⚠️ Divergent: N items
- ❌ Missing: N items

## Detail

### [Subsection]
| Blueprint Item | Status | Evidence | Gap Description | Priority |
|---------------|--------|----------|-----------------|----------|
| item_key | ✅/🟡/⚠️/❌ | file:line | what's missing | P0/P1/P2 |

## Implementation Queue (Priority Order)
1. [P0] Description — files to create/modify
2. [P0] Description — files to create/modify
...
```

### Phase 5: Action Planning

After the report, generate an implementation plan:
1. Group gaps by dependency (what must come first)
2. Respect blueprint Section 21 (Implementation Order)
3. Estimate scope: S (< 1 file), M (2-5 files), L (5+ files), XL (new subsystem)
4. Output as a checklist compatible with the existing TASKS_TODO.md.instructions.md

## Key Codebase Paths

```
WORKSPACE: c:\Users\Admin\OneDrive\Desktop\ZIEN\ZIEN APP\Zienapp-main\Zienapp-main

# Web Frontend
src/App.tsx                          # Main router
src/pages/                           # Page components
src/pages/modules/                   # Module UIs
src/components/                      # Shared components
src/constants/translations.ts        # i18n (1145 lines)
src/services/                        # API clients
src/contexts/                        # React contexts

# Worker API
worker/src/index.ts                  # Route registration
worker/src/routes/ai.ts              # AI routes (~600 lines)
worker/src/routes/auth.ts            # Auth routes
worker/src/routes/billing.ts         # Billing routes
worker/src/routes/provision.ts       # Provisioning routes
worker/src/routes/store.ts           # Store routes
worker/src/routes/accounting.ts      # Accounting routes
worker/src/supabase.ts               # DB helpers (admin client)

# Database
supabase_schema.sql                  # Schema definition
supabase/migrations/                 # Migration files
supabase/migrations_unified/         # Unified migrations

# Mobile
mobile/lib/screens/                  # Flutter screens
mobile/lib/services/                 # API services
mobile/lib/models/                   # Data models

# Docs
ROLE_PERMISSION_MATRIX.md
WORKER_API_CONTRACTS.md
RARE_AI_ARCHITECTURE.md
```

## Critical Project Facts

- **DB column**: `role_code` TEXT (not `role` enum) in production
- **Supabase**: rjrgylhcpnijkfstvcza.supabase.co
- **Worker**: https://api.plt.zien-ai.app (Cloudflare)
- **Git**: branch v1, push: `git push origin v1:main`
- **Founder email**: gm@zien-ai.app
- **RLS**: company_members has recursive policy issue (fix in 00018_fix_rls_recursion.sql)
- **Worker routes**: Use admin client to bypass RLS recursion
- **MCP Supabase**: Connected to WRONG project — DO NOT USE for queries

## Quality Checks

After any audit:
- [ ] Every blueprint table was checked against schema/migrations
- [ ] Every blueprint API endpoint was checked against worker routes
- [ ] Every blueprint permission was checked against RLS + code
- [ ] Every product surface was checked against pages/routes
- [ ] Divergences are flagged (code does X, blueprint says Y)
- [ ] Missing items have clear implementation steps
- [ ] Report follows the standard format above
