import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../index';

/**
 * Create a Supabase client scoped to a user's JWT.
 * Used for RLS-respecting queries.
 */
export function createUserClient(env: Env, authHeader: string): SupabaseClient {
  const token = authHeader.replace('Bearer ', '');
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/**
 * Create a Supabase admin client (bypasses RLS).
 * Only use for server-side operations like provisioning.
 */
export function createAdminClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Extract and validate the user from the Authorization header.
 * Returns user ID or throws.
 */
export async function requireAuth(
  request: Request,
  env: Env,
): Promise<{ userId: string; email: string; supabase: SupabaseClient }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const supabase = createUserClient(env, authHeader);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return { userId: user.id, email: user.email ?? '', supabase };
}
