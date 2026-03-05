# ZIEN Platform - API Contracts

All endpoints require `Content-Type: application/json`.
All authenticated endpoints require `Authorization: Bearer <supabase_jwt>`.

## Error Response Shape (Unified)

```json
{
  "error": {
    "code": "PROVISION_DUPLICATE",
    "message": "A provisioning job with this idempotency key already exists.",
    "details": { "existingJobId": "uuid-here" }
  }
}
```

Error codes follow the pattern: `ENTITY_ACTION` (e.g., `AUTH_INVALID_TOKEN`, `PROVISION_FAILED`, `BILLING_PLAN_NOT_FOUND`).

---

## Cloudflare Worker Endpoints (`api.plt.zien-ai.app`)

### 1. Health Check

```
GET /api/health
Auth: None
```

**Response 200:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-02-24T12:00:00Z"
}
```

---

### 2. RARE AI Agent

```
POST /api/ai/rare
Auth: Required (any company member)
Permission: use_ai_agent
```

**Request:**
```json
{
  "agentType": "accounting",
  "mode": "analyze",
  "query": "Show me revenue trends for Q1",
  "context": {
    "pageCode": "accounting_dashboard",
    "moduleCode": "accounting",
    "companyId": "uuid",
    "language": "ar",
    "selectedEntityId": "uuid-optional"
  },
  "files": [
    {
      "data": "base64-encoded",
      "mimeType": "application/pdf"
    }
  ]
}
```

**Validations:**
- `agentType` must be one of: `accounting`, `hr`, `sales`, `fleet`, `meetings`, `gm`, `secretary`, `founder`
- `mode` must be one of: `help`, `analyze`, `act`, `report`
- `founder` agent requires `company_gm` or higher role
- User must be an active `company_member` of the specified `companyId`

**Response 200:**
```json
{
  "response": "AI-generated response text...",
  "agentType": "accounting",
  "mode": "analyze",
  "tokensUsed": { "input": 150, "output": 320 },
  "suggestedActions": [
    { "label": "Generate full report", "mode": "report", "prompt": "..." }
  ]
}
```

**Errors:**
- `401` - `AUTH_INVALID_TOKEN`
- `403` - `AUTH_INSUFFICIENT_PERMISSION`
- `422` - `AI_INVALID_AGENT_TYPE`
- `500` - `AI_GENERATION_FAILED`

---

### 3. Provisioning

```
POST /api/provisioning/provision
Auth: Required (founder or company_gm)
Permission: provision_company
```

**Request:**
```json
{
  "companyId": "uuid",
  "blueprintCode": "retail_supermarket",
  "selectedModules": ["inventory", "crm", "pos", "accounting"],
  "idempotencyKey": "unique-client-generated-key",
  "options": {
    "seedDemo": false,
    "timezone": "Asia/Dubai",
    "currency": "AED",
    "language": "ar"
  }
}
```

**Validations:**
- User must be `founder` or `company_gm` of the company
- `idempotencyKey` checked first; if existing job found, return it
- `blueprintCode` must match an active blueprint
- `selectedModules` dependency graph validated (all deps must be included)
- Company must be in `pending_review` or `active` status

**Response 200 (new job):**
```json
{
  "jobId": "uuid",
  "status": "pending",
  "companyId": "uuid",
  "blueprintId": "uuid",
  "totalSteps": 5,
  "createdAt": "2026-02-24T12:00:00Z"
}
```

**Response 200 (existing idempotency key):**
```json
{
  "jobId": "uuid",
  "status": "completed",
  "companyId": "uuid",
  "isExisting": true
}
```

**Errors:**
- `401` - `AUTH_INVALID_TOKEN`
- `403` - `PROVISION_UNAUTHORIZED`
- `404` - `PROVISION_BLUEPRINT_NOT_FOUND`
- `409` - `PROVISION_ALREADY_ACTIVE`
- `422` - `PROVISION_DEPENDENCY_MISSING` (with `details.missingModules`)

---

### 4. Provisioning Job Status

```
GET /api/provisioning/jobs/:jobId
Auth: Required (founder or company_gm of the company)
```

**Response 200:**
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "status": "applying_modules",
  "currentStep": "Attaching CRM module",
  "stepIndex": 2,
  "totalSteps": 5,
  "progress": 0.4,
  "logs": [
    "2026-02-24T12:00:01Z - Started validation",
    "2026-02-24T12:00:02Z - Blueprint matched: retail_supermarket v1.0.0",
    "2026-02-24T12:00:03Z - Attaching module: accounting"
  ],
  "startedAt": "2026-02-24T12:00:00Z",
  "completedAt": null
}
```

