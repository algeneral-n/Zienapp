/**
 * RARE Service — re-exports from geminiService.
 * All AI calls go through the Cloudflare Worker (no client-side API keys).
 */
import { generateRAREAnalysis } from './geminiService';
import { supabase } from './supabase';

export async function askRARE(prompt: string, context?: Record<string, unknown>) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const API_URL = import.meta.env.VITE_API_URL || 'https://api.plt.zien-ai.app';

    if (!session?.access_token) {
      return 'Please log in to use the AI assistant.';
    }

    const res = await fetch(`${API_URL}/api/ai/rare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        prompt,
        mode: 'help',
        agentType: 'gm',
        companyId: (context as any)?.companyId ?? '',
        context,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return (err as { error?: string }).error ?? 'AI service unavailable';
    }

    const data = (await res.json()) as { response: string };
    return data.response;
  } catch (error) {
    console.error('RARE AI Error:', error);
    return "I'm sorry, I encountered an error. Please try again later.";
  }
}
