-- ============================================================================
-- ZIEN Platform — Phase 2: Seed Packs V2
-- Migration: 005_seed_packs_v2.sql
-- Date: 2026-03-10
-- Description:
--   1. Extend seed_kind enum with channels, tasks, ai_policies
--   2. Insert 5 new seed packs: org_departments_v1, comm_channels_v1,
--      approval_workflows_v1, first_run_tasks_v1, ai_policy_defaults_v1
--   3. Link to ALL blueprints so every new company gets them
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1: EXTEND seed_kind ENUM
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add new seed_kind values: channels, tasks, ai_policies, departments
DO $$ BEGIN
  ALTER TYPE seed_kind ADD VALUE IF NOT EXISTS 'departments';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
COMMIT;
BEGIN;
DO $$ BEGIN
  ALTER TYPE seed_kind ADD VALUE IF NOT EXISTS 'channels';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
COMMIT;
BEGIN;
DO $$ BEGIN
  ALTER TYPE seed_kind ADD VALUE IF NOT EXISTS 'tasks';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
COMMIT;
BEGIN;
DO $$ BEGIN
  ALTER TYPE seed_kind ADD VALUE IF NOT EXISTS 'ai_policies';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
COMMIT;
BEGIN;
DO $$ BEGIN
  ALTER TYPE seed_kind ADD VALUE IF NOT EXISTS 'notifications';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
