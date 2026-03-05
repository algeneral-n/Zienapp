import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { 
  FileText, BarChart3, Settings, CreditCard,
  Plus, Download, Printer, Send
} from 'lucide-react';
import { motion } from 'motion/react';

const InvoiceList = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Invoices</h2>
      <div className="flex gap-3">
        <button className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all">
          Templates
        </button>
        <button className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all">
          <Plus size={16} /> New Invoice
        </button>
      </div>
    </div>
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
          {[
            { id: 'INV-2026-001', client: 'Acme Corp', amount: '12,500 AED', status: 'Paid' },
            { id: 'INV-2026-002', client: 'Global Tech', amount: '8,200 AED', status: 'Pending' },
            { id: 'INV-2026-003', client: 'Zien Academy', amount: '4,500 AED', status: 'Draft' },
          ].map((inv, i) => (
            <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="px-6 py-4 text-sm font-black tracking-tight">{inv.id}</td>
              <td className="px-6 py-4 text-xs font-medium text-zinc-500">{inv.client}</td>
              <td className="px-6 py-4 text-sm font-bold">{inv.amount}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' :
                  inv.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-zinc-500/10 text-zinc-500'
                }`}>{inv.status}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3 text-zinc-400">
                  <button className="hover:text-emerald-500 transition-colors"><Download size={16} /></button>
                  <button className="hover:text-emerald-500 transition-colors"><Printer size={16} /></button>
                  <button className="hover:text-emerald-500 transition-colors"><Send size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const TaxSettings = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-black uppercase tracking-tighter">Tax & Compliance</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black uppercase tracking-tight">VAT Configuration</h3>
          <span className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded">Active</span>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Default VAT Rate (%)</label>
            <input type="number" defaultValue={5} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">TRN Number</label>
            <input type="text" defaultValue="100234567890003" className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 px-4 text-sm font-bold" />
          </div>
          <button className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all">
            Save Configuration
          </button>
        </div>
      </div>
      <div className="bg-zinc-900 text-white p-8 rounded-[32px] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BarChart3 size={120} />
        </div>
        <h3 className="font-black uppercase tracking-tight mb-4">Tax Summary</h3>
        <p className="text-zinc-400 text-sm mb-8">Estimated tax liability for Q1 2026</p>
        <div className="text-4xl font-black mb-2">24,500.00</div>
        <div className="text-xs font-bold uppercase tracking-widest text-emerald-500">AED • 12% increase from Q4</div>
      </div>
    </div>
  </div>
);

const InvoiceTemplates = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-black uppercase tracking-tighter">Invoice Templates</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { name: 'Modern Minimal', preview: 'https://picsum.photos/seed/inv1/400/600' },
        { name: 'Professional Blue', preview: 'https://picsum.photos/seed/inv2/400/600' },
        { name: 'Corporate Dark', preview: 'https://picsum.photos/seed/inv3/400/600' },
      ].map((t, i) => (
        <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-[32px] border border-zinc-200 dark:border-zinc-800 group cursor-pointer">
          <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-4 overflow-hidden relative">
            <img src={t.preview} alt={t.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <button className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">Use Template</button>
            </div>
          </div>
          <p className="text-center font-bold uppercase tracking-tight">{t.name}</p>
        </div>
      ))}
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
          <Route path="/" element={<InvoiceList />} />
          <Route path="/tax" element={<TaxSettings />} />
          <Route path="/templates" element={<InvoiceTemplates />} />
          {/* Add other routes */}
        </Routes>
      </motion.div>
    </div>
  );
}
