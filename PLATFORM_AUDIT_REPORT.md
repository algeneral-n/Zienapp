# ZIEN Platform - Detailed Audit Report
**Date:** 2026-02-27 | **Build:** 2997 modules, 0 errors, 0 warnings

---

## 1. Route Architecture (App.tsx - 142 lines)

```
ThemeProvider > AuthProvider > CompanyProvider > AppRoutes
```

| Route | Component | Access | Lazy |
|-------|-----------|--------|------|
| `/` | LandingPage | Public | Yes |
| `/login` | LoginPage | Public | Yes |
| `/register` | OnboardingWizard | Public | Yes |
| `/features` | FeaturesPage | Public | Yes |
| `/pricing` | PricingPage | Public | Yes |
| `/faq` | FAQPage | Public | Yes |
| `/contact` | ContactPage | Public | Yes |
| `/industries` | IndustriesPage | Public | Yes |
| `/academy` | AcademyPage | Public | Yes |
| `/help` | HelpCenterPage | Public | Yes |
| `/privacy`, `/terms` | LegalPage | Public | Yes |
| `/auth/callback` | AuthCallback | Public | Yes |
| `/portal` | EmployeePortal | ProtectedRoute | Yes |
| `/owner`, `/owner/*` | OwnerDashboard | ProtectedRoute (FOUNDER, PLATFORM_ADMIN) | Yes |
| `/dashboard`, `/dashboard/*` | Dashboard | ProtectedRoute | Yes |

**Dashboard Sub-Routes (13 modules):**

| Sub-route | Module | Lines | Data Source |
|-----------|--------|-------|-------------|
| `/dashboard/` | Overview | 182 | payments, company_members, logistics_tasks, projects |
| `/dashboard/hr/*` | HRModule | 271 | company_members, profiles, attendance, leave_requests, payroll |
| `/dashboard/accounting/*` | AccountingModule | 199 | invoices, payments, tax_settings, company settings |
| `/dashboard/logistics/*` | LogisticsModule | 216 | logistics_tasks, vehicles, attendance |
| `/dashboard/crm/*` | CRMModule | 154 | clients, quotes |
| `/dashboard/projects` | ProjectsModule | 175 | projects, project_tasks |
| `/dashboard/meetings` | MeetingsModule | 280 | chats, chat_messages, meetings (+ real-time subscription) |
| `/dashboard/store` | StoreModule | 62 | Static "unavailable" placeholder |
| `/dashboard/academy` | Academy | 74 | academy_courses |
| `/dashboard/rare` | RAREManagement | 388 | ai_usage_logs, company_ai_settings |
| `/dashboard/integrations` | IntegrationsModule | 174 | Static integration catalog |
| `/dashboard/help` | HelpCenter | 55 | Static FAQ content |
| `/dashboard/portal-builder` | PortalBuilder | 513 | Real Supabase (portal_pages, portal_components) |

---

## 2. Public Pages (Web)

### 2.1 LandingPage.tsx (487 lines) - Route: `/`
- **Sections:** Hero carousel (3 slides), Services grid, Demo modal, CTA, Footer
- **i18n:** Full AR/EN via `useTheme().t()` translation system
- **Theme:** Dark/light mode + variant support
- **Demo Modal:** Form (company name, employees, services, image upload) with **SIMULATED** provisioning steps via `setInterval` + `setTimeout`. Does NOT call real API. Outputs a random ID.
- **Status:** NEEDS FIX - Demo should call `/api/provision/start` or redirect to `/register`

### 2.2 LoginPage.tsx (439 lines) - Route: `/login`
- **Auth Methods:** Email/password, Phone OTP, Google OAuth, Apple OAuth, Slack OIDC
- **Features:** Turnstile CAPTCHA integration, password strength indicator, "Remember Me", forgot password flow
- **Supabase Integration:** Direct `supabase.auth.signInWithPassword()`, `signInWithOtp()`, `signInWithOAuth()`
- **Issue:** Creates its own user state separately from AuthContext. On success calls `onLogin()` which navigates to `/portal`
- **Status:** FUNCTIONAL but dual-state issue with AuthContext