COMMIT;

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2: INSERT SEED PACKS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO seed_packs (code, kind, description, payload_json) VALUES

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. org_departments_v1 — Standard department structure for ANY company
-- ─────────────────────────────────────────────────────────────────────────────
('org_departments_v1', 'departments', 'Universal department structure with codes and hierarchy',
 '{
   "departments": [
     {"code": "management", "name_en": "General Management", "name_ar": "الإدارة العامة", "parent_code": null, "sort_order": 1},
     {"code": "hr", "name_en": "Human Resources", "name_ar": "الموارد البشرية", "parent_code": "management", "sort_order": 2},
     {"code": "finance", "name_en": "Finance & Accounting", "name_ar": "المالية والمحاسبة", "parent_code": "management", "sort_order": 3},
     {"code": "sales", "name_en": "Sales & Business Dev", "name_ar": "المبيعات وتطوير الأعمال", "parent_code": "management", "sort_order": 4},
     {"code": "operations", "name_en": "Operations", "name_ar": "العمليات", "parent_code": "management", "sort_order": 5},
     {"code": "it", "name_en": "IT & Technology", "name_ar": "تكنولوجيا المعلومات", "parent_code": "management", "sort_order": 6},
     {"code": "marketing", "name_en": "Marketing", "name_ar": "التسويق", "parent_code": "management", "sort_order": 7},
     {"code": "admin", "name_en": "Administration", "name_ar": "الشؤون الإدارية", "parent_code": "management", "sort_order": 8},
     {"code": "legal", "name_en": "Legal & Compliance", "name_ar": "الشؤون القانونية والامتثال", "parent_code": "management", "sort_order": 9},
     {"code": "support", "name_en": "Customer Support", "name_ar": "دعم العملاء", "parent_code": "management", "sort_order": 10}
   ],
   "default_roles_per_dept": {
     "management": ["company_gm", "assistant_gm", "secretary"],
     "hr": ["hr_officer", "employee"],
     "finance": ["accountant", "employee"],
     "sales": ["sales_rep", "employee"],
     "operations": ["supervisor", "field_employee", "driver"],
     "it": ["department_manager", "employee"],
     "marketing": ["department_manager", "employee"],
     "admin": ["secretary", "employee"],
     "legal": ["department_manager", "employee"],
     "support": ["support_agent", "employee"]
   }
 }'),

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. comm_channels_v1 — Auto-create communication channels per Channel Taxonomy
-- ─────────────────────────────────────────────────────────────────────────────
('comm_channels_v1', 'channels', 'Standard communication channels per taxonomy',
 '{
   "channels": [
     {
       "code": "company-general",
       "name_en": "Company General",
       "name_ar": "عام الشركة",
       "channel_type": "company",
       "description_en": "Company-wide announcements and discussions",
       "description_ar": "إعلانات ومناقشات على مستوى الشركة",
       "auto_join_roles": ["*"],
       "write_roles": ["company_gm", "assistant_gm", "secretary", "department_manager"],
       "is_readonly": false
     },
     {
       "code": "announcements",
       "name_en": "Announcements",
       "name_ar": "الإعلانات",
       "channel_type": "announcements",
       "description_en": "Official company announcements - read only",
       "description_ar": "إعلانات رسمية - للقراءة فقط",
       "auto_join_roles": ["*"],
       "write_roles": ["company_gm", "assistant_gm"],
       "is_readonly": true
     },
     {
       "code": "hr-general",
       "name_en": "HR Channel",
       "name_ar": "قناة الموارد البشرية",
       "channel_type": "department",
       "department_code": "hr",
       "description_en": "HR team discussions",
       "description_ar": "مناقشات فريق الموارد البشرية",
       "auto_join_roles": ["hr_officer", "company_gm"],
       "write_roles": ["hr_officer", "company_gm", "assistant_gm"],
       "is_readonly": false
     },
     {
       "code": "finance-general",
       "name_en": "Finance Channel",
       "name_ar": "قناة المالية",
       "channel_type": "department",
       "department_code": "finance",
       "description_en": "Finance team discussions",
       "description_ar": "مناقشات الفريق المالي",
       "auto_join_roles": ["accountant", "company_gm"],
       "write_roles": ["accountant", "company_gm", "assistant_gm"],
       "is_readonly": false
     },
     {
       "code": "sales-general",
       "name_en": "Sales Channel",
       "name_ar": "قناة المبيعات",
       "channel_type": "department",
       "department_code": "sales",
       "description_en": "Sales team discussions and leads",
       "description_ar": "مناقشات فريق المبيعات والعملاء المحتملين",
       "auto_join_roles": ["sales_rep", "company_gm"],
       "write_roles": ["sales_rep", "department_manager", "company_gm"],
       "is_readonly": false
     },
     {
       "code": "operations-general",
       "name_en": "Operations Channel",
       "name_ar": "قناة العمليات",
       "channel_type": "department",
       "department_code": "operations",
       "description_en": "Operations team coordination",
       "description_ar": "تنسيق فريق العمليات",
       "auto_join_roles": ["supervisor", "field_employee", "driver", "company_gm"],
       "write_roles": ["supervisor", "field_employee", "driver", "department_manager", "company_gm"],
       "is_readonly": false
     },
     {
       "code": "incidents",
       "name_en": "Incidents",
       "name_ar": "الحوادث",
       "channel_type": "incident",
       "description_en": "Urgent incident coordination",
       "description_ar": "تنسيق الحوادث العاجلة",
       "auto_join_roles": ["company_gm", "assistant_gm", "department_manager", "supervisor"],
       "write_roles": ["*"],
       "is_readonly": false
     },
     {
       "code": "academy",
       "name_en": "Academy & Training",
       "name_ar": "الأكاديمية والتدريب",
       "channel_type": "academy",
       "description_en": "Training discussions and resources",
       "description_ar": "نقاشات وموارد التدريب",
       "auto_join_roles": ["*"],
       "write_roles": ["hr_officer", "department_manager", "company_gm"],
       "is_readonly": false
     },
     {
       "code": "support-internal",
       "name_en": "Internal Support",
       "name_ar": "الدعم الداخلي",
       "channel_type": "support",
       "description_en": "Internal IT and support requests",
       "description_ar": "طلبات الدعم الداخلي وتكنولوجيا المعلومات",
       "auto_join_roles": ["*"],
       "write_roles": ["*"],
       "is_readonly": false
     }
   ]
 }'),

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. approval_workflows_v1 — Standard approval chains per module
-- ─────────────────────────────────────────────────────────────────────────────
('approval_workflows_v1', 'workflows', 'Standard approval workflows for leave, expense, invoice, payroll',
 '{
   "workflows": [
     {
       "module_code": "hr",
       "trigger_event": "leave_request",
       "name_en": "Leave Request Approval",
       "name_ar": "موافقة طلب الإجازة",
       "auto_approve_if": {"days_lte": 1, "balance_gte": "requested"},
       "steps": [
         {"step_order": 1, "approver_role": "department_manager", "sla_hours": 24, "auto_action": "escalate"},
         {"step_order": 2, "approver_role": "hr_officer", "sla_hours": 24, "auto_action": "escalate"},
         {"step_order": 3, "approver_role": "company_gm", "sla_hours": 48, "auto_action": "approve"}
       ]
     },
     {
       "module_code": "accounting",
       "trigger_event": "expense_claim",
       "name_en": "Expense Claim Approval",
       "name_ar": "موافقة مطالبة المصروفات",
       "auto_approve_if": {"amount_lte": 100, "currency": "AED"},
       "steps": [
         {"step_order": 1, "approver_role": "department_manager", "sla_hours": 24, "auto_action": "escalate"},
         {"step_order": 2, "approver_role": "accountant", "sla_hours": 24, "auto_action": "escalate"},
         {"step_order": 3, "approver_role": "company_gm", "sla_hours": 48, "auto_action": "approve"}
       ]
     },
     {
       "module_code": "accounting",
       "trigger_event": "invoice_create",
       "name_en": "Invoice Approval",
       "name_ar": "موافقة الفاتورة",
       "auto_approve_if": null,
       "steps": [
         {"step_order": 1, "approver_role": "accountant", "sla_hours": 24, "auto_action": "escalate"},
         {"step_order": 2, "approver_role": "company_gm", "sla_hours": 48, "auto_action": "approve"}
       ]
     },
     {
       "module_code": "hr",
       "trigger_event": "payroll_run",
       "name_en": "Payroll Run Approval",
       "name_ar": "موافقة دورة الرواتب",
       "auto_approve_if": null,
       "steps": [
         {"step_order": 1, "approver_role": "hr_officer", "sla_hours": 24, "auto_action": "escalate"},
         {"step_order": 2, "approver_role": "accountant", "sla_hours": 24, "auto_action": "escalate"},
         {"step_order": 3, "approver_role": "company_gm", "sla_hours": 48, "auto_action": "reject"}
       ]
     },
     {
       "module_code": "crm",
       "trigger_event": "contract_sign",
       "name_en": "Contract Approval",
       "name_ar": "موافقة العقد",
       "auto_approve_if": null,
       "steps": [
         {"step_order": 1, "approver_role": "department_manager", "sla_hours": 24, "auto_action": "escalate"},
         {"step_order": 2, "approver_role": "company_gm", "sla_hours": 48, "auto_action": "approve"}
       ]
     },
     {
       "module_code": "store",
       "trigger_event": "purchase_order",
       "name_en": "Purchase Order Approval",
       "name_ar": "موافقة أمر الشراء",
       "auto_approve_if": {"amount_lte": 500, "currency": "AED"},
       "steps": [
         {"step_order": 1, "approver_role": "department_manager", "sla_hours": 24, "auto_action": "escalate"},
         {"step_order": 2, "approver_role": "company_gm", "sla_hours": 48, "auto_action": "approve"}
       ]
     }
   ]
 }'),

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. first_run_tasks_v1 — First-7-Days onboarding tasks for new company
-- ─────────────────────────────────────────────────────────────────────────────
('first_run_tasks_v1', 'tasks', 'First 7 days onboarding tasks for new company',
 '{
   "tasks": [
     {
       "day": 1,
       "title_en": "Complete company profile",
       "title_ar": "أكمل ملف الشركة",
       "description_en": "Upload logo, set company address, configure timezone and currency",
       "description_ar": "ارفع الشعار، حدد عنوان الشركة، اضبط المنطقة الزمنية والعملة",
       "assigned_role": "company_gm",
       "module_code": "settings",
       "priority": "high",
       "category": "setup"
     },
     {
       "day": 1,
       "title_en": "Invite your team",
       "title_ar": "ادعُ فريقك",
       "description_en": "Add key team members: HR officer, accountant, department managers",
       "description_ar": "أضف أعضاء الفريق الرئيسيين: مسؤول الموارد البشرية، المحاسب، مدراء الأقسام",
       "assigned_role": "company_gm",
       "module_code": "hr",
       "priority": "high",
       "category": "setup"
     },
     {
       "day": 2,
       "title_en": "Set up departments",
       "title_ar": "أعدّ الأقسام",
       "description_en": "Review and customize automatically created departments. Add managers.",
       "description_ar": "راجع وخصّص الأقسام المنشأة تلقائياً. أضف المدراء.",
       "assigned_role": "company_gm",
       "module_code": "hr",
       "priority": "medium",
       "category": "setup"
     },
     {
       "day": 2,
       "title_en": "Configure chart of accounts",
       "title_ar": "اعدّ دليل الحسابات",
       "description_en": "Review the imported chart of accounts. Customize accounts if needed.",
       "description_ar": "راجع دليل الحسابات المستورد. خصّص الحسابات حسب الحاجة.",
       "assigned_role": "accountant",
       "module_code": "accounting",
       "priority": "medium",
       "category": "finance"
     },
     {
       "day": 3,
       "title_en": "Add employee records",
       "title_ar": "أضف سجلات الموظفين",
       "description_en": "Create employee profiles with salary, position, department, and documents.",
       "description_ar": "أنشئ ملفات الموظفين مع الراتب والمسمى الوظيفي والقسم والمستندات.",
       "assigned_role": "hr_officer",
       "module_code": "hr",
       "priority": "high",
       "category": "hr"
     },
     {
       "day": 3,
       "title_en": "Set leave policies",
       "title_ar": "حدد سياسات الإجازات",
       "description_en": "Configure annual leave, sick leave, and other leave type balances.",
       "description_ar": "اضبط أرصدة الإجازة السنوية والمرضية وأنواع الإجازات الأخرى.",
       "assigned_role": "hr_officer",
       "module_code": "hr",
       "priority": "medium",
       "category": "hr"
     },
     {
       "day": 4,
       "title_en": "Add your first clients",
       "title_ar": "أضف أول عملائك",
       "description_en": "Import or manually add 3-5 key clients to the CRM module.",
       "description_ar": "استورد أو أضف يدوياً 3-5 عملاء رئيسيين إلى وحدة CRM.",
       "assigned_role": "sales_rep",
       "module_code": "crm",
       "priority": "medium",
       "category": "crm"
     },
     {
       "day": 4,
       "title_en": "Create first invoice",
       "title_ar": "أنشئ أول فاتورة",
       "description_en": "Generate a test invoice using the template system to verify settings.",
       "description_ar": "أنشئ فاتورة اختبارية باستخدام نظام القوالب للتحقق من الإعدادات.",
       "assigned_role": "accountant",
       "module_code": "accounting",
       "priority": "low",
       "category": "finance"
     },
     {
       "day": 5,
       "title_en": "Review approval workflows",
       "title_ar": "راجع سير الموافقات",
       "description_en": "Check the auto-created approval workflows for leave, expense, invoices. Customize if needed.",
       "description_ar": "تحقق من سلاسل الموافقة المنشأة تلقائياً للإجازات والمصروفات والفواتير. خصّصها حسب الحاجة.",
       "assigned_role": "company_gm",
       "module_code": "hr",
       "priority": "medium",
       "category": "process"
     },
     {
       "day": 5,
       "title_en": "Test the chat system",
       "title_ar": "اختبر نظام المحادثات",
       "description_en": "Send a message in the company general channel. Verify team members receive it.",
       "description_ar": "أرسل رسالة في القناة العامة للشركة. تأكد من وصولها لأعضاء الفريق.",
       "assigned_role": "company_gm",
       "module_code": "chat",
       "priority": "low",
       "category": "communication"
     },
     {
       "day": 6,
       "title_en": "Explore AI assistant",
       "title_ar": "استكشف المساعد الذكي",
       "description_en": "Try asking RARE AI to generate a report, summarize data, or answer a business question.",
       "description_ar": "جرّب سؤال RARE AI لإنشاء تقرير أو تلخيص بيانات أو الإجابة على سؤال عمل.",
       "assigned_role": "company_gm",
       "module_code": "ai",
       "priority": "low",
       "category": "ai"
     },
     {
       "day": 7,
       "title_en": "Review & go live checklist",
       "title_ar": "مراجعة وقائمة البدء",
       "description_en": "Review all settings, verify data, and mark your company as fully operational.",
       "description_ar": "راجع جميع الإعدادات، تحقق من البيانات، وحدد شركتك كجاهزة للعمل بالكامل.",
       "assigned_role": "company_gm",
       "module_code": "settings",
       "priority": "high",
       "category": "setup"
     }
   ]
 }'),

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ai_policy_defaults_v1 — Default AI policy settings per company
-- ─────────────────────────────────────────────────────────────────────────────
('ai_policy_defaults_v1', 'ai_policies', 'Default AI usage policies and agent configurations',
 '{
   "policies": {
     "data_isolation": "strict",
     "cross_tenant_data": false,
     "ai_suggestions_enabled": true,
     "auto_approve_ai_actions": false,
     "max_ai_calls_per_day": 500,
     "allowed_ai_features": [
       "chat_assistant", "document_summary", "report_generation",
       "email_drafting", "invoice_extraction", "expense_categorization",
       "meeting_summary", "task_suggestions", "search"
     ],
     "restricted_ai_features": [
       "bulk_data_export", "external_api_calls", "financial_auto_approve"
     ],
     "retention_days": 90,
     "log_all_ai_interactions": true
   },
   "agents": [
     {"code": "general_assistant", "name_en": "General Assistant", "name_ar": "المساعد العام", "min_role_level": 10, "enabled": true},
     {"code": "hr_assistant", "name_en": "HR Assistant", "name_ar": "مساعد الموارد البشرية", "min_role_level": 50, "enabled": true},
     {"code": "finance_assistant", "name_en": "Finance Assistant", "name_ar": "المساعد المالي", "min_role_level": 50, "enabled": true},
     {"code": "crm_assistant", "name_en": "CRM Assistant", "name_ar": "مساعد CRM", "min_role_level": 40, "enabled": true},
     {"code": "report_generator", "name_en": "Report Generator", "name_ar": "مولد التقارير", "min_role_level": 60, "enabled": true},
     {"code": "data_analyst", "name_en": "Data Analyst", "name_ar": "محلل البيانات", "min_role_level": 70, "enabled": true},
     {"code": "email_composer", "name_en": "Email Composer", "name_ar": "كاتب البريد", "min_role_level": 30, "enabled": true},
     {"code": "meeting_summarizer", "name_en": "Meeting Summarizer", "name_ar": "ملخص الاجتماعات", "min_role_level": 40, "enabled": true}
   ],
   "rate_limits": {
     "founder": {"per_hour": 200, "per_day": 2000},
     "company_gm": {"per_hour": 100, "per_day": 1000},
     "department_manager": {"per_hour": 50, "per_day": 500},
     "employee": {"per_hour": 20, "per_day": 200},
     "client_user": {"per_hour": 10, "per_day": 100}
   }
 }')

