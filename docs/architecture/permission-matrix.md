# ZIEN Platform - Permission Matrix

## Roles

| Role Code | Scope | Level | Description |
|-----------|-------|-------|-------------|
| `founder` | Platform | Top | Platform owner, full access |
| `platform_admin` | Platform | Admin | Platform administrator |
| `platform_support` | Platform | Support | Platform support staff |
| `tenant_user` | Platform | Default | Regular platform user |
| `company_gm` | Company | Top | Company General Manager |
| `executive_secretary` | Company | Senior | Executive secretary with wide access |
| `department_manager` | Company | Manager | Department head |
| `supervisor` | Company | Supervisor | Team supervisor |
| `employee` | Company | Staff | Regular employee |
| `client_user` | Company | External | External client with limited view |

## Permissions

| Permission Code | Description | Category |
|-----------------|-------------|----------|
| `company.create` | Create a new company | Company |
| `company.update` | Update company settings | Company |
| `company.delete` | Delete/archive company | Company |
| `company.view` | View company details | Company |
| `members.invite` | Invite new members | Members |
| `members.remove` | Remove members | Members |
| `members.update_role` | Change member roles | Members |
| `members.view` | View member list | Members |
| `departments.manage` | Create/update/delete departments | Organization |
| `modules.activate` | Activate/deactivate modules | Modules |
| `modules.configure` | Configure module settings | Modules |
| `provision.execute` | Run provisioning | Provisioning |
| `provision.view_status` | View provisioning job status | Provisioning |
| `billing.manage` | Manage subscriptions/plans | Billing |
| `billing.view` | View billing info | Billing |
| `dashboard.view` | View company dashboard | Dashboard |
| `accounting.manage` | Full CRUD on invoices/payments/tax | Accounting |
| `accounting.view` | Read-only accounting data | Accounting |
| `hr.manage` | Full CRUD on employees/attendance/payroll | HR |
| `hr.view` | Read-only HR data | HR |
| `hr.own_attendance` | View/submit own attendance | HR |
| `hr.own_leave` | Submit own leave requests | HR |
| `crm.manage` | Full CRUD on clients/quotes/contracts | CRM |
| `crm.view` | Read-only CRM data | CRM |
| `logistics.manage` | Full CRUD on vehicles/tasks | Logistics |
| `logistics.view` | Read-only logistics data | Logistics |
| `meetings.manage` | Create/manage meetings | Communication |
| `meetings.view` | View meetings | Communication |
| `chat.send` | Send chat messages | Communication |
| `chat.view` | View chat messages | Communication |
| `ai.use_agent` | Use RARE AI agents | AI |
| `ai.view_reports` | View AI-generated reports | AI |
| `audit.view` | View audit logs | Audit |
| `documents.manage` | Upload/manage company documents | Documents |
| `documents.view` | View company documents | Documents |
| `settings.manage` | Manage company settings (branding, etc.) | Settings |
| `feature_flags.manage` | Toggle feature flags | Admin |

## Role-Permission Matrix

| Permission | founder | platform_admin | company_gm | exec_secretary | dept_manager | supervisor | employee | client_user |
|------------|---------|---------------|------------|---------------|-------------|------------|----------|-------------|
| `company.create` | Y | Y | - | - | - | - | - | - |
| `company.update` | Y | Y | Y | - | - | - | - | - |
| `company.delete` | Y | - | - | - | - | - | - | - |
| `company.view` | Y | Y | Y | Y | Y | Y | Y | Y |
| `members.invite` | Y | - | Y | Y | - | - | - | - |
| `members.remove` | Y | - | Y | - | - | - | - | - |
| `members.update_role` | Y | - | Y | - | - | - | - | - |
| `members.view` | Y | Y | Y | Y | Y | Y | Y | - |
| `departments.manage` | Y | - | Y | Y | - | - | - | - |
| `modules.activate` | Y | - | Y | - | - | - | - | - |
| `modules.configure` | Y | - | Y | Y | - | - | - | - |
| `provision.execute` | Y | - | Y | - | - | - | - | - |
| `provision.view_status` | Y | - | Y | Y | - | - | - | - |
| `billing.manage` | Y | - | Y | - | - | - | - | - |
| `billing.view` | Y | Y | Y | Y | - | - | - | - |
| `dashboard.view` | Y | Y | Y | Y | Y | Y | Y | - |
| `accounting.manage` | Y | - | Y | Y | - | - | - | - |
| `accounting.view` | Y | - | Y | Y | Y | Y | - | - |
| `hr.manage` | Y | - | Y | Y | - | - | - | - |
| `hr.view` | Y | - | Y | Y | Y | Y | - | - |
| `hr.own_attendance` | Y | - | Y | Y | Y | Y | Y | - |
| `hr.own_leave` | Y | - | Y | Y | Y | Y | Y | - |
| `crm.manage` | Y | - | Y | Y | - | - | - | - |
| `crm.view` | Y | - | Y | Y | Y | Y | - | Y |
| `logistics.manage` | Y | - | Y | Y | - | - | - | - |
| `logistics.view` | Y | - | Y | Y | Y | Y | - | - |
| `meetings.manage` | Y | - | Y | Y | Y | - | - | - |
| `meetings.view` | Y | - | Y | Y | Y | Y | Y | - |
| `chat.send` | Y | - | Y | Y | Y | Y | Y | - |
| `chat.view` | Y | - | Y | Y | Y | Y | Y | - |
| `ai.use_agent` | Y | - | Y | Y | Y | Y | - | - |
| `ai.view_reports` | Y | - | Y | Y | Y | - | - | - |
| `audit.view` | Y | Y | Y | - | - | - | - | - |
| `documents.manage` | Y | - | Y | Y | - | - | - | - |
| `documents.view` | Y | - | Y | Y | Y | Y | Y | Y |
| `settings.manage` | Y | - | Y | - | - | - | - | - |
| `feature_flags.manage` | Y | Y | - | - | - | - | - | - |

## Enforcement Points

| Layer | Mechanism | Details |
|-------|-----------|---------|
| Database | RLS Policies | `is_company_member()` checks membership; `is_company_admin()` for write ops |
| Workers | Auth Middleware | JWT verification + role extraction + permission check before handler |
| Edge Functions | Service Role | Runs with service_role key; validates caller JWT in function body |
| Web App | Route Guards | `ProtectedRoute` component checks role + permission before render |
| Mobile App | GoRouter Redirect | Auth guard redirects + role-based tab visibility |
| AI Agents | Prompt-level + API-level | Worker checks `ai.use_agent` permission before calling Gemini |

## Multi-Company Scenario

A single user (profile) can have different roles in different companies:

```
User: ahmed@example.com
  - Company A (Tech Corp): company_gm -> full access
  - Company B (Client Inc): client_user -> limited CRM view
  - Company C (Partner Ltd): employee -> own attendance/leave only
```

The `CompanyContext` in the UI determines which company is active. All API calls include the `companyId` and the backend verifies the user's role in that specific company.