### 2.3 PricingPage.tsx (202 lines) - Route: `/pricing`
- **Content:** 3 pricing tiers (Starter, Professional, Enterprise) with feature comparison
- **Data:** Static pricing tiers - acceptable (marketing content, not business data)
- **i18n:** AR/EN support
- **Status:** CLEAN

### 2.4 FeaturesPage.tsx (138 lines) - Route: `/features`
- **Content:** Feature cards grid with icons/descriptions for all platform modules
- **Data:** Static feature descriptions - acceptable
- **i18n:** AR/EN support
- **Status:** CLEAN

### 2.5 FAQPage.tsx (398 lines) - Route: `/faq`
- **Content:** Accordion FAQ sections (~20+ questions) organized by category
- **i18n:** AR/EN support
- **Data:** Static content - acceptable
- **Status:** CLEAN

### 2.6 ContactPage.tsx (163 lines) - Route: `/contact`
- **Content:** Contact form (name, email, subject, message) + office locations + support channels
- **Form Action:** `onSubmit` handler exists but **DOES NOT** send data anywhere (no API call, no supabase insert)
- **Status:** NEEDS FIX - Form is cosmetic only

### 2.7 AcademyPage.tsx (512 lines) - Route: `/academy`
- **Content:** Course catalog (12 courses), certification exams (5), certifications (5), progress tracking
- **Data:** ALL HARDCODED - courses, exams, certifications are inline constants
- **Status:** NEEDS FIX - Should either be truly static marketing content or fetch from academy_courses table

### 2.8 LegalPage.tsx (251 lines) - Route: `/privacy`, `/terms`
- **Content:** Privacy Policy + Terms of Service full text
- **Data:** Static legal content - acceptable
- **Status:** CLEAN

### 2.9 IndustriesPage.tsx (40 lines) - Route: `/industries`
- **Content:** Industry cards grid (retail, logistics, construction, etc.)
- **Data:** Static marketing - acceptable
- **Status:** CLEAN

### 2.10 HelpCenterPage.tsx (35 lines) - Route: `/help`
- **Content:** Help center landing with search + category links
- **Data:** Static - acceptable
- **Status:** CLEAN

---

## 3. Auth System

### 3.1 AuthContext.tsx (175 lines)
```
Provides: user, session, profile, isLoading, signIn, signInWithOtp, 
          signInWithOAuth, signUp, signOut
```
- **Session Management:** `supabase.auth.getSession()` on mount + `onAuthStateChange` listener
- **Profile Loading:** Auto-fetches from `profiles` table on auth state change
- **JWT:** Managed by Supabase SDK (auto-refresh)

### 3.2 AuthCallback.tsx (30 lines)
- Handles OAuth redirect (`/auth/callback`)
- Exchanges URL hash tokens for session via `supabase.auth.getSession()`
- Redirects to `/portal` on success, `/login` on failure

### 3.3 Worker Auth (auth.ts - 66 lines)
- `POST /api/auth/profile` - Get or create user profile
- `POST /api/auth/verify` - Verify JWT token
- Uses `requireAuth()` middleware that validates Supabase JWT

### 3.4 Auth Methods Summary

| Method | Web | Mobile | Worker |
|--------|-----|--------|--------|
| Email + Password | LoginPage + AuthContext | login_screen.dart | JWT verify |
| Phone OTP | LoginPage (`signInWithOtp`) | NOT IMPLEMENTED | - |
| Google OAuth | LoginPage (`signInWithOAuth`) | auth_providers.dart | - |
| Apple OAuth | LoginPage (`signInWithOAuth`) | auth_providers.dart | - |
| Slack OIDC | LoginPage (`signInWithOAuth`) | NOT IMPLEMENTED | - |
| Turnstile CAPTCHA | LoginPage (field verified) | N/A | - |
| Password Reset | LoginPage (`resetPasswordForEmail`) | NOT IMPLEMENTED | - |

