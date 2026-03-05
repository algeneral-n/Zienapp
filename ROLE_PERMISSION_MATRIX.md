# ZIEN Platform -- ROLE_PERMISSION_MATRIX
## مصفوفة الأدوار والصلاحيات الرسمية
**الإصدار:** 1.0  
**التاريخ:** 2026-02-25  
**المرجع:** ZIEN_PLATFORM_CONSTITUTION.md -- القسم 9

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **F**  | Full access (CRUD + approve + delete) |
| **W**  | Write (create + update) |
| **R**  | Read only |
| **A**  | Approve only (no create) |
| **D**  | Department scope only |
| **S**  | Self scope only |
| **--** | No access |

---

## 1. Core Modules Matrix

### 1.1 HR Module

| Permission | GM | Asst GM | Dept Mgr | Supervisor | Sr Employee | Employee | New Hire | Trainee | HR Officer |
|---|---|---|---|---|---|---|---|---|---|
| View all employees | F | F | D | D | -- | -- | -- | -- | F |
| View own profile | S | S | S | S | S | S | S | S | S |
| Create employee | F | F | -- | -- | -- | -- | -- | -- | F |
| Edit employee | F | F | D | -- | -- | -- | -- | -- | F |
| Terminate employee | F | A | -- | -- | -- | -- | -- | -- | A |
| View attendance (all) | F | F | D | D | -- | -- | -- | -- | F |
| View own attendance | S | S | S | S | S | S | S | S | S |
| Mark attendance | F | F | D | D | -- | -- | -- | -- | F |
| Request leave | S | S | S | S | S | S | S | S | S |
| Approve leave | F | F | D | D | -- | -- | -- | -- | A |
| View payroll (all) | F | F | -- | -- | -- | -- | -- | -- | F |
| View own payslip | S | S | S | S | S | S | S | S | S |
| Process payroll | F | A | -- | -- | -- | -- | -- | -- | F |
| View employee documents | F | F | D | D | -- | -- | -- | -- | F |
| Upload own documents | S | S | S | S | S | S | S | S | S |
| Manage benefits | F | F | -- | -- | -- | -- | -- | -- | F |
| File insurance claim | S | S | S | S | S | S | S | S | S |
| Approve insurance claim | F | A | -- | -- | -- | -- | -- | -- | A |
| Create job post | F | F | -- | -- | -- | -- | -- | -- | F |
| Review applications | F | F | D | -- | -- | -- | -- | -- | F |
| Create training course | F | F | D | -- | -- | -- | -- | -- | F |
| Assign training | F | F | D | D | -- | -- | -- | -- | F |
| Take training/exam | S | S | S | S | S | S | S | S | S |

### 1.2 Accounting & Finance Module

| Permission | GM | Asst GM | Dept Mgr | Supervisor | Accountant | Employee | HR Officer |
|---|---|---|---|---|---|---|---|
| View chart of accounts | F | F | -- | -- | F | -- | -- |
| Manage chart of accounts | F | A | -- | -- | F | -- | -- |
| Create journal entry | F | A | -- | -- | F | -- | -- |
| Post journal entry | F | A | -- | -- | F | -- | -- |
| View invoices (all) | F | F | D | -- | F | -- | -- |
| Create invoice | F | W | -- | -- | F | -- | -- |
| Send invoice | F | W | -- | -- | F | -- | -- |
| Record payment | F | W | -- | -- | F | -- | -- |
| Issue receipt | F | W | -- | -- | F | -- | -- |
| View expenses (all) | F | F | D | D | F | -- | -- |
| Submit expense | S | S | S | S | S | S | S |
| Approve expense | F | F | D | D | A | -- | -- |
| Request advance | S | S | S | S | S | S | S |
| Approve advance | F | F | -- | -- | A | -- | -- |
| View tax settings | F | F | -- | -- | F | -- | -- |
| Manage tax settings | F | A | -- | -- | F | -- | -- |
| View financial reports | F | F | -- | -- | F | -- | -- |
| Export financial data | F | A | -- | -- | F | -- | -- |

### 1.3 CRM & Sales Module

| Permission | GM | Asst GM | Dept Mgr | Supervisor | Sales Rep | Employee | Client User |
|---|---|---|---|---|---|---|---|
| View all leads | F | F | D | D | D | -- | -- |
| Create lead | F | W | W | W | W | -- | -- |
| Edit lead | F | W | D | D | S | -- | -- |
| Convert lead | F | W | D | -- | -- | -- | -- |
| View all opportunities | F | F | D | D | D | -- | -- |
| Create opportunity | F | W | W | W | W | -- | -- |
| Edit opportunity | F | W | D | D | S | -- | -- |
| View all quotes | F | F | D | D | D | -- | -- |
| Create quote | F | W | W | W | W | -- | -- |
| Approve quote | F | F | D | -- | -- | -- | -- |
| View all contracts | F | F | D | D | D | -- | R |
| Create contract | F | W | W | -- | -- | -- | -- |
| View client portal | F | F | D | D | D | -- | S |
| Manage client portal users | F | F | D | -- | -- | -- | -- |
| View own invoices/receipts | -- | -- | -- | -- | -- | -- | S |

