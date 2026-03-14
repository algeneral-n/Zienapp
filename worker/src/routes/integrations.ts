import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient, checkMembership } from '../supabase';
import { emitDomainEvent } from '../utils/domainEvents';

/**
 * Integration routes:
 *   GET  /api/integrations/catalog             — list all integrations
 *   GET  /api/integrations/company/:companyId   — list company's active integrations
 *   POST /api/integrations/connect              — activate an integration
 *   POST /api/integrations/disconnect           — deactivate an integration
 *   POST /api/integrations/purchase             — initiate payment for paid integration
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

  if (path === '/api/integrations/purchase' && request.method === 'POST') {
    return purchaseIntegration(request, env, userId, supabase);
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
    paymentIntentId?: string;
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

  // Get integration from catalog with pricing details
  const { data: integration } = await adminClient
    .from('integrations_catalog')
    .select('id, code, name, is_active, pricing_model, commission_rate, tiered_pricing, required_plan')
    .eq('code', body.integrationCode)
    .eq('is_active', true)
    .maybeSingle();

  if (!integration) return errorResponse('Integration not found or inactive', 404);

  // Check plan requirement
  if (integration.required_plan) {
    const { data: subscription } = await adminClient
      .from('company_subscriptions')
      .select('plan_code, status')
      .eq('company_id', body.companyId)
      .eq('status', 'active')
      .maybeSingle();

    if (!subscription || subscription.plan_code !== integration.required_plan) {
      return errorResponse(`This integration requires the "${integration.required_plan}" plan`, 403);
    }
  }

  // Check if this is a paid integration that requires payment
  const isPaid = integration.pricing_model === 'fixed' ||
    (integration.tiered_pricing && Object.keys(integration.tiered_pricing).length > 0);

  if (isPaid && !body.paymentIntentId) {
    // Return pricing info so the client can initiate payment first
    return jsonResponse({
      requiresPayment: true,
      integrationCode: body.integrationCode,
      pricingModel: integration.pricing_model,
      tieredPricing: integration.tiered_pricing,
      commissionRate: integration.commission_rate,
      message: 'This integration requires payment. Use POST /api/integrations/purchase first.',
    }, 402);
  }

  // If payment was provided, verify it
  if (body.paymentIntentId) {
    const { data: payment } = await adminClient
      .from('integration_payments')
      .select('id, status')
      .eq('id', body.paymentIntentId)
      .eq('company_id', body.companyId)
      .eq('integration_code', body.integrationCode)
      .maybeSingle();

    if (!payment || payment.status !== 'paid') {
      return errorResponse('Payment not found or not completed', 402);
    }
  }

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
    new_value: { integrationCode: body.integrationCode, paymentIntentId: body.paymentIntentId || null },
  });

  emitDomainEvent(env, {
    eventName: 'integration.connected',
    entityType: 'tenant_integrations',
    entityId: tenantIntg.id,
    companyId: body.companyId,
    actorUserId: userId,
    payload: { integrationCode: body.integrationCode },
  });

  return jsonResponse({
    id: tenantIntg.id,
    integrationCode: body.integrationCode,
    status: 'active',
    enabledAt: new Date().toISOString(),
  });
}

// ─── POST /api/integrations/purchase ─────────────────────────────────────────

async function purchaseIntegration(
  request: Request,
  env: Env,
  userId: string,
  supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
  const body = (await request.json()) as {
    companyId: string;
    integrationCode: string;
    pricingTier?: string;
  };

  if (!body.companyId || !body.integrationCode) {
    return errorResponse('Missing companyId or integrationCode');
  }

  const member = await checkMembership(env, userId, body.companyId);
  if (!member) return errorResponse('Not a member of this company', 403);

  const allowedRoles = ['company_gm', 'executive_secretary', 'accountant'];
  if (!allowedRoles.includes(member.role)) {
    return errorResponse('Insufficient role to purchase integrations', 403);
  }

  const adminClient = createAdminClient(env);

  // Get integration pricing
  const { data: integration } = await adminClient
    .from('integrations_catalog')
    .select('id, code, name, pricing_model, tiered_pricing, commission_rate, is_active')
    .eq('code', body.integrationCode)
    .eq('is_active', true)
    .maybeSingle();

  if (!integration) return errorResponse('Integration not found or inactive', 404);

  // Determine price
  let amount = 0;
  let currency = 'AED';
  const tieredPricing = integration.tiered_pricing as Record<string, { price: number; currency?: string }> | null;

  if (tieredPricing && body.pricingTier && tieredPricing[body.pricingTier]) {
    amount = tieredPricing[body.pricingTier].price;
    currency = tieredPricing[body.pricingTier].currency || 'AED';
  } else if (tieredPricing) {
    // Default to first tier
    const firstTier = Object.values(tieredPricing)[0];
    if (firstTier) {
      amount = firstTier.price;
      currency = firstTier.currency || 'AED';
    }
  }

  // For usage-based or commission: record activation, billing is metered separately
  if (integration.pricing_model === 'usage' || integration.pricing_model === 'commission') {
    const { data: payment, error } = await adminClient
      .from('integration_payments')
      .insert({
        company_id: body.companyId,
        integration_code: body.integrationCode,
        integration_id: integration.id,
        amount: 0,
        currency,
        pricing_model: integration.pricing_model,
        pricing_tier: body.pricingTier || null,
        status: 'paid', // Usage/commission = pay as you use
      })
      .select('id')
      .single();

    if (error) return errorResponse(error.message, 500);

    return jsonResponse({
      paymentIntentId: payment.id,
      status: 'paid',
      amount: 0,
      currency,
      pricingModel: integration.pricing_model,
      message: 'Usage/commission-based — no upfront payment. Billed based on usage.',
    });
  }

  // Fixed pricing — create a Stripe PaymentIntent (or record manually)
  if (amount > 0 && env.STRIPE_SECRET_KEY) {
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(Math.round(amount * 100)),
        currency: currency.toLowerCase(),
        'metadata[company_id]': body.companyId,
        'metadata[integration_code]': body.integrationCode,
        'metadata[user_id]': userId,
      }).toString(),
    });

    const stripeData = (await stripeResponse.json()) as { id?: string; client_secret?: string; error?: { message: string } };

    if (!stripeResponse.ok || stripeData.error) {
      return errorResponse(stripeData.error?.message || 'Payment provider error', 502);
    }

    // Record the pending payment
    const { data: payment, error } = await adminClient
      .from('integration_payments')
      .insert({
        company_id: body.companyId,
        integration_code: body.integrationCode,
        integration_id: integration.id,
        amount,
        currency,
        pricing_model: integration.pricing_model,
        pricing_tier: body.pricingTier || null,
        stripe_payment_intent_id: stripeData.id,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) return errorResponse(error.message, 500);

    return jsonResponse({
      paymentIntentId: payment.id,
      stripeClientSecret: stripeData.client_secret,
      status: 'pending',
      amount,
      currency,
    });
  }

  // No Stripe key or free integration — auto-approve
  const { data: payment, error } = await adminClient
    .from('integration_payments')
    .insert({
      company_id: body.companyId,
      integration_code: body.integrationCode,
      integration_id: integration.id,
      amount: 0,
      currency,
      pricing_model: integration.pricing_model || 'free',
      status: 'paid',
    })
    .select('id')
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({
    paymentIntentId: payment.id,
    status: 'paid',
    amount: 0,
    currency,
    message: 'Free integration — no payment required.',
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

  emitDomainEvent(env, {
    eventName: 'integration.disconnected',
    entityType: 'tenant_integrations',
    companyId: body.companyId,
    actorUserId: userId,
    payload: { integrationCode: body.integrationCode },
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
