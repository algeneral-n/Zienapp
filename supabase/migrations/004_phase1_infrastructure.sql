-- ============================================================================
-- ZIEN Platform — Phase 1 Infrastructure: Templates + Marketing + Visibility + Notifications
-- Migration: 004_phase1_infrastructure.sql
-- Date: 2026-03-10
-- Description:
--   1. Document Templates system (templates, categories, renders)
--   2. Marketing Enhancements (assets, attribution, events)
--   3. Visibility scope columns on sensitive tables
--   4. Smart notification rules + routing
--   5. Approval workflow enhancements (SLA columns)
--   6. Chat channel enhancements (type, department_code, auto_join)
--   7. RLS for all new tables
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1: DOCUMENT TEMPLATES SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════════

-- Template categories
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tc_select" ON template_categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "tc_manage" ON template_categories
  FOR ALL TO authenticated USING (is_founder());

-- Seed default categories
INSERT INTO template_categories (code, name_en, name_ar, icon, sort_order) VALUES
  ('invoice', 'Invoices', 'الفواتير', 'receipt', 1),
  ('quote', 'Quotes & Proposals', 'العروض والمقترحات', 'request_quote', 2),
  ('contract', 'Contracts', 'العقود', 'handshake', 3),
  ('receipt', 'Receipts', 'الإيصالات', 'receipt_long', 4),
  ('email', 'Emails', 'البريد الإلكتروني', 'email', 5),
  ('letter', 'Letters', 'الخطابات', 'mail', 6),
  ('report', 'Reports', 'التقارير', 'assessment', 7),
  ('brochure', 'Brochures', 'البروشورات', 'menu_book', 8),
  ('certificate', 'Certificates', 'الشهادات', 'workspace_premium', 9),
  ('payslip', 'Payslips', 'كشوف المرتبات', 'payments', 10),
  ('hr_form', 'HR Forms', 'نماذج الموارد البشرية', 'description', 11),
  ('marketing', 'Marketing Materials', 'المواد التسويقية', 'campaign', 12)
ON CONFLICT (code) DO NOTHING;

-- Document templates
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = platform-wide
    category_code TEXT NOT NULL REFERENCES template_categories(code),
    code TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    body_html TEXT NOT NULL, -- HTML template with {{variables}}
    body_css TEXT, -- Optional CSS
    header_html TEXT, -- Template header
    footer_html TEXT, -- Template footer
    variables JSONB DEFAULT '[]', -- [{key, label_en, label_ar, type, default}]
    page_size TEXT DEFAULT 'A4', -- A4, Letter, Custom
    orientation TEXT DEFAULT 'portrait', -- portrait, landscape
    margins JSONB DEFAULT '{"top":20,"right":15,"bottom":20,"left":15}',
    is_default BOOLEAN DEFAULT false,
    is_rtl BOOLEAN DEFAULT false,
    language TEXT DEFAULT 'en',
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    preview_image_url TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, code)
);

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dt_select" ON document_templates
  FOR SELECT TO authenticated
  USING (
    company_id IS NULL -- platform templates visible to all
    OR is_company_member(company_id)
    OR is_platform_admin()
  );
CREATE POLICY "dt_insert" ON document_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    (company_id IS NULL AND is_platform_admin())
    OR (company_id IS NOT NULL AND is_company_member(company_id))
  );
CREATE POLICY "dt_update" ON document_templates
  FOR UPDATE TO authenticated
  USING (
    (company_id IS NULL AND is_platform_admin())
    OR (company_id IS NOT NULL AND is_company_member(company_id))
  );
CREATE POLICY "dt_delete" ON document_templates
  FOR DELETE TO authenticated
  USING (
    (company_id IS NULL AND is_platform_admin())
    OR (company_id IS NOT NULL AND is_company_admin(company_id))
  );

-- Template renders (generated documents from templates)
CREATE TABLE IF NOT EXISTS template_renders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES document_templates(id),
    reference_type TEXT, -- 'invoice', 'quote', 'contract', 'payslip', etc.
    reference_id UUID, -- ID of the source record
    rendered_html TEXT NOT NULL,
    rendered_data JSONB DEFAULT '{}', -- Variable values used
    file_url TEXT, -- Generated PDF URL (Cloudflare R2)
    file_size_bytes BIGINT,
    language TEXT DEFAULT 'en',
    status TEXT DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'sent', 'failed')),
    sent_to TEXT, -- Email/WhatsApp/print destination
    sent_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE template_renders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tr_select" ON template_renders
  FOR SELECT TO authenticated
  USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "tr_insert" ON template_renders
  FOR INSERT TO authenticated
  WITH CHECK (is_company_member(company_id));
