// supabase/functions/stripe-webhook/index.ts
// Handles Stripe webhook events (subscription changes, payment success/failure)
// Deployed as Supabase Edge Function

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

Deno.serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

        const admin = createClient(supabaseUrl, supabaseServiceKey);
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

        // Verify webhook signature
        const body = await req.text();
        const sig = req.headers.get('stripe-signature');

        if (!sig) {
            return new Response('Missing signature', { status: 400 });
        }

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
        }

        console.log('Processing event:', event.type);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const companyId = session.metadata?.company_id;
                const planCode = session.metadata?.plan_code;

                if (companyId && planCode) {
                    // Update company subscription
                    await admin.from('subscriptions').upsert({
                        company_id: companyId,
                        stripe_subscription_id: session.subscription as string,
                        stripe_customer_id: session.customer as string,
                        plan_code: planCode,
                        status: 'active',
                        current_period_start: new Date().toISOString(),
                        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    }, { onConflict: 'company_id' });

                    // Update company status
                    await admin.from('companies').update({
                        subscription_plan: planCode,
                        subscription_status: 'active',
                    }).eq('id', companyId);

                    console.log(`Subscription activated for company ${companyId}: ${planCode}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const companyId = subscription.metadata?.company_id;

                if (companyId) {
                    const status = subscription.status === 'active' ? 'active'
                        : subscription.status === 'past_due' ? 'past_due'
                            : subscription.status === 'canceled' ? 'cancelled'
                                : subscription.status;

                    await admin.from('subscriptions').update({
                        status,
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    }).eq('company_id', companyId);

                    await admin.from('companies').update({
                        subscription_status: status,
                    }).eq('id', companyId);

                    console.log(`Subscription updated for company ${companyId}: ${status}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const companyId = subscription.metadata?.company_id;

                if (companyId) {
                    await admin.from('subscriptions').update({
                        status: 'cancelled',
                    }).eq('company_id', companyId);

                    await admin.from('companies').update({
                        subscription_status: 'cancelled',
                    }).eq('id', companyId);

                    console.log(`Subscription cancelled for company ${companyId}`);
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string;

                if (subscriptionId) {
                    // Log payment
                    await admin.from('billing_events').insert({
                        stripe_event_id: event.id,
                        event_type: 'payment_succeeded',
                        amount: (invoice.amount_paid || 0) / 100,
                        currency: invoice.currency,
                        stripe_invoice_id: invoice.id,
                        stripe_subscription_id: subscriptionId,
                        metadata: {
                            customer_email: invoice.customer_email,
                            hosted_invoice_url: invoice.hosted_invoice_url,
                        },
                    }).catch(e => console.error('billing_events insert error:', e));
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string;

                if (subscriptionId) {
                    await admin.from('billing_events').insert({
                        stripe_event_id: event.id,
                        event_type: 'payment_failed',
                        amount: (invoice.amount_due || 0) / 100,
                        currency: invoice.currency,
                        stripe_invoice_id: invoice.id,
                        stripe_subscription_id: subscriptionId,
                    }).catch(e => console.error('billing_events insert error:', e));

                    console.log('Payment failed for subscription:', subscriptionId);
                }
                break;
            }

            default:
                console.log('Unhandled event type:', event.type);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return new Response(
            JSON.stringify({ error: 'Webhook handler failed' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
