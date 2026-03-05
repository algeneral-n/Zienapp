/**
 * Accounting Service — Client-side API for accounting module
 * Calls worker endpoints: /api/accounting/*
 */

import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

/** Get active company ID from localStorage (set by CompanyContext). */
function getCompanyId(): string {
    const raw = localStorage.getItem('zien:activeCompanyId') || '';
    return raw;
}

async function authFetch(path: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    const companyId = getCompanyId();

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(companyId ? { 'X-Company-Id': companyId } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error || 'Request failed');
    }

    return res.json();
}

// ─── Chart of Accounts ───────────────────────────────────────────────────

export async function getChartOfAccounts() {
    return authFetch('/api/accounting/chart-of-accounts');
}

export async function createAccount(account: {
    account_code: string;
    name_en: string;
    name_ar?: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    parent_code?: string;
}) {
    return authFetch('/api/accounting/chart-of-accounts', {
        method: 'POST',
        body: JSON.stringify(account),
    });
}

// ─── Journal Entries ─────────────────────────────────────────────────────

export async function getJournalEntries(params?: { from?: string; to?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return authFetch(`/api/accounting/journal${query}`);
}

export async function createJournalEntry(entry: {
    entry_date?: string;
    reference?: string;
    description: string;
    lines: { account_code: string; debit: number; credit: number; description?: string }[];
}) {
    return authFetch('/api/accounting/journal', {
        method: 'POST',
        body: JSON.stringify(entry),
    });
}

// ─── General Ledger ──────────────────────────────────────────────────────

export async function getAccountLedger(accountCode: string, params?: { from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return authFetch(`/api/accounting/ledger/${accountCode}${query}`);
}

// ─── Invoices ────────────────────────────────────────────────────────────

export async function getInvoices(params?: { type?: 'sales' | 'purchase'; status?: string }) {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return authFetch(`/api/accounting/invoices${query}`);
}

export async function createInvoice(invoice: {
    invoice_type: 'sales' | 'purchase';
    customer_or_vendor: string;
    invoice_date: string;
    due_date: string;
    currency?: string;
    items: { description: string; quantity: number; unit_price: number; tax_rate?: number }[];
    notes?: string;
}) {
    return authFetch('/api/accounting/invoices', {
        method: 'POST',
        body: JSON.stringify(invoice),
    });
}

// ─── Tax ─────────────────────────────────────────────────────────────────

export async function calculateTax(params: { amount: number; country?: string }) {
    return authFetch('/api/accounting/tax/calculate', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

// ─── Cost Centers ────────────────────────────────────────────────────────

export async function getCostCenters() {
    return authFetch('/api/accounting/cost-centers');
}

export async function createCostCenter(center: {
    code: string;
    name_en: string;
    name_ar?: string;
    type: 'administrative' | 'operational' | 'financial' | 'profit';
    parent_code?: string;
}) {
    return authFetch('/api/accounting/cost-centers', {
        method: 'POST',
        body: JSON.stringify(center),
    });
}

// ─── Financial Reports ───────────────────────────────────────────────────

export async function getTrialBalance(asOf?: string) {
    const query = asOf ? `?as_of=${asOf}` : '';
    return authFetch(`/api/accounting/reports/trial-balance${query}`);
}

export async function getIncomeStatement(from?: string, to?: string) {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return authFetch(`/api/accounting/reports/income-statement${query}`);
}

export async function getBalanceSheet(asOf?: string) {
    const query = asOf ? `?as_of=${asOf}` : '';
    return authFetch(`/api/accounting/reports/balance-sheet${query}`);
}

// ─── AI Financial Insights ───────────────────────────────────────────────

export async function getAIFinancialForecast(type: 'cashflow' | 'anomaly' | 'risk', monthsAhead = 3) {
    return authFetch('/api/accounting/ai/forecast', {
        method: 'POST',
        body: JSON.stringify({ type, months_ahead: monthsAhead }),
    });
}
