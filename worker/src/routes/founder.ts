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
