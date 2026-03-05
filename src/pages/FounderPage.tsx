import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import {
  Shield, Building2, Users, BarChart3,
  Settings, Zap, Megaphone, Wrench,
  CheckCircle2, XCircle, Clock, Search,
  DollarSign, TrendingUp, Activity, Server,
  AlertTriangle, Lock, Eye, Globe, Loader2, Info
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

const API_URL = import.meta.env.VITE_API_URL || '';

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
const LoadingState = () => (
  <div className="flex items-center justify-center py-12 text-zinc-400">
    <Loader2 className="animate-spin mr-2" size={18} /> Loading…
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl text-red-600 text-sm font-medium">
    <AlertTriangle size={16} /> {message}
  </div>
);

const UnavailableState = ({ feature }: { feature: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
    <Info size={32} className="mb-3 opacity-50" />
    <p className="text-sm font-bold uppercase tracking-widest">{feature}</p>
    <p className="text-xs mt-1">Data source not available yet</p>
  </div>
);

// ─── Tenant Management (REAL DATA) ──────────────────────────────────────────

const TenantManagement = () => {
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
        <h2 className="text-2xl font-black uppercase tracking-tighter">Tenant Management</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Search companies..."
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
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Company</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Industry</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Plan</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Country</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-400">No companies found</td></tr>
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
  if (!stats) return <UnavailableState feature="Revenue Analytics" />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Revenue Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'MRR', value: `${stats.mrr.toLocaleString()} AED`, icon: DollarSign, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: 'ARR', value: `${stats.arr.toLocaleString()} AED`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Active Subscriptions', value: String(stats.activeSubs), icon: Users, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
          { label: 'Total Revenue', value: `${stats.totalRevenue.toLocaleString()} AED`, icon: Activity, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
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
          <h3 className="font-black uppercase tracking-tight mb-4 text-sm">Revenue by Plan</h3>
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
      <h2 className="text-2xl font-black uppercase tracking-tighter">RARE AI Builder</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-black uppercase tracking-tight mb-6">Active Agents ({agents.length})</h3>
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
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">Global AI Model</h3>
          <p className="text-zinc-400 text-sm mb-4">Gemini 2.0 Flash</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{agents.length} agents configured</p>
        </div>
      </div>
    </div>
  );
};

// ─── Marketing (REAL DATA from marketing_campaigns + platform_announcements) ─

const MarketingSystem = () => {
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
        <h2 className="text-2xl font-black uppercase tracking-tighter">Marketing & Campaigns</h2>
        <button onClick={() => setShowCreateCampaign(!showCreateCampaign)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
          <Megaphone size={14} /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: String(campaigns.length), icon: Megaphone, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: 'Active', value: String(activeCampaigns), icon: Zap, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Emails Sent', value: totalSent.toLocaleString(), icon: Globe, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
          { label: 'Open Rate', value: totalSent > 0 ? `${Math.round((totalOpened / totalSent) * 100)}%` : '—', icon: Eye, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
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
          <h3 className="font-black uppercase tracking-tight text-sm">Create Campaign</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Campaign Name" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium" />
            <select value={newCampaign.type} onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push Notification</option>
            </select>
          </div>
          <input placeholder="Subject" value={newCampaign.subject} onChange={e => setNewCampaign({ ...newCampaign, subject: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium" />
          <textarea placeholder="Body" rows={3} value={newCampaign.body} onChange={e => setNewCampaign({ ...newCampaign, body: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm font-medium resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreateCampaign(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
            <button onClick={handleCreateCampaign} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700">Save Draft</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Campaign</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Type</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sent</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {campaigns.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-400">No campaigns yet — create your first one above</td></tr>
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
          <h3 className="font-black uppercase tracking-tight mb-4 text-sm">Platform Announcements</h3>
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
      <h2 className="text-2xl font-black uppercase tracking-tighter">Integration Control</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Catalog Items', value: String(catalog.length), icon: Settings, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: 'Connected by Tenants', value: String(activeIntegrations), icon: Zap, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Available Providers', value: String(catalog.filter(c => c.is_active).length), icon: Globe, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
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
        <h3 className="font-black uppercase tracking-tight mb-4 text-sm">Integration Catalog (toggle availability for tenants)</h3>
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
                {item.is_active ? 'Active' : 'Disabled'}
              </button>
            </div>
          ))}
          {catalog.length === 0 && <p className="text-sm text-zinc-400 col-span-2 text-center py-4">No integrations in catalog. Run the migration to seed catalog data.</p>}
        </div>
      </div>

      {tenantIntegrations.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tenant</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Integration</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Connected</th>
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
  if (!health) return <UnavailableState feature="Platform Health" />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Platform Health</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'API Status', value: health.apiStatus, icon: Server, color: health.apiStatus === 'operational' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Worker Version', value: health.version, icon: Activity, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: 'Active Users', value: String(health.activeUsers), icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-600/10' },
          { label: 'Total Companies', value: String(health.totalCompanies), icon: Building2, color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800' },
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
        <h3 className="font-black uppercase tracking-tight mb-4 text-sm">Service Dependencies</h3>
        <div className="space-y-3">
          {[
            { service: 'Supabase (Database)', status: 'operational' },
            { service: 'Cloudflare Workers (API)', status: health.apiStatus },
            { service: 'Gemini AI (RARE)', status: 'operational' },
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
  if (!audit) return <UnavailableState feature="Security Dashboard" />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Security & Compliance</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Sensitive AI Actions', value: String(audit.sensitiveCount), icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Denied Requests', value: String(audit.deniedCount), icon: Lock, color: 'text-red-600 bg-red-50 dark:bg-red-500/10' },
          { label: 'Total AI Logs (7d)', value: String(audit.totalLogs), icon: Shield, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
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
        <h3 className="font-black uppercase tracking-tight mb-4 text-sm">Recent AI Audit Log</h3>
        <div className="space-y-3">
          {audit.recentLogs.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">No recent logs</p>
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
                <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase">logged</span>
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

// ─── Main Layout ────────────────────────────────────────────────────────────

export default function FounderPage() {
  const { user, profile } = useAuth();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-72 h-screen bg-zinc-900 text-white flex flex-col sticky top-0">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">Z</div>
            <span className="text-xl font-black tracking-tighter uppercase">Zien Founder</span>
          </Link>
          <nav className="space-y-2">
            {[
              { icon: Building2, label: 'Tenants', path: '' },
              { icon: BarChart3, label: 'Revenue', path: 'revenue' },
              { icon: Zap, label: 'AI Builder', path: 'ai' },
              { icon: Megaphone, label: 'Marketing', path: 'marketing' },
              { icon: Wrench, label: 'Integrations', path: 'integrations' },
              { icon: Activity, label: 'Health', path: 'health' },
              { icon: Shield, label: 'Security', path: 'security' },
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Founder Access</p>
            <p className="text-xs font-bold truncate">
              {profile?.fullName || profile?.displayName || user?.email || 'Founder'}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="text-xl font-black uppercase tracking-tighter">Platform Control Center</h1>
          <HeaderControls />
        </header>

        <div className="p-8">
          <Routes>
            <Route path="/" element={<TenantManagement />} />
            <Route path="/revenue" element={<RevenueAnalytics />} />
            <Route path="/ai" element={<AIBuilder />} />
            <Route path="/marketing" element={<MarketingSystem />} />
            <Route path="/integrations" element={<IntegrationControl />} />
            <Route path="/health" element={<PlatformHealth />} />
            <Route path="/security" element={<SecurityDashboard />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
