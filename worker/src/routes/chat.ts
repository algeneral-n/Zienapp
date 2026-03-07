/**
 * Chat Module Worker Routes
 *
 * Endpoints:
 *   GET    /api/chat/channels              — list channels for company
 *   POST   /api/chat/channels              — create channel
 *   GET    /api/chat/channels/:id          — get channel detail
 *   PATCH  /api/chat/channels/:id          — update channel
 *   DELETE /api/chat/channels/:id          — archive channel
 *
 *   GET    /api/chat/channels/:id/members  — list channel members
 *   POST   /api/chat/channels/:id/members  — add member to channel
 *   DELETE /api/chat/channels/:id/members/:memberId — remove member
 *
 *   GET    /api/chat/channels/:id/messages — list messages (paginated)
 *   POST   /api/chat/channels/:id/messages — send message
 *   PATCH  /api/chat/messages/:id          — edit message
 *   DELETE /api/chat/messages/:id          — soft-delete message
 *
 *   GET    /api/chat/dm/:memberId          — get or create DM channel
 *
 *   GET    /api/chat/presence              — get presence for company
 *   PUT    /api/chat/presence              — update own presence
 *
 *   GET    /api/chat/unread                — unread counts per channel
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient, discoverMembership } from '../supabase';

export async function handleChat(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    const { userId, supabase } = await requireAuth(request, env);

    // Resolve company (admin bypass RLS)
    const membership = await discoverMembership(env, userId);

    if (!membership) return errorResponse('No active company membership', 403);

    const companyId = membership.company_id;
    const memberId = membership.id;
    const adminClient = createAdminClient(env);

    // ─── Channels ──────────────────────────────────────────────────────

    // GET /api/chat/channels
    if (path === '/api/chat/channels' && request.method === 'GET') {
        const url = new URL(request.url);
        const type = url.searchParams.get('type'); // direct, group, department, announcement
        const search = url.searchParams.get('search');

        // Get channels user is a member of
        let query = adminClient
            .from('chat_channels')
            .select(`
                id, name, description, channel_type, is_archived, created_at, updated_at,
                chat_channel_members!inner(member_id, role, muted)
            `)
            .eq('company_id', companyId)
            .eq('chat_channel_members.member_id', memberId)
            .eq('is_archived', false)
            .order('updated_at', { ascending: false });

        if (type) query = query.eq('channel_type', type);
        if (search) query = query.ilike('name', `%${search}%`);

        const { data, error } = await query.limit(50);
        if (error) return errorResponse(error.message, 500);

        // Get last message for each channel
        const channelIds = (data ?? []).map((c: any) => c.id);
        const { data: lastMessages } = channelIds.length > 0
            ? await adminClient
                .from('chat_messages')
                .select('id, channel_id, body, sender_id, created_at, message_type')
                .in('channel_id', channelIds)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
            : { data: [] };

        // Group last message per channel
        const lastMsgMap: Record<string, any> = {};
        for (const msg of lastMessages ?? []) {
            if (!lastMsgMap[msg.channel_id]) {
                lastMsgMap[msg.channel_id] = msg;
            }
        }

        const channels = (data ?? []).map((ch: any) => ({
            ...ch,
            lastMessage: lastMsgMap[ch.id] || null,
            myRole: ch.chat_channel_members?.[0]?.role,
            muted: ch.chat_channel_members?.[0]?.muted ?? false,
        }));

        return jsonResponse({ channels });
    }

    // POST /api/chat/channels
    if (path === '/api/chat/channels' && request.method === 'POST') {
        const body = await request.json() as any;
        const { name, description, channel_type, department_id, member_ids } = body;

        if (!name?.trim()) return errorResponse('Channel name is required', 400);
        if (!['direct', 'group', 'department', 'announcement'].includes(channel_type || 'group')) {
            return errorResponse('Invalid channel type', 400);
        }

        const { data: channel, error } = await adminClient
            .from('chat_channels')
            .insert({
                company_id: companyId,
                name: name.trim(),
                description: description || null,
                channel_type: channel_type || 'group',
                department_id: department_id || null,
                created_by: userId,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        // Add creator as admin
        await adminClient.from('chat_channel_members').insert({
            channel_id: channel.id,
            member_id: memberId,
            role: 'admin',
        });

        // Add other members
        if (member_ids?.length) {
            const memberRows = member_ids
                .filter((id: string) => id !== memberId)
                .map((id: string) => ({
                    channel_id: channel.id,
                    member_id: id,
                    role: 'member',
                }));
            if (memberRows.length > 0) {
                await adminClient.from('chat_channel_members').insert(memberRows);
            }
        }

        return jsonResponse({ channel }, 201);
    }

    // GET /api/chat/channels/:id
    const channelMatch = path.match(/^\/api\/chat\/channels\/([0-9a-f-]+)$/);
    if (channelMatch && request.method === 'GET') {
        const channelId = channelMatch[1];

        const { data, error } = await adminClient
            .from('chat_channels')
            .select(`
                id, name, description, channel_type, is_archived, department_id,
                created_by, created_at, updated_at
            `)
            .eq('id', channelId)
            .eq('company_id', companyId)
            .single();

        if (error || !data) return errorResponse('Channel not found', 404);

        // Verify membership
        const { data: isMember } = await adminClient
            .from('chat_channel_members')
            .select('role')
            .eq('channel_id', channelId)
            .eq('member_id', memberId)
            .maybeSingle();

        if (!isMember) return errorResponse('Not a member of this channel', 403);

        return jsonResponse({ channel: data, myRole: isMember.role });
    }

    // PATCH /api/chat/channels/:id
    if (channelMatch && request.method === 'PATCH') {
        const channelId = channelMatch[1];
        const body = await request.json() as any;
        const updates: Record<string, unknown> = {};

        if (body.name !== undefined) updates.name = body.name;
        if (body.description !== undefined) updates.description = body.description;

        const { data, error } = await adminClient
            .from('chat_channels')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', channelId)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ channel: data });
    }

    // DELETE /api/chat/channels/:id (archive)
    if (channelMatch && request.method === 'DELETE') {
        const channelId = channelMatch[1];

        const { error } = await adminClient
            .from('chat_channels')
            .update({ is_archived: true, updated_at: new Date().toISOString() })
            .eq('id', channelId)
            .eq('company_id', companyId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ archived: true });
    }

    // ─── Channel Members ───────────────────────────────────────────────

    const membersMatch = path.match(/^\/api\/chat\/channels\/([0-9a-f-]+)\/members$/);

    // GET /api/chat/channels/:id/members
    if (membersMatch && request.method === 'GET') {
        const channelId = membersMatch[1];

        const { data, error } = await adminClient
            .from('chat_channel_members')
            .select(`
                id, role, muted, joined_at,
                company_members!inner(
                    id, user_id, role,
                    profiles!inner(full_name, email, avatar_url)
                )
            `)
            .eq('channel_id', channelId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ members: data ?? [] });
    }

    // POST /api/chat/channels/:id/members
    if (membersMatch && request.method === 'POST') {
        const channelId = membersMatch[1];
        const body = await request.json() as any;
        const { member_ids } = body;

        if (!member_ids?.length) return errorResponse('member_ids required', 400);

        const rows = member_ids.map((id: string) => ({
            channel_id: channelId,
            member_id: id,
            role: 'member',
        }));

        const { error } = await adminClient
            .from('chat_channel_members')
            .upsert(rows, { onConflict: 'channel_id,member_id' });

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ added: member_ids.length }, 201);
    }

    // DELETE /api/chat/channels/:id/members/:memberId
    const removeMemberMatch = path.match(/^\/api\/chat\/channels\/([0-9a-f-]+)\/members\/([0-9a-f-]+)$/);
    if (removeMemberMatch && request.method === 'DELETE') {
        const [, channelId, targetMemberId] = removeMemberMatch;

        const { error } = await adminClient
            .from('chat_channel_members')
            .delete()
            .eq('channel_id', channelId)
            .eq('member_id', targetMemberId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ removed: true });
    }

    // ─── Messages ──────────────────────────────────────────────────────

    const messagesMatch = path.match(/^\/api\/chat\/channels\/([0-9a-f-]+)\/messages$/);

    // GET /api/chat/channels/:id/messages
    if (messagesMatch && request.method === 'GET') {
        const channelId = messagesMatch[1];
        const url = new URL(request.url);
        const before = url.searchParams.get('before'); // cursor pagination
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        let query = adminClient
            .from('chat_messages')
            .select(`
                id, body, message_type, file_url, reply_to_id,
                is_edited, is_deleted, created_at, updated_at,
                sender_id,
                company_members!inner(
                    user_id, role,
                    profiles!inner(full_name, avatar_url)
                )
            `)
            .eq('channel_id', channelId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (before) query = query.lt('created_at', before);

        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({
            messages: (data ?? []).reverse(), // oldest first for display
            hasMore: (data ?? []).length === limit,
        });
    }

    // POST /api/chat/channels/:id/messages
    if (messagesMatch && request.method === 'POST') {
        const channelId = messagesMatch[1];
        const body = await request.json() as any;
        const { text, message_type, file_url, reply_to_id } = body;

        if (!text?.trim() && !file_url) return errorResponse('Message body required', 400);

        const { data: msg, error } = await adminClient
            .from('chat_messages')
            .insert({
                channel_id: channelId,
                sender_id: memberId,
                body: text?.trim() || '',
                message_type: message_type || 'text',
                file_url: file_url || null,
                reply_to_id: reply_to_id || null,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        // Update channel timestamp
        await adminClient
            .from('chat_channels')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', channelId);

        return jsonResponse({ message: msg }, 201);
    }

    // PATCH /api/chat/messages/:id
    const editMsgMatch = path.match(/^\/api\/chat\/messages\/([0-9a-f-]+)$/);
    if (editMsgMatch && request.method === 'PATCH') {
        const msgId = editMsgMatch[1];
        const body = await request.json() as any;

        const { data, error } = await adminClient
            .from('chat_messages')
            .update({
                body: body.text,
                is_edited: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', msgId)
            .eq('sender_id', memberId) // only sender can edit
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ message: data });
    }

    // DELETE /api/chat/messages/:id (soft delete)
    if (editMsgMatch && request.method === 'DELETE') {
        const msgId = editMsgMatch[1];

        const { error } = await adminClient
            .from('chat_messages')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', msgId)
            .eq('sender_id', memberId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ deleted: true });
    }

    // ─── Direct Messages ───────────────────────────────────────────────

    // GET /api/chat/dm/:memberId — get or create DM channel
    const dmMatch = path.match(/^\/api\/chat\/dm\/([0-9a-f-]+)$/);
    if (dmMatch && request.method === 'GET') {
        const targetMemberId = dmMatch[1];

        // Check if DM already exists between these two members
        const { data: existing } = await adminClient
            .from('chat_channels')
            .select(`
                id, name, channel_type,
                chat_channel_members(member_id)
            `)
            .eq('company_id', companyId)
            .eq('channel_type', 'direct')
            .eq('is_archived', false);

        const existingDM = (existing ?? []).find((ch: any) => {
            const memberIds = (ch.chat_channel_members ?? []).map((m: any) => m.member_id);
            return memberIds.length === 2 &&
                memberIds.includes(memberId) &&
                memberIds.includes(targetMemberId);
        });

        if (existingDM) {
            return jsonResponse({ channel: existingDM, created: false });
        }

        // Get target member name for channel name
        const { data: targetProfile } = await adminClient
            .from('company_members')
            .select('profiles!inner(full_name)')
            .eq('id', targetMemberId)
            .single();

        const targetName = (targetProfile as any)?.profiles?.full_name || 'Direct Message';

        // Create new DM channel
        const { data: newChannel, error } = await adminClient
            .from('chat_channels')
            .insert({
                company_id: companyId,
                name: `DM`,
                channel_type: 'direct',
                created_by: userId,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        // Add both members
        await adminClient.from('chat_channel_members').insert([
            { channel_id: newChannel.id, member_id: memberId, role: 'member' },
            { channel_id: newChannel.id, member_id: targetMemberId, role: 'member' },
        ]);

        return jsonResponse({ channel: newChannel, created: true }, 201);
    }

    // ─── Presence ──────────────────────────────────────────────────────

    // GET /api/chat/presence
    if (path === '/api/chat/presence' && request.method === 'GET') {
        const { data, error } = await adminClient
            .from('presence_status')
            .select(`
                status, custom_message, last_seen_at,
                member_id,
                company_members!inner(
                    user_id,
                    profiles!inner(full_name, avatar_url)
                )
            `)
            .eq('company_id', companyId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ presence: data ?? [] });
    }

    // PUT /api/chat/presence
    if (path === '/api/chat/presence' && request.method === 'PUT') {
        const body = await request.json() as any;
        const { status, custom_message } = body;

        if (status && !['online', 'away', 'busy', 'on_leave', 'offline'].includes(status)) {
            return errorResponse('Invalid status', 400);
        }

        const { data, error } = await adminClient
            .from('presence_status')
            .upsert(
                {
                    company_id: companyId,
                    member_id: memberId,
                    status: status || 'online',
                    custom_message: custom_message || null,
                    last_seen_at: new Date().toISOString(),
                },
                { onConflict: 'company_id,member_id' },
            )
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ presence: data });
    }

    // ─── Unread Counts ─────────────────────────────────────────────────

    if (path === '/api/chat/unread' && request.method === 'GET') {
        // Get all channels user is member of
        const { data: myChannels } = await adminClient
            .from('chat_channel_members')
            .select('channel_id, joined_at')
            .eq('member_id', memberId);

        if (!myChannels?.length) return jsonResponse({ unread: {} });

        const unread: Record<string, number> = {};
        for (const ch of myChannels) {
            const { count } = await adminClient
                .from('chat_messages')
                .select('id', { count: 'exact', head: true })
                .eq('channel_id', ch.channel_id)
                .eq('is_deleted', false)
                .neq('sender_id', memberId)
                .gt('created_at', ch.joined_at);

            unread[ch.channel_id] = count ?? 0;
        }

        return jsonResponse({ unread });
    }

    return errorResponse('Not found', 404);
}
