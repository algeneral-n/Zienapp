import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AlertTriangle, AlertOctagon, RefreshCw, CheckCircle, Clock, XCircle,
    Play, Terminal, TrendingUp, Server, Zap, ShieldAlert,
    HeartPulse, RotateCcw, SkipForward, ArrowUpCircle,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import {
    triggerSelfHeal, getSelfHealLog, getRecoveryQueue,
    retryRecoveryItem, skipRecoveryItem, escalateRecoveryItem,
    type SelfHealEntry, type RecoveryItem,
} from '../../services/founderService';
import { founderFetch, LoadingState, ErrorState, TabBar, SectionHeader, StatusBadge } from './shared';

interface ErrorEntry {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    source: string;
    status: 'open' | 'acknowledged' | 'resolved' | 'auto_fixed';
    created_at: string;
    resolved_at?: string;
    details?: Record<string, any>;
}

interface Runbook {
    key: string;
    label: string;
    description: string;
    icon: React.ElementType;
    action: () => Promise<void>;
}

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type StatusFilter = 'all' | 'open' | 'acknowledged' | 'resolved';
type HealthTab = 'errors' | 'self_healing' | 'recovery';

const HEALTH_TABS: { key: HealthTab; label: string }[] = [
    { key: 'errors', label: 'Errors & Incidents' },
    { key: 'self_healing', label: 'Self-Healing' },
    { key: 'recovery', label: 'Recovery Queue' },
];