### 3.5 Auth Flow Diagram
```
User hits /login
  |-> Email/Password -> supabase.auth.signInWithPassword() -> session set -> navigate /portal
  |-> Phone OTP -> supabase.auth.signInWithOtp() -> verify code -> session set -> navigate /portal
  |-> Google/Apple/Slack -> supabase.auth.signInWithOAuth() -> redirect to provider 
      -> callback to /auth/callback -> AuthCallback.tsx -> getSession() -> navigate /portal
  |-> /register -> OnboardingWizard -> create company + user -> provision -> navigate /portal
```

---

## 4. Main App Pages

### 4.1 EmployeePortal.tsx (708 lines) - Route: `/portal`
**Largest single page. 7 tabs, ALL with real Supabase data.**

| Tab | Tables Queried | Key Features |
|-----|---------------|--------------|
| Overview | attendance, leave_requests, projects | Clock In/Out (writes to attendance), stats cards |
| Attendance | attendance | Monthly calendar view, check-in/out times |
| Leave | leave_requests | Submit/view requests, approve/reject for managers |
| Payroll | payroll | Pay slips table by cycle |
| Projects | projects | Assigned project list with status |
| Documents | company_documents | Document list with download links |
| Settings | profiles | Profile edit form |

### 4.2 FounderPage.tsx (515 lines) - Route: `/owner`
**Platform admin dashboard for FOUNDER/PLATFORM_ADMIN roles.**

| Section | Tables Queried | What It Shows |
|---------|---------------|--------------|
| Company Stats | companies | Total companies, active count |
| Revenue | invoices | Total revenue with chart |
| Members | company_members | Total users across platform |
| AI Usage | ai_usage_logs | Token usage, query counts |
| Recent Activity | companies, invoices | Recent signups + invoices |
| Subscription Health | subscriptions | Plan distribution |

### 4.3 OwnerDashboard.tsx (8 lines) - Route: `/owner`
**Thin wrapper** that renders FounderPage. Just re-exports.

### 4.4 ClientPortal.tsx (254 lines) - Route: (sub-component)
**Client-facing portal with 5 sub-pages.**

| Sub-page | Status | Data Source |
|----------|--------|-------------|
| Projects | REAL DATA | projects |
| Invoices | REAL DATA | invoices, payments |
| Documents | PLACEHOLDER | Static "coming soon" |
| Meetings | PLACEHOLDER | Static "coming soon" |
| Support | PLACEHOLDER | Static "coming soon" |

### 4.5 OnboardingWizard.tsx (421 lines) - Route: `/register`
**Multi-step company registration wizard.**

| Step | What Happens |
|------|-------------|
| 1. Company Type | Select industry type (trading, services, restaurant, etc.) |
| 2. Company Info | Name, trade license, location, country |
| 3. Module Selection | Choose active modules for the company |
| 4. Team Invites | Optional: invite team members by email |
| 5. Confirmation | Review + trigger provisioning |

- **Creates:** `companies` row + `company_members` row (owner)
- **Calls:** Provisioning service or direct Supabase inserts
- **Status:** FUNCTIONAL

### 4.6 Dashboard.tsx (100 lines) - Route: `/dashboard/*`
**Module container with Sidebar + Header + Routed modules.**
- Sidebar navigation with role-based filtering (uses MODULE_ACCESS from permissions.ts)
- HeaderControls with search, notifications, profile link
- FloatingRARE AI assistant
- 13 lazy-loaded sub-modules (see Section 1 table above)

---

## 5. Multi-Tenant System

### 5.1 CompanyContext.tsx (303 lines)
```typescript
Provides: company, membership, companies, modules, departments,
          isLoading, switchCompany, role, hasModule
```

**How it works:**
1. On mount, queries `company_members` joined with `companies` where `user_id = current user`
2. Stores ALL companies the user belongs to (for company switcher)
3. Selects first company as default (or last used)
4. Loads `company_modules` + `departments` for selected company
5. `switchCompany(id)` re-fetches everything for the new company

### 5.2 Tenant Isolation

| Layer | Mechanism | Where |
|-------|-----------|-------|
| **Database** | `company_id` column on every business table | Supabase schema |
| **Frontend** | All queries filter by `company.id` from CompanyContext | Every module page |
| **Worker** | Validates `company_id` from JWT membership | All route handlers |
| **RLS** | Row Level Security policies on Supabase tables | Database policies |