### 1.4 Projects & Tasks Module

| Permission | GM | Asst GM | Dept Mgr | Supervisor | Sr Employee | Employee | Trainee | Field Employee |
|---|---|---|---|---|---|---|---|---|
| View all projects | F | F | D | D | D | D | D | D |
| Create project | F | W | W | -- | -- | -- | -- | -- |
| Edit project | F | W | D | -- | -- | -- | -- | -- |
| Delete project | F | A | -- | -- | -- | -- | -- | -- |
| Manage project members | F | W | D | -- | -- | -- | -- | -- |
| View all tasks | F | F | D | D | D | D | D | D |
| Create task | F | W | W | W | W | -- | -- | -- |
| Edit task | F | W | D | D | S | S | -- | S |
| Assign task | F | W | D | D | -- | -- | -- | -- |
| Complete task | F | W | D | D | S | S | -- | S |
| Log work hours | S | S | S | S | S | S | S | S |
| View work logs | F | F | D | D | S | S | S | S |
| Add task comment | F | W | W | W | W | W | R | W |

### 1.5 Store / POS / Inventory Module

| Permission | GM | Asst GM | Dept Mgr | Supervisor | Accountant | Cashier | Warehouse Staff | Sales Rep |
|---|---|---|---|---|---|---|---|---|
| View products | F | F | F | F | R | R | R | R |
| Create product | F | W | W | -- | -- | -- | -- | -- |
| Edit product | F | W | W | -- | -- | -- | -- | -- |
| Delete product | F | A | -- | -- | -- | -- | -- | -- |
| View inventory | F | F | D | D | R | R | F | R |
| Adjust inventory | F | W | D | -- | -- | -- | W | -- |
| Transfer stock | F | W | D | -- | -- | -- | W | -- |
| Open POS session | F | W | -- | -- | -- | W | -- | -- |
| Process POS sale | F | W | -- | -- | -- | W | -- | W |
| Close POS session | F | W | -- | -- | A | W | -- | -- |
| View POS reports | F | F | D | D | F | S | -- | S |
| Manage warehouses | F | W | -- | -- | -- | -- | R | -- |
| View customer orders | F | F | D | D | R | R | R | D |
| Process customer order | F | W | D | D | -- | -- | W | W |

### 1.6 Logistics & GPS Module

| Permission | GM | Asst GM | Dept Mgr | Supervisor | Driver | Field Employee | Accountant |
|---|---|---|---|---|---|---|---|
| View all vehicles | F | F | D | D | S | -- | R |
| Manage vehicles | F | W | D | -- | -- | -- | -- |
| View all drivers | F | F | D | D | S | -- | -- |
| Manage drivers | F | W | D | -- | -- | -- | -- |
| View all shipments | F | F | D | D | S | -- | R |
| Create shipment | F | W | W | W | -- | -- | -- |
| Update shipment status | F | W | D | D | S | -- | -- |
| View routes | F | F | D | D | S | -- | -- |
| Manage routes | F | W | D | -- | -- | -- | -- |
| View GPS tracks | F | F | D | D | S | S | -- |
| Manage geofences | F | W | D | -- | -- | -- | -- |
| Send location ping | -- | -- | -- | -- | S | S | -- |

### 1.7 Chat & Communications Module

| Permission | GM | Asst GM | Dept Mgr | Supervisor | Employee | Trainee |
|---|---|---|---|---|---|---|
| View company channels | F | F | D | D | D | D |
| Create channel | F | W | D | -- | -- | -- |
| Archive channel | F | W | D | -- | -- | -- |
| Send messages | F | W | W | W | W | W |
| Delete own messages | S | S | S | S | S | S |
| Delete any message | F | -- | D | -- | -- | -- |
| View presence (all) | F | F | D | D | -- | -- |
| View presence (dept) | D | D | D | D | D | D |
| Set own presence | S | S | S | S | S | S |

### 1.8 Meetings Module

| Permission | GM | Asst GM | Dept Mgr | Supervisor | Employee | Trainee |
|---|---|---|---|---|---|---|
| View all meetings | F | F | D | D | S | S |
| Create meeting | F | W | W | W | W | -- |
| Edit meeting | F | W | D | D | S | -- |
| Cancel meeting | F | W | D | D | S | -- |
| Manage meeting rooms | F | W | -- | -- | -- | -- |
| Join meeting | S | S | S | S | S | S |
| View recordings | F | F | D | D | S | S |
| View transcripts | F | F | D | D | S | -- |
| View AI summaries | F | F | D | D | S | -- |