ON CONFLICT (code) DO UPDATE SET
    kind = EXCLUDED.kind,
    description = EXCLUDED.description,
    payload_json = EXCLUDED.payload_json;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 3: LINK NEW SEED PACKS TO ALL BLUEPRINTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Link org_departments_v1 to ALL blueprints (apply order 10 = highest priority)
INSERT INTO blueprint_seed_packs (blueprint_id, seed_pack_id, apply_order)
SELECT b.id, sp.id, 10
FROM blueprints b
CROSS JOIN seed_packs sp
WHERE sp.code = 'org_departments_v1'
ON CONFLICT (blueprint_id, seed_pack_id) DO NOTHING;

-- Link comm_channels_v1 to ALL blueprints (apply order 11)
INSERT INTO blueprint_seed_packs (blueprint_id, seed_pack_id, apply_order)
SELECT b.id, sp.id, 11
FROM blueprints b
CROSS JOIN seed_packs sp
WHERE sp.code = 'comm_channels_v1'
ON CONFLICT (blueprint_id, seed_pack_id) DO NOTHING;

-- Link approval_workflows_v1 to ALL blueprints (apply order 12)
INSERT INTO blueprint_seed_packs (blueprint_id, seed_pack_id, apply_order)
SELECT b.id, sp.id, 12
FROM blueprints b
CROSS JOIN seed_packs sp
WHERE sp.code = 'approval_workflows_v1'
ON CONFLICT (blueprint_id, seed_pack_id) DO NOTHING;

-- Link first_run_tasks_v1 to ALL blueprints (apply order 20 = after setup)
INSERT INTO blueprint_seed_packs (blueprint_id, seed_pack_id, apply_order)
SELECT b.id, sp.id, 20
FROM blueprints b
CROSS JOIN seed_packs sp
WHERE sp.code = 'first_run_tasks_v1'
ON CONFLICT (blueprint_id, seed_pack_id) DO NOTHING;

-- Link ai_policy_defaults_v1 to ALL blueprints (apply order 30 = last)
INSERT INTO blueprint_seed_packs (blueprint_id, seed_pack_id, apply_order)
SELECT b.id, sp.id, 30
FROM blueprints b
CROSS JOIN seed_packs sp
WHERE sp.code = 'ai_policy_defaults_v1'
ON CONFLICT (blueprint_id, seed_pack_id) DO NOTHING;


COMMIT;
