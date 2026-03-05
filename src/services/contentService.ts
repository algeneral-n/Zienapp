
import { supabase } from './supabase';
import { 
  KnowledgeArticle, 
  AcademyTrack, 
  AcademyCourse, 
  AcademyLesson, 
  FAQItem, 
  AIPromptPack, 
  Certificate 
} from '../types/content';

export const contentService = {
  // Knowledge Articles
  async getArticles(moduleCode?: string, language: string = 'en'): Promise<KnowledgeArticle[]> {
    let query = supabase
      .from('knowledge_articles')
      .select('*')
      .eq('language', language)
      .eq('status', 'published');
    
    if (moduleCode) {
      query = query.eq('module_code', moduleCode);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getArticleById(id: string): Promise<KnowledgeArticle | null> {
    const { data, error } = await supabase
      .from('knowledge_articles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Academy
  async getTracks(language: string = 'en'): Promise<AcademyTrack[]> {
    const { data, error } = await supabase
      .from('academy_tracks')
      .select('*')
      .eq('language', language);
    
    if (error) throw error;
    return data || [];
  },

  async getCourses(trackId: string, language: string = 'en'): Promise<AcademyCourse[]> {
    const { data, error } = await supabase
      .from('academy_courses')
      .select('*')
      .eq('track_id', trackId)
      .eq('language', language)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getLessons(courseId: string, language: string = 'en'): Promise<AcademyLesson[]> {
    const { data, error } = await supabase
      .from('academy_lessons')
      .select('*')
      .eq('course_id', courseId)
      .eq('language', language)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // FAQ
  async getFAQs(moduleCode?: string, language: string = 'en'): Promise<FAQItem[]> {
    let query = supabase
      .from('faq_items')
      .select('*')
      .eq('language', language);
    
    if (moduleCode) {
      query = query.eq('module_code', moduleCode);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // AI Prompts
  async getPromptPacks(moduleCode?: string): Promise<AIPromptPack[]> {
    let query = supabase
      .from('ai_prompt_packs')
      .select('*');
    
    if (moduleCode) {
      query = query.eq('module_code', moduleCode);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Certificates
  async getCertificates(trackId?: string): Promise<Certificate[]> {
    let query = supabase
      .from('certificates')
      .select('*');
    
    if (trackId) {
      query = query.eq('track_id', trackId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getIssuedCertificates(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('issued_certificates')
      .select(`
        *,
        certificate:certificates(*)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }
};
