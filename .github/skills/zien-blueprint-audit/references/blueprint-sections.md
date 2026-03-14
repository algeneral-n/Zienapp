# ZIEN Enterprise Operating Blueprint — Quick Reference

> **القانون المطلق** — This is the absolute constitution for the ZIEN platform.
> Every table, route, permission, and surface defined here MUST exist in the codebase.

## Section 0: Metadata
- **Goal**: Multi-tenant SaaS platform with smart provisioning, AI assistant, Founder OS, self-operation, monitoring, marketing, and full support.
- **Design Principle**: ZIEN is a living product that will run real companies, factories, stores, and organizations. Every part must be commercial, operational, secure, and scalable.

## Section 1: Vision & Tenets
1. Multi-tenant isolation by default
2. Role + Permission + Scope (not just roles)
3. Provisioning-first platform
4. AI is governed, not free-form
5. Pricing is entitlement-driven
6. Integration-ready architecture
7. Founder OS is first-class
8. Operational excellence built-in
9. Module consistency (shell standard)
10. Localization by design

### Primary Personas
`platform_founder`, `platform_admin`, `platform_ops`, `platform_support`, `platform_finance`, `company_gm`, `executive_secretary`, `department_manager`, `supervisor`, `employee`, `field_employee`, `driver`, `sales_rep`, `accountant`, `hr_officer`, `client_user`, `visitor_user`

## Section 2: Product Surfaces
- public_landing, register_company, login_gateway, visitor_mode
- client_portal, employee_portal, hr_portal, accounting_portal
- crm_portal, projects_portal, logistics_portal, store_pos_portal
- meetings_chat_portal, rare_ai_center, founder_os

## Section 3: Architecture
### Bounded Contexts
identity_access, company_lifecycle, provisioning, billing, catalog, core_work, ai_governance, observability, founder_os

### System Layers
- Frontend Web: React + TypeScript
- Frontend Mobile: Flutter
- API Gateway: Cloudflare Workers
- Data Layer: Supabase Postgres + RLS
- Async Layer: Queues + background jobs
- Observability Layer: Logs + metrics + traces

## Section 4: Access & Journeys
- Login only for registered/invited emails
- Manager → company portal
- Client → client portal
- Unknown → visitor mode (read-only)
- Demo request → creates lead in Founder OS

### Public Pages
`/`, `/register`, `/login`, `/faq`, `/academy`, `/integrations`, `/pricing`, `/contact`, `/privacy`, `/terms`

## Section 5: Security & Access
### Required Helper Functions
`current_user_id()`, `is_platform_founder()`, `is_founder_email(email)`, `is_company_member(company_id)`, `is_company_role(company_id, roles[])`, `is_company_permission(company_id, permission_code)`, `is_company_admin(company_id)`, `is_company_client(company_id, email)`, `is_registered_email(email)`, `is_visitor(email)`, `can_access_department(company_id, department_id)`

### Permission Model
- Format: `Resource.Action.Scope` (e.g., `invoices.read.company`)
- User permission overrides (allow/deny per user)
- Sensitive resources: Payroll, subscriptions, journal entries, AI actions, integration secrets
- Session security: Devices + revocation + suspicious login detection
- Auth hardening: Turnstile + rate limiting + secure cookies + 2FA

## Section 6: Unified Schema — Core Tables
### Required Tables & Key Columns
- **profiles**: id, email, full_name, display_name, avatar_url, phone, locale, platform_role, is_active
- **companies**: id, name, slug, company_type_id, industry, status, country_code, currency_code, timezone, owner_user_id, provisioning_status, trial_start_at, activation_date, churn_date
- **company_members**: id, company_id, user_id, role_code, department_id, status, invitation_status, invited_by, is_primary, joined_at
- **departments**: id, company_id, code, name, manager_user_id
- **company_invitations**: id, company_id, email, role_code, department_id, invitation_token, invitation_status, expires_at
- **session_devices**: id, user_id, device_label, platform, last_seen_at, revoked_at, risk_score
- **client_portal_users**: id, company_id, email, contact_name, token_status
- **visitor_profiles**: id, email, status, source

