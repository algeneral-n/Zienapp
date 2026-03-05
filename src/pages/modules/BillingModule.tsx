import React, { useEffect, useState, useCallback } from 'react';
import {
  CreditCard, TrendingUp, Zap, Users, BarChart3,
  Check, Loader2, ExternalLink, AlertTriangle, Crown,
  ArrowUpRight, Settings, RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../services/supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

// ─── Helper ─────────────────────────────────────────────────────────────

async function billingFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(options.headers || {}),
    },
  });
  return res.json();
}

// ─── Types ──────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_users: number;
  max_usage_per_service: number;
  features: string[] | Record<string, unknown>;
  is_active: boolean;
}

interface Subscription {
  id: string;
  company_id: string;
  plan_code: string;
  status: string;
  billing_interval: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at?: string;
  gateway?: string;
}

interface UsageData {
  ai: { queries_used: number; quota: number; usage_percent: number; tokens_in: number; tokens_out: number };
  users: { active: number; max: number; usage_percent: number };
  period_start: string;
  period_end: string | null;
}

// ─── Subscription Overview ──────────────────────────────────────────────

const SubscriptionOverview: React.FC<{ sub: Subscription | null; plan: Plan | null; usage: UsageData | null; onManage: () => void; loading: boolean }> = ({ sub, plan, usage, onManage, loading }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!sub) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 p-12 text-center">
        <Crown className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-black uppercase tracking-tight mb-2">{t('subscription_plan')}</h3>
        <p className="text-zinc-500 mb-6">No active subscription found. Choose a plan below to get started.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    past_due: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    canceled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    incomplete: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1">{t('current_plan')}</p>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-4">
            {isAr ? (plan?.name_ar || sub.plan_code) : (plan?.name_en || sub.plan_code)}
          </h2>
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest ${statusColors[sub.status] || statusColors.incomplete}`}>
              {sub.status}
            </span>
            <span className="text-blue-200 text-xs">{sub.billing_interval || 'monthly'}</span>
            {sub.gateway && sub.gateway !== 'stripe' && (
              <span className="text-blue-200 text-xs">via {sub.gateway}</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest mb-1">{t('amount_due')}</p>
              <p className="text-xl font-black">{plan ? `${plan.currency} ${sub.billing_interval === 'yearly' ? plan.price_yearly : plan.price_monthly}` : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest mb-1">{t('next_billing_date')}</p>
              <p className="text-xl font-black">{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest mb-1">{t('usage_current')} — AI</p>
              <p className="text-xl font-black">{usage?.ai?.usage_percent ?? 0}%</p>
            </div>
            <div>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest mb-1">{t('users')}</p>
              <p className="text-xl font-black">{usage?.users?.active ?? 0} / {usage?.users?.max ?? '∞'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={onManage} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 text-left hover:border-blue-400 dark:hover:border-blue-600 transition-all group">
          <Settings className="w-5 h-5 text-blue-600 mb-2 group-hover:rotate-90 transition-transform" />
          <p className="text-xs font-bold uppercase tracking-widest">{t('payment_methods')}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Manage cards & billing details</p>
        </button>
        <button onClick={onManage} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 text-left hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group">
          <ArrowUpRight className="w-5 h-5 text-emerald-600 mb-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          <p className="text-xs font-bold uppercase tracking-widest">{t('upgrade_plan')}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Unlock more features & users</p>
        </button>
        <button onClick={onManage} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 text-left hover:border-amber-400 dark:hover:border-amber-600 transition-all group">
          <CreditCard className="w-5 h-5 text-amber-600 mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest">{t('payment_history')}</p>
          <p className="text-[10px] text-zinc-500 mt-1">View invoices & receipts</p>
        </button>
      </div>

      {/* Usage Bars */}
      {usage && (
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 p-8">
          <h3 className="text-sm font-black uppercase tracking-widest mb-6">{t('usage_limits')}</h3>
          <div className="space-y-6">
            <UsageBar label="AI Queries" used={usage.ai.queries_used} total={usage.ai.quota} icon={<Zap size={16} />} color="blue" />
            <UsageBar label={t('users')} used={usage.users.active} total={usage.users.max} icon={<Users size={16} />} color="emerald" />
            <UsageBar label="Tokens In" used={usage.ai.tokens_in} total={usage.ai.quota * 2000} icon={<TrendingUp size={16} />} color="violet" />
          </div>
        </div>
      )}

      {/* Cancel Warning */}
      {sub.cancel_at && (
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 p-5 flex items-center gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">{t('cancel_subscription')}</p>
            <p className="text-[10px] text-amber-600">Your subscription will end on {new Date(sub.cancel_at).toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─── Usage Bar Component ────────────────────────────────────────────────

const UsageBar: React.FC<{ label: string; used: number; total: number; icon: React.ReactNode; color: string }> = ({ label, used, total, icon, color }) => {
  const pct = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;
  const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : `bg-${color}-500`;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-xs font-bold">{used.toLocaleString()} / {total.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} className={`h-full rounded-full ${barColor}`} />
      </div>
    </div>
  );
};

// ─── Plans Grid ─────────────────────────────────────────────────────────

const PlansGrid: React.FC<{ plans: Plan[]; currentCode: string | null; interval: 'monthly' | 'yearly'; onSelect: (plan: Plan) => void }> = ({ plans, currentCode, interval, onSelect }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrent = plan.code === currentCode;
        const price = interval === 'yearly' ? plan.price_yearly : plan.price_monthly;
        const features = Array.isArray(plan.features) ? plan.features : Object.keys(plan.features || {});

        return (
          <motion.div key={plan.id || plan.code} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-[32px] border-2 p-8 transition-all ${isCurrent ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-700'}`}>
            {isCurrent && (
              <span className="inline-block px-3 py-1 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest mb-4">{t('current_plan')}</span>
            )}
            <h3 className="text-xl font-black uppercase tracking-tight">{isAr ? plan.name_ar : plan.name_en}</h3>
            <div className="mt-3 mb-6">
              <span className="text-4xl font-black">{plan.currency} {price}</span>
              <span className="text-zinc-500 text-sm ml-1">/{interval === 'yearly' ? 'yr' : 'mo'}</span>
            </div>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-sm">
                <Users size={14} className="text-blue-600" />
                <span>Up to <strong>{plan.max_users}</strong> users</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap size={14} className="text-blue-600" />
                <span><strong>{plan.max_usage_per_service}</strong> AI queries/mo</span>
              </div>
              {features.slice(0, 5).map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Check size={14} className="text-emerald-500" />
                  <span>{typeof f === 'string' ? f : String(f)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => !isCurrent && onSelect(plan)}
              disabled={isCurrent}
              className={`w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${isCurrent ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {isCurrent ? t('current_plan') : t('upgrade_plan')}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};

// ─── Main Billing Module ────────────────────────────────────────────────

export default function BillingModule() {
  const { t } = useTranslation();
  const { company } = useCompany();
  const [tab, setTab] = useState<'overview' | 'plans'>('overview');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);

    try {
      const [plansRes, subRes, usageRes] = await Promise.all([
        billingFetch('/api/billing/plans'),
        billingFetch(`/api/billing/subscription/${company.id}`),
        billingFetch(`/api/billing/usage/${company.id}`),
      ]);

      if (plansRes.plans) setPlans(plansRes.plans);
      if (subRes.subscription) {
        setSubscription(subRes.subscription);
        if (subRes.plan) setPlan(subRes.plan);
      }
      if (usageRes.ai) setUsage(usageRes);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSelectPlan = async (selectedPlan: Plan) => {
    if (!company?.id) return;
    setCheckoutLoading(true);
    try {
      const res = await billingFetch('/api/billing/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          companyId: company.id,
          planCode: selectedPlan.code,
          billingInterval: interval,
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
        }),
      });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManagePortal = async () => {
    if (!company?.id) return;
    try {
      const res = await billingFetch('/api/billing/create-portal-session', {
        method: 'POST',
        body: JSON.stringify({ companyId: company.id }),
      });
      if (res.url) {
        window.open(res.url, '_blank');
      }
    } catch (err) {
      console.error('Portal error:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">{t('billing')}</h1>
          <p className="text-zinc-500 text-sm mt-1">{t('billing_overview')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <RefreshCw size={16} />
          </button>
          {subscription?.stripe_customer_id && (
            <button onClick={handleManagePortal} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">
              <ExternalLink size={14} /> Stripe Portal
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1.5">
        {(['overview', 'plans'] as const).map((t2) => (
          <button key={t2} onClick={() => setTab(t2)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${tab === t2 ? 'bg-white dark:bg-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            {t2 === 'overview' ? t('billing_overview') : t('subscription_plan')}
          </button>
        ))}
      </div>

      {/* Checkout Loading Overlay */}
      {checkoutLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-bold">Redirecting to checkout...</p>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {tab === 'overview' && (
        <SubscriptionOverview sub={subscription} plan={plan} usage={usage} onManage={handleManagePortal} loading={loading} />
      )}

      {tab === 'plans' && (
        <div className="space-y-6">
          {/* Interval Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-xs font-bold uppercase tracking-widest ${interval === 'monthly' ? 'text-blue-600' : 'text-zinc-400'}`}>Monthly</span>
            <button onClick={() => setInterval(i => i === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${interval === 'yearly' ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${interval === 'yearly' ? 'translate-x-7.5' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-xs font-bold uppercase tracking-widest ${interval === 'yearly' ? 'text-emerald-600' : 'text-zinc-400'}`}>
              Yearly <span className="text-emerald-500 ml-1">Save 17%</span>
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : (
            <PlansGrid plans={plans} currentCode={subscription?.plan_code || null} interval={interval} onSelect={handleSelectPlan} />
          )}
        </div>
      )}
    </div>
  );
}