**company_id filtering found in 50+ queries across:**
- All 13 dashboard modules
- EmployeePortal (7 tabs)
- FounderPage (cross-tenant for platform admins)
- ClientPortal
- OnboardingWizard

### 5.3 Module Gating
```typescript
// CompanyContext provides:
hasModule(moduleCode: string): boolean

// Sidebar checks MODULE_ACCESS from permissions.ts:
MODULE_ACCESS = {
  hr:           { read: 35, write: 60 },
  accounting:   { read: 45, write: 60 },
  logistics:    { read: 35, write: 60 },
  crm:          { read: 35, write: 60 },
  projects:     { read: 20, write: 45 },
  meetings:     { read: 20, write: 35 },
  store:        { read: 35, write: 60 },
  academy:      { read: 10, write: 60 },
  rare:         { read: 35, write: 85 },
  integrations: { read: 60, write: 85 },
  portal_builder: { read: 85, write: 95 },
  control_room: { read: 85, write: 95 },
  help:         { read: 10, write: 85 },
}
```

### 5.4 Role Hierarchy (20 roles, level 10-100)
```
founder: 100 | platform_admin: 95 | company_gm: 90 | assistant_gm: 80
director: 75 | department_manager: 70 | section_head: 65
executive_secretary: 60 | senior_supervisor: 58 | supervisor: 55
team_leader: 52 | hr_officer: 50 | accountant: 48
senior_employee: 45 | employee: 40 | sales_rep: 38
technician: 35 | driver: 30 | trainee: 20 | client_user: 10
```

---

## 6. Provisioning System

### 6.1 Worker Routes (provision.ts - 462 lines)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/provision/start` | POST | Kick off provisioning for a company |
| `/api/provision/status/:id` | GET | Check provisioning job status |
| `/api/provision/retry` | POST | Retry a failed job |
| `/api/provision/blueprints` | GET | List available blueprints |
| `/api/provision/estimate-price` | POST | Estimate dynamic pricing |

### 6.2 Provisioning Flow
```
POST /api/provision/start { companyId, blueprintId?, idempotencyKey? }
  |
  |-> Idempotency check (provisioning_jobs.idempotency_key)
  |-> Verify user is company owner (companies.owner_user_id)
  |-> Find blueprint (blueprints table, matched by company_type_id)
  |-> Count total steps (3 base + N seed packs)
  |-> Create provisioning_jobs row (status: 'pending')
  |-> Execute async (non-blocking):
        |
        |-> Step 1: VALIDATE - verify company exists
        |-> Step 2: APPLY MODULES - upsert company_modules from blueprint_modules
        |-> Step 3: SEED DATA - process blueprint_seed_packs:
        |     |-> kind: 'roles' -> create departments
        |     |-> kind: 'tax_config' -> insert tax_settings
        |     |-> (extensible for other seed pack types)
        |-> Step 4: FINALIZE - set company status = 'active'
        |
        |-> On failure: job.status = 'failed', error_message saved
```

### 6.3 Database Tables Used

| Table | Purpose |
|-------|---------|
| `provisioning_jobs` | Job tracking (status, steps, errors, idempotency) |
| `blueprints` | Industry templates (linked to company_type_id) |
| `blueprint_modules` | Which modules a blueprint activates |
| `blueprint_seed_packs` | Seed data packs with apply_order |
| `seed_packs` | Actual seed data (kind + payload_json) |
| `companies` | Target company (status: pending_review -> active) |
| `company_modules` | Activated modules per company |
| `departments` | Seeded departments |
| `tax_settings` | Seeded tax configuration |

### 6.4 Features
- **Idempotency:** Duplicate requests return existing job
- **Retry:** Failed/rolled-back jobs can be retried by owner/requester
- **Progress Tracking:** step_index/total_steps updated in real-time
- **Blueprints:** Industry-specific templates with dynamic module + seed pack selection
- **Price Estimation:** Dynamic pricing based on module count + complexity