CREATE POLICY "tr_update" ON template_renders
  FOR UPDATE TO authenticated
  USING (is_company_member(company_id));

-- Seed platform-wide default templates
INSERT INTO document_templates (company_id, category_code, code, name_en, name_ar, body_html, variables, is_default, language) VALUES
-- Invoice template (EN)
(NULL, 'invoice', 'invoice_standard_en', 'Standard Invoice', 'فاتورة قياسية',
 '<div class="invoice"><div class="header"><img src="{{company_logo}}" class="logo"/><div class="company-info"><h1>{{company_name}}</h1><p>{{company_address}}</p><p>Tax ID: {{tax_id}}</p></div></div><div class="invoice-meta"><h2>INVOICE #{{invoice_number}}</h2><p>Date: {{invoice_date}}</p><p>Due: {{due_date}}</p></div><div class="bill-to"><h3>Bill To:</h3><p>{{client_name}}</p><p>{{client_address}}</p><p>{{client_email}}</p></div><table class="items"><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>{{#items}}<tr><td>{{index}}</td><td>{{description}}</td><td>{{quantity}}</td><td>{{unit_price}}</td><td>{{total}}</td></tr>{{/items}}</tbody></table><div class="totals"><p>Subtotal: {{subtotal}}</p><p>Tax ({{tax_rate}}%): {{tax_amount}}</p><p class="grand-total">Total: {{grand_total}} {{currency}}</p></div><div class="footer"><p>{{payment_terms}}</p><p>{{bank_details}}</p></div></div>',
 '[{"key":"company_name","label_en":"Company Name","label_ar":"اسم الشركة","type":"text"},{"key":"company_logo","label_en":"Logo URL","label_ar":"شعار الشركة","type":"url"},{"key":"company_address","label_en":"Company Address","label_ar":"عنوان الشركة","type":"text"},{"key":"tax_id","label_en":"Tax ID","label_ar":"الرقم الضريبي","type":"text"},{"key":"invoice_number","label_en":"Invoice #","label_ar":"رقم الفاتورة","type":"text"},{"key":"invoice_date","label_en":"Date","label_ar":"التاريخ","type":"date"},{"key":"due_date","label_en":"Due Date","label_ar":"تاريخ الاستحقاق","type":"date"},{"key":"client_name","label_en":"Client Name","label_ar":"اسم العميل","type":"text"},{"key":"client_address","label_en":"Client Address","label_ar":"عنوان العميل","type":"text"},{"key":"client_email","label_en":"Client Email","label_ar":"بريد العميل","type":"email"},{"key":"items","label_en":"Line Items","label_ar":"البنود","type":"array"},{"key":"subtotal","label_en":"Subtotal","label_ar":"المجموع الفرعي","type":"number"},{"key":"tax_rate","label_en":"Tax Rate","label_ar":"نسبة الضريبة","type":"number"},{"key":"tax_amount","label_en":"Tax Amount","label_ar":"مبلغ الضريبة","type":"number"},{"key":"grand_total","label_en":"Grand Total","label_ar":"الإجمالي","type":"number"},{"key":"currency","label_en":"Currency","label_ar":"العملة","type":"text","default":"AED"}]',
 true, 'en'),

