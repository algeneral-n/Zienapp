-- ============================================================
-- Dynamic Knowledge Base for RARE AI
-- ============================================================

-- Knowledge articles table
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  subcategory TEXT,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  body_en TEXT NOT NULL,
  body_ar TEXT,
  tags TEXT[] DEFAULT '{}',
  module TEXT,
  role_scope TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_ka_company ON knowledge_articles(company_id);
CREATE INDEX IF NOT EXISTS idx_ka_category ON knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_ka_module ON knowledge_articles(module);
CREATE INDEX IF NOT EXISTS idx_ka_tags ON knowledge_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ka_active ON knowledge_articles(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Public articles visible to everyone, company-specific visible to company members
CREATE POLICY "knowledge_read" ON knowledge_articles FOR SELECT
  USING (
    is_public = true
    OR company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

-- Company admins can manage their knowledge articles
CREATE POLICY "knowledge_manage" ON knowledge_articles FOR ALL
  USING (
    company_id IN (
      SELECT cm.company_id FROM company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.role_code IN ('company_gm', 'assistant_gm', 'executive_secretary')
    )
  );

-- Seed global FAQ articles (company_id is NULL = platform-wide)
INSERT INTO knowledge_articles (company_id, category, title_en, title_ar, body_en, body_ar, is_public, module, tags, sort_order) VALUES
  (NULL, 'faq', 'How do I register my company?', 'كيف أسجل شركتي؟',
   'Go to the registration page, fill in your company details (name, type, country, currency, employee count), select the modules you need, and complete the form. You will be redirected to your dashboard.',
   'اذهب إلى صفحة التسجيل واملأ بيانات شركتك (الاسم، النوع، الدولة، العملة، عدد الموظفين)، واختر الوحدات المطلوبة، ثم أكمل النموذج.',
   true, 'core', ARRAY['registration','onboarding','setup'], 1),

  (NULL, 'faq', 'How do I invite team members?', 'كيف أدعو أعضاء الفريق؟',
   'Navigate to Dashboard → HR → Invitations. Enter the email, select a role, and send. The invitee receives an activation link via email.',
   'انتقل إلى لوحة التحكم ← الموارد البشرية ← الدعوات. أدخل البريد واختر الدور وأرسل. سيتلقى المدعو رابط تفعيل.',
   true, 'hr', ARRAY['invitation','team','onboarding'], 2),

  (NULL, 'faq', 'What subscription plans are available?', 'ما خطط الاشتراك المتاحة؟',
   'Three tiers: Starter (up to 10 employees), Professional (up to 100, all modules), Enterprise (unlimited, custom SLA). All include RARE AI and multi-language support.',
   'ثلاث مستويات: المبتدئ (حتى 10 موظفين)، المهني (حتى 100)، المؤسسي (غير محدود). الكل يشمل RARE AI ودعم متعدد اللغات.',
   true, 'billing', ARRAY['pricing','plans','subscription'], 3),

  (NULL, 'faq', 'How does RARE AI work?', 'كيف يعمل RARE AI؟',
   'RARE operates in Chat, Analyze, Search, and Senate modes. It understands company context, analyzes cross-module data, generates reports, and answers in 15+ languages. Click the AI button at the bottom-right of any dashboard page.',
   'يعمل RARE في أوضاع المحادثة والتحليل والبحث ومجلس الشيوخ. يفهم سياق الشركة ويحلل بيانات الوحدات وينشئ التقارير ويجيب بأكثر من 15 لغة.',
   true, 'ai', ARRAY['rare','ai','assistant','help'], 4),

  (NULL, 'faq', 'Is my data secure?', 'هل بياناتي آمنة؟',
   'Yes. ZIEN uses Row-Level Security (RLS) for complete data isolation between companies. All data is encrypted at rest and in transit. We support MFA, session management, and audit logging.',
   'نعم. تستخدم ZIEN أمان مستوى الصف (RLS) لعزل البيانات بالكامل. جميع البيانات مشفرة. ندعم MFA وإدارة الجلسات وسجلات التدقيق.',
   true, 'security', ARRAY['security','privacy','data','encryption'], 5),

  (NULL, 'guide', 'HR Module Guide', 'دليل وحدة الموارد البشرية',
   'The HR module covers Employee Directory (profiles, documents, contracts), Attendance (clock-in/out, GPS, overtime), Leave Management (request/approval workflow), Payroll (salary, deductions, bonuses, tax), and HR Analytics.',
   'تغطي وحدة الموارد البشرية دليل الموظفين والحضور وإدارة الإجازات والرواتب وتحليلات الموارد البشرية.',
   true, 'hr', ARRAY['hr','payroll','attendance','leave'], 10),

  (NULL, 'guide', 'Accounting Module Guide', 'دليل وحدة المحاسبة',
   'Features include Chart of Accounts, Journal Entries, Invoicing (create, send, track, recurring), Tax Management (VAT), and Financial Reports (P&L, Balance Sheet, Cash Flow).',
   'تشمل شجرة الحسابات والقيود اليومية والفوترة وإدارة الضرائب والتقارير المالية.',
   true, 'accounting', ARRAY['accounting','finance','invoice','tax'], 11),

  (NULL, 'guide', 'CRM Module Guide', 'دليل وحدة إدارة العملاء',
   'Includes Lead Management (capture, score, assign), Sales Pipeline (Kanban), Contact Database, Deals (forecasting, revenue tracking), and Client Portal.',
   'تشمل إدارة العملاء المحتملين وخط المبيعات (كانبان) وقاعدة جهات الاتصال والصفقات وبوابة العميل.',
   true, 'crm', ARRAY['crm','sales','leads','pipeline'], 12)

ON CONFLICT DO NOTHING;
