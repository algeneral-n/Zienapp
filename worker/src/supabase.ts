import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Env } from './index';
import { ROLE_LEVEL, getRoleLevel } from './permissions';

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

/**
 * Full auth context with company membership, role, platform role, enabled modules.
 * Used by hardened endpoints that need full RBAC context.
 */
export interface AuthContext {
  userId: string;
  email: string;
  supabase: SupabaseClient;
  companyId: string | null;
  platformRole: string | null;
  companyRole: string | null;
  roleLevel: number;
  enabledModules: string[];
  permissions: string[];
}

export async function requireAuthFull(
  request: Request,
  env: Env,
): Promise<AuthContext> {
  const { userId, email, supabase } = await requireAuth(request, env);
  const companyId = request.headers.get('x-company-id') || null;
  const admin = createAdminClient(env);

  // Fetch platform role
  const { data: platformRoleRow } = await admin
    .from('platform_roles')
    .select('role_code')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  const platformRole = platformRoleRow?.role_code || null;

  // Fetch company role + enabled modules + permissions if companyId provided
  let companyRole: string | null = null;
  let enabledModules: string[] = [];
  let permissions: string[] = [];

  if (companyId) {
    const membership = await checkMembership(env, userId, companyId);
    companyRole = membership?.role || null;

    const { data: modules } = await admin
      .from('company_modules')
      .select('modules_catalog(code)')
      .eq('company_id', companyId)
      .eq('is_active', true);

    enabledModules = (modules || [])
      .map((m: any) => m.modules_catalog?.code)
      .filter(Boolean);

    // Fetch effective permissions via DB function
    const { data: perms } = await admin.rpc('user_effective_permissions', {
      _user_id: userId,
      _company_id: companyId,
    });
    permissions = (perms || []).map((p: any) => p.code);
  }

  // Compute effective role level using canonical ROLE_LEVEL map
  const effectiveRole = companyRole || platformRole || 'user';
  const roleLevel = getRoleLevel(effectiveRole);

  return {
    userId, email, supabase, companyId,
    platformRole, companyRole, roleLevel, enabledModules, permissions,
  };
}

/**
 * Guard an endpoint: validates company header, membership, module, and permission level.
 * Throws descriptive error if any check fails.
 */
export function guardEndpoint(
  ctx: AuthContext,
  options: {
    requireCompany?: boolean;
    requireModule?: string;
    minLevel?: number;
    requirePlatformRole?: string[];
    requirePermission?: string;
  } = {},
): void {
  const { requireCompany = true, requireModule, minLevel = 0, requirePlatformRole, requirePermission } = options;

  // Platform role gate
  if (requirePlatformRole?.length) {
    if (!ctx.platformRole || !requirePlatformRole.includes(ctx.platformRole)) {
      throw new Error(`Platform role required: ${requirePlatformRole.join('|')}`);
    }
    return; // Platform admins bypass company checks
  }

  // Company gate
  if (requireCompany && !ctx.companyId) {
    throw new Error('Missing X-Company-Id header');
  }

  // Membership gate
  if (requireCompany && !ctx.companyRole && !ctx.platformRole) {
    throw new Error('Not a member of this company');
  }

  // Module entitlement gate
  if (requireModule && ctx.roleLevel < 90) {
    if (!ctx.enabledModules.includes(requireModule)) {
      throw new Error(`Module '${requireModule}' is not enabled for this company`);
    }
  }

  // Permission level gate
  if (minLevel > 0 && ctx.roleLevel < minLevel) {
    throw new Error(`Insufficient permissions. Required level: ${minLevel}, your level: ${ctx.roleLevel}`);
  }

  // Granular permission gate
  if (requirePermission && !ctx.permissions.includes(requirePermission)) {
    throw new Error(`Missing permission: ${requirePermission}`);
  }
}
