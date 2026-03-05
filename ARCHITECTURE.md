# ZIEN Platform Architecture & Implementation Guide

This document outlines the complete architecture, provisioning logic, API design, and deployment instructions for the ZIEN multi-tenant SaaS platform.

## 1. Architecture Summary

ZIEN is a multi-tenant business operating system built with a decoupled architecture:
- **Frontend (Web)**: React + Vite + Tailwind CSS, deployed on Cloudflare Pages (`www.zien-ai.app`).
- **Backend (API)**: Cloudflare Workers (`api.plt.zien-ai.app`), handling Stripe webhooks, provisioning, and secure integrations.
- **Database & Auth**: Supabase Postgres with Row Level Security (RLS) for strict tenant isolation.
- **Mobile Apps**: React Native / Expo (iOS + Android) sharing the same API and Supabase backend. Bundle ID: `com.zien.app`.
- **AI Engine**: Google Gemini API powering the "RARE" AI agents, scoped per tenant and role.

## 2. ERD / Schema Design & 3. SQL Migrations & 4. RLS Policies

The complete database schema, including tables for companies, users, billing, HR, CRM, Accounting, and RLS policies, is located in the `supabase_schema.sql` file in the root directory. 

Key RLS concepts implemented:
- Every operational table has a `company_id`.
- `is_company_member(company_id)` function ensures users only access their tenant's data.
- `is_founder()` function ensures only the platform owner (`gm@zien-ai.app`) can access the Founder Control page and cross-tenant data.

## 5. Seed Data (Plans, Company Types, Modules)

```sql
-- Subscription Plans
INSERT INTO subscription_plans (code, name_en, name_ar, price_aed, billing_interval, max_users) VALUES
('free', 'Free', 'مجاني', 0, 'monthly', 3),
('starter', 'Starter', 'بداية', 59, 'monthly', 15),
('pro', 'Pro', 'احترافي', 159, 'monthly', 20),
('business', 'Business', 'أعمال', 499, 'monthly', 50);

-- Company Types
INSERT INTO company_types (id, code, name_en, name_ar) VALUES
('uuid-1', 'retail', 'Supermarket / Retail', 'سوبر ماركت / تجزئة'),
('uuid-2', 'industrial', 'Industrial / Factory', 'صناعي / مصنع'),
('uuid-3', 'trading', 'Trading Company', 'شركة تجارية'),
('uuid-4', 'engineering', 'Engineering Consultancy', 'استشارات هندسية');

-- Modules Catalog
INSERT INTO modules_catalog (id, code, name_en, name_ar, category) VALUES
('mod-1', 'accounting', 'Accounting', 'المحاسبة', 'core'),
('mod-2', 'hr', 'HR & Payroll', 'الموارد البشرية', 'core'),
('mod-3', 'crm', 'CRM & Sales', 'المبيعات', 'core'),
('mod-4', 'fleet', 'Fleet Management', 'إدارة الأسطول', 'addon');

-- Template Mapping (e.g., Retail gets Accounting and HR by default)
INSERT INTO company_type_template_modules (company_type_id, module_id, is_default_enabled) VALUES
('uuid-1', 'mod-1', true),
('uuid-1', 'mod-2', true);
```

## 6. API Route Design (Cloudflare Worker)

The Cloudflare Worker (`api.plt.zien-ai.app`) handles secure operations that shouldn't be exposed to the frontend:

- `POST /api/v1/auth/founder-token`: Generates a time-limited access token for the Founder Page (requires 2FA).
- `POST /api/v1/provisioning/start`: Triggered after successful Stripe payment to provision tenant database schemas and default modules.
- `POST /api/v1/webhooks/stripe`: Listens for `checkout.session.completed`, `invoice.paid`, and `customer.subscription.deleted` to update `tenant_subscriptions`.
- `POST /api/v1/ai/rare-agent`: Proxies requests to the Gemini API, injecting the tenant's context and enforcing usage limits.

## 7. Landing Page + Onboarding UI Flow

1. **Landing Page**: Animated hero, features overview, pricing, and language/theme switchers (no reload).
2. **Registration**: 
   - Step 1: Company Info (Name, Industry).
   - Step 2: GM Info & Document Upload (License, ID).
   - Step 3: Legal Terms Acceptance.
   - Step 4: Plan Selection & Stripe Checkout.
3. **Pending State**: User sees a "Provisioning & Review" screen until the Founder approves the account.

## 8. Founder Owner Page UI Flow

- **Access**: Restricted to `gm@zien-ai.app` with the `founder` role.
- **Dashboard**: Global MRR, active tenants, pending approvals.
- **Tenants Tab**: Approve/Reject new registrations, view uploaded licenses/IDs, suspend accounts.
- **AI Builder**: Interface to tweak RARE AI prompts globally or per industry.

## 9. Provisioning Engine Logic (Industry-Based)

When a company registers and pays:
1. The backend reads the `company_type_id`.
2. It queries `company_type_template_modules` to find the default modules for that industry.
3. It creates records in `tenant_modules` enabling those specific features.
4. The UI dynamically hides/shows sidebar navigation items based on the active `tenant_modules`.

## 10. Stripe Checkout + Webhook Handling

- **Frontend**: Calls Stripe Elements or redirects to Stripe Checkout with `clientReferenceId` set to the `company_id`.
- **Worker Webhook**: 
  - Verifies Stripe signature.
  - On `checkout.session.completed`: Updates `companies.status` to `active` (or `pending_review`), inserts into `tenant_subscriptions`.
  - On `invoice.payment_failed`: Updates subscription status to `past_due`, restricting tenant access via RLS.

## 11. Core Modules MVP

- **Accounting**: Invoices, payments, tax settings (country-specific overrides).
- **CRM**: Client management, quotes, contracts.
- **HR**: Employee directory, attendance tracking (with geolocation), leave requests, payroll generation.
- **Employee Portal**: A scoped view where `role = 'employee'` can only see their own attendance, payslips, and tasks.

## 12. RARE Agent Framework (Tenant-Aware)

The RARE AI is implemented as a floating assistant (`FloatingActions.tsx`).
- **Context Injection**: Before sending a prompt to Gemini, the backend injects: `You are RARE {Role} for {Company Name}. The user is {User Name} with role {User Role}.`
- **Data Access**: RARE uses function calling (Tools) to query Supabase on behalf of the user, strictly adhering to the user's RLS permissions.

## 13. Deployment Instructions

### Frontend (Cloudflare Pages)
```bash
npm run build
npx wrangler pages deploy dist --project-name zien-web
```

### Backend (Cloudflare Worker)
```bash
cd worker
npx wrangler deploy --name zien-api
```
*Ensure `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `GEMINI_API_KEY` are set in Cloudflare Secrets.*

### Database (Supabase)
Execute `supabase_schema.sql` in the Supabase SQL Editor.

## 14. Mobile App Flow (iOS/Android)

- **Framework**: React Native (Expo).
- **Bundle ID**: `com.zien.app`.
- **Auth**: Uses Supabase Auth with React Native AsyncStorage. Supports Apple/Google OAuth via Expo AuthSession.
- **Navigation**: 
  - Bottom Tab Bar: Home (Dashboard), Chat, RARE AI, Menu.
  - The Menu dynamically renders available modules based on the tenant's provisioned features.
- **Offline Support**: Uses WatermelonDB or AsyncStorage to cache recent tasks and chats.