### Access Tables
- **permissions**: id, code, name, resource, action, scope
- **role_permissions**: id, role_code, permission_code, company_id_nullable
- **user_permission_overrides**: id, company_id, user_id, permission_code, effect(allow/deny)

## Section 7: Modules & Catalog
### Required Tables
- **modules_catalog**: id, code, name_ar, name_en, category, module_group, tier, billing_code, dependency_codes, default_config
- **company_modules**: id, company_id, module_id, status, source, config, trial_end_at
- **module_shell_registry**: id, module_code, supports_list/detail/form/filters/timeline/attachments/comments/ai_panel

### Module Groups
finance, hr, crm, projects, logistics, store, collaboration, platform, ai

### Module Shell Standard (every module must have)
List, Detail, Form, Filters, Timeline, Attachments, Comments, AI Panel

## Section 8: Provisioning Engine
### Required Tables
- **blueprints**: id, code, company_type_id, name_ar, name_en, industry_code, business_size, rules_json
- **blueprint_modules**: blueprint_id, module_id, is_required, default_enabled, sort_order
- **seed_packs**: id, code, pack_type, payload, version
- **blueprint_seed_packs**: blueprint_id, seed_pack_id, apply_order
- **provisioning_jobs**: id, company_id, blueprint_id, status, step_code, progress, request_payload, resolved_modules, logs, idempotency_key, rollback_strategy
- **provisioning_job_steps**: id, job_id, step_code, status, details, error_message
- **provisioning_rollbacks**: id, job_id, step_code, action_type, cleanup_target, status

### Engine Steps
1. Validation + Idempotency
2. Blueprint Matching
3. Activity & Needs Analysis
4. Resolve Module Graph (dependencies)
5. Create Company Baseline
6. Create Default Portals
7. Enable Modules
8. Apply Seed Packs
9. Dynamic Pricing Calculation
10. Integrations Recommendations
11. Finalize (active / pending_payment / pending_review)

### Required API Endpoints
- `POST /api/provision/start`
- `GET /api/provision/status/:id`
- `POST /api/provision/retry/:id`
- `POST /api/provision/rollback/:id`
- `GET /api/provision/blueprints`
- `POST /api/provision/estimate-price`

## Section 9: Pricing & Billing
### Required Tables
- **pricing_components**: id, code, component_type, name_en, formula, meter_unit
- **pricing_tiers**: id, component_id, tier_code, range_start, range_end, unit_price, flat_fee
- **company_subscriptions**: id, company_id, provider_code, status, billing_breakdown, trial_end_at
- **usage_records**: id, company_id, component_code, meter_unit, quantity, period_start, period_end
- **payment_events**: id, company_id, provider_code, event_type, payload

### Pricing Formula
`total_price = base_fee + modules_fixed + seats_tier + branches_tier + usage_overage + integrations_addons + ai_usage + storage_usage`

### Usage Meters
users, branches, transactions, meetings, storage_gb, ai_tokens

## Section 10: Integrations
### Required Tables
- **integrations_catalog**: id, code, name, category, scopes, required_secrets, pricing_impact, healthcheck_url, oauth_required
- **tenant_integrations**: id, company_id, integration_id, status, config, secrets_ref, billing_status, last_healthcheck_at
- **integration_healthchecks**: id, company_id, provider_id, check_status, checked_at
- **integration_capabilities**: id, provider_id, capability_code

### Required Providers
stripe, apple_pay, google_pay, google_ads, meta_ads, youtube_ads, whatsapp, vonage, maps, storage, email_provider

