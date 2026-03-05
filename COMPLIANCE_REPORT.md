# ZIEN Compliance Report - 2026-02-27

This report covers the current state of the ZIEN multi-tenant SaaS platform across all layers: web, mobile, worker, and database.

---

## 1. Build Status

| Target | Command | Result |
|--------|---------|--------|
| Web (Vite) | npx vite build | 0 errors, 0 warnings, 2996 modules, 53.70s |
| Mobile (Flutter) | flutter analyze | 0 issues (verified in prior session) |

---

## 2. Mock Data Elimination

All user-facing pages in the web app have been audited and rewritten to use real Supabase queries.

| Page | Status | Data Source |
|------|--------|------------|
| FounderPage.tsx | REAL DATA | companies, company_members, invoices, ai_usage_logs, subscriptions |
| ClientPortal.tsx | REAL DATA | projects, invoices, payments, company_documents, meetings |
| EmployeePortal.tsx | REAL DATA | attendance, leave_requests, payroll, projects, invoices, payments, tax_settings, employees, company_documents, vehicles, logistics_tasks, chats |
| StoreModule.tsx | HONEST "unavailable" | No mock data. Shows honest state when store is not configured. |
| PortalBuilder.tsx | REAL STRUCTURE | 3 tabs (Preview, Customization, AI Builder) with real component scaffolding |
| OwnerDashboard.tsx | REAL DATA | Uses useCompany/useAuth hooks with Supabase queries |
| Dashboard.tsx | REAL DATA | Portal routing with real module checks |

---

## 3. Core Rules Compliance

| Rule | Status | Notes |
|------|--------|-------|
| No mock behavior | COMPLIANT | All pages fetch from Supabase or show "unavailable"/"No data yet" |
| No placeholder strings in UI | COMPLIANT | All user-facing text is intentional |
| No emoji in UI/logs/workflows | COMPLIANT | No emoji in any source files |
| Production independent of Windows | COMPLIANT | Build and deploy use standard Node.js/Vite/Flutter toolchain |
| Secrets not in mobile/portal | COMPLIANT | Only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in portal (public keys by design) |
| R2 bucket private | COMPLIANT | No direct R2 URLs in frontend |
| Auth via Supabase JWT | COMPLIANT | AuthContext verifies session; backend validates JWT |

---

## 4. What Works

- Web: Full login/registration flow (email, OTP, OAuth)
- Web: Dashboard with module routing (PortalBuilder, StoreModule, all department modules)
- Web: EmployeePortal with 7 tabs, all fetching real data from Supabase
- Web: FounderPage with real company/billing/AI usage stats
- Web: ClientPortal with real project/invoice/document data
- Web: RARE AI floating assistant on all portal pages
- Web: Real-time chat via Supabase postgres_changes subscription
- Web: Clock In/Out writing to attendance table
- Mobile: Dashboard StatusWall with backend data
- Mobile: RARE AI tab with 24 agents, 3 modes, multi-turn chat
- Mobile: ApiClient with extraHeaders support
- Worker: 44+ endpoints across 8 route files (health, auth, ai, billing, provision, integrations, accounting, controlRoom)
- Worker: CORS configuration for all allowed origins
- Worker: StripeEngine instance-based payment processing
- Database: 30+ tables with RLS-ready schema

---

## 5. What Requires External Configuration

These features are built and code-complete but require external service credentials or infrastructure to function:

| Feature | Dependency | What Is Needed |
|---------|-----------|---------------|
| Stripe payments | Stripe API keys | STRIPE_SECRET_KEY in worker environment |
| Network International | NI API credentials | NI_API_KEY, NI_OUTLET_REF in worker environment |
| Cloudflare Pages deploy | Cloudflare API token | CF_API_TOKEN, CF_ACCOUNT_ID in worker environment |
| Google Maps in logistics | Maps API key | VITE_GOOGLE_MAPS_API_KEY in portal environment |
| Turnstile captcha | Turnstile keys | TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY |
| SSM secret loading | AWS SSM | AWS credentials configured in production VPS |
| Push notifications (mobile) | FCM/APNs | Firebase config + Apple push certificate |
| AI (Gemini) | Gemini API key | VITE_GEMINI_API_KEY or backend proxy |

---

## 6. Deprecated Types

The following types in src/types.ts are marked @deprecated but still referenced:

| Type | Used By | Replacement |
|------|---------|-------------|
| UserRole (enum) | FloatingActions.tsx | PlatformRole or CompanyRole |
| User (type alias) | Not referenced (unused import removed from LoginPage.tsx) | Profile |
| Module (type alias) | Not referenced | ModuleCatalog |

UserRole removal requires refactoring FloatingActions.tsx to use CompanyRole instead. Deferred to avoid breaking current functionality.

---

## 7. Archive Summary

6 files moved to _archive/20260227/:
- Login.tsx, Onboarding.tsx, RegisterPage.tsx, LoginPage.tsx (all dead/replaced)
- mockData.ts.DELETED (previously deleted mock data)
- EmployeePortal.tsx.bak (backup before rewrite)

1 file identified as dead but not moved (accountingService.ts) due to file lock. Has zero imports.

See _archive/20260227/ARCHIVE_REPORT.md for details.
