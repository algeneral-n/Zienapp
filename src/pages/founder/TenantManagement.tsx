import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Building2, Search, Filter, MoreVertical, Users, CreditCard, Shield,
    Pause, Play, Trash2, Eye, ChevronDown, ChevronUp, Globe, Calendar,
    Zap, ScrollText, AlertTriangle, Settings, Plus, Minus, RefreshCw, Send,
} from 'lucide-react';
import {
    listTenants, suspendTenant, reinstateTenant, deleteTenant, resetTenant,
    rerunProvisioning, addModule, removeModule, getTenantAuditLog,
    getTenantIncidents, getTenantUsage, sendInternalOffer,
    type Tenant,
} from '../../services/founderService';
import { LoadingState, ErrorState, founderFetch, TabBar, StatusBadge, ConfirmDialog, SectionHeader } from './shared';

type StatusFilter = 'all' | 'active' | 'trial' | 'suspended' | 'past_due';

const DETAIL_TABS = ['overview', 'members', 'modules', 'billing', 'ai_usage', 'audit', 'incidents', 'config'] as const;
type DetailTab = typeof DETAIL_TABS[number];

const MODULE_OPTIONS = ['hr', 'crm', 'projects', 'logistics', 'accounting', 'billing', 'meetings', 'chat', 'store', 'academy'];

// ─── 8-Tab Tenant Detail Panel ──────────────────────────────────────────────

