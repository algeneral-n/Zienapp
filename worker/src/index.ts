/**
 * ZIEN API Worker — Cloudflare Worker entrypoint
 * Base URL: https://api.plt.zien-ai.app
 */

import { handleHealth } from './routes/health';
import { handleAI, handlePublicAI, handleTTS } from './routes/ai';
import { handleBilling } from './routes/billing';
import { handleProvision } from './routes/provision';
import { handleAuth } from './routes/auth';
import { handleIntegrations } from './routes/integrations';
import { handleAccounting } from './routes/accounting';
import { handleControlRoom } from './routes/controlRoom';
import { handleStore } from './routes/store';
import { handleHR } from './routes/hr';
import { handleCRM } from './routes/crm';
import { handleFounder } from './routes/founder';
import { handleVonage } from './routes/vonage';
import { handleChat } from './routes/chat';
import { handleProjects } from './routes/projects';
import { handleLogistics as handleLogisticsV2 } from './routes/logistics';
import { handleMeetings } from './routes/meetings';
import { handleEmail } from './routes/email';
import { handleGuest } from './routes/guest';
import { handleMarketing } from './routes/marketing';
import { handleVoice } from './routes/voice';
import { corsHeaders, handleCors, getAllowedOrigin } from './cors';

export interface Env {
  ENVIRONMENT: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  GOOGLE_API_KEY: string;
  OPENAI_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  NI_API_URL?: string;
  NI_API_KEY?: string;
  NI_OUTLET_REF?: string;
  TILR_API_URL?: string;
  TILR_API_KEY?: string;
  TILR_MERCHANT_ID?: string;
  VONAGE_API_KEY?: string;
  VONAGE_API_SECRET?: string;
  VONAGE_APPLICATION_ID?: string;
  VONAGE_PRIVATE_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  MONGODB_URI?: string;
  ELEVENLABS_API_KEY?: string;
  APPLE_PAY_MERCHANT_ID?: string;
  APPLE_PAY_LATER_TOKEN?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route matching
      if (path === '/health' || path === '/api/health') {
        return handleHealth(env);
      }

      if (path.startsWith('/api/auth/')) {
        return handleAuth(request, env, path);
      }

      if (path === '/api/ai/public' && request.method === 'POST') {
        return handlePublicAI(request, env);
      }

      if (path === '/api/ai/tts' && request.method === 'POST') {
        return handleTTS(request, env);
      }

      if (path.startsWith('/api/ai/')) {
        return handleAI(request, env, path);
      }

      if (path.startsWith('/api/billing/') || path === '/.well-known/apple-developer-merchantid-domain-association') {
        return handleBilling(request, env, path);
      }

      if (path.startsWith('/api/marketing/')) {
        return handleMarketing(request, env, path);
      }

      if (path.startsWith('/api/voice/')) {
        return handleVoice(request, env, path);
      }

      if (path.startsWith('/api/provision/') || path.startsWith('/api/pricing/')) {
        return handleProvision(request, env, path);
      }

      if (path.startsWith('/api/integrations/')) {
        return handleIntegrations(request, env, path);
      }

      if (path.startsWith('/api/accounting/')) {
        return handleAccounting(request, env, path);
      }

      if (path.startsWith('/api/control-room/')) {
        return handleControlRoom(request, env, path);
      }

      if (path.startsWith('/api/store/')) {
        return handleStore(request, env, path);
      }

      if (path.startsWith('/api/hr/')) {
        return handleHR(request, env, path);
      }

      if (path.startsWith('/api/crm/')) {
        return handleCRM(request, env, path);
      }

      if (path.startsWith('/api/founder/')) {
        return handleFounder(request, env, path);
      }

      if (path.startsWith('/api/vonage/')) {
        return handleVonage(request, env, path);
      }

      if (path.startsWith('/api/chat/')) {
        return handleChat(request, env, path);
      }

      if (path.startsWith('/api/projects/')) {
        return handleProjects(request, env, path);
      }

      if (path.startsWith('/api/logistics-v2/')) {
        return handleLogisticsV2(request, env, path.replace('/api/logistics-v2', '/api/logistics'));
      }

      if (path.startsWith('/api/meetings/')) {
        return handleMeetings(request, env, path);
      }

      if (path.startsWith('/api/email/')) {
        return handleEmail(request, env, path);
      }

      if (path.startsWith('/api/guest/')) {
        return handleGuest(request, env, path);
      }

      // 404
      return jsonResponse({ error: 'Not found', path }, 404);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      console.error('Worker error:', message);
      return jsonResponse({ error: message }, 500);
    }
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function jsonResponse(data: unknown, status = 200, request?: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  });
}

export function errorResponse(message: string, status = 400, request?: Request): Response {
  return jsonResponse({ error: message }, status, request);
}
