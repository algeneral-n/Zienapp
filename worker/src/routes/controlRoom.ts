/**
 * Control Room Routes — /api/control-room/*
 * Provides real-time company overview data for dashboards (web + mobile).
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, checkMembership, createAdminClient } from '../supabase';

export async function handleControlRoom(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    const { userId } = await requireAuth(request, env);
    const companyId = request.headers.get('X-Company-Id') ?? '';

    if (!companyId) {
        return errorResponse('X-Company-Id header is required');
    }

    // Verify membership
    const membership = await checkMembership(env, userId, companyId);

    if (!membership) {
        return errorResponse('Not a member of this company', 403);
    }

    const supabase = createAdminClient(env);

    // ─── Overview endpoint ─────────────────────────────────────────────
    if (path === '/api/control-room/overview' && request.method === 'GET') {
        // Run all queries in parallel for speed
        const [
            membersRes,
            modulesRes,
            deptsRes,
            invoicesRes,
            aiUsageRes,
            integrationsRes,
        ] = await Promise.all([
            supabase
                .from('company_members')
                .select('id, role:role_code, status')
                .eq('company_id', companyId)
                .eq('status', 'active'),
            supabase
                .from('company_modules')
                .select('id, module_id, is_active')
                .eq('company_id', companyId)
                .eq('is_active', true),
            supabase
                .from('departments')
                .select('id, name_en, is_active')
                .eq('company_id', companyId)
                .eq('is_active', true),
            supabase
                .from('invoices')
                .select('id, total, status, invoice_type')
                .eq('company_id', companyId),
            supabase
                .from('ai_usage_logs')
                .select('id, tokens_in, tokens_out')
                .eq('company_id', companyId)
                .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
            supabase
                .from('tenant_integrations')
                .select('id, status')
                .eq('company_id', companyId)
                .eq('status', 'connected'),
        ]);

        const members = membersRes.data ?? [];
        const modules = modulesRes.data ?? [];
        const depts = deptsRes.data ?? [];
        const invoices = invoicesRes.data ?? [];
        const aiUsage = aiUsageRes.data ?? [];
        const integrations = integrationsRes.data ?? [];

        // Calculate financial summary
        const salesInvoices = invoices.filter(i => i.invoice_type === 'sales');
        const totalRevenue = salesInvoices.reduce((s, i) => s + (i.total ?? 0), 0);
        const unpaidInvoices = salesInvoices.filter(i => i.status !== 'paid');
        const totalReceivable = unpaidInvoices.reduce((s, i) => s + (i.total ?? 0), 0);

        // Role distribution
        const roleDistribution: Record<string, number> = {};
        for (const m of members) {
            roleDistribution[m.role] = (roleDistribution[m.role] ?? 0) + 1;
        }

        // AI usage stats (last 30 days)
        const totalTokens = aiUsage.reduce((s, u) => s + (u.tokens_in ?? 0) + (u.tokens_out ?? 0), 0);

        return jsonResponse({
            company_id: companyId,
            user_role: membership.role,
            status_wall: {
                team_size: members.length,
                active_modules: modules.length,
                departments: depts.length,
                connected_integrations: integrations.length,
            },
            financials: {
                total_revenue: Math.round(totalRevenue * 100) / 100,
                total_receivable: Math.round(totalReceivable * 100) / 100,
                total_invoices: invoices.length,
                unpaid_count: unpaidInvoices.length,
            },
            ai_usage_30d: {
                total_queries: aiUsage.length,
                total_tokens: totalTokens,
            },
            role_distribution: roleDistribution,
            departments: depts.map(d => ({ id: d.id, name: d.name_en })),
        });
    }

    return errorResponse('Control room endpoint not found', 404);
}
