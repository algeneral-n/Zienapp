import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { 
  Truck, MapPin, ClipboardList, Settings,
  Navigation, Package, Clock, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

const TaskFollowUp = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Logistics Tasks</h2>
      <button className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all">
        <Package size={16} /> New Delivery
      </button>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {[
          { id: 'LOG-001', title: 'Dubai Mall Delivery', status: 'In Transit', driver: 'Ahmed Ali', eta: '14:30', progress: 65 },
          { id: 'LOG-002', title: 'Abu Dhabi Warehouse', status: 'Pending', driver: 'Sara Smith', eta: '16:00', progress: 0 },
        ].map((task, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Navigation size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tight">{task.title}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{task.id} • Assigned to {task.driver}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                task.status === 'In Transit' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
              }`}>{task.status}</span>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${task.progress}%` }}
                  className="h-full bg-emerald-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">ETA</p>
                <p className="text-sm font-bold">{task.eta}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Distance</p>
                <p className="text-sm font-bold">12.4 km</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Load</p>
                <p className="text-sm font-bold">450 kg</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 text-white p-8 rounded-[40px] flex flex-col">
        <h3 className="text-xl font-black uppercase tracking-tight mb-8">Live Tracking</h3>
        <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 relative overflow-hidden flex items-center justify-center">
          <MapPin size={48} className="text-emerald-500 animate-bounce" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 to-transparent" />
          <p className="absolute bottom-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Map View (Simulated)</p>
        </div>
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active Drivers</span>
            <span className="text-sm font-bold">12 / 15</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Fuel Efficiency</span>
            <span className="text-sm font-bold text-emerald-500">+8.2%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FleetManagement = () => (
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
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Alerts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {[
            { model: 'Toyota Hiace', plate: 'DXB 12345', status: 'Active', service: '2026-01-15', alerts: 0 },
            { model: 'Mercedes Sprinter', plate: 'DXB 67890', status: 'Maintenance', service: '2025-12-10', alerts: 1 },
          ].map((v, i) => (
            <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Truck size={18} className="text-zinc-400" />
                  <span className="text-sm font-bold">{v.model}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-xs font-medium text-zinc-500">{v.plate}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>{v.status}</span>
              </td>
              <td className="px-6 py-4 text-xs font-medium text-zinc-500">{v.service}</td>
              <td className="px-6 py-4">
                {v.alerts > 0 ? (
                  <div className="flex items-center gap-1 text-red-500">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{v.alerts} Alert</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">None</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default function LogisticsModule() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { icon: ClipboardList, label: 'Tasks', path: '' },
          { icon: Truck, label: 'Fleet', path: 'fleet' },
          { icon: MapPin, label: 'Tracking', path: 'tracking' },
          { icon: Settings, label: 'Settings', path: 'settings' },
        ].map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end
            className={({ isActive }) => `
              flex items-center gap-2 px-6 py-3 rounded-2xl transition-all whitespace-nowrap
              ${isActive 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50'}
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
        </Routes>
      </motion.div>
    </div>
  );
}
