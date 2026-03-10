import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Truck, MapPin, ClipboardList, Settings,
  Navigation, Package, Clock, AlertCircle, Loader2, X, Plus,
  CheckCircle2, ArrowRight, User
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../services/supabase';

// ─── Tasks ──────────────────────────────────────────────────────────────
const TaskFollowUp = () => {
  const { company } = useCompany();
  const [tasks, setTasks] = useState<any[]>([]);
  const [driverCount, setDriverCount] = useState({ active: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', distance_km: '', load_kg: '', eta: '' });

  const fetchTasks = () => {
    if (!company?.id) return;
    Promise.all([
      supabase
        .from('logistics_tasks')
        .select('id, title, status, assigned_to, eta, progress, distance_km, load_kg, profiles(full_name)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('vehicles')
        .select('id, status')
        .eq('company_id', company.id),
    ]).then(([taskRes, vehRes]) => {
      setTasks(taskRes.data ?? []);
      const vehicles = vehRes.data ?? [];
      setDriverCount({ active: vehicles.filter((v: any) => v.status === 'active').length, total: vehicles.length });
      setLoading(false);
    });
  };

  useEffect(() => { fetchTasks(); }, [company?.id]);

  const handleCreate = async () => {
    if (!company?.id || !form.title) return;
    setSaving(true);
    const { error } = await supabase.from('logistics_tasks').insert({
      company_id: company.id,
      title: form.title,
      status: 'pending',
      progress: 0,
      distance_km: parseFloat(form.distance_km) || 0,
      load_kg: parseFloat(form.load_kg) || 0,
      eta: form.eta || null,
    });
    setSaving(false);
    if (!error) {
      setShowCreate(false);
      setForm({ title: '', distance_km: '', load_kg: '', eta: '' });
      fetchTasks();
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Logistics Tasks</h2>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all">
          <Package size={16} /> New Delivery
        </button>
      </div>

      {/* Create Delivery Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black uppercase tracking-tight">New Delivery</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input id="delivery-title" name="title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Delivery title" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input id="delivery-distance" name="distanceKm" value={form.distance_km} onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))} placeholder="Distance (km)" type="number" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input id="delivery-load" name="loadKg" value={form.load_kg} onChange={e => setForm(f => ({ ...f, load_kg: e.target.value }))} placeholder="Load weight (kg)" type="number" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input id="delivery-eta" name="eta" value={form.eta} onChange={e => setForm(f => ({ ...f, eta: e.target.value }))} placeholder="ETA" type="datetime-local" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
            </div>
            <button onClick={handleCreate} disabled={saving || !form.title} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all">
              {saving ? 'Creating...' : 'Create Delivery'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {tasks.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 text-center text-zinc-400 text-sm">
              No logistics tasks yet
            </div>
          ) : tasks.map((task: any) => (
            <div key={task.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 hover:border-blue-600/50 transition-all group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Navigation size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight">{task.title}</h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                      {task.id.slice(0, 8)} - {task.profiles?.full_name ?? 'Unassigned'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${task.status === 'in_transit' ? 'bg-blue-500/10 text-blue-500' :
                  task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>{task.status}</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <span>Progress</span>
                  <span>{task.progress ?? 0}%</span>
                </div>
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${task.progress ?? 0}%` }}
                    className="h-full bg-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">ETA</p>
                  <p className="text-sm font-bold">{task.eta ? new Date(task.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Distance</p>
                  <p className="text-sm font-bold">{task.distance_km ? `${task.distance_km} km` : '-'}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Load</p>
                  <p className="text-sm font-bold">{task.load_kg ? `${task.load_kg} kg` : '-'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 text-white p-8 rounded-[40px] flex flex-col">
          <h3 className="text-xl font-black uppercase tracking-tight mb-8">Fleet Status</h3>
          <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 relative overflow-hidden flex items-center justify-center min-h-[200px]">
            <MapPin size={48} className="text-blue-600 animate-bounce" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/10 to-transparent" />
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active Vehicles</span>
              <span className="text-sm font-bold">{driverCount.active} / {driverCount.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active Tasks</span>
              <span className="text-sm font-bold">{tasks.filter((t: any) => t.status === 'in_transit').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Fleet ──────────────────────────────────────────────────────────────
const FleetManagement = () => {
  const { company } = useCompany();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    supabase
      .from('vehicles')
      .select('id, model, plate_number, status, last_service_date')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setVehicles(data ?? []); setLoading(false); });
  }, [company?.id]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Fleet Management</h2>
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Vehicle</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Plate #</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Last Service</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {vehicles.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400 text-sm">No vehicles registered</td></tr>
            ) : vehicles.map((v: any) => (
              <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Truck size={18} className="text-zinc-400" />
                    <span className="text-sm font-bold">{v.model ?? 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-zinc-500">{v.plate_number ?? '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${v.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>{v.status}</span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-zinc-500">{v.last_service_date ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Tracking ───────────────────────────────────────────────────────────
const DeliveryTracking = () => {
  const { company } = useCompany();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    supabase
      .from('logistics_tasks')
      .select('id, title, status, assigned_to, eta, progress, created_at, profiles(full_name)')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => { setTasks(data ?? []); setLoading(false); });
  }, [company?.id]);

  const updateStatus = async (id: string, status: string, progress: number) => {
    await supabase.from('logistics_tasks').update({ status, progress }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, progress } : t));
  };

  const STAGES = [
    { key: 'pending', label: 'Pending', color: 'bg-zinc-400' },
    { key: 'assigned', label: 'Assigned', color: 'bg-amber-500' },
    { key: 'in_transit', label: 'In Transit', color: 'bg-blue-500' },
    { key: 'delivered', label: 'Delivered', color: 'bg-emerald-500' },
  ];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Delivery Tracking</h2>
      <div className="grid grid-cols-4 gap-4">
        {STAGES.map(s => {
          const count = tasks.filter(t => t.status === s.key).length;
          return (
            <div key={s.key} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center">
              <div className={`w-3 h-3 rounded-full ${s.color} mx-auto mb-2`} />
              <div className="text-2xl font-black">{count}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{s.label}</div>
            </div>
          );
        })}
      </div>
      <div className="space-y-4">
        {tasks.map(task => {
          const stageIdx = STAGES.findIndex(s => s.key === task.status);
          return (
            <div key={task.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-sm">{task.title}</h4>
                  <p className="text-[10px] text-zinc-400 flex items-center gap-1"><User size={10} />{task.profiles?.full_name ?? 'Unassigned'}</p>
                </div>
                {task.eta && <div className="text-[10px] text-zinc-400 flex items-center gap-1"><Clock size={10} />ETA: {new Date(task.eta).toLocaleString()}</div>}
              </div>
              <div className="flex items-center gap-2 mb-4">
                {STAGES.map((s, i) => (
                  <React.Fragment key={s.key}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${i <= stageIdx ? s.color : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                      {i < stageIdx ? <CheckCircle2 size={14} /> : i === stageIdx ? (i + 1) : (i + 1)}
                    </div>
                    {i < STAGES.length - 1 && <div className={`flex-1 h-0.5 ${i < stageIdx ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex gap-2">
                {task.status === 'pending' && <button onClick={() => updateStatus(task.id, 'assigned', 25)} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-amber-600">Assign</button>}
                {task.status === 'assigned' && <button onClick={() => updateStatus(task.id, 'in_transit', 50)} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-blue-600">Start Transit</button>}
                {task.status === 'in_transit' && <button onClick={() => updateStatus(task.id, 'delivered', 100)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-600">Mark Delivered</button>}
                {task.status === 'delivered' && <span className="px-3 py-1.5 text-emerald-600 text-[10px] font-bold uppercase flex items-center gap-1"><CheckCircle2 size={12} />Completed</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function LogisticsModule() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { icon: ClipboardList, label: 'Tasks', path: '' },
          { icon: Truck, label: 'Fleet', path: 'fleet' },
          { icon: MapPin, label: 'Tracking', path: 'tracking' },
        ].map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end
            className={({ isActive }) => `
              flex items-center gap-2 px-6 py-3 rounded-2xl transition-all whitespace-nowrap
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:border-blue-600/50'}
            `}
          >
            <item.icon size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Routes>
          <Route path="/" element={<TaskFollowUp />} />
          <Route path="/fleet" element={<FleetManagement />} />
          <Route path="/tracking" element={<DeliveryTracking />} />
        </Routes>
      </motion.div>
    </div>
  );
}
