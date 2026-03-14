// ============================================================================
// ZIEN Platform — Knowledge Graph
// Maps: Module → Features → Screens → Workflows → Roles → Permissions
// ============================================================================

import type { ModuleNode, WorkflowNode } from './types';

export const KNOWLEDGE_GRAPH: ModuleNode[] = [
  // ─── 1. Onboarding ──────────────────────────────────────────────────────
  {
    code: 'onboarding',
    name_en: 'Onboarding & Provisioning',
    name_ar: 'التهيئة والإعداد',
    features: [
      {
        code: 'company-registration',
        name_en: 'Company Registration',
        name_ar: 'تسجيل الشركة',
        screens: ['/register'],
        workflows: [
          {
            code: 'wf.onboarding.register',
            name_en: 'Company Registration Flow',
            name_ar: 'تسجيل شركة جديدة',
            steps: ['company_info', 'gm_account', 'select_modules', 'upload_docs', 'choose_plan', 'confirm'],
            required_permissions: [],
            required_roles: [],
          },
        ],
      },
      {
        code: 'provisioning',
        name_en: 'Tenant Provisioning',
        name_ar: 'تهيئة المستأجر',
        screens: ['/register'],
        workflows: [
          {
            code: 'wf.onboarding.provision',
            name_en: 'Automated Provisioning Pipeline',
            name_ar: 'خط تهيئة تلقائي',
            steps: ['validate_blueprint', 'apply_modules', 'seed_data', 'activate_company'],
            required_permissions: [],
            required_roles: ['company_gm'],
          },
        ],
      },
      {
        code: 'demo-creation',
        name_en: 'Demo Environment',
        name_ar: 'بيئة تجريبية',
        screens: ['/'],
        workflows: [
          {
            code: 'wf.onboarding.demo',
            name_en: 'Create Demo Company',
            name_ar: 'إنشاء شركة تجريبية',
            steps: ['fill_form', 'start_provisioning', 'wait_completion', 'enter_dashboard'],
            required_permissions: [],
            required_roles: [],
          },
        ],
      },
    ],
  },

  // ─── 2. Access & Roles ──────────────────────────────────────────────────
  {
    code: 'access',
    name_en: 'Access & Roles',
    name_ar: 'الوصول والأدوار',
    features: [
      {
        code: 'authentication',
        name_en: 'Authentication',
        name_ar: 'المصادقة',
        screens: ['/login'],
        workflows: [
          {
            code: 'wf.access.login',
            name_en: 'User Login',
            name_ar: 'تسجيل الدخول',
            steps: ['enter_credentials', 'verify_auth', 'load_profile', 'redirect_dashboard'],
            required_permissions: [],
            required_roles: [],
          },
          {
            code: 'wf.access.oauth',
            name_en: 'Social Login (Google/GitHub)',
            name_ar: 'دخول اجتماعي',
            steps: ['choose_provider', 'oauth_redirect', 'callback', 'create_or_link_profile'],
            required_permissions: [],
            required_roles: [],
          },
        ],
      },
      {
        code: 'rbac',
        name_en: 'Role-Based Access Control',
        name_ar: 'التحكم بالوصول حسب الدور',
        screens: ['/owner', '/dashboard'],
        workflows: [
          {
            code: 'wf.access.assign-role',
            name_en: 'Assign Role to Member',
            name_ar: 'تعيين دور لعضو',
            steps: ['select_member', 'choose_role', 'confirm_permissions', 'save'],
            required_permissions: ['admin_panel'],
            required_roles: ['company_gm', 'assistant_gm'],
          },
        ],
      },
      {
        code: 'invitations',
        name_en: 'Team Invitations',
        name_ar: 'دعوات الفريق',
        screens: ['/dashboard'],
        workflows: [
          {
            code: 'wf.access.invite',
            name_en: 'Invite Team Member',
            name_ar: 'دعوة عضو فريق',
            steps: ['enter_email', 'select_role', 'send_invitation', 'accept_link', 'join_company'],
            required_permissions: ['manage_employees'],
            required_roles: ['company_gm', 'assistant_gm', 'hr_officer'],
          },
        ],
      },
    ],
  },

  // ─── 3. Accounting ──────────────────────────────────────────────────────
  {
    code: 'accounting',
    name_en: 'Accounting & Finance',
    name_ar: 'المحاسبة والمالية',
    features: [
      {
        code: 'invoices',
        name_en: 'Invoices',
        name_ar: 'الفواتير',
        screens: ['/dashboard/accounting', '/dashboard/accounting/invoices'],
        workflows: [
          {
            code: 'wf.accounting.invoice-cycle',
            name_en: 'Invoice Lifecycle',
            name_ar: 'دورة حياة الفاتورة',
            steps: ['create_invoice', 'add_items', 'calculate_tax', 'send_to_client', 'record_payment', 'journal_entry'],
            required_permissions: ['manage_invoices'],
            required_roles: ['accountant', 'company_gm'],
          },
        ],
      },
      {
        code: 'journal-entries',
        name_en: 'Journal Entries',
        name_ar: 'القيود اليومية',
        screens: ['/dashboard/accounting/journal'],
        workflows: [
          {
            code: 'wf.accounting.journal',
            name_en: 'Double-Entry Journal',
            name_ar: 'قيد يومي مزدوج',
            steps: ['select_accounts', 'enter_debit_credit', 'verify_balance', 'post_entry'],
            required_permissions: ['manage_invoices'],
            required_roles: ['accountant', 'company_gm'],
          },
        ],
      },
      {
        code: 'chart-of-accounts',
        name_en: 'Chart of Accounts',
        name_ar: 'دليل الحسابات',
        screens: ['/dashboard/accounting/chart'],
        workflows: [
          {
            code: 'wf.accounting.coa',
            name_en: 'Manage Chart of Accounts',
            name_ar: 'إدارة دليل الحسابات',
            steps: ['view_tree', 'add_account', 'set_type', 'assign_parent'],
            required_permissions: ['manage_invoices'],
            required_roles: ['accountant', 'company_gm'],
          },
        ],
      },
      {
        code: 'vat-tax',
        name_en: 'VAT & Tax Management',
        name_ar: 'إدارة الضريبة',
        screens: ['/dashboard/accounting/tax'],
        workflows: [
          {
            code: 'wf.accounting.vat',
            name_en: 'VAT Calculation & Filing',
            name_ar: 'حساب وتقديم الضريبة',
            steps: ['configure_tax_rates', 'auto_calculate_on_invoice', 'generate_tax_report', 'file_return'],
            required_permissions: ['manage_invoices', 'view_reports'],
            required_roles: ['accountant', 'company_gm'],
          },
        ],
      },
      {
        code: 'financial-reports',
        name_en: 'Financial Reports',
        name_ar: 'التقارير المالية',
        screens: ['/dashboard/accounting/reports'],
        workflows: [
          {
            code: 'wf.accounting.reports',
            name_en: 'Generate Financial Reports',
            name_ar: 'إنشاء التقارير المالية',
            steps: ['select_report_type', 'choose_period', 'generate', 'export_pdf'],
            required_permissions: ['view_reports'],
            required_roles: ['accountant', 'company_gm', 'assistant_gm'],
          },
        ],
      },
    ],
  },

  // ─── 4. HR ──────────────────────────────────────────────────────────────
  {
    code: 'hr',
    name_en: 'Human Resources',
    name_ar: 'الموارد البشرية',
    features: [
      {
        code: 'employees',
        name_en: 'Employee Management',
        name_ar: 'إدارة الموظفين',
        screens: ['/dashboard/hr', '/dashboard/hr/employees'],
        workflows: [
          {
            code: 'wf.hr.onboard-employee',
            name_en: 'Employee Onboarding',
            name_ar: 'تهيئة موظف جديد',
            steps: ['create_profile', 'assign_department', 'set_role', 'upload_documents', 'send_welcome'],
            required_permissions: ['manage_employees'],
            required_roles: ['hr_officer', 'department_manager', 'company_gm'],
          },
        ],
      },
      {
        code: 'attendance',
        name_en: 'Attendance Tracking',
        name_ar: 'تتبع الحضور',
        screens: ['/dashboard/hr/attendance', '/portal'],
        workflows: [
          {
            code: 'wf.hr.clock-in-out',
            name_en: 'Clock In/Out',
            name_ar: 'تسجيل حضور/انصراف',
            steps: ['clock_in', 'work_shift', 'clock_out', 'calculate_hours'],
            required_permissions: ['view_attendance'],
            required_roles: ['employee', 'hr_officer'],
          },
        ],
      },
      {
        code: 'leave',
        name_en: 'Leave Management',
        name_ar: 'إدارة الإجازات',
        screens: ['/dashboard/hr/leave', '/portal'],
        workflows: [
          {
            code: 'wf.hr.leave-request',
            name_en: 'Leave Request Cycle',
            name_ar: 'دورة طلب إجازة',
            steps: ['submit_request', 'manager_review', 'approve_or_reject', 'update_balance'],
            required_permissions: ['manage_leave'],
            required_roles: ['employee', 'department_manager', 'hr_officer'],
          },
        ],
      },
      {
        code: 'payroll',
        name_en: 'Payroll',
        name_ar: 'الرواتب',
        screens: ['/dashboard/hr/payroll', '/portal'],
        workflows: [
          {
            code: 'wf.hr.payroll-run',
            name_en: 'Monthly Payroll Run',
            name_ar: 'تشغيل الرواتب الشهري',
            steps: ['calculate_gross', 'apply_deductions', 'calculate_net', 'generate_slips', 'process_payment'],
            required_permissions: ['manage_employees'],
            required_roles: ['hr_officer', 'accountant', 'company_gm'],
          },
        ],
      },
    ],
  },

  // ─── 5. CRM ─────────────────────────────────────────────────────────────
  {
    code: 'crm',
    name_en: 'CRM & Sales',
    name_ar: 'المبيعات وعلاقات العملاء',
    features: [
      {
        code: 'leads',
        name_en: 'Lead Management',
        name_ar: 'إدارة العملاء المحتملين',
        screens: ['/dashboard/crm', '/dashboard/crm/leads'],
        workflows: [
          {
            code: 'wf.crm.lead-pipeline',
            name_en: 'Lead to Deal Pipeline',
            name_ar: 'تحويل عميل محتمل لصفقة',
            steps: ['capture_lead', 'qualify', 'assign_rep', 'follow_up', 'convert_to_deal'],
            required_permissions: ['manage_fleet'],
            required_roles: ['sales_rep', 'supervisor', 'company_gm'],
          },
        ],
      },
      {
        code: 'deals',
        name_en: 'Deal Pipeline',
        name_ar: 'خط الصفقات',
        screens: ['/dashboard/crm/deals'],
        workflows: [
          {
            code: 'wf.crm.deal-cycle',
            name_en: 'Deal Lifecycle',
            name_ar: 'دورة حياة الصفقة',
            steps: ['create_deal', 'send_quote', 'negotiate', 'close_won_lost', 'generate_invoice'],
            required_permissions: ['manage_fleet'],
            required_roles: ['sales_rep', 'supervisor', 'company_gm'],
          },
        ],
      },
      {
        code: 'quotes-contracts',
        name_en: 'Quotes & Contracts',
        name_ar: 'العروض والعقود',
        screens: ['/dashboard/crm/quotes', '/client'],
        workflows: [
          {
            code: 'wf.crm.quote-to-contract',
            name_en: 'Quote to Contract',
            name_ar: 'من عرض السعر إلى العقد',
            steps: ['create_quote', 'client_review', 'approve_quote', 'generate_contract', 'sign'],
            required_permissions: ['manage_invoices'],
            required_roles: ['sales_rep', 'company_gm'],
          },
        ],
      },
    ],
  },

  // ─── 6. Integrations ────────────────────────────────────────────────────
  {
    code: 'integrations',
    name_en: 'Integrations & APIs',
    name_ar: 'التكاملات والربط',
    features: [
      {
        code: 'payment-gateways',
        name_en: 'Payment Gateways',
        name_ar: 'بوابات الدفع',
        screens: ['/dashboard/integrations'],
        workflows: [
          {
            code: 'wf.integrations.connect-stripe',
            name_en: 'Connect Stripe',
            name_ar: 'ربط Stripe',
            steps: ['open_catalog', 'select_stripe', 'enter_keys', 'test_connection', 'activate'],
            required_permissions: ['manage_integrations'],
            required_roles: ['company_gm', 'assistant_gm'],
          },
        ],
      },
      {
        code: 'communication',
        name_en: 'Communication Services',
        name_ar: 'خدمات الاتصال',
        screens: ['/dashboard/integrations'],
        workflows: [
          {
            code: 'wf.integrations.connect-whatsapp',
            name_en: 'Connect WhatsApp',
            name_ar: 'ربط WhatsApp',
            steps: ['open_catalog', 'select_whatsapp', 'configure_webhook', 'test_message', 'activate'],
            required_permissions: ['manage_integrations'],
            required_roles: ['company_gm', 'assistant_gm'],
          },
        ],
      },
      {
        code: 'maps-location',
        name_en: 'Maps & Location',
        name_ar: 'الخرائط والمواقع',
        screens: ['/dashboard/integrations'],
        workflows: [
          {
            code: 'wf.integrations.connect-maps',
            name_en: 'Enable Google Maps',
            name_ar: 'تفعيل خرائط Google',
            steps: ['open_catalog', 'select_maps', 'enter_api_key', 'configure_geofences', 'activate'],
            required_permissions: ['manage_integrations'],
            required_roles: ['company_gm'],
          },
        ],
      },
    ],
  },

  // ─── 7. Store & POS ─────────────────────────────────────────────────────
  {
    code: 'store',
    name_en: 'Store & POS',
    name_ar: 'المتجر ونقاط البيع',
    features: [
      {
        code: 'products',
        name_en: 'Product Management',
        name_ar: 'إدارة المنتجات',
        screens: ['/dashboard/store'],
        workflows: [
          {
            code: 'wf.store.add-product',
            name_en: 'Add Product to Catalog',
            name_ar: 'إضافة منتج للكتالوج',
            steps: ['create_product', 'set_variants', 'set_price', 'upload_images', 'publish'],
            required_permissions: ['manage_inventory'],
            required_roles: ['company_gm', 'supervisor'],
          },
        ],
      },
      {
        code: 'inventory',
        name_en: 'Inventory Management',
        name_ar: 'إدارة المخزون',
        screens: ['/dashboard/store'],
        workflows: [
          {
            code: 'wf.store.stock-management',
            name_en: 'Stock In/Out',
            name_ar: 'إدخال/إخراج المخزون',
            steps: ['receive_stock', 'update_inventory', 'set_reorder_level', 'auto_alert'],
            required_permissions: ['manage_inventory'],
            required_roles: ['company_gm', 'supervisor'],
          },
        ],
      },
      {
        code: 'orders',
        name_en: 'Order Processing',
        name_ar: 'معالجة الطلبات',
        screens: ['/dashboard/store'],
        workflows: [
          {
            code: 'wf.store.order-cycle',
            name_en: 'Order to Fulfillment',
            name_ar: 'من الطلب للتسليم',
            steps: ['receive_order', 'confirm', 'pick_pack', 'ship', 'deliver', 'invoice'],
            required_permissions: ['manage_inventory'],
            required_roles: ['company_gm', 'supervisor', 'employee'],
          },
        ],
      },
      {
        code: 'pos',
        name_en: 'Point of Sale',
        name_ar: 'نقطة البيع',
        screens: ['/dashboard/store'],
        workflows: [
          {
            code: 'wf.store.pos-sale',
            name_en: 'POS Sale Transaction',
            name_ar: 'معاملة بيع نقطة البيع',
            steps: ['open_session', 'scan_items', 'apply_discount', 'process_payment', 'print_receipt', 'close_session'],
            required_permissions: ['manage_inventory'],
            required_roles: ['employee', 'supervisor'],
          },
        ],
      },
    ],
  },

  // ─── 8. RARE AI ─────────────────────────────────────────────────────────
  {
    code: 'rare-ai',
    name_en: 'RARE AI',
    name_ar: 'الذكاء الاصطناعي RARE',
    features: [
      {
        code: 'rare-help',
        name_en: 'Help Mode',
        name_ar: 'وضع المساعدة',
        screens: ['/dashboard/rare'],
        workflows: [
          {
            code: 'wf.rare.ask-help',
            name_en: 'Ask for Help',
            name_ar: 'طلب مساعدة',
            steps: ['open_chat', 'type_question', 'ai_searches_kb', 'ai_responds', 'rate_answer'],
            required_permissions: [],
            required_roles: ['employee'],
          },
        ],
      },
      {
        code: 'rare-analyze',
        name_en: 'Analyze Mode',
        name_ar: 'وضع التحليل',
        screens: ['/dashboard/rare'],
        workflows: [
          {
            code: 'wf.rare.analyze',
            name_en: 'AI Data Analysis',
            name_ar: 'تحليل بيانات بالذكاء الاصطناعي',
            steps: ['select_agent', 'describe_analysis', 'ai_queries_data', 'ai_generates_report'],
            required_permissions: ['view_reports'],
            required_roles: ['accountant', 'hr_officer', 'company_gm'],
          },
        ],
      },
      {
        code: 'rare-act',
        name_en: 'Act Mode',
        name_ar: 'وضع التنفيذ',
        screens: ['/dashboard/rare'],
        workflows: [
          {
            code: 'wf.rare.act',
            name_en: 'AI Automated Action',
            name_ar: 'تنفيذ تلقائي بالذكاء الاصطناعي',
            steps: ['describe_task', 'ai_confirms_action', 'user_approves', 'ai_executes', 'audit_log'],
            required_permissions: ['ai_full_access'],
            required_roles: ['company_gm', 'department_manager'],
          },
        ],
      },
      {
        code: 'maestro',
        name_en: 'Maestro Auto-Routing',
        name_ar: 'التوجيه التلقائي Maestro',
        screens: ['/dashboard/rare'],
        workflows: [
          {
            code: 'wf.rare.maestro',
            name_en: 'Maestro Classification & Routing',
            name_ar: 'تصنيف وتوجيه Maestro',
            steps: ['user_asks', 'classify_intent', 'select_agent', 'execute', 'return_response'],
            required_permissions: [],
            required_roles: ['employee'],
          },
        ],
      },
      {
        code: 'senate',
        name_en: 'Senate Multi-Model Deliberation',
        name_ar: 'مداولة Senate متعددة النماذج',
        screens: ['/dashboard/rare'],
        workflows: [
          {
            code: 'wf.rare.senate',
            name_en: 'Multi-Model Deliberation',
            name_ar: 'مداولة متعددة النماذج',
            steps: ['describe_strategic_question', 'gemini_primary_analysis', 'gpt4_counter_opinion', 'synthesize', 'present_decision'],
            required_permissions: ['ai_full_access'],
            required_roles: ['founder', 'platform_admin'],
          },
        ],
      },
    ],
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────

export function getModuleByCode(code: string): ModuleNode | undefined {
  return KNOWLEDGE_GRAPH.find(m => m.code === code);
}

export function getAllWorkflows(): { module: string; workflow: WorkflowNode }[] {
  const results: { module: string; workflow: WorkflowNode }[] = [];
  for (const mod of KNOWLEDGE_GRAPH) {
    for (const feature of mod.features) {
      for (const wf of feature.workflows) {
        results.push({ module: mod.code, workflow: wf });
      }
    }
  }
  return results;
}

export function getWorkflowsForRole(role: string): WorkflowNode[] {
  const results: WorkflowNode[] = [];
  for (const mod of KNOWLEDGE_GRAPH) {
    for (const feature of mod.features) {
      for (const wf of feature.workflows) {
        if (wf.required_roles.length === 0 || wf.required_roles.includes(role)) {
          results.push(wf);
        }
      }
    }
  }
  return results;
}

export function getScreensForModule(moduleCode: string): string[] {
  const mod = getModuleByCode(moduleCode);
  if (!mod) return [];
  const screens = new Set<string>();
  for (const feature of mod.features) {
    for (const s of feature.screens) screens.add(s);
  }
  return Array.from(screens);
}
