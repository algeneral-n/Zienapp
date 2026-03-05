import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  FileText, BarChart3, Settings, BookOpen, Layers, Building2, Brain,
  Plus, Download, Printer, Send, Loader2, X, ChevronRight, RefreshCw,
  TrendingUp, TrendingDown, AlertTriangle, DollarSign, Eye
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../services/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';
const Spinner = () => <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 ${className}`}>{children}</div>
);
const TH = ({ children }: { children: React.ReactNode }) => (
  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{children}</th>
);

async function apiFetch<T = any>(path: string, opts: RequestInit = {}): Promise<{ data: T | null; error: string | null }> {
  try {
    const session = (await supabase.auth.getSession()).data.session;
    const res = await fetch(`${API_URL}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, ...opts.headers },
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: json?.error || `HTTP ${res.status}` };
    return { data: json as T, error: null };
  } catch (e: any) { return { data: null, error: e.message }; }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INVOICES
// ═══════════════════════════════════════════════════════════════════════════
const InvoiceList = () => {
  const { t } = useTranslation();
  const { company } = useCompany();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_name: '', total_amount: '', vat_amount: '', notes: '' });

  const fetchInvoices = useCallback(() => {
    if (!company?.id) return;
    supabase.from('invoices').select('id, invoice_number, client_name, total_amount, vat_amount, status, created_at')
      .eq('company_id', company.id).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { setInvoices(data ?? []); setLoading(false); });
  }, [company?.id]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleCreate = async () => {
    if (!company?.id || !form.client_name) return;
    setSaving(true);
    const invNum = `INV-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await supabase.from('invoices').insert({
      company_id: company.id, invoice_number: invNum, client_name: form.client_name,
      total_amount: parseFloat(form.total_amount) || 0, vat_amount: parseFloat(form.vat_amount) || 0,
      status: 'draft', notes: form.notes || null,
    });
    setSaving(false);
    if (!error) { setShowCreate(false); setForm({ client_name: '', total_amount: '', vat_amount: '', notes: '' }); fetchInvoices(); }
  };

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('invoices', 'Invoices')}</h2>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all">
          <Plus size={16} /> {t('new_invoice', 'New Invoice')}
        </button>
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black uppercase tracking-tight">{t('new_invoice', 'New Invoice')}</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder={t('client_name', 'Client name')} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} placeholder={t('total_amount', 'Total amount (AED)')} type="number" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.vat_amount} onChange={e => setForm(f => ({ ...f, vat_amount: e.target.value }))} placeholder={t('vat_amount', 'VAT amount (AED)')} type="number" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('notes_optional', 'Notes (optional)')} rows={3} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm resize-none" />
            </div>
            <button onClick={handleCreate} disabled={saving || !form.client_name} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all">
              {saving ? t('creating', 'Creating...') : t('create_invoice', 'Create Invoice')}
            </button>
          </div>
        </div>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <TH>{t('invoice_number', 'Invoice #')}</TH><TH>{t('client', 'Client')}</TH><TH>{t('amount', 'Amount')}</TH><TH>{t('vat', 'VAT')}</TH><TH>{t('status', 'Status')}</TH><TH>{t('actions', 'Actions')}</TH>
          </tr></thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {invoices.length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-400 text-sm">{t('no_invoices', 'No invoices yet')}</td></tr>
              : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-black tracking-tight">{inv.invoice_number || inv.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-xs font-medium text-zinc-500">{inv.client_name ?? '-'}</td>
                  <td className="px-6 py-4 text-sm font-bold">{Number(inv.total_amount || 0).toLocaleString()} AED</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{Number(inv.vat_amount || 0).toLocaleString()} AED</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${inv.status === 'paid' ? 'bg-emerald-600/10 text-emerald-600' : inv.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-500/10 text-zinc-500'}`}>{inv.status}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-3 text-zinc-400"><button className="hover:text-blue-600 transition-colors"><Download size={16} /></button><button className="hover:text-blue-600 transition-colors"><Printer size={16} /></button><button className="hover:text-blue-600 transition-colors"><Send size={16} /></button></div></td>
                </tr>))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. CHART OF ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════════
