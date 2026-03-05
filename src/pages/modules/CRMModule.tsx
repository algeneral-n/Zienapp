import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { 
  Users, FileText, Briefcase, Settings,
  Plus, Search, Filter, MoreHorizontal
} from 'lucide-react';
import { motion } from 'motion/react';

const ClientList = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Clients</h2>
      <button className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all">
        <Plus size={16} /> Add Client
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { name: 'Acme Corp', contact: 'John Smith', revenue: '450k AED', status: 'Active' },
        { name: 'Global Tech', contact: 'Jane Doe', revenue: '120k AED', status: 'Lead' },
        { name: 'Zien Academy', contact: 'Ahmed Ali', revenue: '35k AED', status: 'Active' },
      ].map((client, i) => (
        <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
              {client.name.charAt(0)}
            </div>
            <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <h4 className="font-black uppercase tracking-tight mb-1">{client.name}</h4>
          <p className="text-xs text-zinc-500 font-medium mb-6">{client.contact}</p>
          <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Revenue</p>
              <p className="text-sm font-bold">{client.revenue}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              client.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
            }`}>{client.status}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Quotes = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-black uppercase tracking-tighter">Quotes & Proposals</h2>
    <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Quote #</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Client</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Amount</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Expiry</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {[
            { id: 'QT-2026-001', client: 'Acme Corp', amount: '45,000 AED', status: 'Sent', expiry: '2026-03-15' },
            { id: 'QT-2026-002', client: 'Global Tech', amount: '12,000 AED', status: 'Draft', expiry: '2026-03-20' },
          ].map((q, i) => (
            <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="px-6 py-4 text-sm font-black tracking-tight">{q.id}</td>
              <td className="px-6 py-4 text-xs font-medium text-zinc-500">{q.client}</td>
              <td className="px-6 py-4 text-sm font-bold">{q.amount}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  q.status === 'Sent' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-500/10 text-zinc-500'
                }`}>{q.status}</span>
              </td>
              <td className="px-6 py-4 text-xs font-medium text-zinc-500">{q.expiry}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default function CRMModule() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { icon: Users, label: 'Clients', path: '' },
          { icon: FileText, label: 'Quotes', path: 'quotes' },
          { icon: Briefcase, label: 'Projects', path: 'projects' },
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
          <Route path="/" element={<ClientList />} />
          <Route path="/quotes" element={<Quotes />} />
        </Routes>
      </motion.div>
    </div>
  );
}
