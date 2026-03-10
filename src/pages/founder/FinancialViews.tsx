import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DollarSign, TrendingUp, CreditCard, AlertTriangle, Clock, RefreshCw, Bell, X, Zap, Activity,
} from 'lucide-react';
import {
  getRevenueAnalytics, listTenants, updateTenant, suspendTenant, getSystemHealth, getAIUsagePlatform,
} from '../../services/founderService';
import { LoadingState, ErrorState, UnavailableState } from './shared';

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

// ─── AI Builder (FULL CRUD — Agents + Policies + Feature Flags) ─────────────


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

          {/* Full Subscription List with Actions */}
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('company')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('plan')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('gateway')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('status')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('renewal_date')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('actions')}</th>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <select
                          defaultValue={tenant.subscription?.plan_code || ''}
                          onChange={async (e) => {
                            const newPlan = e.target.value;
                            if (newPlan && newPlan !== tenant.subscription?.plan_code) {
                              try {
                                await updateTenant(tenant.id, { plan_code: newPlan } as any);
                                setTenants(prev => prev.map(t2 => t2.id === tenant.id ? { ...t2, subscription: { ...t2.subscription, plan_code: newPlan } } : t2));
                              } catch (err: any) { alert(err.message); e.target.value = tenant.subscription?.plan_code || ''; }
                            }
                          }}
                          className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-lg px-2 py-1 text-[10px] font-bold"
                        >
                          {['trial', 'demo', 'starter', 'growth', 'business', 'enterprise'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        {tenant.subscription?.status === 'active' && (
                          <button
                            onClick={async () => {
                              if (confirm(`Cancel subscription for ${tenant.name}?`)) {
                                try {
                                  await suspendTenant(tenant.id, 'Subscription cancelled by founder');
                                  setTenants(prev => prev.map(t2 => t2.id === tenant.id ? { ...t2, subscription: { ...t2.subscription, status: 'cancelled' } } : t2));
                                } catch (err: any) { alert(err.message); }
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                            title={t('cancel_subscription')}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </td>
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

// ─── User Management (FULL CRUD) ────────────────────────────────────────────


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

export { RevenueAnalytics, SubscriptionManager, ReportsCenter };
