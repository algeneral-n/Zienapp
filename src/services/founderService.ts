/**
 * Founder Service — Frontend API client for /api/founder/*
 * Platform super-admin control plane: tenants, revenue, AI policies, flags, announcements
 */

import { supabase } from './supabase';

const API = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
    };
}

async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API}${path}`, { headers: await authHeaders() });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error || res.statusText);
    }
    return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error || res.statusText);
    }
    return res.json() as Promise<T>;
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API}${path}`, {
        method: 'PATCH',
        headers: await authHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error || res.statusText);
    }
    return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Tenant {
    id: string;
    name: string;
    name_ar?: string;
    industry?: string;
    country?: string;
    status: string;
    plan_code?: string;
    created_at: string;
    owner_user_id: string;
    subscription?: {
        plan_code: string;
        status: string;
        gateway: string;
        current_period_end?: string;
    };
    member_count: number;
}

export interface TenantDetail extends Tenant {
    members: Array<{ id: string; user_id: string; role: string; status: string }>;
    modules: Array<{ module_id: string; is_active: boolean }>;
    ai_usage_30d: { total_queries: number; total_tokens: number };
    recent_invoices: Array<{ id: string; total: number; status: string; invoice_type: string }>;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface RevenueAnalytics {
    period_days: number;
    mrr: number;
    arr: number;
    total_subscriptions: number;
    active_subscriptions: number;
    new_companies: number;
    revenue_by_gateway: Record<string, number>;
    subscription_status: Record<string, number>;
    plan_breakdown: Record<string, { count: number; mrr: number }>;
    payments_in_period: number;
}

export interface MRRBreakdown {
    total_mrr: number;
    subscribers: number;
    breakdown: Array<{
        company_id: string;
        plan_code: string;
        plan_name: string;
        billing_interval: string;
        mrr_contribution: number;
    }>;
}

export interface AIUsagePlatform {
    period_days: number;
    total_queries: number;
    total_tokens_in: number;
    total_tokens_out: number;
    total_tokens: number;
    unique_companies: number;
    by_agent_type: Record<string, number>;
    by_model: Record<string, number>;
    top_consumers: Array<{ company_id: string; queries: number; tokens: number }>;
}

export interface AIPolicy {
    id: string;
    name: string;
    description?: string;
    policy_type: string;
    rules: Record<string, unknown>;
    applies_to: string;
    is_active: boolean;
    priority: number;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface FeatureFlag {
    id: string;
    flag_key: string;
    name: string;
    description?: string;
    is_enabled: boolean;
    rollout_percentage: number;
    target_plans: string[];
    target_companies: string[];
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface Announcement {
    id: string;
    title_en: string;
    title_ar?: string;
    body_en: string;
    body_ar?: string;
    severity: 'info' | 'warning' | 'critical' | 'maintenance';
    target_audience: string;
    starts_at: string;
    ends_at?: string;
    is_active: boolean;
    created_by: string;
    created_at: string;
}

export interface SystemHealth {
    timestamp: string;
    overall_health: number;
    components: {
        database: { status: string; latency_ms: number };
        subscriptions: { health: number; total: number; active: number; past_due: number };
        payments_24h: { health: number; total: number; failed: number };
        integrations: { health: number; total: number; connected: number; errored: number };
    };
    totals: {
        companies: number;
        active_members: number;
        ai_queries_24h: number;
    };
}

export interface AuditEntry {
    id: string;
    actor_id: string;
    action: string;
    target_type: string;
    target_id: string;
    details: Record<string, unknown>;
    ip_address?: string;
    created_at: string;
}

export interface PlatformConfigItem {
    key: string;
    value: unknown;
    description?: string;
    updated_by?: string;
    updated_at: string;
}

// ─── Tenant Management ───────────────────────────────────────────────────────

export async function listTenants(
    page = 1,
    limit = 20,
    options?: { status?: string; search?: string },
): Promise<{ tenants: Tenant[]; pagination: Pagination }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (options?.status) params.set('status', options.status);
    if (options?.search) params.set('search', options.search);
    return apiGet(`/api/founder/tenants?${params}`);
}

export async function getTenant(tenantId: string): Promise<{ tenant: TenantDetail }> {
    return apiGet(`/api/founder/tenants/${tenantId}`);
}

export async function updateTenant(
    tenantId: string,
    updates: Partial<Pick<Tenant, 'name' | 'name_ar' | 'status' | 'plan_code' | 'industry' | 'country'>>,
): Promise<{ updated: boolean; fields: string[] }> {
    return apiPatch(`/api/founder/tenants/${tenantId}`, updates);
}

export async function suspendTenant(tenantId: string): Promise<{ suspended: boolean }> {
    return apiPost(`/api/founder/tenants/${tenantId}/suspend`, {});
}

export async function reinstateTenant(tenantId: string): Promise<{ reinstated: boolean }> {
    return apiPost(`/api/founder/tenants/${tenantId}/reinstate`, {});
}

// ─── Revenue Analytics ───────────────────────────────────────────────────────

export async function getRevenueAnalytics(days = 30): Promise<RevenueAnalytics> {
    return apiGet(`/api/founder/revenue?days=${days}`);
}

export async function getMRRBreakdown(): Promise<MRRBreakdown> {
    return apiGet('/api/founder/mrr');
}

// ─── AI Usage & Policies ─────────────────────────────────────────────────────

export async function getAIUsagePlatform(days = 30): Promise<AIUsagePlatform> {
    return apiGet(`/api/founder/ai-usage?days=${days}`);
}

export async function listAIPolicies(): Promise<{ policies: AIPolicy[] }> {
    return apiGet('/api/founder/ai-policies');
}

export async function createAIPolicy(policy: {
    name: string;
    description?: string;
    policy_type: string;
    rules: Record<string, unknown>;
    applies_to?: string;
    priority?: number;
}): Promise<{ policy: AIPolicy }> {
    return apiPost('/api/founder/ai-policies', policy);
}

export async function updateAIPolicy(
    policyId: string,
    updates: Partial<Pick<AIPolicy, 'name' | 'description' | 'rules' | 'applies_to' | 'is_active' | 'priority'>>,
): Promise<{ updated: boolean }> {
    return apiPatch(`/api/founder/ai-policies/${policyId}`, updates);
}

// ─── Feature Flags ───────────────────────────────────────────────────────────

export async function listFeatureFlags(): Promise<{ flags: FeatureFlag[] }> {
    return apiGet('/api/founder/feature-flags');
}

export async function createFeatureFlag(flag: {
    flag_key: string;
    name: string;
    description?: string;
    is_enabled?: boolean;
    rollout_percentage?: number;
    target_plans?: string[];
    target_companies?: string[];
}): Promise<{ flag: FeatureFlag }> {
    return apiPost('/api/founder/feature-flags', flag);
}

export async function updateFeatureFlag(
    flagId: string,
    updates: Partial<Pick<FeatureFlag, 'name' | 'description' | 'is_enabled' | 'rollout_percentage' | 'target_plans' | 'target_companies'>>,
): Promise<{ updated: boolean }> {
    return apiPatch(`/api/founder/feature-flags/${flagId}`, updates);
}

// ─── Announcements ───────────────────────────────────────────────────────────

export async function listAnnouncements(): Promise<{ announcements: Announcement[] }> {
    return apiGet('/api/founder/announcements');
}

export async function createAnnouncement(announcement: {
    title_en: string;
    title_ar?: string;
    body_en: string;
    body_ar?: string;
    severity?: string;
    target_audience?: string;
    starts_at?: string;
    ends_at?: string;
}): Promise<{ announcement: Announcement }> {
    return apiPost('/api/founder/announcements', announcement);
}

// ─── System Health ───────────────────────────────────────────────────────────

export async function getSystemHealth(): Promise<SystemHealth> {
    return apiGet('/api/founder/system-health');
}

// ─── Platform Audit Log ──────────────────────────────────────────────────────

export async function getPlatformAuditLog(
    page = 1,
    limit = 50,
    action?: string,
): Promise<{ entries: AuditEntry[]; pagination: Pagination }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (action) params.set('action', action);
    return apiGet(`/api/founder/audit-log?${params}`);
}

// ─── Platform Config ─────────────────────────────────────────────────────────

export async function getPlatformConfig(): Promise<{ config: PlatformConfigItem[] }> {
    return apiGet('/api/founder/config');
}

export async function updatePlatformConfig(
    key: string,
    value: unknown,
    description?: string,
): Promise<{ updated: boolean }> {
    return apiPost('/api/founder/config', { key, value, description });
}
