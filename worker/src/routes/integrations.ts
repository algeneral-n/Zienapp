import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient, checkMembership } from '../supabase';

/**
 * Integration routes:
 *   GET  /api/integrations/catalog             — list all integrations
 *   GET  /api/integrations/company/:companyId   — list company's active integrations
 *   POST /api/integrations/connect              — activate an integration
 *   POST /api/integrations/disconnect           — deactivate an integration
 *   POST /api/integrations/webhook/:code        — handle provider webhooks
 *   GET  /api/integrations/health/:companyId    — integration health status
 */
export async function handleIntegrations(
  request: Request,
  env: Env,
  path: string,
): Promise<Response> {
  // Webhook endpoints do not require user auth
  const webhookMatch = path.match(/^\/api\/integrations\/webhook\/([a-z0-9_-]+)$/);
  if (webhookMatch && request.method === 'POST') {
    return handleWebhook(request, env, webhookMatch[1]);
  }

  // All other routes require auth
  const { userId, supabase } = await requireAuth(request, env);

  if (path === '/api/integrations/catalog' && request.method === 'GET') {
    return getCatalog(request, env);
  }

  const companyMatch = path.match(/^\/api\/integrations\/company\/([0-9a-f-]+)$/);
  if (companyMatch && request.method === 'GET') {
    return getCompanyIntegrations(companyMatch[1], userId, env, supabase);
  }

  if (path === '/api/integrations/connect' && request.method === 'POST') {
    return connectIntegration(request, env, userId, supabase);
  }

  if (path === '/api/integrations/disconnect' && request.method === 'POST') {
    return disconnectIntegration(request, env, userId, supabase);
  }

  const healthMatch = path.match(/^\/api\/integrations\/health\/([0-9a-f-]+)$/);
  if (healthMatch && request.method === 'GET') {
    return getHealthStatus(healthMatch[1], userId, env, supabase);
  }

  return errorResponse('Not found', 404);
}

// ─── GET /api/integrations/catalog ───────────────────────────────────────────

async function getCatalog(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const status = url.searchParams.get('status') ?? 'active';

  const adminClient = createAdminClient(env);

  let query = adminClient
    .from('integrations_catalog')
    .select('id, code, name, description, category, icon_url, is_active, config_schema, commission_rate, tiered_pricing')
    .order('category')
    .order('name');

  if (category) query = query.eq('category', category);
  if (status === 'active') query = query.eq('is_active', true);
  else if (status === 'inactive') query = query.eq('is_active', false);

  const { data, error } = await query;
  if (error) return errorResponse(error.message, 500);

  return jsonResponse({ integrations: data ?? [] });
}

// ─── GET /api/integrations/company/:companyId ────────────────────────────────

async function getCompanyIntegrations(
  companyId: string,
  userId: string,
  env: Env,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  // Verify membership
  const member = await checkMembership(env, userId, companyId);

  if (!member) return errorResponse('Not a member of this company', 403);

  const { data, error } = await supabase
    .from('tenant_integrations')
    .select(`
      id, status, config, activated_at,
      integrations_catalog!inner(code, name, category)
    `)
    .eq('company_id', companyId);

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({ integrations: data ?? [] });
}

// ─── POST /api/integrations/connect ──────────────────────────────────────────

async function connectIntegration(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    companyId: string;
    integrationCode: string;
    config?: Record<string, unknown>;
  };

  if (!body.companyId || !body.integrationCode) {
    return errorResponse('Missing companyId or integrationCode');
  }

  // Verify user has permission to activate (GM, asst GM, or accountant for payment integrations)
  const member = await checkMembership(env, userId, body.companyId);

  if (!member) return errorResponse('Not a member of this company', 403);

  const allowedRoles = ['company_gm', 'executive_secretary', 'accountant'];
  if (!allowedRoles.includes(member.role)) {
    return errorResponse('Insufficient role to activate integrations', 403);
  }

  const adminClient = createAdminClient(env);

  // Get integration from catalog
  const { data: integration } = await adminClient
    .from('integrations_catalog')
    .select('id, code, name, is_active')
    .eq('code', body.integrationCode)
    .eq('is_active', true)
    .maybeSingle();

  if (!integration) return errorResponse('Integration not found or inactive', 404);

  // Upsert tenant integration
  const { data: tenantIntg, error } = await adminClient
    .from('tenant_integrations')
    .upsert(
      {
        company_id: body.companyId,
        integration_id: integration.id,
        config: body.config ?? {},
        status: 'active',
        activated_at: new Date().toISOString(),
      },
      { onConflict: 'company_id,integration_id' },
    )
    .select('id, status')
    .single();

  if (error) return errorResponse(error.message, 500);

  // Log audit
  await supabase.from('audit_logs').insert({
    company_id: body.companyId,
    member_id: userId,
    action: 'integration.connect',
    entity_type: 'tenant_integrations',
    entity_id: tenantIntg.id,
    new_value: { integrationCode: body.integrationCode },
  });

  return jsonResponse({
    id: tenantIntg.id,
    integrationCode: body.integrationCode,
    status: 'active',
    enabledAt: new Date().toISOString(),
  });
}

