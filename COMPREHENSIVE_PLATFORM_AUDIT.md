# ZIEN Platform -- Comprehensive Deep Audit Report
**Date:** 2026-02-27
**Workspace:** `Zienapp-main/Zienapp-main/`

---

## AREA 1: PUBLIC PAGES (Web)

### 1.1 Landing Page
| File | Lines | Location |
|------|-------|----------|
| `src/pages/LandingPage.tsx` | 462 | Root pages folder |

- **Renders:** Hero section with 3-slide auto-rotating carousel, features grid (6 cards: Accounting, CRM/Sales, HR, Logistics, RARE AI, Security), footer with nav links.
- **Demo Modal:** Fully interactive -- collects company name, employee count, services (Accounting/HR/CRM/Logistics/AI Assistant), file upload. Simulates a 5-step provisioning sequence client-side (`setInterval`), does NOT call any real API.
- **Data Source:** All STATIC content via `useTheme()` translation keys and inline text. No Supabase calls.
- **Languages:** 15 languages supported in UI selector (ar, en, fr, es, de, tr, ru, zh, ja, ko, hi, ur, it, pt, nl).
- **Key Components:** `ThemeProvider`, `ASSETS` constants, `motion/react` (Framer Motion).
- **Issues:** Demo modal is purely cosmetic -- generates a random ID and shows a fake "Demo Created" screen. Copyright reads "2024".

### 1.2 Public Pages in `src/pages/public/`

| File | Lines | Data Source | Key Content |
|------|-------|-------------|-------------|
| `PricingPage.tsx` | 202 | **REAL Supabase** (`subscription_plans`, `pricing_addons`) + FALLBACK static | 3 plans: Starter (99 AED/mo), Business (299 AED/mo), Enterprise (799 AED/mo). Monthly/yearly toggle. Addons section. Falls back to hardcoded `FALLBACK_PLANS` if DB empty. |
| `FeaturesPage.tsx` | 138 | STATIC | 5 main features + 3 secondary features with external Google image URLs. Feature list items are generic ("Advanced modular integration" repeated 3x). |
| `ContactPage.tsx` | 163 | STATIC | WhatsApp (+971 50 123 4567 -- placeholder?), Phone (+971 4 234 5678), Email (support@zien-ai.app), Office (Business Bay, Innovation Tower, 12th Floor, Dubai). Contact form does `setSent(true)` with 3s timeout -- form is NOT submitted anywhere. |
| `FAQPage.tsx` | 398 | STATIC | 6 categories (getting-started, billing, security, modules, ai, technical). ~15+ Q&A pairs. All bilingual (AR/EN). Has search filter, category tabs, "Submit Question" form that also does NOT submit. |
| `LegalPage.tsx` | 251 | STATIC | 6 tabs: Terms of Service, Privacy Policy, Acceptable Use, Data Retention, Refund Policy, Security & Compliance. All content is static bilingual text. |
| `IndustriesPage.tsx` | 40 | STATIC | Lists 10 industries: General Trading, Professional Services, Construction, Food & Beverage, Healthcare, Education, Technology, Logistics, Real Estate, Manufacturing. No links or detail pages. |
| `AcademyPage.tsx` | 512 | STATIC | 4 tabs: Courses (12 courses), Tests (5 exams), Certificates (5 certs), Case Studies. All data is hardcoded in-file arrays (`COURSES`, `TESTS`, `CERTIFICATES`). Students/ratings are fake numbers. No actual learning system. |
| `HelpCenterPage.tsx` | 35 | STATIC | Simple 2x3 grid with 6 help categories (Getting Started, User Management, Billing, Modules, AI, Contact). Cards are non-functional (no navigation). |
| `LoginPage.tsx` | 439 | **REAL Supabase Auth** | Full auth page -- see Area 2 below. |

