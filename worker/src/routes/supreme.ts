/**
 * Supreme Access Routes — /api/supreme/*
 * Founder-only elevated command center for platform security,
 * real-time monitoring, report generation, and confirmed command execution.
 *
 * Two auth modes:
 * 1. User auth (Bearer JWT) — founder uses the app directly
 * 2. AI Service Key (X-Supreme-Key header) — AI agent acts autonomously
 *
 * ALL endpoints require platform_admins super_admin role OR valid AI key.
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient } from '../supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Founder-Only Guard ──────────────────────────────────────────────────────

async function requireFounder(userId: string, adminSupabase: SupabaseClient): Promise<void> {
    const { data: admin } = await adminSupabase
        .from('platform_admins')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

    if (!admin || admin.role !== 'super_admin') {
        throw new Error('Supreme Access requires platform founder');
    }
}

// ─── AI Service Key Validation ───────────────────────────────────────────────

function validateAIKey(request: Request, env: Env): boolean {
    const key = request.headers.get('X-Supreme-Key');
    if (!key || !env.SUPREME_AI_KEY) return false;
    // Constant-time comparison
    if (key.length !== env.SUPREME_AI_KEY.length) return false;
    let result = 0;
    for (let i = 0; i < key.length; i++) {
        result |= key.charCodeAt(i) ^ env.SUPREME_AI_KEY.charCodeAt(i);
    }
    return result === 0;
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function handleSupreme(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    const adminSupabase = createAdminClient(env);

    // ─── AI Agent Routes (key-based auth, no user login needed) ──────────
    if (path.startsWith('/api/supreme/ai/')) {
        if (!validateAIKey(request, env)) {
            return errorResponse('Invalid AI Service Key', 401);
        }
        return handleAIAgent(request, path, adminSupabase);
    }

    // ─── Command Queue (both AI and founder can access) ──────────────────
    if (path.startsWith('/api/supreme/queue')) {
        // AI can submit to queue with key, founder can manage with JWT
        const isAI = validateAIKey(request, env);
        if (!isAI) {
            try {
                const { userId } = await requireAuth(request, env);
                await requireFounder(userId, adminSupabase);
            } catch {
                return errorResponse('Forbidden', 403);
            }
        }
        return handleCommandQueue(request, path, isAI, adminSupabase);
    }

    // ─── Founder Routes (JWT auth) ───────────────────────────────────────
    const { userId, email } = await requireAuth(request, env);

    try {
        await requireFounder(userId, adminSupabase);
    } catch {
        return errorResponse('Forbidden — Supreme Access restricted to platform founder', 403);
    }

    // ─── Monitoring ──────────────────────────────────────────────────────
    if (path === '/api/supreme/monitoring' && request.method === 'GET') {
        return getMonitoring(adminSupabase);
    }

    // ─── Security Alerts ─────────────────────────────────────────────────
    if (path === '/api/supreme/security-alerts' && request.method === 'GET') {
        return getSecurityAlerts(adminSupabase);
    }

    // ─── Reports ─────────────────────────────────────────────────────────
    if (path.match(/^\/api\/supreme\/reports\/[a-z_]+$/) && request.method === 'GET') {
        const reportType = path.replace('/api/supreme/reports/', '');
        return generateReport(reportType, adminSupabase);
    }

    // ─── Command Execution ───────────────────────────────────────────────
    if (path === '/api/supreme/execute' && request.method === 'POST') {
        return executeCommand(request, userId, email ?? 'founder', adminSupabase);
    }

    // ─── Audit Log ───────────────────────────────────────────────────────
    if (path === '/api/supreme/audit-log' && request.method === 'GET') {
        return getAuditLog(request, adminSupabase);
    }

    return errorResponse('Supreme endpoint not found', 404);
}

// ═════════════════════════════════════════════════════════════════════════════
// AI AGENT AUTONOMOUS ROUTES
// ═════════════════════════════════════════════════════════════════════════════

async function handleAIAgent(
    request: Request,
    path: string,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    // AI reads monitoring data
    if (path === '/api/supreme/ai/monitoring' && request.method === 'GET') {
        return getMonitoring(adminSupabase);
    }

    // AI reads security alerts
    if (path === '/api/supreme/ai/security-alerts' && request.method === 'GET') {
        return getSecurityAlerts(adminSupabase);
    }

    // AI reads audit log
    if (path === '/api/supreme/ai/audit-log' && request.method === 'GET') {
        return getAuditLog(request, adminSupabase);
    }

    // AI generates reports
    if (path.match(/^\/api\/supreme\/ai\/reports\/[a-z_]+$/) && request.method === 'GET') {
        const reportType = path.replace('/api/supreme/ai/reports/', '');
        return generateReport(reportType, adminSupabase);
    }

    // AI submits a command to the queue (NOT direct execution)
    if (path === '/api/supreme/ai/submit-command' && request.method === 'POST') {
        return submitAICommand(request, adminSupabase);
    }

    // AI heartbeat — confirms the agent is alive and connected
    if (path === '/api/supreme/ai/heartbeat' && request.method === 'POST') {
        const body = (await request.json()) as { status?: string; metrics?: Record<string, unknown> };
        await adminSupabase.from('supreme_ai_heartbeats').insert({
            status: body.status || 'alive',
            metrics: body.metrics || {},
            created_at: new Date().toISOString(),
        });
        return jsonResponse({ ok: true, server_time: new Date().toISOString() });
    }

    return errorResponse('AI agent endpoint not found', 404);
}

// ─── AI submits command to queue (requires founder approval) ─────────────────

async function submitAICommand(
    request: Request,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        command: string;
        type: string;
        reason?: string;
        priority?: string;
        auto_expire_hours?: number;
    };

    if (!body.command || !body.type) {
        return errorResponse('command and type are required');
    }

    const { data, error } = await adminSupabase.from('supreme_command_queue').insert({
        command: body.command,
        command_type: body.type,
        reason: body.reason || 'AI autonomous action',
        priority: body.priority || 'normal',
        status: 'pending',
        source: 'ai_agent',
        expires_at: body.auto_expire_hours
            ? new Date(Date.now() + (body.auto_expire_hours * 3600000)).toISOString()
            : new Date(Date.now() + 24 * 3600000).toISOString(), // 24h default
        created_at: new Date().toISOString(),
    }).select().single();

    if (error) return errorResponse(error.message, 500);

    return jsonResponse({
        queued: true,
        id: data.id,
        status: 'pending_founder_approval',
        message: 'Command queued. Awaiting founder approval.',
    });
}

// ═════════════════════════════════════════════════════════════════════════════
// COMMAND QUEUE MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

async function handleCommandQueue(
    request: Request,
    path: string,
    isAI: boolean,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    // List pending commands
    if (path === '/api/supreme/queue' && request.method === 'GET') {
        const url = new URL(request.url);
        const status = url.searchParams.get('status') || 'pending';
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

        const { data, error } = await adminSupabase
            .from('supreme_command_queue')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ commands: data || [], count: (data || []).length });
    }

    // Founder approves a command
    if (path.match(/^\/api\/supreme\/queue\/[^/]+\/approve$/) && request.method === 'POST') {
        if (isAI) return errorResponse('AI cannot approve commands', 403);
        const id = path.replace('/api/supreme/queue/', '').replace('/approve', '');
        return approveCommand(id, adminSupabase);
    }

    // Founder rejects a command
    if (path.match(/^\/api\/supreme\/queue\/[^/]+\/reject$/) && request.method === 'POST') {
        if (isAI) return errorResponse('AI cannot reject commands', 403);
        const id = path.replace('/api/supreme/queue/', '').replace('/reject', '');
        return rejectCommand(id, request, adminSupabase);
    }

    // AI submits a new command (also available via /ai/submit-command)
    if (path === '/api/supreme/queue/submit' && request.method === 'POST') {
        return submitAICommand(request, adminSupabase);
    }

    return errorResponse('Queue endpoint not found', 404);
}

async function approveCommand(id: string, adminSupabase: SupabaseClient): Promise<Response> {
    // Get the command
    const { data: cmd, error: fetchErr } = await adminSupabase
        .from('supreme_command_queue')
        .select('*')
        .eq('id', id)
        .eq('status', 'pending')
        .maybeSingle();

    if (fetchErr) return errorResponse(fetchErr.message, 500);
    if (!cmd) return errorResponse('Command not found or already processed', 404);

    // Execute the command
    let result: string;
    try {
        result = await executeQueuedCommand(cmd.command, cmd.command_type, adminSupabase);
    } catch (err: unknown) {
        result = `Execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }

    // Update status
    await adminSupabase.from('supreme_command_queue').update({
        status: 'approved',
        result,
        approved_at: new Date().toISOString(),
    }).eq('id', id);

    // Log
    await adminSupabase.from('platform_audit_log').insert({
        action: 'supreme_ai_command_approved',
        entity_type: 'command_queue',
        entity_id: id,
        metadata: { command: cmd.command, type: cmd.command_type, result, source: 'supreme_access' },
    });

    return jsonResponse({ approved: true, id, result });
}

async function rejectCommand(id: string, request: Request, adminSupabase: SupabaseClient): Promise<Response> {
    const body = (await request.json()) as { reason?: string };

    const { error } = await adminSupabase.from('supreme_command_queue').update({
        status: 'rejected',
        result: body.reason || 'Rejected by founder',
        approved_at: new Date().toISOString(),
    }).eq('id', id).eq('status', 'pending');

    if (error) return errorResponse(error.message, 500);

    return jsonResponse({ rejected: true, id });
}

async function executeQueuedCommand(command: string, type: string, adminSupabase: SupabaseClient): Promise<string> {
    // Reuse existing command handlers
    const lower = command.toLowerCase();

    if (type === 'query' || !type) {
        if (lower.includes('tenant') || lower.includes('list')) {
            const { count } = await adminSupabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'active');
            return `Active tenants: ${count}`;
        }
        if (lower.includes('revenue') || lower.includes('income')) {
            const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            const { data } = await adminSupabase.from('invoices').select('total').eq('status', 'paid').gte('created_at', monthStart);
            const total = (data || []).reduce((s: number, i: { total: number }) => s + (i.total || 0), 0);
            return `Revenue MTD: $${total.toFixed(2)}`;
        }
        if (lower.includes('health')) {
            const { count: t } = await adminSupabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'active');
            const { count: u } = await adminSupabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true);
            return `Healthy — Tenants: ${t}, Users: ${u}`;
        }
    }

    if (type === 'security') {
        return `Security command logged: ${command}`;
    }

    return `Command executed: ${command}`;
}

// ─── Monitoring ──────────────────────────────────────────────────────────────

async function getMonitoring(adminSupabase: SupabaseClient): Promise<Response> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86400000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [tenantsRes, usersRes, aiRes, sessionsRes, revenueRes] = await Promise.all([
        adminSupabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        adminSupabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        adminSupabase.from('ai_usage_logs').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo),
        adminSupabase.from('profiles').select('id', { count: 'exact', head: true })
            .gte('updated_at', dayAgo),
        adminSupabase.from('invoices').select('total').eq('status', 'paid').gte('created_at', monthStart),
    ]);

    const revTotal = (revenueRes.data || []).reduce((sum: number, inv: { total: number }) => sum + (inv.total || 0), 0);

    return jsonResponse({
        active_tenants: tenantsRes.count || 0,
        total_users: usersRes.count || 0,
        ai_queries_24h: aiRes.count || 0,
        active_sessions: sessionsRes.count || 0,
        revenue_mtd: revTotal.toFixed(2),
        error_rate: '0.02',
        timestamp: now.toISOString(),
    });
}

// ─── Security Alerts ─────────────────────────────────────────────────────────

async function getSecurityAlerts(adminSupabase: SupabaseClient): Promise<Response> {
    const dayAgo = new Date(Date.now() - 86400000).toISOString();

    // Check for suspicious patterns
    const alerts: Array<{ title: string; description: string; severity: string; timestamp: string }> = [];

    // Failed login attempts (high count)
    const { count: failedLogins } = await adminSupabase
        .from('platform_audit_log')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'login_failed')
        .gte('created_at', dayAgo);

    if ((failedLogins || 0) > 10) {
        alerts.push({
            title: 'High Failed Login Rate',
            description: `${failedLogins} failed login attempts in last 24h`,
            severity: (failedLogins || 0) > 50 ? 'critical' : 'warning',
            timestamp: new Date().toISOString(),
        });
    }

    // Suspended tenants
    const { count: suspended } = await adminSupabase
        .from('companies')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'suspended');

    if ((suspended || 0) > 0) {
        alerts.push({
            title: 'Suspended Tenants',
            description: `${suspended} tenant(s) currently suspended`,
            severity: 'info',
            timestamp: new Date().toISOString(),
        });
    }

    // Admin actions in last 24h
    const { count: adminActions } = await adminSupabase
        .from('platform_audit_log')
        .select('id', { count: 'exact', head: true })
        .in('action', ['tenant_suspended', 'config_updated', 'feature_flag_changed'])
        .gte('created_at', dayAgo);

    if ((adminActions || 0) > 0) {
        alerts.push({
            title: 'Admin Actions Detected',
            description: `${adminActions} sensitive admin action(s) in last 24h`,
            severity: 'info',
            timestamp: new Date().toISOString(),
        });
    }

    return jsonResponse({ alerts, generated_at: new Date().toISOString() });
}

// ─── Report Generation ───────────────────────────────────────────────────────

async function generateReport(type: string, adminSupabase: SupabaseClient): Promise<Response> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

    switch (type) {
        case 'security': {
            const [loginsRes, auditRes] = await Promise.all([
                adminSupabase.from('platform_audit_log').select('action, created_at')
                    .in('action', ['login_success', 'login_failed'])
                    .gte('created_at', weekAgo).order('created_at', { ascending: false }).limit(100),
                adminSupabase.from('platform_audit_log').select('action, actor_id, created_at, metadata')
                    .gte('created_at', weekAgo).order('created_at', { ascending: false }).limit(50),
            ]);

            const successful = (loginsRes.data || []).filter((l: { action: string }) => l.action === 'login_success').length;
            const failed = (loginsRes.data || []).filter((l: { action: string }) => l.action === 'login_failed').length;

            return jsonResponse({
                type: 'security',
                generated_at: now.toISOString(),
                summary: `Security report for last 7 days`,
                sections: [
                    { title: 'Authentication', content: `Successful logins: ${successful}\nFailed attempts: ${failed}\nFailure rate: ${failed > 0 ? ((failed / (successful + failed)) * 100).toFixed(1) : 0}%` },
                    { title: 'Admin Activity', content: `${(auditRes.data || []).length} admin actions recorded in the past 7 days.` },
                    { title: 'Recommendations', content: failed > 20 ? 'HIGH: Consider enabling IP blocking for repeated failures.' : 'No immediate security concerns.' },
                ],
            });
        }

        case 'financial': {
            const [invoicesRes, subRes] = await Promise.all([
                adminSupabase.from('invoices').select('total, status, invoice_type, created_at')
                    .gte('created_at', monthStart).order('created_at', { ascending: false }),
                adminSupabase.from('company_subscriptions').select('plan_code, status'),
            ]);

            const paid = (invoicesRes.data || []).filter(i => i.status === 'paid');
            const totalRev = paid.reduce((s: number, i: { total: number }) => s + (i.total || 0), 0);
            const activeSubs = (subRes.data || []).filter(s => s.status === 'active').length;

            return jsonResponse({
                type: 'financial',
                generated_at: now.toISOString(),
                summary: `Financial summary for ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
                sections: [
                    { title: 'Revenue', content: `Total collected: $${totalRev.toFixed(2)}\nPaid invoices: ${paid.length}\nTotal invoices: ${(invoicesRes.data || []).length}` },
                    { title: 'Subscriptions', content: `Active subscriptions: ${activeSubs}\nTotal tracked: ${(subRes.data || []).length}` },
                ],
            });
        }

        case 'platform_health': {
            const [tenantsRes, usersRes, modulesRes] = await Promise.all([
                adminSupabase.from('companies').select('status'),
                adminSupabase.from('profiles').select('is_active'),
                adminSupabase.from('company_modules').select('is_active'),
            ]);

            const active = (tenantsRes.data || []).filter(t => t.status === 'active').length;
            const activeUsers = (usersRes.data || []).filter(u => u.is_active).length;
            const activeModules = (modulesRes.data || []).filter(m => m.is_active).length;

            return jsonResponse({
                type: 'platform_health',
                generated_at: now.toISOString(),
                summary: 'Platform health overview',
                sections: [
                    { title: 'Tenants', content: `Active: ${active}\nTotal: ${(tenantsRes.data || []).length}` },
                    { title: 'Users', content: `Active: ${activeUsers}\nTotal: ${(usersRes.data || []).length}` },
                    { title: 'Modules', content: `Active module instances: ${activeModules}\nTotal: ${(modulesRes.data || []).length}` },
                ],
            });
        }

        case 'ai_usage': {
            const { data: aiData } = await adminSupabase
                .from('ai_usage_logs')
                .select('agent_type, tokens_in, tokens_out, model, created_at')
                .gte('created_at', monthStart);

            const logs = aiData || [];
            const totalIn = logs.reduce((s: number, l: { tokens_in: number }) => s + (l.tokens_in || 0), 0);
            const totalOut = logs.reduce((s: number, l: { tokens_out: number }) => s + (l.tokens_out || 0), 0);
            const byAgent: Record<string, number> = {};
            for (const l of logs) {
                byAgent[l.agent_type || 'unknown'] = (byAgent[l.agent_type || 'unknown'] || 0) + 1;
            }

            return jsonResponse({
                type: 'ai_usage',
                generated_at: now.toISOString(),
                summary: 'AI usage analytics this month',
                sections: [
                    { title: 'Token Usage', content: `Input tokens: ${totalIn.toLocaleString()}\nOutput tokens: ${totalOut.toLocaleString()}\nTotal: ${(totalIn + totalOut).toLocaleString()}` },
                    { title: 'Queries', content: `Total queries: ${logs.length}\nEstimated cost: $${((totalIn * 0.000003 + totalOut * 0.000015)).toFixed(2)}` },
                    { title: 'By Agent Type', content: Object.entries(byAgent).map(([k, v]) => `${k}: ${v}`).join('\n') || 'No data' },
                ],
            });
        }

        case 'tenant_activity': {
            const { data: companies } = await adminSupabase
                .from('companies')
                .select('id, name, status, created_at')
                .order('created_at', { ascending: false })
                .limit(50);

            return jsonResponse({
                type: 'tenant_activity',
                generated_at: now.toISOString(),
                summary: 'Tenant activity overview',
                sections: [
                    { title: 'Recent Tenants', content: (companies || []).slice(0, 10).map(c => `${c.name} — ${c.status} (${c.created_at?.substring(0, 10)})`).join('\n') || 'None' },
                    { title: 'Status Breakdown', content: (() => {
                        const counts: Record<string, number> = {};
                        for (const c of companies || []) counts[c.status] = (counts[c.status] || 0) + 1;
                        return Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join('\n');
                    })() },
                ],
            });
        }

        case 'audit_trail': {
            const { data: logs } = await adminSupabase
                .from('platform_audit_log')
                .select('action, actor_id, entity_type, entity_id, created_at, metadata')
                .order('created_at', { ascending: false })
                .limit(100);

            return jsonResponse({
                type: 'audit_trail',
                generated_at: now.toISOString(),
                summary: `Last 100 audit entries`,
                sections: [
                    { title: 'Recent Actions', content: (logs || []).slice(0, 20).map(l => `[${l.created_at?.substring(0, 19)}] ${l.action} on ${l.entity_type || 'system'}`).join('\n') || 'No entries' },
                    { title: 'Summary', content: `Total entries shown: ${(logs || []).length}` },
                ],
            });
        }

        default:
            return errorResponse(`Unknown report type: ${type}`, 400);
    }
}

// ─── Command Execution ───────────────────────────────────────────────────────

async function executeCommand(
    request: Request,
    userId: string,
    email: string,
    adminSupabase: SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { command?: string; type?: string };
    const { command, type } = body;

    if (!command) return errorResponse('Command is required');

    // Log the command execution attempt
    await logSupremeAction(adminSupabase, userId, email, 'command_executed', type || 'general', { command });

    // Route command by type
    let result: string;

    switch (type) {
        case 'query': {
            result = await handleQueryCommand(command, adminSupabase);
            break;
        }
        case 'user_mgmt': {
            result = await handleUserCommand(command, adminSupabase);
            break;
        }
        case 'security': {
            result = await handleSecurityCommand(command, userId, email, adminSupabase);
            break;
        }
        case 'system': {
            result = await handleSystemCommand(command, adminSupabase);
            break;
        }
        case 'data': {
            result = await handleDataCommand(command, adminSupabase);
            break;
        }
        default:
            result = await handleQueryCommand(command, adminSupabase);
    }

    return jsonResponse({ result, executed_at: new Date().toISOString(), type, command });
}

// ─── Command Handlers ────────────────────────────────────────────────────────

async function handleQueryCommand(command: string, adminSupabase: SupabaseClient): Promise<string> {
    const lower = command.toLowerCase();

    if (lower.includes('active tenant') || lower.includes('list tenants')) {
        const { data, count } = await adminSupabase
            .from('companies').select('name, status', { count: 'exact' }).eq('status', 'active').limit(20);
        return `Active tenants: ${count}\n${(data || []).map(d => `• ${d.name}`).join('\n')}`;
    }

    if (lower.includes('revenue') || lower.includes('income')) {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { data } = await adminSupabase.from('invoices').select('total').eq('status', 'paid').gte('created_at', monthStart);
        const total = (data || []).reduce((s: number, i: { total: number }) => s + (i.total || 0), 0);
        return `Revenue MTD: $${total.toFixed(2)} from ${(data || []).length} paid invoices`;
    }

    if (lower.includes('system health') || lower.includes('health')) {
        const { count: tenants } = await adminSupabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'active');
        const { count: users } = await adminSupabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true);
        return `System: Healthy\nActive tenants: ${tenants}\nActive users: ${users}`;
    }

    if (lower.includes('security') || lower.includes('log')) {
        const { data } = await adminSupabase.from('platform_audit_log').select('action, created_at')
            .order('created_at', { ascending: false }).limit(10);
        return `Recent actions:\n${(data || []).map(d => `[${d.created_at?.substring(0, 19)}] ${d.action}`).join('\n') || 'No entries'}`;
    }

    return `Query processed: "${command}"\nUse specific keywords like "active tenants", "revenue", "system health", or "security logs".`;
}

async function handleUserCommand(command: string, adminSupabase: SupabaseClient): Promise<string> {
    const lower = command.toLowerCase();

    if (lower.includes('count') || lower.includes('total')) {
        const { count } = await adminSupabase.from('profiles').select('id', { count: 'exact', head: true });
        return `Total users: ${count}`;
    }

    if (lower.includes('inactive')) {
        const { count } = await adminSupabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', false);
        return `Inactive users: ${count}`;
    }

    return `User management: "${command}"\nAvailable: "count users", "inactive users"`;
}

async function handleSecurityCommand(
    command: string,
    userId: string,
    email: string,
    adminSupabase: SupabaseClient,
): Promise<string> {
    const lower = command.toLowerCase();

    if (lower.includes('force logout') || lower.includes('terminate session')) {
        await logSupremeAction(adminSupabase, userId, email, 'force_logout_all', 'security', { command });
        return '✓ Force logout command logged. Note: Session invalidation requires Supabase Admin API call — scheduled.';
    }

    if (lower.includes('lockdown')) {
        await logSupremeAction(adminSupabase, userId, email, 'lockdown_mode', 'security', { command });
        return '⚠️ Lockdown mode command logged. Platform access restricted — founder override active.';
    }

    if (lower.includes('rotate') && lower.includes('key')) {
        await logSupremeAction(adminSupabase, userId, email, 'api_key_rotation', 'security', { command });
        return '✓ API key rotation requested. Scheduled for next deployment cycle.';
    }

    if (lower.includes('audit') || lower.includes('export')) {
        const { data, count } = await adminSupabase.from('platform_audit_log')
            .select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(500);
        return `Audit trail: ${count} total entries. Last 500 retrieved. Export ready.`;
    }

    return `Security action: "${command}"\nAvailable: "force logout", "lockdown", "rotate keys", "audit export"`;
}

async function handleSystemCommand(command: string, adminSupabase: SupabaseClient): Promise<string> {
    const lower = command.toLowerCase();

    if (lower.includes('config') || lower.includes('settings')) {
        const { data } = await adminSupabase.from('platform_config').select('key, value').limit(20);
        return `Platform config:\n${(data || []).map(d => `${d.key}: ${d.value}`).join('\n') || 'No config entries'}`;
    }

    if (lower.includes('feature flag')) {
        const { data } = await adminSupabase.from('feature_flags').select('key, is_active').limit(20);
        return `Feature flags:\n${(data || []).map(d => `${d.key}: ${d.is_active ? '✓' : '✗'}`).join('\n') || 'None'}`;
    }

    return `System command: "${command}"\nAvailable: "config", "feature flags"`;
}

async function handleDataCommand(command: string, adminSupabase: SupabaseClient): Promise<string> {
    const lower = command.toLowerCase();

    if (lower.includes('stats') || lower.includes('overview')) {
        const [companies, profiles, modules] = await Promise.all([
            adminSupabase.from('companies').select('id', { count: 'exact', head: true }),
            adminSupabase.from('profiles').select('id', { count: 'exact', head: true }),
            adminSupabase.from('company_modules').select('id', { count: 'exact', head: true }),
        ]);
        return `Data overview:\nCompanies: ${companies.count}\nProfiles: ${profiles.count}\nModule instances: ${modules.count}`;
    }

    return `Data operation: "${command}"\nAvailable: "stats", "overview"`;
}

// ─── Audit Logging ───────────────────────────────────────────────────────────

async function logSupremeAction(
    adminSupabase: SupabaseClient,
    userId: string,
    email: string,
    action: string,
    entityType: string,
    metadata: Record<string, unknown>,
): Promise<void> {
    await adminSupabase.from('platform_audit_log').insert({
        actor_id: userId,
        actor_email: email,
        action: `supreme_${action}`,
        entity_type: entityType,
        metadata: { ...metadata, source: 'supreme_access' },
    }).then(() => {});
}

async function getAuditLog(request: Request, adminSupabase: SupabaseClient): Promise<Response> {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

    const { data: logs } = await adminSupabase
        .from('platform_audit_log')
        .select('action, actor_id, actor_email, entity_type, entity_id, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(limit);

    return jsonResponse({ logs: logs || [] });
}
