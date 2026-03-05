import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, PlayCircle, BookOpen, Award, Search, Loader2 } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../services/supabase';

export default function Academy() {
  const { company } = useCompany();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    supabase
      .from('academy_courses')
      .select('id, title, duration_minutes, lesson_count, category')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCourses(data ?? []);
        setLoading(false);
      });
  }, [company?.id]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">ZIEN Academy</h1>
          <p className="text-sm text-zinc-500 font-medium">Master the platform with our professional educational modules.</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input type="text" placeholder="Search courses..." className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium" />
        </div>
      </div>

      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-zinc-400" /></div>}
      {!loading && courses.length === 0 && <p className="text-center text-zinc-400 text-sm py-16">No courses available yet</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {courses.map((course) => (
          <motion.div
            key={course.id}
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-800 group cursor-pointer"
          >
            <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden">
              <PlayCircle size={48} className="text-zinc-300 group-hover:text-blue-600 transition-colors relative z-10" />
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="px-2 py-1 bg-blue-600/10 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded mb-3 inline-block">
              {course.category || 'General'}
            </span>
            <h3 className="font-black uppercase tracking-tight mb-2 leading-tight">{course.title}</h3>
            <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              <div className="flex items-center gap-1"><BookOpen size={12} /> {course.lesson_count || 0} Lessons</div>
              <div className="flex items-center gap-1"><GraduationCap size={12} /> {course.duration_minutes ? `${course.duration_minutes} min` : '--'}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-zinc-900 text-white p-10 rounded-[40px] flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Earn Your ZIEN Certification</h2>
          <p className="text-zinc-400 text-sm mb-8 font-medium leading-relaxed">
            Complete the core training modules and pass the assessment to become a certified ZIEN Platform Administrator.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
            Start Certification
          </button>
        </div>
        <div className="absolute right-0 top-0 p-10 opacity-10">
          <Award size={200} />
        </div>
      </div>
    </div>
  );
}
