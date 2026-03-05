/**
 * HR Service — Frontend API client for the HR Worker API
 *
 * Replaces direct Supabase calls with proper API calls through
 * the Cloudflare Worker, which enforces role-based access control.
 */

import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

async function getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${API_URL}${path}`);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
        });
    }
    const headers = await getAuthHeaders();
    const res = await fetch(url.toString(), { method: 'GET', headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error((err as any).error || `API error ${res.status}`);
    }
    return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error((err as any).error || `API error ${res.status}`);
    }
    return res.json() as Promise<T>;
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}${path}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error((err as any).error || `API error ${res.status}`);
    }
    return res.json() as Promise<T>;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Employee {
    id: string;
    employee_code: string;
    job_title: string;
    salary: number;
    hire_date: string;
    status: string;
    department_id?: string;
    departments?: { name: string };
    company_members?: {
        user_id: string;
        role: string;
        profiles?: {
            full_name: string;
            email: string;
            avatar_url?: string;
            phone?: string;
        };
    };
}

export interface AttendanceRecord {
    id: string;
    check_in: string;
    check_out?: string;
    status: string;
    notes?: string;
}

export interface LeaveRequest {
    id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    days: number;
    status: string;
    reason?: string;
    reviewer_notes?: string;
}

export interface PayrollRecord {
    id: string;
    employee_id: string;
    period: string;
    base_salary: number;
    allowances: number;
    deductions: number;
    net_amount: number;
    status: string;
    paid_at?: string;
}

export interface Department {
    id: string;
    name: string;
    code?: string;
    is_active: boolean;
    employeeCount?: number;
}

export interface Shift {
    id: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    shift_type: string;
    status: string;
    notes?: string;
}

export interface EmployeeGoal {
    id: string;
    title: string;
    description?: string;
    target_value?: number;
    current_value?: number;
    unit?: string;
    due_date?: string;
    status: string;
    category?: string;
    review_notes?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const hrService = {
    // ─── Employees ──────────────────────────────────────────────────────────

    async listEmployees(params?: {
        departmentId?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResult<Employee>> {
        const result = await apiGet<{ employees: Employee[]; total: number; page: number; limit: number }>(
            '/api/hr/employees',
            {
                departmentId: params?.departmentId || '',
                status: params?.status || 'active',
                search: params?.search || '',
                page: String(params?.page ?? 1),
                limit: String(params?.limit ?? 50),
            },
        );
        return { data: result.employees, total: result.total, page: result.page, limit: result.limit };
    },

    async getEmployee(id: string): Promise<Employee> {
        const result = await apiGet<{ employee: Employee }>(`/api/hr/employees/${id}`);
        return result.employee;
    },

    async createEmployee(data: {
        userId: string;
        jobTitle: string;
        employeeCode?: string;
        departmentId?: string;
        salary?: number;
        hireDate?: string;
    }): Promise<Employee> {
        const result = await apiPost<{ employee: Employee }>('/api/hr/employees', data);
        return result.employee;
    },

    async updateEmployee(id: string, data: Partial<{
        jobTitle: string;
        departmentId: string;
        salary: number;
        status: string;
    }>): Promise<Employee> {
        const result = await apiPatch<{ employee: Employee }>(`/api/hr/employees/${id}`, data);
        return result.employee;
    },

    // ─── Attendance ─────────────────────────────────────────────────────────

    async listAttendance(params?: {
        employeeId?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResult<AttendanceRecord>> {
        const result = await apiGet<{ attendance: AttendanceRecord[]; total: number; page: number; limit: number }>(
            '/api/hr/attendance',
            {
                employeeId: params?.employeeId || '',
                from: params?.from || '',
                to: params?.to || '',
                page: String(params?.page ?? 1),
                limit: String(params?.limit ?? 50),
            },
        );
        return { data: result.attendance, total: result.total, page: result.page, limit: result.limit };
    },

    async clockIn(employeeId?: string, notes?: string): Promise<AttendanceRecord> {
        const result = await apiPost<{ attendance: AttendanceRecord }>('/api/hr/attendance/clock', {
            action: 'clock_in',
            employeeId,
            notes,
        });
        return result.attendance;
    },

    async clockOut(employeeId?: string, notes?: string): Promise<AttendanceRecord> {
        const result = await apiPost<{ attendance: AttendanceRecord }>('/api/hr/attendance/clock', {
            action: 'clock_out',
            employeeId,
            notes,
        });
        return result.attendance;
    },

    // ─── Leaves ─────────────────────────────────────────────────────────────

    async listLeaves(params?: {
        employeeId?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResult<LeaveRequest>> {
        const result = await apiGet<{ leaves: LeaveRequest[]; total: number; page: number; limit: number }>(
            '/api/hr/leaves',
            {
                employeeId: params?.employeeId || '',
                status: params?.status || '',
                page: String(params?.page ?? 1),
                limit: String(params?.limit ?? 50),
            },
        );
        return { data: result.leaves, total: result.total, page: result.page, limit: result.limit };
    },

    async requestLeave(data: {
        employeeId: string;
        leaveType: string;
        startDate: string;
        endDate: string;
        days: number;
        reason?: string;
    }): Promise<LeaveRequest> {
        const result = await apiPost<{ leave: LeaveRequest }>('/api/hr/leaves', data);
        return result.leave;
    },

    async reviewLeave(id: string, data: {
        status: 'approved' | 'rejected';
        reviewerNotes?: string;
    }): Promise<LeaveRequest> {
        const result = await apiPatch<{ leave: LeaveRequest }>(`/api/hr/leaves/${id}`, data);
        return result.leave;
    },

    // ─── Payroll ────────────────────────────────────────────────────────────

    async listPayroll(params?: {
        period?: string;
        status?: string;
    }): Promise<{ payroll: PayrollRecord[]; summary: Record<string, number> }> {
        return apiGet('/api/hr/payroll', {
            period: params?.period || '',
            status: params?.status || '',
        });
    },

    async runPayroll(period: string): Promise<{ payroll: PayrollRecord[]; summary: Record<string, unknown> }> {
        return apiPost('/api/hr/payroll/run', { period });
    },

    // ─── Departments ────────────────────────────────────────────────────────

    async listDepartments(): Promise<Department[]> {
        const result = await apiGet<{ departments: Department[] }>('/api/hr/departments');
        return result.departments;
    },

    async createDepartment(data: { name: string; code?: string }): Promise<Department> {
        const result = await apiPost<{ department: Department }>('/api/hr/departments', data);
        return result.department;
    },

    // ─── Shifts ─────────────────────────────────────────────────────────────

    async listShifts(params?: {
        employeeId?: string;
        from?: string;
        to?: string;
    }): Promise<Shift[]> {
        const result = await apiGet<{ shifts: Shift[] }>('/api/hr/shifts', {
            employeeId: params?.employeeId || '',
            from: params?.from || '',
            to: params?.to || '',
        });
        return result.shifts;
    },

    async createShift(data: {
        employeeId: string;
        shiftDate: string;
        startTime: string;
        endTime: string;
        breakMinutes?: number;
        shiftType?: string;
        notes?: string;
    }): Promise<Shift> {
        const result = await apiPost<{ shift: Shift }>('/api/hr/shifts', data);
        return result.shift;
    },

    // ─── Goals ──────────────────────────────────────────────────────────────

    async listGoals(params?: {
        employeeId?: string;
        status?: string;
    }): Promise<EmployeeGoal[]> {
        const result = await apiGet<{ goals: EmployeeGoal[] }>('/api/hr/goals', {
            employeeId: params?.employeeId || '',
            status: params?.status || '',
        });
        return result.goals;
    },

    async createGoal(data: {
        employeeId: string;
        title: string;
        description?: string;
        targetValue?: number;
        unit?: string;
        dueDate?: string;
        category?: string;
    }): Promise<EmployeeGoal> {
        const result = await apiPost<{ goal: EmployeeGoal }>('/api/hr/goals', data);
        return result.goal;
    },

    async updateGoal(id: string, data: Partial<{
        currentValue: number;
        status: string;
        reviewNotes: string;
    }>): Promise<EmployeeGoal> {
        const result = await apiPatch<{ goal: EmployeeGoal }>(`/api/hr/goals/${id}`, data);
        return result.goal;
    },
};
