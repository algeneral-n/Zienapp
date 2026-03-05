-- ============================================================================
-- ZIEN Platform — Content & Knowledge System
-- Migration 00016: Knowledge Graph + Academy + FAQ + Certificates
-- ============================================================================

-- ─── 0. Missing table: help_categories (referenced by HelpCenter.tsx) ───────
CREATE TABLE IF NOT EXISTS help_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  icon TEXT DEFAULT 'HelpCircle',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 1. Knowledge Graph: Core Entities ──────────────────────────────────────

-- 1a. Knowledge Articles (replaces basic help_articles for structured content)
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                   -- e.g. "kb.accounting.invoices.v1"
  module_code TEXT NOT NULL,                   -- e.g. "accounting"
  content_id TEXT NOT NULL,                    -- groups translations together
  language TEXT NOT NULL DEFAULT 'en',         -- ar/en/fr/...
  title TEXT NOT NULL,
  summary TEXT,
  body_md TEXT,                                -- full markdown body
  reading_time_min INT DEFAULT 5,
  audience_roles TEXT[] DEFAULT '{}',          -- e.g. {"accountant","company_gm"}
  required_permissions TEXT[] DEFAULT '{}',    -- e.g. {"manage_invoices"}
  tags TEXT[] DEFAULT '{}',
  related_faqs TEXT[] DEFAULT '{}',            -- faq slugs
  related_lessons TEXT[] DEFAULT '{}',         -- lesson slugs
  related_workflows TEXT[] DEFAULT '{}',
  related_screens TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','deprecated')),
  version INT DEFAULT 1,
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  search_text TEXT,                            -- full-text search
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(content_id, language, version)
);

CREATE INDEX IF NOT EXISTS idx_ka_module ON knowledge_articles(module_code);
CREATE INDEX IF NOT EXISTS idx_ka_content_id ON knowledge_articles(content_id);
CREATE INDEX IF NOT EXISTS idx_ka_language ON knowledge_articles(language);
CREATE INDEX IF NOT EXISTS idx_ka_status ON knowledge_articles(status);
CREATE INDEX IF NOT EXISTS idx_ka_search ON knowledge_articles USING gin(to_tsvector('simple', coalesce(search_text,'')));

-- ─── 2. FAQ System ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS faq_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,                   -- e.g. "getting-started"
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  icon TEXT DEFAULT 'HelpCircle',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                   -- e.g. "faq.billing.how-to-pay.v1"
  content_id TEXT NOT NULL,                    -- groups translations
  language TEXT NOT NULL DEFAULT 'en',
  category_code TEXT NOT NULL REFERENCES faq_categories(code),
  module_code TEXT,                            -- nullable
  question TEXT NOT NULL,
  short_answer TEXT NOT NULL,
  full_answer_md TEXT,
  tags TEXT[] DEFAULT '{}',                    -- module_code, workflow_code, error_code
  role_scope TEXT[] DEFAULT '{}',              -- which roles see this
  escalation_role TEXT,                        -- who can fix
  escalation_screen TEXT,                      -- what screen to check
  related_articles TEXT[] DEFAULT '{}',        -- knowledge article slugs
  related_lessons TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','deprecated')),
  version INT DEFAULT 1,
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  search_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(content_id, language, version)
);

CREATE INDEX IF NOT EXISTS idx_faq_category ON faq_items(category_code);
CREATE INDEX IF NOT EXISTS idx_faq_module ON faq_items(module_code);
CREATE INDEX IF NOT EXISTS idx_faq_language ON faq_items(language);
CREATE INDEX IF NOT EXISTS idx_faq_status ON faq_items(status);
CREATE INDEX IF NOT EXISTS idx_faq_search ON faq_items USING gin(to_tsvector('simple', coalesce(search_text,'')));

CREATE TABLE IF NOT EXISTS faq_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id UUID REFERENCES faq_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(faq_id, user_id)
);

CREATE TABLE IF NOT EXISTS faq_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  submitted_by UUID REFERENCES profiles(id),
  question TEXT NOT NULL,
  category_code TEXT,
  language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','answered','rejected')),
  answer TEXT,
  answered_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. Academy System (enhanced) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS academy_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,                   -- e.g. "gm-essentials"
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  target_roles TEXT[] DEFAULT '{}',
  icon TEXT DEFAULT 'GraduationCap',
  color TEXT DEFAULT 'blue',
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enhance existing academy_courses (add bilingual + track link)
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES academy_tracks(id);
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS module_code TEXT;
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT '{}';
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS prerequisites TEXT[] DEFAULT '{}';
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS duration_min INT DEFAULT 30;
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;

CREATE TABLE IF NOT EXISTS academy_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  content_id TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  objective TEXT,
  body_md TEXT,
  steps JSONB DEFAULT '[]',                    -- [{step_title, step_body, expected_result, common_mistake}]
  target_roles TEXT[] DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',           -- lesson codes
  quiz_id UUID,
  sort_order INT DEFAULT 0,
  duration_min INT DEFAULT 10,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','deprecated')),
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(content_id, language, version)
);

