import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient, checkMembership } from '../supabase';
import { emitDomainEvent } from '../utils/domainEvents';
import { autoRestrict, autoSuspend } from '../utils/tenantLifecycle';
import { StripeEngine } from './StripeEngine';
import type StripeType from 'stripe';

// ─── Payment Gateway Types ──────────────────────────────────────────────
type GatewayType = 'stripe' | 'network_international' | 'tilr';
type PaymentRegion = 'AE' | 'SA' | 'EG' | 'BH' | 'OM' | 'QA' | 'KW' | 'GLOBAL';

// ─── Post-payment Module Activation ─────────────────────────────────────
// After successful payment, activate the modules included in the company's plan
async function activateCompanyModulesAfterPayment(
    adminSupabase: import('@supabase/supabase-js').SupabaseClient,
    companyId: string,
): Promise<void> {
    try {
        // 1. Get the subscription to find the plan
        const { data: sub } = await adminSupabase
            .from('company_subscriptions')
            .select('plan_code')
            .eq('company_id', companyId)
            .eq('status', 'active')
            .maybeSingle();
        if (!sub?.plan_code) return;

        // 2. Get the plan's included modules
        const { data: plan } = await adminSupabase
            .from('subscription_plans')
            .select('included_modules, max_users, features')
            .eq('code', sub.plan_code)
            .maybeSingle();
        if (!plan) return;

        // included_modules is JSONB array of module codes, e.g. ["hr", "crm", "accounting"]
        const moduleCodes: string[] = (plan.included_modules as string[]) || [];
        if (moduleCodes.length === 0) return;

        // 3. Resolve module IDs from modules_catalog
        const { data: modules } = await adminSupabase
            .from('modules_catalog')
            .select('id, code')
            .in('code', moduleCodes);
        if (!modules?.length) return;

        // 4. Activate each module (upsert into company_modules)
        const rows = modules.map(m => ({
            company_id: companyId,
            module_id: m.id,
            module_code: m.code,
            is_active: true,
            activated_at: new Date().toISOString(),
        }));

        await adminSupabase
            .from('company_modules')
            .upsert(rows, { onConflict: 'company_id,module_id' });

        // 5. Log the activation event
        await adminSupabase.from('payment_events').insert({
            company_id: companyId,
            event_type: 'modules_activated',
            gateway: 'system',
            status: 'success',
            raw_data: { plan_code: sub.plan_code, modules: moduleCodes },
        });
    } catch (err) {
        console.error('Module activation after payment failed:', err);
    }
}

// ─── Subscription Status Check ──────────────────────────────────────────
// Middleware helper: verify company has active subscription before allowing access
export async function checkSubscriptionActive(
    adminSupabase: import('@supabase/supabase-js').SupabaseClient,
    companyId: string,
): Promise<{ active: boolean; status: string; daysRemaining: number }> {
    const { data: sub } = await adminSupabase
        .from('company_subscriptions')
        .select('status, current_period_end, plan_code')
        .eq('company_id', companyId)
        .maybeSingle();

    if (!sub) return { active: false, status: 'no_subscription', daysRemaining: 0 };

    const isActive = sub.status === 'active' || sub.status === 'trialing';
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
    const now = new Date();
    const daysRemaining = periodEnd ? Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Grace period: allow 7 days after expiry for past_due
    if (sub.status === 'past_due' && daysRemaining >= -7) {
        return { active: true, status: 'past_due', daysRemaining };
    }

    return { active: isActive, status: sub.status, daysRemaining };
}

// ─── Usage Tracking Helper ──────────────────────────────────────────────
// Auto-increment usage counters for AI calls, storage, seats
export async function trackUsage(
    adminSupabase: import('@supabase/supabase-js').SupabaseClient,
    companyId: string,
    usageType: 'ai_query' | 'storage_mb' | 'api_call' | 'seat',
    quantity: number = 1,
    _metadata?: Record<string, unknown>,
): Promise<void> {
    try {
        // Use atomic DB function for reliable counting
        await adminSupabase.rpc('meter_usage', {
            _company_id: companyId,
            _counter_type: usageType,
            _amount: quantity,
        });
    } catch {
        // Non-blocking — usage tracking failures shouldn't break the main flow
    }
}

// ─── Payment Orchestrator ───────────────────────────────────────────────
// Inspired by archive PaymentOrchestrator.ts — Smart routing across gateways
function selectGateway(region: PaymentRegion, _amount: number): GatewayType {
    const REGION_GATEWAY: Record<PaymentRegion, GatewayType> = {
        AE: 'network_international',
        SA: 'network_international',
        BH: 'network_international',
        OM: 'network_international',
        QA: 'network_international',
        KW: 'network_international',
        EG: 'tilr',
        GLOBAL: 'stripe',
    };
    return REGION_GATEWAY[region] || 'stripe';
}

/**
 * Billing routes:
 *   POST /api/billing/create-checkout-session
 *   POST /api/billing/create-portal-session
 *   POST /api/billing/webhook (no auth — Stripe signature verified)
 *   POST /api/billing/webhook/network-intl (no auth — NI signature)
 *   POST /api/billing/webhook/tilr (no auth — Tilr signature)
 *   GET  /api/billing/subscription/:companyId
 *   POST /api/billing/orchestrate — Smart payment routing
 *   GET  /api/billing/usage/:companyId — AI + tenant usage
 *   POST /api/billing/usage/report — Report AI usage
 *   GET  /api/billing/plans — List available plans
 */