---

## 2. RARE AI Permissions Matrix

| Capability | GM | Asst GM | Dept Mgr | Supervisor | Sr Employee | Employee | Trainee | Accountant | HR Officer | Driver | Sales Rep | Client User |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Read-Only queries | F | F | D | D | D | S | S | D | D | S | D | S |
| Suggest-Only actions | F | F | D | D | D | S | S | D | D | S | D | S |
| Execute-With-Permission | F | F | D | D | -- | -- | -- | D | D | S | S | -- |
| Sensitive Actions | F | A | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- |
| View AI audit log | F | F | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- |
| Configure AI agents | F | A | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- |

### RARE Agent Access by Role

| Agent | GM | Asst GM | Dept Mgr | Supervisor | Accountant | HR Officer | Sales Rep | Driver |
|---|---|---|---|---|---|---|---|---|
| HR Agent | F | F | D | D | -- | F | -- | -- |
| Accounting Agent | F | F | -- | -- | F | -- | -- | -- |
| CRM Agent | F | F | D | D | -- | -- | F | -- |
| Logistics Agent | F | F | D | D | -- | -- | -- | F |
| Projects Agent | F | F | D | D | -- | -- | D | -- |
| Store/POS Agent | F | F | D | D | R | -- | D | -- |
| Payroll Agent | F | A | -- | -- | F | F | -- | -- |
| Invoicing Agent | F | F | D | -- | F | -- | D | -- |
| Tax Agent | F | A | -- | -- | F | -- | -- | -- |
| Attendance Agent | F | F | D | D | -- | F | -- | -- |
| Fleet/GPS Agent | F | F | D | D | -- | -- | -- | F |
| Meeting Summary Agent | F | F | D | D | -- | -- | -- | -- |
| Recruitment Agent | F | F | D | -- | -- | F | -- | -- |
| Inventory Agent | F | F | D | D | R | -- | R | -- |
| GM Agent | F | -- | -- | -- | -- | -- | -- | -- |
| Client Portal Agent | -- | -- | -- | -- | -- | -- | -- | -- |

> **Client Portal Agent**: Client users access only their own company portal data. The agent is scoped to their `client_id` and `company_id`.

---

## 3. Integration Activation Permissions

| Permission | GM | Asst GM | Dept Mgr | Accountant | HR Officer |
|---|---|---|---|---|---|
| View all integrations | F | F | R | R | R |
| Activate payment integration | F | A | -- | A | -- |
| Activate marketing integration | F | A | D | -- | -- |
| Activate storage integration | F | A | -- | -- | -- |
| Activate communications | F | A | -- | -- | -- |
| Activate maps/GPS | F | A | D | -- | -- |
| Activate automation | F | A | -- | -- | -- |
| View integration billing | F | F | -- | F | -- |
| Deactivate integration | F | A | -- | -- | -- |
| View integration health | F | F | D | R | R |

---

## 4. Founder / Platform Admin Permissions

| Permission | Founder | Platform Admin | Platform Support |
|---|---|---|---|
| View platform dashboard | F | F | R |
| Manage blueprints | F | F | -- |
| Manage modules catalog | F | F | -- |
| Manage integrations catalog | F | F | -- |
| View provisioning jobs | F | F | R |
| Retry provisioning job | F | F | -- |
| View subscriptions overview | F | F | R |
| View aggregated analytics | F | F | R |
| Manage platform policies | F | -- | -- |
| View security events | F | F | R |
| Manage support tickets | F | F | F |
| Access tenant business data | -- | -- | -- |
| Send platform announcements | F | F | -- |
| View billing overview | F | F | R |
| Export platform reports | F | F | -- |

---

## 5. Data Scope Rules

### 5.1 company_id enforcement
Every query MUST be filtered by `company_id`. No exceptions.

### 5.2 Department scope (D)
When a role has "D" scope:
- They can only access data within their own department.
- Implemented via `department_id` check against `company_members.department_id`.

### 5.3 Self scope (S)
When a role has "S" scope:
- They can only access their own records.
- Implemented via `user_id = auth.uid()` in RLS.

### 5.4 Approval scope (A)
When a role has "A" scope:
- They can approve/reject but cannot create or modify the underlying data.
- Implemented as UPDATE permission on status fields only.

---

## 6. SQL Seed Reference

This matrix should be loaded into the `permissions` and `role_permissions` tables.
See `SEED_BASE.sql` for the executable INSERT statements.

---

**End of ROLE_PERMISSION_MATRIX**