CREATE TABLE IF NOT EXISTS academy_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES academy_lessons(id) ON DELETE SET NULL,
  course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  quiz_type TEXT DEFAULT 'lesson' CHECK (quiz_type IN ('lesson','final','diagnostic')),
  passing_score INT DEFAULT 70,
  time_limit_min INT,
  max_attempts INT DEFAULT 3,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academy_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES academy_quizzes(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice','true_false','fill_blank','scenario')),
  options JSONB DEFAULT '[]',                  -- [{text, is_correct}]
  explanation TEXT,
  points INT DEFAULT 10,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(content_id, language)
);

CREATE TABLE IF NOT EXISTS academy_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  course_id UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  progress_pct INT DEFAULT 0,
  completed_lessons TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled','in_progress','completed','dropped')),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS academy_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  quiz_id UUID NOT NULL REFERENCES academy_quizzes(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '{}',
  score INT DEFAULT 0,
  passed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ─── 4. Certificate System ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS academy_certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,                   -- e.g. "cert.accounting.completion.v1"
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  cert_level TEXT DEFAULT 'completion' CHECK (cert_level IN ('completion','role_ready','specialist','admin')),
  track_code TEXT,
  requirements JSONB NOT NULL DEFAULT '{}',    -- {course_completion_pct, final_exam_score, attempts_limit}
  validity_days INT,                           -- null = lifetime
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academy_issued_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES academy_certificate_templates(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  verification_code TEXT UNIQUE NOT NULL,
  score INT,
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_cert_verify ON academy_issued_certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_cert_user ON academy_issued_certificates(user_id);

-- ─── 5. AI Prompt Packs ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_prompt_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id TEXT UNIQUE NOT NULL,              -- e.g. "prompt.accounting.explain"
  module_code TEXT NOT NULL,
  agent_type TEXT NOT NULL,                    -- matches RARE agent types
  action_type TEXT NOT NULL,                   -- explain/troubleshoot/checklist/etc.
  mode TEXT DEFAULT 'help',                    -- help/analyze/act/report
  required_level INT DEFAULT 10,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,          -- with {{placeholders}}
  inputs_schema JSONB DEFAULT '{}',
  output_format TEXT DEFAULT 'markdown',
  example_output TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_module ON ai_prompt_packs(module_code);
CREATE INDEX IF NOT EXISTS idx_prompt_agent ON ai_prompt_packs(agent_type);

-- ─── 6. Content Relationships (Knowledge Graph edges) ──────────────────────

CREATE TABLE IF NOT EXISTS content_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,                   -- article/faq/lesson/prompt/module
  source_id TEXT NOT NULL,                     -- slug or code
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relation TEXT NOT NULL,                      -- covers/resolves/requires/references/next
  weight INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_type, source_id, target_type, target_id, relation)
);

CREATE INDEX IF NOT EXISTS idx_cr_source ON content_relations(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_cr_target ON content_relations(target_type, target_id);

-- ─── 7. RLS Policies ───────────────────────────────────────────────────────

ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_issued_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_categories ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user
CREATE POLICY "anyone_read_knowledge" ON knowledge_articles FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "anyone_read_faq_cats" ON faq_categories FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "anyone_read_faqs" ON faq_items FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "anyone_read_tracks" ON academy_tracks FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "anyone_read_lessons" ON academy_lessons FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "anyone_read_quizzes" ON academy_quizzes FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "anyone_read_questions" ON academy_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "anyone_read_cert_tpl" ON academy_certificate_templates FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "anyone_read_prompts" ON ai_prompt_packs FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "anyone_read_relations" ON content_relations FOR SELECT TO authenticated USING (true);
CREATE POLICY "anyone_read_help_cats" ON help_categories FOR SELECT TO authenticated USING (is_active = true);

-- User can manage own enrollments, attempts, votes
CREATE POLICY "user_manage_enrollment" ON academy_enrollments FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_manage_attempts" ON academy_attempts FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_manage_votes" ON faq_votes FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_submit_faq" ON faq_submissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "user_read_own_certs" ON academy_issued_certificates FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Founders can CRUD all content
CREATE POLICY "founder_manage_knowledge" ON knowledge_articles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role IN ('founder','platform_admin')));
CREATE POLICY "founder_manage_faq_cats" ON faq_categories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role IN ('founder','platform_admin')));
CREATE POLICY "founder_manage_faqs" ON faq_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role IN ('founder','platform_admin')));
CREATE POLICY "founder_manage_prompts" ON ai_prompt_packs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role IN ('founder','platform_admin')));
CREATE POLICY "founder_manage_certs" ON academy_certificate_templates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role IN ('founder','platform_admin')));
CREATE POLICY "founder_issue_certs" ON academy_issued_certificates FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role IN ('founder','platform_admin')));

-- ─── 8. Seed: FAQ Categories ────────────────────────────────────────────────

