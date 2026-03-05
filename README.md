# ZIEN Platform

**ZIEN** is a production-grade multi-tenant SaaS business operating system designed to empower companies with isolated, secure, and AI-driven business modules.

## 🚀 Overview

ZIEN provides a comprehensive suite of integrated business services, including Accounting, HR, CRM, Logistics, and more. Every tenant (company) operates in a fully isolated environment powered by Supabase Row Level Security (RLS).

## ✨ Key Features

- **Multi-Tenant Architecture**: Complete data isolation using PostgreSQL RLS.
- **Smart Onboarding**: Industry-based provisioning that auto-configures modules based on company type (Retail, Industrial, Engineering, etc.).
- **RARE AI Agents**: Context-aware AI assistants (RARE Accounting, RARE HR, etc.) that provide insights, analytics, and automation.
- **Employee Portal**: Personalized dashboards for attendance, payroll, leave requests, and task management.
- **Founder Control**: A dedicated platform management interface for the ZIEN founders to oversee tenants, subscriptions, and platform health.
- **Multi-Language Support**: Runtime switching between 15 languages (English, Arabic, etc.).
- **Theme Support**: Light, Dark, and System theme modes.
- **Stripe Integration**: Automated billing and subscription management.

## 🛠 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Backend**: Cloudflare Workers (API) + Supabase (Auth, Database, Storage)
- **AI**: Google Gemini API (RARE AI Engine)
- **Icons**: Lucide React
- **Internationalization**: Custom runtime i18n system

## 📂 Project Structure

- `/src/pages`: Main application views (Landing, Onboarding, Portal, Dashboard).
- `/src/components`: Reusable UI components and the RARE Floating Assistant.
- `/src/services`: API integrations (Supabase, Gemini).
- `/src/constants`: Global assets, translations, and configuration.
- `/src/types.ts`: Global TypeScript definitions.

## 🔐 Security

- **RLS**: Every operational table is scoped by `company_id`.
- **Auth**: Secure login via Email, Google, Apple, and Phone OTP.
- **Audit Logs**: Comprehensive logging for sensitive platform actions.

## 🌐 Deployment

- **Frontend**: Cloudflare Pages
- **API**: Cloudflare Workers
- **Database**: Supabase PostgreSQL

---

Developed with ❤️ for ZIEN Enterprises.
