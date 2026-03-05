import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  FileText, BarChart3, Settings, CreditCard,
  Plus, Download, Printer, Send, Loader2, X
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../services/supabase';

// ─── Invoices ───────────────────────────────────────────────────────────
const InvoiceList = () => {
  const { company } = useCompany();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_name: '', total_amount: '', vat_amount: '', notes: '' });

  const fetchInvoices = () => {
    if (!company?.id) return;
    supabase
      .from('invoices')
      .select('id, invoice_number, client_name, total_amount, status, created_at')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setInvoices(data ?? []); setLoading(false); });
  };

  useEffect(() => { fetchInvoices(); }, [company?.id]);

  const handleCreate = async () => {
    if (!company?.id || !form.client_name) return;
    setSaving(true);
    const invNum = `INV-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await supabase.from('invoices').insert({
      company_id: company.id,
      invoice_number: invNum,
      client_name: form.client_name,
      total_amount: parseFloat(form.total_amount) || 0,
      vat_amount: parseFloat(form.vat_amount) || 0,
      status: 'draft',
      notes: form.notes || null,
    });
    setSaving(false);
    if (!error) {
      setShowCreate(false);
      setForm({ client_name: '', total_amount: '', vat_amount: '', notes: '' });
      fetchInvoices();
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Invoices</h2>
        <div className="flex gap-3">
          <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all">
            <Plus size={16} /> New Invoice
          </button>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black uppercase tracking-tight">New Invoice</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Client name" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} placeholder="Total amount (AED)" type="number" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <input value={form.vat_amount} onChange={e => setForm(f => ({ ...f, vat_amount: e.target.value }))} placeholder="VAT amount (AED)" type="number" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" rows={3} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm resize-none" />
            </div>
            <button onClick={handleCreate} disabled={saving || !form.client_name} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all">
              {saving ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Invoice #</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Client</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Amount</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {invoices.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 text-sm">No invoices yet</td></tr>
            ) : invoices.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-black tracking-tight">{inv.invoice_number || inv.id.slice(0, 8)}</td>
                <td className="px-6 py-4 text-xs font-medium text-zinc-500">{inv.client_name ?? '-'}</td>
                <td className="px-6 py-4 text-sm font-bold">{Number(inv.total_amount || 0).toLocaleString()} AED</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${inv.status === 'paid' ? 'bg-blue-600/10 text-blue-600' :
                    inv.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-zinc-500/10 text-zinc-500'
                    }`}>{inv.status}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <button className="hover:text-blue-600 transition-colors"><Download size={16} /></button>
                    <button className="hover:text-blue-600 transition-colors"><Printer size={16} /></button>
                    <button className="hover:text-blue-600 transition-colors"><Send size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Tax Settings ───────────────────────────────────────────────────────
const TaxSettings = () => {
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

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Tax & Compliance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black uppercase tracking-tight">VAT Configuration</h3>
            <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded">
              {tax ? 'Active' : 'Not Configured'}
            </span>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Default VAT Rate (%)</label>
              <input
                type="number"
                value={tax?.vat_rate ?? 5}
                onChange={(e) => setTax((p: any) => ({ ...p, vat_rate: Number(e.target.value) }))}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">TRN Number</label>
              <input
                type="text"
                value={tax?.trn ?? ''}
                onChange={(e) => setTax((p: any) => ({ ...p, trn: e.target.value }))}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-bold"
              />
            </div>
            <button onClick={handleSave} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all">
              Save Configuration
            </button>
          </div>
        </div>
        <div className="bg-zinc-900 text-white p-8 rounded-[32px] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BarChart3 size={120} />
          </div>
          <h3 className="font-black uppercase tracking-tight mb-4">Tax Summary</h3>
          <p className="text-zinc-400 text-sm mb-8">Total collected VAT liability</p>
          <div className="text-4xl font-black mb-2">{summary.liability.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600">AED</div>
        </div>
      </div>
    </div>
  );
};

// ─── Invoice Templates (static config - acceptable) ─────────────────────
const InvoiceTemplates = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-black uppercase tracking-tighter">Invoice Templates</h2>
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800 text-center">
      <p className="text-zinc-500 text-sm">Invoice templates will be loaded from your company configuration.</p>
      <p className="text-zinc-400 text-xs mt-2">Contact support or upgrade your plan to unlock custom templates.</p>
    </div>
  </div>
);

export default function AccountingModule() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { icon: FileText, label: 'Invoices', path: '' },
          { icon: BarChart3, label: 'Analytics', path: 'analytics' },
          { icon: CreditCard, label: 'Payments', path: 'payments' },
          { icon: FileText, label: 'Templates', path: 'templates' },
          { icon: Settings, label: 'Tax Settings', path: 'tax' },
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
          <Route path="/" element={<InvoiceList />} />
          <Route path="/tax" element={<TaxSettings />} />
          <Route path="/templates" element={<InvoiceTemplates />} />
          {/* Add other routes */}
        </Routes>
      </motion.div>
    </div>
  );
}