export default function AIErrorHandler() {
    const { t } = useTranslation();
    const [errors, setErrors] = useState<ErrorEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [runbookLoading, setRunbookLoading] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<7 | 30>(7);
    const [activeTab, setActiveTab] = useState<HealthTab>('errors');
    const [selfHealLog, setSelfHealLog] = useState<SelfHealEntry[]>([]);
    const [recoveryQueue, setRecoveryQueue] = useState<RecoveryItem[]>([]);
    const [healLoading, setHealLoading] = useState(false);
    const [opLoading, setOpLoading] = useState<string | null>(null);

    useEffect(() => {
        loadErrors();
    }, [timeRange]);

    useEffect(() => {
        if (activeTab === 'self_healing') {
            getSelfHealLog().then(r => setSelfHealLog(r.entries)).catch(() => { });
        }
        if (activeTab === 'recovery') {
            getRecoveryQueue().then(r => setRecoveryQueue(r.items)).catch(() => { });
        }
    }, [activeTab]);

    const loadErrors = async () => {
        setLoading(true);
        try {
            const since = new Date(Date.now() - timeRange * 86400000).toISOString();

            // Load from platform_incidents + audit_log errors
            const [{ data: incidents }, { data: auditErrors }] = await Promise.all([
                supabase
                    .from('platform_incidents')
                    .select('*')
                    .gte('created_at', since)
                    .order('created_at', { ascending: false })
                    .limit(100),
                supabase
                    .from('platform_audit_log')
                    .select('*')
                    .eq('severity', 'error')
                    .gte('created_at', since)
                    .order('created_at', { ascending: false })
                    .limit(50),
            ]);

            const mapped: ErrorEntry[] = [
                ...(incidents || []).map((i: any) => ({
                    id: i.id,
                    type: i.incident_type || 'incident',
                    severity: i.severity || 'medium',
                    message: i.title || i.description || 'Platform incident',
                    source: i.service || 'platform',
                    status: i.status || 'open',
                    created_at: i.created_at,
                    resolved_at: i.resolved_at,
                    details: i.details,
                })),
                ...(auditErrors || []).map((a: any) => ({
                    id: a.id,
                    type: 'audit_error',
                    severity: 'high' as const,
                    message: a.action || 'Error recorded',
                    source: a.category || 'system',
                    status: 'open' as const,
                    created_at: a.created_at,
                    details: a.details,
                })),
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setErrors(mapped);
        } catch (e: any) {
            setError(e.message || 'Failed to load errors');
        } finally {
            setLoading(false);
        }
    };

    const runRunbook = async (key: string, handler: () => Promise<void>) => {
        setRunbookLoading(key);
        try {
            await handler();
            loadErrors();
        } catch (e: any) {
            alert(e.message || 'Runbook execution failed');
        } finally {
            setRunbookLoading(null);
        }
    };

    const runbooks: Runbook[] = [
        {
            key: 'retry_provisioning',
            label: 'Retry Stuck Provisioning',
            description: 'Retries all provisioning jobs stuck in pending/failed state',
            icon: RefreshCw,
            action: async () => {
                await founderFetch('/api/founder/provisioning/retry-stuck', 'POST');
            },
        },
        {
            key: 'restart_integrations',
            label: 'Restart Failed Integrations',
            description: 'Reconnects integrations in error state',
            icon: Server,
            action: async () => {
                await founderFetch('/api/founder/integrations/restart-failed', 'POST');
            },
        },
        {
            key: 'clear_ai_queue',
            label: 'Clear AI Queue',
            description: 'Clears stuck AI processing queue and resets rate limits',
            icon: Zap,
            action: async () => {
                await founderFetch('/api/founder/ai/clear-queue', 'POST');
            },
        },
        {
            key: 'fix_payment_failures',
            label: 'Retry Failed Payments',
            description: 'Retries payment collection for failed invoices',
            icon: ShieldAlert,
            action: async () => {
                await founderFetch('/api/billing/admin/retry-failed-payments', 'POST');
            },
        },
    ];

    const filtered = errors.filter(e => {
        const matchSeverity = severityFilter === 'all' || e.severity === severityFilter;
        const matchStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchSeverity && matchStatus;
    });

    const severityCounts: Record<string, number> = { all: errors.length };
    errors.forEach(e => {
        severityCounts[e.severity] = (severityCounts[e.severity] || 0) + 1;
    });

    const severityIcon: Record<string, React.ElementType> = {
        critical: AlertOctagon,
        high: AlertTriangle,
        medium: Clock,
        low: CheckCircle,
    };
    const severityColor: Record<string, string> = {
        critical: 'text-red-600 bg-red-50 dark:bg-red-950/30',
        high: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
        medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
        low: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    };
    const statusDot: Record<string, string> = {
        open: 'bg-red-500',
        acknowledged: 'bg-amber-500',
        resolved: 'bg-green-500',
        auto_fixed: 'bg-blue-500',
    };

    const handleAcknowledge = async (id: string) => {
        await supabase.from('platform_incidents').update({ status: 'acknowledged' }).eq('id', id);
        setErrors(prev => prev.map(e => e.id === id ? { ...e, status: 'acknowledged' } : e));
    };

    const handleResolve = async (id: string) => {
        await supabase.from('platform_incidents').update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
        }).eq('id', id);
        setErrors(prev => prev.map(e => e.id === id ? { ...e, status: 'resolved' } : e));
    };

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <div className="space-y-8">
            <SectionHeader title="System Health" subtitle="Errors, self-healing, and recovery queue" />
            <TabBar tabs={HEALTH_TABS} active={activeTab} onChange={k => setActiveTab(k as HealthTab)} />

            {/* ─── ERRORS TAB ─── */}
            {activeTab === 'errors' && (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Errors &amp; Incidents</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={timeRange}
                                onChange={e => setTimeRange(Number(e.target.value) as 7 | 30)}
                                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold border-0"
                            >
                                <option value={7}>Last 7 days</option>
                                <option value={30}>Last 30 days</option>
                            </select>
                            <button onClick={loadErrors} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold">
                                <RefreshCw size={14} /> {t('refresh')}
                            </button>
                        </div>
                    </div>

                    {/* Severity summary */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {(['all', 'critical', 'high', 'medium', 'low'] as SeverityFilter[]).map(s => {
                            const Icon = s === 'all' ? TrendingUp : (severityIcon[s] || AlertTriangle);
                            return (
                                <button
                                    key={s}
                                    onClick={() => setSeverityFilter(s)}
                                    className={`p-4 rounded-2xl border text-left transition-all ${severityFilter === s
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                                        }`}
                                >
                                    <Icon size={16} className={severityFilter === s ? 'text-white' : 'text-zinc-400'} />
                                    <p className="text-lg font-black mt-2">{severityCounts[s] || 0}</p>
                                    <p className="text-[10px] font-bold uppercase">{s}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Runbooks */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">{t('auto_fix_runbooks')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {runbooks.map(rb => (
                                <button
                                    key={rb.key}
                                    onClick={() => runRunbook(rb.key, rb.action)}
                                    disabled={runbookLoading === rb.key}
                                    className="flex items-start gap-3 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-left hover:border-blue-300 dark:hover:border-blue-700 transition-all disabled:opacity-50"
                                >
                                    <div className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <rb.icon size={16} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">{rb.label}</p>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">{rb.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status filter */}
                    <div className="flex gap-2">
                        {(['all', 'open', 'acknowledged', 'resolved'] as StatusFilter[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Error list */}
                    <div className="space-y-2">
                        {filtered.map(err => (
                            <div key={err.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-[16px] border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[err.status] || 'bg-zinc-400'}`} />
                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${severityColor[err.severity] || ''}`}>
                                        {err.severity}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">{err.message}</p>
                                        <p className="text-[10px] text-zinc-500">{err.source} — {new Date(err.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {err.status === 'open' && (
                                        <>
                                            <button onClick={() => handleAcknowledge(err.id)} className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-bold">
                                                ACK
                                            </button>
                                            <button onClick={() => handleResolve(err.id)} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-[10px] font-bold">
                                                Resolve
                                            </button>
                                        </>
                                    )}
                                    {err.status === 'acknowledged' && (
                                        <button onClick={() => handleResolve(err.id)} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-[10px] font-bold">
                                            Resolve
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {filtered.length === 0 && (
                            <div className="text-center py-12">
                                <CheckCircle size={28} className="mx-auto text-green-500 mb-3" />
                                <p className="text-sm font-bold text-green-600">{t('no_errors')}</p>
                                <p className="text-xs text-zinc-500">{t('all_systems_operational')}</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ─── SELF-HEALING TAB ─── */}
            {activeTab === 'self_healing' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Self-Healing Log</p>
                        <div className="flex items-center gap-2">
                            <input
                                id="heal-component"
                                placeholder="Component name..."
                                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs border-0 w-48"
                            />
                            <button
                                onClick={async () => {
                                    const comp = (document.getElementById('heal-component') as HTMLInputElement)?.value;
                                    if (!comp) return;
                                    setHealLoading(true);
                                    try {
                                        await triggerSelfHeal(comp);
                                        const r = await getSelfHealLog();
                                        setSelfHealLog(r.entries);
                                    } catch { } finally { setHealLoading(false); }
                                }}
                                disabled={healLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                            >
                                <HeartPulse size={14} /> {healLoading ? 'Healing...' : 'Trigger Self-Heal'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {selfHealLog.map(entry => (
                            <div key={entry.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-[16px] border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <div>
                                        <p className="text-xs font-bold">{entry.component} — {entry.action}</p>
                                        <p className="text-[10px] text-zinc-500">{new Date(entry.created_at).toLocaleString()}</p>
                                        {entry.details && <p className="text-[10px] text-zinc-400 mt-0.5">{entry.details}</p>}
                                    </div>
                                </div>
                                <StatusBadge status={entry.status} />
                            </div>
                        ))}
                        {selfHealLog.length === 0 && (
                            <div className="text-center py-12">
                                <HeartPulse size={28} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                                <p className="text-sm font-bold text-zinc-400">No self-healing events</p>
                                <p className="text-xs text-zinc-500">Trigger a self-heal on a specific component above</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── RECOVERY QUEUE TAB ─── */}
            {activeTab === 'recovery' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Recovery Queue — {recoveryQueue.length} items</p>
                        <button
                            onClick={async () => {
                                const r = await getRecoveryQueue();
                                setRecoveryQueue(r.items);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold"
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>

                    <div className="space-y-2">
                        {recoveryQueue.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-[16px] border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-4">
                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${item.type === 'provisioning' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30' :
                                            item.type === 'billing' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30' :
                                                'bg-purple-50 text-purple-600 dark:bg-purple-950/30'
                                        }`}>
                                        {item.type}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">{item.target_name || item.target_id}</p>
                                        <p className="text-[10px] text-zinc-500">{item.error}</p>
                                        <p className="text-[10px] text-zinc-400">Retries: {item.retry_count} — {new Date(item.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={item.status} size="xs" />
                                    {(item.status === 'pending' || item.status === 'retrying') && (
                                        <>
                                            <button
                                                onClick={async () => {
                                                    setOpLoading(item.id + '-retry');
                                                    try { await retryRecoveryItem(item.id); setRecoveryQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'retrying' } : i)); } catch { } finally { setOpLoading(null); }
                                                }}
                                                disabled={opLoading === item.id + '-retry'}
                                                className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg"
                                                title="Retry"
                                            >
                                                <RotateCcw size={12} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setOpLoading(item.id + '-skip');
                                                    try { await skipRecoveryItem(item.id); setRecoveryQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'skipped' } : i)); } catch { } finally { setOpLoading(null); }
                                                }}
                                                disabled={opLoading === item.id + '-skip'}
                                                className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg"
                                                title="Skip"
                                            >
                                                <SkipForward size={12} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setOpLoading(item.id + '-esc');
                                                    try { await escalateRecoveryItem(item.id); setRecoveryQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'escalated' } : i)); } catch { } finally { setOpLoading(null); }
                                                }}
                                                disabled={opLoading === item.id + '-esc'}
                                                className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
                                                title="Escalate"
                                            >
                                                <ArrowUpCircle size={12} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {recoveryQueue.length === 0 && (
                            <div className="text-center py-12">
                                <CheckCircle size={28} className="mx-auto text-green-500 mb-3" />
                                <p className="text-sm font-bold text-green-600">Recovery queue empty</p>
                                <p className="text-xs text-zinc-500">No items pending recovery</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
