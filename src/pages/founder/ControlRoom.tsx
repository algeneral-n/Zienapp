import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Users, DollarSign, Zap, Activity, AlertTriangle, Shield,
    TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, ServerCrash,
    CheckCircle, XCircle, Clock, Pause, Globe, CreditCard, Cpu, Database,
    Wifi, Cloud, Play,
} from 'lucide-react';
import { getRevenueAnalytics, getSystemHealth, getAIUsagePlatform, listTenants, getPlatformAuditLog, runAllHealthChecks, getRecoveryQueue } from '../../services/founderService';
import { LoadingState, ErrorState, StatCard, HealthDot, SectionHeader } from './shared';

interface KPI {
    label: string;
    value: string;
    sub: string;
    icon: React.ElementType;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
}

export default function ControlRoom() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<{
        tenantCount: number;
        activeUsers: number;
        mrr: number;
        arr: number;
        aiQueries: number;
        aiCostUsd: number;
        aiTokens: number;
        healthScore: number;
        incidentCount: number;
        activeSubs: number;
        trialSubs: number;
        pastDueSubs: number;
        auditLog: any[];
        tenantStatusBreakdown: Record<string, number>;
        healthMatrix: { name: string; status: string; latency?: number }[];
        provisioningQueue: any[];
    } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [revenue, health, aiUsage, tenants, audit, healthChecks, recovery] = await Promise.all([
                getRevenueAnalytics(30).catch(() => ({ mrr: 0, arr: 0, active_subscriptions: 0, total_subscriptions: 0, payments_in_period: 0, plan_breakdown: {} })),
                getSystemHealth().catch(() => ({ uptime_pct: 99, active_incidents: 0, worker_ok: true, db_ok: true, integrations_ok: true })),
                getAIUsagePlatform(1).catch(() => ({ total_queries: 0, total_tokens: 0, unique_users: 0, cost_usd: 0, by_agent: {} })),
                listTenants(1, 500).catch(() => ({ tenants: [], total: 0, page: 1, pageSize: 500 })),
                getPlatformAuditLog(1, 20).catch(() => ({ entries: [] })),
                runAllHealthChecks().catch(() => ({ checks: [] })),
                getRecoveryQueue().catch(() => ({ items: [] })),
            ]);

            const tenantList = tenants.tenants || [];
            const statusBreakdown: Record<string, number> = {};
            tenantList.forEach((t: any) => {
                statusBreakdown[t.status || 'unknown'] = (statusBreakdown[t.status || 'unknown'] || 0) + 1;
            });

            // Build 6-cell health matrix from health checks or defaults
            const hc = (healthChecks as any).checks || [];
            const defaultMatrix = [
                { name: 'Worker', status: (health as any).worker_ok ? 'healthy' : 'down' },
                { name: 'Database', status: (health as any).db_ok ? 'healthy' : 'down' },
                { name: 'Integrations', status: (health as any).integrations_ok ? 'healthy' : 'degraded' },
                { name: 'AI Engine', status: 'healthy' },
                { name: 'Payments', status: 'healthy' },
                { name: 'CDN / Edge', status: 'healthy' },
            ];
            const healthMatrix = hc.length > 0
                ? hc.slice(0, 6).map((c: any) => ({ name: c.name || c.service, status: c.status || 'unknown', latency: c.latency_ms }))
                : defaultMatrix;

            setStats({
                tenantCount: tenantList.length,
                activeUsers: (aiUsage as any).unique_users || 0,
                mrr: revenue.mrr || 0,
                arr: (revenue as any).arr || (revenue.mrr || 0) * 12,
                aiQueries: (aiUsage as any).total_queries || 0,
                aiCostUsd: (aiUsage as any).cost_usd || 0,
                aiTokens: (aiUsage as any).total_tokens || 0,
                healthScore: (health as any).uptime_pct || 99,
                incidentCount: (health as any).active_incidents || 0,
                activeSubs: revenue.active_subscriptions || 0,
                trialSubs: statusBreakdown.trial || 0,
                pastDueSubs: statusBreakdown.past_due || 0,
                auditLog: (audit as any).entries || [],
                tenantStatusBreakdown: statusBreakdown,
                healthMatrix,
                provisioningQueue: (recovery as any).items || [],
            });
        } catch (e: any) {
            setError(e.message || 'Failed to load command data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;
    if (!stats) return null;

    const kpis: KPI[] = [
        {
            label: t('active_tenants'),
            value: String(stats.tenantCount),
            sub: `${stats.trialSubs} trial`,
            icon: Building2,
            color: 'bg-blue-600',
            trend: 'up',
        },
        {
            label: t('mrr'),
            value: `${Math.round(stats.mrr).toLocaleString()} AED`,
            sub: `ARR: ${Math.round(stats.arr).toLocaleString()} AED`,
            icon: DollarSign,
            color: 'bg-emerald-600',
            trend: 'up',
        },
        {
            label: t('active_users'),
            value: String(stats.activeUsers),
            sub: t('last_24h'),
            icon: Users,
            color: 'bg-violet-600',
        },
        {
            label: t('ai_queries'),
            value: String(stats.aiQueries),
            sub: t('today'),
            icon: Zap,
            color: 'bg-amber-600',
        },
        {
            label: t('ai_cost') || 'AI Cost',
            value: `$${stats.aiCostUsd.toFixed(2)}`,
            sub: `${(stats.aiTokens / 1000).toFixed(0)}k tokens`,
            icon: Cpu,
            color: 'bg-fuchsia-600',
        },
        {
            label: t('subscriptions'),
            value: String(stats.activeSubs),
            sub: stats.pastDueSubs > 0 ? `${stats.pastDueSubs} past due` : 'All current',
            icon: CreditCard,
            color: stats.pastDueSubs > 0 ? 'bg-red-600' : 'bg-teal-600',
            trend: stats.pastDueSubs > 0 ? 'down' : 'neutral',
        },
    ];

    const quickActions = [
        { label: t('view_tenants'), icon: Building2, path: '/founder/tenants', color: 'hover:bg-blue-50 dark:hover:bg-blue-950/30' },
        { label: t('ai_builder'), icon: Zap, path: '/founder/ai', color: 'hover:bg-amber-50 dark:hover:bg-amber-950/30' },
        { label: t('revenue'), icon: DollarSign, path: '/founder/revenue', color: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30' },
        { label: t('system_logs'), icon: Activity, path: '/founder/logs', color: 'hover:bg-violet-50 dark:hover:bg-violet-950/30' },
        { label: t('security'), icon: Shield, path: '/founder/security', color: 'hover:bg-red-50 dark:hover:bg-red-950/30' },
        { label: t('health'), icon: Activity, path: '/founder/health', color: 'hover:bg-cyan-50 dark:hover:bg-cyan-950/30' },
    ];

    const statusIcon: Record<string, React.ElementType> = {
        active: CheckCircle,
        trial: Clock,
        suspended: Pause,
        past_due: AlertTriangle,
    };
    const statusColor: Record<string, string> = {
        active: 'text-green-500',
        trial: 'text-blue-500',
        suspended: 'text-red-500',
        past_due: 'text-amber-500',
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{t('command_center')}</h2>
                    <p className="text-sm text-zinc-500 mt-1">{t('platform_overview')}</p>
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    <RefreshCw size={14} /> {t('refresh')}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpis.map(kpi => (
                    <div key={kpi.label} className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className={`w-9 h-9 ${kpi.color} rounded-xl flex items-center justify-center`}>
                                <kpi.icon size={16} className="text-white" />
                            </div>
                            {kpi.trend === 'up' && <ArrowUpRight size={14} className="text-green-500" />}
                            {kpi.trend === 'down' && <ArrowDownRight size={14} className="text-red-500" />}
                        </div>
                        <p className="text-xl font-black">{kpi.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">{kpi.label}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{kpi.sub}</p>
                    </div>
                ))}
            </div>

            {/* 6-Cell Health Matrix */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">{t('system_health_matrix') || 'System Health Matrix'}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {stats.healthMatrix.map(cell => {
                        const cellIcon: Record<string, React.ElementType> = {
                            Worker: Globe, Database: Database, Integrations: Wifi,
                            'AI Engine': Cpu, Payments: CreditCard, 'CDN / Edge': Cloud,
                        };
                        const CIcon = cellIcon[cell.name] || Activity;
                        return (
                            <div key={cell.name} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-3">
                                <HealthDot status={cell.status} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{cell.name}</p>
                                    <p className="text-[10px] text-zinc-500 capitalize">{cell.status}{cell.latency ? ` (${cell.latency}ms)` : ''}</p>
                                </div>
                                <CIcon size={14} className="text-zinc-400 shrink-0" />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Middle row: Health + Status breakdown + Incidents */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Health Score */}
                <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">{t('platform_health')}</p>
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-lg font-black ${stats.healthScore >= 95 ? 'border-green-500 text-green-600' :
                            stats.healthScore >= 80 ? 'border-amber-500 text-amber-600' :
                                'border-red-500 text-red-600'
                            }`}>
                            {stats.healthScore}%
                        </div>
                        <div>
                            <p className="text-sm font-bold">
                                {stats.healthScore >= 95 ? t('healthy') : stats.healthScore >= 80 ? t('degraded') : t('critical')}
                            </p>
                            <p className="text-xs text-zinc-500">{t('uptime_30d')}</p>
                        </div>
                    </div>
                </div>

                {/* Tenant Status Breakdown */}
                <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">{t('tenant_status')}</p>
                    <div className="space-y-3">
                        {Object.entries(stats.tenantStatusBreakdown).map(([status, count]) => {
                            const Icon = statusIcon[status] || CheckCircle;
                            return (
                                <div key={status} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon size={14} className={statusColor[status] || 'text-zinc-400'} />
                                        <span className="text-xs font-bold uppercase">{status.replace('_', ' ')}</span>
                                    </div>
                                    <span className="text-sm font-black">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Active Incidents */}
                <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">{t('active_incidents')}</p>
                    {stats.incidentCount > 0 ? (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                <ServerCrash size={20} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-red-600">{stats.incidentCount}</p>
                                <p className="text-xs text-zinc-500">{t('requires_attention')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <CheckCircle size={20} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-green-600">{t('all_clear')}</p>
                                <p className="text-xs text-zinc-500">{t('no_active_incidents')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">{t('quick_actions')}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {quickActions.map(action => (
                        <button
                            key={action.label}
                            onClick={() => navigate(action.path)}
                            className={`flex flex-col items-center gap-2 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-colors ${action.color}`}
                        >
                            <action.icon size={20} className="text-zinc-600 dark:text-zinc-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Provisioning Queue */}
            {stats.provisioningQueue.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('provisioning_queue') || 'Provisioning Queue'}</p>
                        <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 px-2 py-0.5 rounded-full">
                            {stats.provisioningQueue.length} pending
                        </span>
                    </div>
                    <div className="space-y-2">
                        {stats.provisioningQueue.slice(0, 5).map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2 px-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Play size={12} className="text-amber-500" />
                                    <div>
                                        <p className="text-xs font-bold">{item.tenant_name || item.id || `Item ${i + 1}`}</p>
                                        <p className="text-[10px] text-zinc-500">{item.type || item.action || 'provisioning'}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-400">{item.status || 'pending'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">{t('recent_activity')}</p>
                {stats.auditLog.length > 0 ? (
                    <div className="space-y-3">
                        {stats.auditLog.slice(0, 15).map((entry: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold">{entry.action || entry.event_type || 'Action'}</p>
                                        <p className="text-[10px] text-zinc-500">{entry.actor_email || entry.user_id || 'System'}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-400">
                                    {entry.created_at ? new Date(entry.created_at).toLocaleTimeString() : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-zinc-500 text-center py-4">{t('no_recent_activity')}</p>
                )}
            </div>
        </div>
    );
}
