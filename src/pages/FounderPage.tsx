import React, { useState } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield, Building2, Users, BarChart3,
  Zap, Megaphone, Wrench, Activity, Server,
  FileText, CreditCard, ScrollText, Bell, Database,
  MessageSquare, TicketCheck, Headphones,
} from 'lucide-react';
import { HeaderControls } from '../components/HeaderControls';
import { useAuth } from '../contexts/AuthContext';

// ─── Founder Sub-modules ────────────────────────────────────────────────────
import TenantManagement from './founder/TenantManagement';
import { RevenueAnalytics, SubscriptionManager, ReportsCenter } from './founder/FinancialViews';
import { AIBuilder, MarketingSystem } from './founder/AIMarketing';
import {
  IntegrationControl, PlatformHealth, SecurityDashboard,
  SystemLogs, MaintenancePanel,
} from './founder/SystemMonitoring';
import { UserManagement } from './founder/UserManagement';
import {
  ChatBuilder, SupportTickets, VoiceControl,
  IncidentsAlerts, ProvisioningOps,
} from './founder/Communication';

// ─── Main Layout ────────────────────────────────────────────────────────────

export default function FounderPage() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 z-50 lg:z-auto
        w-72 h-screen bg-zinc-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">Z</div>
            <span className="text-xl font-black tracking-tighter uppercase">{t('zien_founder')}</span>
          </Link>
          <nav className="space-y-2">
            {[
              { icon: Building2, label: t('tenants'), path: '' },
              { icon: BarChart3, label: t('revenue'), path: 'revenue' },
              { icon: CreditCard, label: t('subscriptions'), path: 'subscriptions' },
              { icon: Users, label: t('users'), path: 'users' },
              { icon: ScrollText, label: t('logs'), path: 'logs' },
              { icon: Zap, label: t('ai_builder'), path: 'ai' },
              { icon: Megaphone, label: t('marketing'), path: 'marketing' },
              { icon: Wrench, label: t('integrations'), path: 'integrations' },
              { icon: Activity, label: t('health'), path: 'health' },
              { icon: Server, label: t('maintenance'), path: 'maintenance' },
              { icon: FileText, label: t('reports'), path: 'reports' },
              { icon: Shield, label: t('security'), path: 'security' },
              { icon: MessageSquare, label: t('chat_builder'), path: 'chat' },
              { icon: TicketCheck, label: t('support'), path: 'support' },
              { icon: Headphones, label: t('voice_ai'), path: 'voice' },
              { icon: Bell, label: t('incidents'), path: 'incidents' },
              { icon: Database, label: t('provisioning'), path: 'provisioning' },
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
          {/* Close button on mobile */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden mt-4 px-4 py-2 bg-white/10 rounded-xl text-xs font-bold text-white">{t('close')}</button>
        </div>
        <div className="mt-auto p-8">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t('founder_access')}</p>
            <p className="text-xs font-bold truncate">
              {profile?.fullName || profile?.displayName || user?.email || 'Founder'}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 md:h-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter">{t('platform_control_center')}</h1>
          </div>
          <HeaderControls />
        </header>

        <div className="p-8">
          <Routes>
            <Route path="/" element={<TenantManagement />} />
            <Route path="/revenue" element={<RevenueAnalytics />} />
            <Route path="/subscriptions" element={<SubscriptionManager />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/logs" element={<SystemLogs />} />
            <Route path="/ai" element={<AIBuilder />} />
            <Route path="/marketing" element={<MarketingSystem />} />
            <Route path="/integrations" element={<IntegrationControl />} />
            <Route path="/health" element={<PlatformHealth />} />
            <Route path="/maintenance" element={<MaintenancePanel />} />
            <Route path="/reports" element={<ReportsCenter />} />
            <Route path="/security" element={<SecurityDashboard />} />
            <Route path="/chat" element={<ChatBuilder />} />
            <Route path="/support" element={<SupportTickets />} />
            <Route path="/voice" element={<VoiceControl />} />
            <Route path="/incidents" element={<IncidentsAlerts />} />
            <Route path="/provisioning" element={<ProvisioningOps />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