### 6.5 Frontend Provisioning Service (provisioningService.ts - 187 lines)
- TypeScript client for all provision endpoints
- Progress polling via `pollProvisioningStatus()`
- Error handling + retry logic

---

## 7. Mobile App (Flutter)

### 7.1 Main App (mobile/lib/ - 15 files, ~2,855 total lines)

| File | Lines | Purpose |
|------|-------|---------|
| `main.dart` | 63 | App bootstrap, Supabase init, Riverpod scope |
| `auth/auth_gate.dart` | 25 | Auth state gate (login vs home) |
| `config/app_config.dart` | 22 | Supabase URL + anon key |
| `config/router.dart` | 55 | GoRouter with auth redirect |
| `models/company.dart` | 187 | Company model with fromJson |
| `models/enums.dart` | 216 | CompanyRole, PlatformRole, ModuleCode enums |
| `models/module.dart` | 88 | Module model |
| `models/profile.dart` | 62 | Profile model |
| `models/models.dart` | 7 | Barrel export |
| `screens/home_screen.dart` | 1,326 | Main dashboard (StatusWall, RARE AI tab, modules) |
| `screens/login_screen.dart` | 273 | Email/password + Google/Apple OAuth |
| `services/api_client.dart` | 126 | HTTP client with JWT + extraHeaders |
| `services/auth_providers.dart` | 87 | Auth state Riverpod providers |
| `services/company_providers.dart` | 222 | Company/membership/module Riverpod providers |
| `theme/app_theme.dart` | 96 | Material theme configuration |

### 7.2 Mobile Auth

| Method | Status |
|--------|--------|
| Email + Password | IMPLEMENTED (login_screen.dart) |
| Google OAuth | IMPLEMENTED (auth_providers.dart) |
| Apple OAuth | IMPLEMENTED (auth_providers.dart) |
| Phone OTP | NOT IMPLEMENTED |
| Slack OIDC | NOT IMPLEMENTED |
| Password Reset | NOT IMPLEMENTED |

### 7.3 Mobile vs Web Parity

| Feature | Web | Mobile |
|---------|-----|--------|
| Landing Page | 487 lines, full marketing site | N/A (app store) |
| Login | 5 auth methods + CAPTCHA | 3 auth methods |
| Employee Portal (7 tabs) | 708 lines, full data | NOT IMPLEMENTED |
| Dashboard + 13 modules | Full implementation | home_screen.dart (1,326L) - overview only |
| RARE AI | FloatingRARE + RAREManagement (388L) | AI tab in home_screen (24 agents, 3 modes) |
| Onboarding Wizard | 421 lines, 5 steps | NOT IMPLEMENTED |
| Company Switcher | CompanyContext.switchCompany() | company_providers.dart - provider exists |
| Real-time Chat | MeetingsModule with postgres_changes | NOT IMPLEMENTED |
| Clock In/Out | EmployeePortal writes to attendance | NOT IMPLEMENTED |
| Client Portal | 254 lines, 5 sub-pages | NOT IMPLEMENTED |
| Founder Dashboard | 515 lines, 6 sections | NOT IMPLEMENTED |
| Notifications | Bell icon in header | NOT IMPLEMENTED |

### 7.4 Provisioning App (separate project)
Located at: `users_XYeu6G9EUWSdjR8H9TZq4tgO7xq2_45946f67-*/`

| File | Lines | Purpose |
|------|-------|---------|
| `screens/home_screen.dart` | 260 | Dashboard with tenant list |
| `screens/onboarding_screen.dart` | 1,302 | Full multi-step onboarding wizard |
| `screens/provisioning_status_screen.dart` | 369 | Real-time job status tracking |
| `screens/tenant_dashboard_screen.dart` | 193 | Individual tenant management |
| `services/provisioning_service.dart` | 420 | Full provisioning API client |
| `services/blueprint_service.dart` | 191 | Blueprint fetching |
| `services/module_service.dart` | 183 | Module management |
| `services/tenant_type_service.dart` | 110 | Tenant type catalog |
| `models/` (8 files) | ~534 | Full data models |
| `widgets/` (2 files) | 162 | ModuleCard, StepIndicator |