// ─── POST /api/integrations/disconnect ───────────────────────────────────────

async function disconnectIntegration(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    companyId: string;
    integrationCode: string;
  };

  if (!body.companyId || !body.integrationCode) {
    return errorResponse('Missing companyId or integrationCode');
  }

  // Verify GM role
  const member = await checkMembership(env, userId, body.companyId);

  if (!member) return errorResponse('Not a member of this company', 403);
  if (member.role !== 'company_gm' && member.role !== 'executive_secretary') {
    return errorResponse('Only GM or assistant GM can deactivate integrations', 403);
  }

  const adminClient = createAdminClient(env);

  const { data: integration } = await adminClient
    .from('integrations_catalog')
    .select('id')
    .eq('code', body.integrationCode)
    .maybeSingle();

  if (!integration) return errorResponse('Integration not found', 404);

  const { error } = await adminClient
    .from('tenant_integrations')
    .update({ status: 'inactive' })
    .eq('company_id', body.companyId)
    .eq('integration_id', integration.id);

  if (error) return errorResponse(error.message, 500);

  // Log audit
  await supabase.from('audit_logs').insert({
    company_id: body.companyId,
    member_id: userId,
    action: 'integration.disconnect',
    entity_type: 'tenant_integrations',
    new_value: { integrationCode: body.integrationCode },
  });

  return jsonResponse({ integrationCode: body.integrationCode, status: 'inactive' });
}

// ─── POST /api/integrations/webhook/:code ────────────────────────────────────

async function handleWebhook(
  request: Request,
  env: Env,
  integrationCode: string,
): Promise<Response> {
  const adminClient = createAdminClient(env);

  // Get integration id
  const { data: integration } = await adminClient
    .from('integrations_catalog')
    .select('id')
    .eq('code', integrationCode)
    .maybeSingle();

  if (!integration) return errorResponse('Unknown integration', 404);

  // Parse webhook payload
  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    payload = { raw: await request.text() };
  }

  // Log the event
  // In a real implementation, we'd verify the webhook signature per-provider
  await adminClient.from('integration_events').insert({
    company_id: null, // Will be resolved from payload in production
    integration_id: integration.id,
    event_type: (payload.type as string) ?? 'webhook_received',
    direction: 'inbound',
    payload,
    status: 'received',
  });

  return jsonResponse({ received: true });
}

// ─── GET /api/integrations/health/:companyId ─────────────────────────────────

async function getHealthStatus(
  companyId: string,
  userId: string,
  env: Env,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  // Verify membership
  const member = await checkMembership(env, userId, companyId);

  if (!member) return errorResponse('Not a member of this company', 403);

  // Get active integrations with last event info
  const { data: integrations } = await supabase
    .from('tenant_integrations')
    .select(`
      id, status,
      integrations_catalog!inner(code, name)
    `)
    .eq('company_id', companyId)
    .eq('status', 'active');

  const healthData = [];

  for (const intg of integrations ?? []) {
    const catalog = intg.integrations_catalog as unknown as { code: string; name: string };

    // Get last event and error count
    const { data: lastEvent } = await supabase
      .from('integration_events')
      .select('created_at, status, error_message')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: errorCount } = await supabase
      .from('integration_events')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    healthData.push({
      code: catalog.code,
      name: catalog.name,
      status: (errorCount ?? 0) > 5 ? 'unhealthy' : (errorCount ?? 0) > 0 ? 'degraded' : 'healthy',
      lastEvent: lastEvent?.created_at ?? null,
      errorCount24h: errorCount ?? 0,
      lastError: lastEvent?.status === 'failed' ? lastEvent.error_message : null,
    });
  }

  return jsonResponse({ integrations: healthData });
}
