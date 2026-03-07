/**
 * Projects Module Worker Routes
 *
 * Endpoints:
 *   GET    /api/projects/list                        — list projects
 *   POST   /api/projects/create                      — create project
 *   GET    /api/projects/:id                         — get project detail
 *   PATCH  /api/projects/:id                         — update project
 *   DELETE /api/projects/:id                         — archive project
 *
 *   GET    /api/projects/:id/members                 — list project members
 *   POST   /api/projects/:id/members                 — add members
 *   DELETE /api/projects/:id/members/:memberId       — remove member
 *
 *   GET    /api/projects/:id/tasks                   — list tasks for project
 *   POST   /api/projects/tasks                       — create task
 *   GET    /api/projects/tasks/:id                   — get task detail
 *   PATCH  /api/projects/tasks/:id                   — update task
 *   DELETE /api/projects/tasks/:id                   — delete task
 *
 *   GET    /api/projects/tasks/:id/comments          — list task comments
 *   POST   /api/projects/tasks/:id/comments          — add comment
 *
 *   GET    /api/projects/:id/work-logs               — list work logs
 *   POST   /api/projects/work-logs                   — log work
 *
 *   GET    /api/projects/stats                       — project stats/dashboard
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient, discoverMembership } from '../supabase';

export async function handleProjects(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    const { userId, supabase } = await requireAuth(request, env);

    const membership = await discoverMembership(env, userId);

    if (!membership) return errorResponse('No active company membership', 403);

    const companyId = membership.company_id;
    const memberId = membership.id;
    const userRole = membership.role;
    const adminClient = createAdminClient(env);

    // ─── Project Stats ─────────────────────────────────────────────────

    if (path === '/api/projects/stats' && request.method === 'GET') {
        const { data: projects } = await adminClient
            .from('projects')
            .select('id, status')
            .eq('company_id', companyId);

        const all = projects ?? [];
        const stats = {
            total: all.length,
            planning: all.filter((p: any) => p.status === 'planning').length,
            active: all.filter((p: any) => p.status === 'active').length,
            completed: all.filter((p: any) => p.status === 'completed').length,
            on_hold: all.filter((p: any) => p.status === 'on_hold').length,
        };

        // Task stats
        const { data: tasks } = await adminClient
            .from('tasks')
            .select('id, status')
            .eq('company_id', companyId);

        const allTasks = tasks ?? [];
        const taskStats = {
            total: allTasks.length,
            todo: allTasks.filter((t: any) => t.status === 'todo').length,
            in_progress: allTasks.filter((t: any) => t.status === 'in_progress').length,
            in_review: allTasks.filter((t: any) => t.status === 'in_review').length,
            done: allTasks.filter((t: any) => t.status === 'done').length,
        };

        return jsonResponse({ projects: stats, tasks: taskStats });
    }

    // ─── Projects List ─────────────────────────────────────────────────

    if (path === '/api/projects/list' && request.method === 'GET') {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const search = url.searchParams.get('search');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

        let query = adminClient
            .from('projects')
            .select(`
                id, name, description, status, start_date, end_date, budget,
                client_id, clients(name),
                created_at
            `, { count: 'exact' })
            .eq('company_id', companyId);

        if (status && status !== 'all') query = query.eq('status', status);
        if (search) query = query.ilike('name', `%${search}%`);

        query = query
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);

        // Enrich with task counts and team size
        const projects = [];
        for (const proj of data ?? []) {
            const { count: taskTotal } = await adminClient
                .from('tasks')
                .select('id', { count: 'exact', head: true })
                .eq('project_id', proj.id);

            const { count: taskDone } = await adminClient
                .from('tasks')
                .select('id', { count: 'exact', head: true })
                .eq('project_id', proj.id)
                .eq('status', 'done');

            const { count: teamCount } = await adminClient
                .from('project_members')
                .select('id', { count: 'exact', head: true })
                .eq('project_id', proj.id);

            projects.push({
                ...proj,
                task_count: taskTotal ?? 0,
                task_done: taskDone ?? 0,
                team_count: teamCount ?? 0,
                progress: taskTotal ? Math.round(((taskDone ?? 0) / taskTotal) * 100) : 0,
            });
        }

        return jsonResponse({ projects, total: count ?? 0, page, limit });
    }

    // POST /api/projects/create
    if (path === '/api/projects/create' && request.method === 'POST') {
        const body = await request.json() as any;
        const { name, description, client_id, start_date, end_date, budget, status: projStatus } = body;

        if (!name?.trim()) return errorResponse('Project name is required', 400);

        const { data: project, error } = await adminClient
            .from('projects')
            .insert({
                company_id: companyId,
                name: name.trim(),
                description: description || null,
                client_id: client_id || null,
                start_date: start_date || null,
                end_date: end_date || null,
                budget: budget || null,
                status: projStatus || 'planning',
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        // Add creator as project manager
        await adminClient.from('project_members').insert({
            project_id: project.id,
            member_id: memberId,
            role: 'manager',
        });

        return jsonResponse({ project }, 201);
    }

    // GET /api/projects/:id
    const projectMatch = path.match(/^\/api\/projects\/([0-9a-f-]+)$/);
    if (projectMatch && request.method === 'GET') {
        const projectId = projectMatch[1];

        const { data, error } = await adminClient
            .from('projects')
            .select(`
                id, name, description, status, start_date, end_date, budget,
                client_id, clients(name),
                created_at
            `)
            .eq('id', projectId)
            .eq('company_id', companyId)
            .single();

        if (error || !data) return errorResponse('Project not found', 404);

        // Get task stats
        const { count: taskTotal } = await adminClient
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId);

        const { count: taskDone } = await adminClient
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('status', 'done');

        const { data: members } = await adminClient
            .from('project_members')
            .select(`
                id, role, joined_at,
                company_members!inner(
                    user_id, role,
                    profiles!inner(full_name, email, avatar_url)
                )
            `)
            .eq('project_id', projectId);

        return jsonResponse({
            project: {
                ...data,
                task_count: taskTotal ?? 0,
                task_done: taskDone ?? 0,
                progress: taskTotal ? Math.round(((taskDone ?? 0) / taskTotal) * 100) : 0,
            },
            members: members ?? [],
        });
    }

    // PATCH /api/projects/:id
    if (projectMatch && request.method === 'PATCH') {
        const projectId = projectMatch[1];
        const body = await request.json() as any;
        const allowed = ['name', 'description', 'status', 'start_date', 'end_date', 'budget', 'client_id'];
        const updates: Record<string, unknown> = {};
        for (const key of allowed) {
            if (body[key] !== undefined) updates[key] = body[key];
        }

        const { data, error } = await adminClient
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ project: data });
    }

    // DELETE /api/projects/:id
    if (projectMatch && request.method === 'DELETE') {
        const projectId = projectMatch[1];

        const { error } = await adminClient
            .from('projects')
            .update({ status: 'cancelled' })
            .eq('id', projectId)
            .eq('company_id', companyId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ cancelled: true });
    }

    // ─── Project Members ───────────────────────────────────────────────

    const projMembersMatch = path.match(/^\/api\/projects\/([0-9a-f-]+)\/members$/);

    if (projMembersMatch && request.method === 'GET') {
        const projectId = projMembersMatch[1];

        const { data, error } = await adminClient
            .from('project_members')
            .select(`
                id, role, joined_at,
                company_members!inner(
                    id, user_id, role,
                    profiles!inner(full_name, email, avatar_url)
                )
            `)
            .eq('project_id', projectId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ members: data ?? [] });
    }

    if (projMembersMatch && request.method === 'POST') {
        const projectId = projMembersMatch[1];
        const body = await request.json() as any;
        const { member_ids, role } = body;

        if (!member_ids?.length) return errorResponse('member_ids required', 400);

        const rows = member_ids.map((id: string) => ({
            project_id: projectId,
            member_id: id,
            role: role || 'member',
        }));

        const { error } = await adminClient
            .from('project_members')
            .upsert(rows, { onConflict: 'project_id,member_id' });

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ added: member_ids.length }, 201);
    }

    const removeProjMemberMatch = path.match(/^\/api\/projects\/([0-9a-f-]+)\/members\/([0-9a-f-]+)$/);
    if (removeProjMemberMatch && request.method === 'DELETE') {
        const [, projectId, targetMemberId] = removeProjMemberMatch;

        const { error } = await adminClient
            .from('project_members')
            .delete()
            .eq('project_id', projectId)
            .eq('member_id', targetMemberId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ removed: true });
    }

    // ─── Tasks ─────────────────────────────────────────────────────────

    const projTasksMatch = path.match(/^\/api\/projects\/([0-9a-f-]+)\/tasks$/);

    // GET /api/projects/:id/tasks
    if (projTasksMatch && request.method === 'GET') {
        const projectId = projTasksMatch[1];
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const assignee = url.searchParams.get('assignee');
        const priority = url.searchParams.get('priority');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        let query = adminClient
            .from('tasks')
            .select(`
                id, title, description, priority, status, due_date,
                estimated_hours, actual_hours, tags, parent_task_id,
                assigned_to,
                company_members(
                    profiles(full_name, avatar_url)
                ),
                created_by, created_at, updated_at
            `, { count: 'exact' })
            .eq('project_id', projectId)
            .eq('company_id', companyId);

        if (status && status !== 'all') query = query.eq('status', status);
        if (assignee) query = query.eq('assigned_to', assignee);
        if (priority) query = query.eq('priority', priority);

        query = query
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ tasks: data ?? [], total: count ?? 0, page, limit });
    }

    // POST /api/projects/tasks
    if (path === '/api/projects/tasks' && request.method === 'POST') {
        const body = await request.json() as any;
        const {
            project_id, title, description, assigned_to, priority,
            status: taskStatus, due_date, estimated_hours, tags, parent_task_id,
        } = body;

        if (!title?.trim()) return errorResponse('Task title is required', 400);

        const { data: task, error } = await adminClient
            .from('tasks')
            .insert({
                company_id: companyId,
                project_id: project_id || null,
                parent_task_id: parent_task_id || null,
                title: title.trim(),
                description: description || null,
                assigned_to: assigned_to || null,
                priority: priority || 'medium',
                status: taskStatus || 'todo',
                due_date: due_date || null,
                estimated_hours: estimated_hours || null,
                tags: tags || [],
                created_by: userId,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ task }, 201);
    }

    // GET /api/projects/tasks/:id
    const taskMatch = path.match(/^\/api\/projects\/tasks\/([0-9a-f-]+)$/);
    if (taskMatch && request.method === 'GET') {
        const taskId = taskMatch[1];

        const { data, error } = await adminClient
            .from('tasks')
            .select(`
                id, title, description, priority, status, due_date,
                estimated_hours, actual_hours, tags, parent_task_id,
                project_id, projects(name),
                assigned_to,
                company_members(
                    profiles(full_name, avatar_url)
                ),
                created_by, created_at, updated_at
            `)
            .eq('id', taskId)
            .eq('company_id', companyId)
            .single();

        if (error || !data) return errorResponse('Task not found', 404);
        return jsonResponse({ task: data });
    }

    // PATCH /api/projects/tasks/:id
    if (taskMatch && request.method === 'PATCH') {
        const taskId = taskMatch[1];
        const body = await request.json() as any;
        const allowed = [
            'title', 'description', 'assigned_to', 'priority', 'status',
            'due_date', 'estimated_hours', 'actual_hours', 'tags', 'parent_task_id',
        ];
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        for (const key of allowed) {
            if (body[key] !== undefined) updates[key] = body[key];
        }

        const { data, error } = await adminClient
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ task: data });
    }

    // DELETE /api/projects/tasks/:id
    if (taskMatch && request.method === 'DELETE') {
        const taskId = taskMatch[1];

        const { error } = await adminClient
            .from('tasks')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', taskId)
            .eq('company_id', companyId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ cancelled: true });
    }

    // ─── Task Comments ─────────────────────────────────────────────────

    const taskCommentsMatch = path.match(/^\/api\/projects\/tasks\/([0-9a-f-]+)\/comments$/);

    if (taskCommentsMatch && request.method === 'GET') {
        const taskId = taskCommentsMatch[1];

        const { data, error } = await adminClient
            .from('task_comments')
            .select(`
                id, body, attachments, created_at, updated_at,
                author_id, profiles!inner(full_name, avatar_url)
            `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ comments: data ?? [] });
    }

    if (taskCommentsMatch && request.method === 'POST') {
        const taskId = taskCommentsMatch[1];
        const body = await request.json() as any;

        if (!body.text?.trim()) return errorResponse('Comment body required', 400);

        const { data, error } = await adminClient
            .from('task_comments')
            .insert({
                task_id: taskId,
                author_id: userId,
                body: body.text.trim(),
                attachments: body.attachments || [],
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ comment: data }, 201);
    }

    // ─── Work Logs ─────────────────────────────────────────────────────

    const workLogsMatch = path.match(/^\/api\/projects\/([0-9a-f-]+)\/work-logs$/);

    if (workLogsMatch && request.method === 'GET') {
        const projectId = workLogsMatch[1];
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        const { data, error, count } = await adminClient
            .from('work_logs')
            .select(`
                id, hours, description, log_date, created_at,
                task_id, tasks(title),
                member_id,
                company_members!inner(
                    profiles!inner(full_name, avatar_url)
                )
            `, { count: 'exact' })
            .eq('project_id', projectId)
            .eq('company_id', companyId)
            .order('log_date', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ work_logs: data ?? [], total: count ?? 0, page, limit });
    }

    if (path === '/api/projects/work-logs' && request.method === 'POST') {
        const body = await request.json() as any;
        const { task_id, project_id, hours, description, log_date } = body;

        if (!hours || hours <= 0) return errorResponse('Hours must be positive', 400);

        const { data, error } = await adminClient
            .from('work_logs')
            .insert({
                company_id: companyId,
                task_id: task_id || null,
                project_id: project_id || null,
                member_id: memberId,
                hours,
                description: description || null,
                log_date: log_date || new Date().toISOString().slice(0, 10),
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        // Update actual_hours on task if linked
        if (task_id) {
            const { data: currentTask } = await adminClient
                .from('tasks')
                .select('actual_hours')
                .eq('id', task_id)
                .single();

            if (currentTask) {
                await adminClient
                    .from('tasks')
                    .update({ actual_hours: (currentTask.actual_hours || 0) + hours })
                    .eq('id', task_id);
            }
        }

        return jsonResponse({ work_log: data }, 201);
    }

    return errorResponse('Not found', 404);
}
