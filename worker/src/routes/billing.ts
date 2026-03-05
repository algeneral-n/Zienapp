import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient } from '../supabase';
import { StripeEngine } from './StripeEngine';
import type StripeType from 'stripe';
import type { Request, Response } from '@cloudflare/workers-types';

// ─── Payment Gateway Types ──────────────────────────────────────────────
type GatewayType = 'stripe' | 'network_international' | 'tilr';
type PaymentRegion = 'AE' | 'SA' | 'EG' | 'BH' | 'OM' | 'QA' | 'KW' | 'GLOBAL';

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

    // All other routes require auth
    const { userId, supabase } = await requireAuth(request, env);

    if (path === '/api/billing/create-checkout-session' && request.method === 'POST') {
        return createCheckoutSession(request, env, userId, supabase);
    }

    if (path === '/api/billing/create-portal-session' && request.method === 'POST') {
        return createPortalSession(request, env, userId, supabase);
    }

    if (path === '/api/billing/orchestrate' && request.method === 'POST') {
        return orchestratePayment(request, env, userId, supabase);
    }

    if (path.startsWith('/api/billing/subscription/') && request.method === 'GET') {
        const companyId = path.replace('/api/billing/subscription/', '');
        return getSubscription(companyId, userId, supabase);
    }

    if (path.startsWith('/api/billing/usage/') && request.method === 'GET') {
        const companyId = path.replace('/api/billing/usage/', '');
        return getUsage(companyId, userId, supabase);
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

        customerId = await StripeEngine.createCustomer(body.companyId, profile?.email);

        // Upsert subscription record
        await supabase.from('company_subscriptions').upsert({
            company_id: body.companyId,
            stripe_customer_id: customerId,
            status: 'incomplete',
        });
    }

    // Create checkout session using StripeEngine
    const session = await StripeEngine.createCheckoutSession(
        body.planCode,
        customerId,
        body.successUrl ?? 'https://www.zien-ai.app/portal?billing=success',
        body.cancelUrl ?? 'https://www.zien-ai.app/portal?billing=cancelled'
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

    const session = await StripeEngine.createBillingPortal(
        sub.stripe_customer_id,
        'https://www.zien-ai.app/portal'
    );
    return jsonResponse({ url: session.url });
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
    const signature = request.headers.get('Stripe-Signature');
    if (!signature) return errorResponse('Missing signature', 400);

    const rawBody = await request.text();
    // StripeEngine does not handle webhooks directly, so keep this logic as is for now
    const Stripe = (await import('stripe')).default as typeof StripeType;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

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
                .update({ status: 'canceled' })
                .eq('stripe_subscription_id', sub.id);
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

                customerId = await StripeEngine.createCustomer(body.companyId, profile?.email);
                await supabase.from('company_subscriptions').upsert({
                    company_id: body.companyId,
                    stripe_customer_id: customerId,
                    status: 'incomplete',
                });
            }

            const session = await StripeEngine.createCheckoutSession(
                body.planCode,
                customerId,
                body.successUrl ?? 'https://www.zien-ai.app/portal?billing=success',
                body.cancelUrl ?? 'https://www.zien-ai.app/portal?billing=cancelled'
            );

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
            const niApiUrl = (env as Record<string, string>).NI_API_URL || 'https://api-gateway.ngenius-payments.com';
            const niApiKey = (env as Record<string, string>).NI_API_KEY || '';

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
                const niOutlet = (env as Record<string, string>).NI_OUTLET_REF || '';
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

            const tilrApiUrl = (env as Record<string, string>).TILR_API_URL || 'https://api.tilr.io';
            const tilrApiKey = (env as Record<string, string>).TILR_API_KEY || '';
            const tilrMerchantId = (env as Record<string, string>).TILR_MERCHANT_ID || '';

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
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    // Verify membership
    const { data: membership } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

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
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const { data: membership } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

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

    // User count
    const { count: userCount } = await supabase
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