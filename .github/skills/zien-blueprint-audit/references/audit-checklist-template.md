# Blueprint Audit Checklist Template

> Copy this template for each audit session. Fill in status for each item.

**Audit Date**: ___________  
**Section(s) Audited**: ___________  
**Auditor**: ___________

## Status Legend
- ✅ Complete — exists and matches blueprint
- 🟡 Partial — exists but incomplete
- ⚠️ Divergent — exists but different from blueprint
- ❌ Missing — not found in codebase
- ➖ Deferred — blueprint marks as `later` or `future`

---

## Schema Checklist

| Table | Status | Notes |
|-------|--------|-------|
| profiles | | |
| companies | | |
| company_members | | |
| departments | | |
| company_invitations | | |
| session_devices | | |
| client_portal_users | | |
| visitor_profiles | | |
| permissions | | |
| role_permissions | | |
| user_permission_overrides | | |
| modules_catalog | | |
| company_modules | | |
| blueprints | | |
| blueprint_modules | | |
| seed_packs | | |
| blueprint_seed_packs | | |
| provisioning_jobs | | |
| provisioning_job_steps | | |
| provisioning_rollbacks | | |
| pricing_components | | |
| pricing_tiers | | |
| company_subscriptions | | |
| usage_records | | |
| payment_events | | |
| integrations_catalog | | |
| tenant_integrations | | |
| ai_action_policies | | |
| ai_model_routing_rules | | |
| ai_usage_logs | | |
| company_ai_settings | | |
| company_documents | | |
| document_embeddings | | |
| domain_events | | |
| search_index | | |
| audit_logs | | |
| retention_policies | | |
| employees | | |
| attendance | | |
| leave_requests | | |
| payroll | | |
| clients | | |
| projects | | |
| invoices | | |
| invoice_items | | |
| payments | | |
| tax_settings | | |
| general_ledger | | |
| chats | | |
| chat_messages | | |
| logistics_tasks | | |
| vehicles | | |
| products | | |
| store_customers | | |
| orders | | |
| order_items | | |
| support_tickets | | |
| marketing_campaigns | | |
| platform_announcements | | |
| help_categories | | |
| help_articles | | |
| tenant_overview | | |
| tenant_custom_services | | |
| tenant_requests | | |
| founder_reports | | |
| founder_commands | | |
| internal_offers | | |
| abandoned_signups | | |

## API Routes Checklist

| Route | Status | Notes |
|-------|--------|-------|
| POST /api/auth/* | | |
| POST /api/provision/start | | |
| GET /api/provision/status/:id | | |
| POST /api/provision/retry/:id | | |
| POST /api/provision/rollback/:id | | |
| GET /api/provision/blueprints | | |
| POST /api/provision/estimate-price | | |
| POST /api/ai/rare | | |
| POST /api/ai/senate | | |
| GET /api/billing/* | | |
| POST /api/billing/* | | |
| GET /api/accounting/* | | |
| POST /api/accounting/* | | |
| GET /api/store/* | | |
| POST /api/store/* | | |
| GET /api/integrations/* | | |
| POST /api/integrations/connect | | |
| POST /api/integrations/disconnect | | |
| GET /api/control-room/overview | | |
| GET /api/health | | |

## Product Surfaces Checklist

| Surface | Status | Notes |
|---------|--------|-------|
| Public Landing (/) | | |
| Register (/register) | | |
| Login (/login) | | |
| Visitor Mode | | |
| Client Portal | | |
| Employee Portal | | |
| HR Module | | |
| Accounting Module | | |
| CRM Module | | |
| Projects Module | | |
| Logistics Module | | |
| Store/POS Module | | |
| Meetings/Chat Module | | |
| RARE AI Center | | |
| Founder OS | | |
| FAQ | | |
| Academy | | |
| Integrations Page | | |
| Pricing Page | | |

## Security Checklist

| Item | Status | Notes |
|------|--------|-------|
| RLS on all company_id tables | | |
| Helper functions (11 required) | | |
| Permission model (Resource.Action.Scope) | | |
| Tenant isolation | | |
| Session device tracking | | |
| Rate limiting | | |
| Turnstile/CAPTCHA | | |

## Mobile Screens Checklist

| Screen | Status | Notes |
|--------|--------|-------|
| Home | | |
| Login | | |
| Employee Portal | | |
| HR | | |
| CRM | | |
| Accounting | | |
| Projects | | |
| Logistics | | |
| Store | | |
| Meetings | | |
| Chat | | |
| Settings | | |
| AI/RARE | | |
| Academy | | |

---

## Summary

| Category | ✅ | 🟡 | ⚠️ | ❌ | ➖ |
|----------|---|---|---|---|---|
| Schema | | | | | |
| API | | | | | |
| Surfaces | | | | | |
| Security | | | | | |
| Mobile | | | | | |
| **Total** | | | | | |

## Top Priority Gaps

1. 
2. 
3. 
4. 
5. 
