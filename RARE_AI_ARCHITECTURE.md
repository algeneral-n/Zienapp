# ZIEN Platform -- RARE AI Architecture
## هندسة الذكاء الاصطناعي RARE
**الإصدار:** 1.0  
**التاريخ:** 2026-02-25  
**المرجع:** ZIEN_PLATFORM_CONSTITUTION.md -- القسم 3

---

## 1. Overview

RARE (Role-Aware Reasoning Engine) is the AI layer embedded in every page of the ZIEN platform. It operates as a floating button on both Web and Mobile, with behaviour that adapts to:

- Current page
- Current company (tenant)
- Current user role
- Active modules
- Granted permissions
- User language

---

## 2. System Components

```
+-------------------------------------------------------------------+
|                        Client (Web / Mobile)                       |
|  +-------------------------------------------------------------+  |
|  |  RARE Floating Button (always visible)                       |  |
|  |  - Captures page context, role, language                     |  |
|  |  - Sends structured request to Worker                        |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
         |
         v
+-------------------------------------------------------------------+
|                     Cloudflare Worker (API)                         |
|  +---------------------+  +--------------------+                   |
|  | /api/ai/rare        |  | /api/ai/summarize  |                   |
|  | Main RARE endpoint  |  | Meeting summaries  |                   |
|  +---------------------+  +--------------------+                   |
|  +---------------------+  +--------------------+                   |
|  | /api/ai/generate    |  | /api/ai/agents     |                   |
|  | Document generation |  | Agent status/config|                   |
|  +---------------------+  +--------------------+                   |
|                                                                    |
|  +-------------------------------------------------------------+  |
|  |                    RARE Engine Core                           |  |
|  |  1. Context Builder     - builds prompt from DB context      |  |
|  |  2. Permission Gate     - validates role + permissions       |  |
|  |  3. Agent Router        - selects correct agent              |  |
|  |  4. Action Classifier   - read_only/suggest/execute/sensitive|  |
|  |  5. Execution Engine    - performs approved actions           |  |
|  |  6. Audit Logger        - records everything                 |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
         |
         v
+-------------------------------------------------------------------+
|                         External AI Provider                       |
|  +-------------------------------------------------------------+  |
|  |  OpenAI API (GPT-4)                                          |  |
|  |  - System prompt built by Context Builder                    |  |
|  |  - Response parsed by Action Classifier                      |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
         |
         v
+-------------------------------------------------------------------+
|                         Supabase (Database)                        |
|  +------------------+  +-------------------+  +-----------------+  |
|  | ai_usage_logs    |  | ai_agent_actions  |  | ai_reports      |  |
|  +------------------+  +-------------------+  +-----------------+  |
+-------------------------------------------------------------------+
```

---

## 3. RARE Engine Core -- Pipeline

Every RARE request flows through this pipeline:

### Step 1: Context Builder

Gathers context from the database:

```typescript
interface RAREContext {
  // Identity
  userId: string;
  companyId: string;
  role: CompanyRole;
  departmentId?: string;

  // Page context
  currentPage: string;          // e.g. "hr/attendance"
  currentModule: string;        // e.g. "hr"
  pageEntityId?: string;        // e.g. specific employee id

  // Permissions
  permissions: string[];        // from role_permissions
  activeModules: string[];      // from company_modules

  // Preferences
  language: string;             // ar, en, etc.
  timezone: string;

  // Conversation
  conversationHistory: Message[];
  userQuery: string;
}
```

### Step 2: Permission Gate

Before any AI processing:

1. Verify `companyId` matches user's active company
2. Verify `role` is valid for this company
3. Verify the requested module is active (`company_modules`)
4. Verify the user has appropriate `permissions` for the query type
5. If the query implies a **sensitive action**, verify `ai.rare.sensitive` permission
6. If denied, return a polite refusal in the user's language

### Step 3: Agent Router

Selects the appropriate agent based on:

| Signal | Agent Selection |
|--------|----------------|
| `currentModule = 'hr'` | HR Agent |
| `currentModule = 'accounting'` | Accounting Agent |
| `currentModule = 'crm'` | CRM Agent |
| `currentModule = 'logistics'` | Logistics Agent |
| `currentModule = 'projects'` | Projects Agent |
| `currentModule = 'store'` | Store/POS Agent |
| `role = 'company_gm'` | GM Agent (cross-module) |
| `role = 'driver'` | Driver Agent |
| `currentPage contains 'meeting'` | Meeting Summary Agent |
| `query mentions payroll/salary` | Payroll Agent |
| `query mentions invoice/billing` | Invoicing Agent |
| `query mentions tax` | Tax Agent |
| `query mentions recruitment` | Recruitment Agent |
| `query mentions inventory/stock` | Inventory Agent |
| `query mentions attendance` | Attendance Agent |
| `query mentions fleet/vehicle` | Fleet/GPS Agent |

