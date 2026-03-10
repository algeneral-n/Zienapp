import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Users, FileText, Briefcase, Settings,
  Plus, Search, Filter, MoreHorizontal, Loader2, X,
  TrendingUp, DollarSign, ArrowRight, Target,
  UserPlus, Activity, CheckCircle2, Calendar, Phone, Mail
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCompany } from '../../contexts/CompanyContext';
import { crmService } from '../../services/crmService';

// ─── Pipeline ───────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-zinc-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { key: 'proposal', label: 'Proposal', color: 'bg-amber-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-purple-500' },
  { key: 'won', label: 'Won', color: 'bg-emerald-500' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500' },
];

const Pipeline = () => {
  const { company } = useCompany();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    (async () => {
      try {
        const result = await crmService.listClients({ limit: 100 });
        setClients(result.data ?? []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [company?.id]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  const grouped = PIPELINE_STAGES.map(stage => ({
    ...stage,
    items: clients.filter(c => (c.status ?? 'lead') === stage.key),
  }));

  const totalValue = clients.reduce((s, c) => s + Number(c.total_revenue || 0), 0);
  const wonValue = grouped.find(g => g.key === 'won')?.items.reduce((s: number, c: any) => s + Number(c.total_revenue || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Sales Pipeline</h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <DollarSign size={14} className="text-blue-600" />
            <span className="font-bold">{totalValue.toLocaleString()} AED</span>
            <span className="text-zinc-400 text-xs">pipeline</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
            <TrendingUp size={14} className="text-emerald-600" />
            <span className="font-bold text-emerald-600">{wonValue.toLocaleString()} AED</span>
            <span className="text-zinc-400 text-xs">won</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {grouped.map(stage => (
          <div key={stage.key} className="min-w-[240px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${stage.color}`} />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{stage.label}</span>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">{stage.items.length}</span>
            </div>
            <div className="space-y-3">
              {stage.items.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 text-xs border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">Empty</div>
              ) : stage.items.map((c: any) => (
                <motion.div key={c.id} whileHover={{ y: -2 }}
                  className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-600/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-sm">
                      {(c.name ?? '?').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm truncate">{c.name}</h4>
                      <p className="text-[10px] text-zinc-400 truncate">{c.contact_name ?? c.contact_email ?? '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">{Number(c.total_revenue || 0).toLocaleString()} AED</span>
                    <ArrowRight size={12} className="text-zinc-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Clients ────────────────────────────────────────────────────────────
const ClientList = () => {
  const { company } = useCompany();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
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
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Clients</h2>
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input id="client-search" name="search" type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
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
              <input id="client-name" name="clientName" autoComplete="organization" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Company / Client name" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input id="contact-person" name="contactName" autoComplete="name" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Contact person" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input id="contact-email" name="contactEmail" autoComplete="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="Email" type="email" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input id="contact-phone" name="contactPhone" autoComplete="tel" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="Phone" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
            </div>
            <button onClick={handleCreate} disabled={saving || !form.name} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all">
              {saving ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clients.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
          <div className="col-span-3 text-center py-8 text-zinc-400 text-sm">No clients found</div>
        ) : clients.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase())).map((client: any) => (
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

// ─── Leads ──────────────────────────────────────────────────────────────
const Leads = () => {
  const { company } = useCompany();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: 'website', notes: '' });

  useEffect(() => {
    if (!company?.id) return;
    crmService.listLeads({ limit: 50 }).then(r => { setLeads((r as any).data ?? r ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, [company?.id]);

  const handleCreate = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const lead = await crmService.createLead({ name: form.name, email: form.email || undefined, phone: form.phone || undefined, source: form.source, notes: form.notes || undefined });
      setLeads(prev => [lead, ...prev]);
      setShowCreate(false);
      setForm({ name: '', email: '', phone: '', source: 'website', notes: '' });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleConvert = async (id: string) => {
    try {
      await crmService.convertLeadToClient(id);
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Leads</h2>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700"><Plus size={16} /> New Lead</button>
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-black uppercase tracking-tight">New Lead</h3><button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button></div>
            <div className="space-y-4">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Lead name" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" type="email" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm">
                {['website', 'referral', 'social_media', 'cold_call', 'event', 'other'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm resize-none" />
            </div>
            <button onClick={handleCreate} disabled={saving || !form.name} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create Lead'}</button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {leads.length === 0 ? <div className="text-center py-8 text-zinc-400 text-sm">No leads yet</div> :
          leads.map(lead => (
            <div key={lead.id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-sm">{(lead.name ?? '?').charAt(0)}</div>
                <div>
                  <h4 className="font-bold text-sm">{lead.name}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                    {lead.email && <span className="flex items-center gap-1"><Mail size={10} />{lead.email}</span>}
                    {lead.phone && <span className="flex items-center gap-1"><Phone size={10} />{lead.phone}</span>}
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-bold uppercase">{lead.source}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${lead.status === 'qualified' ? 'bg-emerald-500/10 text-emerald-600' : lead.status === 'contacted' ? 'bg-blue-500/10 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>{lead.status || 'new'}</span>
                <button onClick={() => handleConvert(lead.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-700">Convert</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// ─── Activities ─────────────────────────────────────────────────────────
const Activities = () => {
  const { company } = useCompany();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'call', subject: '', notes: '', scheduledAt: '' });

  useEffect(() => {
    if (!company?.id) return;
    crmService.listActivities({ limit: 50 }).then(r => { setActivities((r as any).data ?? r ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, [company?.id]);

  const handleCreate = async () => {
    if (!form.subject) return;
    setSaving(true);
    try {
      const act = await crmService.createActivity({ type: form.type as any, subject: form.subject, notes: form.notes || undefined, scheduledAt: form.scheduledAt || undefined });
      setActivities(prev => [act, ...prev]);
      setShowCreate(false);
      setForm({ type: 'call', subject: '', notes: '', scheduledAt: '' });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleComplete = async (id: string) => {
    try {
      const updated = await crmService.completeActivity(id);
      setActivities(prev => prev.map(a => a.id === id ? updated : a));
    } catch (err) { console.error(err); }
  };

  const iconMap: Record<string, any> = { call: Phone, email: Mail, meeting: Calendar, task: CheckCircle2 };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Activities</h2>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700"><Plus size={16} /> Log Activity</button>
      </div>
      {showCreate && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm">
              {['call', 'email', 'meeting', 'task', 'note'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
          </div>
          <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Subject" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !form.subject} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50">{saving ? 'Saving...' : 'Log Activity'}</button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {activities.length === 0 ? <div className="text-center py-8 text-zinc-400 text-sm">No activities logged</div> :
          activities.map(act => {
            const Icon = iconMap[act.type] || Activity;
            return (
              <div key={act.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${act.is_completed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}><Icon size={18} /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm">{act.subject}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span className="font-bold uppercase">{act.type}</span>
                    {act.scheduled_at && <span>{new Date(act.scheduled_at).toLocaleString()}</span>}
                  </div>
                </div>
                {!act.is_completed && (
                  <button onClick={() => handleComplete(act.id)} className="p-2 text-zinc-400 hover:text-emerald-600"><CheckCircle2 size={18} /></button>
                )}
                {act.is_completed && <span className="text-[10px] font-bold text-emerald-600 uppercase">Done</span>}
              </div>
            );
          })}
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
          { icon: UserPlus, label: 'Leads', path: 'leads' },
          { icon: FileText, label: 'Quotes', path: 'quotes' },
          { icon: Target, label: 'Pipeline', path: 'pipeline' },
          { icon: Activity, label: 'Activities', path: 'activities' },
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
          <Route path="/leads" element={<Leads />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/activities" element={<Activities />} />
        </Routes>
      </motion.div>
    </div>
  );
}
