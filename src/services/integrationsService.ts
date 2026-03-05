/**
 * Integrations Service — Frontend API client for the Integrations Worker API
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

// ─── Types ──────────────────────────────────────────────────────────────────

export interface IntegrationCatalogItem {
    id: string;
    code: string;
    name: string;
    category: string;
    provider: string;
    pricing_model: string;
    setup_mode: string;
    webhook_support: boolean;
    status: string;
}

export interface TenantIntegration {
    id: string;
    status: string;
    config: Record<string, unknown>;
    enabled_at?: string;
    disabled_at?: string;
    integrations_catalog: {
        code: string;
        name: string;
        category: string;
        provider: string;
        pricing_model: string;
    };
}

export interface IntegrationHealth {
    code: string;
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastEvent: string | null;
    errorCount24h: number;
    lastError: string | null;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const integrationsService = {
    async getCatalog(category?: string): Promise<IntegrationCatalogItem[]> {
        const headers = await getAuthHeaders();
        const url = new URL(`${API_URL}/api/integrations/catalog`);
        if (category) url.searchParams.set('category', category);

        const res = await fetch(url.toString(), { method: 'GET', headers });
        if (!res.ok) throw new Error('Failed to load integrations catalog');
        const data = await res.json() as { integrations: IntegrationCatalogItem[] };
        return data.integrations;
    },

    async getCompanyIntegrations(companyId: string): Promise<TenantIntegration[]> {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/integrations/company/${companyId}`, {
            method: 'GET',
            headers,
        });
        if (!res.ok) throw new Error('Failed to load company integrations');
        const data = await res.json() as { integrations: TenantIntegration[] };
        return data.integrations;
    },

    async connect(companyId: string, integrationCode: string, config?: Record<string, unknown>): Promise<{
        id: string;
        integrationCode: string;
        status: string;
        enabledAt: string;
    }> {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/integrations/connect`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ companyId, integrationCode, config }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Connection failed' }));
            throw new Error((err as any).error || 'Failed to connect integration');
        }
        return res.json() as Promise<any>;
    },

    async disconnect(companyId: string, integrationCode: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/integrations/disconnect`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ companyId, integrationCode }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Disconnection failed' }));
            throw new Error((err as any).error || 'Failed to disconnect integration');
        }
    },

    async getHealth(companyId: string): Promise<IntegrationHealth[]> {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/integrations/health/${companyId}`, {
            method: 'GET',
            headers,
        });
        if (!res.ok) throw new Error('Failed to load integration health');
        const data = await res.json() as { integrations: IntegrationHealth[] };
        return data.integrations;
    },
};
