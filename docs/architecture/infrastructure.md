# ZIEN Platform - Infrastructure Map

## Services Overview

```
                        +------------------+
                        |   Cloudflare     |
                        |   DNS/CDN        |
                        +--------+---------+
                                 |
                 +---------------+---------------+
                 |                               |
        +--------v--------+            +--------v--------+
        | Cloudflare Pages |            | Cloudflare Worker|
        | www.zien-ai.app  |            | api.plt.zien-ai  |
        | (React/Vite)     |            | .app             |
        +--------+---------+            +--------+---------+
                 |                               |
                 |      +------------------------+
                 |      |
                 v      v
        +--------+------+---------+
        |      Supabase           |
        |  (PostgreSQL + Auth     |
        |   + Edge Functions      |
        |   + Realtime            |
        |   + Storage)            |
        +-----------+-------------+
                    |
        +-----------+-------------+
        |  Supabase Integrations  |
        |  - Stripe Sync Engine   |
        |  - Stripe Wrapper       |
        |  - Cron Jobs            |
        |  - Queues               |
        |  - Vault                |
        |  - Data API             |
        |  - GraphQL              |
        +-----------+-------------+
                    |
        +-----------v-------------+
        |      Stripe             |
        |  (Billing/Payments)     |
        +-------------------------+
```

## Cloudflare Services

| Service | Domain/Config | Purpose |
|---------|--------------|---------|
| Pages | `www.zien-ai.app` | React web app (Vite build) |
| Worker | `api.plt.zien-ai.app` | AI/RARE API + Provisioning API |
| Turnstile | Site Key in web forms | Bot protection for auth |
| TURN Server | Token ID: `fa714884...` | WebRTC for real-time features |
| Realtime | App ID: `36640e04...` | Real-time communication |
| R2 | VPC enabled | Private file storage (signed URLs only) |

## Supabase Project

| Config | Value |
|--------|-------|
| Project Name | Zien platform |
| Plan | Free |
| Region | (check dashboard) |
| Project Ref | `rjrgylhcpnijkfstvcza` |
| URL | `https://rjrgylhcpnijkfstvcza.supabase.co` |

### Auth Configuration

| Setting | Status |
|---------|--------|
| Email | Enabled |
| Phone | Enabled |
| Apple | Enabled |
| Google | Enabled |
| Slack (OIDC) | Enabled |
| Turnstile CAPTCHA | Enabled |
| Confirm email | Enabled |
| Manual linking | Enabled |
| Anonymous sign-in | Disabled |
| New user signups | Disabled (NEEDS ENABLING) |
| Leaked password prevention | Disabled |

### Auth Redirect URLs

1. `https://zien-ai.app/*`
2. `http://localhost:5173/*`
3. `https://www.zien-ai.app/*`
4. `http://127.0.0.1:5173/*`
5. `https://aistudio.google.com/apps/...` (dev only)
6. `https://remix-zien-platform-...us-west1.run.app/login` (legacy, can remove)

### Edge Functions (Deployed)

| Function | URL | Purpose | Deployments |
|----------|-----|---------|-------------|
| `register_company` | `.../functions/v1/register_company` | Create company + invite owner | 8 |
| `stripe-setup` | `.../functions/v1/stripe-setup` | Create Stripe checkout session | 7 |
| `stripe-webhook` | `.../functions/v1/stripe-webhook` | Handle Stripe webhook events | 7 |
| `stripe-worker` | `.../functions/v1/stripe-worker` | Background Stripe sync | 7 |

### Installed Integrations

| Integration | Type | Purpose |
|-------------|------|---------|
| Cron | Official | Schedule recurring jobs (provisioning cleanup, report generation) |
| Data API | Official | Auto-generated REST API from schema |
| GraphQL | Official | Auto-generated GraphQL API |
| Queues | Official | Lightweight message queue (provisioning steps, async tasks) |
| Stripe Sync Engine | Official (Alpha) | Auto-sync Stripe data to Postgres tables |
| Stripe Wrapper | Official | Direct Stripe API access from SQL |
| Vault | Official (Beta) | Application-level encryption for secrets |

## External Services

| Service | Purpose | Keys Required |
|---------|---------|--------------|
| Stripe | Billing/subscriptions | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Google Cloud | AI (Gemini), Cloud services | `GOOGLE_API_KEY`, Service Account JSON |
| Vonage | SMS verification, WhatsApp | `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_PRIVATE_KEY` |
| Apple Developer | iOS app, Sign in with Apple, Push | Team ID, Key ID, Private Key |
| OpenAI | Fallback AI | `OPENAI_API_KEY` |

## Apple Developer Configuration

| Config | Value |
|--------|-------|
| Team ID | `BN4DXG557F` |
| Bundle ID | `com.zien.app` |
| App Name | zien |
| Key ID | `UJAD76JU5J` |
| Developer Email | `nader200812@gmail.com` |
| Enabled Services | APNs (Sandbox & Production), ClassKit, DeviceCheck, Sign In with Apple, WeatherKit |
| Sign in with Apple ID | `BN4DXG557F.com.zien.rare4nos` |

## Environment Variable Distribution

See [api-contracts.md](api-contracts.md) for the complete key distribution table.

### Quick Reference

```
CLOUDFLARE PAGES (public, VITE_ prefix):
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_STRIPE_PUBLISHABLE_KEY
  VITE_TURNSTILE_SITE_KEY
  VITE_GOOGLE_OAUTH_CLIENT_ID
  VITE_API_URL=https://api.plt.zien-ai.app
  VITE_APP_URL=https://www.zien-ai.app

CLOUDFLARE WORKER (secrets):
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY (needed - get from Supabase dashboard)
  GEMINI_API_KEY (= GOOGLE_API_KEY)
  OPENAI_API_KEY
  GOOGLE_CLOUD_PROJECT_ID

SUPABASE EDGE FUNCTIONS (secrets):
  SUPABASE_SERVICE_ROLE_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET

SUPABASE VAULT (encrypted storage):
  VONAGE credentials
  Google Service Account JSON
  Apple Private Key

FLUTTER MOBILE (dart-define):
  SUPABASE_URL
  SUPABASE_ANON_KEY
  API_URL=https://api.plt.zien-ai.app
  GOOGLE_OAUTH_CLIENT_ID
```

## Data Flow

### Authentication Flow
```
User -> Cloudflare Pages -> Supabase Auth (with Turnstile)
                         -> OAuth redirect -> Google/Apple/Slack
                         -> JWT issued
                         -> Client stores JWT
```

### API Request Flow
```
Client (JWT in header) -> Cloudflare Worker
                       -> Auth middleware verifies JWT via Supabase
                       -> Route handler executes
                       -> Supabase service-role client for DB writes
                       -> Response to client
```

### Billing Flow
```
Client -> Supabase Edge Function (stripe-setup)
       -> Stripe Checkout page
       -> Stripe webhook -> Supabase Edge Function (stripe-webhook)
       -> DB update (company_subscriptions)
       -> Stripe Sync Engine auto-syncs remaining data
```

### Provisioning Flow
```
Client -> Cloudflare Worker (/api/provisioning/provision)
       -> Validate auth + idempotency
       -> Read blueprint + modules from DB
       -> Create provisioning_job
       -> Execute steps (modules -> seeds -> finalize)
       -> Update job status + company status
       -> Client polls job status or uses Supabase Realtime
```
