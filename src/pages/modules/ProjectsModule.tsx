import React, { useEffect, useState } from 'react';
import {
  FolderKanban, CheckCircle2, Clock, AlertCircle, Plus,
  Calendar, Users, BarChart3, ArrowUpRight, Target, Loader2, X, Search
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../services/supabase';

interface Project {
  id: string;
  name: string;
  client_name?: string;
  status: string;
  progress: number;
  task_count?: number;
  task_done?: number;
  team_count?: number;
  deadline?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; style: string }> = {
  active: { label: 'Active', icon: ArrowUpRight, style: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
  on_hold: { label: 'On Hold', icon: Clock, style: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
  completed: { label: 'Completed', icon: CheckCircle2, style: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
  overdue: { label: 'Overdue', icon: AlertCircle, style: 'text-red-600 bg-red-50 dark:bg-red-500/10' },
};

export default function ProjectsModule() {
  const { company } = useCompany();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'board'>('list');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', client_name: '', deadline: '' });
  const [search, setSearch] = useState('');

  const fetchProjects = () => {
    if (!company?.id) return;
    supabase
      .from('projects')
      .select('id, name, client_name, status, progress, task_count, task_done, team_count, deadline')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setProjects((data ?? []).map((p: any) => ({
          ...p,
          progress: p.progress ?? 0,
          task_count: p.task_count ?? 0,
          task_done: p.task_done ?? 0,
          team_count: p.team_count ?? 0,
        })));
        setLoading(false);
      });
  };

  useEffect(() => { fetchProjects(); }, [company?.id]);

  const handleCreate = async () => {
    if (!company?.id || !form.name) return;
    setSaving(true);
    const { error } = await supabase.from('projects').insert({
      company_id: company.id,
      name: form.name,
      client_name: form.client_name || null,
      status: 'active',
      progress: 0,
      task_count: 0,
      task_done: 0,
      team_count: 0,
      deadline: form.deadline || null,
    });
    setSaving(false);
    if (!error) {
      setShowCreate(false);
      setForm({ name: '', client_name: '', deadline: '' });
      fetchProjects();
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  const activeCount = projects.filter(p => p.status === 'active').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const overdueCount = projects.filter(p => p.status === 'overdue').length;
  const totalTasks = projects.reduce((s, p) => s + (p.task_count ?? 0), 0);
  const doneTasks = projects.reduce((s, p) => s + (p.task_done ?? 0), 0);
  const taskPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Projects</h1>
          <p className="text-zinc-500 mt-1 text-sm">Project management, task tracking, and team collaboration</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input type="text" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-48 pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black uppercase tracking-tight">New Project</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Project name" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Client name (optional)" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} placeholder="Deadline" type="date" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
            </div>
            <button onClick={handleCreate} disabled={saving || !form.name} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all">
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Projects', value: activeCount, icon: FolderKanban, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Overdue', value: overdueCount, icon: AlertCircle, color: 'text-red-600 bg-red-50 dark:bg-red-500/10' },
          { label: 'Task Completion', value: `${taskPct}%`, icon: Target, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
        >
          List View
        </button>
        <button
          onClick={() => setView('board')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'board' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
        >
          Board View
        </button>
      </div>

      {view === 'list' && (
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-sm">No projects yet</div>
          ) : projects.map(project => {
            const sc = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active;
            const StatusIcon = sc.icon;
            return (
              <div key={project.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm">{project.name}</h3>
                    <p className="text-xs text-zinc-500">{project.client_name ?? '-'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${sc.style}`}>
                    <StatusIcon size={12} /> {sc.label}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-zinc-500">Progress</span>
                      <span className="font-bold">{project.progress}%</span>
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${project.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <CheckCircle2 size={12} /> {project.task_done ?? 0}/{project.task_count ?? 0}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Users size={12} /> {project.team_count ?? 0}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Calendar size={12} /> {project.deadline}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const filtered = projects.filter(p => p.status === status);
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${config.style}`}>{config.label}</span>
                  <span className="text-xs text-zinc-400 font-bold">{filtered.length}</span>
                </div>
                {filtered.map(p => (
                  <div key={p.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer">
                    <h4 className="font-bold text-xs mb-1">{p.name}</h4>
                    <p className="text-[10px] text-zinc-500 mb-3">{p.client_name ?? '-'}</p>
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500">
                      <span>{p.task_done ?? 0}/{p.task_count ?? 0} tasks</span>
                      <span>{p.team_count ?? 0} members</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
