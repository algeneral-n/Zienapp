/**
 * ZIEN AI Service — thin client that calls the Cloudflare Worker.
 * API keys are NEVER exposed to the client bundle.
 *
 * - generateRAREAnalysis() = authenticated RARE agent (private)
 * - generatePublicAIResponse() = unauthenticated public assistant
 * - generateBusinessReport() = high-level GM report
 */
import { supabase } from './supabase';
import type { RAREMode, RAREContext } from '../types';

export type RAREAgentType =
  | 'accounting' | 'hr' | 'sales' | 'fleet'
  | 'meetings' | 'gm' | 'secretary' | 'founder'
  | 'general' | 'marketing' | 'projects' | 'store'
  | 'inventory' | 'maintenance' | 'crm' | 'legal'
  | 'quality' | 'training' | 'procurement' | 'finance'
  | 'safety' | 'support' | 'analytics' | 'integrations';

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

/**
 * Public AI assistant — no authentication required.
 * Answers general questions about ZIEN platform.
 * Supports optional image analysis (vision).
 */
export async function generatePublicAIResponse(
  query: string,
  language: string = 'en',
  imageBase64?: string,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${API_URL}/api/ai/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        prompt: query.substring(0, 1000),
        language,
        ...(imageBase64 ? { imageBase64 } : {}),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'AI service unavailable' }));
      throw new Error((err as { error?: string }).error ?? 'AI service unavailable');
    }

    const data = (await res.json()) as { response: string };
    return data.response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Text-to-Speech — converts text to audio using ElevenLabs.
 * Returns audio blob URL for playback.
 */
export async function generateTTS(
  text: string,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${API_URL}/api/ai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ text: text.substring(0, 2000) }),
    });

    if (!res.ok) {
      throw new Error('TTS service unavailable');
    }

    const audioBlob = await res.blob();
    return URL.createObjectURL(audioBlob);
  } finally {
    clearTimeout(timeout);
  }
}
