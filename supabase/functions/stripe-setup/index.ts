// supabase/functions/stripe-setup/index.ts
// Creates a Stripe Checkout session for new subscriptions
// Deployed as Supabase Edge Function

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;

        const admin = createClient(supabaseUrl, supabaseServiceKey);
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

        // Auth: get user from JWT
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authErr } = await admin.auth.getUser(token);
        if (authErr || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const body = await req.json();
        const { company_id, plan_code, return_url } = body;

        if (!company_id || !plan_code) {
            return new Response(JSON.stringify({ error: 'Missing company_id or plan_code' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Verify user is company admin
        const { data: member } = await admin
            .from('company_members')
            .select('role_code')
            .eq('company_id', company_id)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (!member || member.role_code !== 'company_gm') {
            return new Response(JSON.stringify({ error: 'Only company GM can manage billing' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Get or create Stripe customer
        const { data: company } = await admin
            .from('companies')
            .select('id, name, stripe_customer_id')
            .eq('id', company_id)
            .single();

        let customerId = company?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: company?.name || 'ZIEN Company',
                metadata: {
                    company_id,
                    supabase_user_id: user.id,
                },
            });
            customerId = customer.id;

            // Save Stripe customer ID
            await admin
                .from('companies')
                .update({ stripe_customer_id: customerId })
                .eq('id', company_id);
        }

        // Plan to price mapping
        const planPrices: Record<string, { monthly: string; yearly: string }> = {
            starter: { monthly: 'price_starter_monthly', yearly: 'price_starter_yearly' },
            professional: { monthly: 'price_pro_monthly', yearly: 'price_pro_yearly' },
            enterprise: { monthly: 'price_ent_monthly', yearly: 'price_ent_yearly' },
        };

        const interval = body.interval || 'monthly';
        const priceId = planPrices[plan_code]?.[interval as 'monthly' | 'yearly'];

        if (!priceId) {
            return new Response(JSON.stringify({ error: 'Invalid plan' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${return_url || 'https://app.zien-ai.app'}?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${return_url || 'https://app.zien-ai.app'}?cancelled=true`,
            metadata: {
                company_id,
                plan_code,
                user_id: user.id,
            },
            subscription_data: {
                metadata: { company_id, plan_code },
                trial_period_days: plan_code === 'starter' ? 14 : 7,
            },
        });

        return new Response(
            JSON.stringify({
                sessionId: session.id,
                url: session.url,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Stripe setup error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to create checkout session' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
