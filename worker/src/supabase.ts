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
 * Check if a user is a member of a company (bypasses RLS via admin client).
 * Returns role_code if member, null otherwise.
 */
export async function checkMembership(
  env: Env,
  userId: string,
  companyId: string,
): Promise<{ role: string } | null> {
  const admin = createAdminClient(env);
  const { data } = await admin
    .from('company_members')
    .select('role:role_code')
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  return data;
}

/**
 * Discover a user's active company membership (bypasses RLS via admin client).
 * Returns the first active membership with company_id, role, and member id.
 */
export async function discoverMembership(
  env: Env,
  userId: string,
): Promise<{ id: string; company_id: string; role: string } | null> {
  const admin = createAdminClient(env);
  const { data } = await admin
    .from('company_members')
    .select('id, company_id, role:role_code')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  return data;
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
