import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Crown, ShieldOff, ShieldCheck, Power, UserX, Users, Globe, Lock,
    AlertTriangle, RefreshCw, ToggleLeft, ToggleRight, Download, Trash2,
    Zap, RotateCw, Shield, Server,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { founderFetch, LoadingState, ErrorState, ConfirmDialog, StatusBadge } from './shared';
import { restartWorkers, forceProvisioning, forceBilling, forceIntegrationReconnect, overrideRLS } from '../../services/founderService';

interface KillSwitch {
    key: string;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    dangerLevel: 'low' | 'medium' | 'high';
}

const KILL_SWITCHES: KillSwitch[] = [
    { key: 'maintenance_mode', label: 'maintenance_mode', description: 'Puts entire platform in maintenance. All tenant access blocked.', icon: Power, color: 'text-red-600', dangerLevel: 'high' },
    { key: 'disable_signups', label: 'disable_signups', description: 'Prevents new company registrations.', icon: UserX, color: 'text-amber-600', dangerLevel: 'medium' },
    { key: 'freeze_ai', label: 'freeze_ai', description: 'Disables all AI queries across the platform.', icon: ShieldOff, color: 'text-red-600', dangerLevel: 'high' },
    { key: 'disable_payments', label: 'disable_payments', description: 'Freezes all payment processing and subscriptions.', icon: Lock, color: 'text-red-600', dangerLevel: 'high' },
    { key: 'read_only_mode', label: 'read_only_mode', description: 'Allows reading but blocks all write operations.', icon: Globe, color: 'text-blue-600', dangerLevel: 'medium' },
];

const MODULE_KEYS = ['hr', 'crm', 'projects', 'logistics', 'accounting', 'billing', 'meetings', 'chat', 'store', 'academy'];

