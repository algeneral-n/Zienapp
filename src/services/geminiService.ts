/**
 * RARE AI Service — thin client that calls the Cloudflare Worker.
 * API keys are NEVER exposed to the client bundle.
 */
import { supabase } from './supabase';
import type { RAREMode, RAREContext } from '../types';

export type RAREAgentType =
  | 'accounting' | 'hr' | 'sales' | 'fleet' | 'pm'
  | 'meetings' | 'gm' | 'secretary' | 'founder';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function generateRAREAnalysis(
  agentType: RAREAgentType,
  query: string,
  context: RAREContext & { mode: RAREMode; companyId?: string; files?: { data: string; mimeType: string }[] },
): Promise<string> {
  let headers: Record<string, string>;
  try {
    headers = await getAuthHeaders();
  } catch {
    // Not authenticated — throw clear error so the UI can show a login prompt
    throw new Error('Not authenticated');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_URL}/api/ai/rare`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        prompt: query,
        mode: context.mode,
        agentType,
        moduleCode: context.moduleCode,
        companyId: context.companyId || undefined,
        language: context.language || 'en',
        files: context.files?.length ? context.files : undefined,
        context: {
          pageCode: context.pageCode,
          userRole: context.userRole,
          language: context.language,
          theme: context.theme,
          selectedEntityId: context.selectedEntityId,
          additionalData: context.additionalData,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'AI service error' }));
      throw new Error((err as { error?: string }).error ?? 'AI service error');
    }

    const data = (await res.json()) as { response: string };
    return data.response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateBusinessReport(
  companyName: string,
  companyId: string,
  data: Record<string, unknown>,
): Promise<string> {
  return generateRAREAnalysis(
    'gm',
    `Generate a comprehensive business report for ${companyName} based on: ${JSON.stringify(data)}`,
    {
      mode: 'report',
      companyId,
      pageCode: 'dashboard',
      userRole: 'company_gm' as any,
      companyName,
      language: 'en',
      theme: 'system' as any,
    },
  );
}
