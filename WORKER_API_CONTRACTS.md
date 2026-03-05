# ZIEN Platform -- Worker API Contracts
## عقود واجهات برمجة التطبيقات
**الإصدار:** 1.0  
**التاريخ:** 2026-02-25  
**المرجع:** ZIEN_PLATFORM_CONSTITUTION.md + RARE_AI_ARCHITECTURE.md

---

## Base URL
```
https://api.plt.zien-ai.app
```

All endpoints require `Authorization: Bearer <supabase_jwt>` unless marked **Public**.

---

## 1. Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Platform health check |
| GET | `/api/health` | Public | Alias |

**Response:**
```json
{ "status": "ok", "version": "1.0.0", "timestamp": "..." }
```

---

## 2. Auth Routes (`/api/auth/*`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user (creates profile) |
| POST | `/api/auth/verify-turnstile` | Public | Verify Cloudflare Turnstile token |
| GET | `/api/auth/me` | JWT | Get current user profile + companies |

---

## 3. Provisioning Routes (`/api/provision/*`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/provision/start` | JWT (owner) | Start provisioning for a company |
| GET | `/api/provision/status/:jobId` | JWT (member) | Get provisioning job status |
| POST | `/api/provision/retry` | JWT (owner) | Retry a failed provisioning job |
| GET | `/api/provision/blueprints` | JWT | List available blueprints |
| POST | `/api/provision/estimate-price` | JWT | Estimate dynamic price |

### POST `/api/provision/start`

**Request:**
```json
{
  "companyId": "uuid",
  "blueprintId": "uuid (optional, auto-detected from company type)",
  "idempotencyKey": "string (optional)",
  "requestedModules": ["hr", "accounting", "crm"],
  "requestedIntegrations": ["stripe"],
  "companyData": {
    "employeeCount": 25,
    "branchCount": 2,
    "countryCode": "AE"
  }
}
```

**Response (202):**
```json
{
  "jobId": "uuid",
  "status": "pending",
  "estimatedSteps": 9,
  "estimatedPrice": {
    "monthly": 449,
    "yearly": 4490,
    "currency": "AED",
    "breakdown": {
      "basePlan": 299,
      "modules": 100,
      "seats": 50,
      "integrations": 0
    }
  }
}
```

### POST `/api/provision/retry`

**Request:**
```json
{
  "jobId": "uuid"
}
```

**Response (202):**
```json
{
  "jobId": "uuid",
  "status": "pending",
  "retryAttempt": 2
}
```

### GET `/api/provision/blueprints`

**Query Params:** `?companyTypeId=uuid&includeInactive=false`

**Response:**
```json
{
  "blueprints": [
    {
      "id": "uuid",
      "name": "Default Retail Blueprint",
      "version": "1.0.0",
      "modules": [
        { "code": "hr", "name_en": "Human Resources", "isRequired": true },
        { "code": "store", "name_en": "Store & POS", "isRequired": true }
      ],
      "seedPacks": ["roles_default", "coa_uae_standard", "tax_uae_vat"]
    }
  ]
}
```

### POST `/api/provision/estimate-price`

**Request:**
```json
{
  "companyTypeCode": "retail",
  "employeeCount": 25,
  "modules": ["hr", "accounting", "crm", "store"],
  "integrations": ["stripe", "google_maps"],
  "countryCode": "AE"
}
```

**Response:**
```json
{
  "pricing": {
    "recommendedPlan": "business",
    "monthly": 449,
    "yearly": 4490,
    "currency": "AED",
    "breakdown": {
      "basePlan": { "code": "business", "amount": 299 },
      "moduleAddons": [
        { "code": "store_addon", "amount": 49 }
      ],
      "seats": { "included": 25, "extra": 0, "extraCost": 0 },
      "integrations": [
        { "code": "stripe", "setupFee": 0, "monthlyCost": 0, "note": "usage-based" },
        { "code": "google_maps", "setupFee": 0, "monthlyCost": 0, "note": "usage-based" }
      ],
      "aiUsage": { "included": 1000, "monthlyCost": 0 }
    }
  }
}
```

