import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../services/supabase';
import { hrService, Delegation } from '../../services/hrService';
import { Settings, Globe, Palette, Bell, Shield, Building2, Save, Check, Users, Plus, X, Trash2, Ban, Clock, BellRing, ToggleLeft, ToggleRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

interface NotificationRule {
    id: string;
    company_id: string | null;
    event_type: string;
    module_code: string | null;
    target_scope: string;
    target_value: string;
    delivery_channels: string[];
    message_template_en: string | null;
    message_template_ar: string | null;
    priority: string;
    is_active: boolean;
    conditions: Record<string, unknown>;
    created_at: string;
}

async function notifApiCall<T>(method: string, path: string, body?: unknown): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json() as Promise<T>;
}

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'fr', label: 'Francais' },
    { code: 'es', label: 'Espanol' },
    { code: 'de', label: 'Deutsch' },
    { code: 'tr', label: 'Turkce' },
    { code: 'ru', label: 'Русский' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ur', label: 'اردو' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Portugues' },
    { code: 'nl', label: 'Nederlands' },
];

export default function SettingsPage() {
    const { t, i18n } = useTranslation();
    const { user, profile } = useAuth();
    const { company, role } = useCompany();
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'delegations' | 'notif_rules'>('general');
    const [language, setLanguage] = useState(i18n.language || 'en');
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
        () => (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system'
    );
    const [saved, setSaved] = useState(false);
    const [notifEmail, setNotifEmail] = useState(true);
    const [notifPush, setNotifPush] = useState(true);
    const [notifAI, setNotifAI] = useState(true);

    // Delegation state
    const [delegations, setDelegations] = useState<Delegation[]>([]);
    const [delegationLoading, setDelegationLoading] = useState(false);
    const [showNewDelegation, setShowNewDelegation] = useState(false);
    const [members, setMembers] = useState<{ id: string; user_id: string; full_name: string; email: string; role_code: string }[]>([]);
    const [newDel, setNewDel] = useState({ fromRole: '', toUserId: '', reason: '', expiresAt: '' });

    // Notification rules state
    const [notifRules, setNotifRules] = useState<NotificationRule[]>([]);
    const [notifRulesLoading, setNotifRulesLoading] = useState(false);
    const [showNewRule, setShowNewRule] = useState(false);
    const [newRule, setNewRule] = useState({ eventType: '', targetScope: 'role', targetValue: '', deliveryChannels: ['in_app'] as string[], priority: 'normal', messageTemplateEn: '', messageTemplateAr: '' });

    const isAdmin = role === 'company_gm' || role === 'executive_secretary';

    const DELEGATABLE_ROLES = [
        'company_gm', 'assistant_gm', 'department_head', 'department_manager',
        'hr_manager', 'hr_admin', 'accountant', 'senior_accountant',
    ];

    const loadDelegations = async () => {
        setDelegationLoading(true);
        try {
            const data = await hrService.listDelegations('all');
            setDelegations(data);
        } catch { /* ignore */ }
        setDelegationLoading(false);
    };

    const loadMembers = async () => {
        if (!company) return;
        const { data } = await supabase
            .from('company_members')
            .select('id, user_id, role_code, profiles(full_name, email)')
            .eq('company_id', company.id)
            .eq('is_active', true);
        setMembers((data || []).map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            full_name: m.profiles?.full_name || '',
            email: m.profiles?.email || '',
            role_code: m.role_code,
        })));
    };

    useEffect(() => {
        if (activeTab === 'delegations' && isAdmin) {
            loadDelegations();
            loadMembers();
        }
    }, [activeTab]);

    const handleCreateDelegation = async () => {
        if (!newDel.fromRole || !newDel.toUserId) return;
        try {
            await hrService.createDelegation({
                fromRole: newDel.fromRole,
                toUserId: newDel.toUserId,
                reason: newDel.reason || undefined,
                expiresAt: newDel.expiresAt || undefined,
            });
            setShowNewDelegation(false);
            setNewDel({ fromRole: '', toUserId: '', reason: '', expiresAt: '' });
            loadDelegations();
        } catch { /* ignore */ }
    };

    const handleRevokeDelegation = async (id: string) => {
        try {
            await hrService.revokeDelegation(id);
            loadDelegations();
        } catch { /* ignore */ }
    };

    const handleDeleteDelegation = async (id: string) => {
        try {
            await hrService.deleteDelegation(id);
            loadDelegations();
        } catch { /* ignore */ }
    };

    // Notification rules handlers
    const loadNotifRules = async () => {
        setNotifRulesLoading(true);
        try {
            const { rules } = await notifApiCall<{ rules: NotificationRule[] }>('GET', '/api/notifications/rules');
            setNotifRules(rules);
        } catch { /* ignore */ }
        setNotifRulesLoading(false);
    };

    useEffect(() => {
        if (activeTab === 'notif_rules' && isAdmin) loadNotifRules();
    }, [activeTab]);

    const handleCreateRule = async () => {
        if (!newRule.eventType || !newRule.targetValue) return;
        try {
            await notifApiCall('POST', '/api/notifications/rules', {
                eventType: newRule.eventType,
                targetScope: newRule.targetScope,
                targetValue: newRule.targetValue,
                deliveryChannels: newRule.deliveryChannels,
                priority: newRule.priority,
                messageTemplateEn: newRule.messageTemplateEn || undefined,
                messageTemplateAr: newRule.messageTemplateAr || undefined,
            });
            setShowNewRule(false);
            setNewRule({ eventType: '', targetScope: 'role', targetValue: '', deliveryChannels: ['in_app'], priority: 'normal', messageTemplateEn: '', messageTemplateAr: '' });
            loadNotifRules();
        } catch { /* ignore */ }
    };

    const handleToggleRule = async (rule: NotificationRule) => {
        if (rule.company_id === null) return; // Can't modify platform defaults
        try {
            await notifApiCall('PATCH', `/api/notifications/rules/${rule.id}`, { isActive: !rule.is_active });
            loadNotifRules();
        } catch { /* ignore */ }
    };

    const handleDeleteRule = async (id: string) => {
        try {
            await notifApiCall('DELETE', `/api/notifications/rules/${id}`);
            loadNotifRules();
        } catch { /* ignore */ }
    };

    const handleSave = async () => {
        i18n.changeLanguage(language);
        localStorage.setItem('i18n_lang', language);

        localStorage.setItem('theme', theme);
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else if (theme === 'light') document.documentElement.classList.remove('dark');
        else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
        }

        if (user) {
            await supabase.from('profiles').update({ locale: language }).eq('id', user.id);
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const tabs = [
        { id: 'general' as const, label: t('settings_general', 'General'), icon: Settings },
        { id: 'notifications' as const, label: t('settings_notifications', 'Notifications'), icon: Bell },
        { id: 'security' as const, label: t('settings_security', 'Security'), icon: Shield },
        ...(isAdmin ? [{ id: 'delegations' as const, label: t('delegations', 'Delegations'), icon: Users }] : []),
        ...(isAdmin ? [{ id: 'notif_rules' as const, label: t('notification_rules', 'Notification Rules'), icon: BellRing }] : []),
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <Settings className="text-blue-600" size={28} />
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('settings', 'Settings')}</h1>
            </div>

            <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-px">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-tight transition-colors border-b-2 -mb-px ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'general' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Globe size={20} className="text-blue-600" />
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t('language', 'Language')}</h2>
                        </div>
                        <select
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            className="w-full max-w-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-600"
                        >
                            {LANGUAGES.map(l => (
                                <option key={l.code} value={l.code}>{l.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Palette size={20} className="text-blue-600" />
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t('theme', 'Theme')}</h2>
                        </div>
                        <div className="flex gap-3">
                            {(['light', 'dark', 'system'] as const).map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setTheme(opt)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-tight transition-all ${theme === opt
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    {t(`theme_${opt}`, opt.charAt(0).toUpperCase() + opt.slice(1))}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isAdmin && company && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Building2 size={20} className="text-blue-600" />
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t('company_settings', 'Company Settings')}</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-zinc-500 block mb-1">{t('company_name', 'Company Name')}</span>
                                    <span className="font-bold text-zinc-900 dark:text-white">{company.name}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 block mb-1">{t('timezone', 'Timezone')}</span>
                                    <span className="font-bold text-zinc-900 dark:text-white">{company.timezone}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 block mb-1">{t('currency', 'Currency')}</span>
                                    <span className="font-bold text-zinc-900 dark:text-white">{company.currencyCode}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 block mb-1">{t('country', 'Country')}</span>
                                    <span className="font-bold text-zinc-900 dark:text-white">{company.countryCode}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                    {[
                        { key: 'email', label: t('notif_email', 'Email Notifications'), val: notifEmail, set: setNotifEmail },
                        { key: 'push', label: t('notif_push', 'Push Notifications'), val: notifPush, set: setNotifPush },
                        { key: 'ai', label: t('notif_ai', 'AI Activity Alerts'), val: notifAI, set: setNotifAI },
                    ].map(item => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.label}</span>
                            <button
                                onClick={() => item.set(!item.val)}
                                className={`w-11 h-6 rounded-full transition-colors relative ${item.val ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.val ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'security' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t('security', 'Security')}</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-white">{t('change_password', 'Change Password')}</p>
                                <p className="text-zinc-500 text-xs">{t('change_password_desc', 'Update your account password')}</p>
                            </div>
                            <button
                                onClick={async () => {
                                    if (user?.email) {
                                        await supabase.auth.resetPasswordForEmail(user.email);
                                        setSaved(true);
                                        setTimeout(() => setSaved(false), 2000);
                                    }
                                }}
                                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold text-xs uppercase tracking-tight transition-colors"
                            >
                                {t('send_reset_link', 'Send Reset Link')}
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-white">{t('two_factor', 'Two-Factor Authentication')}</p>
                                <p className="text-zinc-500 text-xs">{t('two_factor_desc', 'Add an extra layer of security')}</p>
                            </div>
                            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-500 uppercase">{t('coming_soon', 'Coming Soon')}</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'delegations' && isAdmin && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">{t('delegation_desc', 'Delegate role permissions to team members temporarily')}</p>
                        <button
                            onClick={() => setShowNewDelegation(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold uppercase tracking-tight transition-colors"
                        >
                            <Plus size={16} />
                            {t('new_delegation', 'New Delegation')}
                        </button>
                    </div>

                    {showNewDelegation && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-blue-200 dark:border-blue-800 p-6 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-zinc-900 dark:text-white">{t('create_delegation', 'Create Delegation')}</h3>
                                <button onClick={() => setShowNewDelegation(false)} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">{t('delegate_role', 'Role to Delegate')}</label>
                                    <select
                                        value={newDel.fromRole}
                                        onChange={e => setNewDel(p => ({ ...p, fromRole: e.target.value }))}
                                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm"
                                    >
                                        <option value="">{t('select_role', 'Select role...')}</option>
                                        {DELEGATABLE_ROLES.map(r => (
                                            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">{t('delegate_to', 'Delegate To')}</label>
                                    <select
                                        value={newDel.toUserId}
                                        onChange={e => setNewDel(p => ({ ...p, toUserId: e.target.value }))}
                                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm"
                                    >
                                        <option value="">{t('select_member', 'Select member...')}</option>
                                        {members.map(m => (
                                            <option key={m.user_id} value={m.user_id}>{m.full_name} ({m.role_code.replace(/_/g, ' ')})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">{t('expires_at', 'Expires At')}</label>
                                    <input
                                        type="datetime-local"
                                        value={newDel.expiresAt}
                                        onChange={e => setNewDel(p => ({ ...p, expiresAt: e.target.value }))}
                                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">{t('reason', 'Reason')}</label>
                                    <input
                                        type="text"
                                        value={newDel.reason}
                                        onChange={e => setNewDel(p => ({ ...p, reason: e.target.value }))}
                                        placeholder={t('delegation_reason_placeholder', 'e.g. GM vacation coverage')}
                                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleCreateDelegation}
                                    disabled={!newDel.fromRole || !newDel.toUserId}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white rounded-xl text-sm font-bold uppercase tracking-tight transition-colors"
                                >
                                    {t('create', 'Create')}
                                </button>
                            </div>
                        </div>
                    )}

                    {delegationLoading ? (
                        <div className="text-center py-12 text-zinc-400">{t('loading', 'Loading...')}</div>
                    ) : delegations.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
                            <Users className="mx-auto text-zinc-300 mb-3" size={40} />
                            <p className="text-zinc-500 font-medium">{t('no_delegations', 'No delegations yet')}</p>
                            <p className="text-zinc-400 text-sm mt-1">{t('no_delegations_desc', 'Create a delegation to temporarily grant role permissions')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {delegations.map(del => {
                                const isExpired = del.expires_at && new Date(del.expires_at) < new Date();
                                const isActive = del.is_active && !isExpired;
                                return (
                                    <div key={del.id} className={`bg-white dark:bg-zinc-900 rounded-2xl border p-5 ${isActive ? 'border-green-200 dark:border-green-900' : 'border-zinc-200 dark:border-zinc-800 opacity-60'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                                                        {isActive ? t('active', 'Active') : isExpired ? t('expired', 'Expired') : t('revoked', 'Revoked')}
                                                    </span>
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                        {del.from_role.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                                                    {t('delegated_to', 'Delegated to')}: {del.to_user?.full_name || del.to_user_id}
                                                </p>
                                                {del.reason && <p className="text-xs text-zinc-500 mt-1">{del.reason}</p>}
                                                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                                                    {del.granter && <span>{t('granted_by', 'Granted by')}: {del.granter.full_name}</span>}
                                                    {del.expires_at && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {new Date(del.expires_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    <span>{new Date(del.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isActive && (
                                                    <button
                                                        onClick={() => handleRevokeDelegation(del.id)}
                                                        className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-colors"
                                                        title={t('revoke', 'Revoke')}
                                                    >
                                                        <Ban size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteDelegation(del.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                    title={t('delete', 'Delete')}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'notif_rules' && isAdmin && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">{t('notif_rules_desc', 'Configure when and how notifications are sent')}</p>
                        <button
                            onClick={() => setShowNewRule(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold uppercase tracking-tight transition-colors"
                        >
                            <Plus size={16} />
                            {t('new_rule', 'New Rule')}
                        </button>
                    </div>

                    {showNewRule && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-blue-200 dark:border-blue-800 p-6 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-zinc-900 dark:text-white">{t('create_rule', 'Create Notification Rule')}</h3>
                                <button onClick={() => setShowNewRule(false)} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">{t('event_type', 'Event Type')}</label>
                                    <select value={newRule.eventType} onChange={e => setNewRule(p => ({ ...p, eventType: e.target.value }))} className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm">
                                        <option value="">{t('select_event', 'Select event...')}</option>
                                        {['approval_created', 'approval_sla_breach', 'leave_request', 'invoice_pending', 'payroll_ready', 'integration_failed', 'billing_past_due', 'new_employee_joined', 'task_overdue', 'meeting_reminder', 'delegation_created', 'delegation_revoked'].map(e => (
                                            <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">{t('target_scope', 'Target Scope')}</label>
                                    <select value={newRule.targetScope} onChange={e => setNewRule(p => ({ ...p, targetScope: e.target.value }))} className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm">
                                        <option value="role">{t('scope_role', 'Role')}</option>
                                        <option value="department">{t('scope_department', 'Department')}</option>
                                        <option value="individual">{t('scope_individual', 'Individual')}</option>
                                        <option value="company">{t('scope_company', 'Company')}</option>
                                        <option value="channel">{t('scope_channel', 'Channel')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">{t('target_value', 'Target Value')}</label>
                                    <input type="text" value={newRule.targetValue} onChange={e => setNewRule(p => ({ ...p, targetValue: e.target.value }))} placeholder={t('target_value_placeholder', 'e.g. company_gm, hr_manager')} className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">{t('priority', 'Priority')}</label>
                                    <select value={newRule.priority} onChange={e => setNewRule(p => ({ ...p, priority: e.target.value }))} className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm">
                                        <option value="low">{t('priority_low', 'Low')}</option>
                                        <option value="normal">{t('priority_normal', 'Normal')}</option>
                                        <option value="high">{t('priority_high', 'High')}</option>
                                        <option value="urgent">{t('priority_urgent', 'Urgent')}</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">{t('delivery_channels', 'Delivery Channels')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['in_app', 'email', 'push', 'sms', 'chat'].map(ch => (
                                            <button
                                                key={ch}
                                                onClick={() => setNewRule(p => ({
                                                    ...p,
                                                    deliveryChannels: p.deliveryChannels.includes(ch) ? p.deliveryChannels.filter(c => c !== ch) : [...p.deliveryChannels, ch],
                                                }))}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${newRule.deliveryChannels.includes(ch) ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                                            >
                                                {ch.replace(/_/g, ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">{t('message_en', 'Message (EN)')}</label>
                                    <input type="text" value={newRule.messageTemplateEn} onChange={e => setNewRule(p => ({ ...p, messageTemplateEn: e.target.value }))} placeholder="e.g. New {{event_type}} from {{user_name}}" className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">{t('message_ar', 'Message (AR)')}</label>
                                    <input type="text" value={newRule.messageTemplateAr} onChange={e => setNewRule(p => ({ ...p, messageTemplateAr: e.target.value }))} placeholder="مثال: {{event_type}} جديد من {{user_name}}" className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm" dir="rtl" />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button onClick={handleCreateRule} disabled={!newRule.eventType || !newRule.targetValue} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white rounded-xl text-sm font-bold uppercase tracking-tight transition-colors">
                                    {t('create', 'Create')}
                                </button>
                            </div>
                        </div>
                    )}

                    {notifRulesLoading ? (
                        <div className="text-center py-12 text-zinc-400">{t('loading', 'Loading...')}</div>
                    ) : notifRules.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
                            <BellRing className="mx-auto text-zinc-300 mb-3" size={40} />
                            <p className="text-zinc-500 font-medium">{t('no_notif_rules', 'No notification rules yet')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifRules.map(rule => {
                                const isPlatform = rule.company_id === null;
                                return (
                                    <div key={rule.id} className={`bg-white dark:bg-zinc-900 rounded-2xl border p-5 ${rule.is_active ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-200 dark:border-zinc-800 opacity-50'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                        {rule.event_type.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${rule.priority === 'urgent' ? 'bg-red-100 text-red-700' : rule.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-zinc-100 text-zinc-600'}`}>
                                                        {rule.priority}
                                                    </span>
                                                    {isPlatform && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{t('platform_default', 'Platform Default')}</span>}
                                                </div>
                                                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                                    <span className="font-bold">{rule.target_scope}</span>: {rule.target_value}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    {rule.delivery_channels?.map(ch => (
                                                        <span key={ch} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-500">{ch}</span>
                                                    ))}
                                                </div>
                                                {rule.message_template_en && <p className="text-xs text-zinc-400 mt-2 truncate">{rule.message_template_en}</p>}
                                            </div>
                                            <div className="flex items-center gap-2 ml-3">
                                                {!isPlatform && (
                                                    <>
                                                        <button onClick={() => handleToggleRule(rule)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors" title={rule.is_active ? t('disable', 'Disable') : t('enable', 'Enable')}>
                                                            {rule.is_active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-zinc-400" />}
                                                        </button>
                                                        <button onClick={() => handleDeleteRule(rule.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm uppercase tracking-tight transition-colors shadow-lg shadow-blue-600/20"
                >
                    {saved ? <Check size={18} /> : <Save size={18} />}
                    {saved ? t('saved', 'Saved') : t('save_changes', 'Save Changes')}
                </button>
            </div>
        </div>
    );
}
