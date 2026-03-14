import React, { useState } from 'react';
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield, Building2, Users, BarChart3,
  Zap, Megaphone, Wrench, Activity, Server,
  FileText, CreditCard, ScrollText, Bell, Database,
  MessageSquare, TicketCheck, Headphones, ChevronDown,
  LayoutDashboard, Lock, AlertTriangle, Globe,
  Plug, Palette, Heart, Terminal,
} from 'lucide-react';
import { HeaderControls } from '../components/HeaderControls';
import { useAuth } from '../contexts/AuthContext';

// ─── Founder Sub-modules ────────────────────────────────────────────────────
import ControlRoom from './founder/ControlRoom';
import SupremeAccess from './founder/SupremeAccess';
import TenantManagement from './founder/TenantManagement';
import { RevenueAnalytics, SubscriptionManager, ReportsCenter } from './founder/FinancialViews';
import { AIBuilder, MarketingSystem } from './founder/AIMarketing';
import AISubscriptions from './founder/AISubscriptions';
import AIErrorHandler from './founder/AIErrorHandler';
import ExternalMarketing from './founder/ExternalMarketing';
import {
  IntegrationControl, PlatformHealth, SecurityDashboard,
  SystemLogs, MaintenancePanel,
} from './founder/SystemMonitoring';
import { UserManagement } from './founder/UserManagement';
import {
  ChatBuilder, SupportTickets, VoiceControl,
  IncidentsAlerts, ProvisioningOps,
} from './founder/Communication';
import AICommandBar from '../components/founder/FounderAIChat';

// Lazy-load UIBuilder (new)
const UIBuilder = React.lazy(() => import('./founder/UIBuilder'));

// ─── Sidebar layer config ───────────────────────────────────────────────────
type SidebarItem = { icon: React.ElementType; label: string; path: string };
type SidebarLayer = { key: string; layer: number; label: string; icon: React.ElementType; items: SidebarItem[] };

function useSidebarLayers(t: (k: string) => string): SidebarLayer[] {
  return [
    {
      key: 'dashboard', layer: 2, label: t('global_dashboard') || 'Dashboard',
      icon: LayoutDashboard, items: [],
    },
    {
      key: 'supreme', layer: 1, label: t('supreme_access') || 'Supreme Access',
      icon: Lock, items: [],
    },
    {
      key: 'tenants', layer: 3, label: t('tenant_control') || 'Tenant Control',
      icon: Building2, items: [
        { icon: Building2, label: t('tenants') || 'Tenants', path: 'tenants' },
        { icon: Users, label: t('users') || 'Users', path: 'users' },
      ],
    },
    {
      key: 'ai', layer: 4, label: t('ai_builder') || 'AI Builder',
      icon: Zap, items: [
        { icon: Zap, label: t('ai_builder') || 'AI Builder', path: 'ai' },
        { icon: CreditCard, label: t('ai_subscriptions') || 'AI Subscriptions', path: 'ai-subscriptions' },
        { icon: AlertTriangle, label: t('ai_errors') || 'AI Errors', path: 'ai-errors' },
      ],
    },
    {
      key: 'marketing', layer: 5, label: t('marketing') || 'Marketing',
      icon: Megaphone, items: [
        { icon: Megaphone, label: t('internal_marketing') || 'Internal', path: 'marketing' },
        { icon: Globe, label: t('external_marketing') || 'External', path: 'marketing-external' },
      ],
    },
    {
      key: 'integrations', layer: 6, label: t('integrations') || 'Integrations',
      icon: Plug, items: [
        { icon: Plug, label: t('integrations') || 'Catalog', path: 'integrations' },
      ],
    },
    {
      key: 'billing', layer: 7, label: t('billing') || 'Billing',
      icon: CreditCard, items: [
        { icon: CreditCard, label: t('subscriptions') || 'Subscriptions', path: 'subscriptions' },
        { icon: BarChart3, label: t('revenue') || 'Revenue', path: 'revenue' },
        { icon: FileText, label: t('reports') || 'Reports', path: 'reports' },
      ],
    },
    {
      key: 'ui-builder', layer: 8, label: t('ui_builder') || 'UI Builder',
      icon: Palette, items: [],
    },
    {
      key: 'health', layer: 10, label: t('system_health') || 'System Health',
      icon: Heart, items: [
        { icon: Activity, label: t('health') || 'Health', path: 'health' },
        { icon: AlertTriangle, label: t('ai_errors') || 'Errors', path: 'errors' },
        { icon: ScrollText, label: t('logs') || 'Logs', path: 'logs' },
        { icon: Shield, label: t('security') || 'Security', path: 'security' },
        { icon: Bell, label: t('incidents') || 'Incidents', path: 'incidents' },
        { icon: Database, label: t('provisioning') || 'Provisioning', path: 'provisioning' },
        { icon: Server, label: t('maintenance') || 'Maintenance', path: 'maintenance' },
      ],
    },
    {
      key: 'comm', layer: 0, label: t('communication') || 'Communication',
      icon: MessageSquare, items: [
        { icon: MessageSquare, label: t('chat_builder') || 'Chat Builder', path: 'chat' },
        { icon: Headphones, label: t('voice_ai') || 'Voice AI', path: 'voice' },
        { icon: TicketCheck, label: t('support') || 'Support', path: 'support' },
      ],
    },
  ];
}

