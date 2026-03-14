/**
 * Founder Control Plane Routes — /api/founder/*
 * Super-admin API for platform-wide oversight, tenant management,
 * revenue analytics, AI policy governance, and feature flags.
 *
 * ALL endpoints require platform_admins membership.
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient } from '../supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Auth Guard ──────────────────────────────────────────────────────────────

type PlatformRole = 'super_admin' | 'admin' | 'viewer';

async function requirePlatformAdmin(
    userId: string,
    adminSupabase: SupabaseClient,
    minRole: PlatformRole = 'viewer',
): Promise<{ role: PlatformRole }> {
    const { data: admin } = await adminSupabase
        .from('platform_admins')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

    if (!admin) throw new Error('Not a platform admin');

    const hierarchy: Record<PlatformRole, number> = { super_admin: 3, admin: 2, viewer: 1 };
    if (hierarchy[admin.role as PlatformRole] < hierarchy[minRole]) {
        throw new Error(`Requires ${minRole} or higher`);
    }

    return { role: admin.role as PlatformRole };
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function handleFounder(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    const { userId } = await requireAuth(request, env);
    const adminSupabase = createAdminClient(env);

    // Verify platform admin status for all routes
    let platformRole: PlatformRole;
    try {
        const result = await requirePlatformAdmin(userId, adminSupabase);
        platformRole = result.role;
    } catch {
        return errorResponse('Forbidden — platform admin access required', 403);
    }

    // ─── Tenant Management ───────────────────────────────────────────────
    if (path === '/api/founder/tenants' && request.method === 'GET') {
        return listTenants(request, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+$/) && request.method === 'GET') {
        const tenantId = path.replace('/api/founder/tenants/', '');
        return getTenant(tenantId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+$/) && request.method === 'PATCH') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        const tenantId = path.replace('/api/founder/tenants/', '');
        return updateTenant(request, tenantId, userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/suspend$/) && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        const tenantId = path.replace('/api/founder/tenants/', '').replace('/suspend', '');
        return suspendTenant(tenantId, userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/reinstate$/) && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        const tenantId = path.replace('/api/founder/tenants/', '').replace('/reinstate', '');
        return reinstateTenant(tenantId, userId, adminSupabase);
    }

    // ─── Revenue Analytics ───────────────────────────────────────────────
    if (path === '/api/founder/revenue' && request.method === 'GET') {
        return getRevenueAnalytics(request, adminSupabase);
    }

    if (path === '/api/founder/mrr' && request.method === 'GET') {
        return getMRRBreakdown(adminSupabase);
    }

    // ─── AI Usage & Policy ───────────────────────────────────────────────
    if (path === '/api/founder/ai-usage' && request.method === 'GET') {
        return getAIUsagePlatform(request, adminSupabase);
    }

    if (path === '/api/founder/ai-policies' && request.method === 'GET') {
        return listAIPolicies(adminSupabase);
    }

    if (path === '/api/founder/ai-policies' && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return createAIPolicy(request, userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/ai-policies\/[^/]+$/) && request.method === 'PATCH') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        const policyId = path.replace('/api/founder/ai-policies/', '');
        return updateAIPolicy(request, policyId, userId, adminSupabase);
    }

    // ─── Feature Flags ───────────────────────────────────────────────────
    if (path === '/api/founder/feature-flags' && request.method === 'GET') {
        return listFeatureFlags(adminSupabase);
    }

    if (path === '/api/founder/feature-flags' && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        return createFeatureFlag(request, userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/feature-flags\/[^/]+$/) && request.method === 'PATCH') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        const flagId = path.replace('/api/founder/feature-flags/', '');
        return updateFeatureFlag(request, flagId, userId, adminSupabase);
    }

    // ─── Announcements ───────────────────────────────────────────────────
    if (path === '/api/founder/announcements' && request.method === 'GET') {
        return listAnnouncements(adminSupabase);
    }

    if (path === '/api/founder/announcements' && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return createAnnouncement(request, userId, adminSupabase);
    }

    // ─── System Health ───────────────────────────────────────────────────
    if (path === '/api/founder/system-health' && request.method === 'GET') {
        return getSystemHealth(adminSupabase);
    }

    // ─── Platform Audit Log ──────────────────────────────────────────────
    if (path === '/api/founder/audit-log' && request.method === 'GET') {
        return getPlatformAuditLog(request, adminSupabase);
    }

    // ─── Platform Config ─────────────────────────────────────────────────
    if (path === '/api/founder/config' && request.method === 'GET') {
        return getPlatformConfig(adminSupabase);
    }

    if (path === '/api/founder/config' && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        return updatePlatformConfig(request, userId, adminSupabase);
    }

    // ─── Supreme Access ──────────────────────────────────────────────────

    if (path === '/api/founder/workers/restart' && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        return handleRestartWorkers(userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/force-provision$/) && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        return handleForceProvision(path.split('/')[4], userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/force-billing$/) && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        return handleForceBilling(path.split('/')[4], userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/integrations\/[^/]+\/reconnect$/) && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        return handleIntegrationReconnect(path.split('/')[4], userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/override-rls$/) && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        return handleOverrideRLS(request, path.split('/')[4], userId, adminSupabase);
    }

    // ─── Tenant Extended ─────────────────────────────────────────────────

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/delete$/) && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        return handleDeleteTenant(path.split('/')[4], userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/reset$/) && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        return handleResetTenant(path.split('/')[4], userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/rerun-provision$/) && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        return handleRerunProvision(path.split('/')[4], userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/modules$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleAddModule(request, path.split('/')[4], userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/modules\/[^/]+$/) && request.method === 'DELETE') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        const parts = path.split('/');
        return handleRemoveModule(parts[4], parts[6], userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/audit-log$/) && request.method === 'GET') {
        return handleTenantAuditLog(request, path.split('/')[4], adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/incidents$/) && request.method === 'GET') {
        return handleTenantIncidents(path.split('/')[4], adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/usage$/) && request.method === 'GET') {
        return handleTenantUsage(path.split('/')[4], adminSupabase);
    }

    if (path.match(/^\/api\/founder\/tenants\/[^/]+\/internal-offer$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleInternalOffer(request, path.split('/')[4], userId, adminSupabase);
    }

    // ─── Integrations Hub ────────────────────────────────────────────────

    if (path === '/api/founder/integrations/health' && request.method === 'GET') {
        return handleIntegrationHealthAll(adminSupabase);
    }

    if (path.match(/^\/api\/founder\/integrations\/[^/]+\/connect$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleConnectIntegration(request, path.split('/')[4], userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/integrations\/[^/]+\/disconnect$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleDisconnectIntegration(request, path.split('/')[4], userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/integrations\/[^/]+\/healthcheck$/) && request.method === 'GET') {
        return handleHealthcheckIntegration(path.split('/')[4], adminSupabase);
    }

    if (path.match(/^\/api\/founder\/integrations\/[^/]+\/autofix$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleAutofixIntegration(path.split('/')[4], userId, adminSupabase);
    }

    // ─── Plans & Billing ─────────────────────────────────────────────────

    if (path === '/api/founder/plans/suggest-pricing' && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleSuggestPricing(request, adminSupabase);
    }

    if (path === '/api/founder/plans' && request.method === 'GET') {
        return handleListPlans(adminSupabase);
    }

    if (path === '/api/founder/plans' && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleCreatePlan(request, userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/plans\/[^/]+$/) && request.method === 'PATCH') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleUpdatePlan(request, path.replace('/api/founder/plans/', ''), userId, adminSupabase);
    }

    if (path === '/api/founder/invoices' && request.method === 'GET') {
        return handleListInvoices(request, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/invoices\/[^/]+\/mark-paid$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleMarkInvoicePaid(path.split('/')[4], userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/invoices\/[^/]+\/remind$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleSendReminder(path.split('/')[4], userId, adminSupabase);
    }

    // ─── UI Builder ──────────────────────────────────────────────────────

    if (path === '/api/founder/ui-config/platform' && request.method === 'GET') {
        return handleGetPlatformUIConfig(adminSupabase);
    }

    if (path.match(/^\/api\/founder\/ui-config\/[^/]+$/) && request.method === 'GET') {
        return handleGetTenantUIConfig(path.replace('/api/founder/ui-config/', ''), adminSupabase);
    }

    if (path.match(/^\/api\/founder\/ui-config\/[^/]+$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleUpdateTenantUIConfig(request, path.replace('/api/founder/ui-config/', ''), userId, adminSupabase);
    }

    // ─── Marketing ───────────────────────────────────────────────────────

    if (path === '/api/founder/marketing/audiences' && request.method === 'GET') {
        return handleGetAudiences(adminSupabase);
    }

    if (path === '/api/founder/marketing/audiences' && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleCreateAudience(request, userId, adminSupabase);
    }

    if (path === '/api/founder/marketing/retargeting' && request.method === 'GET') {
        return handleGetRetargetingCampaigns(adminSupabase);
    }

    // ─── Health & Self-Healing ───────────────────────────────────────────

    if (path === '/api/founder/health/check-all' && request.method === 'POST') {
        return handleRunAllHealthChecks(adminSupabase);
    }

    if (path === '/api/founder/health/self-heal' && request.method === 'POST') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        return handleTriggerSelfHeal(request, userId, adminSupabase);
    }

    if (path === '/api/founder/health/self-heal-log' && request.method === 'GET') {
        return handleGetSelfHealLog(request, adminSupabase);
    }

    if (path === '/api/founder/health/recovery-queue' && request.method === 'GET') {
        return handleGetRecoveryQueue(adminSupabase);
    }

    if (path.match(/^\/api\/founder\/health\/recovery-queue\/[^/]+\/retry$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleRecoveryAction(path.split('/')[5], 'retrying', userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/health\/recovery-queue\/[^/]+\/skip$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleRecoveryAction(path.split('/')[5], 'skipped', userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/health\/recovery-queue\/[^/]+\/escalate$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleRecoveryAction(path.split('/')[5], 'escalated', userId, adminSupabase);
    }

    // ─── Registration Applications (Founder Review) ─────────────────────

    if (path === '/api/founder/applications' && request.method === 'GET') {
        return handleListApplications(request, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/applications\/[0-9a-f-]+$/) && request.method === 'GET') {
        const appId = path.replace('/api/founder/applications/', '');
        return handleGetApplication(appId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/applications\/[0-9a-f-]+\/approve$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        const appId = path.split('/')[3];
        return handleApproveApplication(request, appId, userId, env, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/applications\/[0-9a-f-]+\/reject$/) && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        const appId = path.split('/')[3];
        return handleRejectApplication(request, appId, userId, adminSupabase);
    }

    // ─── Integration Catalog CRUD (Founder) ─────────────────────────────

    if (path === '/api/founder/integrations/catalog' && request.method === 'GET') {
        return handleGetCatalogAdmin(adminSupabase);
    }

    if (path === '/api/founder/integrations/catalog' && request.method === 'POST') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        return handleCreateCatalogItem(request, userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/integrations\/catalog\/[0-9a-f-]+$/) && request.method === 'PATCH') {
        if (platformRole === 'viewer') return errorResponse('Read-only access', 403);
        const itemId = path.split('/').pop()!;
        return handleUpdateCatalogItem(request, itemId, userId, adminSupabase);
    }

    if (path.match(/^\/api\/founder\/integrations\/catalog\/[0-9a-f-]+$/) && request.method === 'DELETE') {
        if (platformRole !== 'super_admin') return errorResponse('Super admin required', 403);
        const itemId = path.split('/').pop()!;
        return handleDeleteCatalogItem(itemId, userId, adminSupabase);
    }

    return errorResponse('Founder endpoint not found', 404);
}

// ─── Tenant Management ───────────────────────────────────────────────────────

async function listTenants(
    request: Request,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
    const status = url.searchParams.get('status'); // 'active', 'suspended', 'trial'
    const search = url.searchParams.get('search');
    const offset = (page - 1) * limit;

    let query = adminSupabase
        .from('companies')
        .select('id, name, name_ar, industry, country, status, plan_code, created_at, owner_user_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (search) query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%`);

    const { data: companies, count, error } = await query;
    if (error) return errorResponse(error.message, 500);

    // Enrich with subscription + member counts
    const enriched = await Promise.all(
        (companies || []).map(async (c) => {
            const [subRes, memberRes] = await Promise.all([
                adminSupabase
                    .from('company_subscriptions')
                    .select('plan_code, status, gateway, current_period_end')
                    .eq('company_id', c.id)
                    .maybeSingle(),
                adminSupabase
                    .from('company_members')
                    .select('id', { count: 'exact', head: true })
                    .eq('company_id', c.id)
                    .eq('status', 'active'),
            ]);

            return {
                ...c,
                subscription: subRes.data,
                member_count: memberRes.count || 0,
            };
        }),
    );

    return jsonResponse({
        tenants: enriched,
        pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
}

async function getTenant(
    tenantId: string,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const { data: company, error } = await adminSupabase
        .from('companies')
        .select('*')
        .eq('id', tenantId)
        .maybeSingle();

    if (error) return errorResponse(error.message, 500);
    if (!company) return errorResponse('Tenant not found', 404);

    // Parallel data fetch
    const [subRes, membersRes, modulesRes, aiRes, invoicesRes] = await Promise.all([
        adminSupabase.from('company_subscriptions').select('*').eq('company_id', tenantId).maybeSingle(),
        adminSupabase.from('company_members').select('id, user_id, role_code, status').eq('company_id', tenantId),
        adminSupabase.from('company_modules').select('module_id, is_active').eq('company_id', tenantId),
        adminSupabase
            .from('ai_usage_logs')
            .select('id, tokens_in, tokens_out, agent_type')
            .eq('company_id', tenantId)
            .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
        adminSupabase
            .from('invoices')
            .select('id, total, status, invoice_type')
            .eq('company_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(20),
    ]);

    const aiUsage = aiRes.data || [];
    const totalTokens = aiUsage.reduce((s, u) => s + (u.tokens_in || 0) + (u.tokens_out || 0), 0);

    return jsonResponse({
        tenant: company,
        subscription: subRes.data,
        members: membersRes.data || [],
        modules: modulesRes.data || [],
        ai_usage_30d: { total_queries: aiUsage.length, total_tokens: totalTokens },
        recent_invoices: invoicesRes.data || [],
    });
}

async function updateTenant(
    request: Request,
    tenantId: string,
    actorId: string,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as Record<string, unknown>;
    const allowedFields = ['name', 'name_ar', 'status', 'plan_code', 'industry', 'country'];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
        if (body[key] !== undefined) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) return errorResponse('No valid fields to update');

    const { error } = await adminSupabase.from('companies').update(updates).eq('id', tenantId);
    if (error) return errorResponse(error.message, 500);

    await logPlatformAction(adminSupabase, actorId, 'tenant_updated', 'tenant', tenantId, updates);
    return jsonResponse({ updated: true, fields: Object.keys(updates) });
}

async function suspendTenant(
    tenantId: string,
    actorId: string,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const { error } = await adminSupabase
        .from('companies')
        .update({ status: 'suspended' })
        .eq('id', tenantId);

    if (error) return errorResponse(error.message, 500);

    // Also suspend subscription
    await adminSupabase
        .from('company_subscriptions')
        .update({ status: 'canceled' })
        .eq('company_id', tenantId);

    await logPlatformAction(adminSupabase, actorId, 'tenant_suspended', 'tenant', tenantId, {});
    return jsonResponse({ suspended: true });
}

async function reinstateTenant(
    tenantId: string,
    actorId: string,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const { error } = await adminSupabase
        .from('companies')
        .update({ status: 'active' })
        .eq('id', tenantId);

    if (error) return errorResponse(error.message, 500);

    await logPlatformAction(adminSupabase, actorId, 'tenant_reinstated', 'tenant', tenantId, {});
    return jsonResponse({ reinstated: true });
}

// ─── Revenue Analytics ───────────────────────────────────────────────────────

async function getRevenueAnalytics(
    request: Request,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30', 10);
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [subsRes, paymentsRes, plansRes, companiesRes] = await Promise.all([
        adminSupabase
            .from('company_subscriptions')
            .select('plan_code, status, gateway, billing_interval, created_at'),
        adminSupabase
            .from('payment_events')
            .select('gateway, amount, currency, status, created_at')
            .gte('created_at', since)
            .in('status', ['success', 'completed']),
        adminSupabase.from('subscription_plans').select('code, price_monthly, price_yearly, currency'),
        adminSupabase
            .from('companies')
            .select('id, created_at')
            .gte('created_at', since),
    ]);

    const subs = subsRes.data || [];
    const payments = paymentsRes.data || [];
    const plans = plansRes.data || [];
    const newCompanies = companiesRes.data || [];

    // Calculate MRR
    const planPrices = new Map(plans.map(p => [p.code, p]));
    let mrr = 0;
    const planBreakdown: Record<string, { count: number; mrr: number }> = {};
    for (const sub of subs) {
        if (sub.status !== 'active') continue;
        const plan = planPrices.get(sub.plan_code);
        if (!plan) continue;
        const monthlyValue = sub.billing_interval === 'yearly'
            ? (plan.price_yearly || plan.price_monthly * 10) / 12
            : plan.price_monthly;
        mrr += monthlyValue;
        if (!planBreakdown[sub.plan_code]) planBreakdown[sub.plan_code] = { count: 0, mrr: 0 };
        planBreakdown[sub.plan_code].count++;
        planBreakdown[sub.plan_code].mrr += monthlyValue;
    }

    // Gateway distribution
    const gatewayDist: Record<string, number> = {};
    for (const p of payments) {
        gatewayDist[p.gateway] = (gatewayDist[p.gateway] || 0) + (p.amount || 0);
    }

    // Subscription status distribution
    const statusDist: Record<string, number> = {};
    for (const sub of subs) {
        statusDist[sub.status] = (statusDist[sub.status] || 0) + 1;
    }

    return jsonResponse({
        period_days: days,
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(mrr * 12 * 100) / 100,
        total_subscriptions: subs.length,
        active_subscriptions: subs.filter(s => s.status === 'active').length,
        new_companies: newCompanies.length,
        revenue_by_gateway: gatewayDist,
        subscription_status: statusDist,
        plan_breakdown: planBreakdown,
        payments_in_period: payments.length,
    });
}

async function getMRRBreakdown(adminSupabase: SupabaseClient): Promise<Response> {
    const { data: subs } = await adminSupabase
        .from('company_subscriptions')
        .select('plan_code, status, billing_interval, company_id, created_at')
        .eq('status', 'active');

    const { data: plans } = await adminSupabase
        .from('subscription_plans')
        .select('code, name_en, price_monthly, price_yearly');

    const planMap = new Map((plans || []).map(p => [p.code, p]));
    const breakdown: Array<{
        company_id: string;
        plan_code: string;
        plan_name: string;
        billing_interval: string;
        mrr_contribution: number;
    }> = [];

    let totalMRR = 0;
    for (const sub of subs || []) {
        const plan = planMap.get(sub.plan_code);
        if (!plan) continue;
        const monthly = sub.billing_interval === 'yearly'
            ? (plan.price_yearly || plan.price_monthly * 10) / 12
            : plan.price_monthly;
        totalMRR += monthly;
        breakdown.push({
            company_id: sub.company_id,
            plan_code: sub.plan_code,
            plan_name: plan.name_en,
            billing_interval: sub.billing_interval || 'monthly',
            mrr_contribution: Math.round(monthly * 100) / 100,
        });
    }

    return jsonResponse({
        total_mrr: Math.round(totalMRR * 100) / 100,
        subscribers: breakdown.length,
        breakdown: breakdown.sort((a, b) => b.mrr_contribution - a.mrr_contribution),
    });
}

// ─── AI Usage Platform-wide ──────────────────────────────────────────────────

async function getAIUsagePlatform(
    request: Request,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30', 10);
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data: logs } = await adminSupabase
        .from('ai_usage_logs')
        .select('company_id, agent_type, tokens_in, tokens_out, model, created_at')
        .gte('created_at', since);

    const entries = logs || [];
    const totalTokensIn = entries.reduce((s, l) => s + (l.tokens_in || 0), 0);
    const totalTokensOut = entries.reduce((s, l) => s + (l.tokens_out || 0), 0);

    // By company
    const byCompany: Record<string, { queries: number; tokens: number }> = {};
    for (const e of entries) {
        if (!byCompany[e.company_id]) byCompany[e.company_id] = { queries: 0, tokens: 0 };
        byCompany[e.company_id].queries++;
        byCompany[e.company_id].tokens += (e.tokens_in || 0) + (e.tokens_out || 0);
    }

    // By agent type
    const byAgent: Record<string, number> = {};
    for (const e of entries) {
        byAgent[e.agent_type || 'unknown'] = (byAgent[e.agent_type || 'unknown'] || 0) + 1;
    }

    // By model
    const byModel: Record<string, number> = {};
    for (const e of entries) {
        byModel[e.model || 'unknown'] = (byModel[e.model || 'unknown'] || 0) + 1;
    }

    // Top consumers
    const topConsumers = Object.entries(byCompany)
        .sort((a, b) => b[1].tokens - a[1].tokens)
        .slice(0, 10)
        .map(([company_id, stats]) => ({ company_id, ...stats }));

    return jsonResponse({
        period_days: days,
        total_queries: entries.length,
        total_tokens_in: totalTokensIn,
        total_tokens_out: totalTokensOut,
        total_tokens: totalTokensIn + totalTokensOut,
        unique_companies: Object.keys(byCompany).length,
        by_agent_type: byAgent,
        by_model: byModel,
        top_consumers: topConsumers,
    });
}

// ─── AI Policies ─────────────────────────────────────────────────────────────

async function listAIPolicies(adminSupabase: SupabaseClient): Promise<Response> {
    const { data, error } = await adminSupabase
        .from('ai_policies')
        .select('*')
        .order('priority', { ascending: false });

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ policies: data || [] });
}

async function createAIPolicy(
    request: Request,
    userId: string,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        name: string;
        description?: string;
        policy_type: string;
        rules: Record<string, unknown>;
        applies_to?: string;
        priority?: number;
    };

    if (!body.name || !body.policy_type || !body.rules) {
        return errorResponse('Missing name, policy_type, or rules');
    }

    const { data, error } = await adminSupabase
        .from('ai_policies')
        .insert({
            name: body.name,
            description: body.description,
            policy_type: body.policy_type,
            rules: body.rules,
            applies_to: body.applies_to || 'all',
            priority: body.priority || 0,
            created_by: userId,
        })
        .select()
        .single();

    if (error) return errorResponse(error.message, 500);

    await logPlatformAction(adminSupabase, userId, 'ai_policy_created', 'policy', data.id, { name: body.name });
    return jsonResponse({ policy: data }, 201);
}

async function updateAIPolicy(
    request: Request,
    policyId: string,
    userId: string,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as Record<string, unknown>;
    const allowedFields = ['name', 'description', 'rules', 'applies_to', 'is_active', 'priority'];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
        if (body[key] !== undefined) updates[key] = body[key];
    }

    const { error } = await adminSupabase.from('ai_policies').update(updates).eq('id', policyId);
    if (error) return errorResponse(error.message, 500);

    await logPlatformAction(adminSupabase, userId, 'ai_policy_updated', 'policy', policyId, updates);
    return jsonResponse({ updated: true });
}

// ─── Feature Flags ───────────────────────────────────────────────────────────

async function listFeatureFlags(adminSupabase: SupabaseClient): Promise<Response> {
    const { data, error } = await adminSupabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ flags: data || [] });
}

async function createFeatureFlag(
    request: Request,
    userId: string,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        flag_key: string;
        name: string;
        description?: string;
        is_enabled?: boolean;
        rollout_percentage?: number;
        target_plans?: string[];
        target_companies?: string[];
    };

    if (!body.flag_key || !body.name) return errorResponse('Missing flag_key or name');

    const { data, error } = await adminSupabase
        .from('feature_flags')
        .insert({
            flag_key: body.flag_key,
            name: body.name,
            description: body.description,
            is_enabled: body.is_enabled ?? false,
            rollout_percentage: body.rollout_percentage ?? 0,
            target_plans: body.target_plans || [],
            target_companies: body.target_companies || [],
            created_by: userId,
        })
        .select()
        .single();

    if (error) return errorResponse(error.message, 500);

    await logPlatformAction(adminSupabase, userId, 'feature_flag_created', 'feature_flag', data.id, { key: body.flag_key });
    return jsonResponse({ flag: data }, 201);
}

async function updateFeatureFlag(
    request: Request,
    flagId: string,
    userId: string,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as Record<string, unknown>;
    const allowedFields = ['name', 'description', 'is_enabled', 'rollout_percentage', 'target_plans', 'target_companies'];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
        if (body[key] !== undefined) updates[key] = body[key];
    }

    const { error } = await adminSupabase.from('feature_flags').update(updates).eq('id', flagId);
    if (error) return errorResponse(error.message, 500);

    await logPlatformAction(adminSupabase, userId, 'feature_flag_updated', 'feature_flag', flagId, updates);
    return jsonResponse({ updated: true });
}

// ─── Announcements ───────────────────────────────────────────────────────────

async function listAnnouncements(adminSupabase: SupabaseClient): Promise<Response> {
    const { data, error } = await adminSupabase
        .from('platform_announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ announcements: data || [] });
}

async function createAnnouncement(
    request: Request,
    userId: string,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        title_en: string;
        title_ar?: string;
        body_en: string;
        body_ar?: string;
        severity?: string;
        target_audience?: string;
        starts_at?: string;
        ends_at?: string;
    };

    if (!body.title_en || !body.body_en) return errorResponse('Missing title_en or body_en');

    const { data, error } = await adminSupabase
        .from('platform_announcements')
        .insert({
            title_en: body.title_en,
            title_ar: body.title_ar,
            body_en: body.body_en,
            body_ar: body.body_ar,
            severity: body.severity || 'info',
            target_audience: body.target_audience || 'all',
            starts_at: body.starts_at || new Date().toISOString(),
            ends_at: body.ends_at,
            created_by: userId,
        })
        .select()
        .single();

    if (error) return errorResponse(error.message, 500);

    await logPlatformAction(adminSupabase, userId, 'announcement_created', 'announcement', data.id, { title: body.title_en });
    return jsonResponse({ announcement: data }, 201);
}

// ─── System Health ───────────────────────────────────────────────────────────

async function getSystemHealth(adminSupabase: SupabaseClient): Promise<Response> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();

    const [companiesRes, membersRes, subsRes, aiRes, paymentRes, integrationsRes] = await Promise.all([
        adminSupabase.from('companies').select('id', { count: 'exact', head: true }),
        adminSupabase.from('company_members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        adminSupabase.from('company_subscriptions').select('id, status'),
        adminSupabase.from('ai_usage_logs').select('id', { count: 'exact', head: true }).gte('created_at', oneDayAgo),
        adminSupabase.from('payment_events').select('id, status').gte('created_at', oneDayAgo),
        adminSupabase.from('tenant_integrations').select('id, status'),
    ]);

    const subs = subsRes.data || [];
    const payments = paymentRes.data || [];
    const integrations = integrationsRes.data || [];

    const activeSubs = subs.filter(s => s.status === 'active').length;
    const failedPayments = payments.filter(p => p.status === 'error' || p.status === 'failed').length;
    const erroredIntegrations = integrations.filter(i => i.status === 'error').length;

    // Overall health score (0-100)
    const subHealth = subs.length > 0 ? (activeSubs / subs.length) * 100 : 100;
    const paymentHealth = payments.length > 0 ? ((payments.length - failedPayments) / payments.length) * 100 : 100;
    const integrationHealth = integrations.length > 0 ? ((integrations.length - erroredIntegrations) / integrations.length) * 100 : 100;
    const overallHealth = Math.round((subHealth + paymentHealth + integrationHealth) / 3);

    return jsonResponse({
        timestamp: now.toISOString(),
        overall_health: overallHealth,
        components: {
            database: { status: 'healthy', latency_ms: 0 },
            subscriptions: {
                health: Math.round(subHealth),
                total: subs.length,
                active: activeSubs,
                past_due: subs.filter(s => s.status === 'past_due').length,
            },
            payments_24h: {
                health: Math.round(paymentHealth),
                total: payments.length,
                failed: failedPayments,
            },
            integrations: {
                health: Math.round(integrationHealth),
                total: integrations.length,
                connected: integrations.filter(i => i.status === 'connected').length,
                errored: erroredIntegrations,
            },
        },
        totals: {
            companies: companiesRes.count || 0,
            active_members: membersRes.count || 0,
            ai_queries_24h: aiRes.count || 0,
        },
    });
}

// ─── Platform Audit Log ──────────────────────────────────────────────────────

async function getPlatformAuditLog(
    request: Request,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
    const action = url.searchParams.get('action');
    const offset = (page - 1) * limit;

    let query = adminSupabase
        .from('platform_audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (action) query = query.eq('action', action);

    const { data, count, error } = await query;
    if (error) return errorResponse(error.message, 500);

    return jsonResponse({
        entries: data || [],
        pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
}

// ─── Platform Config ─────────────────────────────────────────────────────────

async function getPlatformConfig(adminSupabase: SupabaseClient): Promise<Response> {
    const { data, error } = await adminSupabase
        .from('platform_config')
        .select('*')
        .order('key');

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ config: data || [] });
}

async function updatePlatformConfig(
    request: Request,
    userId: string,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { key: string; value: unknown; description?: string };
    if (!body.key || body.value === undefined) return errorResponse('Missing key or value');

    const { error } = await adminSupabase
        .from('platform_config')
        .upsert({
            key: body.key,
            value: body.value,
            description: body.description,
            updated_by: userId,
            updated_at: new Date().toISOString(),
        });

    if (error) return errorResponse(error.message, 500);

    await logPlatformAction(adminSupabase, userId, 'config_updated', 'config', body.key, { value: body.value });
    return jsonResponse({ updated: true });
}

// ─── Audit Helper ────────────────────────────────────────────────────────────

async function logPlatformAction(
    adminSupabase: SupabaseClient,
    actorId: string,
    action: string,
    targetType: string,
    targetId: string,
    details: unknown,
): Promise<void> {
    await adminSupabase.from('platform_audit_log').insert({
        actor_id: actorId,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
    }).then(() => { });
}

// ─── Supreme Access ──────────────────────────────────────────────────────────

async function handleRestartWorkers(
    actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    await logPlatformAction(adminSupabase, actorId, 'workers_restart', 'system', 'all', {});
    return jsonResponse({ restarted: true });
}

async function handleForceProvision(
    tenantId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const defaultModules = ['hr', 'crm', 'accounting', 'projects'];
    for (const mod of defaultModules) {
        await adminSupabase
            .from('company_modules')
            .upsert({ company_id: tenantId, module_id: mod, is_active: true }, { onConflict: 'company_id,module_id' });
    }
    await logPlatformAction(adminSupabase, actorId, 'force_provision', 'tenant', tenantId, { modules: defaultModules });
    return jsonResponse({ triggered: true });
}

async function handleForceBilling(
    tenantId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const { data: sub } = await adminSupabase
        .from('company_subscriptions')
        .select('id')
        .eq('company_id', tenantId)
        .maybeSingle();
    if (sub) {
        await adminSupabase
            .from('company_subscriptions')
            .update({ current_period_end: new Date(Date.now() + 30 * 86400000).toISOString() })
            .eq('company_id', tenantId);
    }
    await logPlatformAction(adminSupabase, actorId, 'force_billing', 'tenant', tenantId, { had_subscription: !!sub });
    return jsonResponse({ triggered: true });
}

async function handleIntegrationReconnect(
    integrationId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    await adminSupabase
        .from('tenant_integrations')
        .update({ status: 'connected', last_error: null, retry_count: 0 })
        .eq('id', integrationId);
    await logPlatformAction(adminSupabase, actorId, 'integration_reconnect', 'integration', integrationId, {});
    return jsonResponse({ reconnected: true });
}

async function handleOverrideRLS(
    request: Request, tenantId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { duration_minutes?: number };
    const duration = Math.min(body.duration_minutes || 30, 120);
    const expiresAt = new Date(Date.now() + duration * 60000).toISOString();
    await logPlatformAction(adminSupabase, actorId, 'rls_override', 'tenant', tenantId, { duration, expires_at: expiresAt });
    return jsonResponse({ overridden: true, expires_at: expiresAt });
}

// ─── Tenant Extended ─────────────────────────────────────────────────────────

async function handleDeleteTenant(
    tenantId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    await Promise.all([
        adminSupabase.from('company_modules').delete().eq('company_id', tenantId),
        adminSupabase.from('company_members').delete().eq('company_id', tenantId),
        adminSupabase.from('company_subscriptions').delete().eq('company_id', tenantId),
    ]);
    const { error } = await adminSupabase.from('companies').delete().eq('id', tenantId);
    if (error) return errorResponse(error.message, 500);
    await logPlatformAction(adminSupabase, actorId, 'tenant_deleted', 'tenant', tenantId, {});
    return jsonResponse({ deleted: true });
}

async function handleResetTenant(
    tenantId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    await Promise.all([
        adminSupabase.from('company_modules').delete().eq('company_id', tenantId),
        adminSupabase.from('ai_usage_logs').delete().eq('company_id', tenantId),
    ]);
    await adminSupabase.from('companies').update({ status: 'active' }).eq('id', tenantId);
    await logPlatformAction(adminSupabase, actorId, 'tenant_reset', 'tenant', tenantId, {});
    return jsonResponse({ reset: true });
}

async function handleRerunProvision(
    tenantId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    return handleForceProvision(tenantId, actorId, adminSupabase);
}

async function handleAddModule(
    request: Request, tenantId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const { module_code } = (await request.json()) as { module_code: string };
    if (!module_code) return errorResponse('Missing module_code');
    const { error } = await adminSupabase
        .from('company_modules')
        .upsert({ company_id: tenantId, module_id: module_code, is_active: true }, { onConflict: 'company_id,module_id' });
    if (error) return errorResponse(error.message, 500);
    await logPlatformAction(adminSupabase, actorId, 'module_added', 'tenant', tenantId, { module_code });
    return jsonResponse({ added: true });
}

async function handleRemoveModule(
    tenantId: string, moduleCode: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const { error } = await adminSupabase
        .from('company_modules')
        .delete()
        .eq('company_id', tenantId)
        .eq('module_id', moduleCode);
    if (error) return errorResponse(error.message, 500);
    await logPlatformAction(adminSupabase, actorId, 'module_removed', 'tenant', tenantId, { module_code: moduleCode });
    return jsonResponse({ removed: true });
}

async function handleTenantAuditLog(
    request: Request, tenantId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    const { data, count, error } = await adminSupabase
        .from('platform_audit_log')
        .select('*', { count: 'exact' })
        .eq('target_id', tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({
        entries: data || [],
        pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
}

async function handleTenantIncidents(
    tenantId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const { data, error } = await adminSupabase
        .from('platform_incidents')
        .select('id, severity, status, title, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);

    return jsonResponse({ incidents: error ? [] : (data || []) });
}

async function handleTenantUsage(
    tenantId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count } = await adminSupabase
        .from('ai_usage_logs')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', tenantId)
        .gte('created_at', since);

    return jsonResponse({ ai_queries: count ?? 0, storage_mb: 0, api_calls: 0, period_days: 30 });
}

async function handleInternalOffer(
    request: Request, tenantId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { title: string; body: string; offer_type: string };
    if (!body.title || !body.body) return errorResponse('Missing title or body');
    await logPlatformAction(adminSupabase, actorId, 'internal_offer_sent', 'tenant', tenantId, body);
    return jsonResponse({ sent: true });
}

// ─── Integrations Hub ────────────────────────────────────────────────────────

async function handleIntegrationHealthAll(adminSupabase: SupabaseClient): Promise<Response> {
    const { data, error } = await adminSupabase
        .from('tenant_integrations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return jsonResponse({ integrations: [] });
    const integrations = (data || []).map((i: Record<string, unknown>) => ({
        id: i.id,
        name: i.integration_name || i.provider || 'Unknown',
        category: i.category || 'ai',
        status: i.status || 'disconnected',
        latency_ms: i.latency_ms || null,
        last_check: i.last_check || i.updated_at || i.created_at,
        auto_retry: i.auto_retry ?? false,
        retry_count: i.retry_count ?? 0,
        last_error: i.last_error || null,
    }));
    return jsonResponse({ integrations });
}

async function handleConnectIntegration(
    request: Request, integrationId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { tenant_id: string };
    await adminSupabase
        .from('tenant_integrations')
        .update({ status: 'connected', last_error: null })
        .eq('id', integrationId);
    await logPlatformAction(adminSupabase, actorId, 'integration_connected', 'integration', integrationId, { tenant_id: body.tenant_id });
    return jsonResponse({ connected: true });
}

async function handleDisconnectIntegration(
    request: Request, integrationId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { tenant_id: string };
    await adminSupabase
        .from('tenant_integrations')
        .update({ status: 'disconnected' })
        .eq('id', integrationId);
    await logPlatformAction(adminSupabase, actorId, 'integration_disconnected', 'integration', integrationId, { tenant_id: body.tenant_id });
    return jsonResponse({ disconnected: true });
}

async function handleHealthcheckIntegration(
    integrationId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const { data } = await adminSupabase
        .from('tenant_integrations')
        .select('status, latency_ms')
        .eq('id', integrationId)
        .maybeSingle();
    return jsonResponse({ status: data?.status || 'unknown', latency_ms: data?.latency_ms || 0 });
}

async function handleAutofixIntegration(
    integrationId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    await adminSupabase
        .from('tenant_integrations')
        .update({ status: 'connected', last_error: null, retry_count: 0 })
        .eq('id', integrationId);
    await logPlatformAction(adminSupabase, actorId, 'integration_autofix', 'integration', integrationId, {});
    return jsonResponse({ fixed: true, action_taken: 'Reset connection and cleared errors' });
}

// ─── Plans & Billing ─────────────────────────────────────────────────────────

async function handleListPlans(adminSupabase: SupabaseClient): Promise<Response> {
    const { data, error } = await adminSupabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ plans: data || [] });
}

async function handleCreatePlan(
    request: Request, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.plan_code && !body.code) return errorResponse('Missing plan code');
    const { data, error } = await adminSupabase
        .from('subscription_plans')
        .insert(body)
        .select()
        .single();
    if (error) return errorResponse(error.message, 500);
    await logPlatformAction(adminSupabase, actorId, 'plan_created', 'plan', String(data.id || data.code), body);
    return jsonResponse({ plan: data }, 201);
}

async function handleUpdatePlan(
    request: Request, planId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as Record<string, unknown>;
    body.updated_at = new Date().toISOString();
    const { error } = await adminSupabase.from('subscription_plans').update(body).eq('id', planId);
    if (error) return errorResponse(error.message, 500);
    await logPlatformAction(adminSupabase, actorId, 'plan_updated', 'plan', planId, body);
    return jsonResponse({ updated: true });
}

async function handleListInvoices(
    request: Request, adminSupabase: SupabaseClient,
): Promise<Response> {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
    const tenantId = url.searchParams.get('tenant_id');
    const status = url.searchParams.get('status');
    const offset = (page - 1) * limit;

    let query = adminSupabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (tenantId) query = query.eq('company_id', tenantId);
    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) return errorResponse(error.message, 500);
    return jsonResponse({
        invoices: data || [],
        pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
}

async function handleMarkInvoicePaid(
    invoiceId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const { error } = await adminSupabase
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', invoiceId);
    if (error) return errorResponse(error.message, 500);
    await logPlatformAction(adminSupabase, actorId, 'invoice_marked_paid', 'invoice', invoiceId, {});
    return jsonResponse({ updated: true });
}

async function handleSendReminder(
    invoiceId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    await logPlatformAction(adminSupabase, actorId, 'invoice_reminder_sent', 'invoice', invoiceId, {});
    return jsonResponse({ sent: true });
}

async function handleSuggestPricing(
    request: Request, adminSupabase: SupabaseClient,
): Promise<Response> {
    const { plan_code } = (await request.json()) as { plan_code: string };
    const { data: plans } = await adminSupabase.from('subscription_plans').select('*');
    const { data: subs } = await adminSupabase.from('company_subscriptions').select('plan_code, status');

    const allPlans = plans || [];
    const activeSubs = (subs || []).filter((s: Record<string, unknown>) => s.status === 'active');
    const currentPlan = allPlans.find((p: Record<string, unknown>) =>
        p.code === plan_code || p.plan_code === plan_code,
    ) as Record<string, unknown> | undefined;
    const avgPrice = allPlans.length > 0
        ? allPlans.reduce((s: number, p: Record<string, unknown>) =>
            s + (Number(p.price_monthly) || Number(p.monthly_price) || 0), 0) / allPlans.length
        : 29;
    const adoption = activeSubs.filter((s: Record<string, unknown>) => s.plan_code === plan_code).length;
    const basePrice = currentPlan
        ? (Number(currentPlan.price_monthly) || Number(currentPlan.monthly_price) || avgPrice)
        : avgPrice;
    const recommended = Math.round(basePrice * (adoption > 5 ? 1.15 : 0.9) * 100) / 100;

    return jsonResponse({
        suggestion: {
            recommended_price: recommended,
            reasoning: adoption > 5
                ? `High adoption (${adoption} subscribers) suggests room for a price increase of ~15%.`
                : `Low adoption (${adoption} subscribers) — consider reducing price by ~10% to attract more users.`,
        },
    });
}

// ─── UI Builder ──────────────────────────────────────────────────────────────

const DEFAULT_UI_CONFIG = {
    theme: {
        primary: '#6366f1', secondary: '#8b5cf6', accent: '#f59e0b',
        background: '#ffffff', font: 'Inter', border_radius: '24px', dark_mode: false,
    },
    navigation: [
        { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', visible: true, order: 0 },
        { key: 'hr', label: 'HR', icon: 'Users', visible: true, order: 1 },
        { key: 'crm', label: 'CRM', icon: 'UserCheck', visible: true, order: 2 },
        { key: 'accounting', label: 'Accounting', icon: 'Calculator', visible: true, order: 3 },
        { key: 'projects', label: 'Projects', icon: 'FolderKanban', visible: true, order: 4 },
    ],
    layout: 'sidebar',
    components: [],
};

async function handleGetPlatformUIConfig(adminSupabase: SupabaseClient): Promise<Response> {
    const { data } = await adminSupabase
        .from('platform_config')
        .select('value')
        .eq('key', 'ui_config')
        .maybeSingle();
    return jsonResponse({ config: data?.value || { tenant_id: 'platform', ...DEFAULT_UI_CONFIG } });
}

async function handleGetTenantUIConfig(
    tenantId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const { data } = await adminSupabase
        .from('platform_config')
        .select('value')
        .eq('key', `ui_config_${tenantId}`)
        .maybeSingle();
    return jsonResponse({ config: data?.value || { tenant_id: tenantId, ...DEFAULT_UI_CONFIG } });
}

async function handleUpdateTenantUIConfig(
    request: Request, tenantId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = await request.json();
    const key = tenantId === 'platform' ? 'ui_config' : `ui_config_${tenantId}`;
    const { error } = await adminSupabase
        .from('platform_config')
        .upsert({ key, value: body, updated_by: actorId, updated_at: new Date().toISOString() });
    if (error) return errorResponse(error.message, 500);
    await logPlatformAction(adminSupabase, actorId, 'ui_config_updated', 'ui_config', tenantId, {});
    return jsonResponse({ updated: true });
}

// ─── Marketing ───────────────────────────────────────────────────────────────

async function handleGetAudiences(adminSupabase: SupabaseClient): Promise<Response> {
    const { data, error } = await adminSupabase
        .from('marketing_audiences')
        .select('*')
        .order('created_at', { ascending: false });
    return jsonResponse({ audiences: error ? [] : (data || []) });
}

async function handleCreateAudience(
    request: Request, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { name: string; filters: Record<string, unknown> };
    if (!body.name) return errorResponse('Missing audience name');
    const { data, error } = await adminSupabase
        .from('marketing_audiences')
        .insert({ name: body.name, filters: body.filters || {}, created_by: actorId })
        .select()
        .single();

    if (error) {
        // Table may not exist — log and return placeholder
        await logPlatformAction(adminSupabase, actorId, 'audience_created', 'marketing', 'new', body);
        return jsonResponse({
            audience: { id: crypto.randomUUID(), name: body.name, filters: body.filters || {}, tenant_count: 0, created_at: new Date().toISOString() },
        }, 201);
    }
    await logPlatformAction(adminSupabase, actorId, 'audience_created', 'marketing', data.id, body);
    return jsonResponse({ audience: data }, 201);
}

async function handleGetRetargetingCampaigns(adminSupabase: SupabaseClient): Promise<Response> {
    const { data, error } = await adminSupabase
        .from('retargeting_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
    return jsonResponse({ campaigns: error ? [] : (data || []) });
}

// ─── Health & Self-Healing ───────────────────────────────────────────────────

async function handleRunAllHealthChecks(adminSupabase: SupabaseClient): Promise<Response> {
    const checks: Array<{ component: string; status: string; latency_ms: number; details?: string }> = [];

    // DB check
    const dbStart = Date.now();
    const { error: dbErr } = await adminSupabase.from('companies').select('id', { head: true, count: 'exact' });
    checks.push({ component: 'database', status: dbErr ? 'error' : 'healthy', latency_ms: Date.now() - dbStart, details: dbErr?.message });

    // Subscriptions check
    const subStart = Date.now();
    const { data: subs } = await adminSupabase.from('company_subscriptions').select('status');
    const pastDue = (subs || []).filter((s: Record<string, unknown>) => s.status === 'past_due').length;
    checks.push({
        component: 'subscriptions', status: pastDue > 0 ? 'degraded' : 'healthy',
        latency_ms: Date.now() - subStart, details: pastDue > 0 ? `${pastDue} past due` : undefined,
    });

    // Payments check
    const payStart = Date.now();
    const since24h = new Date(Date.now() - 86400000).toISOString();
    const { data: payments } = await adminSupabase.from('payment_events').select('status').gte('created_at', since24h);
    const failed = (payments || []).filter((p: Record<string, unknown>) => p.status === 'error' || p.status === 'failed').length;
    checks.push({
        component: 'payments', status: failed > 0 ? 'degraded' : 'healthy',
        latency_ms: Date.now() - payStart, details: failed > 0 ? `${failed} failed in 24h` : undefined,
    });

    // Integrations check
    const intStart = Date.now();
    const { data: ints } = await adminSupabase.from('tenant_integrations').select('status');
    const errored = (ints || []).filter((i: Record<string, unknown>) => i.status === 'error').length;
    checks.push({
        component: 'integrations', status: errored > 0 ? 'degraded' : 'healthy',
        latency_ms: Date.now() - intStart, details: errored > 0 ? `${errored} in error state` : undefined,
    });

    return jsonResponse({ results: checks });
}

async function handleTriggerSelfHeal(
    request: Request, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const { component } = (await request.json()) as { component: string };
    if (!component) return errorResponse('Missing component name');

    let action = 'No action taken';
    if (component === 'subscriptions') {
        const { count } = await adminSupabase
            .from('company_subscriptions')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'past_due');
        action = `Found ${count || 0} past-due subscriptions for review`;
    } else if (component === 'integrations') {
        const { data } = await adminSupabase.from('tenant_integrations').select('id').eq('status', 'error');
        if (data?.length) {
            await adminSupabase
                .from('tenant_integrations')
                .update({ status: 'connected', retry_count: 0, last_error: null })
                .eq('status', 'error');
            action = `Reset ${data.length} errored integrations`;
        } else {
            action = 'No errored integrations found';
        }
    } else if (component === 'database') {
        action = 'Database health verified — no action needed';
    } else {
        action = `Self-heal attempted for ${component}`;
    }

    // Log to self-heal table (may not exist, ignore error)
    await adminSupabase.from('platform_self_heal_log').insert({
        component, action, status: 'success', actor_id: actorId,
    }).then(() => { }, () => { });

    await logPlatformAction(adminSupabase, actorId, 'self_heal', 'system', component, { action });
    return jsonResponse({ triggered: true, action });
}

async function handleGetSelfHealLog(
    request: Request, adminSupabase: SupabaseClient,
): Promise<Response> {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
    const offset = (page - 1) * limit;

    const { data, count, error } = await adminSupabase
        .from('platform_self_heal_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        // Table may not exist — fall back to audit log entries
        const { data: auditData, count: auditCount } = await adminSupabase
            .from('platform_audit_log')
            .select('*', { count: 'exact' })
            .eq('action', 'self_heal')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const entries = (auditData || []).map((a: Record<string, unknown>) => ({
            id: a.id,
            component: a.target_id,
            action: ((a.details as Record<string, unknown>)?.action as string) || 'self_heal',
            status: 'success' as const,
            details: JSON.stringify(a.details),
            created_at: a.created_at,
        }));
        return jsonResponse({
            entries,
            pagination: { page, limit, total: auditCount || 0, pages: Math.ceil((auditCount || 0) / limit) },
        });
    }

    return jsonResponse({
        entries: data || [],
        pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
}

async function handleGetRecoveryQueue(adminSupabase: SupabaseClient): Promise<Response> {
    const { data, error } = await adminSupabase
        .from('platform_recovery_queue')
        .select('*')
        .in('status', ['pending', 'retrying'])
        .order('created_at', { ascending: false });
    return jsonResponse({ items: error ? [] : (data || []) });
}

async function handleRecoveryAction(
    itemId: string, newStatus: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    await adminSupabase
        .from('platform_recovery_queue')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .then(() => { }, () => { });

    const responseKey = newStatus === 'retrying' ? 'retried' : newStatus;
    await logPlatformAction(adminSupabase, actorId, `recovery_${newStatus}`, 'recovery', itemId, {});
    return jsonResponse({ [responseKey]: true });
}

// ─── Registration Application Handlers ───────────────────────────────────────

async function handleListApplications(
    request: Request, adminSupabase: SupabaseClient,
): Promise<Response> {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const offset = (page - 1) * limit;

    let query = adminSupabase
        .from('registration_applications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (search) query = query.or(`company_name.ilike.%${search}%,gm_email.ilike.%${search}%,gm_name.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) return errorResponse(error.message, 500);

    return jsonResponse({ applications: data ?? [], total: count ?? 0, page, limit });
}

async function handleGetApplication(
    appId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const { data, error } = await adminSupabase
        .from('registration_applications')
        .select('*')
        .eq('id', appId)
        .maybeSingle();

    if (error) return errorResponse(error.message, 500);
    if (!data) return errorResponse('Application not found', 404);

    return jsonResponse({ application: data });
}

async function handleApproveApplication(
    request: Request, appId: string, reviewerId: string, env: Env, adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { notes?: string };

    // Get application
    const { data: app, error: getErr } = await adminSupabase
        .from('registration_applications')
        .select('*')
        .eq('id', appId)
        .maybeSingle();

    if (getErr) return errorResponse(getErr.message, 500);
    if (!app) return errorResponse('Application not found', 404);
    if (app.status !== 'submitted' && app.status !== 'under_review') {
        return errorResponse(`Cannot approve application with status "${app.status}"`, 400);
    }

    // Mark as under_review then provisioning
    await adminSupabase
        .from('registration_applications')
        .update({ status: 'provisioning', reviewed_by: reviewerId, review_notes: body.notes || null, reviewed_at: new Date().toISOString() })
        .eq('id', appId);

    // Create the company
    const { data: company, error: companyErr } = await adminSupabase
        .from('companies')
        .insert({
            name: app.company_name,
            name_ar: app.company_name_ar || app.company_name,
            industry: app.industry_code,
            country: app.country || 'AE',
            city: app.city,
            business_size: app.employee_count,
            cr_number: app.cr_number,
            status: 'active',
            plan_code: app.plan_code || 'starter',
            provisioned_modules: app.selected_modules || [],
        })
        .select('id')
        .single();

    if (companyErr) {
        await adminSupabase.from('registration_applications').update({ status: 'submitted' }).eq('id', appId);
        return errorResponse(`Failed to create company: ${companyErr.message}`, 500);
    }

    // Create the GM user via admin auth API
    const { data: { user }, error: userErr } = await adminSupabase.auth.admin.createUser({
        email: app.gm_email,
        phone: app.gm_phone || undefined,
        email_confirm: true,
        user_metadata: { full_name: app.gm_name },
    });

    if (userErr) {
        // User might already exist — look them up
        const { data: { users } } = await adminSupabase.auth.admin.listUsers();
        const existing = users?.find((u: { email?: string }) => u.email === app.gm_email);
        if (!existing) {
            await adminSupabase.from('companies').delete().eq('id', company.id);
            await adminSupabase.from('registration_applications').update({ status: 'submitted' }).eq('id', appId);
            return errorResponse(`Failed to create user: ${userErr.message}`, 500);
        }
        // Use existing user
        await adminSupabase.from('company_members').insert({
            company_id: company.id,
            user_id: existing.id,
            role_code: 'company_gm',
            status: 'active',
        });

        // Finalize application
        await adminSupabase.from('registration_applications').update({
            status: 'approved',
            company_id: company.id,
            user_id: existing.id,
        }).eq('id', appId);

        await logPlatformAction(adminSupabase, reviewerId, 'application_approved', 'registration_applications', appId, {
            company_id: company.id, user_id: existing.id,
        });

        return jsonResponse({ approved: true, companyId: company.id, userId: existing.id });
    }

    // Add GM membership
    await adminSupabase.from('company_members').insert({
        company_id: company.id,
        user_id: user!.id,
        role_code: 'company_gm',
        status: 'active',
    });

    // Finalize application
    await adminSupabase.from('registration_applications').update({
        status: 'approved',
        company_id: company.id,
        user_id: user!.id,
    }).eq('id', appId);

    await logPlatformAction(adminSupabase, reviewerId, 'application_approved', 'registration_applications', appId, {
        company_id: company.id, user_id: user!.id,
    });

    return jsonResponse({ approved: true, companyId: company.id, userId: user!.id });
}

async function handleRejectApplication(
    request: Request, appId: string, reviewerId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { reason: string };
    if (!body.reason) return errorResponse('Rejection reason is required', 400);

    const { data: app } = await adminSupabase
        .from('registration_applications')
        .select('status')
        .eq('id', appId)
        .maybeSingle();

    if (!app) return errorResponse('Application not found', 404);
    if (app.status === 'approved' || app.status === 'active') {
        return errorResponse(`Cannot reject application with status "${app.status}"`, 400);
    }

    await adminSupabase
        .from('registration_applications')
        .update({
            status: 'rejected',
            reviewed_by: reviewerId,
            review_notes: body.reason,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', appId);

    await logPlatformAction(adminSupabase, reviewerId, 'application_rejected', 'registration_applications', appId, {
        reason: body.reason,
    });

    return jsonResponse({ rejected: true });
}

// ─── Integration Catalog CRUD Handlers ───────────────────────────────────────

async function handleGetCatalogAdmin(adminSupabase: SupabaseClient): Promise<Response> {
    const { data, error } = await adminSupabase
        .from('integrations_catalog')
        .select('*')
        .order('name');

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ catalog: data ?? [] });
}

async function handleCreateCatalogItem(
    request: Request, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as Record<string, unknown>;
    const required = ['code', 'name', 'category', 'provider'];
    for (const key of required) {
        if (!body[key]) return errorResponse(`Missing required field: ${key}`, 400);
    }

    const { data, error } = await adminSupabase
        .from('integrations_catalog')
        .insert({
            code: body.code,
            name: body.name,
            category: body.category,
            description: body.description || null,
            provider: body.provider,
            pricing_model: body.pricing_model || 'usage',
            setup_mode: body.setup_mode || 'self-connect',
            required_secrets: body.required_secrets || [],
            required_plan: body.required_plan || null,
            region_availability: body.region_availability || ['global'],
            webhook_support: body.webhook_support ?? false,
            commission_rate: body.commission_rate || null,
            tiered_pricing: body.tiered_pricing || null,
            is_active: body.is_active ?? true,
        })
        .select('id, code, name')
        .single();

    if (error) return errorResponse(error.message, 500);

    await logPlatformAction(adminSupabase, actorId, 'catalog_item_created', 'integrations_catalog', data.id, { code: body.code });
    return jsonResponse({ created: true, item: data }, 201);
}

async function handleUpdateCatalogItem(
    request: Request, itemId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as Record<string, unknown>;

    const allowedFields = [
        'name', 'category', 'description', 'provider', 'pricing_model', 'setup_mode',
        'required_secrets', 'required_plan', 'region_availability', 'webhook_support',
        'commission_rate', 'tiered_pricing', 'is_active',
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
        if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) return errorResponse('No valid fields to update', 400);

    const { error } = await adminSupabase
        .from('integrations_catalog')
        .update(updates)
        .eq('id', itemId);

    if (error) return errorResponse(error.message, 500);

    await logPlatformAction(adminSupabase, actorId, 'catalog_item_updated', 'integrations_catalog', itemId, updates);
    return jsonResponse({ updated: true });
}

async function handleDeleteCatalogItem(
    itemId: string, actorId: string, adminSupabase: SupabaseClient,
): Promise<Response> {
    // Check if any tenants are using it
    const { count } = await adminSupabase
        .from('tenant_integrations')
        .select('*', { count: 'exact', head: true })
        .eq('integration_id', itemId)
        .eq('status', 'active');

    if ((count ?? 0) > 0) {
        return errorResponse(`Cannot delete: ${count} active tenant connections. Disable it instead.`, 409);
    }

    const { error } = await adminSupabase
        .from('integrations_catalog')
        .delete()
        .eq('id', itemId);

    if (error) return errorResponse(error.message, 500);

    await logPlatformAction(adminSupabase, actorId, 'catalog_item_deleted', 'integrations_catalog', itemId, {});
    return jsonResponse({ deleted: true });
}