---

## Supabase Edge Functions (`rjrgylhcpnijkfstvcza.supabase.co/functions/v1/`)

### 5. Register Company

```
POST /functions/v1/register_company
Auth: Required (authenticated user)
```

**Request:**
```json
{
  "companyNameAr": "...",
  "companyNameEn": "...",
  "companyTypeId": "uuid",
  "industry": "supermarket",
  "ownerName": "...",
  "ownerEmail": "...",
  "ownerPhone": "...",
  "businessLicenseUrl": "...",
  "ownerIdUrl": "..."
}
```

**Response 200:**
```json
{
  "companyId": "uuid",
  "slug": "company-name-en",
  "status": "pending_review"
}
```

### 6. Stripe Setup (Checkout)

```
POST /functions/v1/stripe-setup
Auth: Required (founder or company_gm)
```

**Request:**
```json
{
  "companyId": "uuid",
  "planCode": "starter",
  "billingInterval": "monthly",
  "successUrl": "https://www.zien-ai.app/owner?session=success",
  "cancelUrl": "https://www.zien-ai.app/pricing"
}
```

**Response 200:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

### 7. Stripe Webhook

```
POST /functions/v1/stripe-webhook
Auth: Stripe Signature (whsec_...)
```

Handles events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.

### 8. Stripe Worker (Background Sync)

```
POST /functions/v1/stripe-worker
Auth: Service Role (internal only)
```

Background sync for Stripe data via Supabase Stripe Sync Engine.

---

## Direct Supabase Queries (Client-side via RLS)

For read-heavy operations, the web and mobile clients query Supabase directly using the anon key with RLS enforcement:

| Operation | Table | RLS Rule |
|-----------|-------|----------|
| Read own profile | `profiles` | `id = auth.uid()` |
| Read company data | `companies` | `is_company_member(id)` |
| Read members list | `company_members` | `is_company_member(company_id)` |
| Read modules | `company_modules` | `is_company_member(company_id)` |
| CRUD invoices | `invoices` | `is_company_member(company_id)` |
| CRUD employees | `employees` | `is_company_member(company_id)` |
| Read audit logs | `audit_logs` | `is_company_member(company_id)` (SELECT only) |
| Read subscription | `company_subscriptions` | `is_company_member(company_id)` |

All write operations to sensitive tables (provisioning, billing, member management) go through Workers or Edge Functions with service-role verification.

---

## Key Distribution (where each key is used)

| Key | Used By | Type |
|-----|---------|------|
| `SUPABASE_URL` | Pages (VITE_), Worker, Edge Functions, Mobile | Public |
| `SUPABASE_ANON_KEY` | Pages (VITE_), Mobile | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker, Edge Functions | Secret |
| `STRIPE_PUBLISHABLE_KEY` | Pages (VITE_) | Public |
| `STRIPE_SECRET_KEY` | Edge Functions | Secret |
| `STRIPE_WEBHOOK_SECRET` | Edge Functions | Secret |
| `GEMINI_API_KEY` | Worker only | Secret |
| `TURNSTILE_SITE_KEY` | Pages (VITE_) | Public |
| `TURNSTILE_SECRET_KEY` | Supabase Auth config | Secret |
| `GOOGLE_OAUTH_CLIENT_ID` | Pages (VITE_), Mobile | Public |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Supabase Auth config | Secret |
| `VONAGE_API_KEY/SECRET` | Supabase Vault | Secret |
| `APPLE_PRIVATE_KEY` | Supabase Auth config | Secret |