function TenantDetailPanel({ tenant, onSuspend, onReinstate, actionLoading, onReload }: {
    tenant: Tenant; onSuspend: () => void; onReinstate: () => void; actionLoading: boolean; onReload: () => void;
}) {
    const { t } = useTranslation();
    const [tab, setTab] = useState<DetailTab>('overview');
    const [auditLog, setAuditLog] = useState<any[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [usage, setUsage] = useState<any>(null);
    const [opLoading, setOpLoading] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (tab === 'audit') getTenantAuditLog(tenant.id).then(d => setAuditLog((d as any).entries || [])).catch(() => { });
        if (tab === 'incidents') getTenantIncidents(tenant.id).then(d => setIncidents((d as any).incidents || [])).catch(() => { });
        if (tab === 'ai_usage') getTenantUsage(tenant.id).then(d => setUsage(d)).catch(() => { });
    }, [tab, tenant.id]);

    const tabs = DETAIL_TABS.map(k => ({ key: k, label: t(k) || k.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) }));

    return (
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
            {confirmDelete && (
                <ConfirmDialog
                    open
                    title={`Delete ${tenant.name}?`}
                    message="This will permanently delete this tenant and all its data. This cannot be undone."
                    danger
                    onConfirm={async () => {
                        setConfirmDelete(false);
                        setOpLoading('delete');
                        try { await deleteTenant(tenant.id); onReload(); } catch (e: any) { alert(e.message); }
                        setOpLoading(null);
                    }}
                    onCancel={() => setConfirmDelete(false)}
                />
            )}

            <div className="px-5 pt-4">
                <TabBar tabs={tabs} active={tab} onChange={(k) => setTab(k as DetailTab)} />
            </div>

            <div className="p-5">
                {/* Overview Tab */}
                {tab === 'overview' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('plan')}</p>
                                <p className="text-sm font-bold">{tenant.plan_code || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('members')}</p>
                                <p className="text-sm font-bold">{tenant.member_count || 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('industry')}</p>
                                <p className="text-sm font-bold">{tenant.industry || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('created')}</p>
                                <p className="text-sm font-bold">{new Date(tenant.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('country')}</p>
                                <p className="text-sm font-bold">{tenant.country || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('subscription_status')}</p>
                                <StatusBadge status={tenant.subscription?.status || 'none'} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('gateway')}</p>
                                <p className="text-sm font-bold">{tenant.subscription?.gateway || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('owner')}</p>
                                <p className="text-sm font-bold truncate">{tenant.owner_user_id.slice(0, 12)}...</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {tenant.status === 'suspended' ? (
                                <button onClick={onReinstate} disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 disabled:opacity-50">
                                    <Play size={14} /> {t('reinstate')}
                                </button>
                            ) : (
                                <button onClick={onSuspend} disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50">
                                    <Pause size={14} /> {t('suspend')}
                                </button>
                            )}
                            <button
                                onClick={async () => { setOpLoading('reprov'); try { await rerunProvisioning(tenant.id); alert('Provisioning restarted'); } catch (e: any) { alert(e.message); } setOpLoading(null); }}
                                disabled={opLoading === 'reprov'}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                            >
                                <RefreshCw size={14} /> {t('re_provision') || 'Re-provision'}
                            </button>
                            <button
                                onClick={async () => { setOpLoading('reset'); try { await resetTenant(tenant.id); alert('Tenant reset'); onReload(); } catch (e: any) { alert(e.message); } setOpLoading(null); }}
                                disabled={opLoading === 'reset'}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 disabled:opacity-50"
                            >
                                <RefreshCw size={14} /> {t('reset') || 'Reset'}
                            </button>
                            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30">
                                <Trash2 size={14} /> {t('delete')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Members Tab */}
                {tab === 'members' && (
                    <div className="space-y-2">
                        <p className="text-xs text-zinc-500">{t('tenant_members_desc') || 'Members belonging to this tenant organization.'}</p>
                        <p className="text-[10px] font-bold text-zinc-400">Total: {tenant.member_count || 0}</p>
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                            <p className="text-xs text-zinc-500 text-center py-4">{t('member_list_loaded_on_demand') || 'Member list loaded from tenant detail API'}</p>
                        </div>
                    </div>
                )}

                {/* Modules Tab */}
                {tab === 'modules' && (
                    <div className="space-y-3">
                        <p className="text-xs text-zinc-500 mb-2">{t('modules_desc') || 'Enable or disable modules for this tenant.'}</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {MODULE_OPTIONS.map(mod => (
                                <div key={mod} className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <span className="text-xs font-bold uppercase">{mod}</span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={async () => { try { await addModule(tenant.id, mod); } catch { } }}
                                            className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                            title="Enable"
                                        >
                                            <Plus size={12} />
                                        </button>
                                        <button
                                            onClick={async () => { try { await removeModule(tenant.id, mod); } catch { } }}
                                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            title="Disable"
                                        >
                                            <Minus size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Billing Tab */}
                {tab === 'billing' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('plan')}</p>
                                <p className="text-sm font-bold">{tenant.subscription?.plan_code || tenant.plan_code || 'N/A'}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('status')}</p>
                                <StatusBadge status={tenant.subscription?.status || tenant.status} />
                            </div>
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('period_end')}</p>
                                <p className="text-sm font-bold">{tenant.subscription?.current_period_end ? new Date(tenant.subscription.current_period_end).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        <button
                            onClick={async () => { try { await sendInternalOffer(tenant.id, { title: 'Upgrade Offer', body: '20% discount on upgrade', offer_type: 'upgrade_offer' }); alert('Offer sent'); } catch (e: any) { alert(e.message); } }}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700"
                        >
                            <Send size={14} /> {t('send_upgrade_offer') || 'Send Upgrade Offer'}
                        </button>
                    </div>
                )}

                {/* AI Usage Tab */}
                {tab === 'ai_usage' && (
                    <div className="space-y-3">
                        {usage ? (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('queries')}</p>
                                    <p className="text-lg font-black">{usage.total_queries || 0}</p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('tokens')}</p>
                                    <p className="text-lg font-black">{((usage.total_tokens || 0) / 1000).toFixed(0)}k</p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{t('cost')}</p>
                                    <p className="text-lg font-black">${(usage.cost_usd || 0).toFixed(2)}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-zinc-500 text-center py-4">{t('loading')}...</p>
                        )}
                    </div>
                )}

                {/* Audit Tab */}
                {tab === 'audit' && (
                    <div className="space-y-2">
                        {auditLog.length > 0 ? auditLog.slice(0, 20).map((e: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    <span className="text-xs font-bold">{e.action || e.event_type}</span>
                                </div>
                                <span className="text-[10px] text-zinc-400">{e.created_at ? new Date(e.created_at).toLocaleString() : ''}</span>
                            </div>
                        )) : <p className="text-xs text-zinc-500 text-center py-4">{t('no_audit_entries')}</p>}
                    </div>
                )}

                {/* Incidents Tab */}
                {tab === 'incidents' && (
                    <div className="space-y-2">
                        {incidents.length > 0 ? incidents.map((inc: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={12} className="text-amber-500" />
                                    <span className="text-xs font-bold">{inc.title || inc.type}</span>
                                </div>
                                <StatusBadge status={inc.status || 'open'} size="sm" />
                            </div>
                        )) : <p className="text-xs text-zinc-500 text-center py-4">{t('no_incidents')}</p>}
                    </div>
                )}

                {/* Config Tab */}
                {tab === 'config' && (
                    <div className="space-y-3">
                        <p className="text-xs text-zinc-500">{t('config_desc') || 'Tenant-specific configuration and feature flags.'}</p>
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                            <pre className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 overflow-x-auto">
                                {JSON.stringify({ id: tenant.id, status: tenant.status, plan_code: tenant.plan_code, subscription: tenant.subscription }, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TenantManagement() {
    const { t } = useTranslation();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        try {
            setLoading(true);
            const data = await listTenants(1, 200);
            setTenants(data.tenants || []);
        } catch (e: any) {
            setError(e.message || 'Failed to load tenants');
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async (id: string) => {
        setActionLoading(id);
        try {
            await suspendTenant(id);
            setTenants(prev => prev.map(t => t.id === id ? { ...t, status: 'suspended' } : t));
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReinstate = async (id: string) => {
        setActionLoading(id);
        try {
            await reinstateTenant(id);
            setTenants(prev => prev.map(t => t.id === id ? { ...t, status: 'active' } : t));
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = tenants.filter(t => {
        const matchSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const statusCounts = {
        all: tenants.length,
        active: tenants.filter(t => t.status === 'active').length,
        trial: tenants.filter(t => t.status === 'trial').length,
        suspended: tenants.filter(t => t.status === 'suspended').length,
        past_due: tenants.filter(t => t.status === 'past_due').length,
    };

    const statusColor: Record<string, string> = {
        active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        past_due: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase tracking-tighter">{t('tenant_management')}</h2>
                <span className="text-xs font-bold text-zinc-500 uppercase">{filtered.length} {t('tenants')}</span>
            </div>

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'trial', 'suspended', 'past_due'] as StatusFilter[]).map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${statusFilter === s
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                    >
                        {s.replace('_', ' ')} ({statusCounts[s]})
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('search_tenants')}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Tenant cards */}
            <div className="space-y-3">
                {filtered.map(tenant => (
                    <div
                        key={tenant.id}
                        className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                    >
                        {/* Header row */}
                        <div className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                                    <Building2 size={18} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{tenant.name}</p>
                                    <p className="text-xs text-zinc-500">
                                        {tenant.plan_code || 'No plan'} — {tenant.member_count || 0} members
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusColor[tenant.status] || 'bg-zinc-100 text-zinc-600'}`}>
                                    {tenant.status}
                                </span>
                                <button
                                    onClick={() => setExpandedId(expandedId === tenant.id ? null : tenant.id)}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                                >
                                    {expandedId === tenant.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* 8-Tab Tenant Detail */}
                        {expandedId === tenant.id && (
                            <TenantDetailPanel
                                tenant={tenant}
                                onSuspend={() => handleSuspend(tenant.id)}
                                onReinstate={() => handleReinstate(tenant.id)}
                                actionLoading={actionLoading === tenant.id}
                                onReload={loadTenants}
                            />
                        )}
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="text-center py-16">
                        <Building2 size={32} className="mx-auto text-zinc-400 mb-3" />
                        <p className="text-sm text-zinc-500">{t('no_tenants_found')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
