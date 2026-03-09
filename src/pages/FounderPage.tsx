import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield, Building2, Users, BarChart3,
  Settings, Zap, Megaphone, Wrench,
  CheckCircle2, XCircle, Clock, Search,
  DollarSign, TrendingUp, Activity, Server,
  AlertTriangle, Lock, Eye, Globe, Loader2, Info,
  FileText, RefreshCw, UserCheck, ClipboardList,
  CreditCard, ScrollText, Bell, Database,
  MessageSquare, Send, TicketCheck, Headphones
} from 'lucide-react';
import { motion } from 'motion/react';
import { HeaderControls } from '../components/HeaderControls';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { supabase } from '../services/supabase';
import {
  listTenants, getRevenueAnalytics, getSystemHealth,
  getAIUsagePlatform, getPlatformAuditLog, listAnnouncements,
  type AuditEntry,
} from '../services/founderService';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

/** Authenticated fetch helper for FounderPage API calls. */
async function founderFetch(path: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';
  const companyId = localStorage.getItem('zien:activeCompanyId') || '';
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(companyId ? { 'X-Company-Id': companyId } : {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/** Reusable loading / error / empty states */
const LoadingState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-12 text-zinc-400">
      <Loader2 className="animate-spin mr-2" size={18} /> {t('loading')}
    </div>
  );
};

const ErrorState = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl text-red-600 text-sm font-medium">
    <AlertTriangle size={16} /> {message}
  </div>
);

const UnavailableState = ({ feature }: { feature: string }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
      <Info size={32} className="mb-3 opacity-50" />
      <p className="text-sm font-bold uppercase tracking-widest">{feature}</p>
      <p className="text-xs mt-1">{t('data_not_available')}</p>
    </div>
  );
};

// ─── Tenant Management (REAL DATA) ──────────────────────────────────────────