**This provisioning app is COMPREHENSIVE** - 4 screens, 4 services, 8 models, 2 widgets. Total ~3,824 lines.

---

## 8. Worker API Summary

| Route File | Lines | Endpoints | Key Tables |
|------------|-------|-----------|-----------|
| `health.ts` | 11 | 1 | - |
| `auth.ts` | 66 | 2 | profiles |
| `ai.ts` | 615 | 8+ | ai_usage_logs, company_members |
| `billing.ts` | 633 | 6+ | invoices, payments, subscriptions |
| `provision.ts` | 462 | 5 | provisioning_jobs, blueprints, seed_packs |
| `accounting.ts` | 617 | 10+ | journal_entries, chart_of_accounts, invoices, tax_settings |
| `integrations.ts` | 352 | 4+ | integration_configs |
| `controlRoom.ts` | 124 | 2 | companies, company_members |
| `StripeEngine.ts` | 65 | - | Stripe API wrapper |
| **TOTAL** | **2,945** | **38+** | |

---

## 9. Critical Gaps & Action Items

### HIGH PRIORITY

| # | Issue | File | Fix Required |
|---|-------|------|-------------|
| 1 | LandingPage demo is fake simulation | LandingPage.tsx:81-97 | Replace setTimeout with real `/api/provision/start` call or redirect to `/register` |
| 2 | ContactPage form sends nowhere | ContactPage.tsx | Add supabase insert to `contact_submissions` table or worker endpoint |
| 3 | AcademyPage has 12 hardcoded courses | AcademyPage.tsx | Fetch from `academy_courses` table (same pattern as module Academy.tsx) |
| 4 | ClientPortal 3 placeholder sub-pages | ClientPortal.tsx | Implement Documents, Meetings, Support sub-pages with real data |
| 5 | Mobile missing Employee Portal | mobile/ | Build employee_portal_screen.dart with 7 tabs |
| 6 | Mobile missing Phone OTP auth | login_screen.dart | Add OTP flow matching web |
| 7 | Mobile missing Clock In/Out | mobile/ | Build attendance screen writing to attendance table |

### MEDIUM PRIORITY

| # | Issue | File | Fix Required |
|---|-------|------|-------------|
| 8 | LoginPage dual auth state | LoginPage.tsx | Should use AuthContext instead of local state |
| 9 | Mobile missing onboarding | mobile/ | Build onboarding wizard (provisioning app exists separately) |
| 10 | Mobile missing real-time chat | mobile/ | Build chat screen with Supabase realtime |
| 11 | Provisioning app is separate project | users_*_project/ | Merge into main mobile app or keep as admin-only app |
| 12 | No push notifications (mobile) | mobile/ | Integrate FCM/APNs |

### LOW PRIORITY (Static Content - Acceptable)

| Item | Reason |
|------|--------|
| PricingPage static tiers | Marketing content |
| FeaturesPage static cards | Marketing content |
| LegalPage static text | Legal boilerplate |
| IndustriesPage static grid | Marketing content |
| IntegrationsModule static catalog | Integration directory |
| HelpCenter static FAQ | Support content |
| StoreModule "unavailable" | Honest state when unconfigured |

---

## 10. Code Size Summary

| Layer | Files | Total Lines |
|-------|-------|-------------|
| Public Pages (web) | 9 | ~2,228 |
| Auth System (web) | 3 (LoginPage + AuthCallback + AuthContext) | ~644 |
| Main App Pages (web) | 5 (Dashboard, Employee, Founder, Client, Onboarding) | ~1,998 |
| Dashboard Modules (web) | 13 | ~2,743 |
| Contexts (web) | 3 | ~480 |
| Services (web) | 4 | ~328 |
| Worker Routes | 10 | ~2,945 |
| Mobile Main App | 15 | ~2,855 |
| Mobile Provisioning App | 18 | ~3,824 |
| **TOTAL** | **80** | **~18,045** |

---

*Report generated by automated audit. Verified against latest build (2997 modules, 0 errors).*