### 1.3 Public Pages -- Key Findings
- **PricingPage is the only public page that fetches real data** from Supabase.
- ContactPage form and FAQPage "Submit Question" form are cosmetic -- no backend submission.
- AcademyPage has impressive content (12 courses, 5 exams, 5 certs) but all fake static data.
- FeaturesPage uses external Google Photos URLs for images (could break).
- HelpCenterPage is minimal (35 lines) with no functional links.

---

## AREA 2: LOGIN/AUTH SYSTEM (Web)

### 2.1 Login Page (`src/pages/public/LoginPage.tsx` -- 439 lines)

**Auth Methods Supported:**
| Method | Implementation |
|--------|---------------|
| Email + Password | `supabase.auth.signInWithPassword()` with captcha token |
| Google OAuth | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Apple OAuth | `supabase.auth.signInWithOAuth({ provider: 'apple' })` |
| Phone OTP | `supabase.auth.signInWithOtp({ phone })` then `verifyOtp()` |
| Password Reset | `supabase.auth.resetPasswordForEmail()` |
| Register | Redirects to `/onboarding` |

- **Turnstile CAPTCHA:** Integrated via `react-turnstile` component. Site key from `VITE_TURNSTILE_SITE_KEY`.
- **Auth Views:** 6 views: `login`, `forgot`, `register`, `set-password`, `phone-login`, `otp-verify`.
- **On Login:** Calls `onLogin()` prop with user object `{id, email, name, role}`.

### 2.2 Auth Callback (`src/pages/auth/AuthCallback.tsx` -- 34 lines)
- Handles OAuth redirect at `/auth/callback`.
- Calls `supabase.auth.getSession()` then redirects to `/portal` (success) or `/login` (failure).

### 2.3 AuthContext (`src/contexts/AuthContext.tsx` -- 162 lines)

**State:** `session`, `user`, `profile`, `isLoading`

**Methods Exposed:**
| Method | Description |
|--------|-------------|
| `signInWithEmail(email, password)` | Email/password login |
| `signInWithOtp(phone)` | Send OTP to phone |
| `verifyOtp(phone, token)` | Verify SMS OTP |
| `signInWithProvider(provider)` | OAuth (google, apple, slack_oidc) |
| `signUp(email, password, metadata)` | New user registration |
| `signOut()` | Logout |
| `refreshProfile()` | Re-fetch profile from `profiles` table |

- **Profile Loading:** Fetches from `public.profiles` table by user ID on every auth state change.
- **Session Management:** Uses Supabase's built-in `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: true`.
- **Auth Guard:** `useRequireAuth()` hook redirects to `/login` if no user.

### 2.4 Supabase Client (`src/services/supabase.ts` -- 19 lines)
- Creates a single `SupabaseClient` instance with env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Throws error if env vars are missing.
- Auth config: `autoRefreshToken`, `persistSession`, `detectSessionInUrl` all true.

### 2.5 Worker Auth Routes (`worker/src/routes/auth.ts` -- 63 lines)

| Route | Method | Auth Required | Description |
|-------|--------|---------------|-------------|
| `/api/auth/verify-turnstile` | POST | No | Verifies Cloudflare Turnstile token server-side |
| `/api/auth/me` | GET | Yes | Returns user profile + company memberships |

