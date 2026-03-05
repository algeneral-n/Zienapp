import React from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { 
  Briefcase, FileText, CreditCard, MessageSquare,
  Bell, LogOut, CheckCircle2, Clock, Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { HeaderControls } from '../components/HeaderControls';

const ClientOverview = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Active Projects</p>
        <p className="text-3xl font-black">2</p>
        <div className="mt-4 flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Pending Invoices</p>
        <p className="text-3xl font-black">1</p>
        <p className="text-[10px] text-amber-500 font-bold mt-2 uppercase tracking-widest">Due in 3 days</p>
      </div>
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Open Quotes</p>
        <p className="text-3xl font-black">1</p>
        <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase tracking-widest">Awaiting Approval</p>
      </div>
    </div>

    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800">
      <h3 className="font-black uppercase tracking-tight mb-8">Recent Documents</h3>
      <div className="space-y-4">
        {[
          { title: 'Project Proposal - Phase 2', type: 'Quote', date: 'Feb 22, 2026' },
          { title: 'Service Agreement 2026', type: 'Contract', date: 'Jan 15, 2026' },
          { title: 'Invoice #INV-2026-001', type: 'Invoice', date: 'Feb 01, 2026' },
        ].map((doc, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl group hover:border-emerald-500 border border-transparent transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-emerald-500 transition-colors">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">{doc.title}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{doc.type} • {doc.date}</p>
              </div>
            </div>
            <Download size={18} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function ClientPortal() {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="w-72 h-screen bg-zinc-900 text-white flex flex-col sticky top-0">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-xl">Z</div>
            <span className="text-xl font-black tracking-tighter uppercase">Client Portal</span>
          </Link>
          <nav className="space-y-2">
            {[
              { icon: Briefcase, label: 'Projects', path: '' },
              { icon: FileText, label: 'Quotes', path: 'quotes' },
              { icon: FileText, label: 'Contracts', path: 'contracts' },
              { icon: CreditCard, label: 'Invoices', path: 'invoices' },
              { icon: MessageSquare, label: 'Support', path: 'support' },
            ].map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                end
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Connected to</p>
            <p className="text-xs font-bold truncate">Acme Corporation</p>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all group">
            <LogOut size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-20 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-soft)] flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold">AC</div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight">Acme Corp</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Premium Client</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <HeaderControls />
            <button className="relative p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950" />
            </button>
          </div>
        </header>

        <div className="p-8">
          <Routes>
            <Route path="/" element={<ClientOverview />} />
            {/* Add other routes */}
          </Routes>
        </div>
      </main>
    </div>
  );
}