## Section 11: AI Governance & Knowledge
### Required Tables
- **ai_action_policies**: id, module_code, agent_type, mode, action_level, min_role_code, require_confirmation, budget_limit_daily
- **ai_model_routing_rules**: id, route_key, preferred_model, fallback_models, max_tokens, temperature
- **ai_budget_policies**: id, company_id, module_code, daily_limit, monthly_limit, warning_threshold
- **ai_confirmation_rules**: id, action_code, confirmation_mode, reason_required, approver_role
- **ai_tool_access_rules**: id, agent_code, tool_code, scope, active
- **ai_sensitive_action_registry**: id, action_code, module_code, sensitivity_level
- **ai_usage_logs**: id, company_id, user_id, agent_type, mode, tokens_in, tokens_out, action_level
- **ai_agent_actions**: id, company_id, actor_user_id, agent_code, action_code, target_entity, status, correlation_id
- **knowledge_documents**: id, company_id, title, storage_ref, document_type, status
- **knowledge_chunks**: id, company_id, document_id, chunk_index, text_excerpt, embedding_ref
- **knowledge_retrieval_rules**: id, company_id, scope, allowed_modules, sensitivity_filter

### AI Modes
help, analyze, act, report

### Policies
- Allowed actions per module (no unregistered Act)
- Sensitive confirmation (delete/disable/pay/migrate)
- Budget limits per company + module + agent
- Model routing by use case / sensitivity / cost / latency
- Human-in-the-loop: draft → review → approve → execute

## Section 12: Founder OS
### Required Tables
- **tenant_overview**: id, company_id, current_status, active_modules_count, monthly_mrr, last_incident_at
- **tenant_custom_services**: id, company_id, service_code, description, status
- **tenant_requests**: id, company_id, request_type, title, details, status, priority, assigned_to
- **marketing_campaigns**: id, company_id, campaign_type, channel, provider_code, status, budget, content_template
- **marketing_audiences**: id, company_id, source, filters, size_estimate
- **founder_reports**: id, report_code, title, report_type, scope, generated_by, payload
- **founder_commands**: id, command_text, parsed_intent, target_scope, status, executed_by
- **internal_offers**: id, offer_code, audience_rule, content, status
- **abandoned_signups**: id, email, source, status

### Capabilities
tenant_control, services_control, pages_control, integration_control, subscription_control, support_complaints, ai_usage_review, internal_marketing, external_marketing, reports_engine

## Section 13: Business Modules — Required Tables
### Finance
invoices, invoice_lines/items, payments, tax_rates/settings, chart_of_accounts/general_ledger, journal_entries, journal_lines, payroll_runs/payroll, payroll_items, advances

### HR
employees, employee_documents, attendance/attendance_logs, leave_requests, benefits, insurance_claims, job_posts, job_applications, training_courses, training_assignments, training_attempts

### CRM
clients, leads, opportunities, quotes, contracts, receipts

### Projects
projects, project_members, tasks, task_comments, work_logs

### Logistics
vehicles, drivers, routes, shipments, delivery_tasks/logistics_tasks, gps_tracks, location_pings

### Store
products, product_variants, inventory_items, inventory_movements, warehouses, pos_sessions, pos_orders, pos_order_items, customer_orders/orders, order_items, store_customers

### Collaboration
chat_channels/chats, chat_members, chat_messages, presence_status, meeting_rooms, meeting_sessions, meeting_transcripts, meeting_summaries

### Audit & Security
audit_logs, security_events, api_request_logs, webhook_events

### Workflow & Documents
approval_workflows, approval_workflow_steps, approval_requests, document_templates, generated_documents, custom_field_definitions, entity_custom_values, notifications, notification_templates, notification_delivery_logs, retention_policies, data_exports

