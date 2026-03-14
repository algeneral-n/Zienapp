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

async function apiDelete<T>(path: string): Promise<T> {
    const res = await fetch(`${API}${path}`, {
        method: 'DELETE',
        headers: await authHeaders(),
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

// ─── NEW: Layer types ────────────────────────────────────────────────────────

export interface WorkerStatus {
    id: string;
    name: string;
    status: 'running' | 'stopped' | 'error';
    version: string;
    region: string;
    last_deploy: string;
    uptime_seconds: number;
}

export interface IntegrationHealth {
    id: string;
    name: string;
    category: 'payment' | 'communication' | 'maps' | 'storage' | 'ai';
    status: 'connected' | 'degraded' | 'disconnected' | 'error';
    latency_ms?: number;
    last_check: string;
    auto_retry: boolean;
    retry_count: number;
    last_error?: string;
}

export interface PlanDefinition {
    id: string;
    plan_code: string;
    display_name: string;
    display_name_ar?: string;
    monthly_price: number;
    annual_price: number;
    currency: string;
    max_users: number;
    max_ai_queries: number;
    modules_included: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Invoice {
    id: string;
    company_id: string;
    company_name?: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    invoice_type: string;
    due_date?: string;
    paid_at?: string;
    created_at: string;
}

export interface UIConfig {
    tenant_id: string;
    theme: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        font: string;
        border_radius: string;
        dark_mode: boolean;
    };
    navigation: Array<{ key: string; label: string; icon: string; visible: boolean; order: number }>;
    layout: string;
    components: Array<{ key: string; label: string; visible: boolean; order: number }>;
}

export interface TenantModule {
    module_code: string;
    is_active: boolean;
    activated_at?: string;
}

export interface MarketingAudience {
    id: string;
    name: string;
    filters: Record<string, unknown>;
    tenant_count: number;
    created_at: string;
}

export interface SelfHealEntry {
    id: string;
    component: string;
    action: string;
    status: 'success' | 'failed';
    details?: string;
    created_at: string;
}

export interface RecoveryItem {
    id: string;
    type: 'provisioning' | 'billing' | 'integration';
    target_id: string;
    target_name?: string;
    error: string;
    retry_count: number;
    status: 'pending' | 'retrying' | 'escalated' | 'skipped';
    created_at: string;
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

// ─── Supreme Access — Force Operations ───────────────────────────────────────

export async function restartWorkers(): Promise<{ restarted: boolean }> {
    return apiPost('/api/founder/workers/restart', {});
}

export async function forceProvisioning(tenantId: string): Promise<{ triggered: boolean }> {
    return apiPost(`/api/founder/tenants/${tenantId}/force-provision`, {});
}

export async function forceBilling(tenantId: string): Promise<{ triggered: boolean }> {
    return apiPost(`/api/founder/tenants/${tenantId}/force-billing`, {});
}

export async function forceIntegrationReconnect(integrationId: string): Promise<{ reconnected: boolean }> {
    return apiPost(`/api/founder/integrations/${integrationId}/reconnect`, {});
}

export async function overrideRLS(tenantId: string, durationMinutes: number): Promise<{ overridden: boolean; expires_at: string }> {
    return apiPost(`/api/founder/tenants/${tenantId}/override-rls`, { duration_minutes: durationMinutes });
}

// ─── Tenant Control — Extended Actions ───────────────────────────────────────

export async function deleteTenant(tenantId: string): Promise<{ deleted: boolean }> {
    return apiPost(`/api/founder/tenants/${tenantId}/delete`, {});
}

export async function resetTenant(tenantId: string): Promise<{ reset: boolean }> {
    return apiPost(`/api/founder/tenants/${tenantId}/reset`, {});
}

export async function rerunProvisioning(tenantId: string): Promise<{ triggered: boolean }> {
    return apiPost(`/api/founder/tenants/${tenantId}/rerun-provision`, {});
}

export async function addModule(tenantId: string, moduleCode: string): Promise<{ added: boolean }> {
    return apiPost(`/api/founder/tenants/${tenantId}/modules`, { module_code: moduleCode });
}

export async function removeModule(tenantId: string, moduleCode: string): Promise<{ removed: boolean }> {
    return apiDelete(`/api/founder/tenants/${tenantId}/modules/${moduleCode}`);
}

export async function getTenantAuditLog(tenantId: string, page = 1, limit = 20): Promise<{ entries: AuditEntry[]; pagination: Pagination }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiGet(`/api/founder/tenants/${tenantId}/audit-log?${params}`);
}

export async function getTenantIncidents(tenantId: string): Promise<{ incidents: Array<{ id: string; severity: string; status: string; title: string; created_at: string }> }> {
    return apiGet(`/api/founder/tenants/${tenantId}/incidents`);
}

export async function getTenantUsage(tenantId: string): Promise<{ ai_queries: number; storage_mb: number; api_calls: number; period_days: number }> {
    return apiGet(`/api/founder/tenants/${tenantId}/usage`);
}

export async function sendInternalOffer(tenantId: string, offer: { title: string; body: string; offer_type: string }): Promise<{ sent: boolean }> {
    return apiPost(`/api/founder/tenants/${tenantId}/internal-offer`, offer);
}

// ─── Integrations Hub ────────────────────────────────────────────────────────

export async function getIntegrationHealth(): Promise<{ integrations: IntegrationHealth[] }> {
    return apiGet('/api/founder/integrations/health');
}

export async function connectIntegration(tenantId: string, integrationId: string): Promise<{ connected: boolean }> {
    return apiPost(`/api/founder/integrations/${integrationId}/connect`, { tenant_id: tenantId });
}

export async function disconnectIntegration(tenantId: string, integrationId: string): Promise<{ disconnected: boolean }> {
    return apiPost(`/api/founder/integrations/${integrationId}/disconnect`, { tenant_id: tenantId });
}

export async function healthcheckIntegration(integrationId: string): Promise<{ status: string; latency_ms: number }> {
    return apiGet(`/api/founder/integrations/${integrationId}/healthcheck`);
}

export async function autofixIntegration(integrationId: string): Promise<{ fixed: boolean; action_taken: string }> {
    return apiPost(`/api/founder/integrations/${integrationId}/autofix`, {});
}

// ─── Plans & Billing ─────────────────────────────────────────────────────────

export async function listPlans(): Promise<{ plans: PlanDefinition[] }> {
    return apiGet('/api/founder/plans');
}

export async function createPlan(plan: Omit<PlanDefinition, 'id' | 'created_at' | 'updated_at'>): Promise<{ plan: PlanDefinition }> {
    return apiPost('/api/founder/plans', plan);
}

export async function updatePlan(planId: string, updates: Partial<PlanDefinition>): Promise<{ updated: boolean }> {
    return apiPatch(`/api/founder/plans/${planId}`, updates);
}

export async function listInvoices(
    page = 1,
    limit = 20,
    options?: { tenant_id?: string; status?: string },
): Promise<{ invoices: Invoice[]; pagination: Pagination }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (options?.tenant_id) params.set('tenant_id', options.tenant_id);
    if (options?.status) params.set('status', options.status);
    return apiGet(`/api/founder/invoices?${params}`);
}

export async function markInvoicePaid(invoiceId: string): Promise<{ updated: boolean }> {
    return apiPost(`/api/founder/invoices/${invoiceId}/mark-paid`, {});
}

export async function sendInvoiceReminder(invoiceId: string): Promise<{ sent: boolean }> {
    return apiPost(`/api/founder/invoices/${invoiceId}/remind`, {});
}

export async function suggestPricing(planCode: string): Promise<{ suggestion: { recommended_price: number; reasoning: string } }> {
    return apiPost('/api/founder/plans/suggest-pricing', { plan_code: planCode });
}

// ─── UI Builder ──────────────────────────────────────────────────────────────

export async function getUIConfig(tenantId: string): Promise<{ config: UIConfig }> {
    return apiGet(`/api/founder/ui-config/${tenantId}`);
}

export async function updateUIConfig(tenantId: string, config: Partial<UIConfig>): Promise<{ updated: boolean }> {
    return apiPost(`/api/founder/ui-config/${tenantId}`, config);
}

export async function getPlatformUIConfig(): Promise<{ config: UIConfig }> {
    return apiGet('/api/founder/ui-config/platform');
}

// ─── Marketing — Audiences & Retargeting ─────────────────────────────────────

export async function getMarketingAudiences(): Promise<{ audiences: MarketingAudience[] }> {
    return apiGet('/api/founder/marketing/audiences');
}

export async function createMarketingAudience(audience: { name: string; filters: Record<string, unknown> }): Promise<{ audience: MarketingAudience }> {
    return apiPost('/api/founder/marketing/audiences', audience);
}

export async function getRetargetingCampaigns(): Promise<{ campaigns: Array<{ id: string; name: string; type: string; status: string; reach: number; conversions: number; created_at: string }> }> {
    return apiGet('/api/founder/marketing/retargeting');
}

// ─── System Health — Self-Healing ────────────────────────────────────────────

export async function runAllHealthChecks(): Promise<{ results: Array<{ component: string; status: string; latency_ms: number; details?: string }> }> {
    return apiPost('/api/founder/health/check-all', {});
}

export async function triggerSelfHeal(component: string): Promise<{ triggered: boolean; action: string }> {
    return apiPost('/api/founder/health/self-heal', { component });
}

export async function getSelfHealLog(page = 1, limit = 50): Promise<{ entries: SelfHealEntry[]; pagination: Pagination }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiGet(`/api/founder/health/self-heal-log?${params}`);
}

export async function getRecoveryQueue(): Promise<{ items: RecoveryItem[] }> {
    return apiGet('/api/founder/health/recovery-queue');
}

export async function retryRecoveryItem(itemId: string): Promise<{ retried: boolean }> {
    return apiPost(`/api/founder/health/recovery-queue/${itemId}/retry`, {});
}

export async function skipRecoveryItem(itemId: string): Promise<{ skipped: boolean }> {
    return apiPost(`/api/founder/health/recovery-queue/${itemId}/skip`, {});
}

export async function escalateRecoveryItem(itemId: string): Promise<{ escalated: boolean }> {
    return apiPost(`/api/founder/health/recovery-queue/${itemId}/escalate`, {});
}

// ─── Registration Applications ───────────────────────────────────────────────

export async function listApplications(
    page = 1,
    limit = 20,
    options?: { status?: string; search?: string },
): Promise<{ applications: RegistrationApplication[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (options?.status) params.set('status', options.status);
    if (options?.search) params.set('search', options.search);
    return apiGet(`/api/founder/applications?${params}`);
}

export async function getApplication(appId: string): Promise<{ application: RegistrationApplication }> {
    return apiGet(`/api/founder/applications/${appId}`);
}

export async function approveApplication(appId: string, notes?: string): Promise<{ approved: boolean; companyId: string; userId: string }> {
    return apiPost(`/api/founder/applications/${appId}/approve`, { notes });
}

export async function rejectApplication(appId: string, reason: string): Promise<{ rejected: boolean }> {
    return apiPost(`/api/founder/applications/${appId}/reject`, { reason });
}

export interface RegistrationApplication {
    id: string;
    company_name: string | null;
    company_name_ar: string | null;
    industry_code: string | null;
    country: string | null;
    city: string | null;
    employee_count: string | null;
    cr_number: string | null;
    gm_name: string | null;
    gm_email: string | null;
    gm_phone: string | null;
    selected_modules: string[];
    plan_code: string | null;
    billing_cycle: string;
    license_file_url: string | null;
    id_file_url: string | null;
    license_verified: boolean;
    id_verified: boolean;
    license_verification_result: Record<string, unknown>;
    id_verification_result: Record<string, unknown>;
    status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'provisioning' | 'active';
    step_completed: number;
    reviewed_by: string | null;
    review_notes: string | null;
    reviewed_at: string | null;
    company_id: string | null;
    user_id: string | null;
    created_at: string;
    updated_at: string;
}

// ─── Integration Catalog CRUD ────────────────────────────────────────────────

export async function getCatalogAdmin(): Promise<{ catalog: CatalogItem[] }> {
    return apiGet('/api/founder/integrations/catalog');
}

export async function createCatalogItem(item: Omit<CatalogItem, 'id'>): Promise<{ created: boolean; item: { id: string; code: string; name: string } }> {
    return apiPost('/api/founder/integrations/catalog', item);
}

export async function updateCatalogItem(itemId: string, updates: Partial<CatalogItem>): Promise<{ updated: boolean }> {
    return apiPatch(`/api/founder/integrations/catalog/${itemId}`, updates);
}

export async function deleteCatalogItem(itemId: string): Promise<{ deleted: boolean }> {
    return apiDelete(`/api/founder/integrations/catalog/${itemId}`);
}

export interface CatalogItem {
    id: string;
    code: string;
    name: string;
    category: string;
    description: string | null;
    provider: string;
    pricing_model: string;
    setup_mode: string;
    required_secrets: unknown[];
    required_plan: string | null;
    region_availability: string[];
    webhook_support: boolean;
    commission_rate: number | null;
    tiered_pricing: Record<string, unknown> | null;
    is_active: boolean;
}
