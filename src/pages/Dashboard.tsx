import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '../components/Sidebar';
import { HeaderControls } from '../components/HeaderControls';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
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
const RAREManagement = React.lazy(() => import('./modules/RAREManagement'));
const StoreModule = React.lazy(() => import('./modules/StoreModule'));
const ProjectsModule = React.lazy(() => import('./modules/ProjectsModule'));
const MeetingsModule = React.lazy(() => import('./modules/MeetingsModule'));
const ChatModule = React.lazy(() => import('./modules/ChatModule'));
const IntegrationsModule = React.lazy(() => import('./modules/IntegrationsModule'));
const PortalBuilder = React.lazy(() => import('./modules/PortalBuilder'));
const BillingModule = React.lazy(() => import('./modules/BillingModule'));
const SettingsPage = React.lazy(() => import('./modules/SettingsPage'));
const ProfilePage = React.lazy(() => import('./modules/ProfilePage'));

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { company: activeCompany, role } = useCompany();

  const displayName = profile?.fullName || profile?.displayName || user?.email?.split('@')[0] || t('user', 'User');
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
  const roleName = (role || 'member').replace(/_/g, ' ');

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div
        data-tour="sidebar"
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              aria-label="Open menu"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="relative max-w-md w-full hidden md:block" data-tour="search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder={t('search_everything', 'Search everything...')}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <HeaderControls />
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
            <button data-tour="notifications" className="relative p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950" />
            </button>
            <Link to="/dashboard/profile" className="flex items-center gap-3 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">{initials}</div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold uppercase tracking-tight">{displayName}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{roleName}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          <React.Suspense fallback={<div className="flex items-center justify-center h-64">{t('loading_module', 'Loading Module...')}</div>}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/hr/*" element={<HRModule />} />
              <Route path="/accounting/*" element={<AccountingModule />} />
              <Route path="/logistics/*" element={<LogisticsModule />} />
              <Route path="/crm/*" element={<CRMModule />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/rare" element={<RAREManagement />} />
              <Route path="/store" element={<StoreModule />} />
              <Route path="/projects" element={<ProjectsModule />} />
              <Route path="/meetings" element={<MeetingsModule />} />
              <Route path="/chat" element={<ChatModule />} />
              <Route path="/integrations" element={<IntegrationsModule />} />
              <Route path="/portal-builder" element={<PortalBuilder />} />
              <Route path="/billing/*" element={<BillingModule />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </React.Suspense>
        </div>
      </main>

    </div>
  );
}
