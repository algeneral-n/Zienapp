import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { Search, BookOpen, HelpCircle, Phone, Mail, MapPin, ChevronDown, PlayCircle, FileText, CheckCircle2, Award, GraduationCap, Loader2, X } from 'lucide-react';
import { contentService } from '../../services/contentService';
import { AcademyTrack, AcademyCourse, AcademyLesson, FAQItem } from '../../types/content';
import blueprint from '../../constants/contentBlueprint.json';

export default function AcademicPage() {
  const { language, t: translate } = useTheme();
  const [activeSection, setActiveSection] = useState<'academy' | 'faq' | 'contact'>('academy');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<AcademyTrack | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson | null>(null);
  
  // Content States
  const [tracks, setTracks] = useState<AcademyTrack[]>([]);
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try fetching from DB
        const [dbTracks, dbFaqs] = await Promise.all([
          contentService.getTracks(language),
          contentService.getFAQs(undefined, language)
        ]);

        if (dbTracks.length > 0) {
          setTracks(dbTracks);
          setFaqs(dbFaqs);
        } else {
          // Fallback to blueprint
          setTracks(blueprint.tracks.filter(t => t.language === language) as any);
          setFaqs(blueprint.faqs.filter(f => f.language === language) as any);
        }
      } catch (err) {
        console.error('Failed to fetch content:', err);
        // Fallback to blueprint on error
        setTracks(blueprint.tracks.filter(t => t.language === language) as any);
        setFaqs(blueprint.faqs.filter(f => f.language === language) as any);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [language]);

  useEffect(() => {
    if (selectedTrack) {
      const fetchCourses = async () => {
        setLoading(true);
        try {
          const dbCourses = await contentService.getCourses(selectedTrack.id, language);
          if (dbCourses.length > 0) {
            setCourses(dbCourses);
          } else {
            setCourses(blueprint.courses.filter(c => c.track_id === selectedTrack.id && c.language === language) as any);
          }
        } catch (err) {
          setCourses(blueprint.courses.filter(c => c.track_id === selectedTrack.id && c.language === language) as any);
        } finally {
          setLoading(false);
        }
      };
      fetchCourses();
    } else {
      setCourses([]);
      setSelectedCourse(null);
      setSelectedLesson(null);
    }
  }, [selectedTrack, language]);

  useEffect(() => {
    if (selectedCourse) {
      const fetchLessons = async () => {
        setLoading(true);
        try {
          const dbLessons = await contentService.getLessons(selectedCourse.id, language);
          if (dbLessons.length > 0) {
            setLessons(dbLessons);
          } else {
            setLessons(blueprint.lessons.filter(l => l.course_id === selectedCourse.id && l.language === language) as any);
          }
        } catch (err) {
          setLessons(blueprint.lessons.filter(l => l.course_id === selectedCourse.id && l.language === language) as any);
        } finally {
          setLoading(false);
        }
      };
      fetchLessons();
    } else {
      setLessons([]);
      setSelectedLesson(null);
    }
  }, [selectedCourse, language]);

  const filteredFaqs = faqs.filter(f => 
    translate(f.question_key).toLowerCase().includes(searchQuery.toLowerCase()) ||
    translate(f.short_answer_key).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{language === 'ar' ? 'المركز الأكاديمي' : 'Academic Center'}</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {language === 'ar' ? 'تعلم، ابحث عن إجابات، وتواصل معنا.' : 'Learn, find answers, and connect with us.'}
          </p>
        </div>
        
        <div className="flex bg-black/5 p-1 rounded-xl">
          {[
            { id: 'academy', label: language === 'ar' ? 'الأكاديمية' : 'Academy', icon: GraduationCap },
            { id: 'faq', label: language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ', icon: HelpCircle },
            { id: 'contact', label: language === 'ar' ? 'التواصل' : 'Contact', icon: Phone }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeSection === tab.id 
                  ? 'bg-white text-brand shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="glass-card p-6 min-h-[500px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
        )}

        {activeSection === 'academy' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {!selectedTrack ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">{language === 'ar' ? 'المسارات التعليمية' : 'Learning Tracks'}</h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder={language === 'ar' ? 'البحث في المسارات...' : 'Search tracks...'}
                      className="bg-black/5 border border-[var(--border-soft)] rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-brand" 
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tracks.map(track => (
                    <div 
                      key={track.id} 
                      onClick={() => setSelectedTrack(track)}
                      className="bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-2xl overflow-hidden hover:border-brand/30 transition-all group cursor-pointer flex flex-col"
                    >
                      <div className="h-40 relative overflow-hidden bg-brand/5 flex items-center justify-center">
                        {track.image ? (
                          <img 
                            src={track.image} 
                            alt={translate(track.title_key)} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <GraduationCap className="w-16 h-16 text-brand/20 group-hover:scale-110 transition-transform duration-500" />
                        )}
                        <div className="absolute top-3 left-3 bg-brand/10 text-brand px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                          {track.module_code}
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h4 className="font-bold mb-2 line-clamp-1">{translate(track.title_key)}</h4>
                        <p className="text-xs text-[var(--text-secondary)] mb-4 flex-1 line-clamp-2">
                          {translate(track.description_key)}
                        </p>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-soft)]">
                          <div className="flex -space-x-2">
                            {track.target_roles.slice(0, 3).map((role, i) => (
                              <div key={i} className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-bold" title={role}>
                                {role.charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <button className="text-xs font-bold text-brand hover:underline">
                            {translate('start_learning')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : !selectedCourse ? (
              <div className="space-y-6">
                <button 
                  onClick={() => setSelectedTrack(null)}
                  className="flex items-center gap-2 text-sm font-bold text-brand hover:underline mb-4"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                  {language === 'ar' ? 'العودة للمسارات' : 'Back to Tracks'}
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">{translate(selectedTrack.title_key)}</h3>
                    <p className="text-[var(--text-secondary)] text-sm">{translate(selectedTrack.description_key)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {courses.map((course, i) => (
                    <div 
                      key={course.id} 
                      onClick={() => setSelectedCourse(course)}
                      className="bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-2xl p-6 hover:border-brand/30 transition-all group cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center font-black text-xl text-brand/20">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg mb-1">{translate(course.title_key)}</h4>
                          <p className="text-xs text-[var(--text-secondary)]">{translate(course.description_key)}</p>
                        </div>
                      </div>
                      <button className="bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-hover transition-colors">
                        {translate('start_learning')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : !selectedLesson ? (
              <div className="space-y-6">
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className="flex items-center gap-2 text-sm font-bold text-brand hover:underline mb-4"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                  {language === 'ar' ? 'العودة للدورة' : 'Back to Course'}
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">{translate(selectedCourse.title_key)}</h3>
                    <p className="text-[var(--text-secondary)] text-sm">{translate(selectedCourse.description_key)}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {lessons.map((lesson, i) => (
                    <div 
                      key={lesson.id} 
                      onClick={() => setSelectedLesson(lesson)}
                      className="bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-2xl p-5 hover:border-brand/30 transition-all group cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand/5 rounded-lg flex items-center justify-center text-brand font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <h5 className="font-bold text-sm">{translate(lesson.title_key)}</h5>
                          <p className="text-[10px] text-[var(--text-secondary)]">{translate(lesson.objective_key)}</p>
                        </div>
                      </div>
                      <PlayCircle className="w-5 h-5 text-brand/40 group-hover:text-brand transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <button 
                  onClick={() => setSelectedLesson(null)}
                  className="flex items-center gap-2 text-sm font-bold text-brand hover:underline mb-4"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                  {language === 'ar' ? 'العودة للدروس' : 'Back to Lessons'}
                </button>

                <div className="bg-brand/5 p-8 rounded-[2rem] border border-brand/10">
                  <h3 className="text-3xl font-black mb-2 text-brand">{translate(selectedLesson.title_key)}</h3>
                  <p className="text-[var(--text-secondary)] font-medium">{translate(selectedLesson.objective_key)}</p>
                </div>

                <div className="space-y-12">
                  {selectedLesson.steps.map((step, i) => (
                    <div key={i} className="relative pl-12 border-l-2 border-brand/10 pb-12 last:pb-0">
                      <div className="absolute -left-[13px] top-0 w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-brand/20">
                        {i + 1}
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xl font-bold">{translate(step.title_key)}</h4>
                        <div className="text-[var(--text-secondary)] leading-relaxed bg-white dark:bg-zinc-800/50 p-6 rounded-2xl border border-[var(--border-soft)]">
                          {translate(step.body_key)}
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" /> Expected Result
                            </div>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400">{translate(step.expected_result_key)}</p>
                          </div>
                          <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl">
                            <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <X className="w-3 h-3" /> Common Mistake
                            </div>
                            <p className="text-xs text-rose-700 dark:text-rose-400">{translate(step.common_mistake_key)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-[var(--border-soft)] flex justify-between items-center">
                  <div className="text-sm font-bold text-[var(--text-secondary)]">
                    {translate(selectedLesson.title_key)}
                  </div>
                  <button className="bg-brand text-white px-8 py-4 rounded-2xl font-bold hover:bg-brand-hover transition-all shadow-xl shadow-brand/20">
                    {translate('mark_complete')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeSection === 'faq' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">{language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</h3>
              <p className="text-[var(--text-secondary)]">{language === 'ar' ? 'ابحث عن إجابات سريعة لأسئلتك.' : 'Find quick answers to your questions.'}</p>
            </div>

            <div className="relative mb-8">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder={language === 'ar' ? 'ابحث في الأسئلة الشائعة...' : 'Search FAQs...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/5 border border-[var(--border-soft)] rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-brand" 
              />
            </div>

            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="border border-[var(--border-soft)] rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold hover:bg-black/5 transition-colors"
                  >
                    <span className="flex-1">{translate(faq.question_key)}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {expandedFaq === faq.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 text-[var(--text-secondary)] text-sm leading-relaxed"
                      >
                        <div className="font-bold text-brand mb-2">{translate(faq.short_answer_key)}</div>
                        <div>{translate(faq.full_answer_key)}</div>
                        {faq.escalation && (
                          <div className="mt-4 p-3 bg-brand/5 rounded-lg border border-brand/10">
                            <div className="text-xs font-bold text-brand uppercase tracking-widest mb-1">Escalation Path</div>
                            <div className="text-xs text-[var(--text-secondary)]">
                              Contact: <span className="font-bold">{faq.escalation.who_can_fix}</span> | Check: <span className="font-bold">{faq.escalation.what_to_check}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'contact' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold mb-2">{language === 'ar' ? 'تواصل معنا' : 'Contact Support'}</h3>
              <p className="text-[var(--text-secondary)]">{language === 'ar' ? 'نحن هنا لمساعدتك. اختر طريقة التواصل المفضلة لديك.' : 'We are here to help. Choose your preferred contact method.'}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {[
                { icon: Phone, title: language === 'ar' ? 'اتصل بنا' : 'Call Us', desc: '+971 4 123 4567', action: language === 'ar' ? 'متاح 24/7' : 'Available 24/7' },
                { icon: Mail, title: language === 'ar' ? 'راسلنا' : 'Email Us', desc: 'support@zien-ai.app', action: language === 'ar' ? 'نرد خلال ساعتين' : 'Reply within 2h' },
                { icon: MapPin, title: language === 'ar' ? 'المكتب الرئيسي' : 'Head Office', desc: 'Dubai, UAE', action: language === 'ar' ? 'احجز موعداً' : 'Book Appointment' }
              ].map((item, i) => (
                <div key={i} className="bg-black/5 border border-[var(--border-soft)] rounded-2xl p-6 text-center hover:border-brand/30 transition-colors">
                  <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold mb-1">{item.title}</h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">{item.desc}</p>
                  <span className="text-xs font-bold text-brand">{item.action}</span>
                </div>
              ))}
            </div>

            <div className="bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-2xl p-6 md:p-8">
              <h4 className="font-bold text-lg mb-6">{language === 'ar' ? 'إرسال رسالة' : 'Send a Message'}</h4>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase">{language === 'ar' ? 'الموضوع' : 'Subject'}</label>
                    <input type="text" className="w-full bg-black/5 border border-[var(--border-soft)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase">{language === 'ar' ? 'القسم' : 'Department'}</label>
                    <select className="w-full bg-black/5 border border-[var(--border-soft)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand">
                      <option>HR Support</option>
                      <option>IT Support</option>
                      <option>General Inquiry</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase">{language === 'ar' ? 'الرسالة' : 'Message'}</label>
                  <textarea rows={4} className="w-full bg-black/5 border border-[var(--border-soft)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand resize-none"></textarea>
                </div>
                <button className="bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-hover transition-colors w-full md:w-auto">
                  {language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
