import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Briefcase, FileText, CreditCard, MessageSquare,
  Bell, LogOut, CheckCircle2, Clock, Download,
  Loader2, AlertTriangle, Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { HeaderControls } from '../components/HeaderControls';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { supabase } from '../services/supabase';

const LoadingState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-12 text-zinc-400">
      <Loader2 className="animate-spin mr-2" size={18} /> {t('loading')}
    </div>
  );
};

const UnavailableState = ({ feature }: { feature: string }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
      <Info size={32} className="mb-3 opacity-50" />
      <p className="text-sm font-bold uppercase tracking-widest">{feature}</p>
      <p className="text-xs mt-1">{t('coming_soon')}</p>
    </div>
  );
};

const ClientOverview = () => {
  const { t } = useTranslation();
  const { company } = useCompany();
  const [stats, setStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    (async () => {
      try {
        // Fetch invoices for this company
        const { data: inv } = await supabase
          .from('invoices')
          .select('id, invoice_number, total_amount, status, due_date, invoice_type, customer_or_vendor, created_at')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(10);

        const allInv = inv || [];
        const pending = allInv.filter((i: any) => i.status === 'pending' || i.status === 'sent');
        const overdue = allInv.filter((i: any) => {
          if (i.status === 'paid') return false;
          return i.due_date && new Date(i.due_date) < new Date();
        });

        setInvoices(allInv);
        setStats({
          totalInvoices: allInv.length,
          pendingCount: pending.length,
          overdueCount: overdue.length,
          pendingAmount: pending.reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0),
        });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [company]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{t('total_invoices')}</p>
          <p className="text-3xl font-black">{stats?.totalInvoices ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{t('pending_invoices')}</p>
          <p className="text-3xl font-black">{stats?.pendingCount ?? 0}</p>
          {(stats?.pendingAmount ?? 0) > 0 && (
            <p className="text-[10px] text-amber-500 font-bold mt-2 uppercase tracking-widest">
              {stats.pendingAmount.toLocaleString()} {company?.currencyCode || 'AED'} outstanding
            </p>
          )}
        </div>
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{t('overdue')}</p>
          <p className="text-3xl font-black">{stats?.overdueCount ?? 0}</p>
          {(stats?.overdueCount ?? 0) > 0 && (
            <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">{t('action_required')}</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-black uppercase tracking-tight mb-8">{t('recent_invoices')}</h3>
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">{t('no_invoices_found')}</p>
          ) : invoices.slice(0, 5).map((inv: any) => (
            <div key={inv.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl group border border-transparent transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">{inv.invoice_number || `INV-${inv.id.substring(0, 8)}`}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    {inv.invoice_type || 'Invoice'} • {inv.total_amount?.toLocaleString()} {company?.currencyCode || 'AED'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                  inv.status === 'overdue' ? 'bg-red-500/10 text-red-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>{inv.status}</span>
                {inv.due_date && (
                  <span className="text-[10px] text-zinc-400 font-bold">
                    {new Date(inv.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Placeholder sub-routes
const QuotesPage = () => {
  const { t } = useTranslation();
  const { company } = useCompany();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    (async () => {
      const { data } = await supabase
        .from('quotes')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });
      setQuotes(data || []);
      setLoading(false);
    })();
  }, [company]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('quotes')}</h2>
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('quote')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('client')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('amount')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {quotes.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-400">{t('no_quotes')}</td></tr>
            ) : quotes.map((q: any) => (
              <tr key={q.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-bold">{q.quote_number || `Q-${q.id.substring(0, 8)}`}</td>
                <td className="px-6 py-4 text-sm">{q.client_name || '—'}</td>
                <td className="px-6 py-4 text-sm font-bold">{q.total_amount?.toLocaleString() || '0'} {company?.currencyCode || 'AED'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${q.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500' :
                    q.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                      q.status === 'sent' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-amber-500/10 text-amber-500'
                    }`}>{q.status || 'draft'}</span>
                </td>
                <td className="px-6 py-4 text-xs text-zinc-500">
                  {q.created_at ? new Date(q.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ContractsPage = () => {
  const { t } = useTranslation();
  const { company } = useCompany();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    (async () => {
      const { data } = await supabase
        .from('contracts')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });
      setContracts(data || []);
      setLoading(false);
    })();
  }, [company]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('contracts')}</h2>
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('contract')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('client')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('value')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('start')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('end')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {contracts.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-zinc-400">{t('no_contracts')}</td></tr>
            ) : contracts.map((c: any) => (
              <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-bold">{c.contract_number || c.title || `C-${c.id.substring(0, 8)}`}</td>
                <td className="px-6 py-4 text-sm">{c.client_name || '—'}</td>
                <td className="px-6 py-4 text-sm font-bold">{c.total_value?.toLocaleString() || '0'} {company?.currencyCode || 'AED'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                    c.status === 'expired' ? 'bg-red-500/10 text-red-500' :
                      c.status === 'signed' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-amber-500/10 text-amber-500'
                    }`}>{c.status || 'draft'}</span>
                </td>
                <td className="px-6 py-4 text-xs text-zinc-500">
                  {c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-6 py-4 text-xs text-zinc-500">
                  {c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
const InvoicesPage = () => {
  const { t } = useTranslation();
  const { company } = useCompany();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    (async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });
      setInvoices(data || []);
      setLoading(false);
    })();
  }, [company]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('invoices')}</h2>
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('invoice')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('amount')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('due_date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {invoices.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-400">{t('no_invoices')}</td></tr>
            ) : invoices.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-bold">{inv.invoice_number || `INV-${inv.id.substring(0, 8)}`}</td>
                <td className="px-6 py-4 text-sm font-bold">{inv.total_amount?.toLocaleString()} {company?.currencyCode || 'AED'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                    inv.status === 'overdue' ? 'bg-red-500/10 text-red-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>{inv.status}</span>
                </td>
                <td className="px-6 py-4 text-xs text-zinc-500">
                  {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
const SupportPage = () => {
  const { t } = useTranslation();
  const { company } = useCompany();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = async () => {
    if (!company) return;
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { loadTickets(); }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        company_id: company.id,
        user_id: user.id,
        subject: newTicket.subject,
        message: newTicket.message,
        priority: newTicket.priority,
        status: 'open',
      });
      if (!error) {
        setNewTicket({ subject: '', message: '', priority: 'medium' });
        setShowNew(false);
        loadTickets();
      }
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('support')}</h2>
        <button onClick={() => setShowNew(!showNew)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
          {showNew ? t('cancel') : t('new_ticket')}
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          <input id="ticket-subject" name="subject" type="text" required placeholder={t('subject')} value={newTicket.subject} onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-medium" />
          <textarea id="ticket-message" name="message" rows={4} required placeholder={t('describe_issue')} value={newTicket.message} onChange={e => setNewTicket({ ...newTicket, message: e.target.value })}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-medium resize-none" />
          <div className="flex items-center gap-4">
            <select id="ticket-priority" name="priority" value={newTicket.priority} onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
              className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-medium">
              <option value="low">{t('low_priority')}</option>
              <option value="medium">{t('medium_priority')}</option>
              <option value="high">{t('high_priority')}</option>
            </select>
            <button type="submit" disabled={submitting} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
              {submitting ? t('submitting') : t('submit_ticket')}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('subject')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('priority')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {tickets.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-400">{t('no_support_tickets')}</td></tr>
            ) : tickets.map((t: any) => (
              <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-bold">{t.subject}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                    t.priority === 'low' ? 'bg-zinc-500/10 text-zinc-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>{t.priority}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500' :
                    t.status === 'open' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>{t.status}</span>
                </td>
                <td className="px-6 py-4 text-xs text-zinc-500">
                  {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function ClientPortal() {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const { company, role } = useCompany();
  const displayName = profile?.fullName || profile?.displayName || user?.email?.split('@')[0] || 'Client';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="w-72 h-screen bg-zinc-900 text-white flex flex-col sticky top-0">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">Z</div>
            <span className="text-xl font-black tracking-tighter uppercase">{t('client_portal')}</span>
          </Link>
          <nav className="space-y-2">
            {[
              { icon: Briefcase, label: t('overview'), path: '' },
              { icon: FileText, label: t('quotes'), path: 'quotes' },
              { icon: FileText, label: t('contracts'), path: 'contracts' },
              { icon: CreditCard, label: t('invoices'), path: 'invoices' },
              { icon: MessageSquare, label: t('support'), path: 'support' },
            ].map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                end
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
                `}
              >
                <item.icon size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t('connected_to')}</p>
            <p className="text-xs font-bold truncate">{company?.name || 'No company'}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all group"
          >
            <LogOut size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">{t('logout')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm">{initials}</div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight">{displayName}</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                {role ? role.replace(/_/g, ' ') : 'Client'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <HeaderControls />
          </div>
        </header>

        <div className="p-8">
          <Routes>
            <Route path="/" element={<ClientOverview />} />
            <Route path="/quotes" element={<QuotesPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
