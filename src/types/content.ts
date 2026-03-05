
export type ContentStatus = 'draft' | 'published' | 'deprecated';
export type Language = 'ar' | 'en' | 'fr' | 'es' | 'de' | 'tr' | 'ru' | 'zh' | 'ja' | 'ko' | 'hi' | 'ur' | 'it' | 'pt' | 'nl';

export interface KnowledgeArticle {
  id: string;
  title_key: string;
  summary_key: string;
  module_code: string;
  audience_roles: string[];
  required_permissions: string[];
  reading_time_min: number;
  content_blocks: ContentBlock[];
  related_articles: string[];
  related_lessons: string[];
  related_faqs: string[];
  status: ContentStatus;
  version: number;
  language: Language;
  created_at: string;
  updated_at: string;
}

export interface ContentBlock {
  type: 'intro' | 'steps' | 'tables' | 'warnings' | 'best_practices' | 'troubleshooting' | 'glossary';
  body_key: string;
  data?: any;
}

export interface AcademyTrack {
  id: string;
  title_key: string;
  description_key: string;
  image?: string;
  target_roles: string[];
  module_code: string;
  language: Language;
}

export interface AcademyCourse {
  id: string;
  track_id: string;
  title_key: string;
  description_key: string;
  order_index: number;
  language: Language;
}

export interface AcademyLesson {
  id: string;
  course_id: string;
  title_key: string;
  objective_key: string;
  order_index: number;
  target_roles: string[];
  prerequisites: string[];
  steps: LessonStep[];
  quiz_id?: string;
  completion_rule: {
    video_watch?: boolean;
    quiz_score?: number;
  };
  language: Language;
}

export interface LessonStep {
  title_key: string;
  body_key: string;
  expected_result_key: string;
  common_mistake_key: string;
}

export interface FAQItem {
  id: string;
  category: string;
  slug: string;
  question_key: string;
  short_answer_key: string;
  full_answer_key: string;
  tags: string[];
  role_scope: string[];
  module_code: string;
  escalation?: {
    who_can_fix: string;
    what_to_check: string;
  };
  related_links: string[];
  language: Language;
  version: number;
}

export interface AIPromptPack {
  id: string;
  module_code: string;
  prompt_type: 'explain' | 'troubleshoot' | 'checklist' | 'generate_template' | 'compliance_check' | 'permission_check' | 'workflow_assistant' | 'data_quality_check' | 'report_summary' | 'action_plan' | 'training_plan' | 'quiz_generator';
  agent_type: string;
  mode: string;
  required_level: number;
  inputs_schema: any;
  output_schema: any;
  prompt_template: string;
}

export interface Certificate {
  id: string;
  track_id: string;
  level: 'completion' | 'role-ready' | 'specialist' | 'admin';
  title_key: string;
  requirements: {
    course_completion_pct: number;
    final_exam_score: number;
    attempts_limit: number;
    validity_days?: number;
  };
  verification_code_format: string;
}