export async function handleBilling(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    // Webhook routes — no user auth, signature-verified
    if (path === '/api/billing/webhook' && request.method === 'POST') {
        return handleWebhook(request, env);
    }
    if (path === '/api/billing/webhook/network-intl' && request.method === 'POST') {
        return handleNetworkIntlWebhook(request, env);
    }
    if (path === '/api/billing/webhook/tilr' && request.method === 'POST') {
        return handleTilrWebhook(request, env);
    }

    // Plans endpoint — no auth needed
    if (path === '/api/billing/plans' && request.method === 'GET') {
        return getPlans(env);
    }

    // Apple Pay domain verification — no auth needed
    if (path === '/.well-known/apple-developer-merchantid-domain-association') {
        return new Response(env.APPLE_PAY_LATER_TOKEN || '', {
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    // All other routes require auth
    const { userId, supabase } = await requireAuth(request, env);

    if (path === '/api/billing/create-checkout-session' && request.method === 'POST') {
        return createCheckoutSession(request, env, userId, supabase);
    }

    if (path === '/api/billing/create-portal-session' && request.method === 'POST') {
        return createPortalSession(request, env, userId, supabase);
    }

    if (path === '/api/billing/create-setup-intent' && request.method === 'POST') {
        return createSetupIntentHandler(request, env, userId, supabase);
    }

    if (path === '/api/billing/orchestrate' && request.method === 'POST') {
        return orchestratePayment(request, env, userId, supabase);
    }

    // Subscription management
    if (path === '/api/billing/cancel-subscription' && request.method === 'POST') {
        return cancelSubscriptionHandler(request, env, userId, supabase);
    }

    if (path === '/api/billing/upgrade-subscription' && request.method === 'POST') {
        return upgradeSubscriptionHandler(request, env, userId, supabase);
    }

    if (path === '/api/billing/check-subscription' && request.method === 'POST') {
        return checkSubscriptionHandler(request, env, userId, supabase);
    }

    // Integration pricing
    if (path === '/api/billing/integration-pricing' && request.method === 'GET') {
        return getIntegrationPricing(env, supabase);
    }

    // Create subscription with payment method (after setup intent)
    if (path === '/api/billing/create-subscription' && request.method === 'POST') {
        return createSubscriptionHandler(request, env, userId, supabase);
    }

    // Store billing breakdown after quote acceptance
    if (path === '/api/billing/store-breakdown' && request.method === 'POST') {
        return storeBreakdownHandler(request, env, userId, supabase);
    }

    if (path.startsWith('/api/billing/subscription/') && request.method === 'GET') {
        const companyId = path.replace('/api/billing/subscription/', '');
        return getSubscription(companyId, userId, env, supabase);
    }

    if (path.startsWith('/api/billing/usage/') && request.method === 'GET') {
        const companyId = path.replace('/api/billing/usage/', '');
        return getUsage(companyId, userId, env, supabase);
    }

    if (path === '/api/billing/usage/report' && request.method === 'POST') {
        return reportUsage(request, userId, supabase);
    }

    return errorResponse('Not found', 404);
}

async function createCheckoutSession(
    request: Request,
    env: Env,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        companyId: string;
        planCode: string;
        billingInterval?: 'monthly' | 'yearly';
        successUrl?: string;
        cancelUrl?: string;
    };

    if (!body.companyId || !body.planCode) {
        return errorResponse('Missing companyId or planCode');
    }

    // Verify ownership
    const { data: company } = await supabase
        .from('companies')
        .select('id, name, slug, owner_user_id')
        .eq('id', body.companyId)
        .single();

    if (!company || company.owner_user_id !== userId) {
        return errorResponse('Only the company owner can manage billing', 403);
    }

    // Get or create Stripe customer using StripeEngine
    let { data: sub } = await supabase
        .from('company_subscriptions')
        .select('stripe_customer_id')
        .eq('company_id', body.companyId)
        .maybeSingle();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        const stripeEngine = new StripeEngine(env.STRIPE_SECRET_KEY);
        customerId = await stripeEngine.createCustomer(body.companyId, profile?.email);

        // Upsert subscription record
        await supabase.from('company_subscriptions').upsert({
            company_id: body.companyId,
            stripe_customer_id: customerId,
            status: 'incomplete',
        });
    }

    // Create checkout session using StripeEngine
    const stripeEng = new StripeEngine(env.STRIPE_SECRET_KEY);
    const session = await stripeEng.createCheckoutSession(
        body.planCode,
        customerId,
        body.successUrl ?? 'https://www.zien-ai.app/portal?billing=success',
        body.cancelUrl ?? 'https://www.zien-ai.app/portal?billing=cancelled',
        { companyId: body.companyId }
    );

    return jsonResponse({ url: session.url, sessionId: session.id });
}

async function createPortalSession(
    request: Request,
    env: Env,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { companyId: string };

    const { data: sub } = await supabase
        .from('company_subscriptions')
        .select('stripe_customer_id')
        .eq('company_id', body.companyId)
        .maybeSingle();

    if (!sub?.stripe_customer_id) {
        return errorResponse('No active subscription found', 404);
    }

    const stripeEngine = new StripeEngine(env.STRIPE_SECRET_KEY);
    const session = await stripeEngine.createBillingPortal(
        sub.stripe_customer_id,
        'https://www.zien-ai.app/portal'
    );
    return jsonResponse({ url: session.url });
}

async function createSetupIntentHandler(
    request: Request,
    env: Env,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { companyId: string; planCode?: string };
    if (!body.companyId) return errorResponse('Missing companyId');

    // Verify ownership
    const { data: company } = await supabase
        .from('companies')
        .select('id, owner_user_id')
        .eq('id', body.companyId)
        .single();
    if (!company || company.owner_user_id !== userId) {
        return errorResponse('Only the company owner can manage billing', 403);
    }

    // Get or create Stripe customer
    let { data: sub } = await supabase
        .from('company_subscriptions')
        .select('stripe_customer_id')
        .eq('company_id', body.companyId)
        .maybeSingle();

    let customerId = sub?.stripe_customer_id;
    const stripeEngine = new StripeEngine(env.STRIPE_SECRET_KEY);

    if (!customerId) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();
        customerId = await stripeEngine.createCustomer(body.companyId, profile?.email);
        await supabase.from('company_subscriptions').upsert({
            company_id: body.companyId,
            stripe_customer_id: customerId,
            status: 'incomplete',
        });
    }

    const setupIntent = await stripeEngine.createSetupIntent(customerId, {
        companyId: body.companyId,
        ...(body.planCode ? { planCode: body.planCode } : {}),
    });

    return jsonResponse({
        clientSecret: setupIntent.client_secret,
        customerId,
    });
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
    const signature = request.headers.get('Stripe-Signature');
    if (!signature) return errorResponse('Missing signature', 400);

    const rawBody = await request.text();
    // StripeEngine does not handle webhooks directly, so keep this logic as is for now
    const Stripe = (await import('stripe')).default as typeof StripeType;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });

    let event: StripeType.Event;
    try {
        event = await stripe.webhooks.constructEventAsync(
            rawBody,
            signature,
            env.STRIPE_WEBHOOK_SECRET,
        );
    } catch {
        return errorResponse('Invalid signature', 400);
    }

    // Handle relevant events
    const { createClient } = await import('@supabase/supabase-js');
    const adminSupabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as StripeType.Checkout.Session;
            const companyId = session.metadata?.companyId;
            if (companyId) {
                await adminSupabase
                    .from('company_subscriptions')
                    .update({
                        stripe_subscription_id: session.subscription as string,
                        status: 'active',
                    })
                    .eq('company_id', companyId);

                // ── Update company status from pending_payment → active ─────
                await adminSupabase
                    .from('companies')
                    .update({ status: 'active' })
                    .eq('id', companyId)
                    .in('status', ['pending_payment', 'pending_review']);

                // ── Post-payment: activate plan modules ─────────────────────
                await activateCompanyModulesAfterPayment(adminSupabase, companyId);
            }
            break;
        }

        case 'customer.subscription.updated': {
            const sub = event.data.object as StripeType.Subscription;
            await adminSupabase
                .from('company_subscriptions')
                .update({
                    status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled',
                    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
                    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                    cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
                })
                .eq('stripe_subscription_id', sub.id);
            break;
        }

        case 'customer.subscription.deleted': {
            const sub = event.data.object as StripeType.Subscription;
            await adminSupabase
                .from('company_subscriptions')
                .update({ status: 'canceled', dunning_stage: 'none' })
                .eq('stripe_subscription_id', sub.id);
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as StripeType.Invoice;
            const subId = invoice.subscription as string | null;
            if (!subId) break;

            // Find company by stripe_subscription_id
            const { data: failedSub } = await adminSupabase
                .from('company_subscriptions')
                .select('company_id, dunning_stage')
                .eq('stripe_subscription_id', subId)
                .maybeSingle();

            if (!failedSub?.company_id) break;

            const companyId = failedSub.company_id;
            const currentStage = failedSub.dunning_stage || 'none';

            // Dunning escalation: none → grace → past_due → restricted → suspended
            const DUNNING_LADDER: Record<string, { next: string; subStatus: string; action?: 'restrict' | 'suspend' }> = {
                none: { next: 'grace', subStatus: 'past_due' },
                grace: { next: 'past_due', subStatus: 'past_due' },
                past_due: { next: 'restricted', subStatus: 'past_due', action: 'restrict' },
                restricted: { next: 'suspended', subStatus: 'canceled', action: 'suspend' },
            };

            const step = DUNNING_LADDER[currentStage] || DUNNING_LADDER['restricted'];

            // Update subscription record
            await adminSupabase
                .from('company_subscriptions')
                .update({ status: step.subStatus, dunning_stage: step.next })
                .eq('stripe_subscription_id', subId);

            // Trigger tenant lifecycle actions
            if (step.action === 'restrict') {
                await autoRestrict(adminSupabase, env, companyId, 'Repeated payment failure');
            } else if (step.action === 'suspend') {
                await autoSuspend(adminSupabase, env, companyId, 'Payment failure — account suspended');
            }

            // Emit domain event
            emitDomainEvent(env, {
                eventName: 'billing.dunning.escalated',
                entityType: 'subscriptions',
                companyId,
                payload: { fromStage: currentStage, toStage: step.next, invoiceId: invoice.id },
            });

            // Log billing event
            await adminSupabase.from('billing_events').insert({
                company_id: companyId,
                event_type: 'dunning_escalation',
                payload: { fromStage: currentStage, toStage: step.next, invoiceId: invoice.id },
            });

            break;
        }

        case 'invoice.paid': {
            // Payment recovered — reset dunning
            const invoice = event.data.object as StripeType.Invoice;
            const subId = invoice.subscription as string | null;
            if (!subId) break;

            await adminSupabase
                .from('company_subscriptions')
                .update({ status: 'active', dunning_stage: 'none' })
                .eq('stripe_subscription_id', subId);
            break;
        }
    }

    return jsonResponse({ received: true });
}
// ─── Smart Payment Orchestration ────────────────────────────────────────────
// Inspired by archive PaymentOrchestrator.ts + NetworkInternationalEngine.ts + TilrEngine.ts