If multiple agents match, the **most specific** agent is selected. GM Agent acts as fallback for cross-module queries when the user has GM role.

### Step 4: Action Classifier

The AI response is classified into one of four levels:

```typescript
type ActionLevel = 'read_only' | 'suggest_only' | 'execute' | 'sensitive';

interface ClassifiedAction {
  level: ActionLevel;
  actionCode: string;       // e.g. "generate_payroll_report"
  targetEntityType?: string;
  targetEntityId?: string;
  requiresApproval: boolean;
  description: string;
}
```

Classification rules:

| Level | Criteria | Permission Required |
|-------|----------|-------------------|
| `read_only` | Query asks for information only | `ai.rare.read_only` |
| `suggest_only` | AI suggests actions but does not execute | `ai.rare.suggest` |
| `execute` | AI will perform a write operation | `ai.rare.execute` |
| `sensitive` | Deleting, purchasing, role changes, bulk ops | `ai.rare.sensitive` |

### Step 5: Execution Engine

For `execute` and `sensitive` actions:

1. Re-verify permissions (defense in depth)
2. For `sensitive`: check if additional approval is needed (e.g., GM approval for payroll changes)
3. Execute the action via the appropriate service (NOT direct DB writes)
4. Return confirmation with action details

### Step 6: Audit Logger

Every RARE interaction is logged:

```sql
INSERT INTO ai_agent_actions (
  company_id, user_id, agent_type, action_level,
  action_code, target_entity_type, target_entity_id,
  input_summary, output_summary, was_approved,
  execution_status, metadata
) VALUES (...);

INSERT INTO ai_usage_logs (
  company_id, user_id, agent_type, mode, module_code,
  model_name, tokens_in, tokens_out,
  query_text, response_summary
) VALUES (...);
```

---

## 4. Agent Definitions

### 4.1 Department Agents

| Agent | System Prompt Focus | Key Capabilities |
|-------|-------------------|-------------------|
| HR Agent | Employee management, policies, compliance | View employees, leave management, attendance reports, benefits info |
| Accounting Agent | Financial data, compliance, accuracy | Journal entries, invoice status, expense reports, tax calculations |
| CRM Agent | Customer relationships, sales pipeline | Lead status, opportunity tracking, quote generation, client info |
| Logistics Agent | Fleet, routes, deliveries | Vehicle status, shipment tracking, route optimization, GPS data |
| Projects Agent | Project management, task tracking | Project status, task assignment, time tracking, milestone reports |
| Store/POS Agent | Inventory, sales, products | Stock levels, sales reports, product info, reorder alerts |
| Legal/Compliance Agent | Contracts, policies, regulations | Contract review, compliance checks, policy references |
| Support Agent | General help, platform navigation | Feature help, how-to guides, troubleshooting |

### 4.2 Service Agents

| Agent | System Prompt Focus | Key Capabilities |
|-------|-------------------|-------------------|
| Payroll Agent | Salary processing, deductions | Payslip generation, salary calculations, advance tracking |
| Invoicing Agent | Invoice lifecycle | Create invoices, payment reminders, overdue tracking |
| Tax Agent | Tax compliance | VAT calculations, tax reports, filing reminders |
| Attendance Agent | Time and attendance | Check-in reports, late arrivals, overtime calculations |
| Fleet/GPS Agent | Vehicle tracking | Real-time location, route history, geofence alerts |
| Meeting Summary Agent | Meeting documentation | Transcript generation, action item extraction, summary creation |
| Recruitment Agent | Hiring pipeline | Application screening, interview scheduling, candidate comparison |
| Inventory Agent | Stock management | Stock alerts, movement reports, reorder suggestions |

### 4.3 Role Agents

| Agent | Available To | Extra Capabilities |
|-------|-------------|-------------------|
| GM Agent | `company_gm` only | Cross-module queries, company-wide reports, strategic insights |
| Assistant GM Agent | `executive_secretary` | Delegated GM tasks, approval routing |
| Department Manager Agent | `department_manager` | Department reports, team performance |
| Supervisor Agent | `supervisor` | Team task oversight, daily reports |
| Accountant Agent | `accountant` | Deep financial analysis, reconciliation |
| HR Officer Agent | `hr_officer` | Employee lifecycle, compliance checks |
| Driver Agent | `driver` | Route guidance, delivery updates |
| Field Employee Agent | `field_employee` | Task completion, location check-in |
| Client Portal Agent | `client_user` | Own invoices, project status, support |

---

## 5. System Prompt Template