-- Invoice template (AR)
(NULL, 'invoice', 'invoice_standard_ar', 'فاتورة قياسية', 'فاتورة قياسية',
 '<div class="invoice rtl" dir="rtl"><div class="header"><img src="{{company_logo}}" class="logo"/><div class="company-info"><h1>{{company_name}}</h1><p>{{company_address}}</p><p>الرقم الضريبي: {{tax_id}}</p></div></div><div class="invoice-meta"><h2>فاتورة #{{invoice_number}}</h2><p>التاريخ: {{invoice_date}}</p><p>الاستحقاق: {{due_date}}</p></div><div class="bill-to"><h3>فاتورة إلى:</h3><p>{{client_name}}</p><p>{{client_address}}</p><p>{{client_email}}</p></div><table class="items"><thead><tr><th>#</th><th>الوصف</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead><tbody>{{#items}}<tr><td>{{index}}</td><td>{{description}}</td><td>{{quantity}}</td><td>{{unit_price}}</td><td>{{total}}</td></tr>{{/items}}</tbody></table><div class="totals"><p>المجموع الفرعي: {{subtotal}}</p><p>الضريبة ({{tax_rate}}%): {{tax_amount}}</p><p class="grand-total">الإجمالي: {{grand_total}} {{currency}}</p></div><div class="footer"><p>{{payment_terms}}</p><p>{{bank_details}}</p></div></div>',
 '[{"key":"company_name","label_en":"Company Name","label_ar":"اسم الشركة","type":"text"},{"key":"invoice_number","label_en":"Invoice #","label_ar":"رقم الفاتورة","type":"text"},{"key":"client_name","label_en":"Client","label_ar":"العميل","type":"text"},{"key":"items","label_en":"Items","label_ar":"البنود","type":"array"},{"key":"grand_total","label_en":"Total","label_ar":"الإجمالي","type":"number"},{"key":"currency","label_en":"Currency","label_ar":"العملة","type":"text","default":"ر.س"}]',
 true, 'ar'),

-- Quote template
(NULL, 'quote', 'quote_standard_en', 'Standard Quote', 'عرض سعر قياسي',
 '<div class="quote"><div class="header"><img src="{{company_logo}}" class="logo"/><h1>{{company_name}}</h1></div><h2>QUOTATION #{{quote_number}}</h2><p>Date: {{quote_date}} | Valid Until: {{valid_until}}</p><div class="to"><h3>To: {{client_name}}</h3><p>{{client_address}}</p></div><table class="items"><thead><tr><th>#</th><th>Item</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>{{#items}}<tr><td>{{index}}</td><td>{{item}}</td><td>{{description}}</td><td>{{quantity}}</td><td>{{unit_price}}</td><td>{{total}}</td></tr>{{/items}}</tbody></table><div class="totals"><p>Subtotal: {{subtotal}}</p><p>Discount: {{discount}}</p><p>Tax: {{tax_amount}}</p><p class="grand-total">Total: {{grand_total}} {{currency}}</p></div><div class="terms"><h3>Terms & Conditions</h3><p>{{terms}}</p></div><div class="signature"><p>Authorized Signature: _______________</p></div></div>',
 '[{"key":"company_name","label_en":"Company","label_ar":"الشركة","type":"text"},{"key":"quote_number","label_en":"Quote #","label_ar":"رقم العرض","type":"text"},{"key":"client_name","label_en":"Client","label_ar":"العميل","type":"text"},{"key":"items","label_en":"Items","label_ar":"البنود","type":"array"},{"key":"grand_total","label_en":"Total","label_ar":"الإجمالي","type":"number"}]',
 true, 'en'),

-- Contract template
(NULL, 'contract', 'contract_standard_en', 'Standard Service Contract', 'عقد خدمات قياسي',
 '<div class="contract"><h1>SERVICE CONTRACT</h1><p>Contract #: {{contract_number}}</p><p>Date: {{contract_date}}</p><hr/><h2>Between</h2><p><strong>{{company_name}}</strong> ("Service Provider")</p><p>Address: {{company_address}}</p><p>AND</p><p><strong>{{client_name}}</strong> ("Client")</p><p>Address: {{client_address}}</p><hr/><h2>1. Scope of Services</h2><p>{{scope_of_services}}</p><h2>2. Duration</h2><p>Start Date: {{start_date}} | End Date: {{end_date}}</p><h2>3. Compensation</h2><p>Total Value: {{total_value}} {{currency}}</p><p>Payment Terms: {{payment_terms}}</p><h2>4. Terms & Conditions</h2><p>{{terms_and_conditions}}</p><h2>5. Termination</h2><p>{{termination_clause}}</p><div class="signatures"><div class="sig-block"><p>Service Provider</p><p>Name: {{sp_signer_name}}</p><p>Date: _______________</p><p>Signature: _______________</p></div><div class="sig-block"><p>Client</p><p>Name: {{client_signer_name}}</p><p>Date: _______________</p><p>Signature: _______________</p></div></div></div>',
 '[{"key":"contract_number","label_en":"Contract #","label_ar":"رقم العقد","type":"text"},{"key":"company_name","label_en":"Company","label_ar":"الشركة","type":"text"},{"key":"client_name","label_en":"Client","label_ar":"العميل","type":"text"},{"key":"scope_of_services","label_en":"Services","label_ar":"الخدمات","type":"textarea"},{"key":"total_value","label_en":"Value","label_ar":"القيمة","type":"number"}]',
 true, 'en'),

