import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../components/ThemeProvider';
import { BookOpen, Play, FileText, Award, ArrowRight, Clock, Star, Users, CheckCircle2, Lock, Search, Filter, X, ChevronLeft, CheckCircle, Loader2, GraduationCap } from 'lucide-react';
import { contentService } from '../../services/contentService';
import blueprint from '../../constants/contentBlueprint.json';
import { AcademyTrack, AcademyCourse, AcademyLesson } from '../../types/content';

export default function AcademyPage() {
  const { language, t: translate } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [tracks, setTracks] = useState<AcademyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<AcademyTrack | null>(null);
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<AcademyLesson | null>(null);

  React.useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const dbTracks = await contentService.getTracks(language);
        if (dbTracks.length > 0) {
          setTracks(dbTracks);
        } else {
          setTracks(blueprint.tracks.filter(t => t.language === language) as any);
        }
      } catch (err) {
        setTracks(blueprint.tracks.filter(t => t.language === language) as any);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, [language]);

  React.useEffect(() => {
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
    }
  }, [selectedTrack, language]);

  React.useEffect(() => {
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
    }
  }, [selectedCourse, language]);

  const categories = [
    { id: 'all', label: language === 'ar' ? 'الكل' : 'All Tracks' },
    { id: 'provisioning', label: language === 'ar' ? 'الإعداد' : 'Onboarding' },
    { id: 'accounting', label: language === 'ar' ? 'المحاسبة' : 'Accounting' },
    { id: 'hr', label: language === 'ar' ? 'الموارد البشرية' : 'HR' }
  ];

  const filteredTracks = tracks.filter(track => {
    const matchesCategory = activeTab === 'all' || track.module_code === activeTab;
    const matchesSearch = translate(track.title_key).toLowerCase().includes(searchQuery.toLowerCase()) || 
                          translate(track.description_key).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleStartTrack = (track: AcademyTrack) => {
    setSelectedTrack(track);
  };

  if (selectedTrack && !selectedCourse) {
    return (
      <div className="pt-24 pb-20 bg-[var(--bg-secondary)] min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          <button 
            onClick={() => setSelectedTrack(null)}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-brand font-bold mb-8 transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
            {language === 'ar' ? 'العودة للمسارات' : 'Back to Tracks'}
          </button>

          <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-xl border border-[var(--border-soft)] mb-12">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-24 h-24 bg-brand/10 text-brand rounded-[2rem] flex items-center justify-center">
                <GraduationCap className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-4xl font-black mb-4">{translate(selectedTrack.title_key)}</h1>
                <p className="text-xl text-[var(--text-secondary)] max-w-2xl">{translate(selectedTrack.description_key)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {courses.map((course, i) => (
              <div 
                key={course.id} 
                onClick={() => setSelectedCourse(course)}
                className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-[var(--border-soft)] hover:border-brand/30 transition-all group cursor-pointer flex flex-col md:flex-row justify-between items-center gap-6"
              >
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center font-black text-2xl text-brand/20">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-brand transition-colors">{translate(course.title_key)}</h3>
                    <p className="text-[var(--text-secondary)]">{translate(course.description_key)}</p>
                  </div>
                </div>
                <button className="bg-brand text-white px-8 py-4 rounded-2xl font-bold hover:bg-brand-hover transition-all shadow-xl shadow-brand/20 whitespace-nowrap">
                  {language === 'ar' ? 'عرض الدروس' : 'View Lessons'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <div className="pt-24 pb-20 bg-[var(--bg-secondary)] min-h-screen flex flex-col">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex-1 flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            <button 
              onClick={() => {
                setSelectedCourse(null);
                setActiveLesson(null);
              }}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-brand font-bold mb-6 transition-colors w-fit"
            >
              <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
              {language === 'ar' ? 'العودة للدورة' : 'Back to Course'}
            </button>

            <div className="bg-black rounded-3xl overflow-hidden aspect-video relative shadow-2xl mb-6 flex items-center justify-center">
                <div className="bg-white dark:bg-zinc-900 w-full h-full p-12 overflow-y-auto">
                  <h2 className="text-3xl font-black mb-6">{translate(activeLesson?.title_key || '')}</h2>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-xl font-medium text-brand mb-8">{translate(activeLesson?.objective_key || '')}</p>
                    <div className="space-y-8">
                      {activeLesson?.steps.map((step, i) => (
                        <div key={i} className="bg-black/5 dark:bg-white/5 p-6 rounded-2xl border border-[var(--border-soft)]">
                          <h4 className="font-bold text-lg mb-2 flex items-center gap-3">
                            <span className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs">{i + 1}</span>
                            {translate(step.title_key)}
                          </h4>
                          <p className="text-[var(--text-secondary)] mb-4">{translate(step.body_key)}</p>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-xs text-emerald-600">
                              <strong>Result:</strong> {translate(step.expected_result_key)}
                            </div>
                            <div className="bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 text-xs text-rose-600">
                              <strong>Avoid:</strong> {translate(step.common_mistake_key)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-[var(--border-soft)]">
              <h1 className="text-2xl font-black mb-2">{translate(activeLesson?.title_key || selectedCourse.title_key)}</h1>
              <p className="text-[var(--text-secondary)] mb-6">{translate(selectedCourse.description_key)}</p>
              
              <div className="flex items-center gap-4">
                <button className="bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-hover transition-colors flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {language === 'ar' ? 'اكتمال ومتابعة' : 'Complete & Continue'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar / Course Outline */}
          <div className="w-full lg:w-96 flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-xl border border-[var(--border-soft)]">
              <h3 className="font-black text-lg mb-4">{language === 'ar' ? 'محتوى الدورة' : 'Course Content'}</h3>
              
              <div className="space-y-4">
                {lessons.map((lesson, i) => (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                      activeLesson?.id === lesson.id 
                        ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                        activeLesson?.id === lesson.id ? 'bg-white/20' : 'bg-black/5'
                      }`}>
                        {i + 1}
                      </div>
                      <span className="text-sm font-bold truncate max-w-[180px]">{translate(lesson.title_key)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 pb-20 bg-[var(--bg-secondary)] min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-hover via-brand to-black text-white py-20 px-6 relative overflow-hidden rounded-b-[3rem] shadow-2xl mb-12 mx-4 mt-4">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/library/1920/1080')] opacity-10 mix-blend-overlay bg-cover bg-center"></div>
        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-bold mb-6 shadow-lg">
              <Award className="w-4 h-4 text-yellow-400" />
              {language === 'ar' ? 'شهادات معتمدة من ZIEN' : 'ZIEN Certified Professional'}
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight drop-shadow-lg">
              {language === 'ar' ? 'أكاديمية ZIEN' : 'ZIEN Academy'}
            </h1>
            <p className="text-xl text-brand-light mb-8 max-w-xl leading-relaxed drop-shadow-md">
              {language === 'ar' 
                ? 'ارتقِ بمهاراتك، وتعلم كيفية إدارة مؤسستك بذكاء، واحصل على شهادات احترافية معتمدة في إدارة الأعمال الرقمية.' 
                : 'Elevate your skills, learn to manage your enterprise intelligently, and earn certified professional credentials in digital business management.'}
            </p>
          </div>
          
          {/* Featured Course Card */}
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500 cursor-pointer" onClick={() => tracks[0] && handleStartTrack(tracks[0])}>
              <div className="relative rounded-2xl overflow-hidden aspect-video mb-6 group">
                <img src="https://picsum.photos/seed/business/800/600" alt="Featured" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-xl">
                    <Play className="w-8 h-8 text-white fill-current ml-1" />
                  </div>
                </div>
                <div className="absolute top-4 left-4 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                  {language === 'ar' ? 'دورة مميزة' : 'Featured'}
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">{language === 'ar' ? 'التحول الرقمي للشركات المتوسطة' : 'Digital Transformation for Mid-Market'}</h3>
              <div className="flex items-center gap-4 text-sm text-brand-light mb-6">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 4 Hours</span>
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-current" /> 4.9</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-white dark:bg-zinc-900 p-4 rounded-3xl shadow-xl border border-[var(--border-soft)]">
          <div className="flex overflow-x-auto pb-2 md:pb-0 w-full md:w-auto gap-2 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-md ${
                  activeTab === cat.id 
                    ? 'bg-brand text-white' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-[var(--text-secondary)] hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'ابحث عن دورة...' : 'Search courses...'}
              className="w-full bg-zinc-100 dark:bg-zinc-800 border-none py-3 pl-12 pr-4 rounded-full outline-none focus:ring-2 focus:ring-brand transition-all font-medium shadow-inner"
            />
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredTracks.map((track) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={track.id}
                className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden border border-[var(--border-soft)] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={track.image || `https://picsum.photos/seed/${track.module_code}/800/600`} 
                    alt={translate(track.title_key)} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <span className="bg-brand text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      {track.module_code}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-3 line-clamp-2 leading-tight group-hover:text-brand transition-colors">
                    {translate(track.title_key)}
                  </h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-6 line-clamp-2 leading-relaxed">
                    {translate(track.description_key)}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-[var(--border-soft)]">
                    <button 
                      onClick={() => handleStartTrack(track)}
                      className="w-full py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                    >
                      {language === 'ar' ? 'ابدأ المسار' : 'Start Track'} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredTracks.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-[var(--border-soft)] mt-8">
            <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{language === 'ar' ? 'لا توجد نتائج' : 'No results found'}</h3>
            <p className="text-[var(--text-secondary)]">
              {language === 'ar' ? 'حاول استخدام كلمات مفتاحية مختلفة للبحث.' : 'Try adjusting your search or filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