```
You are RARE, the intelligent assistant for the ZIEN business platform.

## Your Identity
- Name: RARE
- Language: {{language}}
- You serve company: {{companyName}}
- Current user: {{userName}} (Role: {{roleName}})
- Current page: {{currentPage}}

## Your Boundaries
- You can ONLY access data for company_id: {{companyId}}
- You can ONLY perform actions allowed by role: {{role}}
- You have these permissions: {{permissions}}
- Active modules: {{activeModules}}

## Rules
1. NEVER reveal data from other companies.
2. NEVER perform actions beyond the user's permissions.
3. NEVER use emoji in responses.
4. Always respond in {{language}}.
5. For sensitive actions, ask for confirmation first.
6. Log all actions for audit compliance.
7. If uncertain about permissions, default to read-only.
8. Be professional, clear, and direct.

## Available Actions
Based on the user's role and current page, you can:
{{availableActions}}

## Context Data
{{contextData}}
```

---

## 6. API Endpoints

### POST /api/ai/rare

Main RARE interaction endpoint.

```typescript
// Request
{
  companyId: string;
  query: string;
  pageContext: {
    page: string;
    module: string;
    entityId?: string;
  };
  conversationId?: string;  // for multi-turn
  language: string;
}

// Response
{
  response: string;         // AI response text
  actionTaken?: {
    level: ActionLevel;
    code: string;
    status: 'executed' | 'denied' | 'pending_approval';
    details?: any;
  };
  suggestions?: string[];   // follow-up suggestions
  agentUsed: string;
  tokensUsed: { in: number; out: number };
}
```

### POST /api/ai/summarize-meeting

```typescript
// Request
{
  companyId: string;
  meetingId: string;
  language: string;
  includeActionItems: boolean;
}

// Response
{
  summary: string;
  actionItems: Array<{ task: string; assignee?: string; deadline?: string }>;
  decisions: string[];
  transcriptId: string;
}
```

### POST /api/ai/generate-document

```typescript
// Request
{
  companyId: string;
  documentType: 'invoice' | 'contract' | 'report' | 'letter';
  templateId?: string;
  data: Record<string, any>;
  language: string;
}

// Response
{
  content: string;          // generated document content
  format: 'html' | 'markdown';
  reportId?: string;        // saved in ai_reports
}
```

### GET /api/ai/agents

```typescript
// Response
{
  agents: Array<{
    type: string;
    name: string;
    description: string;
    status: 'active' | 'disabled';
    requiredModule?: string;
    requiredPermission?: string;
  }>;
}
```

---

## 7. Usage Limits & Billing

### 7.1 Per-Plan Limits

| Plan | AI Queries/Month | Max Tokens/Query |
|------|-----------------|-----------------|
| Starter | 100 | 2,000 |
| Business | 1,000 | 4,000 |
| Enterprise | 10,000 | 8,000 |

### 7.2 Overage Billing

- Tracked in `subscription_usage_counters` (counter_type = 'ai_tokens')
- Billed via `pricing_addons` (code = 'ai_extra')
- Usage logged in `ai_usage_logs`

### 7.3 Rate Limiting

- Per-user: 10 requests/minute
- Per-company: 60 requests/minute
- Sensitive actions: 5/hour per user

---

## 8. Security Constraints

1. **Tenant Isolation**: Every AI prompt includes ONLY data from the current `company_id`. No cross-tenant context leakage.
2. **Role Enforcement**: Permission Gate runs BEFORE any AI call. No prompt injection can bypass it.
3. **Audit Trail**: Every interaction logged in `ai_agent_actions` and `ai_usage_logs`. Immutable.
4. **PII Protection**: Sensitive fields (salary, personal documents) are redacted from AI context unless the role explicitly permits access.
5. **No Training**: User data is NEVER used for model training. API calls use `no-store` policy.
6. **Abuse Detection**: Repeated permission-denied attempts trigger `security_events` with severity = 'warning'.

---

## 9. Mobile Integration

- RARE floating button appears on every screen in the Flutter mobile app
- Uses the same `/api/ai/rare` endpoint
- Additional mobile capabilities:
  - Voice input (speech-to-text before sending)
  - Push notification for action approvals
  - Offline queue for queries when connectivity is limited

---

## 10. RARE Central Page

A dedicated page in the dashboard (`/rare` or `/ai`) providing:

1. **Capabilities Reference**: List of what RARE can do per module and role
2. **Audit Log**: Searchable log of all AI interactions (filtered by company + permissions)
3. **Agent Status**: Which agents are active/disabled for this company
4. **Usage Dashboard**: Token consumption, query counts, cost breakdown
5. **Policies**: AI usage policies, prohibited actions, escalation procedures
6. **Abuse Monitor**: Failed permission attempts, unusual patterns (GM + HR Officer view only)

---

**End of RARE AI Architecture**