### 2.6 Worker Auth Infrastructure (`worker/src/supabase.ts` -- 48 lines)
- `createUserClient(env, authHeader)` -- Creates Supabase client scoped to user's JWT (RLS-respecting).
- `createAdminClient(env)` -- Creates admin client with `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS).
- `requireAuth(request, env)` -- Validates Bearer token, returns `{userId, email, supabase}`.

### 2.7 Auth Findings
- **Strong:** 5 auth methods (email, phone OTP, Google, Apple, Slack OIDC). Turnstile CAPTCHA protection. JWT-based session with auto-refresh.
- **Issue:** `LoginPage.tsx` has a separate `onLogin` callback pattern that creates a minimal user object `{id, email, name, role}` independently of `AuthContext`. This creates a dual auth state -- `LoginPage` passes user up to `App`, while `AuthContext` manages its own state.
- **Missing:** No 2FA/MFA beyond the OTP phone login. No rate limiting on login attempts (client-side).

---

## AREA 3: MAIN APP PAGES (Web)

### 3.1 Dashboard (`src/pages/Dashboard.tsx` -- 91 lines)
- **Layout:** Sidebar + main content area with top bar (search, notifications, user profile link).
- **Uses:** `useAuth()` for user/profile, `useCompany()` for active company and role.
- **Sub-routes (react-router-dom):**

| Route | Component | Lines |
|-------|-----------|-------|
| `/dashboard/` | Overview | 182 |
| `/dashboard/hr/*` | HRModule | 271 |
| `/dashboard/accounting/*` | AccountingModule | 199 |
| `/dashboard/logistics/*` | LogisticsModule | 216 |
| `/dashboard/crm/*` | CRMModule | 154 |
| `/dashboard/academy` | Academy | 74 |
| `/dashboard/help` | HelpCenter | 55 |
| `/dashboard/rare` | RAREManagement | 388 |
| `/dashboard/store` | StoreModule | 62 |
| `/dashboard/projects` | ProjectsModule | 175 |
| `/dashboard/meetings` | MeetingsModule | 280 |
| `/dashboard/integrations` | IntegrationsModule | 174 |
| `/dashboard/portal-builder` | PortalBuilder | 513 |

- All modules lazy-loaded via `React.lazy()`.
- **Includes:** `FloatingRARE` component (AI chat bubble).

### 3.2 OwnerDashboard (`src/pages/OwnerDashboard.tsx` -- 8 lines)
- Thin wrapper that renders `<FounderPage />`.

### 3.3 FounderPage (`src/pages/FounderPage.tsx` -- 515 lines)
Platform control center for FOUNDER/PLATFORM_ADMIN roles.

**Sub-sections (react-router-dom):**
| Route | Component | Data Source |
|-------|-----------|-------------|
| `/owner/` | TenantManagement | **REAL** -- `companies` table + `company_subscriptions` |
| `/owner/revenue` | RevenueAnalytics | **REAL** -- `company_subscriptions` + `invoices` tables |
| `/owner/ai` | AIBuilder | **REAL** -- Worker `/api/ai/agents` endpoint |
| `/owner/marketing` | MarketingSystem | UNAVAILABLE -- shows placeholder |
| `/owner/health` | PlatformHealth | **REAL** -- Worker `/api/health` + `profiles` + `companies` counts |
| `/owner/security` | SecurityDashboard | **REAL** -- Worker `/api/ai/usage` + `ai_usage_logs` table |

- Sidebar with nav links. Uses `founderFetch()` helper that adds JWT + `X-Company-Id` headers.
- **All sections use real Supabase data** except Marketing (shows "Data source not available yet").

### 3.4 EmployeePortal (`src/pages/EmployeePortal.tsx` -- 708 lines)
Main portal for regular company users.

**Tabs:**
| Tab | Data Source | Supabase Tables |
|-----|-------------|-----------------|
| Dashboard | **REAL** | `attendance`, `leave_requests`, `payroll`, `projects` |
| Accounting | **REAL** | `invoices`, `payments`, `tax_settings` |
| HR | **REAL** | `employees`, `attendance`, `leave_requests`, `company_documents` |
| Sales | Uses CRM | `crm_contacts`, `crm_deals` |
| Logistics | **REAL** | `vehicles`, `logistics_tasks` |
| Chat | **REAL** (real-time) | `chats` table with Supabase Realtime subscription |
| Payroll | **REAL** | Separate `PayrollPage.tsx` (317 lines) |

- **Clock In/Out:** Real implementation writing to `attendance` table.
- **RARE AI Assistant:** Integrated -- selects agent type based on active tab, calls `generateRAREAnalysis()` which routes to Worker `/api/ai/rare`.
- **All data queries filter by `company_id`** from `useCompany()` context.

### 3.5 ClientPortal (`src/pages/ClientPortal.tsx` -- 254 lines)
External client-facing portal.
- **Overview:** Shows invoice stats (total, pending, overdue) from `invoices` table filtered by `company_id`.
- **Sub-routes:** Overview, Quotes (placeholder), Contracts (placeholder), Invoices (**REAL**), Support (placeholder).
- **3 of 5 sub-pages are placeholders** showing "Coming soon".

### 3.6 OnboardingWizard (`src/pages/OnboardingWizard.tsx` -- 421 lines)
6-step registration flow:
1. **Company Info** -- name, trade license number, country, city
2. **GM Details** -- name, email, password
3. **Terms & Policies** -- checkbox agreement
4. **Industry & Modules** -- 5 industries (Supermarket, Industrial, Engineering, Trading, Commercial)
5. **Upload Docs** -- business license + responsible person ID (file upload)
6. **Billing** -- plan selection

- **On completion:** Calls `provisioningService.provisionTenant()` which creates company in Supabase then calls Worker `/api/provision/start`.
- Each step has validation.
- Shows provisioning progress animation on success.

### 3.7 Modules Summary

| Module | Lines | Data Source | Key Tables |
|--------|-------|-------------|------------|
| Overview | 182 | **REAL** | `company_members`, `projects`, `logistics_tasks`, `invoices` |
| HRModule | 271 | **REAL** | `employees`, `attendance`, `leave_requests`, `payroll`, `company_members` |
| AccountingModule | 199 | **REAL** | `invoices`, `tax_settings` |
| CRMModule | 154 | **REAL** | (CRM tables) filtered by `company_id` |
| LogisticsModule | 216 | **REAL** | `vehicles`, `logistics_tasks` filtered by `company_id` |
| ProjectsModule | 175 | **REAL** | `projects` filtered by `company_id` |
| MeetingsModule | 280 | **REAL** | meetings data filtered by `company_id` |
| RAREManagement | 388 | **REAL** | `ai_usage_logs`, `company_ai_settings` filtered by `company_id` |
| IntegrationsModule | 174 | Unknown | |
| PortalBuilder | 513 | **REAL** | Portal config with `company_id` |
| StoreModule | 62 | Minimal | Likely placeholder |
| Academy | 74 | STATIC | In-app academy content |
| HelpCenter | 55 | STATIC | Help content |

### 3.8 Employee Sub-pages

| File | Lines | Description |
|------|-------|-------------|
| `employee/PayrollPage.tsx` | 317 | Payroll management with real Supabase data |

---

## AREA 4: MULTI-TENANT SYSTEM

### 4.1 CompanyContext (`src/contexts/CompanyContext.tsx` -- 304 lines)

**State Managed:**
- `company` -- currently selected Company object
- `membership` -- current user's CompanyMember record
- `companies` -- all companies the user belongs to
- `modules` -- active modules for selected company (from `company_modules` joined with `modules_catalog`)
- `departments` -- departments in selected company
- `role` -- convenience accessor for membership role
- `isLoading`

**How It Works:**
1. On user login, queries `company_members` table joined with `companies` for all active memberships.
2. If no memberships found, falls back to checking `companies.owner_user_id` (owner without membership record).
3. Restores last active company from `localStorage` key `zien:activeCompanyId`.
4. Picks primary membership or first company as default.
5. Loads modules from `company_modules` + `modules_catalog` and departments.

**Company Switching:**
- `switchCompany(companyId)` -- updates active company, re-queries membership, modules, and departments.
- Persists selection in localStorage.

**Module Check:**
- `hasModule(moduleCode)` -- checks if a module code is in the active modules list.

### 4.2 company_id Filtering Pattern
**Every data query in every module consistently filters by `company_id`:**
- `supabase.from('table').select('*').eq('company_id', companyId)` pattern found in:
  - EmployeePortal.tsx (20+ queries)
  - All module pages (Overview, HR, Accounting, CRM, Logistics, Projects, Meetings, RARE, PortalBuilder)
  - ClientPortal.tsx
  - FounderPage.tsx (TenantManagement queries all companies -- appropriate for founder role)

### 4.3 Tenant Isolation

| Layer | Implementation |
|-------|---------------|
| Database (RLS) | Mentioned in FAQ/Legal pages. Supabase RLS policies expected on all tables with `company_id`. |
| Application Layer | All queries explicitly filter `.eq('company_id', companyId)` |
| Worker API | Auth middleware (`requireAuth`) validates JWT. AI routes verify company membership before processing. |
| Client Storage | Active company ID stored in `localStorage` (key: `zien:activeCompanyId`) |

### 4.4 Module Enable/Disable Per Company
- Modules stored in `company_modules` table (columns: `company_id`, `module_id`, `is_active`, `config`).
- Joined with `modules_catalog` table to get module `code`.
- `hasModule(moduleCode)` function available via `useCompany()` hook.
- During provisioning, modules are activated based on blueprint configuration.

---

## AREA 5: PROVISIONING SYSTEM

### 5.1 Client-Side (`src/services/provisioningService.ts` -- 170 lines)

**`provisionTenant(config)` Flow:**
1. Get current authenticated user.
2. Insert company record into `companies` table (status: `provisioning`).
3. Insert `company_users` link (role: `company_gm`).
4. POST to Worker `/api/provision/start` with `companyId` and `idempotencyKey`.
5. If Worker is unavailable, falls back to `fallbackProvisioning()` which creates a provisioning job directly in Supabase and marks company as `active`.

**`getStatus(jobId)`:** Polls Worker `/api/provision/status/:id` or falls back to querying `provisioning_jobs` table directly.

### 5.2 Worker-Side (`worker/src/routes/provision.ts` -- 463 lines)

**Routes:**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/provision/start` | POST | Start provisioning for a company |
| `/api/provision/status/:id` | GET | Check provisioning job status |
| `/api/provision/retry` | POST | Retry a failed job |
| `/api/provision/blueprints` | GET | List available blueprints |
| `/api/provision/estimate-price` | POST | Dynamic price estimation |

**`startProvisioning` Flow:**
1. Validate `companyId` in request body.
2. Idempotency check via `idempotency_key` on `provisioning_jobs` table.
3. Verify user is company owner (`owner_user_id`).
4. Find blueprint based on `company_type_id` (from `blueprints` table).
5. Calculate total steps (3 base + seed packs count).
6. Create `provisioning_jobs` record (status: `pending`).
7. Execute provisioning asynchronously (non-blocking).

**`executeProvisioning` Steps:**
| Step | Status | Action |
|------|--------|--------|
| 1 | `validating` | Validate company exists |
| 2 | `applying_modules` | Apply blueprint modules -- upserts into `company_modules` |
| 3 | `seeding` | Apply seed packs (roles/departments, tax configs) |
| 4 | `completed` | Mark job done, set company status to `active` |

**Blueprint System:**
- `blueprints` table with `company_type_id`, `is_active`, `name`, `version`.
- `blueprint_modules` -- maps blueprints to modules with `default_config_json`.
- `blueprint_seed_packs` -- ordered seed data (departments, tax settings, etc.).

**Tables populated on provision:**
- `companies` (updated status to `active`)
- `company_modules` (from blueprint)
- `departments` (from seed packs of kind `roles`)
- `tax_settings` (from seed packs of kind `tax_config`)
- `provisioning_jobs` (tracking record)

**Dynamic Pricing (`estimate-price`):**
- Auto-recommends plan based on employee count: <=5 = Starter (99 AED), 6-25 = Business (299 AED), 25+ = Enterprise (799 AED).
- Calculates module add-on costs from `pricing_addons` table.
- Calculates seat overage costs.
- Returns full breakdown including AI usage allocation.

**Retry System:** Failed/rolled-back jobs can be retried by the original requester or company owner.

---

## AREA 6: MOBILE APP (Flutter)

**Location:** `mobile/lib/`

### 6.1 File Structure

**Screens:**
| File | Lines | Description |
|------|-------|-------------|
| `screens/login_screen.dart` | 274 | Full login screen |
| `screens/home_screen.dart` | 1,327 | Main app with 4-tab shell |

**Auth:**
| File | Lines | Description |
|------|-------|-------------|
| `auth/auth_gate.dart` | 28 | StreamBuilder on Supabase auth state |

**Services:**
| File | Lines | Description |
|------|-------|-------------|
| `services/api_client.dart` | 127 | HTTP client with JWT auth headers, calls Worker API |
| `services/auth_providers.dart` | 92 | Riverpod providers for auth state (session, user, profile, isAuthenticated) |
| `services/company_providers.dart` | 223 | Riverpod state management for companies, memberships, modules, departments |

**Config:**
| File | Lines | Description |
|------|-------|-------------|
| `config/app_config.dart` | 28 | Supabase URL, anon key, API URL, Apple bundle/team IDs |
| `config/router.dart` | 58 | GoRouter with auth redirect |

**Models:**
| File | Description |
|------|-------------|
| `models/company.dart` (188 lines) | Company, CompanyMember, Department models |
| `models/enums.dart` | CompanyStatus, CompanyRole enums |
| `models/models.dart` | Shared model exports |
| `models/module.dart` | CompanyModule model |
| `models/profile.dart` | User Profile model |

**Theme:**
| File | Description |
|------|-------------|
| `theme/app_theme.dart` | Light/dark Material theme |

**Widgets:** `widgets/` folder is **EMPTY**.

### 6.2 Mobile Auth Flow
| Method | Implementation |
|--------|---------------|
| Email + Password | `Supabase.instance.client.auth.signInWithPassword()` |
| Google OAuth | `signInWithOAuth(OAuthProvider.google)` with `com.zien.app://login-callback` redirect |
| Apple OAuth | `signInWithOAuth(OAuthProvider.apple)` with same redirect |
| Password Reset | `resetPasswordForEmail(email)` |

- No Phone OTP login (unlike web).
- No Turnstile CAPTCHA (mobile doesn't need it).
- GoRouter handles auth redirect -- unauthenticated users are forced to `/login`.

### 6.3 Mobile Navigation

**Router (`config/router.dart`):**
| Path | Screen |
|------|--------|
| `/login` | LoginScreen |
| `/` (home) | HomeScreen (4-tab shell) |

**HomeScreen Tabs (bottom navigation):**
| Tab | Content |
|-----|---------|
| Dashboard | Status Wall, financials overview, AI usage -- calls Worker `/api/control-room/overview` |
| Modules | Module grid (HR, Accounting, CRM, Logistics, Projects, Meetings, Store, Documents) |
| RARE AI | AI chat interface with agent type selection |
| Settings | Profile, company info, language, theme, sign out |

### 6.4 Mobile vs Web Feature Parity

| Feature | Web | Mobile |
|---------|-----|--------|
| Email/Password Login | Yes | Yes |
| Google OAuth | Yes | Yes |
| Apple OAuth | Yes | Yes |
| Phone OTP | Yes | **No** |
| Slack OIDC | Yes (in AuthContext) | No |
| Multi-company switching | Yes | Yes |
| Dashboard overview | Yes | Yes (via API) |
| Module pages (HR, Accounting, etc.) | Full pages | Tab with grid links |
| RARE AI Chat | Yes | Yes |
| Onboarding Wizard | Full 6-step wizard | **No** |
| Client Portal | Yes | **No** |
| Founder Page | Yes | **No** |
| Portal Builder | Yes | **No** |
| Real-time Chat | Yes (Supabase Realtime) | **No** |
| Clock In/Out | Yes | **No** |

### 6.5 Mobile Key Config
- Supabase URL: `rjrgylhcpnijkfstvcza.supabase.co`
- API URL: `https://api.plt.zien-ai.app`
- Apple Bundle ID: `com.zien.app`
- Apple Team ID: `BN4DXG557F`
- **Note:** Anon key is hardcoded as default value in `app_config.dart` -- production should use `--dart-define`.

---

## AREA 7: ROUTER CONFIGURATION

### 7.1 Main App Router (`src/App.tsx` -- 120 lines)

**Architecture:** Custom hash-based router using `window.location.pathname` + `popstate` events. NOT using react-router-dom at the top level (react-router-dom is used inside Dashboard and FounderPage for nested routes).

**Provider Hierarchy:**
```
<ThemeProvider>
  <AuthProvider>
    <CompanyProvider>
      <AppRoutes />
    </CompanyProvider>
  </AuthProvider>
</ThemeProvider>
```

### 7.2 Complete Route Map

| Path | Component | Access | Notes |
|------|-----------|--------|-------|
| `/` | LandingPage | PUBLIC | Default route |
| `/features` | FeaturesPage | PUBLIC | |
| `/pricing` | PricingPage | PUBLIC | |
| `/faq` | FAQPage | PUBLIC | |
| `/contact` | ContactPage | PUBLIC | |
| `/industries` | IndustriesPage | PUBLIC | |
| `/academy` | AcademyPage | PUBLIC | |
| `/help` | HelpCenterPage | PUBLIC | |
| `/privacy` | LegalPage | PUBLIC | |
| `/terms` | LegalPage | PUBLIC | Same component as /privacy |
| `/login` | LoginPage | PUBLIC | |
| `/auth/callback` | AuthCallback | PUBLIC | OAuth redirect handler |
| `/register` | OnboardingWizard | PUBLIC | Registration flow |
| `/portal` | EmployeePortal | **PROTECTED** | Requires any authenticated user |
| `/dashboard` | Dashboard | **PROTECTED** | Requires any authenticated user |
| `/dashboard/*` | Dashboard sub-routes | **PROTECTED** | HR, Accounting, CRM, etc. |
| `/owner` | OwnerDashboard (FounderPage) | **PROTECTED** | Requires `FOUNDER` or `PLATFORM_ADMIN` platform role |
| `/owner/*` | FounderPage sub-routes | **PROTECTED** | Tenants, Revenue, AI, Health, Security |

### 7.3 Protected Route Implementation
`ProtectedRoute` component wraps protected pages. Accepts optional `platformRoles` and `companyRoles` arrays for role-based access control.

### 7.4 Dashboard Nested Routes (react-router-dom)

| Sub-path | Component |
|----------|-----------|
| `/dashboard/` | Overview |
| `/dashboard/hr/*` | HRModule |
| `/dashboard/accounting/*` | AccountingModule |
| `/dashboard/logistics/*` | LogisticsModule |
| `/dashboard/crm/*` | CRMModule |
| `/dashboard/academy` | Academy |
| `/dashboard/help` | HelpCenter |
| `/dashboard/rare` | RAREManagement |
| `/dashboard/store` | StoreModule |
| `/dashboard/projects` | ProjectsModule |
| `/dashboard/meetings` | MeetingsModule |
| `/dashboard/integrations` | IntegrationsModule |
| `/dashboard/portal-builder` | PortalBuilder |

### 7.5 Founder Nested Routes (react-router-dom)

| Sub-path | Component |
|----------|-----------|
| `/owner/` | TenantManagement |
| `/owner/revenue` | RevenueAnalytics |
| `/owner/ai` | AIBuilder |
| `/owner/marketing` | MarketingSystem |
| `/owner/health` | PlatformHealth |
| `/owner/security` | SecurityDashboard |

---

## AREA 8: WORKER API (Cloudflare Worker)

### 8.1 Worker Entry (`worker/src/index.ts` -- 97 lines)

**Route Groups:**
| Prefix | Handler | Description |
|--------|---------|-------------|
| `/health` | `handleHealth` | Health check |
| `/api/auth/*` | `handleAuth` | Turnstile verify, user info |
| `/api/ai/*` | `handleAI` | RARE AI, Senate, Maestro, usage |
| `/api/billing/*` | `handleBilling` | Stripe checkout, webhooks, subscriptions |
| `/api/provision/*` | `handleProvision` | Tenant provisioning |
| `/api/integrations/*` | `handleIntegrations` | Third-party integrations |
| `/api/accounting/*` | `handleAccounting` | Accounting operations |
| `/api/control-room/*` | `handleControlRoom` | Dashboard overview data |

### 8.2 Environment Variables (Required)
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_API_KEY`, `OPENAI_API_KEY`, `TURNSTILE_SECRET_KEY`

### 8.3 Permission System (`worker/src/permissions.ts`)

**Role Hierarchy (level 10-100):**
- 100: founder
- 95: platform_admin
- 90: company_gm
- 85: assistant_gm
- 75: executive_secretary
- 65: department_manager
- 60: hr_officer, accountant
- 55: supervisor
- 45: senior_employee, sales_rep
- 35: employee, field_employee
- 30: driver
- 20: new_hire
- 15: trainee
- 10: client_user

**AI Action Levels:**
- `read_only` (min level 20): help, analyze, report
- `suggest` (min level 30)
- `modify` (min level 60): act
- `sensitive` (min level 85): approve, delete, transfer, payroll_run, terminate

### 8.4 Billing System (`worker/src/routes/billing.ts` -- 633 lines)

**Payment Gateways:**
| Region | Gateway |
|--------|---------|
| AE, SA, BH, OM, QA, KW | Network International |
| EG | Tilr |
| GLOBAL | Stripe |

**Routes:**
- Stripe checkout session creation
- Stripe customer portal
- Stripe webhook processing
- Network International webhook
- Tilr webhook
- Subscription status check
- AI usage tracking and reporting
- Plans listing

---

## SUMMARY OF CRITICAL FINDINGS

### What Works (Real Data, Functional)
1. **Auth system** -- Full multi-method auth (email, phone OTP, Google, Apple) with Supabase.
2. **Multi-tenant isolation** -- Consistent `company_id` filtering across all modules + RLS.
3. **Company switching** -- Full implementation in both web and mobile.
4. **Provisioning** -- Worker-based async provisioning with blueprints, seed packs, idempotency.
5. **EmployeePortal** -- 7 tabs all querying real Supabase data including real-time chat.
6. **FounderPage** -- 5 of 6 sections use real data (TenantManagement, Revenue, AI, Health, Security).
7. **Dashboard modules** -- All 13 modules exist, most query real Supabase data.
8. **Worker API** -- Complete with auth, AI, billing, provisioning, integrations, accounting.
9. **Mobile app** -- Functional with auth, company switching, dashboard, AI chat.
10. **Dynamic pricing** -- Worker endpoint calculates real pricing based on employee count, modules, add-ons.

### What Needs Attention
1. **ContactPage form** -- Does not submit anywhere (cosmetic only).
2. **FAQPage "Submit Question"** -- Does not submit anywhere.
3. **LandingPage Demo** -- Purely client-side simulation, no real provisioning.
4. **AcademyPage** -- All 12 courses, 5 exams, 5 certificates are hardcoded static data.
5. **HelpCenterPage** -- Minimal (35 lines), cards are non-functional.
6. **ClientPortal** -- 3 of 5 sub-pages are placeholders (Quotes, Contracts, Support).
7. **StoreModule** -- Only 62 lines, likely minimal/placeholder.
8. **FounderPage Marketing** -- Shows "Data source not available yet".
9. **Mobile app** -- Missing: Phone OTP login, onboarding wizard, client portal, real-time chat, clock in/out, portal builder.
10. **Mobile widgets/** -- Empty folder, no reusable widgets created.
11. **FeaturesPage** -- Uses external Google Photos URLs (fragile).
12. **Copyright in LandingPage** -- Says "2024" (should be 2025/2026).
13. **Dual auth state** -- LoginPage creates its own user object separately from AuthContext.
14. **Anon key hardcoded** -- Mobile app has Supabase anon key hardcoded as default value in `app_config.dart`.