-- Receipt template  
(NULL, 'receipt', 'receipt_standard_en', 'Payment Receipt', 'إيصال دفع',
 '<div class="receipt"><div class="header"><img src="{{company_logo}}" class="logo"/><h2>{{company_name}}</h2></div><h1>PAYMENT RECEIPT</h1><p>Receipt #: {{receipt_number}}</p><p>Date: {{receipt_date}}</p><hr/><p>Received from: <strong>{{client_name}}</strong></p><p>Amount: <strong>{{amount}} {{currency}}</strong></p><p>Payment Method: {{payment_method}}</p><p>Reference: {{reference_number}}</p><p>For: {{description}}</p><hr/><p>Received by: {{received_by}}</p></div>',
 '[{"key":"receipt_number","label_en":"Receipt #","label_ar":"رقم الإيصال","type":"text"},{"key":"client_name","label_en":"Client","label_ar":"العميل","type":"text"},{"key":"amount","label_en":"Amount","label_ar":"المبلغ","type":"number"},{"key":"currency","label_en":"Currency","label_ar":"العملة","type":"text","default":"AED"}]',
 true, 'en'),

-- Payslip template
(NULL, 'payslip', 'payslip_standard_en', 'Employee Payslip', 'كشف مرتب',
 '<div class="payslip"><div class="header"><img src="{{company_logo}}" class="logo"/><h2>{{company_name}}</h2><h1>PAYSLIP</h1></div><div class="meta"><p>Period: {{pay_period}}</p><p>Pay Date: {{pay_date}}</p></div><div class="employee"><h3>Employee Details</h3><p>Name: {{employee_name}}</p><p>ID: {{employee_id}}</p><p>Department: {{department}}</p><p>Position: {{position}}</p></div><table class="earnings"><thead><tr><th>Earnings</th><th>Amount</th></tr></thead><tbody><tr><td>Basic Salary</td><td>{{basic_salary}}</td></tr><tr><td>Housing Allowance</td><td>{{housing_allowance}}</td></tr><tr><td>Transport Allowance</td><td>{{transport_allowance}}</td></tr><tr><td>Other Allowances</td><td>{{other_allowances}}</td></tr><tr class="total"><td>Total Earnings</td><td>{{total_earnings}}</td></tr></tbody></table><table class="deductions"><thead><tr><th>Deductions</th><th>Amount</th></tr></thead><tbody><tr><td>Social Insurance</td><td>{{social_insurance}}</td></tr><tr><td>Tax</td><td>{{tax_deduction}}</td></tr><tr><td>Advances</td><td>{{advances}}</td></tr><tr><td>Other Deductions</td><td>{{other_deductions}}</td></tr><tr class="total"><td>Total Deductions</td><td>{{total_deductions}}</td></tr></tbody></table><div class="net-pay"><h2>Net Pay: {{net_pay}} {{currency}}</h2></div></div>',
 '[{"key":"employee_name","label_en":"Employee","label_ar":"الموظف","type":"text"},{"key":"pay_period","label_en":"Period","label_ar":"الفترة","type":"text"},{"key":"basic_salary","label_en":"Basic","label_ar":"الأساسي","type":"number"},{"key":"net_pay","label_en":"Net Pay","label_ar":"صافي الراتب","type":"number"}]',
 true, 'en'),

