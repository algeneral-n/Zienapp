/**
 * Notification Rules Worker Routes
 *
 * Endpoints:
 *   GET    /api/notifications/rules       — list notification rules
 *   POST   /api/notifications/rules       — create notification rule
 *   PATCH  /api/notifications/rules/:id   — update notification rule
 *   DELETE /api/notifications/rules/:id   — delete notification rule
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient, discoverMembership } from '../supabase';

export async function handleNotifications(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    const { userId } = await requireAuth(request, env);
    const membership = await discoverMembership(env, userId);

    if (!membership) return errorResponse('No active company membership', 403);

    const companyId = membership.company_id;
    const userRole = membership.role;
    const adminClient = createAdminClient(env);

    const isAdmin = ['company_gm', 'assistant_gm', 'executive_secretary'].includes(userRole);

    // GET /api/notifications/rules — list rules for this company + platform defaults
    if (path === '/api/notifications/rules' && request.method === 'GET') {
        const { data, error } = await adminClient
            .from('notification_rules')
            .select('*')
            .or(`company_id.eq.${companyId},company_id.is.null`)
            .order('created_at', { ascending: false });

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ rules: data || [] });
    }

    // POST /api/notifications/rules — create company-specific rule
    if (path === '/api/notifications/rules' && request.method === 'POST') {
        if (!isAdmin) return errorResponse('Only admins can create notification rules', 403);

        const body = (await request.json()) as {
            eventType: string;
            moduleCode?: string;
            targetScope: string;
            targetValue: string;
            deliveryChannels?: string[];
            messageTemplateEn?: string;
            messageTemplateAr?: string;
            priority?: string;
            conditions?: Record<string, unknown>;
        };

        if (!body.eventType || !body.targetScope || !body.targetValue) {
            return errorResponse('eventType, targetScope, and targetValue are required', 400);
        }

        const { data, error } = await adminClient
            .from('notification_rules')
            .insert({
                company_id: companyId,
                event_type: body.eventType,
                module_code: body.moduleCode || null,
                target_scope: body.targetScope,
                target_value: body.targetValue,
                delivery_channels: body.deliveryChannels || ['in_app'],
                message_template_en: body.messageTemplateEn || null,
                message_template_ar: body.messageTemplateAr || null,
                priority: body.priority || 'normal',
                conditions: body.conditions || {},
                is_active: true,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ rule: data }, 201);
    }

    // PATCH /api/notifications/rules/:id — toggle / update
    const ruleMatch = path.match(/^\/api\/notifications\/rules\/([0-9a-f-]+)$/);
    if (ruleMatch && request.method === 'PATCH') {
        if (!isAdmin) return errorResponse('Only admins can update notification rules', 403);

        const body = (await request.json()) as Partial<{
            isActive: boolean;
            deliveryChannels: string[];
            messageTemplateEn: string;
            messageTemplateAr: string;
            priority: string;
            targetScope: string;
            targetValue: string;
            conditions: Record<string, unknown>;
        }>;

        const updates: Record<string, unknown> = {};
        if (body.isActive !== undefined) updates.is_active = body.isActive;
        if (body.deliveryChannels) updates.delivery_channels = body.deliveryChannels;
        if (body.messageTemplateEn !== undefined) updates.message_template_en = body.messageTemplateEn;
        if (body.messageTemplateAr !== undefined) updates.message_template_ar = body.messageTemplateAr;
        if (body.priority) updates.priority = body.priority;
        if (body.targetScope) updates.target_scope = body.targetScope;
        if (body.targetValue) updates.target_value = body.targetValue;
        if (body.conditions) updates.conditions = body.conditions;

        const { data, error } = await adminClient
            .from('notification_rules')
            .update(updates)
            .eq('id', ruleMatch[1])
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ rule: data });
    }

    // DELETE /api/notifications/rules/:id
    if (ruleMatch && request.method === 'DELETE') {
        if (!isAdmin) return errorResponse('Only admins can delete notification rules', 403);

        const { error } = await adminClient
            .from('notification_rules')
            .delete()
            .eq('id', ruleMatch[1])
            .eq('company_id', companyId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
}