// ─── Collapsible layer component ────────────────────────────────────────────

function SidebarLayerSection({ layer, expanded, onToggle }: {
  layer: SidebarLayer;
  expanded: boolean;
  onToggle: () => void;
}) {
  // Layers with no sub-items render as direct NavLink
  if (layer.items.length === 0) {
    const pathMap: Record<string, string> = {
      dashboard: '',
      supreme: 'supreme',
      'ui-builder': 'ui-builder',
    };
    const path = pathMap[layer.key] ?? layer.key;
    const isSupreme = layer.key === 'supreme';
    return (
      <NavLink
        to={path}
        end={layer.key === 'dashboard'}
        className={({ isActive }) => `
          flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all
          ${isActive
            ? (isSupreme ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20')
            : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
        `}
      >
        <layer.icon size={16} />
        <span className="text-xs font-bold uppercase tracking-widest flex-1">{layer.label}</span>
        {layer.layer > 0 && (
          <span className="text-[9px] font-bold text-zinc-600 bg-white/10 px-1.5 py-0.5 rounded-md">L{layer.layer}</span>
        )}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          <layer.icon size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{layer.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {layer.layer > 0 && (
            <span className="text-[9px] font-bold text-zinc-600 bg-white/10 px-1.5 py-0.5 rounded-md">L{layer.layer}</span>
          )}
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {expanded && (
        <div className="space-y-0.5 pb-2">
          {layer.items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2 ml-2 rounded-xl transition-all text-xs
                ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <item.icon size={14} />
              <span className="font-bold uppercase tracking-widest">{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Derive current section for AI Chat context ─────────────────────────────

function useSectionContext(): string {
  const location = useLocation();
  const segment = location.pathname.split('/').filter(Boolean).pop() || 'command-center';
  return segment;
}

// ─── Main Layout ────────────────────────────────────────────────────────────

export default function FounderPage() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    tenants: false, ai: true, marketing: false, integrations: false,
    billing: false, health: false, comm: false,
  });
  const sectionContext = useSectionContext();
  const layers = useSidebarLayers(t);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 z-50 lg:z-auto
        w-72 h-screen bg-zinc-900 text-white flex flex-col overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">Z</div>
            <div>
              <span className="text-sm font-black tracking-tighter uppercase block">ZIEN</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Founder OS</span>
            </div>
          </Link>

          <nav className="space-y-0.5">
            {/* Layer-based sidebar */}
            {layers.map((layer, idx) => (
              <React.Fragment key={layer.key}>
                {/* Separator between Supreme Access and the rest */}
                {idx === 2 && <div className="h-px bg-white/10 my-3" />}
                {/* Separator before Communication */}
                {layer.key === 'comm' && <div className="h-px bg-white/10 my-3" />}
                <SidebarLayerSection
                  layer={layer}
                  expanded={!!expandedGroups[layer.key]}
                  onToggle={() => toggleGroup(layer.key)}
                />
              </React.Fragment>
            ))}
          </nav>

          {/* Close button on mobile */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden mt-4 px-4 py-2 bg-white/10 rounded-xl text-xs font-bold text-white w-full">{t('close')}</button>
        </div>

        <div className="mt-auto p-6">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t('founder_access') || 'Founder Access'}</p>
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
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter">{t('platform_control_center') || 'Platform Control Center'}</h1>
            </div>
          </div>
          <HeaderControls />
        </header>

        {/* Layer 9: AI Command Bar */}
        <AICommandBar sectionContext={sectionContext} />

        <div className="p-4 md:p-8 flex-1">
          <React.Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>}>
            <Routes>
              <Route path="/" element={<ControlRoom />} />
              <Route path="/supreme" element={<SupremeAccess />} />
              <Route path="/tenants" element={<TenantManagement />} />
              <Route path="/revenue" element={<RevenueAnalytics />} />
              <Route path="/subscriptions" element={<SubscriptionManager />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/logs" element={<SystemLogs />} />
              <Route path="/ai" element={<AIBuilder />} />
              <Route path="/ai-subscriptions" element={<AISubscriptions />} />
              <Route path="/ai-errors" element={<AIErrorHandler />} />
              <Route path="/marketing" element={<MarketingSystem />} />
              <Route path="/marketing-external" element={<ExternalMarketing />} />
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
              <Route path="/errors" element={<AIErrorHandler />} />
              <Route path="/ui-builder" element={<UIBuilder />} />
            </Routes>
          </React.Suspense>
        </div>
      </main>
    </div>
  );
}