-- Email notification template
(NULL, 'email', 'email_notification_en', 'System Notification', 'إشعار النظام',
 '<div class="email" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;"><div class="header" style="background:#2563eb;color:white;padding:20px;text-align:center;"><img src="{{platform_logo}}" height="40"/><h2>{{subject}}</h2></div><div class="body" style="padding:20px;background:#f8fafc;"><p>{{greeting}},</p><div>{{message_body}}</div>{{#action_url}}<div style="text-align:center;margin:20px 0;"><a href="{{action_url}}" style="background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">{{action_label}}</a></div>{{/action_url}}</div><div class="footer" style="padding:15px;text-align:center;font-size:12px;color:#94a3b8;"><p>© {{year}} Zien AI Platform</p><p>{{unsubscribe_text}}</p></div></div>',
 '[{"key":"subject","label_en":"Subject","label_ar":"الموضوع","type":"text"},{"key":"greeting","label_en":"Greeting","label_ar":"التحية","type":"text"},{"key":"message_body","label_en":"Message","label_ar":"الرسالة","type":"html"},{"key":"action_url","label_en":"Action URL","label_ar":"رابط الإجراء","type":"url"},{"key":"action_label","label_en":"Button Text","label_ar":"نص الزر","type":"text"}]',
 true, 'en')
ON CONFLICT (company_id, code) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2: MARKETING ENHANCEMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Marketing creative assets
CREATE TABLE IF NOT EXISTS marketing_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = platform
    campaign_id UUID,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'copy', 'html', 'pdf')),
    title TEXT NOT NULL,
    file_url TEXT,
    content TEXT, -- For copy/html
    dimensions TEXT, -- e.g., '1200x628'
    format TEXT, -- 'jpg', 'png', 'mp4', etc.
    language TEXT DEFAULT 'en',
    variant_label TEXT, -- 'A', 'B', 'C' for A/B testing
    is_ai_generated BOOLEAN DEFAULT false,
    ai_prompt TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ma_select" ON marketing_assets
  FOR SELECT TO authenticated
  USING (
    company_id IS NULL AND is_platform_admin()
    OR company_id IS NOT NULL AND is_company_member(company_id)
    OR is_platform_admin()
  );
CREATE POLICY "ma_manage" ON marketing_assets
  FOR ALL TO authenticated
  USING (
    (company_id IS NULL AND is_platform_admin())
    OR (company_id IS NOT NULL AND is_company_member(company_id))
  );

-- Marketing attribution tracking
CREATE TABLE IF NOT EXISTS marketing_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = platform
    campaign_id UUID,
    source TEXT NOT NULL, -- 'google', 'meta', 'email', 'direct', 'referral'
    medium TEXT, -- 'cpc', 'organic', 'email', 'social'
    click_id TEXT, -- UTM click tracking
    landing_page TEXT,
    visitor_id TEXT,
    conversion_type TEXT, -- 'signup', 'demo', 'subscription', 'purchase'
    conversion_value NUMERIC DEFAULT 0,
    converted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mattr_select" ON marketing_attribution
  FOR SELECT TO authenticated
  USING (
    (company_id IS NULL AND is_platform_admin())
    OR (company_id IS NOT NULL AND is_company_member(company_id))
    OR is_platform_admin()
  );
CREATE POLICY "mattr_insert" ON marketing_attribution
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Attribution events can come from any context

-- Marketing events (lifecycle tracking)
CREATE TABLE IF NOT EXISTS marketing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    campaign_id UUID,
    event_type TEXT NOT NULL CHECK (event_type IN (
      'created', 'scheduled', 'launched', 'paused', 'resumed',
      'completed', 'cancelled', 'budget_changed', 'audience_changed',
      'creative_updated', 'api_error', 'policy_rejected', 'approval_required'
    )),
    actor_id UUID,
    details JSONB DEFAULT '{}',
    provider TEXT, -- 'meta', 'google', 'email', 'whatsapp'
    provider_response JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "me_select" ON marketing_events
  FOR SELECT TO authenticated
  USING (
    (company_id IS NULL AND is_platform_admin())
    OR (company_id IS NOT NULL AND is_company_member(company_id))
    OR is_platform_admin()
  );
CREATE POLICY "me_insert" ON marketing_events
  FOR INSERT TO authenticated
  WITH CHECK (is_company_member(company_id) OR is_platform_admin());


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 3: VISIBILITY SCOPE ON SENSITIVE TABLES + MISSING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Company settings KV store (for AI policies, feature flags, etc.)
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, key)
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_select" ON company_settings
  FOR SELECT TO authenticated
  USING (is_company_member(company_id) OR is_platform_admin());
CREATE POLICY "cs_manage" ON company_settings
  FOR ALL TO authenticated
  USING (is_company_admin(company_id) OR is_platform_admin());

