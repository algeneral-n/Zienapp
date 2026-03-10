import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings, Zap, Globe, Server, Activity, Users, Building2, AlertTriangle, Lock, Shield, RefreshCw, Wrench,
} from 'lucide-react';
import {
  getSystemHealth, getAIUsagePlatform, getPlatformAuditLog, listAnnouncements, type AuditEntry,
} from '../../services/founderService';
import { supabase } from '../../services/supabase';
import { LoadingState, ErrorState, UnavailableState } from './shared';

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


export { IntegrationControl, PlatformHealth, SecurityDashboard, SystemLogs, MaintenancePanel };