INSERT INTO faq_categories (code, name_en, name_ar, icon, sort_order) VALUES
  ('getting-started', 'Getting Started', 'البداية السريعة', 'Rocket', 1),
  ('billing', 'Billing & Subscriptions', 'الفوترة والاشتراكات', 'CreditCard', 2),
  ('security', 'Security & Access', 'الأمان والوصول', 'Shield', 3),
  ('modules', 'Modules & Features', 'الوحدات والميزات', 'Layout', 4),
  ('ai', 'RARE AI', 'الذكاء الاصطناعي RARE', 'Bot', 5),
  ('technical', 'Technical & Integrations', 'تقني وتكاملات', 'Settings', 6),
  ('hr', 'Human Resources', 'الموارد البشرية', 'Users', 7),
  ('accounting', 'Accounting & Finance', 'المحاسبة والمالية', 'Calculator', 8),
  ('crm', 'CRM & Sales', 'المبيعات وعلاقات العملاء', 'Target', 9),
  ('store', 'Store & POS', 'المتجر ونقاط البيع', 'ShoppingCart', 10)
ON CONFLICT (code) DO NOTHING;

-- ─── 9. Seed: Help Categories (for HelpCenter.tsx) ─────────────────────────

INSERT INTO help_categories (code, name_en, name_ar, icon, sort_order) VALUES
  ('getting-started', 'Getting Started', 'البداية', 'Rocket', 1),
  ('user-management', 'User Management', 'إدارة المستخدمين', 'Users', 2),
  ('billing', 'Billing', 'الفوترة', 'CreditCard', 3),
  ('modules', 'Modules', 'الوحدات', 'Layout', 4),
  ('ai', 'AI Features', 'الذكاء الاصطناعي', 'Bot', 5),
  ('support', 'Contact Support', 'تواصل مع الدعم', 'Headphones', 6)
ON CONFLICT (code) DO NOTHING;

-- ─── 10. Seed: Academy Tracks ───────────────────────────────────────────────

INSERT INTO academy_tracks (code, name_en, name_ar, description_en, description_ar, target_roles, icon, color, sort_order) VALUES
  ('platform-basics', 'Platform Essentials', 'أساسيات المنصة', 
   'Learn to navigate ZIEN, manage your company, and use core features.',
   'تعلم التنقل في ZIEN وإدارة شركتك واستخدام الميزات الأساسية.',
   '{"employee","new_hire","trainee"}', 'GraduationCap', 'blue', 1),
   
  ('gm-command', 'GM Command Center', 'مركز قيادة المدير العام',
   'Master company management, team oversight, and strategic decision-making.',
   'إتقان إدارة الشركة والإشراف على الفريق واتخاذ القرارات الاستراتيجية.',
   '{"company_gm","assistant_gm"}', 'Crown', 'purple', 2),
   
  ('accounting-pro', 'Accounting Professional', 'المحاسب المحترف',
   'Complete accounting workflow: invoices, journals, VAT, and financial reports.',
   'سير عمل المحاسبة الكامل: الفواتير والقيود والضريبة والتقارير المالية.',
   '{"accountant","finance","company_gm"}', 'Calculator', 'green', 3),
   
  ('hr-specialist', 'HR Specialist', 'متخصص الموارد البشرية',
   'Employee management, attendance, leave, payroll, and compliance.',
   'إدارة الموظفين والحضور والإجازات والرواتب والامتثال.',
   '{"hr_officer","department_manager","company_gm"}', 'Users', 'orange', 4),
   
  ('sales-crm', 'Sales & CRM Mastery', 'إتقان المبيعات وCRM',
   'Lead management, deal pipelines, quotes, and customer relationships.',
   'إدارة العملاء المحتملين وخط الأنبوب والعروض وعلاقات العملاء.',
   '{"sales_rep","supervisor","company_gm"}', 'Target', 'red', 5),
   
  ('rare-ai', 'RARE AI Academy', 'أكاديمية الذكاء الاصطناعي RARE',
   'Master all AI modes: Help, Analyze, Act, Report, Maestro, and Senate.',
   'إتقان جميع أوضاع الذكاء الاصطناعي: المساعدة والتحليل والتنفيذ والتقارير.',
   '{"employee","company_gm","accountant","hr_officer","sales_rep"}', 'Bot', 'cyan', 6),
   
  ('integrations', 'Integrations & APIs', 'التكاملات والـ APIs',
   'Connect Stripe, Google, WhatsApp, and third-party services.',
   'ربط Stripe وGoogle وWhatsApp والخدمات الخارجية.',
   '{"company_gm","assistant_gm","department_manager"}', 'Plug', 'indigo', 7),
   
  ('store-pos', 'Store & POS Operations', 'عمليات المتجر ونقاط البيع',
   'Product management, inventory, orders, and point-of-sale operations.',
   'إدارة المنتجات والمخزون والطلبات ونقاط البيع.',
   '{"store_manager","sales_rep","company_gm"}', 'ShoppingCart', 'amber', 8)
ON CONFLICT (code) DO NOTHING;
