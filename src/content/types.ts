// ============================================================================
// ZIEN Platform — Content System Types
// ============================================================================

export interface KnowledgeArticle {
  slug: string;
  content_id: string;
  module_code: string;
  title_en: string;
  title_ar: string;
  summary_en: string;
  summary_ar: string;
  body_en: string;
  body_ar: string;
  reading_time_min: number;
  audience_roles: string[];
  required_permissions: string[];
  tags: string[];
  related_faqs: string[];
  related_lessons: string[];
  related_workflows: string[];
  related_screens: string[];
  status: 'draft' | 'published' | 'deprecated';
  version: number;
}

export interface FAQCategory {
  code: string;
  name_en: string;
  name_ar: string;
  icon: string;
  sort_order: number;
}

export interface FAQItem {
  slug: string;
  content_id: string;
  category_code: string;
  module_code?: string;
  question_en: string;
  question_ar: string;
  short_answer_en: string;
  short_answer_ar: string;
  full_answer_en?: string;
  full_answer_ar?: string;
  tags: string[];
  role_scope: string[];
  escalation_role?: string;
  escalation_screen?: string;
  related_articles: string[];
  related_lessons: string[];
  status: 'draft' | 'published' | 'deprecated';
  version: number;
}

export interface AcademyTrack {
  code: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  target_roles: string[];
  icon: string;
  color: string;
  courses: string[]; // course codes
}

export interface AcademyCourse {
  code: string;
  track_code: string;
  module_code: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  target_roles: string[];
  prerequisites: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_min: number;
  icon: string;
  lessons: AcademyLesson[];
}

export interface AcademyLesson {
  code: string;
  content_id: string;
  title_en: string;
  title_ar: string;
  objective_en: string;
  objective_ar: string;
  body_en: string;
  body_ar: string;
  steps: LessonStep[];
  target_roles: string[];
  prerequisites: string[];
  duration_min: number;
  sort_order: number;
  quiz?: QuizData;
}

export interface LessonStep {
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  expected_result_en?: string;
  expected_result_ar?: string;
  common_mistake_en?: string;
  common_mistake_ar?: string;
}

export interface QuizData {
  code: string;
  title_en: string;
  title_ar: string;
  quiz_type: 'lesson' | 'final' | 'diagnostic';
  passing_score: number;
  time_limit_min?: number;
  max_attempts: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  content_id: string;
  question_en: string;
  question_ar: string;
  question_type: 'multiple_choice' | 'true_false' | 'scenario';
  options_en: { text: string; is_correct: boolean }[];
  options_ar: { text: string; is_correct: boolean }[];
  explanation_en: string;
  explanation_ar: string;
  points: number;
}

export interface CertificateTemplate {
  code: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  cert_level: 'completion' | 'role_ready' | 'specialist' | 'admin';
  track_code: string;
  requirements: {
    course_completion_pct: number;
    final_exam_score: number;
    attempts_limit?: number;
  };
  validity_days?: number;
}

export interface AIPromptPack {
  prompt_id: string;
  module_code: string;
  agent_type: string;
  action_type: string;
  mode: 'help' | 'analyze' | 'act' | 'report';
  required_level: number;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  system_prompt: string;
  user_prompt_template: string;
  inputs_schema: Record<string, string>;
  output_format: 'markdown' | 'json' | 'table';
}

// Knowledge Graph types
export interface ModuleNode {
  code: string;
  name_en: string;
  name_ar: string;
  features: FeatureNode[];
}

export interface FeatureNode {
  code: string;
  name_en: string;
  name_ar: string;
  screens: string[];
  workflows: WorkflowNode[];
}

export interface WorkflowNode {
  code: string;
  name_en: string;
  name_ar: string;
  steps: string[];
  required_permissions: string[];
  required_roles: string[];
}

export interface ContentRelation {
  source_type: 'article' | 'faq' | 'lesson' | 'prompt' | 'module';
  source_id: string;
  target_type: 'article' | 'faq' | 'lesson' | 'prompt' | 'module' | 'workflow' | 'screen';
  target_id: string;
  relation: 'covers' | 'resolves' | 'requires' | 'references' | 'next';
}
