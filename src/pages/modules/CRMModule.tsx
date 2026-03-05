import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Users, FileText, Briefcase, Settings,
  Plus, Search, Filter, MoreHorizontal, Loader2, X
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCompany } from '../../contexts/CompanyContext';
import { crmService } from '../../services/crmService';

// ─── Clients ────────────────────────────────────────────────────────────
const ClientList = () => {
  const { company } = useCompany();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', contact_name: '', contact_email: '', contact_phone: '' });

  const fetchClients = async () => {
    if (!company?.id) return;
    try {
      const result = await crmService.listClients({ limit: 50 });
      setClients(result.data ?? []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [company?.id]);

  const handleCreate = async () => {
    if (!company?.id || !form.name) return;
    setSaving(true);
    try {
      await crmService.createClient({
        name: form.name,
        contactPerson: form.contact_name || undefined,
        email: form.contact_email || undefined,
        phone: form.contact_phone || undefined,
      });
      setShowCreate(false);
      setForm({ name: '', contact_name: '', contact_email: '', contact_phone: '' });
      fetchClients();
    } catch (err) {
      console.error('Failed to create client:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Clients</h2>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all">
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Create Client Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black uppercase tracking-tight">Add Client</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Company / Client name" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Contact person" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="Email" type="email" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="Phone" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
            </div>
            <button onClick={handleCreate} disabled={saving || !form.name} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all">
              {saving ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clients.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-zinc-400 text-sm">No clients yet</div>
        ) : clients.map((client: any) => (
          <div key={client.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-800 hover:border-blue-600/50 transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                {(client.name ?? '?').charAt(0)}
              </div>
              <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <h4 className="font-black uppercase tracking-tight mb-1">{client.name}</h4>
            <p className="text-xs text-zinc-500 font-medium mb-6">{client.contact_name ?? client.contact_email ?? '-'}</p>
            <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Revenue</p>
                <p className="text-sm font-bold">{Number(client.total_revenue || 0).toLocaleString()} AED</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${client.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                }`}>{client.status ?? 'lead'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Quotes ─────────────────────────────────────────────────────────────
const Quotes = () => {
  const { company } = useCompany();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    (async () => {
      try {
        const result = await crmService.listQuotes({ limit: 50 });
        setQuotes((result as any).data ?? result ?? []);
      } catch (err) {
        console.error('Failed to load quotes:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [company?.id]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
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
            {quotes.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 text-sm">No quotes yet</td></tr>
            ) : quotes.map((q: any) => (
              <tr key={q.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-black tracking-tight">{q.quote_number || q.id.slice(0, 8)}</td>
                <td className="px-6 py-4 text-xs font-medium text-zinc-500">{q.client_name ?? '-'}</td>
                <td className="px-6 py-4 text-sm font-bold">{Number(q.total_amount || 0).toLocaleString()} AED</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${q.status === 'sent' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-500/10 text-zinc-500'
                    }`}>{q.status}</span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-zinc-500">{q.expiry_date ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

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
          <Route path="/" element={<ClientList />} />
          <Route path="/quotes" element={<Quotes />} />
        </Routes>
      </motion.div>
    </div>
  );
}
