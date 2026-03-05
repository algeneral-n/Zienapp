
-- Master Content Blueprint Schema for ZIEN Platform

-- 1. Knowledge Articles
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_key TEXT NOT NULL,
    summary_key TEXT NOT NULL,
    module_code TEXT NOT NULL,
    audience_roles TEXT[] DEFAULT '{}',
    required_permissions TEXT[] DEFAULT '{}',
    reading_time_min INTEGER DEFAULT 5,
    content_blocks JSONB DEFAULT '[]',
    related_articles UUID[] DEFAULT '{}',
    related_lessons UUID[] DEFAULT '{}',
    related_faqs UUID[] DEFAULT '{}',
    status TEXT DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    language TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Academy Tracks
CREATE TABLE IF NOT EXISTS academy_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_key TEXT NOT NULL,
    description_key TEXT NOT NULL,
    target_roles TEXT[] DEFAULT '{}',
    module_code TEXT NOT NULL,
    language TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Academy Courses
CREATE TABLE IF NOT EXISTS academy_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES academy_tracks(id) ON DELETE CASCADE,
    title_key TEXT NOT NULL,
    description_key TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    language TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Academy Lessons
CREATE TABLE IF NOT EXISTS academy_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES academy_courses(id) ON DELETE CASCADE,
    title_key TEXT NOT NULL,
    objective_key TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    target_roles TEXT[] DEFAULT '{}',
    prerequisites UUID[] DEFAULT '{}',
    steps JSONB DEFAULT '[]',
    quiz_id UUID,
    completion_rule JSONB DEFAULT '{}',
    language TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. FAQ Items
CREATE TABLE IF NOT EXISTS faq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    slug TEXT NOT NULL,
    question_key TEXT NOT NULL,
    short_answer_key TEXT NOT NULL,
    full_answer_key TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    role_scope TEXT[] DEFAULT '{}',
    module_code TEXT NOT NULL,
    escalation JSONB DEFAULT '{}',
    related_links JSONB DEFAULT '[]',
    language TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. AI Prompt Packs
CREATE TABLE IF NOT EXISTS ai_prompt_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code TEXT NOT NULL,
    prompt_type TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    mode TEXT NOT NULL,
    required_level INTEGER DEFAULT 1,
    inputs_schema JSONB DEFAULT '{}',
    output_schema JSONB DEFAULT '{}',
    prompt_template TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Certificates
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES academy_tracks(id) ON DELETE CASCADE,
    level TEXT NOT NULL,
    title_key TEXT NOT NULL,
    requirements JSONB DEFAULT '{}',
    verification_code_format TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Issued Certificates
CREATE TABLE IF NOT EXISTS issued_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    verification_code TEXT UNIQUE NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS for all tables
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_certificates ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Public Read for published content)
CREATE POLICY "Public read for published articles" ON knowledge_articles FOR SELECT USING (status = 'published');
CREATE POLICY "Public read for tracks" ON academy_tracks FOR SELECT USING (true);
CREATE POLICY "Public read for courses" ON academy_courses FOR SELECT USING (true);
CREATE POLICY "Public read for lessons" ON academy_lessons FOR SELECT USING (true);
CREATE POLICY "Public read for FAQs" ON faq_items FOR SELECT USING (true);
CREATE POLICY "Public read for prompt packs" ON ai_prompt_packs FOR SELECT USING (true);
CREATE POLICY "Public read for certificates" ON certificates FOR SELECT USING (true);
CREATE POLICY "User read for own certificates" ON issued_certificates FOR SELECT USING (auth.uid() = user_id);