const ChartOfAccounts = () => {
  const { t } = useTranslation();
  const { company } = useCompany();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ account_code: '', name_en: '', name_ar: '', account_type: 'asset', parent_code: '' });

  const load = useCallback(async () => {
    if (!company?.id) return;
    const { data } = await apiFetch('/api/accounting/chart-of-accounts');
    setAccounts(data?.chart_of_accounts ?? []);
    setLoading(false);
  }, [company?.id]);
  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true);
    const { error } = await apiFetch('/api/accounting/chart-of-accounts', {
      method: 'POST',
      body: JSON.stringify({ account_code: form.account_code, name_en: form.name_en, name_ar: form.name_ar || form.name_en, account_type: form.account_type, parent_code: form.parent_code || undefined }),
    });
    setSaving(false);
    if (!error) { setShowCreate(false); setForm({ account_code: '', name_en: '', name_ar: '', account_type: 'asset', parent_code: '' }); load(); }
  };

  const typeColors: Record<string, string> = { asset: 'text-blue-600 bg-blue-600/10', liability: 'text-red-500 bg-red-500/10', equity: 'text-purple-600 bg-purple-600/10', revenue: 'text-emerald-600 bg-emerald-600/10', expense: 'text-amber-600 bg-amber-600/10' };

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('chart_of_accounts')}</h2>
        <div className="flex gap-3">
          <button onClick={load} className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"><RefreshCw size={16} /></button>
          <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all"><Plus size={16} /> {t('add_account', 'Add Account')}</button>
        </div>
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-black uppercase tracking-tight">{t('add_account', 'Add Account')}</h3><button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button></div>
            <div className="space-y-4">
              <input value={form.account_code} onChange={e => setForm(f => ({ ...f, account_code: e.target.value }))} placeholder="Account code (e.g. 11000)" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} placeholder="Name (English)" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="Name (Arabic)" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <select value={form.account_type} onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm">
                <option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="revenue">Revenue</option><option value="expense">Expense</option>
              </select>
              <input value={form.parent_code} onChange={e => setForm(f => ({ ...f, parent_code: e.target.value }))} placeholder="Parent code (optional)" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
            </div>
            <button onClick={handleCreate} disabled={saving || !form.account_code || !form.name_en} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all">{saving ? t('creating', 'Creating...') : t('create', 'Create')}</button>
          </div>
        </div>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <TH>{t('code', 'Code')}</TH><TH>{t('name', 'Name')}</TH><TH>{t('type', 'Type')}</TH><TH>{t('parent', 'Parent')}</TH><TH>{t('status', 'Status')}</TH>
          </tr></thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {accounts.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 text-sm">{t('no_accounts', 'No accounts configured')}</td></tr>
              : accounts.map(a => (
                <tr key={a.id || a.account_code} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-black tracking-tight font-mono">{a.account_code}</td>
                  <td className="px-6 py-4 text-sm font-medium">{a.name_en}<span className="block text-xs text-zinc-400">{a.name_ar}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${typeColors[a.account_type] || 'bg-zinc-100 text-zinc-500'}`}>{a.account_type}</span></td>
                  <td className="px-6 py-4 text-xs text-zinc-400 font-mono">{a.parent_code || '—'}</td>
                  <td className="px-6 py-4"><span className={`w-2 h-2 rounded-full inline-block ${a.is_active !== false ? 'bg-emerald-500' : 'bg-zinc-300'}`} /></td>
                </tr>))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. JOURNAL ENTRIES
// ═══════════════════════════════════════════════════════════════════════════
const emptyLine = () => ({ account_code: '', debit: '', credit: '', description: '' });
const JournalEntries = () => {
  const { t } = useTranslation();
  const { company } = useCompany();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState([emptyLine(), emptyLine()]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!company?.id) return;
    const { data } = await apiFetch('/api/accounting/journal-entries');
    setEntries(data?.journal_entries ?? []);
    setLoading(false);
  }, [company?.id]);
  useEffect(() => { load(); }, [load]);

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  const handleCreate = async () => {
    setError('');
    if (!isBalanced) { setError(t('journal_not_balanced', 'Total debit must equal total credit')); return; }
    setSaving(true);
    const body = {
      reference, entry_date: new Date().toISOString().split('T')[0],
      lines: lines.filter(l => l.account_code).map(l => ({ account_code: l.account_code, debit: parseFloat(l.debit) || 0, credit: parseFloat(l.credit) || 0, description: l.description })),
    };
    const { error: err } = await apiFetch('/api/accounting/journal-entries', { method: 'POST', body: JSON.stringify(body) });
    setSaving(false);
    if (!err) { setShowCreate(false); setLines([emptyLine(), emptyLine()]); setReference(''); load(); }
    else setError(err);
  };

  const updateLine = (i: number, field: string, val: string) => setLines(prev => prev.map((l, j) => j === i ? { ...l, [field]: val } : l));

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('journal_entries')}</h2>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all"><Plus size={16} /> {t('new_entry', 'New Entry')}</button>
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-black uppercase tracking-tight">{t('new_journal_entry', 'New Journal Entry')}</h3><button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button></div>
            <input value={reference} onChange={e => setReference(e.target.value)} placeholder={t('reference', 'Reference (e.g. JE-001)')} className="w-full mb-4 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
            <div className="space-y-3">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input value={l.account_code} onChange={e => updateLine(i, 'account_code', e.target.value)} placeholder="Acct code" className="col-span-3 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs" />
                  <input value={l.debit} onChange={e => updateLine(i, 'debit', e.target.value)} placeholder="Debit" type="number" className="col-span-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs" />
                  <input value={l.credit} onChange={e => updateLine(i, 'credit', e.target.value)} placeholder="Credit" type="number" className="col-span-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs" />
                  <input value={l.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Description" className="col-span-4 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs" />
                  <button onClick={() => setLines(prev => prev.filter((_, j) => j !== i))} className="col-span-1 text-zinc-400 hover:text-red-500"><X size={16} /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setLines(p => [...p, emptyLine()])} className="mt-3 text-xs text-blue-600 font-bold uppercase tracking-widest hover:text-blue-700"><Plus size={14} className="inline mr-1" />{t('add_line', 'Add Line')}</button>
            <div className="mt-4 flex items-center justify-between text-sm font-bold">
              <span>Debit: <span className="text-blue-600">{totalDebit.toFixed(2)}</span></span>
              <span>Credit: <span className="text-emerald-600">{totalCredit.toFixed(2)}</span></span>
              <span className={isBalanced ? 'text-emerald-600' : 'text-red-500'}>{isBalanced ? '✓ Balanced' : '✗ Unbalanced'}</span>
            </div>
            {error && <p className="mt-2 text-red-500 text-xs font-bold">{error}</p>}
            <button onClick={handleCreate} disabled={saving || !isBalanced} className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all">{saving ? t('posting', 'Posting...') : t('post_entry', 'Post Entry')}</button>
          </div>
        </div>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <TH>{t('date', 'Date')}</TH><TH>{t('reference', 'Reference')}</TH><TH>{t('debit', 'Debit')}</TH><TH>{t('credit', 'Credit')}</TH><TH>{t('lines', 'Lines')}</TH>
          </tr></thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {entries.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 text-sm">{t('no_journal_entries', 'No journal entries yet')}</td></tr>
              : entries.map(e => (
                <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-medium text-zinc-500">{e.entry_date}</td>
                  <td className="px-6 py-4 text-sm font-black tracking-tight">{e.reference || '—'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600">{Number(e.total_debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600">{Number(e.total_credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-xs text-zinc-400">{e.line_count || '—'} lines</td>
                </tr>))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. GENERAL LEDGER
// ═══════════════════════════════════════════════════════════════════════════
const GeneralLedger = () => {
  const { t } = useTranslation();
  const { company } = useCompany();
  const [accountCode, setAccountCode] = useState('');
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (!company?.id) return;
    apiFetch('/api/accounting/chart-of-accounts').then(({ data }) => setAccounts(data?.chart_of_accounts ?? []));
  }, [company?.id]);

  const loadLedger = async (code: string) => {
    setAccountCode(code);
    if (!code) return;
    setLoading(true);
    const { data } = await apiFetch(`/api/accounting/ledger?account_code=${code}`);
    setLedger(data?.ledger ?? []);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('general_ledger')}</h2>
      <div className="flex gap-4 flex-wrap">
        {accounts.slice(0, 20).map(a => (
          <button key={a.account_code} onClick={() => loadLedger(a.account_code)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${accountCode === a.account_code ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-blue-600/50'}`}>
            {a.account_code} - {a.name_en}
          </button>
        ))}
        {accounts.length > 20 && (
          <select onChange={e => loadLedger(e.target.value)} value={accountCode} className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold">
            <option value="">More accounts...</option>
            {accounts.slice(20).map(a => <option key={a.account_code} value={a.account_code}>{a.account_code} - {a.name_en}</option>)}
          </select>
        )}
      </div>
      {loading ? <Spinner /> : accountCode && (
        <Card className="overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <TH>{t('date', 'Date')}</TH><TH>{t('description', 'Description')}</TH><TH>{t('debit', 'Debit')}</TH><TH>{t('credit', 'Credit')}</TH><TH>{t('running_balance', 'Balance')}</TH>
            </tr></thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {ledger.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 text-sm">{t('no_entries', 'No entries for this account')}</td></tr>
                : ledger.map((e, i) => (
                  <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs text-zinc-500">{e.entry_date}</td>
                    <td className="px-6 py-4 text-sm">{e.description || '—'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">{e.debit > 0 ? Number(e.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">{e.credit > 0 ? Number(e.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                    <td className="px-6 py-4 text-sm font-black">{Number(e.running_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. FINANCIAL REPORTS
// ═══════════════════════════════════════════════════════════════════════════
const FinancialReports = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'trial' | 'income' | 'balance'>('trial');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = useCallback(async (report: string) => {
    setLoading(true);
    const { data: d } = await apiFetch(`/api/accounting/reports/${report}`);
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => {
    const map = { trial: 'trial-balance', income: 'income-statement', balance: 'balance-sheet' };
    loadReport(map[tab]);
  }, [tab, loadReport]);

  const tabs = [
    { key: 'trial' as const, label: t('trial_balance') },
    { key: 'income' as const, label: t('income_statement') },
    { key: 'balance' as const, label: t('balance_sheet') },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('financial_reports')}</h2>
      <div className="flex gap-3">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${tab === tb.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-blue-600/50'}`}>{tb.label}</button>
        ))}
      </div>
      {loading ? <Spinner /> : data && (
        <>
          {/* Trial Balance */}
          {tab === 'trial' && data.trial_balance && (
            <Card className="overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <TH>{t('code', 'Code')}</TH><TH>{t('account', 'Account')}</TH><TH>{t('debit', 'Debit')}</TH><TH>{t('credit', 'Credit')}</TH>
                </tr></thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(data.trial_balance || []).map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-3 text-xs font-mono">{r.account_code}</td>
                      <td className="px-6 py-3 text-sm">{r.name_en || r.account_code}</td>
                      <td className="px-6 py-3 text-sm font-bold text-blue-600">{r.total_debit > 0 ? Number(r.total_debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                      <td className="px-6 py-3 text-sm font-bold text-emerald-600">{r.total_credit > 0 ? Number(r.total_credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-900 dark:bg-zinc-800 text-white font-black">
                    <td colSpan={2} className="px-6 py-4 text-xs uppercase tracking-widest">{t('total', 'TOTAL')}</td>
                    <td className="px-6 py-4 text-sm">{Number(data.totals?.total_debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-sm">{Number(data.totals?.total_credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          )}
          {/* Income Statement */}
          {tab === 'income' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-emerald-600 text-white p-8 rounded-[32px] relative overflow-hidden">
                <div className="absolute top-4 right-4 opacity-20"><TrendingUp size={80} /></div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-200 mb-2">{t('total_revenue', 'Total Revenue')}</p>
                <p className="text-3xl font-black">{Number(data.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-red-500 text-white p-8 rounded-[32px] relative overflow-hidden">
                <div className="absolute top-4 right-4 opacity-20"><TrendingDown size={80} /></div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-200 mb-2">{t('total_expenses', 'Total Expenses')}</p>
                <p className="text-3xl font-black">{Number(data.total_expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className={`${(data.net_income || 0) >= 0 ? 'bg-blue-600' : 'bg-amber-600'} text-white p-8 rounded-[32px] relative overflow-hidden`}>
                <div className="absolute top-4 right-4 opacity-20"><DollarSign size={80} /></div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">{t('net_income', 'Net Income')}</p>
                <p className="text-3xl font-black">{Number(data.net_income || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              {data.revenue_accounts && (
                <div className="md:col-span-3">
                  <Card className="overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead><tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800"><TH>{t('account', 'Account')}</TH><TH>{t('type', 'Type')}</TH><TH>{t('amount', 'Amount')}</TH></tr></thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {[...(data.revenue_accounts || []).map((a: any) => ({ ...a, _type: 'revenue' })), ...(data.expense_accounts || []).map((a: any) => ({ ...a, _type: 'expense' }))].map((a, i) => (
                          <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30"><td className="px-6 py-3 text-sm">{a.name_en || a.account_code}</td><td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${a._type === 'revenue' ? 'bg-emerald-600/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>{a._type}</span></td><td className="px-6 py-3 text-sm font-bold">{Number(a.total || a.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </div>
              )}
            </div>
          )}
          {/* Balance Sheet */}
          {tab === 'balance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-600 text-white p-8 rounded-[32px]"><p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">{t('total_assets', 'Total Assets')}</p><p className="text-3xl font-black">{Number(data.total_assets || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                <div className="bg-red-500 text-white p-8 rounded-[32px]"><p className="text-xs font-bold uppercase tracking-widest text-red-200 mb-2">{t('total_liabilities', 'Total Liabilities')}</p><p className="text-3xl font-black">{Number(data.total_liabilities || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                <div className="bg-purple-600 text-white p-8 rounded-[32px]"><p className="text-xs font-bold uppercase tracking-widest text-purple-200 mb-2">{t('total_equity', 'Total Equity')}</p><p className="text-3xl font-black">{Number(data.total_equity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
              </div>
              {data.assets && (
                <Card className="overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800"><TH>{t('account', 'Account')}</TH><TH>{t('category', 'Category')}</TH><TH>{t('balance', 'Balance')}</TH></tr></thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {[...(data.assets || []).map((a: any) => ({ ...a, _cat: 'asset' })), ...(data.liabilities || []).map((a: any) => ({ ...a, _cat: 'liability' })), ...(data.equity || []).map((a: any) => ({ ...a, _cat: 'equity' }))].map((a, i) => (
                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30"><td className="px-6 py-3 text-sm">{a.name_en || a.account_code}</td><td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${a._cat === 'asset' ? 'bg-blue-600/10 text-blue-600' : a._cat === 'liability' ? 'bg-red-500/10 text-red-500' : 'bg-purple-600/10 text-purple-600'}`}>{a._cat}</span></td><td className="px-6 py-3 text-sm font-bold">{Number(a.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. COST CENTERS
// ═══════════════════════════════════════════════════════════════════════════
const CostCenters = () => {
  const { t } = useTranslation();
  const { company } = useCompany();
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', name_en: '', name_ar: '', type: 'operational', parent_code: '' });

  const load = useCallback(async () => {
    if (!company?.id) return;
    const { data } = await apiFetch('/api/accounting/cost-centers');
    setCenters(data?.cost_centers ?? []);
    setLoading(false);
  }, [company?.id]);
  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true);
    const { error } = await apiFetch('/api/accounting/cost-centers', {
      method: 'POST',
      body: JSON.stringify({ code: form.code, name_en: form.name_en, name_ar: form.name_ar || form.name_en, type: form.type, parent_code: form.parent_code || undefined }),
    });
    setSaving(false);
    if (!error) { setShowCreate(false); setForm({ code: '', name_en: '', name_ar: '', type: 'operational', parent_code: '' }); load(); }
  };

  const centerTypeColors: Record<string, string> = { administrative: 'text-blue-600 bg-blue-600/10', operational: 'text-emerald-600 bg-emerald-600/10', financial: 'text-purple-600 bg-purple-600/10', profit: 'text-amber-600 bg-amber-600/10' };

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('cost_centers', 'Cost Centers')}</h2>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all"><Plus size={16} /> {t('add_center', 'Add Center')}</button>
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-black uppercase tracking-tight">{t('add_center', 'Add Center')}</h3><button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button></div>
            <div className="space-y-4">
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="Center code (e.g. CC-001)" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} placeholder="Name (English)" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="Name (Arabic)" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm">
                <option value="administrative">Administrative</option><option value="operational">Operational</option><option value="financial">Financial</option><option value="profit">Profit</option>
              </select>
              <input value={form.parent_code} onChange={e => setForm(f => ({ ...f, parent_code: e.target.value }))} placeholder="Parent code (optional)" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
            </div>
            <button onClick={handleCreate} disabled={saving || !form.code || !form.name_en} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all">{saving ? t('creating', 'Creating...') : t('create', 'Create')}</button>
          </div>
        </div>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <TH>{t('code', 'Code')}</TH><TH>{t('name', 'Name')}</TH><TH>{t('type', 'Type')}</TH><TH>{t('parent', 'Parent')}</TH><TH>{t('status', 'Status')}</TH>
          </tr></thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {centers.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 text-sm">{t('no_cost_centers', 'No cost centers configured')}</td></tr>
              : centers.map(c => (
                <tr key={c.id || c.code} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-black tracking-tight font-mono">{c.code}</td>
                  <td className="px-6 py-4 text-sm">{c.name_en}<span className="block text-xs text-zinc-400">{c.name_ar}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${centerTypeColors[c.center_type] || 'bg-zinc-100 text-zinc-500'}`}>{c.center_type}</span></td>
                  <td className="px-6 py-4 text-xs text-zinc-400 font-mono">{c.parent_code || '—'}</td>
                  <td className="px-6 py-4"><span className={`w-2 h-2 rounded-full inline-block ${c.is_active !== false ? 'bg-emerald-500' : 'bg-zinc-300'}`} /></td>
                </tr>))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. AI FINANCIAL INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════
const AIInsights = () => {
  const { t } = useTranslation();
  const [type, setType] = useState<'cashflow' | 'anomaly' | 'risk'>('cashflow');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setResult(null);
    const { data } = await apiFetch('/api/accounting/ai/forecast', {
      method: 'POST', body: JSON.stringify({ type, months_ahead: 3 }),
    });
    setResult(data);
    setLoading(false);
  };

  const types = [
    { key: 'cashflow' as const, label: t('cashflow_forecast', 'Cash Flow Forecast'), icon: TrendingUp, color: 'blue' },
    { key: 'anomaly' as const, label: t('anomaly_detection', 'Anomaly Detection'), icon: AlertTriangle, color: 'amber' },
    { key: 'risk' as const, label: t('risk_assessment', 'Risk Assessment'), icon: Eye, color: 'red' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('ai_insights', 'AI Financial Insights')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {types.map(tp => (
          <button key={tp.key} onClick={() => setType(tp.key)}
            className={`p-6 rounded-[24px] text-left transition-all ${type === tp.key ? `bg-${tp.color}-600 text-white shadow-lg shadow-${tp.color}-600/20` : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-600/30'}`}>
            <tp.icon size={24} className={type === tp.key ? 'text-white' : 'text-zinc-400'} />
            <p className="mt-3 text-xs font-bold uppercase tracking-widest">{tp.label}</p>
          </button>
        ))}
      </div>
      <button onClick={runAnalysis} disabled={loading} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all">
        {loading ? <><Loader2 size={16} className="animate-spin" /> {t('analyzing', 'Analyzing...')}</> : <><Brain size={16} /> {t('run_analysis', 'Run Analysis')}</>}
      </button>
      {result && (
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black uppercase tracking-tight">{types.find(tp => tp.key === type)?.label}</h3>
            <span className="text-xs text-zinc-400">{result.data_points} data points | {result.period_analyzed}</span>
          </div>
          <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap leading-relaxed">
            {typeof result.analysis === 'string' ? result.analysis : JSON.stringify(result.analysis, null, 2)}
          </div>
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 8. TAX SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
const TaxSettings = () => {
  const { t } = useTranslation();
  const { company } = useCompany();
  const [tax, setTax] = useState<any>(null);
  const [summary, setSummary] = useState({ liability: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    Promise.all([
      supabase.from('tax_settings').select('*').eq('company_id', company.id).maybeSingle(),
      supabase.from('invoices').select('total_amount, vat_amount').eq('company_id', company.id).eq('status', 'paid'),
    ]).then(([taxRes, invRes]) => {
      setTax(taxRes.data);
      const liability = (invRes.data ?? []).reduce((s: number, i: any) => s + (Number(i.vat_amount) || 0), 0);
      setSummary({ liability });
      setLoading(false);
    });
  }, [company?.id]);

  const handleSave = async () => {
    if (!company?.id || !tax) return;
    await supabase.from('tax_settings').upsert({ ...tax, company_id: company.id });
  };

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('tax_compliance', 'Tax & Compliance')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black uppercase tracking-tight">{t('vat_config', 'VAT Configuration')}</h3>
            <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded">{tax ? t('active', 'Active') : t('not_configured', 'Not Configured')}</span>
          </div>
          <div className="space-y-6">
            <div><label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{t('vat_rate', 'Default VAT Rate (%)')}</label><input type="number" value={tax?.vat_rate ?? 5} onChange={e => setTax((p: any) => ({ ...p, vat_rate: Number(e.target.value) }))} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-bold" /></div>
            <div><label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{t('trn_number', 'TRN Number')}</label><input type="text" value={tax?.trn ?? ''} onChange={e => setTax((p: any) => ({ ...p, trn: e.target.value }))} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-bold" /></div>
            <button onClick={handleSave} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all">{t('save_config', 'Save Configuration')}</button>
          </div>
        </Card>
        <div className="bg-zinc-900 text-white p-8 rounded-[32px] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart3 size={120} /></div>
          <h3 className="font-black uppercase tracking-tight mb-4">{t('tax_summary', 'Tax Summary')}</h3>
          <p className="text-zinc-400 text-sm mb-8">{t('total_vat_liability', 'Total collected VAT liability')}</p>
          <div className="text-4xl font-black mb-2">{summary.liability.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600">AED</div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MODULE LAYOUT + ROUTER
// ═══════════════════════════════════════════════════════════════════════════
export default function AccountingModule() {
  const { t } = useTranslation();
  const navItems = [
    { icon: FileText, label: t('invoices', 'Invoices'), path: '' },
    { icon: BookOpen, label: t('chart_of_accounts'), path: 'accounts' },
    { icon: Layers, label: t('journal_entries'), path: 'journal' },
    { icon: FileText, label: t('general_ledger'), path: 'ledger' },
    { icon: BarChart3, label: t('financial_reports'), path: 'reports' },
    { icon: Building2, label: t('cost_centers', 'Cost Centers'), path: 'cost-centers' },
    { icon: Brain, label: t('ai_insights', 'AI Insights'), path: 'ai' },
    { icon: Settings, label: t('tax_settings', 'Tax Settings'), path: 'tax' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} end
            className={({ isActive }) => `flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all whitespace-nowrap ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:border-blue-600/50'}`}>
            <item.icon size={16} />
            <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Routes>
          <Route path="/" element={<InvoiceList />} />
          <Route path="/accounts" element={<ChartOfAccounts />} />
          <Route path="/journal" element={<JournalEntries />} />
          <Route path="/ledger" element={<GeneralLedger />} />
          <Route path="/reports" element={<FinancialReports />} />
          <Route path="/cost-centers" element={<CostCenters />} />
          <Route path="/ai" element={<AIInsights />} />
          <Route path="/tax" element={<TaxSettings />} />
        </Routes>
      </motion.div>
    </div>
  );
}