-- Enhance departments table: add name_ar, parent_code, sort_order
DO $$ BEGIN
  ALTER TABLE departments ADD COLUMN IF NOT EXISTS name_ar TEXT;
  ALTER TABLE departments ADD COLUMN IF NOT EXISTS parent_code TEXT;
  ALTER TABLE departments ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Add UNIQUE(company_id, code) on departments if not exists
DO $$ BEGIN
  ALTER TABLE departments ADD CONSTRAINT departments_company_code_unique UNIQUE(company_id, code);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

-- Add UNIQUE(company_id, name) on chat_channels for upsert support
DO $$ BEGIN
  ALTER TABLE chat_channels ADD CONSTRAINT chat_channels_company_name_unique UNIQUE(company_id, name);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

-- Add visibility_scope to tasks (if not exists)
DO $$ BEGIN
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS visibility_scope TEXT DEFAULT 'project'
    CHECK (visibility_scope IN ('self', 'team', 'department', 'project', 'company'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Add visibility_scope to employee_documents
DO $$ BEGIN
  ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS visibility_scope TEXT DEFAULT 'self'
    CHECK (visibility_scope IN ('self', 'department', 'company', 'restricted_roles'));
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Add department_id to tasks (for dept scoping - if not exists)
DO $$ BEGIN
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
EXCEPTION WHEN undefined_table THEN NULL; WHEN duplicate_column THEN NULL; END $$;

-- Add department_id to company_members (if not exists)
DO $$ BEGIN
  ALTER TABLE company_members ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
EXCEPTION WHEN undefined_table THEN NULL; WHEN duplicate_column THEN NULL; END $$;

-- Enhance chat_channels: expand channel_type + add new columns
DO $$ BEGIN
  -- Drop old CHECK constraint on channel_type (original had direct/group/department/announcement)
  ALTER TABLE chat_channels DROP CONSTRAINT IF EXISTS chat_channels_channel_type_check;
  -- Add expanded CHECK allowing all channel taxonomy types
  ALTER TABLE chat_channels ADD CONSTRAINT chat_channels_channel_type_check
    CHECK (channel_type IN ('direct', 'group', 'department', 'announcement',
      'announcements', 'company', 'project', 'incident', 'dm', 'restricted', 'academy', 'support'));
  -- New columns
  ALTER TABLE chat_channels ADD COLUMN IF NOT EXISTS department_code TEXT;
  ALTER TABLE chat_channels ADD COLUMN IF NOT EXISTS auto_join_roles TEXT[]; -- roles that auto-join
  ALTER TABLE chat_channels ADD COLUMN IF NOT EXISTS write_roles TEXT[]; -- roles allowed to write
  ALTER TABLE chat_channels ADD COLUMN IF NOT EXISTS is_readonly BOOLEAN DEFAULT false;
EXCEPTION WHEN undefined_table THEN NULL; WHEN duplicate_column THEN NULL; END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 4: SMART NOTIFICATION RULES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = platform
    event_type TEXT NOT NULL, -- 'approval_created', 'invoice_pending', 'leave_request', 'sla_breach', etc.
    module_code TEXT,
    target_scope TEXT NOT NULL CHECK (target_scope IN ('individual', 'role', 'department', 'company', 'channel')),
    target_value TEXT NOT NULL, -- user_id, role_code, department_code, or channel_code
    delivery_channels TEXT[] DEFAULT ARRAY['in_app'], -- 'in_app', 'email', 'push', 'sms', 'whatsapp', 'chat'
    message_template_en TEXT,
    message_template_ar TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_active BOOLEAN DEFAULT true,
    conditions JSONB DEFAULT '{}', -- Extra conditions like amount > X
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, event_type, target_scope, target_value)
);

ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nr_select" ON notification_rules
  FOR SELECT TO authenticated
  USING (
    company_id IS NULL OR is_company_member(company_id) OR is_platform_admin()
  );
CREATE POLICY "nr_manage" ON notification_rules
  FOR ALL TO authenticated
  USING (
    (company_id IS NULL AND is_platform_admin())
    OR (company_id IS NOT NULL AND is_company_admin(company_id))
  );