async function orchestratePayment(
    request: Request,
    env: Env,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        companyId: string;
        planCode: string;
        region?: PaymentRegion;
        billingInterval?: 'monthly' | 'yearly';
        successUrl?: string;
        cancelUrl?: string;
    };

    if (!body.companyId || !body.planCode) {
        return errorResponse('Missing companyId or planCode');
    }

    const region = body.region || 'GLOBAL';
    const gateway = selectGateway(region, 0);

    // Log orchestration decision
    await supabase.from('payment_events').insert({
        company_id: body.companyId,
        event_type: 'orchestration',
        gateway,
        region,
        plan_code: body.planCode,
        created_by: userId,
    }).then(() => { });

    switch (gateway) {
        case 'stripe': {
            // Use existing Stripe flow
            const { data: company } = await supabase
                .from('companies')
                .select('id, name, owner_user_id')
                .eq('id', body.companyId)
                .single();

            if (!company || company.owner_user_id !== userId) {
                return errorResponse('Only the company owner can manage billing', 403);
            }

            let { data: sub } = await supabase
                .from('company_subscriptions')
                .select('stripe_customer_id')
                .eq('company_id', body.companyId)
                .maybeSingle();

            let customerId = sub?.stripe_customer_id;

            if (!customerId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email, full_name')
                    .eq('id', userId)
                    .single();

                const stripeEngine = new StripeEngine(env.STRIPE_SECRET_KEY);
                customerId = await stripeEngine.createCustomer(body.companyId, profile?.email);
                await supabase.from('company_subscriptions').upsert({
                    company_id: body.companyId,
                    stripe_customer_id: customerId,
                    status: 'incomplete',
                });
            }

            const stripeEng = new StripeEngine(env.STRIPE_SECRET_KEY);
            const session = await stripeEng.createCheckoutSession(
                body.planCode,
                customerId,
                body.successUrl ?? 'https://www.zien-ai.app/portal?billing=success',
                body.cancelUrl ?? 'https://www.zien-ai.app/portal?billing=cancelled',
                { companyId: body.companyId }
            );

            emitDomainEvent(env, {
                eventName: 'payment.checkout.started',
                entityType: 'subscriptions',
                companyId: body.companyId,
                actorUserId: userId,
                payload: { gateway: 'stripe', planCode: body.planCode },
            });

            return jsonResponse({
                gateway: 'stripe',
                url: session.url,
                sessionId: session.id,
            });
        }

        case 'network_international': {
            // Network International — UAE/GCC gateway
            const { data: plan } = await supabase
                .from('subscription_plans')
                .select('price_monthly, price_yearly, currency')
                .eq('code', body.planCode)
                .maybeSingle();

            if (!plan) return errorResponse('Plan not found', 404);

            const niAmount = body.billingInterval === 'yearly'
                ? (plan.price_yearly ?? plan.price_monthly * 10)
                : plan.price_monthly;
            const niCurrency = plan.currency || 'AED';

            // Build NI payment order
            const niOrderRef = `NI-${body.companyId}-${Date.now()}`;
            const niPayload = {
                order: {
                    action: 'SALE',
                    amount: { currencyCode: niCurrency, value: Math.round(niAmount * 100) },
                    language: 'en',
                    merchantOrderReference: niOrderRef,
                },
                configuration: {
                    returnUrl: body.successUrl ?? 'https://www.zien-ai.app/portal?billing=success',
                    locale: 'en',
                    paymentAction: 'SALE',
                },
            };

            // Network International API call
            const niApiUrl = (env as unknown as Record<string, string>).NI_API_URL || 'https://api-gateway.ngenius-payments.com';
            const niApiKey = (env as unknown as Record<string, string>).NI_API_KEY || '';

            if (!niApiKey) {
                // Fallback to Stripe if NI not configured
                return jsonResponse({
                    gateway: 'network_international',
                    status: 'fallback_stripe',
                    message: 'NI gateway not configured — falling back to Stripe.',
                    fallback: 'stripe',
                    region,
                });
            }

            try {
                // Get access token
                const tokenRes = await fetch(`${niApiUrl}/identity/auth/access-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/vnd.ni-identity.v1+json', Authorization: `Basic ${niApiKey}` },
                });
                const tokenData = (await tokenRes.json()) as { access_token: string };

                // Create order
                const niOutlet = (env as unknown as Record<string, string>).NI_OUTLET_REF || '';
                const orderRes = await fetch(`${niApiUrl}/transactions/outlets/${niOutlet}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/vnd.ni-payment.v2+json',
                        Authorization: `Bearer ${tokenData.access_token}`,
                    },
                    body: JSON.stringify(niPayload),
                });

                const orderData = (await orderRes.json()) as {
                    reference: string;
                    _links: { payment: { href: string } };
                    _id: string;
                };

                // Store subscription record
                await supabase.from('company_subscriptions').upsert({
                    company_id: body.companyId,
                    status: 'incomplete',
                    gateway: 'network_international',
                    gateway_reference: orderData.reference || orderData._id,
                    plan_code: body.planCode,
                    billing_interval: body.billingInterval || 'monthly',
                });

                return jsonResponse({
                    gateway: 'network_international',
                    status: 'redirect',
                    url: orderData._links?.payment?.href,
                    orderRef: orderData.reference || niOrderRef,
                    region,
                });
            } catch (niError) {
                // NI API failure — offer Stripe fallback
                const niMsg = niError instanceof Error ? niError.message : 'NI API error';
                await supabase.from('payment_events').insert({
                    company_id: body.companyId,
                    event_type: 'ni_api_error',
                    gateway: 'network_international',
                    status: 'error',
                    raw_data: { error: niMsg },
                });

                return jsonResponse({
                    gateway: 'network_international',
                    status: 'error',
                    message: 'Network International gateway temporarily unavailable.',
                    fallback: 'stripe',
                    region,
                });
            }
        }

        case 'tilr': {
            // Tilr — Regional gateway (Egypt)
            const { data: plan } = await supabase
                .from('subscription_plans')
                .select('price_monthly, price_yearly, currency')
                .eq('code', body.planCode)
                .maybeSingle();

            if (!plan) return errorResponse('Plan not found', 404);

            const tilrAmount = body.billingInterval === 'yearly'
                ? (plan.price_yearly ?? plan.price_monthly * 10)
                : plan.price_monthly;
            const tilrCurrency = plan.currency || 'EGP';

            const tilrApiUrl = (env as unknown as Record<string, string>).TILR_API_URL || 'https://api.tilr.io';
            const tilrApiKey = (env as unknown as Record<string, string>).TILR_API_KEY || '';
            const tilrMerchantId = (env as unknown as Record<string, string>).TILR_MERCHANT_ID || '';

            if (!tilrApiKey || !tilrMerchantId) {
                return jsonResponse({
                    gateway: 'tilr',
                    status: 'fallback_stripe',
                    message: 'Tilr gateway not configured — falling back to Stripe.',
                    fallback: 'stripe',
                    region,
                });
            }

            try {
                const tilrRef = `TILR-${body.companyId}-${Date.now()}`;
                const tilrRes = await fetch(`${tilrApiUrl}/v1/payments/initiate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': tilrApiKey,
                        'X-Merchant-Id': tilrMerchantId,
                    },
                    body: JSON.stringify({
                        amount: tilrAmount,
                        currency: tilrCurrency,
                        reference: tilrRef,
                        description: `Zien ${body.planCode} subscription`,
                        callback_url: 'https://api.plt.zien-ai.app/api/billing/webhook/tilr',
                        success_url: body.successUrl ?? 'https://www.zien-ai.app/portal?billing=success',
                        cancel_url: body.cancelUrl ?? 'https://www.zien-ai.app/portal?billing=cancelled',
                        metadata: {
                            company_id: body.companyId,
                            plan_code: body.planCode,
                            user_id: userId,
                        },
                    }),
                });

                const tilrData = (await tilrRes.json()) as {
                    payment_id: string;
                    redirect_url: string;
                    status: string;
                };

                await supabase.from('company_subscriptions').upsert({
                    company_id: body.companyId,
                    status: 'incomplete',
                    gateway: 'tilr',
                    gateway_reference: tilrData.payment_id || tilrRef,
                    plan_code: body.planCode,
                    billing_interval: body.billingInterval || 'monthly',
                });

                return jsonResponse({
                    gateway: 'tilr',
                    status: 'redirect',
                    url: tilrData.redirect_url,
                    paymentId: tilrData.payment_id,
                    region,
                });
            } catch (tilrError) {
                const tilrMsg = tilrError instanceof Error ? tilrError.message : 'Tilr API error';
                await supabase.from('payment_events').insert({
                    company_id: body.companyId,
                    event_type: 'tilr_api_error',
                    gateway: 'tilr',
                    status: 'error',
                    raw_data: { error: tilrMsg },
                });

                return jsonResponse({
                    gateway: 'tilr',
                    status: 'error',
                    message: 'Tilr gateway temporarily unavailable.',
                    fallback: 'stripe',
                    region,
                });
            }
        }

        default:
            return errorResponse('Unknown gateway', 400);
    }
}

// ─── Get Subscription Details ───────────────────────────────────────────────

async function getSubscription(
    companyId: string,
    userId: string,
    env: Env,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    // Verify membership
    const membership = await checkMembership(env, userId, companyId);

    if (!membership) return errorResponse('Not a member', 403);

    const { data: sub, error } = await supabase
        .from('company_subscriptions')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

    if (error) return errorResponse(error.message, 500);
    if (!sub) return jsonResponse({ subscription: null, status: 'no_subscription' });

    // Get plan details
    const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('code', sub.plan_code)
        .maybeSingle();

    return jsonResponse({
        subscription: sub,
        plan,
    });
}

// ─── Usage Tracking ─────────────────────────────────────────────────────────
// Inspired by archive AIUsage.ts + TenantUsage.ts

async function getUsage(
    companyId: string,
    userId: string,
    env: Env,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const membership = await checkMembership(env, userId, companyId);

    if (!membership) return errorResponse('Not a member', 403);

    // Get current billing period
    const { data: sub } = await supabase
        .from('company_subscriptions')
        .select('current_period_start, current_period_end, plan_code')
        .eq('company_id', companyId)
        .maybeSingle();

    const periodStart = sub?.current_period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // AI usage this period
    const { data: aiLogs, error: aiErr } = await supabase
        .from('ai_usage_logs')
        .select('tokens_in, tokens_out, agent_type')
        .eq('company_id', companyId)
        .gte('created_at', periodStart);

    // User count (admin bypasses RLS)
    const adminClient = createAdminClient(env);
    const { count: userCount } = await adminClient
        .from('company_members')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active');

    // Plan limits
    const { data: plan } = await supabase
        .from('subscription_plans')
        .select('max_users, features')
        .eq('code', sub?.plan_code || 'basic')
        .maybeSingle();

    const totalTokensIn = (aiLogs || []).reduce((s, l) => s + (l.tokens_in || 0), 0);
    const totalTokensOut = (aiLogs || []).reduce((s, l) => s + (l.tokens_out || 0), 0);
    const totalAIQueries = (aiLogs || []).length;

    // Extract AI quota from plan features
    const aiQuota = (plan?.features as Record<string, unknown>)?.ai_quota ?? 1000;

    return jsonResponse({
        company_id: companyId,
        period_start: periodStart,
        period_end: sub?.current_period_end || null,
        ai: {
            queries_used: totalAIQueries,
            quota: aiQuota,
            usage_percent: Math.round((totalAIQueries / (aiQuota as number)) * 100),
            tokens_in: totalTokensIn,
            tokens_out: totalTokensOut,
        },
        users: {
            active: userCount || 0,
            max: plan?.max_users || 5,
            usage_percent: Math.round(((userCount || 0) / (plan?.max_users || 5)) * 100),
        },
    });
}

async function reportUsage(
    request: Request,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        companyId: string;
        usageType: 'ai_query' | 'storage' | 'api_call';
        quantity: number;
        metadata?: Record<string, unknown>;
    };

    if (!body.companyId || !body.usageType) {
        return errorResponse('Missing companyId or usageType');
    }

    const { error } = await supabase.from('usage_records').insert({
        company_id: body.companyId,
        user_id: userId,
        usage_type: body.usageType,
        quantity: body.quantity || 1,
        metadata: body.metadata || {},
    });

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ recorded: true });
}

// ─── Plans Listing ──────────────────────────────────────────────────────────

async function getPlans(env: Env): Promise<Response> {
    const adminSupabase = createAdminClient(env);

    const { data: plans, error } = await adminSupabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

    if (error) return errorResponse(error.message, 500);

    const { data: addons } = await adminSupabase
        .from('pricing_addons')
        .select('*')
        .eq('is_active', true);

    return jsonResponse({ plans: plans || [], addons: addons || [] });
}

// ─── Network International Webhook ──────────────────────────────────────────
// Inspired by archive NetworkInternationalWebhookHandler.ts

async function handleNetworkIntlWebhook(request: Request, env: Env): Promise<Response> {
    // ── Signature verification ──────────────────────────────────────────
    const niSecret = (env as unknown as Record<string, string>).NI_WEBHOOK_SECRET;
    if (niSecret) {
        const signature = request.headers.get('x-ni-signature') || request.headers.get('x-webhook-signature') || '';
        const rawBody = await request.clone().text();
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(niSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
        const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (signature !== expected && signature !== `sha256=${expected}`) {
            return errorResponse('Invalid webhook signature', 401);
        }
    }

    const body = (await request.json()) as {
        event_type: string;
        transaction_id: string;
        status: string;
        amount: number;
        currency: string;
        metadata?: Record<string, string>;
    };

    const adminSupabase = createAdminClient(env);

    // Log the webhook event
    await adminSupabase.from('payment_events').insert({
        event_type: `ni_${body.event_type}`,
        gateway: 'network_international',
        transaction_id: body.transaction_id,
        status: body.status,
        amount: body.amount,
        currency: body.currency,
        raw_data: body,
    });

    // Handle payment success
    if (body.event_type === 'payment_completed' && body.status === 'success') {
        const companyId = body.metadata?.company_id;
        if (companyId) {
            await adminSupabase
                .from('company_subscriptions')
                .update({
                    status: 'active',
                    gateway: 'network_international',
                    last_payment_at: new Date().toISOString(),
                })
                .eq('company_id', companyId);

            // ── Update company status from pending_payment → active ─────
            await adminSupabase
                .from('companies')
                .update({ status: 'active' })
                .eq('id', companyId)
                .in('status', ['pending_payment', 'pending_review']);

            // ── Post-payment: activate plan modules ─────────────────────
            await activateCompanyModulesAfterPayment(adminSupabase, companyId);
        }
    }

    // Handle payment failure
    if (body.event_type === 'payment_failed') {
        const companyId = body.metadata?.company_id;
        if (companyId) {
            await adminSupabase
                .from('company_subscriptions')
                .update({ status: 'past_due' })
                .eq('company_id', companyId);
        }
    }

    return jsonResponse({ received: true });
}

// ─── Tilr Webhook ───────────────────────────────────────────────────────────
// Inspired by archive TilrWebhookHandler.ts

async function handleTilrWebhook(request: Request, env: Env): Promise<Response> {
    // ── Signature verification ──────────────────────────────────────────
    const tilrSecret = (env as unknown as Record<string, string>).TILR_WEBHOOK_SECRET;
    if (tilrSecret) {
        const signature = request.headers.get('x-tilr-signature') || request.headers.get('x-webhook-signature') || '';
        const rawBody = await request.clone().text();
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(tilrSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
        const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (signature !== expected && signature !== `sha256=${expected}`) {
            return errorResponse('Invalid webhook signature', 401);
        }
    }

    const body = (await request.json()) as {
        event: string;
        payment_id: string;
        status: string;
        amount: number;
        currency: string;
        metadata?: Record<string, string>;
    };

    const adminSupabase = createAdminClient(env);

    // Log the webhook event
    await adminSupabase.from('payment_events').insert({
        event_type: `tilr_${body.event}`,
        gateway: 'tilr',
        transaction_id: body.payment_id,
        status: body.status,
        amount: body.amount,
        currency: body.currency,
        raw_data: body,
    });

    if (body.event === 'payment.success') {
        const companyId = body.metadata?.company_id;
        if (companyId) {
            await adminSupabase
                .from('company_subscriptions')
                .update({
                    status: 'active',
                    gateway: 'tilr',
                    last_payment_at: new Date().toISOString(),
                })
                .eq('company_id', companyId);

            // ── Update company status from pending_payment → active ─────
            await adminSupabase
                .from('companies')
                .update({ status: 'active' })
                .eq('id', companyId)
                .in('status', ['pending_payment', 'pending_review']);

            // ── Post-payment: activate plan modules ─────────────────────
            await activateCompanyModulesAfterPayment(adminSupabase, companyId);
        }
    }

    if (body.event === 'payment.failed') {
        const companyId = body.metadata?.company_id;
        if (companyId) {
            await adminSupabase
                .from('company_subscriptions')
                .update({ status: 'past_due' })
                .eq('company_id', companyId);
        }
    }

    return jsonResponse({ received: true });
}

// ─── Cancel Subscription ────────────────────────────────────────────────

async function cancelSubscriptionHandler(
    request: Request,
    env: Env,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { companyId: string; immediate?: boolean };
    if (!body.companyId) return errorResponse('Missing companyId');

    const { data: company } = await supabase
        .from('companies')
        .select('id, owner_user_id')
        .eq('id', body.companyId)
        .single();
    if (!company || company.owner_user_id !== userId) {
        return errorResponse('Only the company owner can cancel', 403);
    }

    const { data: sub } = await supabase
        .from('company_subscriptions')
        .select('stripe_subscription_id, gateway, current_period_end')
        .eq('company_id', body.companyId)
        .maybeSingle();

    if (sub?.stripe_subscription_id && (!sub.gateway || sub.gateway === 'stripe')) {
        const stripeEngine = new StripeEngine(env.STRIPE_SECRET_KEY);
        await stripeEngine.cancelSubscription(sub.stripe_subscription_id, !!body.immediate);
    }

    // If not immediate, mark as canceling at period end instead of cancelled now
    if (!body.immediate) {
        await supabase
            .from('company_subscriptions')
            .update({
                cancel_at: sub?.current_period_end || new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('company_id', body.companyId);

        emitDomainEvent(env, {
            eventName: 'billing.subscription.cancel_scheduled',
            entityType: 'subscriptions',
            companyId: body.companyId,
            actorUserId: userId,
            payload: { cancelAt: sub?.current_period_end },
        });

        return jsonResponse({ success: true, message: 'Subscription will cancel at period end' });
    }

    await supabase
        .from('company_subscriptions')
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            ...(body.immediate ? { current_period_end: new Date().toISOString() } : {}),
        })
        .eq('company_id', body.companyId);

    return jsonResponse({ success: true, message: 'Subscription cancelled' });
}

// ─── Upgrade Subscription ───────────────────────────────────────────────

async function upgradeSubscriptionHandler(
    request: Request,
    env: Env,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        companyId: string;
        newPlanCode: string;
        billingInterval?: 'monthly' | 'yearly';
    };
    if (!body.companyId || !body.newPlanCode) {
        return errorResponse('Missing companyId or newPlanCode');
    }

    const { data: company } = await supabase
        .from('companies')
        .select('id, owner_user_id')
        .eq('id', body.companyId)
        .single();
    if (!company || company.owner_user_id !== userId) {
        return errorResponse('Only the company owner can upgrade', 403);
    }

    // Get current subscription to update Stripe if connected
    const { data: existingSub } = await supabase
        .from('company_subscriptions')
        .select('stripe_subscription_id, gateway')
        .eq('company_id', body.companyId)
        .maybeSingle();

    // Get the Stripe price ID from the new plan
    const adminSupabase = createAdminClient(env);
    const { data: newPlan } = await adminSupabase
        .from('subscription_plans')
        .select('stripe_price_id')
        .eq('code', body.newPlanCode)
        .maybeSingle();

    // If plan has Stripe price and sub has active Stripe subscription, update in Stripe
    if (
        existingSub?.stripe_subscription_id &&
        (!existingSub.gateway || existingSub.gateway === 'stripe') &&
        newPlan?.stripe_price_id
    ) {
        const stripeEngine = new StripeEngine(env.STRIPE_SECRET_KEY);
        await stripeEngine.updateSubscription(existingSub.stripe_subscription_id, newPlan.stripe_price_id);
    }

    await supabase
        .from('company_subscriptions')
        .update({
            plan_code: body.newPlanCode,
            updated_at: new Date().toISOString(),
        })
        .eq('company_id', body.companyId);

    await activateCompanyModulesAfterPayment(adminSupabase, body.companyId);

    emitDomainEvent(env, {
        eventName: 'billing.subscription.upgraded',
        entityType: 'subscriptions',
        companyId: body.companyId,
        actorUserId: userId,
        payload: { newPlanCode: body.newPlanCode },
    });

    return jsonResponse({ success: true, message: 'Subscription upgraded' });
}

// ─── Check Subscription Status ──────────────────────────────────────────

async function checkSubscriptionHandler(
    request: Request,
    env: Env,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as { companyId: string };
    if (!body.companyId) return errorResponse('Missing companyId');

    const adminSupabase = createAdminClient(env);
    const result = await checkSubscriptionActive(adminSupabase, body.companyId);
    return jsonResponse(result);
}

// ─── Integration Pricing Rules ──────────────────────────────────────────

async function getIntegrationPricing(
    env: Env,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const { data: rules } = await supabase
        .from('integration_pricing_rules')
        .select('*')
        .eq('is_active', true)
        .order('integration_code');

    return jsonResponse({ rules: rules || [] });
}

// ─── Create Subscription (after SetupIntent) ────────────────────────────

async function createSubscriptionHandler(
    request: Request,
    env: Env,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        companyId: string;
        planCode: string;
        paymentMethodId: string;
        billingInterval?: 'monthly' | 'yearly';
    };
    if (!body.companyId || !body.planCode || !body.paymentMethodId) {
        return errorResponse('Missing companyId, planCode, or paymentMethodId');
    }

    // Verify ownership
    const { data: company } = await supabase
        .from('companies')
        .select('id, owner_user_id')
        .eq('id', body.companyId)
        .single();
    if (!company || company.owner_user_id !== userId) {
        return errorResponse('Only the company owner can manage billing', 403);
    }

    // Get or verify Stripe customer
    const { data: sub } = await supabase
        .from('company_subscriptions')
        .select('stripe_customer_id')
        .eq('company_id', body.companyId)
        .maybeSingle();
    if (!sub?.stripe_customer_id) {
        return errorResponse('No Stripe customer found. Create a checkout session first.', 400);
    }

    // Get plan's Stripe price ID
    const adminSupabase = createAdminClient(env);
    const { data: plan } = await adminSupabase
        .from('subscription_plans')
        .select('stripe_price_id, price_monthly, price_yearly, included_modules, max_users, features')
        .eq('code', body.planCode)
        .maybeSingle();
    if (!plan?.stripe_price_id) {
        return errorResponse('Plan not found or missing Stripe price', 404);
    }

    // Attach payment method + create subscription in Stripe
    const stripeEngine = new StripeEngine(env.STRIPE_SECRET_KEY);
    await stripeEngine.attachPaymentMethod(sub.stripe_customer_id, body.paymentMethodId);

    const stripeSub = await stripeEngine.createSubscription(
        sub.stripe_customer_id,
        plan.stripe_price_id,
        body.paymentMethodId,
        { companyId: body.companyId, planCode: body.planCode },
    );

    // Build billing breakdown
    const isYearly = body.billingInterval === 'yearly';
    const breakdown = {
        plan_code: body.planCode,
        interval: body.billingInterval || 'monthly',
        base_amount: isYearly ? (plan.price_yearly ?? plan.price_monthly * 10) : plan.price_monthly,
        components: [{ type: 'base_fee', amount: isYearly ? (plan.price_yearly ?? plan.price_monthly * 10) : plan.price_monthly }],
        computed_at: new Date().toISOString(),
    };

    // Update subscription record
    await supabase.from('company_subscriptions').upsert({
        company_id: body.companyId,
        stripe_customer_id: sub.stripe_customer_id,
        stripe_subscription_id: stripeSub.id,
        plan_code: body.planCode,
        status: stripeSub.status === 'active' ? 'active' : 'incomplete',
        current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        billing_breakdown: breakdown,
        dunning_stage: 'none',
    });

    // Activate modules if immediately active
    if (stripeSub.status === 'active') {
        await activateCompanyModulesAfterPayment(adminSupabase, body.companyId);
        await adminSupabase
            .from('companies')
            .update({ status: 'active' })
            .eq('id', body.companyId)
            .in('status', ['pending_payment', 'pending_review']);
    }

    emitDomainEvent(env, {
        eventName: 'billing.subscription.created',
        entityType: 'subscriptions',
        companyId: body.companyId,
        actorUserId: userId,
        payload: { planCode: body.planCode, stripeSubId: stripeSub.id },
    });

    return jsonResponse({
        subscriptionId: stripeSub.id,
        status: stripeSub.status,
        clientSecret: (stripeSub.latest_invoice as any)?.payment_intent?.client_secret || null,
    });
}

// ─── Store Billing Breakdown ────────────────────────────────────────────

async function storeBreakdownHandler(
    request: Request,
    env: Env,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        companyId: string;
        breakdown: Record<string, unknown>;
    };
    if (!body.companyId || !body.breakdown) {
        return errorResponse('Missing companyId or breakdown');
    }

    // Verify ownership
    const { data: company } = await supabase
        .from('companies')
        .select('id, owner_user_id')
        .eq('id', body.companyId)
        .single();
    if (!company || company.owner_user_id !== userId) {
        return errorResponse('Only the company owner can update billing', 403);
    }

    await supabase
        .from('company_subscriptions')
        .update({
            billing_breakdown: body.breakdown,
            updated_at: new Date().toISOString(),
        })
        .eq('company_id', body.companyId);

    return jsonResponse({ success: true });
}
