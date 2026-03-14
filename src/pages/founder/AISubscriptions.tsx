import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CreditCard, TrendingUp, TrendingDown, AlertTriangle, Users, Clock,
    RefreshCw, ChevronDown, ChevronUp, Zap, ArrowRight, Plus, FileText, Send,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import {
    listTenants, getRevenueAnalytics, listPlans, createPlan, updatePlan,
    listInvoices, markInvoicePaid, sendInvoiceReminder, suggestPricing,
    type PlanDefinition, type Invoice,
} from '../../services/founderService';
import { LoadingState, ErrorState, founderFetch, TabBar, SectionHeader, StatusBadge } from './shared';

type ViewFilter = 'all' | 'active' | 'trial' | 'past_due' | 'grace' | 'restricted';
type BillingTab = 'subscriptions' | 'plans' | 'invoices';

interface SubRecord {
    id: string;
    company_id: string;
    company_name: string;
    plan_code: string;
    status: string;
    current_period_end: string;
    mrr: number;
    member_count: number;
    ai_suggestion?: string;
}

export default function AISubscriptions() {
    const { t } = useTranslation();
    const [subs, setSubs] = useState<SubRecord[]>([]);
    const [plans, setPlans] = useState<PlanDefinition[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<BillingTab>('subscriptions');
    const [filter, setFilter] = useState<ViewFilter>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showCreatePlan, setShowCreatePlan] = useState(false);
    const [newPlan, setNewPlan] = useState({ plan_code: '', display_name: '', monthly_price: 0, annual_price: 0, currency: 'AED', max_users: 10, max_ai_queries: 1000, modules_included: [] as string[], is_active: true });

    useEffect(() => {
        loadSubscriptions();
        listPlans().then(d => setPlans((d as any).plans || [])).catch(() => { });
        listInvoices().then(d => setInvoices((d as any).invoices || [])).catch(() => { });
    }, []);

    const loadSubscriptions = async () => {
        setLoading(true);
        try {
            const { data, error: e } = await supabase
                .from('subscriptions')
                .select('*, companies(name, member_count)')
                .order('created_at', { ascending: false })
                .limit(300);

            if (e) throw e;

            const records: SubRecord[] = (data || []).map((s: any) => {
                const plan = s.plan_code || s.stripe_price_id || 'unknown';
                const mrr = s.amount ? s.amount / 100 : 0;
                const daysLeft = s.current_period_end
                    ? Math.ceil((new Date(s.current_period_end).getTime() - Date.now()) / 86400000)
                    : 0;

                let suggestion: string | undefined;
                if (s.status === 'past_due') suggestion = 'Send payment reminder + offer 3-day grace extension';
                else if (s.status === 'trial' && daysLeft <= 3) suggestion = 'Trial ending soon. Send conversion offer with 20% discount';
                else if (s.status === 'active' && mrr > 0 && (s.companies?.member_count || 0) > 10) suggestion = 'High-value tenant. Consider enterprise upsell';
                else if (s.status === 'grace') suggestion = 'Grace period active. Prepare dunning email sequence';

                return {
                    id: s.id,
                    company_id: s.company_id,
                    company_name: s.companies?.name || s.company_id,
                    plan_code: plan,
                    status: s.status || 'unknown',
                    current_period_end: s.current_period_end || '',
                    mrr,
                    member_count: s.companies?.member_count || 0,
                    ai_suggestion: suggestion,
                };
            });

            setSubs(records);
        } catch (e: any) {
            setError(e.message || 'Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    };

    const filtered = subs.filter(s => filter === 'all' || s.status === filter);

    const statusCounts: Record<string, number> = {};
    subs.forEach(s => {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    });

    const totalMRR = subs.filter(s => s.status === 'active').reduce((sum, s) => sum + s.mrr, 0);

    const statusColor: Record<string, string> = {
        active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        past_due: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        grace: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        restricted: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        canceled: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400',
    };

    const handleExtendTrial = async (subId: string) => {
        setActionLoading(subId);
        try {
            await founderFetch(`/api/billing/admin/extend-trial`, 'POST', { subscriptionId: subId, days: 7 });
            loadSubscriptions();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <SectionHeader title={t('ai_subscriptions')} subtitle={t('smart_subscription_management')} />
                <div className="flex gap-2">
                    <button
                        onClick={loadSubscriptions}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                        <RefreshCw size={14} /> {t('refresh')}
                    </button>
                    {activeTab === 'plans' && (
                        <button onClick={() => setShowCreatePlan(!showCreatePlan)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
                            <Plus size={14} /> {t('new_plan') || 'New Plan'}
                        </button>
                    )}
                </div>
            </div>

            <TabBar
                tabs={[
                    { key: 'subscriptions', label: t('subscriptions') || 'Subscriptions' },
                    { key: 'plans', label: t('plans') || 'Plans' },
                    { key: 'invoices', label: t('invoices') || 'Invoices' },
                ]}
                active={activeTab}
                onChange={(k) => setActiveTab(k as BillingTab)}
            />

            {activeTab === 'subscriptions' && (<>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-5">
                        <CreditCard size={16} className="text-blue-600 mb-2" />
                        <p className="text-xl font-black">{subs.length}</p>
                        <p className="text-[10px] font-bold uppercase text-zinc-500">{t('total_subscriptions')}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-5">
                        <TrendingUp size={16} className="text-green-600 mb-2" />
                        <p className="text-xl font-black">{Math.round(totalMRR).toLocaleString()} AED</p>
                        <p className="text-[10px] font-bold uppercase text-zinc-500">{t('active_mrr')}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-5">
                        <AlertTriangle size={16} className="text-red-600 mb-2" />
                        <p className="text-xl font-black">{statusCounts.past_due || 0}</p>
                        <p className="text-[10px] font-bold uppercase text-zinc-500">{t('past_due')}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-5">
                        <Clock size={16} className="text-blue-600 mb-2" />
                        <p className="text-xl font-black">{statusCounts.trial || 0}</p>
                        <p className="text-[10px] font-bold uppercase text-zinc-500">{t('on_trial')}</p>
                    </div>
                </div>

                {/* Status filter */}
                <div className="flex flex-wrap gap-2">
                    {(['all', 'active', 'trial', 'past_due', 'grace', 'restricted'] as ViewFilter[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                }`}
                        >
                            {f.replace('_', ' ')} ({f === 'all' ? subs.length : statusCounts[f] || 0})
                        </button>
                    ))}
                </div>

                {/* Subscription list */}
                <div className="space-y-3">
                    {filtered.map(sub => (
                        <div key={sub.id} className="bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <div className="flex items-center justify-between p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 bg-blue-600/10 rounded-lg flex items-center justify-center">
                                        <CreditCard size={16} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{sub.company_name}</p>
                                        <p className="text-xs text-zinc-500">{sub.plan_code} — {sub.member_count} members</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-black">{Math.round(sub.mrr)} AED</span>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusColor[sub.status] || 'bg-zinc-100 text-zinc-600'}`}>
                                        {sub.status}
                                    </span>
                                    <button onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)} className="p-1">
                                        {expandedId === sub.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                </div>
                            </div>

                            {expandedId === sub.id && (
                                <div className="border-t border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50 dark:bg-zinc-950/50 space-y-4">
                                    {sub.current_period_end && (
                                        <p className="text-xs text-zinc-500">
                                            Period ends: {new Date(sub.current_period_end).toLocaleDateString()}
                                        </p>
                                    )}

                                    {/* AI Suggestion */}
                                    {sub.ai_suggestion && (
                                        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                                            <Zap size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-blue-600 mb-1">AI Recommendation</p>
                                                <p className="text-xs text-blue-800 dark:text-blue-300">{sub.ai_suggestion}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        {sub.status === 'trial' && (
                                            <button
                                                onClick={() => handleExtendTrial(sub.id)}
                                                disabled={actionLoading === sub.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                <Clock size={14} /> Extend Trial (+7d)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="text-center py-12">
                            <CreditCard size={28} className="mx-auto text-zinc-400 mb-3" />
                            <p className="text-sm text-zinc-500">{t('no_subscriptions_found')}</p>
                        </div>
                    )}
                </div>
            </>)}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
                <div className="space-y-4">
                    {showCreatePlan && (
                        <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                            <h3 className="text-sm font-black uppercase">{t('create_plan') || 'Create Plan'}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <input placeholder="Code (e.g. starter)" value={newPlan.plan_code} onChange={e => setNewPlan({ ...newPlan, plan_code: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-0" />
                                <input placeholder="Display name" value={newPlan.display_name} onChange={e => setNewPlan({ ...newPlan, display_name: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-0" />
                                <input type="number" placeholder="Price/mo" value={newPlan.monthly_price} onChange={e => setNewPlan({ ...newPlan, monthly_price: Number(e.target.value) })} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-0" />
                                <input type="number" placeholder="Max members" value={newPlan.max_users} onChange={e => setNewPlan({ ...newPlan, max_users: Number(e.target.value) })} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-0" />
                                <input type="number" placeholder="Max AI queries" value={newPlan.max_ai_queries} onChange={e => setNewPlan({ ...newPlan, max_ai_queries: Number(e.target.value) })} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm border-0" />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowCreatePlan(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">{t('cancel')}</button>
                                <button
                                    onClick={async () => {
                                        if (!newPlan.plan_code.trim()) return;
                                        try { await createPlan(newPlan); setShowCreatePlan(false); setNewPlan({ plan_code: '', display_name: '', monthly_price: 0, annual_price: 0, currency: 'AED', max_users: 10, max_ai_queries: 1000, modules_included: [], is_active: true }); listPlans().then(d => setPlans((d as any).plans || [])); } catch (e: any) { alert(e.message); }
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                                >{t('create')}</button>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map((plan, i) => (
                            <div key={plan.plan_code || i} className="bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-black uppercase">{plan.display_name || plan.plan_code}</p>
                                    <span className="text-[10px] font-bold uppercase text-zinc-400">{plan.plan_code}</span>
                                </div>
                                <p className="text-2xl font-black">{plan.monthly_price} <span className="text-sm text-zinc-500">{plan.currency}/mo</span></p>
                                <div className="space-y-1 text-xs text-zinc-500">
                                    <p>Max members: {plan.max_users || 'Unlimited'}</p>
                                    <p>Max AI queries: {plan.max_ai_queries || 'Unlimited'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {plans.length === 0 && (
                        <div className="text-center py-12">
                            <CreditCard size={28} className="mx-auto text-zinc-400 mb-3" />
                            <p className="text-sm text-zinc-500">{t('no_plans') || 'No plans defined'}</p>
                        </div>
                    )}
                    <button
                        onClick={async () => { try { const code = plans[0]?.plan_code || 'starter'; const r = await suggestPricing(code); alert(JSON.stringify(r, null, 2)); } catch (e: any) { alert(e.message); } }}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700"
                    >
                        <Zap size={14} /> {t('ai_pricing_suggestion') || 'AI Pricing Suggestion'}
                    </button>
                </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
                <div className="space-y-3">
                    {invoices.length > 0 ? invoices.map((inv, i) => (
                        <div key={inv.id || i} className="bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <FileText size={16} className="text-blue-600" />
                                    <div>
                                        <p className="text-sm font-bold">{inv.company_name || inv.company_id}</p>
                                        <p className="text-xs text-zinc-500">{inv.invoice_type || inv.id.slice(0, 12)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-black">{inv.amount} AED</span>
                                    <StatusBadge status={inv.status} />
                                    {inv.status !== 'paid' && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={async () => { try { await markInvoicePaid(inv.id); setInvoices(prev => prev.map(x => x.id === inv.id ? { ...x, status: 'paid' } : x)); } catch { } }}
                                                className="px-2 py-1 text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg"
                                            >Mark Paid</button>
                                            <button
                                                onClick={async () => { try { await sendInvoiceReminder(inv.id); alert('Reminder sent'); } catch { } }}
                                                className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Send Reminder"
                                            >
                                                <Send size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12">
                            <FileText size={28} className="mx-auto text-zinc-400 mb-3" />
                            <p className="text-sm text-zinc-500">{t('no_invoices') || 'No invoices'}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