---

## 4. Billing Routes (`/api/billing/*`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/billing/checkout` | JWT (GM/accountant) | Create Stripe checkout session |
| POST | `/api/billing/portal` | JWT (GM/accountant) | Create Stripe billing portal |
| POST | `/api/billing/webhook` | Stripe Signature | Handle Stripe webhooks |
| GET | `/api/billing/subscription/:companyId` | JWT (member) | Get company subscription |
| GET | `/api/billing/usage/:companyId` | JWT (GM/accountant) | Get usage counters |
| GET | `/api/billing/events/:companyId` | JWT (GM/accountant) | Get billing events |
| POST | `/api/billing/activate-addon` | JWT (GM) | Activate a pricing add-on |

### POST `/api/billing/checkout`

**Request:**
```json
{
  "companyId": "uuid",
  "planCode": "business",
  "billingInterval": "monthly",
  "addons": ["store_addon", "extra_seats"],
  "addonQuantities": { "extra_seats": 10 },
  "successUrl": "https://app.zien-ai.app/billing/success",
  "cancelUrl": "https://app.zien-ai.app/billing/cancel"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

### GET `/api/billing/usage/:companyId`

**Response:**
```json
{
  "counters": [
    { "type": "active_users", "current": 18, "limit": 25, "period": "2026-02" },
    { "type": "ai_tokens", "current": 450, "limit": 1000, "period": "2026-02" },
    { "type": "storage_gb", "current": 12.5, "limit": 50, "period": "2026-02" }
  ]
}
```

---

## 5. AI Routes (`/api/ai/*`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/rare` | JWT | Main RARE AI query |
| POST | `/api/ai/summarize-meeting` | JWT | Generate meeting summary |
| POST | `/api/ai/generate-document` | JWT | Generate document (invoice, contract, report) |
| GET | `/api/ai/agents` | JWT | List available agents for current user |
| GET | `/api/ai/audit/:companyId` | JWT (GM/HR) | View AI audit log |

### POST `/api/ai/rare`

**Request:**
```json
{
  "companyId": "uuid",
  "query": "What are this month's total sales?",
  "pageContext": {
    "page": "crm/dashboard",
    "module": "crm",
    "entityId": null
  },
  "conversationId": "uuid (optional, for multi-turn)",
  "language": "en"
}
```

**Response:**
```json
{
  "response": "This month's total sales amount to 45,320 AED across 23 invoices...",
  "actionTaken": null,
  "suggestions": [
    "Show me top clients this month",
    "Compare with last month",
    "Export sales report"
  ],
  "agentUsed": "crm",
  "tokensUsed": { "in": 850, "out": 320 }
}
```

### POST `/api/ai/summarize-meeting`

**Request:**
```json
{
  "companyId": "uuid",
  "meetingId": "uuid",
  "language": "ar",
  "includeActionItems": true
}
```

**Response:**
```json
{
  "summary": "...",
  "actionItems": [
    { "task": "Prepare Q1 report", "assignee": "Ahmed", "deadline": "2026-03-01" }
  ],
  "decisions": ["Approved budget increase for marketing"],
  "transcriptId": "uuid"
}
```

### POST `/api/ai/generate-document`

**Request:**
```json
{
  "companyId": "uuid",
  "documentType": "invoice",
  "data": {
    "clientId": "uuid",
    "items": [
      { "description": "Consulting services", "quantity": 10, "unitPrice": 500 }
    ]
  },
  "language": "ar"
}
```

**Response:**
```json
{
  "content": "<html>...</html>",
  "format": "html",
  "reportId": "uuid"
}
```

### GET `/api/ai/audit/:companyId`

**Query Params:** `?page=1&limit=50&level=sensitive&from=2026-02-01&to=2026-02-28`

**Response:**
```json
{
  "actions": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "Ahmed",
      "agentType": "accounting",
      "actionLevel": "execute",
      "actionCode": "generate_invoice",
      "status": "executed",
      "createdAt": "2026-02-25T10:30:00Z"
    }
  ],
  "total": 145,
  "page": 1,
  "limit": 50
}
```

---

## 6. Integrations Routes (`/api/integrations/*`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/integrations/catalog` | JWT | List all integrations |
| GET | `/api/integrations/company/:companyId` | JWT (member) | List company's active integrations |
| POST | `/api/integrations/connect` | JWT (GM/authorized) | Activate an integration |
| POST | `/api/integrations/disconnect` | JWT (GM/authorized) | Deactivate an integration |
| POST | `/api/integrations/webhook/:code` | Provider signature | Handle integration webhooks |
| GET | `/api/integrations/health/:companyId` | JWT (member) | Integration health status |

### GET `/api/integrations/catalog`

**Query Params:** `?category=payments&status=active`

**Response:**
```json
{
  "integrations": [
    {
      "id": "uuid",
      "code": "stripe",
      "name": "Stripe Payments",
      "category": "payments",
      "provider": "stripe",
      "pricingModel": "usage",
      "setupMode": "self-connect",
      "webhookSupport": true,
      "status": "active"
    }
  ]
}
```

### POST `/api/integrations/connect`

**Request:**
```json
{
  "companyId": "uuid",
  "integrationCode": "stripe",
  "config": {
    "apiKey": "sk_live_...",
    "webhookSecret": "whsec_..."
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "integrationCode": "stripe",
  "status": "active",
  "enabledAt": "2026-02-25T10:30:00Z"
}
```

### GET `/api/integrations/health/:companyId`

**Response:**
```json
{
  "integrations": [
    {
      "code": "stripe",
      "status": "healthy",
      "lastEvent": "2026-02-25T10:00:00Z",
      "errorCount24h": 0
    },
    {
      "code": "vonage",
      "status": "degraded",
      "lastEvent": "2026-02-24T22:00:00Z",
      "errorCount24h": 3,
      "lastError": "Connection timeout"
    }
  ]
}
```

---

## 7. Error Format (Standard)

All errors use a consistent JSON format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | User lacks required permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `RATE_LIMITED` | 429 | Too many requests |
| `TENANT_MISMATCH` | 403 | Accessing data from wrong company |
| `MODULE_INACTIVE` | 403 | Required module not active |
| `QUOTA_EXCEEDED` | 402 | Usage limit exceeded |
| `PROVIDER_ERROR` | 502 | External provider API failure |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 8. Rate Limits

| Scope | Limit | Window |
|-------|-------|--------|
| General API | 100 req | 1 minute per user |
| AI routes | 10 req | 1 minute per user |
| AI sensitive | 5 req | 1 hour per user |
| Billing routes | 20 req | 1 minute per company |
| Provisioning | 3 req | 1 hour per company |
| Webhook endpoints | 1000 req | 1 minute per provider |

---

## 9. File Structure (Worker)

```
worker/src/
  index.ts                 -- Entrypoint, routing, helpers
  cors.ts                  -- CORS headers
  supabase.ts              -- Supabase client factory
  routes/
    health.ts              -- /health
    auth.ts                -- /api/auth/*
    billing.ts             -- /api/billing/*
    provision.ts           -- /api/provision/*
    ai.ts                  -- /api/ai/*
    integrations.ts        -- /api/integrations/*  [NEW]
    StripeEngine.ts        -- Stripe abstraction
    StripeEngine.test.ts   -- Stripe tests
  middleware/
    rateLimit.ts           -- Rate limiting  [NEW]
    permissionGate.ts      -- Role/permission verification  [NEW]
  lib/
    rareEngine.ts          -- RARE AI pipeline  [NEW]
    pricingCalculator.ts   -- Dynamic pricing logic  [NEW]
```

---

**End of Worker API Contracts**
