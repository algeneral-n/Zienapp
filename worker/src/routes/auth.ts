import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth } from '../supabase';

/**
 * POST /api/auth/verify-turnstile
 * Verifies a Cloudflare Turnstile token server-side.
 */
export async function handleAuth(
  request: Request,
  env: Env,
  path: string,
): Promise<Response> {
  if (path === '/api/auth/verify-turnstile' && request.method === 'POST') {
    return verifyTurnstile(request, env);
  }

  if (path === '/api/auth/me' && request.method === 'GET') {
    return getMe(request, env);
  }

  return errorResponse('Not found', 404);
}

async function verifyTurnstile(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { token?: string };
  if (!body.token) return errorResponse('Missing token');

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: body.token,
    }),
  });

  const result = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
  if (!result.success) {
    return errorResponse('Turnstile verification failed', 403);
  }

  return jsonResponse({ success: true });
}

async function getMe(request: Request, env: Env): Promise<Response> {
  const { userId, email, supabase } = await requireAuth(request, env);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: memberships } = await supabase
    .from('company_members')
    .select('*, companies(id, name, slug, status)')
    .eq('user_id', userId)
    .eq('status', 'active');

  return jsonResponse({
    user: { id: userId, email },
    profile,
    memberships: memberships ?? [],
  });
}
