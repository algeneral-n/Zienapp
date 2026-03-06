/**
 * Integration Service — handles integration connect/disconnect via Cloudflare Worker API.
 */
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('NOT_AUTHENTICATED');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

export interface ConnectResult {
  id: string;
  integrationCode: string;
  status: 'active' | 'inactive';
  enabledAt: string;
}

export interface DisconnectResult {
  integrationCode: string;
  status: 'inactive';
}

export interface CompanyIntegration {
  id: string;
  status: string;
  config: Record<string, unknown>;
  enabled_at: string | null;
  disabled_at: string | null;
  integrations_catalog: {
    code: string;
    name: string;
    category: string;
    provider: string;
    pricing_model: string;
  };
}

/**
 * Connect (activate) an integration for a company.
 */
export async function connectIntegration(
  companyId: string,
  integrationCode: string,
  config?: Record<string, unknown>,
): Promise<ConnectResult> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/integrations/connect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ companyId, integrationCode, config }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Integration service error' }));
    throw new Error((err as { error?: string }).error ?? 'Failed to connect integration');
  }

  return (await res.json()) as ConnectResult;
}

/**
 * Disconnect (deactivate) an integration for a company.
 */
export async function disconnectIntegration(
  companyId: string,
  integrationCode: string,
): Promise<DisconnectResult> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/integrations/disconnect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ companyId, integrationCode }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Integration service error' }));
    throw new Error((err as { error?: string }).error ?? 'Failed to disconnect integration');
  }

  return (await res.json()) as DisconnectResult;
}

/**
 * Get all active integrations for a company.
 */
export async function getCompanyIntegrations(
  companyId: string,
): Promise<CompanyIntegration[]> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/integrations/company/${companyId}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Service error' }));
    throw new Error((err as { error?: string }).error ?? 'Failed to fetch integrations');
  }

  const data = (await res.json()) as { integrations: CompanyIntegration[] };
  return data.integrations;
}
