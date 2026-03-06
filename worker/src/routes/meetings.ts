/**
 * Meetings Module Worker Routes
 *
 * Endpoints:
 *   GET    /api/meetings/list                     — list meetings
 *   POST   /api/meetings/create                   — create meeting
 *   GET    /api/meetings/:id                      — get meeting detail
 *   PATCH  /api/meetings/:id                      — update meeting
 *   DELETE /api/meetings/:id                      — cancel meeting
 *
 *   GET    /api/meetings/:id/participants         — list participants
 *   POST   /api/meetings/:id/participants         — add participants
 *   PATCH  /api/meetings/:id/rsvp                 — RSVP to meeting
 *
 *   POST   /api/meetings/:id/start                — start meeting session
 *   POST   /api/meetings/:id/end                  — end meeting session
 *
 *   GET    /api/meetings/rooms                    — list meeting rooms
 *   POST   /api/meetings/rooms                    — create meeting room
 *
 *   GET    /api/meetings/:id/transcript           — get transcript
 *   GET    /api/meetings/:id/summary              — get AI summary
 *
 *   GET    /api/meetings/stats                    — meetings dashboard stats
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient } from '../supabase';

export async function handleMeetings(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    const { userId, supabase } = await requireAuth(request, env);

    const { data: membership } = await supabase
        .from('company_members')
        .select('id, company_id, role')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

    if (!membership) return errorResponse('No active company membership', 403);

    const companyId = membership.company_id;
    const memberId = membership.id;
    const adminClient = createAdminClient(env);

    // ─── Stats ─────────────────────────────────────────────────────────

    if (path === '/api/meetings/stats' && request.method === 'GET') {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const { data: allMeetings } = await adminClient
            .from('meetings')
            .select('id, status, start_time')
            .eq('company_id', companyId)
            .gte('start_time', todayStr);

        const m = allMeetings ?? [];
        return jsonResponse({
            total: m.length,
            today: m.filter((x: any) => x.start_time?.startsWith(todayStr)).length,
            this_week: m.filter((x: any) => new Date(x.start_time) <= weekEnd).length,
            scheduled: m.filter((x: any) => x.status === 'scheduled').length,
            in_progress: m.filter((x: any) => x.status === 'in_progress').length,
            completed: m.filter((x: any) => x.status === 'completed').length,
        });
    }

    // ─── Meeting Rooms ─────────────────────────────────────────────────

    if (path === '/api/meetings/rooms' && request.method === 'GET') {
        const { data, error } = await adminClient
            .from('meeting_rooms')
            .select('id, name, room_type, capacity, location, equipment, is_active')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('name');

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ rooms: data ?? [] });
    }

    if (path === '/api/meetings/rooms' && request.method === 'POST') {
        const body = await request.json() as any;
        const { name, room_type, capacity, location, equipment } = body;

        if (!name?.trim()) return errorResponse('Room name is required', 400);

        const { data, error } = await adminClient
            .from('meeting_rooms')
            .insert({
                company_id: companyId,
                name: name.trim(),
                room_type: room_type || 'virtual',
                capacity: capacity || null,
                location: location || null,
                equipment: equipment || [],
                is_active: true,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ room: data }, 201);
    }

    // ─── Meetings List ─────────────────────────────────────────────────

    if (path === '/api/meetings/list' && request.method === 'GET') {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

        let query = adminClient
            .from('meetings')
            .select(`
                id, title, description, start_time, end_time,
                meeting_link, status, created_at,
                created_by, company_members!inner(
                    profiles!inner(full_name, avatar_url)
                )
            `, { count: 'exact' })
            .eq('company_id', companyId);

        if (status && status !== 'all') query = query.eq('status', status);
        if (from) query = query.gte('start_time', from);
        if (to) query = query.lte('start_time', to);

        query = query
            .order('start_time', { ascending: true })
            .range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);

        // Get participant counts
        const meetings = [];
        for (const mtg of data ?? []) {
            const { count: partCount } = await adminClient
                .from('meeting_participants')
                .select('id', { count: 'exact', head: true })
                .eq('meeting_id', mtg.id);

            meetings.push({
                ...mtg,
                participant_count: partCount ?? 0,
            });
        }

        return jsonResponse({ meetings, total: count ?? 0, page, limit });
    }

    // POST /api/meetings/create
    if (path === '/api/meetings/create' && request.method === 'POST') {
        const body = await request.json() as any;
        const {
            title, description, start_time, end_time,
            room_id, participant_ids,
        } = body;

        if (!title?.trim()) return errorResponse('Meeting title is required', 400);
        if (!start_time) return errorResponse('Start time is required', 400);

        // Generate a meeting link
        const meetingCode = crypto.randomUUID().slice(0, 8);
        const meetingLink = `https://meet.zien-ai.app/${meetingCode}`;

        const { data: meeting, error } = await adminClient
            .from('meetings')
            .insert({
                company_id: companyId,
                created_by: memberId,
                title: title.trim(),
                description: description || null,
                start_time,
                end_time: end_time || null,
                meeting_link: meetingLink,
                status: 'scheduled',
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        // Add creator as participant
        await adminClient.from('meeting_participants').insert({
            meeting_id: meeting.id,
            member_id: memberId,
            rsvp: 'accepted',
        });

        // Add other participants
        if (participant_ids?.length) {
            const rows = participant_ids
                .filter((id: string) => id !== memberId)
                .map((id: string) => ({
                    meeting_id: meeting.id,
                    member_id: id,
                    rsvp: 'pending',
                }));
            if (rows.length > 0) {
                await adminClient.from('meeting_participants').insert(rows);
            }
        }

        // Create session record if room provided
        if (room_id) {
            await adminClient.from('meeting_sessions').insert({
                meeting_id: meeting.id,
                room_id,
                provider: 'vonage',
            });
        }

        return jsonResponse({ meeting }, 201);
    }

    // GET /api/meetings/:id
    const meetingMatch = path.match(/^\/api\/meetings\/([0-9a-f-]+)$/);
    if (meetingMatch && request.method === 'GET') {
        const meetingId = meetingMatch[1];

        const { data, error } = await adminClient
            .from('meetings')
            .select(`
                id, title, description, start_time, end_time,
                meeting_link, status, created_at,
                created_by, company_members(profiles(full_name, avatar_url))
            `)
            .eq('id', meetingId)
            .eq('company_id', companyId)
            .single();

        if (error || !data) return errorResponse('Meeting not found', 404);

        // Get participants
        const { data: participants } = await adminClient
            .from('meeting_participants')
            .select(`
                id, rsvp, attended, joined_at, left_at,
                member_id,
                company_members!inner(
                    profiles!inner(full_name, email, avatar_url)
                )
            `)
            .eq('meeting_id', meetingId);

        // Get session info
        const { data: session } = await adminClient
            .from('meeting_sessions')
            .select('id, provider, session_token, recording_url, actual_start, actual_end, duration_minutes, participant_count')
            .eq('meeting_id', meetingId)
            .maybeSingle();

        return jsonResponse({
            meeting: data,
            participants: participants ?? [],
            session: session || null,
        });
    }

    // PATCH /api/meetings/:id
    if (meetingMatch && request.method === 'PATCH') {
        const meetingId = meetingMatch[1];
        const body = await request.json() as any;
        const allowed = ['title', 'description', 'start_time', 'end_time', 'status'];
        const updates: Record<string, unknown> = {};
        for (const key of allowed) {
            if (body[key] !== undefined) updates[key] = body[key];
        }

        const { data, error } = await adminClient
            .from('meetings')
            .update(updates)
            .eq('id', meetingId)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ meeting: data });
    }

    // DELETE /api/meetings/:id (cancel)
    if (meetingMatch && request.method === 'DELETE') {
        const meetingId = meetingMatch[1];

        const { error } = await adminClient
            .from('meetings')
            .update({ status: 'cancelled' })
            .eq('id', meetingId)
            .eq('company_id', companyId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ cancelled: true });
    }

    // ─── Participants ──────────────────────────────────────────────────

    const participantsMatch = path.match(/^\/api\/meetings\/([0-9a-f-]+)\/participants$/);

    if (participantsMatch && request.method === 'GET') {
        const meetingId = participantsMatch[1];

        const { data, error } = await adminClient
            .from('meeting_participants')
            .select(`
                id, rsvp, attended, joined_at, left_at,
                member_id,
                company_members!inner(
                    user_id, role,
                    profiles!inner(full_name, email, avatar_url)
                )
            `)
            .eq('meeting_id', meetingId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ participants: data ?? [] });
    }

    if (participantsMatch && request.method === 'POST') {
        const meetingId = participantsMatch[1];
        const body = await request.json() as any;
        const { member_ids } = body;

        if (!member_ids?.length) return errorResponse('member_ids required', 400);

        const rows = member_ids.map((id: string) => ({
            meeting_id: meetingId,
            member_id: id,
            rsvp: 'pending',
        }));

        const { error } = await adminClient
            .from('meeting_participants')
            .upsert(rows, { onConflict: 'meeting_id,member_id' });

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ added: member_ids.length }, 201);
    }

    // PATCH /api/meetings/:id/rsvp
    const rsvpMatch = path.match(/^\/api\/meetings\/([0-9a-f-]+)\/rsvp$/);
    if (rsvpMatch && request.method === 'PATCH') {
        const meetingId = rsvpMatch[1];
        const body = await request.json() as any;
        const { rsvp } = body;

        if (!['pending', 'accepted', 'declined', 'tentative'].includes(rsvp)) {
            return errorResponse('Invalid RSVP value', 400);
        }

        const { data, error } = await adminClient
            .from('meeting_participants')
            .update({ rsvp })
            .eq('meeting_id', meetingId)
            .eq('member_id', memberId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ rsvp: data });
    }

    // ─── Session Control ───────────────────────────────────────────────

    // POST /api/meetings/:id/start
    const startMatch = path.match(/^\/api\/meetings\/([0-9a-f-]+)\/start$/);
    if (startMatch && request.method === 'POST') {
        const meetingId = startMatch[1];

        // Update meeting status
        await adminClient
            .from('meetings')
            .update({ status: 'in_progress' })
            .eq('id', meetingId)
            .eq('company_id', companyId);

        // Create/update session with Vonage token placeholder
        const sessionToken = `session_${crypto.randomUUID()}`;

        const { data: session } = await adminClient
            .from('meeting_sessions')
            .upsert(
                {
                    meeting_id: meetingId,
                    provider: 'vonage',
                    session_token: sessionToken,
                    actual_start: new Date().toISOString(),
                },
                { onConflict: 'meeting_id' },
            )
            .select()
            .single();

        // Mark current user as joined
        await adminClient
            .from('meeting_participants')
            .update({ attended: true, joined_at: new Date().toISOString() })
            .eq('meeting_id', meetingId)
            .eq('member_id', memberId);

        return jsonResponse({
            session: session || { session_token: sessionToken },
            meeting_link: `https://meet.zien-ai.app/${meetingId}`,
        });
    }

    // POST /api/meetings/:id/end
    const endMatch = path.match(/^\/api\/meetings\/([0-9a-f-]+)\/end$/);
    if (endMatch && request.method === 'POST') {
        const meetingId = endMatch[1];

        // Update meeting status
        await adminClient
            .from('meetings')
            .update({ status: 'completed' })
            .eq('id', meetingId)
            .eq('company_id', companyId);

        // Update session end time
        const { data: session } = await adminClient
            .from('meeting_sessions')
            .select('actual_start')
            .eq('meeting_id', meetingId)
            .maybeSingle();

        const now = new Date();
        const durationMin = session?.actual_start
            ? Math.round((now.getTime() - new Date(session.actual_start).getTime()) / 60000)
            : 0;

        // Count participants who attended
        const { count: partCount } = await adminClient
            .from('meeting_participants')
            .select('id', { count: 'exact', head: true })
            .eq('meeting_id', meetingId)
            .eq('attended', true);

        await adminClient
            .from('meeting_sessions')
            .update({
                actual_end: now.toISOString(),
                duration_minutes: durationMin,
                participant_count: partCount ?? 0,
            })
            .eq('meeting_id', meetingId);

        return jsonResponse({ ended: true, duration_minutes: durationMin });
    }

    // ─── Transcript & Summary ──────────────────────────────────────────

    const transcriptMatch = path.match(/^\/api\/meetings\/([0-9a-f-]+)\/transcript$/);
    if (transcriptMatch && request.method === 'GET') {
        const meetingId = transcriptMatch[1];

        const { data, error } = await adminClient
            .from('meeting_transcripts')
            .select('id, language, raw_text, formatted_text, created_at')
            .eq('meeting_id', meetingId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ transcript: data });
    }

    const summaryMatch = path.match(/^\/api\/meetings\/([0-9a-f-]+)\/summary$/);
    if (summaryMatch && request.method === 'GET') {
        const meetingId = summaryMatch[1];

        const { data, error } = await adminClient
            .from('meeting_summaries')
            .select('id, summary, action_items, decisions, created_at')
            .eq('meeting_id', meetingId)
            .maybeSingle();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ summary: data });
    }

    return errorResponse('Not found', 404);
}
