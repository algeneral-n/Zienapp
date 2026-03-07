/**
 * CRM Module Worker Routes
 *
 * Endpoints:
 *   GET    /api/crm/clients             — list clients
 *   GET    /api/crm/clients/:id         — get client detail
 *   POST   /api/crm/clients             — create client
 *   PATCH  /api/crm/clients/:id         — update client
 *
 *   GET    /api/crm/leads               — list leads
 *   POST   /api/crm/leads               — create lead
 *   PATCH  /api/crm/leads/:id           — update lead / convert to client
 *
 *   GET    /api/crm/opportunities        — list opportunities (pipeline)
 *   POST   /api/crm/opportunities        — create opportunity
 *   PATCH  /api/crm/opportunities/:id    — update opportunity / move stage
 *
 *   GET    /api/crm/activities            — list activities
 *   POST   /api/crm/activities            — create activity
 *   PATCH  /api/crm/activities/:id        — complete/cancel activity
 *
 *   GET    /api/crm/deal-stages           — list deal stages
 *   POST   /api/crm/deal-stages           — create/reorder deal stages
 *
 *   GET    /api/crm/quotes                — list quotes
 *   POST   /api/crm/quotes               — create quote
 *
 *   GET    /api/crm/dashboard             — CRM dashboard stats
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient, discoverMembership } from '../supabase';

export async function handleCRM(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    const { userId, supabase } = await requireAuth(request, env);

    const membership = await discoverMembership(env, userId);

    if (!membership) return errorResponse('No active company membership', 403);

    const companyId = membership.company_id;
    const userRole = membership.role;
    const adminClient = createAdminClient(env);

    // ─── Dashboard ─────────────────────────────────────────────────────────

    if (path === '/api/crm/dashboard' && request.method === 'GET') {
        const [clients, leads, opps, activities] = await Promise.all([
            adminClient.from('clients').select('id, status, total_revenue', { count: 'exact' }).eq('company_id', companyId),
            adminClient.from('leads').select('id, status, estimated_value', { count: 'exact' }).eq('company_id', companyId),
            adminClient.from('opportunities').select('id, status, value', { count: 'exact' }).eq('company_id', companyId),
            adminClient.from('crm_activities').select('id, status', { count: 'exact' }).eq('company_id', companyId).eq('status', 'pending'),
        ]);

        const clientList = clients.data ?? [];
        const leadList = leads.data ?? [];
        const oppList = opps.data ?? [];

        return jsonResponse({
            dashboard: {
                clients: {
                    total: clients.count ?? 0,
                    active: clientList.filter((c: any) => c.status === 'active').length,
                    totalRevenue: clientList.reduce((s: number, c: any) => s + (c.total_revenue || 0), 0),
                },
                leads: {
                    total: leads.count ?? 0,
                    new: leadList.filter((l: any) => l.status === 'new').length,
                    qualified: leadList.filter((l: any) => l.status === 'qualified').length,
                    totalValue: leadList.reduce((s: number, l: any) => s + (l.estimated_value || 0), 0),
                },
                opportunities: {
                    total: opps.count ?? 0,
                    open: oppList.filter((o: any) => o.status === 'open').length,
                    won: oppList.filter((o: any) => o.status === 'won').length,
                    totalValue: oppList.reduce((s: number, o: any) => s + (o.value || 0), 0),
                },
                pendingActivities: activities.count ?? 0,
            },
        });
    }

    // ─── Clients ──────────────────────────────────────────────────────────

    if (path === '/api/crm/clients' && request.method === 'GET') {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const search = url.searchParams.get('search');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        let query = adminClient
            .from('clients')
            .select('*', { count: 'exact' })
            .eq('company_id', companyId);

        if (status) query = query.eq('status', status);
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        query = query
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ clients: data ?? [], total: count ?? 0, page, limit });
    }

    const clientMatch = path.match(/^\/api\/crm\/clients\/([0-9a-f-]+)$/);
    if (clientMatch && request.method === 'GET') {
        const { data, error } = await adminClient
            .from('clients')
            .select(`
        *,
        quotes(id, total_amount, status, created_at),
        contracts(id, title, status, start_date, end_date),
        crm_activities(id, activity_type, subject, status, due_date, created_at)
      `)
            .eq('id', clientMatch[1])
            .eq('company_id', companyId)
            .single();

        if (error || !data) return errorResponse('Client not found', 404);
        return jsonResponse({ client: data });
    }

    if (path === '/api/crm/clients' && request.method === 'POST') {
        if (!hasCRMWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as {
            name: string;
            email?: string;
            phone?: string;
            address?: string;
            contactPerson?: string;
            notes?: string;
            source?: string;
        };

        if (!body.name) return errorResponse('Missing client name');

        const { data, error } = await adminClient
            .from('clients')
            .insert({
                company_id: companyId,
                name: body.name,
                email: body.email,
                phone: body.phone,
                address: body.address,
                contact_person: body.contactPerson,
                notes: body.notes,
                source: body.source,
                status: 'active',
                total_revenue: 0,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        await adminClient.from('audit_log').insert({
            company_id: companyId,
            user_id: userId,
            action: 'crm.client.created',
            entity_type: 'client',
            entity_id: data.id,
            details: { name: body.name },
        }).then(() => { }, () => { });

        return jsonResponse({ client: data }, 201);
    }

    if (clientMatch && request.method === 'PATCH') {
        if (!hasCRMWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as Partial<{
            name: string;
            email: string;
            phone: string;
            address: string;
            contactPerson: string;
            status: string;
            notes: string;
        }>;

        const updates: Record<string, unknown> = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.email !== undefined) updates.email = body.email;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.address !== undefined) updates.address = body.address;
        if (body.contactPerson !== undefined) updates.contact_person = body.contactPerson;
        if (body.status !== undefined) updates.status = body.status;
        if (body.notes !== undefined) updates.notes = body.notes;

        if (Object.keys(updates).length === 0) return errorResponse('No fields to update');

        const { data, error } = await adminClient
            .from('clients')
            .update(updates)
            .eq('id', clientMatch[1])
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ client: data });
    }

    // ─── Leads ────────────────────────────────────────────────────────────

    if (path === '/api/crm/leads' && request.method === 'GET') {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const assignedTo = url.searchParams.get('assignedTo');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        let query = adminClient
            .from('leads')
            .select(`
        id, name, email, phone, source, status, estimated_value,
        assigned_to, profiles!leads_assigned_to_fkey(full_name),
        notes, created_at
      `, { count: 'exact' })
            .eq('company_id', companyId);

        if (status) query = query.eq('status', status);
        if (assignedTo) query = query.eq('assigned_to', assignedTo);

        query = query
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ leads: data ?? [], total: count ?? 0, page, limit });
    }

    if (path === '/api/crm/leads' && request.method === 'POST') {
        if (!hasCRMWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as {
            name: string;
            email?: string;
            phone?: string;
            source?: string;
            estimatedValue?: number;
            notes?: string;
            assignedTo?: string;
        };

        if (!body.name) return errorResponse('Missing lead name');

        const { data, error } = await adminClient
            .from('leads')
            .insert({
                company_id: companyId,
                name: body.name,
                email: body.email,
                phone: body.phone,
                source: body.source || 'manual',
                estimated_value: body.estimatedValue || 0,
                notes: body.notes,
                assigned_to: body.assignedTo || userId,
                status: 'new',
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        await adminClient.from('audit_log').insert({
            company_id: companyId,
            user_id: userId,
            action: 'crm.lead.created',
            entity_type: 'lead',
            entity_id: data.id,
            details: { name: body.name, source: body.source },
        }).then(() => { }, () => { });

        return jsonResponse({ lead: data }, 201);
    }

    const leadMatch = path.match(/^\/api\/crm\/leads\/([0-9a-f-]+)$/);
    if (leadMatch && request.method === 'PATCH') {
        if (!hasCRMWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as Partial<{
            status: string;
            assignedTo: string;
            estimatedValue: number;
            notes: string;
            convertToClient: boolean;
        }>;

        // Convert lead → client
        if (body.convertToClient) {
            const { data: lead } = await adminClient
                .from('leads')
                .select('*')
                .eq('id', leadMatch[1])
                .eq('company_id', companyId)
                .single();

            if (!lead) return errorResponse('Lead not found', 404);

            // Create client from lead
            const { data: client, error: clientErr } = await adminClient
                .from('clients')
                .insert({
                    company_id: companyId,
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    source: lead.source,
                    notes: `Converted from lead. ${lead.notes || ''}`.trim(),
                    status: 'active',
                    total_revenue: 0,
                })
                .select()
                .single();

            if (clientErr) return errorResponse(clientErr.message, 500);

            // Mark lead as converted
            await adminClient
                .from('leads')
                .update({ status: 'converted' })
                .eq('id', leadMatch[1]);

            await adminClient.from('audit_log').insert({
                company_id: companyId,
                user_id: userId,
                action: 'crm.lead.converted',
                entity_type: 'lead',
                entity_id: leadMatch[1],
                details: { clientId: client.id },
            }).then(() => { }, () => { });

            return jsonResponse({ lead: { ...lead, status: 'converted' }, client });
        }

        // Regular update
        const updates: Record<string, unknown> = {};
        if (body.status !== undefined) updates.status = body.status;
        if (body.assignedTo !== undefined) updates.assigned_to = body.assignedTo;
        if (body.estimatedValue !== undefined) updates.estimated_value = body.estimatedValue;
        if (body.notes !== undefined) updates.notes = body.notes;

        if (Object.keys(updates).length === 0) return errorResponse('No fields to update');

        const { data, error } = await adminClient
            .from('leads')
            .update(updates)
            .eq('id', leadMatch[1])
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ lead: data });
    }

    // ─── Opportunities (Pipeline) ─────────────────────────────────────────

    if (path === '/api/crm/opportunities' && request.method === 'GET') {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const stageId = url.searchParams.get('stageId');
        const clientId = url.searchParams.get('clientId');

        let query = adminClient
            .from('opportunities')
            .select(`
        id, title, value, status, probability, expected_close_date,
        client_id, clients(name),
        stage_id, deal_stages(name, color, sort_order),
        assigned_to, profiles!opportunities_assigned_to_fkey(full_name),
        notes, created_at
      `)
            .eq('company_id', companyId);

        if (status) query = query.eq('status', status);
        if (stageId) query = query.eq('stage_id', stageId);
        if (clientId) query = query.eq('client_id', clientId);

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ opportunities: data ?? [] });
    }

    if (path === '/api/crm/opportunities' && request.method === 'POST') {
        if (!hasCRMWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as {
            title: string;
            clientId?: string;
            value?: number;
            stageId?: string;
            expectedCloseDate?: string;
            notes?: string;
            assignedTo?: string;
        };

        if (!body.title) return errorResponse('Missing opportunity title');

        // If no stageId, get first stage
        let stageId = body.stageId;
        if (!stageId) {
            const { data: firstStage } = await adminClient
                .from('deal_stages')
                .select('id')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .order('sort_order')
                .limit(1)
                .maybeSingle();
            stageId = firstStage?.id;
        }

        const { data, error } = await adminClient
            .from('opportunities')
            .insert({
                company_id: companyId,
                title: body.title,
                client_id: body.clientId,
                value: body.value || 0,
                stage_id: stageId,
                expected_close_date: body.expectedCloseDate,
                notes: body.notes,
                assigned_to: body.assignedTo || userId,
                status: 'open',
                probability: 0,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        await adminClient.from('audit_log').insert({
            company_id: companyId,
            user_id: userId,
            action: 'crm.opportunity.created',
            entity_type: 'opportunity',
            entity_id: data.id,
            details: { title: body.title, value: body.value },
        }).then(() => { }, () => { });

        return jsonResponse({ opportunity: data }, 201);
    }

    const oppMatch = path.match(/^\/api\/crm\/opportunities\/([0-9a-f-]+)$/);
    if (oppMatch && request.method === 'PATCH') {
        if (!hasCRMWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as Partial<{
            stageId: string;
            value: number;
            status: string;
            probability: number;
            expectedCloseDate: string;
            notes: string;
            assignedTo: string;
        }>;

        const updates: Record<string, unknown> = {};
        if (body.stageId !== undefined) updates.stage_id = body.stageId;
        if (body.value !== undefined) updates.value = body.value;
        if (body.status !== undefined) updates.status = body.status;
        if (body.probability !== undefined) updates.probability = body.probability;
        if (body.expectedCloseDate !== undefined) updates.expected_close_date = body.expectedCloseDate;
        if (body.notes !== undefined) updates.notes = body.notes;
        if (body.assignedTo !== undefined) updates.assigned_to = body.assignedTo;

        // Auto-set probability from stage
        if (body.stageId && body.probability === undefined) {
            const { data: stage } = await adminClient
                .from('deal_stages')
                .select('probability, is_won, is_lost')
                .eq('id', body.stageId)
                .maybeSingle();

            if (stage) {
                updates.probability = stage.probability;
                if (stage.is_won) updates.status = 'won';
                if (stage.is_lost) updates.status = 'lost';
            }
        }

        if (Object.keys(updates).length === 0) return errorResponse('No fields to update');

        const { data, error } = await adminClient
            .from('opportunities')
            .update(updates)
            .eq('id', oppMatch[1])
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        // If won, update client revenue
        if (updates.status === 'won' && data.client_id && data.value) {
            await adminClient.rpc('increment_client_revenue', {
                p_client_id: data.client_id,
                p_amount: data.value,
            }).then(() => { }, () => {
                // Fallback: manual update
                adminClient.from('clients')
                    .select('total_revenue')
                    .eq('id', data.client_id)
                    .single()
                    .then(({ data: c }) => {
                        if (c) {
                            adminClient.from('clients')
                                .update({ total_revenue: (c.total_revenue || 0) + data.value })
                                .eq('id', data.client_id);
                        }
                    });
            });
        }

        return jsonResponse({ opportunity: data });
    }

    // ─── Activities ───────────────────────────────────────────────────────

    if (path === '/api/crm/activities' && request.method === 'GET') {
        const url = new URL(request.url);
        const clientId = url.searchParams.get('clientId');
        const leadId = url.searchParams.get('leadId');
        const status = url.searchParams.get('status');
        const type = url.searchParams.get('type');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        let query = adminClient
            .from('crm_activities')
            .select(`
        id, activity_type, subject, description, due_date, completed_at, status,
        client_id, clients(name),
        lead_id, leads(name),
        assigned_to, profiles!crm_activities_assigned_to_fkey(full_name),
        created_by, created_at
      `, { count: 'exact' })
            .eq('company_id', companyId);

        if (clientId) query = query.eq('client_id', clientId);
        if (leadId) query = query.eq('lead_id', leadId);
        if (status) query = query.eq('status', status);
        if (type) query = query.eq('activity_type', type);

        query = query
            .order('due_date', { ascending: true, nullsFirst: false })
            .range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ activities: data ?? [], total: count ?? 0, page, limit });
    }

    if (path === '/api/crm/activities' && request.method === 'POST') {
        const body = (await request.json()) as {
            activityType: string;
            subject: string;
            description?: string;
            clientId?: string;
            leadId?: string;
            opportunityId?: string;
            dueDate?: string;
            assignedTo?: string;
        };

        if (!body.activityType || !body.subject) return errorResponse('Missing required fields');

        const { data, error } = await adminClient
            .from('crm_activities')
            .insert({
                company_id: companyId,
                activity_type: body.activityType,
                subject: body.subject,
                description: body.description,
                client_id: body.clientId,
                lead_id: body.leadId,
                opportunity_id: body.opportunityId,
                due_date: body.dueDate,
                assigned_to: body.assignedTo || userId,
                created_by: userId,
                status: 'pending',
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ activity: data }, 201);
    }

    const activityMatch = path.match(/^\/api\/crm\/activities\/([0-9a-f-]+)$/);
    if (activityMatch && request.method === 'PATCH') {
        const body = (await request.json()) as Partial<{
            status: 'completed' | 'cancelled';
            description: string;
        }>;

        const updates: Record<string, unknown> = {};
        if (body.status !== undefined) {
            updates.status = body.status;
            if (body.status === 'completed') {
                updates.completed_at = new Date().toISOString();
            }
        }
        if (body.description !== undefined) updates.description = body.description;

        const { data, error } = await adminClient
            .from('crm_activities')
            .update(updates)
            .eq('id', activityMatch[1])
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ activity: data });
    }

    // ─── Deal Stages ──────────────────────────────────────────────────────

    if (path === '/api/crm/deal-stages' && request.method === 'GET') {
        const { data, error } = await adminClient
            .from('deal_stages')
            .select('*')
            .eq('company_id', companyId)
            .order('sort_order');

        if (error) return errorResponse(error.message, 500);

        // Count opportunities per stage
        const { data: oppCounts } = await adminClient
            .from('opportunities')
            .select('stage_id, value')
            .eq('company_id', companyId)
            .eq('status', 'open');

        const stageStats: Record<string, { count: number; value: number }> = {};
        for (const o of oppCounts ?? []) {
            if (o.stage_id) {
                if (!stageStats[o.stage_id]) stageStats[o.stage_id] = { count: 0, value: 0 };
                stageStats[o.stage_id].count++;
                stageStats[o.stage_id].value += o.value || 0;
            }
        }

        const stages = (data ?? []).map((s: any) => ({
            ...s,
            opportunityCount: stageStats[s.id]?.count ?? 0,
            totalValue: stageStats[s.id]?.value ?? 0,
        }));

        return jsonResponse({ stages });
    }

    if (path === '/api/crm/deal-stages' && request.method === 'POST') {
        if (!hasCRMWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as {
            name: string;
            nameAr?: string;
            sortOrder: number;
            color?: string;
            probability?: number;
            isWon?: boolean;
            isLost?: boolean;
        };

        if (!body.name) return errorResponse('Missing stage name');

        const { data, error } = await adminClient
            .from('deal_stages')
            .insert({
                company_id: companyId,
                name: body.name,
                name_ar: body.nameAr,
                sort_order: body.sortOrder ?? 0,
                color: body.color ?? '#3B82F6',
                probability: body.probability ?? 0,
                is_won: body.isWon ?? false,
                is_lost: body.isLost ?? false,
                is_active: true,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ stage: data }, 201);
    }

    // ─── Quotes ───────────────────────────────────────────────────────────

    if (path === '/api/crm/quotes' && request.method === 'GET') {
        const url = new URL(request.url);
        const clientId = url.searchParams.get('clientId');
        const status = url.searchParams.get('status');

        let query = adminClient
            .from('quotes')
            .select(`
        id, title, total_amount, status, valid_until, created_at,
        client_id, clients(name)
      `)
            .eq('company_id', companyId);

        if (clientId) query = query.eq('client_id', clientId);
        if (status) query = query.eq('status', status);

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ quotes: data ?? [] });
    }

    if (path === '/api/crm/quotes' && request.method === 'POST') {
        if (!hasCRMWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as {
            clientId: string;
            title: string;
            items: Array<{
                description: string;
                quantity: number;
                unitPrice: number;
            }>;
            validUntil?: string;
            notes?: string;
        };

        if (!body.clientId || !body.title || !body.items?.length) {
            return errorResponse('Missing required fields');
        }

        const totalAmount = body.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0,
        );

        const { data, error } = await adminClient
            .from('quotes')
            .insert({
                company_id: companyId,
                client_id: body.clientId,
                title: body.title,
                total_amount: totalAmount,
                items_json: body.items,
                valid_until: body.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                notes: body.notes,
                status: 'draft',
                created_by: userId,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        await adminClient.from('audit_log').insert({
            company_id: companyId,
            user_id: userId,
            action: 'crm.quote.created',
            entity_type: 'quote',
            entity_id: data.id,
            details: { clientId: body.clientId, totalAmount },
        }).then(() => { }, () => { });

        return jsonResponse({ quote: data }, 201);
    }

    return errorResponse('Not found', 404);
}

// ─── Permission helpers ─────────────────────────────────────────────────────

function hasCRMWriteAccess(role: string): boolean {
    const writeRoles = [
        'company_gm', 'assistant_gm', 'department_head',
        'sales_manager', 'sales_rep', 'crm_admin',
    ];
    return writeRoles.includes(role);
}