// Force Operation Card component
function ForceOpCard({ icon: Icon, label, desc, color, loading, hasInput, inputPlaceholder, onExecute }: {
    icon: React.ElementType; label: string; desc: string; color: string; loading: boolean;
    hasInput?: boolean; inputPlaceholder?: string; onExecute: (val?: string) => void;
}) {
    const [inputVal, setInputVal] = useState('');
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon size={14} className="text-white" />
                </div>
                <div>
                    <p className="text-xs font-bold">{label}</p>
                    <p className="text-[10px] text-zinc-500">{desc}</p>
                </div>
            </div>
            <div className="flex gap-2 mt-3">
                {hasInput && (
                    <input
                        type="text"
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        placeholder={inputPlaceholder}
                        className="flex-1 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                )}
                <button
                    onClick={() => onExecute(inputVal)}
                    disabled={loading || (hasInput && !inputVal.trim())}
                    className={`px-4 py-2 ${color} text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all`}
                >
                    {loading ? '...' : 'Execute'}
                </button>
            </div>
        </div>
    );
}

export default function SupremeAccess() {
    const { t } = useTranslation();
    const [switches, setSwitches] = useState<Record<string, boolean>>({});
    const [modules, setModules] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ key: string; action: 'enable' | 'disable' } | null>(null);
    const [auditLog, setAuditLog] = useState<any[]>([]);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            // Load platform config from platform_config table
            const { data: config } = await supabase
                .from('platform_config')
                .select('key, value')
                .in('key', [...KILL_SWITCHES.map(s => s.key), ...MODULE_KEYS.map(m => `module_${m}_enabled`)]);

            const switchState: Record<string, boolean> = {};
            const moduleState: Record<string, boolean> = {};

            KILL_SWITCHES.forEach(s => { switchState[s.key] = false; });
            MODULE_KEYS.forEach(m => { moduleState[m] = true; });

            (config || []).forEach((c: any) => {
                if (c.key.startsWith('module_') && c.key.endsWith('_enabled')) {
                    const mod = c.key.replace('module_', '').replace('_enabled', '');
                    moduleState[mod] = c.value === 'true' || c.value === true;
                } else {
                    switchState[c.key] = c.value === 'true' || c.value === true;
                }
            });

            setSwitches(switchState);
            setModules(moduleState);

            // Load recent supreme actions from audit log
            const { data: log } = await supabase
                .from('platform_audit_log')
                .select('*')
                .eq('category', 'supreme_access')
                .order('created_at', { ascending: false })
                .limit(20);

            setAuditLog(log || []);
        } catch (e: any) {
            setError(e.message || 'Failed to load configuration');
        } finally {
            setLoading(false);
        }
    };

    const toggleKillSwitch = async (key: string) => {
        const newValue = !switches[key];
        if (newValue) {
            // Enabling a dangerous switch — confirm first
            setConfirmDialog({ key, action: 'enable' });
            return;
        }
        await applyKillSwitch(key, newValue);
    };

    const applyKillSwitch = async (key: string, value: boolean) => {
        setActionLoading(key);
        setConfirmDialog(null);
        try {
            await supabase.from('platform_config').upsert({ key, value: String(value), updated_at: new Date().toISOString() });

            // Audit log entry
            await supabase.from('platform_audit_log').insert({
                actor_id: (await supabase.auth.getUser()).data.user?.id,
                action: value ? `supreme:${key}:enabled` : `supreme:${key}:disabled`,
                category: 'supreme_access',
                severity: value ? 'critical' : 'info',
                details: { key, value },
            });

            setSwitches(prev => ({ ...prev, [key]: value }));
            loadConfig(); // refresh audit log
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleModule = async (mod: string) => {
        const key = `module_${mod}_enabled`;
        const newValue = !modules[mod];
        setActionLoading(key);
        try {
            await supabase.from('platform_config').upsert({ key, value: String(newValue), updated_at: new Date().toISOString() });
            setModules(prev => ({ ...prev, [mod]: newValue }));
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleExportData = async () => {
        setActionLoading('export');
        try {
            const data = await founderFetch('/api/founder/export-data');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zien-platform-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            alert(e.message || 'Export failed');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <div className="space-y-8">
            {/* Confirmation dialog */}
            {confirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-6 max-w-md w-full mx-4 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">{t('confirm_action')}</p>
                                <p className="text-xs text-zinc-500">{t('this_action_affects_platform')}</p>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6">
                            {KILL_SWITCHES.find(s => s.key === confirmDialog.key)?.description}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDialog(null)}
                                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={() => applyKillSwitch(confirmDialog.key, true)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700"
                            >
                                {t('confirm_enable')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Crown size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{t('supreme_access')}</h2>
                    <p className="text-xs text-zinc-500">{t('master_platform_controls')}</p>
                </div>
            </div>

            {/* Kill Switches */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">{t('kill_switches')}</p>
                <div className="space-y-3">
                    {KILL_SWITCHES.map(sw => (
                        <div
                            key={sw.key}
                            className={`flex items-center justify-between p-5 bg-white dark:bg-zinc-900 rounded-[20px] border transition-all ${switches[sw.key]
                                ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
                                : 'border-zinc-200 dark:border-zinc-800'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <sw.icon size={18} className={sw.color} />
                                <div>
                                    <p className="text-sm font-bold">{t(sw.label)}</p>
                                    <p className="text-xs text-zinc-500">{sw.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleKillSwitch(sw.key)}
                                disabled={actionLoading === sw.key}
                                className="flex-shrink-0"
                            >
                                {switches[sw.key] ? (
                                    <ToggleRight size={28} className="text-red-600" />
                                ) : (
                                    <ToggleLeft size={28} className="text-zinc-400" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Force Operations Panel */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">{t('force_operations') || 'Force Operations'}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ForceOpCard
                        icon={Server}
                        label={t('restart_workers') || 'Restart Workers'}
                        desc="Force restart all Cloudflare Worker instances"
                        color="bg-orange-600"
                        loading={actionLoading === 'restart_workers'}
                        onExecute={async () => {
                            setActionLoading('restart_workers');
                            try { await restartWorkers(); alert('Workers restarted'); } catch (e: any) { alert(e.message); }
                            setActionLoading(null);
                        }}
                    />
                    <ForceOpCard
                        icon={Zap}
                        label={t('force_provisioning') || 'Force Provisioning'}
                        desc="Re-provision a specific tenant (enter tenant ID)"
                        color="bg-blue-600"
                        hasInput
                        inputPlaceholder="Tenant ID"
                        loading={actionLoading === 'force_prov'}
                        onExecute={async (val) => {
                            if (!val) return;
                            setActionLoading('force_prov');
                            try { await forceProvisioning(val); alert('Provisioning started'); } catch (e: any) { alert(e.message); }
                            setActionLoading(null);
                        }}
                    />
                    <ForceOpCard
                        icon={RefreshCw}
                        label={t('force_billing') || 'Force Billing Sync'}
                        desc="Force billing recalculation for a tenant"
                        color="bg-emerald-600"
                        hasInput
                        inputPlaceholder="Tenant ID"
                        loading={actionLoading === 'force_bill'}
                        onExecute={async (val) => {
                            if (!val) return;
                            setActionLoading('force_bill');
                            try { await forceBilling(val); alert('Billing sync triggered'); } catch (e: any) { alert(e.message); }
                            setActionLoading(null);
                        }}
                    />
                    <ForceOpCard
                        icon={RotateCw}
                        label={t('force_integration_reconnect') || 'Force Integration Reconnect'}
                        desc="Force reconnect a stale integration"
                        color="bg-violet-600"
                        hasInput
                        inputPlaceholder="Integration ID"
                        loading={actionLoading === 'force_integ'}
                        onExecute={async (val) => {
                            if (!val) return;
                            setActionLoading('force_integ');
                            try { await forceIntegrationReconnect(val); alert('Reconnect triggered'); } catch (e: any) { alert(e.message); }
                            setActionLoading(null);
                        }}
                    />
                </div>
            </div>

            {/* RLS Override Panel */}
            <div className="bg-red-50/50 dark:bg-red-950/20 rounded-[24px] border border-red-200 dark:border-red-900 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Shield size={18} className="text-red-600" />
                    <div>
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">{t('rls_override') || 'RLS Override'}</p>
                        <p className="text-[10px] text-red-500">{t('rls_override_desc') || 'Temporarily bypass Row Level Security for a tenant. Use with extreme caution.'}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <input
                        id="rls-tenant-input"
                        type="text"
                        placeholder="Tenant ID"
                        className="flex-1 px-4 py-2.5 text-xs bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                    <select
                        id="rls-duration-select"
                        className="px-3 py-2.5 text-xs bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800 rounded-xl"
                    >
                        <option value="5">5 min</option>
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="60">60 min</option>
                    </select>
                    <button
                        onClick={async () => {
                            const tenantId = (document.getElementById('rls-tenant-input') as HTMLInputElement)?.value;
                            const duration = parseInt((document.getElementById('rls-duration-select') as HTMLSelectElement)?.value || '5');
                            if (!tenantId) return;
                            setActionLoading('rls');
                            try { await overrideRLS(tenantId, duration); alert(`RLS override active for ${duration} min`); } catch (e: any) { alert(e.message); }
                            setActionLoading(null);
                        }}
                        disabled={actionLoading === 'rls'}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                    >
                        {t('activate') || 'Activate'}
                    </button>
                </div>
            </div>

            {/* Module Control */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">{t('module_control')}</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {MODULE_KEYS.map(mod => (
                        <button
                            key={mod}
                            onClick={() => toggleModule(mod)}
                            disabled={!!actionLoading}
                            className={`p-4 rounded-2xl border text-center transition-all ${modules[mod]
                                ? 'bg-white dark:bg-zinc-900 border-green-300 dark:border-green-800'
                                : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 opacity-60'
                                }`}
                        >
                            <p className="text-xs font-bold uppercase">{mod}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">{modules[mod] ? t('enabled') : t('disabled')}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Control */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">{t('data_control')}</p>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportData}
                        disabled={actionLoading === 'export'}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Download size={14} /> {t('export_platform_data')}
                    </button>
                </div>
            </div>

            {/* Audit Log */}
            <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">{t('supreme_audit_log')}</p>
                {auditLog.length > 0 ? (
                    <div className="space-y-2">
                        {auditLog.map((entry: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${entry.severity === 'critical' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                    <span className="text-xs font-bold">{entry.action}</span>
                                </div>
                                <span className="text-[10px] text-zinc-400">
                                    {entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-zinc-500 text-center py-4">{t('no_actions_recorded')}</p>
                )}
            </div>
        </div>
    );
}