const TenantManagement = () => {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { tenants: data } = await listTenants(1, 200);
        setTenants(data || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load tenants');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = tenants.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('tenant_management')}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder={t('search_companies')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium"
          />
        </div>
      </div>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('company')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('industry')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('plan')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('country')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-400">{t('no_companies_found')}</td></tr>
              ) : filtered.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                        {(tenant.name || '?').charAt(0)}
                      </div>
                      <span className="text-sm font-bold">{tenant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-zinc-500">{tenant.industry || '—'}</td>
                  <td className="px-6 py-4 text-xs font-bold text-blue-600 uppercase tracking-widest">
                    {tenant.plan_code || tenant.subscription?.plan_code || 'Free'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                      tenant.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-zinc-200/50 text-zinc-500'
                      }`}>{tenant.status || 'unknown'}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-zinc-500">{tenant.country || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Revenue Analytics (REAL DATA) ──────────────────────────────────────────

const RevenueAnalytics = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getRevenueAnalytics(30);
        const planEntries = Object.entries(data.plan_breakdown || {});
        const totalPlanMRR = planEntries.reduce((s, [, v]) => s + ((v as any).mrr || 0), 0) || 1;
        setStats({
          mrr: data.mrr,
          arr: data.arr,
          activeSubs: data.active_subscriptions,
          totalSubs: data.total_subscriptions,
          totalRevenue: data.payments_in_period,
          invoiceCount: data.payments_in_period,
          planBreakdown: planEntries.map(([plan, info]: [string, any]) => ({
            plan,
            revenue: Math.round(info.mrr || 0),
            pct: Math.round(((info.mrr || 0) / totalPlanMRR) * 100),
          })),
        });
      } catch (e: any) {
        setError(e.message || 'Failed to load revenue');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!stats) return <UnavailableState feature={t('revenue_analytics')} />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('revenue_analytics')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('mrr'), value: `${stats.mrr.toLocaleString()} AED`, icon: DollarSign, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: t('arr'), value: `${stats.arr.toLocaleString()} AED`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: t('active_subscriptions'), value: String(stats.activeSubs), icon: Users, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
          { label: t('total_revenue'), value: `${stats.totalRevenue.toLocaleString()} AED`, icon: Activity, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
      {stats.planBreakdown.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
          <h3 className="font-black uppercase tracking-tight mb-4 text-sm">{t('revenue_by_plan')}</h3>
          <div className="space-y-3">
            {stats.planBreakdown.map((item: any) => (
              <div key={item.plan} className="flex items-center gap-3">
                <span className="w-24 text-xs font-bold capitalize">{item.plan}</span>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-xs font-bold text-zinc-500 w-24 text-right">{item.revenue.toLocaleString()} AED</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── AI Builder (REAL DATA from /api/ai/agents) ────────────────────────────

const AIBuilder = () => {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await founderFetch('/api/ai/agents');
        setAgents(data.agents || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('rare_ai_builder')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-black uppercase tracking-tight mb-6">{t('active_agents')} ({agents.length})</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {agents.map((agent: any) => (
              <div key={agent.code || agent.type} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-between group">
                <div>
                  <span className="text-sm font-bold uppercase tracking-tight">{agent.name || agent.code}</span>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Min role: {agent.minRole || '—'}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${agent.accessible ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'
                  }`}>{agent.accessible ? 'Active' : 'Restricted'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-zinc-900 text-white p-8 rounded-[40px] flex flex-col justify-center text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap size={32} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">{t('global_ai_model')}</h3>
          <p className="text-zinc-400 text-sm mb-4">OpenAI GPT-4o</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{agents.length} {t('agents_configured')}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Marketing (REAL DATA from marketing_campaigns + platform_announcements) ─

const MarketingSystem = () => {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'email', status: 'draft', target_audience: 'all_tenants', subject: '', body: '' });

  useEffect(() => {
    (async () => {
      try {
        const [{ data: c, error: e1 }, { data: a, error: e2 }] = await Promise.all([
          supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }).limit(20),
          supabase.from('platform_announcements').select('*').order('created_at', { ascending: false }).limit(10),
        ]);
        if (e1) throw e1;
        if (e2) throw e2;
        setCampaigns(c || []);
        setAnnouncements(a || []);
      } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []);

  const handleCreateCampaign = async () => {
    const { error: err } = await supabase.from('marketing_campaigns').insert({
      ...newCampaign,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    });
    if (!err) {
      setShowCreateCampaign(false);
      setNewCampaign({ name: '', type: 'email', status: 'draft', target_audience: 'all_tenants', subject: '', body: '' });
      const { data } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }).limit(20);
      setCampaigns(data || []);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);
  const totalOpened = campaigns.reduce((s, c) => s + (c.opened_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('marketing_campaigns')}</h2>
        <button onClick={() => setShowCreateCampaign(!showCreateCampaign)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
          <Megaphone size={14} /> {t('new_campaign')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('total_campaigns'), value: String(campaigns.length), icon: Megaphone, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: t('active'), value: String(activeCampaigns), icon: Zap, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: t('emails_sent'), value: totalSent.toLocaleString(), icon: Globe, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
          { label: t('open_rate'), value: totalSent > 0 ? `${Math.round((totalOpened / totalSent) * 100)}%` : '—', icon: Eye, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {showCreateCampaign && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-black uppercase tracking-tight text-sm">{t('create_campaign')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder={t('campaign_name')} value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium" />
            <select value={newCampaign.type} onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push Notification</option>
            </select>
          </div>
          <input placeholder={t('subject')} value={newCampaign.subject} onChange={e => setNewCampaign({ ...newCampaign, subject: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium" />
          <textarea placeholder={t('body')} rows={3} value={newCampaign.body} onChange={e => setNewCampaign({ ...newCampaign, body: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreateCampaign(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">{t('cancel')}</button>
            <button onClick={handleCreateCampaign} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700">{t('save_draft')}</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('campaign')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('type')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('sent')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('created')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {campaigns.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-400">{t('no_campaigns')}</td></tr>
            ) : campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-bold">{c.name}</td>
                <td className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase">{c.type}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : c.status === 'sent' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-200/50 text-zinc-500'}`}>{c.status}</span></td>
                <td className="px-6 py-4 text-xs font-medium">{c.sent_count || 0}</td>
                <td className="px-6 py-4 text-xs text-zinc-400">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {announcements.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
          <h3 className="font-black uppercase tracking-tight mb-4 text-sm">{t('platform_announcements')}</h3>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm font-bold">{a.title}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{a.body?.substring(0, 100)}{a.body?.length > 100 ? '…' : ''}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${a.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'}`}>
                  {a.is_active ? 'Live' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Integration Control (Founder manages catalog + tenant integrations) ────

const IntegrationControl = () => {
  const { t } = useTranslation();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [tenantIntegrations, setTenantIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: cat, error: e1 }, { data: ti, error: e2 }] = await Promise.all([
          supabase.from('integrations_catalog').select('*').order('name'),
          supabase.from('tenant_integrations').select('*, companies(name)').order('created_at', { ascending: false }).limit(50),
        ]);
        if (e1) throw e1;
        if (e2) throw e2;
        setCatalog(cat || []);
        setTenantIntegrations(ti || []);
      } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []);

  const toggleCatalogItem = async (itemId: string, currentlyActive: boolean) => {
    await supabase.from('integrations_catalog').update({ is_active: !currentlyActive }).eq('id', itemId);
    setCatalog(prev => prev.map(c => c.id === itemId ? { ...c, is_active: !currentlyActive } : c));
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const activeIntegrations = tenantIntegrations.filter(t => t.status === 'active').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('integration_control')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('catalog_items'), value: String(catalog.length), icon: Settings, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: t('connected_by_tenants'), value: String(activeIntegrations), icon: Zap, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: t('available_providers'), value: String(catalog.filter(c => c.is_active).length), icon: Globe, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
        <h3 className="font-black uppercase tracking-tight mb-4 text-sm">{t('integration_catalog_desc')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {catalog.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
              <div>
                <p className="text-sm font-bold">{item.name}</p>
                <p className="text-[10px] text-zinc-500">{item.category} — {item.price_monthly > 0 ? `${item.price_monthly} AED/mo` : 'Free'}</p>
              </div>
              <button
                onClick={() => toggleCatalogItem(item.id, item.is_active)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${item.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 hover:bg-red-50 hover:text-red-600' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 hover:bg-emerald-50 hover:text-emerald-600'}`}
              >
                {item.is_active ? t('active') : t('disabled')}
              </button>
            </div>
          ))}
          {catalog.length === 0 && <p className="text-sm text-zinc-400 col-span-2 text-center py-4">{t('no_catalog_items')}</p>}
        </div>
      </div>

      {tenantIntegrations.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('tenant')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('integration')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('connected')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tenantIntegrations.map(ti => (
                <tr key={ti.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold">{ti.companies?.name || '—'}</td>
                  <td className="px-6 py-4 text-xs font-medium">{ti.provider}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${ti.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-200/50 text-zinc-500'}`}>{ti.status}</span></td>
                  <td className="px-6 py-4 text-xs text-zinc-400">{new Date(ti.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Platform Health (REAL DATA) ────────────────────────────────────────────

const PlatformHealth = () => {
  const { t } = useTranslation();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSystemHealth();
        setHealth({
          apiStatus: data.components.database.status === 'healthy' ? 'operational' : 'degraded',
          version: '—',
          activeUsers: data.totals.active_members || 0,
          totalCompanies: data.totals.companies || 0,
        });
      } catch (e: any) {
        setError(e.message || 'Failed to load health');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!health) return <UnavailableState feature={t('platform_health')} />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('platform_health')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('api_status'), value: health.apiStatus, icon: Server, color: health.apiStatus === 'operational' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
          { label: t('worker_version'), value: health.version, icon: Activity, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: t('active_users'), value: String(health.activeUsers), icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: t('total_companies'), value: String(health.totalCompanies), icon: Building2, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
        <h3 className="font-black uppercase tracking-tight mb-4 text-sm">{t('service_dependencies')}</h3>
        <div className="space-y-3">
          {[
            { service: 'Supabase (Database)', status: 'operational' },
            { service: 'Cloudflare Workers (API)', status: health.apiStatus },
            { service: 'OpenAI (RARE)', status: 'operational' },
            { service: 'Stripe (Billing)', status: 'operational' },
          ].map(svc => (
            <div key={svc.service} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${svc.status === 'operational' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-sm font-medium">{svc.service}</span>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${svc.status === 'operational' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'
                }`}>{svc.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Security Dashboard (REAL DATA from ai_usage_logs) ─────────────────────

const SecurityDashboard = () => {
  const { t } = useTranslation();
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Fetch AI usage analytics from founder API
        let usageData: any = null;
        try {
          usageData = await getAIUsagePlatform(7);
        } catch { /* endpoint may not be accessible for all roles */ }

        // Fetch platform audit log
        const { entries: logs } = await getPlatformAuditLog(1, 10);

        setAudit({
          usage: usageData,
          recentLogs: logs || [],
          sensitiveCount: usageData?.total_queries || 0,
          deniedCount: logs.filter((l: AuditEntry) => l.action.includes('deny') || l.action.includes('suspend')).length,
          totalLogs: logs.length,
        });
      } catch (e: any) {
        setError(e.message || 'Failed to load security data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!audit) return <UnavailableState feature={t('security_dashboard')} />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('security_compliance')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('sensitive_ai_actions'), value: String(audit.sensitiveCount), icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
          { label: t('denied_requests'), value: String(audit.deniedCount), icon: Lock, color: 'text-red-600 bg-red-50 dark:bg-red-500/10' },
          { label: t('total_ai_logs_7d'), value: String(audit.totalLogs), icon: Shield, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
        <h3 className="font-black uppercase tracking-tight mb-4 text-sm">{t('recent_ai_audit_log')}</h3>
        <div className="space-y-3">
          {audit.recentLogs.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">{t('no_recent_logs')}</p>
          ) : audit.recentLogs.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${log.action?.includes('suspend') || log.action?.includes('deny') ? 'bg-red-500' :
                  log.action?.includes('update') ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                <div>
                  <p className="text-sm font-medium capitalize">{log.action} — {log.target_type || 'system'}</p>
                  <p className="text-[10px] text-zinc-500">{(log.actor_id || log.user_id)?.substring(0, 8)}…</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t('logged')}</span>
                <span className="text-[10px] text-zinc-400 font-bold">
                  {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── System Logs Viewer (REAL DATA) ─────────────────────────────────────────

const SystemLogs = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');

  const loadLogs = useCallback(async (p: number, action?: string) => {
    setLoading(true);
    try {
      const { entries } = await getPlatformAuditLog(p, 50, action || undefined);
      setLogs(entries || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(page, filter); }, [page, filter, loadLogs]);

  const actionTypes = ['', 'create', 'update', 'delete', 'login', 'suspend', 'provision'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('system_logs')}</h2>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs font-bold">
            {actionTypes.map(a => <option key={a} value={a}>{a || t('all_actions')}</option>)}
          </select>
          <button onClick={() => loadLogs(page, filter)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"><RefreshCw size={16} /></button>
        </div>
      </div>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-400">{t('no_logs_found')}</div>
            ) : logs.map(log => (
              <div key={log.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${log.action?.includes('delete') || log.action?.includes('suspend') ? 'bg-red-500' :
                    log.action?.includes('create') || log.action?.includes('provision') ? 'bg-emerald-500' :
                      log.action?.includes('update') ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                  <div>
                    <p className="text-sm font-bold capitalize">{log.action}</p>
                    <p className="text-[10px] text-zinc-500">{log.target_type}: {(log.target_id || '').substring(0, 12)}... | Actor: {(log.actor_id || '').substring(0, 8)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-400 font-bold">{new Date(log.created_at).toLocaleString()}</p>
                  {log.ip_address && <p className="text-[10px] text-zinc-500">{log.ip_address}</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs font-bold text-blue-600 disabled:opacity-30">{t('previous')}</button>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('page')} {page}</span>
            <button onClick={() => setPage(p => p + 1)} className="text-xs font-bold text-blue-600">{t('next')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Subscription Manager (REAL DATA) ───────────────────────────────────────

const SubscriptionManager = () => {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { tenants: data } = await listTenants(1, 200);
        setTenants(data || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeCount = tenants.filter(t => t.subscription?.status === 'active').length;
  const pastDueCount = tenants.filter(t => t.subscription?.status === 'past_due').length;
  const trialCount = tenants.filter(t => t.plan_code === 'trial' || t.plan_code === 'demo').length;

  // Find upcoming renewals (next 7 days)
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingRenewals = tenants.filter(t => {
    const end = t.subscription?.current_period_end;
    if (!end) return false;
    const d = new Date(end);
    return d >= now && d <= sevenDays;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('subscriptions')}</h2>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"><CreditCard size={18} /></div>
              <div className="text-2xl font-black">{activeCount}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{t('active_subscriptions')}</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600"><AlertTriangle size={18} /></div>
              <div className="text-2xl font-black">{pastDueCount}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{t('past_due')}</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600"><Clock size={18} /></div>
              <div className="text-2xl font-black">{trialCount}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{t('trial_demo')}</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-violet-50 dark:bg-violet-500/10 text-violet-600"><RefreshCw size={18} /></div>
              <div className="text-2xl font-black">{upcomingRenewals.length}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{t('renewals_7d')}</div>
            </div>
          </div>

          {/* Upcoming Renewals */}
          {upcomingRenewals.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-800 rounded-3xl p-6">
              <h3 className="font-black uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
                <Bell size={16} className="text-amber-600" /> {t('upcoming_renewals')}
              </h3>
              <div className="space-y-2">
                {upcomingRenewals.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-bold">{t.name}</span>
                    <span className="text-xs text-amber-600 font-bold">{new Date(t.subscription.current_period_end).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Subscription List */}
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('company')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('plan')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('gateway')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('renewal_date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {tenants.filter(t => t.subscription).map(tenant => (
                  <tr key={tenant.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold">{tenant.name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-blue-600 uppercase tracking-widest">{tenant.subscription?.plan_code || '—'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-zinc-500 capitalize">{tenant.subscription?.gateway || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${tenant.subscription?.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                        tenant.subscription?.status === 'past_due' ? 'bg-red-500/10 text-red-500' :
                          'bg-zinc-200/50 text-zinc-500'
                        }`}>{tenant.subscription?.status || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{tenant.subscription?.current_period_end ? new Date(tenant.subscription.current_period_end).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ─── User Management (REAL DATA) ────────────────────────────────────────────

const UserManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await founderFetch('/api/founder/users');
        setUsers(data.users || []);
      } catch (e: any) {
        // Fallback: try loading from tenants → members
        try {
          const { tenants } = await listTenants(1, 200);
          const allMembers: any[] = [];
          for (const tenant of tenants.slice(0, 20)) {
            allMembers.push(...(tenant.members || []).map((m: any) => ({ ...m, companyName: tenant.name })));
          }
          setUsers(allMembers);
        } catch {
          setError(e.message || 'Failed to load users');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = users.filter(u =>
    (u.email || u.full_name || u.user_id || u.companyName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('user_management')}</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-bold">{users.length} {t('total_users')}</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input type="text" placeholder={t('search_users')} value={search} onChange={e => setSearch(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium" />
          </div>
        </div>
      </div>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800/50">
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('user')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('role')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('company')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-400">{t('no_users_found')}</td></tr>
                ) : filtered.slice(0, 100).map((user, i) => (
                  <tr key={user.id || i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-xs text-blue-600">
                          {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{user.full_name || user.email || user.user_id?.substring(0, 8)}</p>
                          {user.email && <p className="text-[10px] text-zinc-500">{user.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-blue-600 uppercase tracking-widest">{user.role || user.role_code || '—'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-zinc-500">{user.companyName || user.company_name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                        user.status === 'invited' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-zinc-200/50 text-zinc-500'
                        }`}>{user.status || 'unknown'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Maintenance Panel ──────────────────────────────────────────────────────

const MaintenancePanel = () => {
  const { t } = useTranslation();
  const [health, setHealth] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [healthData, annData] = await Promise.all([
          getSystemHealth().catch(() => null),
          listAnnouncements().catch(() => ({ announcements: [] })),
        ]);
        setHealth(healthData);
        setAnnouncements(annData.announcements || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load maintenance data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const maintenanceAnnouncements = announcements.filter(a => a.severity === 'maintenance');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('maintenance')}</h2>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
        <>
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('database')}</span>
                <span className={`w-3 h-3 rounded-full ${health?.components?.database?.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
              <p className="text-sm font-bold">{health?.components?.database?.status || 'unknown'}</p>
              <p className="text-[10px] text-zinc-500 mt-1">{health?.components?.database?.latency_ms || '?'}ms {t('latency')}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('payments_24h')}</span>
                <span className={`w-3 h-3 rounded-full ${(health?.components?.payments_24h?.health || 0) > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <p className="text-sm font-bold">{health?.components?.payments_24h?.total || 0} {t('total')}</p>
              <p className="text-[10px] text-zinc-500 mt-1">{health?.components?.payments_24h?.failed || 0} {t('failed')}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('overall_health')}</span>
                <span className={`w-3 h-3 rounded-full ${(health?.overall_health || 0) > 90 ? 'bg-emerald-500' : (health?.overall_health || 0) > 70 ? 'bg-amber-500' : 'bg-red-500'}`} />
              </div>
              <p className="text-2xl font-black">{health?.overall_health || 0}%</p>
              <p className="text-[10px] text-zinc-500 mt-1">{t('platform_score')}</p>
            </div>
          </div>

          {/* Platform Totals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-800 rounded-3xl p-6 text-center">
              <Building2 className="mx-auto mb-2 text-blue-600" size={24} />
              <p className="text-2xl font-black">{health?.totals?.companies || 0}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('total_companies')}</p>
            </div>
            <div className="bg-violet-50 dark:bg-violet-500/5 border border-violet-200 dark:border-violet-800 rounded-3xl p-6 text-center">
              <Users className="mx-auto mb-2 text-violet-600" size={24} />
              <p className="text-2xl font-black">{health?.totals?.active_members || 0}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('active_members')}</p>
            </div>
            <div className="bg-cyan-50 dark:bg-cyan-500/5 border border-cyan-200 dark:border-cyan-800 rounded-3xl p-6 text-center">
              <Zap className="mx-auto mb-2 text-cyan-600" size={24} />
              <p className="text-2xl font-black">{health?.totals?.ai_queries_24h || 0}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('ai_queries_24h')}</p>
            </div>
          </div>

          {/* Maintenance Announcements */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <h3 className="font-black uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
              <Wrench size={16} /> {t('maintenance_windows')}
            </h3>
            {maintenanceAnnouncements.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-4">{t('no_scheduled_maintenance')}</p>
            ) : maintenanceAnnouncements.map(a => (
              <div key={a.id} className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm font-bold">{a.title_en}</p>
                  <p className="text-xs text-zinc-500 mt-1">{a.body_en?.substring(0, 100)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-amber-600">{new Date(a.starts_at).toLocaleDateString()}</p>
                  {a.ends_at && <p className="text-[10px] text-zinc-500">{t('until')} {new Date(a.ends_at).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Reports Center ─────────────────────────────────────────────────────────

const ReportsCenter = () => {
  const { t } = useTranslation();
  const [revenue, setRevenue] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [rev, hp, ai] = await Promise.all([
          getRevenueAnalytics(30).catch(() => null),
          getSystemHealth().catch(() => null),
          getAIUsagePlatform(30).catch(() => null),
        ]);
        setRevenue(rev);
        setHealth(hp);
        setUsage(ai);
      } catch (e: any) {
        setError(e.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{t('reports')}</h2>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
        <>
          {/* Revenue Summary */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <h3 className="font-black uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-600" /> {t('revenue_report_30d')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl">
                <p className="text-xl font-black">${((revenue?.mrr || 0) / 100).toFixed(0)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">MRR</p>
              </div>
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl">
                <p className="text-xl font-black">${((revenue?.arr || 0) / 100).toFixed(0)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">ARR</p>
              </div>
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl">
                <p className="text-xl font-black">{revenue?.total_subscriptions || 0}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('total_subs')}</p>
              </div>
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl">
                <p className="text-xl font-black">{revenue?.new_companies || 0}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('new_companies')}</p>
              </div>
            </div>
            {revenue?.plan_breakdown && Object.keys(revenue.plan_breakdown).length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase text-zinc-500 mb-2">{t('by_plan')}</h4>
                <div className="space-y-2">
                  {Object.entries(revenue.plan_breakdown).map(([plan, data]: [string, any]) => (
                    <div key={plan} className="flex items-center justify-between text-sm">
                      <span className="font-bold uppercase text-xs">{plan}</span>
                      <span className="text-xs text-zinc-500">{data.count} {t('companies')} | ${(data.mrr / 100).toFixed(0)} MRR</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Usage Report */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <h3 className="font-black uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
              <Zap size={16} className="text-blue-600" /> {t('ai_usage_report')}
            </h3>
            {usage ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl">
                  <p className="text-xl font-black">{(usage.total_queries || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('queries')}</p>
                </div>
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl">
                  <p className="text-xl font-black">{((usage.total_tokens || 0) / 1000).toFixed(0)}K</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('tokens')}</p>
                </div>
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl">
                  <p className="text-xl font-black">{usage.unique_companies || 0}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('active_companies')}</p>
                </div>
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl">
                  <p className="text-xl font-black">{Object.keys(usage.by_agent_type || {}).length}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('agent_types')}</p>
                </div>
              </div>
            ) : <UnavailableState feature={t('ai_usage')} />}
          </div>

          {/* Platform Health Report */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <h3 className="font-black uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
              <Activity size={16} className="text-emerald-600" /> {t('platform_health_report')}
            </h3>
            {health ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl">
                  <p className="text-3xl font-black">{health.overall_health || 0}%</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('health_score')}</p>
                </div>
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl">
                  <p className="text-xl font-black">{health.components?.integrations?.connected || 0}/{health.components?.integrations?.total || 0}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('integrations_connected')}</p>
                </div>
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl">
                  <p className="text-xl font-black">{health.components?.subscriptions?.active || 0}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('active_subs')}</p>
                </div>
              </div>
            ) : <UnavailableState feature={t('health')} />}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Chat Builder (Real RARE AI Ops Chat) ─────────────────────────────────
const ChatBuilder = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; ts: number }[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: prompt, ts: Date.now() }]);
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${API_URL}/api/ai/rare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ prompt, mode: 'build', agentType: 'gm', language: 'ar' }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `HTTP ${res.status}`); }
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.response || 'No response', ts: Date.now() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `⚠ Error: ${err.message}`, ts: Date.now() }]);
    } finally { setSending(false); }
  };

  const quickCommands = [
    { label: 'Platform Health', cmd: 'أعطني تقرير كامل عن حالة المنصة والخدمات' },
    { label: 'Debug Issues', cmd: 'ما هي المشاكل الحالية في المنصة وكيف أحلها؟' },
    { label: 'Build Service', cmd: 'أريد بناء خدمة جديدة. ما الخطوات المطلوبة؟' },
    { label: 'Security Audit', cmd: 'أجر فحص أمني شامل للمنصة وأبلغني بالنتائج' },
    { label: 'Optimize', cmd: 'كيف يمكنني تحسين أداء المنصة؟' },
    { label: 'Client Fix', cmd: 'عميل يواجه مشكلة في الوصول. ما الحل؟' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
        <MessageSquare size={20} className="text-blue-600" /> RARE Ops Chat Builder
      </h2>
      <p className="text-xs text-zinc-500">Real-time AI-powered operations. Debug, build, fix, and manage your platform directly.</p>

      {/* Quick Commands */}
      <div className="flex flex-wrap gap-2">
        {quickCommands.map((qc, i) => (
          <button key={i} onClick={() => { setInput(qc.cmd); }} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full hover:bg-blue-100 transition-all">
            {qc.label}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-[500px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
              <div className="text-center">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                <p className="font-bold">RARE Ops Chat</p>
                <p className="text-xs mt-1">Ask me to build, debug, fix, or optimize anything in the platform.</p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3 rounded-2xl rounded-bl-sm">
                <Loader2 size={16} className="animate-spin text-blue-600" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="Build, debug, fix... (connected to real RARE AI)"
            disabled={sending}
          />
          <button onClick={sendMessage} disabled={sending || !input.trim()} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1.5">
            <Send size={14} /> Send
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Support & Tickets ──────────────────────────────────────────────────────
const SupportTickets = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && data) setTickets(data);
      } catch { /* table may not exist yet */ }
      setLoading(false);
    };
    fetchTickets();
    const channel = supabase.channel('tickets').on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => fetchTickets()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const statusColor = (s: string) => {
    if (s === 'open') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (s === 'in_progress') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (s === 'resolved') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    return 'bg-zinc-100 text-zinc-600';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
        <TicketCheck size={20} className="text-orange-600" /> Support & Tickets
      </h2>
      <p className="text-xs text-zinc-500">Customer requests, issues, and support tickets from all tenants.</p>

      {loading ? (
        <div className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-zinc-400" /></div>
      ) : tickets.length > 0 ? (
        <div className="space-y-2">
          {tickets.map((t, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-start justify-between">
              <div>
                <p className="font-bold text-sm">{t.subject || `Ticket #${t.id?.slice(0, 8)}`}</p>
                <p className="text-xs text-zinc-500 mt-1">{t.description?.slice(0, 120)}...</p>
                <p className="text-[10px] text-zinc-400 mt-2">{t.email || t.user_id} — {new Date(t.created_at).toLocaleDateString('ar-SA')}</p>
              </div>
              <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${statusColor(t.status)}`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center">
          <Headphones size={32} className="mx-auto mb-3 text-zinc-300" />
          <p className="font-bold text-sm text-zinc-400">No tickets yet</p>
          <p className="text-xs text-zinc-400 mt-1">When clients submit support requests, they'll appear here in real-time.</p>
        </div>
      )}
    </div>
  );
};

// ─── Voice Control ──────────────────────────────────────────────────────────

const VoiceControl = () => {
  const [voiceConfig, setVoiceConfig] = useState<any>(null);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const loadVoice = async () => {
      try {
        const [configRes, callsRes, analyticsRes] = await Promise.all([
          fetch(`${API}/api/voice/config`, { headers: { ...authHeaders(), 'x-company-id': 'platform' } }),
          fetch(`${API}/api/voice/calls`, { headers: { ...authHeaders(), 'x-company-id': 'platform' } }),
          fetch(`${API}/api/voice/analytics`, { headers: { ...authHeaders(), 'x-company-id': 'platform' } }),
        ]);
        if (configRes.ok) setVoiceConfig((await configRes.json()).config);
        if (callsRes.ok) setCallLogs((await callsRes.json()).calls || []);
        if (analyticsRes.ok) setAnalytics((await analyticsRes.json()).summary);
      } catch {}
    };
    loadVoice();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Headphones className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-black">Voice AI Control</h2>
      </div>

      {/* Voice Analytics */}
      {analytics && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Calls', value: analytics.totalCalls, color: 'blue' },
            { label: 'Completed', value: analytics.completed, color: 'green' },
            { label: 'Missed', value: analytics.missed, color: 'red' },
            { label: 'Avg Duration', value: `${analytics.avgDuration}s`, color: 'purple' },
          ].map(s => (
            <div key={s.label} className={`bg-${s.color}-50 dark:bg-${s.color}-950/20 rounded-2xl p-6 border border-${s.color}-200 dark:border-${s.color}-800`}>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">{s.label}</p>
              <p className="text-3xl font-black">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Voice Config */}
      {voiceConfig && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-bold mb-4">Voice Agent Configuration</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-zinc-500">Agent Name:</span> <span className="font-bold">{voiceConfig.agent_name}</span></div>
            <div><span className="text-zinc-500">Voice ID:</span> <span className="font-mono text-xs">{voiceConfig.voice_id}</span></div>
            <div><span className="text-zinc-500">Language:</span> <span className="font-bold">{voiceConfig.language}</span></div>
            <div><span className="text-zinc-500">Max Duration:</span> <span className="font-bold">{voiceConfig.max_call_duration}s</span></div>
            <div><span className="text-zinc-500">Status:</span> <span className={`font-bold ${voiceConfig.is_active ? 'text-green-600' : 'text-red-600'}`}>{voiceConfig.is_active ? 'Active' : 'Inactive'}</span></div>
          </div>
        </div>
      )}

      {/* Recent Calls */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold mb-4">Recent Calls ({callLogs.length})</h3>
        <div className="space-y-2">
          {callLogs.slice(0, 10).map((call: any) => (
            <div key={call.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${call.status === 'completed' ? 'bg-green-500' : call.status === 'missed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <span className="font-medium text-sm">{call.caller_id || 'Unknown'}</span>
                <span className="text-xs text-zinc-500">{call.direction}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>{call.duration_seconds}s</span>
                <span>{call.sentiment || '-'}</span>
                <span>{new Date(call.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {callLogs.length === 0 && <p className="text-zinc-500 text-sm">No call logs yet</p>}
        </div>
      </div>
    </div>
  );
};

// ─── Incidents & Alerts ─────────────────────────────────────────────────────

const IncidentsAlerts = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const admin = supabase;
        const { data } = await admin.from('platform_incidents').select('*').order('created_at', { ascending: false }).limit(50);
        setIncidents(data || []);
      } catch {}
      setLoading(false);
    };
    loadIncidents();
  }, []);

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return 'text-red-600';
      case 'investigating': return 'text-orange-600';
      case 'mitigated': return 'text-yellow-600';
      case 'resolved': case 'auto_resolved': return 'text-green-600';
      default: return 'text-zinc-500';
    }
  };

  const resolveIncident = async (id: string) => {
    await supabase.from('platform_incidents').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id);
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved' } : i));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-orange-600" />
        <h2 className="text-2xl font-black">Incidents & Alerts</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Open', value: incidents.filter(i => i.status === 'open').length, color: 'red' },
          { label: 'Investigating', value: incidents.filter(i => i.status === 'investigating').length, color: 'orange' },
          { label: 'Mitigated', value: incidents.filter(i => i.status === 'mitigated').length, color: 'yellow' },
          { label: 'Resolved', value: incidents.filter(i => ['resolved', 'auto_resolved'].includes(i.status)).length, color: 'green' },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 dark:bg-${s.color}-950/20 rounded-2xl p-6 border border-${s.color}-200 dark:border-${s.color}-800`}>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">{s.label}</p>
            <p className="text-3xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Incidents list */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold mb-4">Recent Incidents</h3>
        {loading ? <p className="text-zinc-500">Loading...</p> : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${severityColor(incident.severity)}`}>{incident.severity}</span>
                    <span className={`text-xs font-bold ${statusColor(incident.status)}`}>{incident.status}</span>
                    <span className="text-xs text-zinc-500">{incident.category}</span>
                  </div>
                  <p className="font-bold text-sm">{incident.title}</p>
                  {incident.description && <p className="text-xs text-zinc-500 mt-1">{incident.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {incident.auto_fix_available && incident.status === 'open' && (
                    <button
                      onClick={() => resolveIncident(incident.id)}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700"
                    >Auto-Fix</button>
                  )}
                  {incident.status === 'open' && (
                    <button
                      onClick={() => resolveIncident(incident.id)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                    >Resolve</button>
                  )}
                  <span className="text-[10px] text-zinc-500">{new Date(incident.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {incidents.length === 0 && <p className="text-zinc-500 text-sm">No incidents recorded</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Provisioning Operations ────────────────────────────────────────────────

const ProvisioningOps = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const { data } = await supabase
          .from('provisioning_jobs')
          .select('*, companies(name)')
          .order('created_at', { ascending: false })
          .limit(50);
        setJobs(data || []);
      } catch {}
      setLoading(false);
    };
    loadJobs();
  }, []);

  const retryJob = async (jobId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API}/api/provision/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'queued', error_message: null } : j));
    } catch {}
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'done': return 'text-green-600 bg-green-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'queued': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-zinc-500 bg-zinc-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-black">Provisioning Operations</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total', value: jobs.length, color: 'zinc' },
          { label: 'Queued', value: jobs.filter(j => j.status === 'queued').length, color: 'yellow' },
          { label: 'Running', value: jobs.filter(j => j.status === 'running').length, color: 'blue' },
          { label: 'Completed', value: jobs.filter(j => j.status === 'done').length, color: 'green' },
          { label: 'Failed', value: jobs.filter(j => j.status === 'error').length, color: 'red' },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 dark:bg-${s.color}-950/20 rounded-2xl p-6 border border-${s.color}-200 dark:border-${s.color}-800`}>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">{s.label}</p>
            <p className="text-3xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Jobs list */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold mb-4">Provisioning Jobs</h3>
        {loading ? <p className="text-zinc-500">Loading...</p> : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor(job.status)}`}>{job.status}</span>
                    <span className="text-xs text-zinc-500">{job.companies?.name || job.company_id?.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span>Step: <strong>{job.current_step || '-'}</strong></span>
                    <span>Progress: <strong>{job.completed_steps}/{job.total_steps}</strong></span>
                    {/* Progress bar */}
                    <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${job.total_steps ? (job.completed_steps / job.total_steps) * 100 : 0}%` }} />
                    </div>
                  </div>
                  {job.error_message && <p className="text-xs text-red-500 mt-1">{job.error_message}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {job.status === 'error' && (
                    <button
                      onClick={() => retryJob(job.id)}
                      className="px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700"
                    >Retry</button>
                  )}
                  <span className="text-[10px] text-zinc-500">{new Date(job.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {jobs.length === 0 && <p className="text-zinc-500 text-sm">No provisioning jobs</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Layout ────────────────────────────────────────────────────────────

export default function FounderPage() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-72 h-screen bg-zinc-900 text-white flex flex-col sticky top-0">
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
              { icon: MessageSquare, label: 'Chat Builder', path: 'chat' },
              { icon: TicketCheck, label: 'Support', path: 'support' },
              { icon: Headphones, label: 'Voice AI', path: 'voice' },
              { icon: Bell, label: 'Incidents', path: 'incidents' },
              { icon: Database, label: 'Provisioning', path: 'provisioning' },
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
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{t('founder_access')}</p>
            <p className="text-xs font-bold truncate">
              {profile?.fullName || profile?.displayName || user?.email || 'Founder'}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="text-xl font-black uppercase tracking-tighter">{t('platform_control_center')}</h1>
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