## Section 14: Execution Mappings (Page → API → DB → Permission)
| Page | API | DB Tables | Permission |
|------|-----|-----------|------------|
| employee_dashboard | GET /api/v1/dashboard/employee | profiles, company_members, notifications | dashboard.view |
| attendance_page | GET/POST /api/v1/hr/attendance | attendance_logs, employees | attendance.read/create |
| leave_requests | GET/POST /api/v1/hr/leaves | leave_requests, employees | leave.read/create/approve |
| payroll | GET/POST /api/v1/accounting/payroll | payroll_runs, payroll_items | payroll.read/manage |
| crm_leads | GET/POST /api/v1/crm/leads | leads, opportunities, clients | crm.leads.read/write |
| projects | GET/POST /api/v1/projects | projects, tasks, work_logs | projects.read/tasks.manage |
| logistics | GET /api/v1/logistics/shipments | shipments, drivers, gps_tracks | logistics.read |
| store_pos | POST /api/v1/store/pos/orders | pos_sessions, pos_orders | pos.sell |
| client_portal | GET /api/v1/client/overview | client_portal_users, contracts, invoices | client.portal.read |
| founder_tenants | GET /api/v1/founder/tenants | companies, company_modules, subscriptions | founder.tenants.read |
| integrations_hub | GET/POST /api/v1/integrations/* | integration_providers, company_integrations | integrations.manage |
| rare_ai_center | POST /api/v1/ai/rare | ai_usage_logs, ai_action_policies | ai.use |

## Section 15: Domain Events
### Required Tables
- **domain_events**: id, event_name, entity_type, entity_id, company_id, actor_user_id, event_payload, correlation_id, causation_id
- **analytics_events**: id, event_name, category, company_id, user_id, page, payload
- **event_subscriptions**: id, event_name, consumer_code, active
- **search_index**: id, company_id, entity_type, entity_id, text, metadata

### Event Taxonomy
company.created/activated/suspended/churned, user.invited/accepted/logged_in/out, module.enabled/disabled, integration.connected/disconnected, invoice.created/paid, subscription.started/renewed/payment_failed, lead/opportunity/task.created, task.completed, meeting.summarized, chat.message.sent, ai.action.executed/rejected, provisioning.started/completed/failed/rollback_*

## Section 16: API Contracts
- OpenAPI spec for every route
- Versioning under `/v1`
- Unified error model: code/message/details/correlation_id
- Idempotency keys for sensitive operations
- Pagination: page/limit/cursor
- Auth: Bearer/OTP/OAuth with scopes

## Section 17-19: Operations, Monitoring, Scaling
(See full blueprint CSV for detailed runbooks, metrics, alerts, and scaling strategies)

## Section 20-21: Deliverables & Implementation Order
1. Schema + normalization + permission model
2. Provisioning + rollback + pricing estimate
3. Billing + entitlements + usage meters
4. Integrations metadata + catalog + connect flows
5. AI policy layer + usage logs + confirmation rules
6. Web/Mobile mappings + module shells
7. Founder OS operational + reports + marketing
8. Domain events + analytics taxonomy + search index
9. Observability + runbooks + alerting
10. Scaling / caching / DR readiness

## Permission Matrix (Key Permissions)
| Permission | Founder | PlatformAdmin | CompanyGM | DeptMgr | HROfficer | Accountant | Employee | Client |
|------------|---------|---------------|-----------|---------|-----------|------------|----------|--------|
| dashboard.view | Y | Y | Y | Y | Y | Y | Y | Y |
| company.manage | - | - | Y | - | - | - | - | - |
| members.manage | - | - | Y | - | Y | - | - | - |
| hr.view/write | - | - | Y | Y | Y | - | - | - |
| accounting.view/write | - | - | Y | - | - | Y | - | - |
| crm.view/write | - | - | Y | Y | - | - | - | Y(view) |
| projects.view/write | - | - | Y | Y | - | - | Y(view) | - |
| ai.general | Y | Y | Y | Y | Y | Y | Y | Y |
| ai.sensitive | Y | Y | Y | - | Y | Y | - | - |
| founder.control | Y | Y | - | - | - | - | - | - |