-- Seed default notification rules (platform-wide)
INSERT INTO notification_rules (company_id, event_type, module_code, target_scope, target_value, delivery_channels, message_template_en, message_template_ar, priority) VALUES
  (NULL, 'approval_created', 'hr', 'role', 'department_manager', ARRAY['in_app', 'email'], 'New approval request: {{subject}}', 'طلب موافقة جديد: {{subject}}', 'high'),
  (NULL, 'approval_sla_breach', 'hr', 'role', 'company_gm', ARRAY['in_app', 'email', 'push'], 'SLA breach: {{subject}} pending for {{hours}}h', 'تجاوز SLA: {{subject}} معلق منذ {{hours}} ساعة', 'urgent'),
  (NULL, 'leave_request', 'hr', 'role', 'hr_officer', ARRAY['in_app', 'chat'], 'Leave request from {{employee_name}}', 'طلب إجازة من {{employee_name}}', 'normal'),
  (NULL, 'invoice_pending', 'accounting', 'role', 'accountant', ARRAY['in_app', 'chat'], 'Invoice draft pending: {{invoice_number}}', 'فاتورة معلقة: {{invoice_number}}', 'high'),
  (NULL, 'payroll_ready', 'hr', 'role', 'company_gm', ARRAY['in_app', 'email'], 'Payroll run ready for approval', 'الرواتب جاهزة للموافقة', 'high'),
  (NULL, 'integration_failed', 'integrations', 'role', 'company_gm', ARRAY['in_app', 'email', 'push'], 'Integration "{{integration_name}}" failed', 'فشل التكامل "{{integration_name}}"', 'urgent'),
  (NULL, 'billing_past_due', 'billing', 'role', 'company_gm', ARRAY['in_app', 'email'], 'Payment overdue: {{amount}} {{currency}}', 'دفعة متأخرة: {{amount}} {{currency}}', 'urgent'),
  (NULL, 'new_employee_joined', 'hr', 'channel', 'company-general', ARRAY['chat'], '{{employee_name}} has joined the team!', 'انضم {{employee_name}} للفريق!', 'low'),
  (NULL, 'task_overdue', 'projects', 'individual', '{{assigned_to}}', ARRAY['in_app', 'push'], 'Task "{{task_title}}" is overdue', 'المهمة "{{task_title}}" متأخرة', 'high'),
  (NULL, 'meeting_reminder', 'meetings', 'individual', '{{participant_id}}', ARRAY['in_app', 'push'], 'Meeting "{{meeting_title}}" in {{minutes}} min', 'اجتماع "{{meeting_title}}" بعد {{minutes}} دقيقة', 'normal')
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 5: APPROVAL WORKFLOW ENHANCEMENTS (add SLA + delegation columns)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enhance approval_steps with SLA hours
DO $$ BEGIN
  ALTER TABLE approval_steps ADD COLUMN IF NOT EXISTS sla_hours INTEGER DEFAULT 48;
  ALTER TABLE approval_steps ADD COLUMN IF NOT EXISTS auto_action TEXT CHECK (auto_action IN ('approve', 'reject', 'escalate'));
  ALTER TABLE approval_steps ADD COLUMN IF NOT EXISTS condition_json JSONB; -- {field, op, value} for conditional steps
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Enhance approval_requests with more tracking
DO $$ BEGIN
  ALTER TABLE approval_requests ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;
  ALTER TABLE approval_requests ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;
  ALTER TABLE approval_requests ADD COLUMN IF NOT EXISTS escalated_to UUID;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Enhance approval_actions with delegation support
DO $$ BEGIN
  ALTER TABLE approval_actions ADD COLUMN IF NOT EXISTS delegated_from UUID;
  ALTER TABLE approval_actions ADD COLUMN IF NOT EXISTS delegation_id UUID;
EXCEPTION WHEN undefined_table THEN NULL; END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 6: INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_doc_templates_company ON document_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_doc_templates_category ON document_templates(category_code);
CREATE INDEX IF NOT EXISTS idx_template_renders_company ON template_renders(company_id);
CREATE INDEX IF NOT EXISTS idx_template_renders_ref ON template_renders(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_company ON marketing_assets(company_id);
CREATE INDEX IF NOT EXISTS idx_marketing_attribution_campaign ON marketing_attribution(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_campaign ON marketing_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_event ON notification_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_rules_company ON notification_rules(company_id);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_tasks_visibility ON tasks(company_id, visibility_scope);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_tasks_department ON tasks(company_id, department_id);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON chat_channels(company_id, channel_type);
EXCEPTION WHEN undefined_table THEN NULL; END $$;


COMMIT;
