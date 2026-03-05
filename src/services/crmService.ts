/**
 * CRM Service — Frontend API client for the CRM Worker API
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

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contact_person?: string;
    notes?: string;
    source?: string;
    status: string;
    total_revenue: number;
    created_at: string;
    quotes?: Quote[];
    contracts?: Contract[];
    crm_activities?: Activity[];
}

export interface Lead {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    source: string;
    status: string;
    estimated_value: number;
    assigned_to?: string;
    notes?: string;
    created_at: string;
    profiles?: { full_name: string };
}

export interface Opportunity {
    id: string;
    title: string;
    value: number;
    status: string;
    probability: number;
    expected_close_date?: string;
    client_id?: string;
    clients?: { name: string };
    stage_id?: string;
    deal_stages?: { name: string; color: string; sort_order: number };
    assigned_to?: string;
    profiles?: { full_name: string };
    notes?: string;
    created_at: string;
}

export interface Activity {
    id: string;
    activity_type: string;
    subject: string;
    description?: string;
    due_date?: string;
    completed_at?: string;
    status: string;
    client_id?: string;
    clients?: { name: string };
    lead_id?: string;
    leads?: { name: string };
    assigned_to?: string;
    created_by: string;
    created_at: string;
}

export interface DealStage {
    id: string;
    name: string;
    name_ar?: string;
    sort_order: number;
    color: string;
    probability: number;
    is_won: boolean;
    is_lost: boolean;
    is_active: boolean;
    opportunityCount?: number;
    totalValue?: number;
}

export interface Quote {
    id: string;
    title?: string;
    total_amount: number;
    status: string;
    valid_until?: string;
    created_at: string;
    client_id?: string;
    clients?: { name: string };
}

export interface Contract {
    id: string;
    title: string;
    status: string;
    start_date?: string;
    end_date?: string;
}

export interface CRMDashboard {
    clients: { total: number; active: number; totalRevenue: number };
    leads: { total: number; new: number; qualified: number; totalValue: number };
    opportunities: { total: number; open: number; won: number; totalValue: number };
    pendingActivities: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const crmService = {
    // ─── Dashboard ──────────────────────────────────────────────────────────

    async getDashboard(): Promise<CRMDashboard> {
        const result = await apiGet<{ dashboard: CRMDashboard }>('/api/crm/dashboard');
        return result.dashboard;
    },

    // ─── Clients ────────────────────────────────────────────────────────────

    async listClients(params?: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResult<Client>> {
        const result = await apiGet<{ clients: Client[]; total: number; page: number; limit: number }>(
            '/api/crm/clients',
            {
                status: params?.status || '',
                search: params?.search || '',
                page: String(params?.page ?? 1),
                limit: String(params?.limit ?? 50),
            },
        );
        return { data: result.clients, total: result.total, page: result.page, limit: result.limit };
    },

    async getClient(id: string): Promise<Client> {
        const result = await apiGet<{ client: Client }>(`/api/crm/clients/${id}`);
        return result.client;
    },

    async createClient(data: {
        name: string;
        email?: string;
        phone?: string;
        address?: string;
        contactPerson?: string;
        notes?: string;
        source?: string;
    }): Promise<Client> {
        const result = await apiPost<{ client: Client }>('/api/crm/clients', data);
        return result.client;
    },

    async updateClient(id: string, data: Partial<{
        name: string;
        email: string;
        phone: string;
        address: string;
        contactPerson: string;
        status: string;
        notes: string;
    }>): Promise<Client> {
        const result = await apiPatch<{ client: Client }>(`/api/crm/clients/${id}`, data);
        return result.client;
    },

    // ─── Leads ──────────────────────────────────────────────────────────────

    async listLeads(params?: {
        status?: string;
        assignedTo?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResult<Lead>> {
        const result = await apiGet<{ leads: Lead[]; total: number; page: number; limit: number }>(
            '/api/crm/leads',
            {
                status: params?.status || '',
                assignedTo: params?.assignedTo || '',
                page: String(params?.page ?? 1),
                limit: String(params?.limit ?? 50),
            },
        );
        return { data: result.leads, total: result.total, page: result.page, limit: result.limit };
    },

    async createLead(data: {
        name: string;
        email?: string;
        phone?: string;
        source?: string;
        estimatedValue?: number;
        notes?: string;
        assignedTo?: string;
    }): Promise<Lead> {
        const result = await apiPost<{ lead: Lead }>('/api/crm/leads', data);
        return result.lead;
    },

    async updateLead(id: string, data: Partial<{
        status: string;
        assignedTo: string;
        estimatedValue: number;
        notes: string;
    }>): Promise<Lead> {
        const result = await apiPatch<{ lead: Lead }>(`/api/crm/leads/${id}`, data);
        return result.lead;
    },

    async convertLeadToClient(leadId: string): Promise<{ lead: Lead; client: Client }> {
        return apiPatch(`/api/crm/leads/${leadId}`, { convertToClient: true });
    },

    // ─── Opportunities ──────────────────────────────────────────────────────

    async listOpportunities(params?: {
        status?: string;
        stageId?: string;
        clientId?: string;
    }): Promise<Opportunity[]> {
        const result = await apiGet<{ opportunities: Opportunity[] }>(
            '/api/crm/opportunities',
            {
                status: params?.status || '',
                stageId: params?.stageId || '',
                clientId: params?.clientId || '',
            },
        );
        return result.opportunities;
    },

    async createOpportunity(data: {
        title: string;
        clientId?: string;
        value?: number;
        stageId?: string;
        expectedCloseDate?: string;
        notes?: string;
        assignedTo?: string;
    }): Promise<Opportunity> {
        const result = await apiPost<{ opportunity: Opportunity }>('/api/crm/opportunities', data);
        return result.opportunity;
    },

    async updateOpportunity(id: string, data: Partial<{
        stageId: string;
        value: number;
        status: string;
        probability: number;
        expectedCloseDate: string;
        notes: string;
        assignedTo: string;
    }>): Promise<Opportunity> {
        const result = await apiPatch<{ opportunity: Opportunity }>(`/api/crm/opportunities/${id}`, data);
        return result.opportunity;
    },

    async moveOpportunityStage(id: string, stageId: string): Promise<Opportunity> {
        return this.updateOpportunity(id, { stageId });
    },

    // ─── Activities ─────────────────────────────────────────────────────────

    async listActivities(params?: {
        clientId?: string;
        leadId?: string;
        status?: string;
        type?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResult<Activity>> {
        const result = await apiGet<{ activities: Activity[]; total: number; page: number; limit: number }>(
            '/api/crm/activities',
            {
                clientId: params?.clientId || '',
                leadId: params?.leadId || '',
                status: params?.status || '',
                type: params?.type || '',
                page: String(params?.page ?? 1),
                limit: String(params?.limit ?? 50),
            },
        );
        return { data: result.activities, total: result.total, page: result.page, limit: result.limit };
    },

    async createActivity(data: {
        activityType: string;
        subject: string;
        description?: string;
        clientId?: string;
        leadId?: string;
        opportunityId?: string;
        dueDate?: string;
        assignedTo?: string;
    }): Promise<Activity> {
        const result = await apiPost<{ activity: Activity }>('/api/crm/activities', data);
        return result.activity;
    },

    async completeActivity(id: string): Promise<Activity> {
        const result = await apiPatch<{ activity: Activity }>(`/api/crm/activities/${id}`, {
            status: 'completed',
        });
        return result.activity;
    },

    async cancelActivity(id: string): Promise<Activity> {
        const result = await apiPatch<{ activity: Activity }>(`/api/crm/activities/${id}`, {
            status: 'cancelled',
        });
        return result.activity;
    },

    // ─── Deal Stages ────────────────────────────────────────────────────────

    async listDealStages(): Promise<DealStage[]> {
        const result = await apiGet<{ stages: DealStage[] }>('/api/crm/deal-stages');
        return result.stages;
    },

    async createDealStage(data: {
        name: string;
        nameAr?: string;
        sortOrder: number;
        color?: string;
        probability?: number;
        isWon?: boolean;
        isLost?: boolean;
    }): Promise<DealStage> {
        const result = await apiPost<{ stage: DealStage }>('/api/crm/deal-stages', data);
        return result.stage;
    },

    // ─── Quotes ─────────────────────────────────────────────────────────────

    async listQuotes(params?: {
        clientId?: string;
        status?: string;
    }): Promise<Quote[]> {
        const result = await apiGet<{ quotes: Quote[] }>('/api/crm/quotes', {
            clientId: params?.clientId || '',
            status: params?.status || '',
        });
        return result.quotes;
    },

    async createQuote(data: {
        clientId: string;
        title: string;
        items: Array<{ description: string; quantity: number; unitPrice: number }>;
        validUntil?: string;
        notes?: string;
    }): Promise<Quote> {
        const result = await apiPost<{ quote: Quote }>('/api/crm/quotes', data);
        return result.quote;
    },
};
