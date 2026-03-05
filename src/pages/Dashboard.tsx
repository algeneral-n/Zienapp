import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { HeaderControls } from '../components/HeaderControls';
import { FloatingRARE } from '../components/FloatingRARE';
import { 
  Bell, Search, User, 
  LayoutDashboard, Users, BarChart3, Truck, 
  MessageSquare, ShoppingBag, Briefcase, BrainCircuit
} from 'lucide-react';

// Lazy load modules
const Overview = React.lazy(() => import('./modules/Overview'));
const HRModule = React.lazy(() => import('./modules/HRModule'));
const AccountingModule = React.lazy(() => import('./modules/AccountingModule'));
const LogisticsModule = React.lazy(() => import('./modules/LogisticsModule'));
const CRMModule = React.lazy(() => import('./modules/CRMModule'));
const Academy = React.lazy(() => import('./modules/Academy'));
const HelpCenter = React.lazy(() => import('./modules/HelpCenter'));

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-20 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-soft)] flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="Search everything..." 
                className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <HeaderControls />
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
            <button className="relative p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950" />
            </button>
            <Link to="/dashboard/profile" className="flex items-center gap-3 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">JD</div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold uppercase tracking-tight">John Doe</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">General Manager</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          <React.Suspense fallback={<div className="flex items-center justify-center h-64">Loading Module...</div>}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/hr/*" element={<HRModule />} />
              <Route path="/accounting/*" element={<AccountingModule />} />
              <Route path="/logistics/*" element={<LogisticsModule />} />
              <Route path="/crm/*" element={<CRMModule />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/help" element={<HelpCenter />} />
              {/* Add other routes as needed */}
            </Routes>
          </React.Suspense>
        </div>
      </main>

      <FloatingRARE />
    </div>
  );
}
