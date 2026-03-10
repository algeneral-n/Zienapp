/**
 * HR Module Worker Routes
 *
 * Endpoints:
 *   GET    /api/hr/employees          — list employees
 *   GET    /api/hr/employees/:id      — get employee detail
 *   POST   /api/hr/employees          — create employee
 *   PATCH  /api/hr/employees/:id      — update employee
 *
 *   GET    /api/hr/attendance          — list attendance records
 *   POST   /api/hr/attendance/clock    — clock in/out
 *
 *   GET    /api/hr/leaves              — list leave requests
 *   POST   /api/hr/leaves              — create leave request
 *   PATCH  /api/hr/leaves/:id          — approve/reject leave
 *
 *   GET    /api/hr/payroll             — list payroll records
 *   POST   /api/hr/payroll/run         — run payroll for period
 *
 *   GET    /api/hr/departments         — list departments
 *   POST   /api/hr/departments         — create department
 *
 *   GET    /api/hr/shifts              — list shifts
 *   POST   /api/hr/shifts              — create/update shift
 *
 *   GET    /api/hr/goals               — list employee goals
 *   POST   /api/hr/goals               — create goal
 *   PATCH  /api/hr/goals/:id           — update goal progress
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient, discoverMembership } from '../supabase';

export async function handleHR(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    const { userId, supabase } = await requireAuth(request, env);

    // Resolve company_id from user's membership
    const membership = await discoverMembership(env, userId);

    if (!membership) return errorResponse('No active company membership', 403);

    const companyId = membership.company_id;
    const userRole = membership.role;
    const adminClient = createAdminClient(env);

    // ─── Employees ─────────────────────────────────────────────────────────

    if (path === '/api/hr/employees' && request.method === 'GET') {
        const url = new URL(request.url);
        const departmentId = url.searchParams.get('departmentId');
        const status = url.searchParams.get('status') || 'active';
        const search = url.searchParams.get('search');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        let query = adminClient
            .from('employees')
            .select(`
        id, employee_code, job_title, salary, hire_date, status,
        department_id, departments(name),
        member_id, company_members!inner(
          user_id, role,
          profiles!inner(full_name, email, avatar_url, phone)
        )
      `, { count: 'exact' })
            .eq('company_id', companyId);

        if (status !== 'all') query = query.eq('status', status);
        if (departmentId) query = query.eq('department_id', departmentId);
        if (search) {
            query = query.or(`employee_code.ilike.%${search}%,job_title.ilike.%${search}%`);
        }

        query = query
            .order('hire_date', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({
            employees: data ?? [],
            total: count ?? 0,
            page,
            limit,
        });
    }

    // GET /api/hr/employees/:id
    const empMatch = path.match(/^\/api\/hr\/employees\/([0-9a-f-]+)$/);
    if (empMatch && request.method === 'GET') {
        const { data, error } = await adminClient
            .from('employees')
            .select(`
        *, departments(name),
        company_members!inner(
          user_id, role,
          profiles!inner(full_name, email, avatar_url, phone)
        ),
        employee_documents(id, document_type, file_url, created_at),
        employee_goals(id, title, status, target_value, current_value, due_date)
      `)
            .eq('id', empMatch[1])
            .eq('company_id', companyId)
            .single();

        if (error || !data) return errorResponse('Employee not found', 404);
        return jsonResponse({ employee: data });
    }

    if (path === '/api/hr/employees' && request.method === 'POST') {
        if (!hasWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as {
            userId: string;
            employeeCode?: string;
            jobTitle: string;
            departmentId?: string;
            salary?: number;
            hireDate?: string;
        };

        if (!body.userId || !body.jobTitle) return errorResponse('Missing required fields');

        // Ensure user is a company member
        const { data: member } = await adminClient
            .from('company_members')
            .select('id')
            .eq('company_id', companyId)
            .eq('user_id', body.userId)
            .maybeSingle();

        if (!member) return errorResponse('User is not a company member', 400);

        const { data, error } = await adminClient
            .from('employees')
            .insert({
                company_id: companyId,
                member_id: member.id,
                employee_code: body.employeeCode || `EMP-${Date.now().toString(36).toUpperCase()}`,
                job_title: body.jobTitle,
                department_id: body.departmentId,
                salary: body.salary,
                hire_date: body.hireDate || new Date().toISOString().split('T')[0],
                status: 'active',
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        // Audit log
        await adminClient.from('audit_log').insert({
            company_id: companyId,
            user_id: userId,
            action: 'hr.employee.created',
            entity_type: 'employee',
            entity_id: data.id,
            details: { jobTitle: body.jobTitle },
        }).then(() => { }, () => { });

        return jsonResponse({ employee: data }, 201);
    }

    // PATCH /api/hr/employees/:id
    if (empMatch && request.method === 'PATCH') {
        if (!hasWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as Partial<{
            jobTitle: string;
            departmentId: string;
            salary: number;
            status: string;
        }>;

        const updates: Record<string, unknown> = {};
        if (body.jobTitle !== undefined) updates.job_title = body.jobTitle;
        if (body.departmentId !== undefined) updates.department_id = body.departmentId;
        if (body.salary !== undefined) updates.salary = body.salary;
        if (body.status !== undefined) updates.status = body.status;

        if (Object.keys(updates).length === 0) return errorResponse('No fields to update');

        const { data, error } = await adminClient
            .from('employees')
            .update(updates)
            .eq('id', empMatch[1])
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ employee: data });
    }

    // ─── Attendance ────────────────────────────────────────────────────────

    if (path === '/api/hr/attendance' && request.method === 'GET') {
        const url = new URL(request.url);
        const employeeId = url.searchParams.get('employeeId');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        let query = adminClient
            .from('attendance')
            .select(`
        id, check_in, check_out, status, notes,
        employees!inner(id, employee_code, company_members!inner(profiles!inner(full_name)))
      `, { count: 'exact' })
            .eq('company_id', companyId);

        if (employeeId) query = query.eq('employee_id', employeeId);
        if (from) query = query.gte('check_in', from);
        if (to) query = query.lte('check_in', to);

        query = query
            .order('check_in', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ attendance: data ?? [], total: count ?? 0, page, limit });
    }

    if (path === '/api/hr/attendance/clock' && request.method === 'POST') {
        const body = (await request.json()) as {
            action: 'clock_in' | 'clock_out';
            employeeId?: string;
            notes?: string;
        };

        if (!body.action) return errorResponse('Missing action (clock_in or clock_out)');

        // Resolve employee_id for current user
        let employeeId = body.employeeId;
        if (!employeeId) {
            const { data: emp } = await adminClient
                .from('employees')
                .select('id')
                .eq('company_id', companyId)
                .eq('member_id', membership.company_id) // fallback
                .maybeSingle();

            // Try via user_id in company_members
            if (!emp) {
                const { data: empVia } = await adminClient
                    .from('employees')
                    .select('id, company_members!inner(user_id)')
                    .eq('company_id', companyId)
                    .eq('company_members.user_id', userId)
                    .maybeSingle();
                employeeId = empVia?.id;
            } else {
                employeeId = emp.id;
            }
        }

        if (!employeeId) return errorResponse('Employee record not found', 404);

        if (body.action === 'clock_in') {
            // Check if already clocked in today without clock_out
            const today = new Date().toISOString().split('T')[0];
            const { data: existing } = await adminClient
                .from('attendance')
                .select('id')
                .eq('employee_id', employeeId)
                .gte('check_in', today)
                .is('check_out', null)
                .maybeSingle();

            if (existing) return errorResponse('Already clocked in today', 409);

            const { data, error } = await adminClient
                .from('attendance')
                .insert({
                    company_id: companyId,
                    employee_id: employeeId,
                    check_in: new Date().toISOString(),
                    status: 'present',
                    notes: body.notes,
                })
                .select()
                .single();

            if (error) return errorResponse(error.message, 500);
            return jsonResponse({ attendance: data, action: 'clocked_in' }, 201);
        }

        // clock_out
        const { data: openRecord } = await adminClient
            .from('attendance')
            .select('id')
            .eq('employee_id', employeeId)
            .is('check_out', null)
            .order('check_in', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!openRecord) return errorResponse('No open clock-in record found', 404);

        const { data, error } = await adminClient
            .from('attendance')
            .update({
                check_out: new Date().toISOString(),
                notes: body.notes,
            })
            .eq('id', openRecord.id)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ attendance: data, action: 'clocked_out' });
    }

    // ─── Leave Management ─────────────────────────────────────────────────

    if (path === '/api/hr/leaves' && request.method === 'GET') {
        const url = new URL(request.url);
        const employeeId = url.searchParams.get('employeeId');
        const status = url.searchParams.get('status');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

        let query = adminClient
            .from('leave_requests')
            .select(`
        id, leave_type, start_date, end_date, days, status, reason, reviewer_notes,
        employee_id, employees!inner(employee_code, company_members!inner(profiles!inner(full_name)))
      `, { count: 'exact' })
            .eq('company_id', companyId);

        if (employeeId) query = query.eq('employee_id', employeeId);
        if (status) query = query.eq('status', status);

        query = query
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ leaves: data ?? [], total: count ?? 0, page, limit });
    }

    if (path === '/api/hr/leaves' && request.method === 'POST') {
        const body = (await request.json()) as {
            employeeId: string;
            leaveType: string;
            startDate: string;
            endDate: string;
            days: number;
            reason?: string;
        };

        if (!body.employeeId || !body.leaveType || !body.startDate || !body.endDate) {
            return errorResponse('Missing required fields');
        }

        const { data, error } = await adminClient
            .from('leave_requests')
            .insert({
                company_id: companyId,
                employee_id: body.employeeId,
                leave_type: body.leaveType,
                start_date: body.startDate,
                end_date: body.endDate,
                days: body.days || 1,
                reason: body.reason,
                status: 'pending',
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        await adminClient.from('audit_log').insert({
            company_id: companyId,
            user_id: userId,
            action: 'hr.leave.requested',
            entity_type: 'leave_request',
            entity_id: data.id,
            details: { type: body.leaveType, days: body.days },
        }).then(() => { }, () => { });

        return jsonResponse({ leave: data }, 201);
    }

    // PATCH /api/hr/leaves/:id
    const leaveMatch = path.match(/^\/api\/hr\/leaves\/([0-9a-f-]+)$/);
    if (leaveMatch && request.method === 'PATCH') {
        if (!hasWriteAccess(userRole)) return errorResponse('Only managers can approve/reject leaves', 403);

        const body = (await request.json()) as {
            status: 'approved' | 'rejected';
            reviewerNotes?: string;
        };

        if (!['approved', 'rejected'].includes(body.status)) {
            return errorResponse('Status must be approved or rejected');
        }

        const { data, error } = await adminClient
            .from('leave_requests')
            .update({
                status: body.status,
                reviewer_notes: body.reviewerNotes,
                reviewed_by: userId,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', leaveMatch[1])
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);

        await adminClient.from('audit_log').insert({
            company_id: companyId,
            user_id: userId,
            action: `hr.leave.${body.status}`,
            entity_type: 'leave_request',
            entity_id: data.id,
        }).then(() => { }, () => { });

        return jsonResponse({ leave: data });
    }

    // ─── Payroll ──────────────────────────────────────────────────────────

    if (path === '/api/hr/payroll' && request.method === 'GET') {
        if (!hasWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const url = new URL(request.url);
        const period = url.searchParams.get('period'); // e.g., '2025-06'
        const status = url.searchParams.get('status');

        let query = adminClient
            .from('payroll')
            .select(`
        id, employee_id, period, base_salary, allowances, deductions,
        net_amount, status, paid_at,
        employees!inner(employee_code, job_title, company_members!inner(profiles!inner(full_name)))
      `)
            .eq('company_id', companyId);

        if (period) query = query.eq('period', period);
        if (status) query = query.eq('status', status);

        query = query.order('period', { ascending: false });

        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);

        // Compute summary
        const records = data ?? [];
        const summary = {
            totalBaseSalary: records.reduce((s: number, r: any) => s + (r.base_salary || 0), 0),
            totalAllowances: records.reduce((s: number, r: any) => s + (r.allowances || 0), 0),
            totalDeductions: records.reduce((s: number, r: any) => s + (r.deductions || 0), 0),
            totalNetPay: records.reduce((s: number, r: any) => s + (r.net_amount || 0), 0),
            employeeCount: records.length,
        };

        return jsonResponse({ payroll: records, summary });
    }

    if (path === '/api/hr/payroll/run' && request.method === 'POST') {
        if (!hasWriteAccess(userRole)) return errorResponse('Only managers can run payroll', 403);

        const body = (await request.json()) as {
            period: string; // e.g., '2025-06'
        };

        if (!body.period) return errorResponse('Missing period (e.g., 2025-06)');

        // Check if payroll already exists for this period
        const { data: existing } = await adminClient
            .from('payroll')
            .select('id')
            .eq('company_id', companyId)
            .eq('period', body.period)
            .limit(1)
            .maybeSingle();

        if (existing) return errorResponse('Payroll already exists for this period', 409);

        // Get all active employees with salary
        const { data: employees } = await adminClient
            .from('employees')
            .select('id, salary, member_id')
            .eq('company_id', companyId)
            .eq('status', 'active');

        if (!employees?.length) return errorResponse('No active employees found', 404);

        // Generate payroll records
        const payrollRecords = employees.map((emp: any) => ({
            company_id: companyId,
            employee_id: emp.id,
            period: body.period,
            base_salary: emp.salary || 0,
            allowances: 0,
            deductions: 0,
            net_amount: emp.salary || 0,
            status: 'draft',
        }));

        const { data: payroll, error } = await adminClient
            .from('payroll')
            .insert(payrollRecords)
            .select();

        if (error) return errorResponse(error.message, 500);

        await adminClient.from('audit_log').insert({
            company_id: companyId,
            user_id: userId,
            action: 'hr.payroll.run',
            entity_type: 'payroll',
            details: { period: body.period, employeeCount: employees.length },
        }).then(() => { }, () => { });

        return jsonResponse({
            payroll: payroll ?? [],
            summary: {
                period: body.period,
                employeeCount: employees.length,
                totalNetPay: payrollRecords.reduce((s, r) => s + r.net_amount, 0),
            },
        }, 201);
    }

    // ─── Departments ──────────────────────────────────────────────────────

    if (path === '/api/hr/departments' && request.method === 'GET') {
        const { data, error } = await adminClient
            .from('departments')
            .select('id, name, code, is_active, created_at')
            .eq('company_id', companyId)
            .order('name');

        if (error) return errorResponse(error.message, 500);

        // Count employees per department
        const { data: deptCounts } = await adminClient
            .from('employees')
            .select('department_id')
            .eq('company_id', companyId)
            .eq('status', 'active');

        const countMap: Record<string, number> = {};
        for (const e of deptCounts ?? []) {
            if (e.department_id) countMap[e.department_id] = (countMap[e.department_id] || 0) + 1;
        }

        const departments = (data ?? []).map((d: any) => ({
            ...d,
            employeeCount: countMap[d.id] || 0,
        }));

        return jsonResponse({ departments });
    }

    if (path === '/api/hr/departments' && request.method === 'POST') {
        if (!hasWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as { name: string; code?: string };
        if (!body.name) return errorResponse('Missing department name');

        const { data, error } = await adminClient
            .from('departments')
            .insert({
                company_id: companyId,
                name: body.name,
                code: body.code || body.name.toLowerCase().replace(/\s+/g, '_'),
                is_active: true,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ department: data }, 201);
    }

    // ─── Shifts ───────────────────────────────────────────────────────────

    if (path === '/api/hr/shifts' && request.method === 'GET') {
        const url = new URL(request.url);
        const employeeId = url.searchParams.get('employeeId');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        let query = adminClient
            .from('employee_shifts')
            .select(`
        id, shift_date, start_time, end_time, break_minutes, shift_type, status, notes,
        employees!inner(employee_code, company_members!inner(profiles!inner(full_name)))
      `)
            .eq('company_id', companyId);

        if (employeeId) query = query.eq('employee_id', employeeId);
        if (from) query = query.gte('shift_date', from);
        if (to) query = query.lte('shift_date', to);

        query = query.order('shift_date', { ascending: true });

        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ shifts: data ?? [] });
    }

    if (path === '/api/hr/shifts' && request.method === 'POST') {
        if (!hasWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as {
            employeeId: string;
            shiftDate: string;
            startTime: string;
            endTime: string;
            breakMinutes?: number;
            shiftType?: string;
            notes?: string;
        };

        if (!body.employeeId || !body.shiftDate || !body.startTime || !body.endTime) {
            return errorResponse('Missing required fields');
        }

        const { data, error } = await adminClient
            .from('employee_shifts')
            .insert({
                company_id: companyId,
                employee_id: body.employeeId,
                shift_date: body.shiftDate,
                start_time: body.startTime,
                end_time: body.endTime,
                break_minutes: body.breakMinutes ?? 0,
                shift_type: body.shiftType ?? 'regular',
                status: 'scheduled',
                notes: body.notes,
                created_by: userId,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ shift: data }, 201);
    }

    // ─── Goals ────────────────────────────────────────────────────────────

    if (path === '/api/hr/goals' && request.method === 'GET') {
        const url = new URL(request.url);
        const employeeId = url.searchParams.get('employeeId');
        const status = url.searchParams.get('status');

        let query = adminClient
            .from('employee_goals')
            .select(`
        id, title, description, target_value, current_value, unit,
        due_date, status, category, review_notes, reviewed_at,
        employees!inner(employee_code, company_members!inner(profiles!inner(full_name)))
      `)
            .eq('company_id', companyId);

        if (employeeId) query = query.eq('employee_id', employeeId);
        if (status) query = query.eq('status', status);

        query = query.order('due_date', { ascending: true });

        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);

        return jsonResponse({ goals: data ?? [] });
    }

    if (path === '/api/hr/goals' && request.method === 'POST') {
        if (!hasWriteAccess(userRole)) return errorResponse('Insufficient permissions', 403);

        const body = (await request.json()) as {
            employeeId: string;
            title: string;
            description?: string;
            targetValue?: number;
            unit?: string;
            dueDate?: string;
            category?: string;
        };

        if (!body.employeeId || !body.title) return errorResponse('Missing required fields');

        const { data, error } = await adminClient
            .from('employee_goals')
            .insert({
                company_id: companyId,
                employee_id: body.employeeId,
                title: body.title,
                description: body.description,
                target_value: body.targetValue,
                unit: body.unit,
                due_date: body.dueDate,
                category: body.category || 'performance',
                status: 'in_progress',
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ goal: data }, 201);
    }

    // PATCH /api/hr/goals/:id
    const goalMatch = path.match(/^\/api\/hr\/goals\/([0-9a-f-]+)$/);
    if (goalMatch && request.method === 'PATCH') {
        const body = (await request.json()) as Partial<{
            currentValue: number;
            status: string;
            reviewNotes: string;
        }>;

        const updates: Record<string, unknown> = {};
        if (body.currentValue !== undefined) updates.current_value = body.currentValue;
        if (body.status !== undefined) updates.status = body.status;
        if (body.reviewNotes !== undefined) {
            updates.review_notes = body.reviewNotes;
            updates.reviewer_id = userId;
            updates.reviewed_at = new Date().toISOString();
        }

        const { data, error } = await adminClient
            .from('employee_goals')
            .update(updates)
            .eq('id', goalMatch[1])
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ goal: data });
    }

    // ─── Delegations ──────────────────────────────────────────────────────

    // GET /api/hr/delegations — list active & expired delegations
    if (path === '/api/hr/delegations' && request.method === 'GET') {
        const url = new URL(request.url);
        const status = url.searchParams.get('status') || 'all'; // 'active', 'expired', 'all'

        let query = adminClient
            .from('role_delegations')
            .select('*, to_user:profiles!to_user_id(id, full_name, email, avatar_url), granter:profiles!granted_by(id, full_name)')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (status === 'active') {
            query = query
                .eq('is_active', true)
                .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());
        } else if (status === 'expired') {
            query = query.or('is_active.eq.false,expires_at.lt.' + new Date().toISOString());
        }

        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ delegations: data || [] });
    }

    // POST /api/hr/delegations — create a delegation
    if (path === '/api/hr/delegations' && request.method === 'POST') {
        if (!isDelegationAdmin(userRole)) return errorResponse('Only GM or platform admin can create delegations', 403);

        const body = (await request.json()) as {
            fromRole: string;
            toUserId: string;
            scope?: Record<string, unknown>;
            reason?: string;
            expiresAt?: string;
        };
        if (!body.fromRole || !body.toUserId) return errorResponse('fromRole and toUserId are required', 400);

        const { data, error } = await adminClient
            .from('role_delegations')
            .insert({
                company_id: companyId,
                from_role: body.fromRole,
                to_user_id: body.toUserId,
                scope: body.scope || {},
                reason: body.reason || null,
                granted_by: userId,
                is_active: true,
                expires_at: body.expiresAt || null,
            })
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ delegation: data }, 201);
    }

    // PATCH /api/hr/delegations/:id — revoke / update
    const delegationMatch = path.match(/^\/api\/hr\/delegations\/([0-9a-f-]+)$/);
    if (delegationMatch && request.method === 'PATCH') {
        if (!isDelegationAdmin(userRole)) return errorResponse('Only GM or platform admin can manage delegations', 403);

        const body = (await request.json()) as Partial<{
            isActive: boolean;
            expiresAt: string | null;
            reason: string;
        }>;

        const updates: Record<string, unknown> = {};
        if (body.isActive !== undefined) updates.is_active = body.isActive;
        if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt;
        if (body.reason !== undefined) updates.reason = body.reason;

        const { data, error } = await adminClient
            .from('role_delegations')
            .update(updates)
            .eq('id', delegationMatch[1])
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ delegation: data });
    }

    // DELETE /api/hr/delegations/:id — permanently remove
    if (delegationMatch && request.method === 'DELETE') {
        if (!isDelegationAdmin(userRole)) return errorResponse('Only GM or platform admin can delete delegations', 403);

        const { error } = await adminClient
            .from('role_delegations')
            .delete()
            .eq('id', delegationMatch[1])
            .eq('company_id', companyId);

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
}

// ─── Permission helpers ─────────────────────────────────────────────────────

function hasWriteAccess(role: string): boolean {
    const writeRoles = [
        'company_gm', 'assistant_gm', 'department_head',
        'hr_manager', 'hr_admin',
    ];
    return writeRoles.includes(role);
}

function isDelegationAdmin(role: string): boolean {
    return ['company_gm', 'assistant_gm'].includes(role);
}
