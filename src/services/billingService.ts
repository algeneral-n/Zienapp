/**
 * Billing Service — Frontend API client for /api/billing/*
 * Covers: plans, checkout, portal, subscriptions, usage, smart orchestration
 */

import { supabase } from './supabase';

const API = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function authHeaders(companyId?: string): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
    };
    if (companyId) headers['X-Company-Id'] = companyId;
    return headers;
}

async function apiGet<T>(path: string, companyId?: string): Promise<T> {
    const res = await fetch(`${API}${path}`, { headers: await authHeaders(companyId) });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error || res.statusText);
    }
    return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown, companyId?: string): Promise<T> {
    const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: await authHeaders(companyId),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error || res.statusText);
    }
    return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Plan {
    id: string;
    code: string;
    name_en: string;
    name_ar: string;
    price_monthly: number;
    price_yearly: number;
    currency: string;
    max_users: number;
    features: Record<string, unknown>;
    is_active: boolean;
}

export interface Addon {
    id: string;
    code: string;
    name_en: string;
    price: number;
    billing_unit: string;
    is_active: boolean;
}

export interface Subscription {
    id: string;
    company_id: string;
    plan_code: string;
    status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
    gateway: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    gateway_reference?: string;
    billing_interval: 'monthly' | 'yearly';
    current_period_start?: string;
    current_period_end?: string;
    cancel_at?: string;
    last_payment_at?: string;
}

export interface UsageData {
    company_id: string;
    period_start: string;
    period_end: string | null;
    ai: {
        queries_used: number;
        quota: number;
        usage_percent: number;
        tokens_in: number;
        tokens_out: number;
    };
    users: {
        active: number;
        max: number;
        usage_percent: number;
    };
}

type PaymentRegion = 'AE' | 'SA' | 'EG' | 'BH' | 'OM' | 'QA' | 'KW' | 'GLOBAL';

export interface OrchestrateResult {
    gateway: string;
    url?: string;
    sessionId?: string;
    orderRef?: string;
    paymentId?: string;
    status?: string;
    message?: string;
    fallback?: string;
    region?: string;
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export async function getPlans(): Promise<{ plans: Plan[]; addons: Addon[] }> {
    return apiGet('/api/billing/plans');
}

// ─── Checkout / Portal ───────────────────────────────────────────────────────

export async function createCheckoutSession(
    companyId: string,
    planCode: string,
    successUrl?: string,
    cancelUrl?: string,
): Promise<{ url: string; sessionId: string }> {
    return apiPost('/api/billing/create-checkout-session', {
        companyId,
        planCode,
        successUrl,
        cancelUrl,
    });
}

export async function createPortalSession(
    companyId: string,
    returnUrl?: string,
): Promise<{ url: string }> {
    return apiPost('/api/billing/create-portal-session', { companyId, returnUrl });
}

// ─── Smart Payment Orchestration ─────────────────────────────────────────────

export async function orchestratePayment(
    companyId: string,
    planCode: string,
    region: PaymentRegion = 'GLOBAL',
    billingInterval: 'monthly' | 'yearly' = 'monthly',
    successUrl?: string,
    cancelUrl?: string,
): Promise<OrchestrateResult> {
    return apiPost('/api/billing/orchestrate', {
        companyId,
        planCode,
        region,
        billingInterval,
        successUrl,
        cancelUrl,
    });
}

// ─── Subscription Details ────────────────────────────────────────────────────

export async function getSubscription(
    companyId: string,
): Promise<{ subscription: Subscription | null; plan: Plan | null; status: string }> {
    return apiGet(`/api/billing/subscription/${companyId}`);
}

// ─── Usage ───────────────────────────────────────────────────────────────────

export async function getUsage(companyId: string): Promise<UsageData> {
    return apiGet(`/api/billing/usage/${companyId}`);
}

export async function reportUsage(
    companyId: string,
    usageType: 'ai_query' | 'storage' | 'api_call',
    quantity = 1,
    metadata?: Record<string, unknown>,
): Promise<{ recorded: boolean }> {
    return apiPost('/api/billing/usage/report', {
        companyId,
        usageType,
        quantity,
        metadata,
    });
}
