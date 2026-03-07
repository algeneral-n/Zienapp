// supabase/functions/stripe-worker/index.ts
// Background worker for Stripe data sync and subscription management
// Handles: subscription status checks, usage metering, plan enforcement

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

    // Verify authorization (service role or cron)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    const isCron = req.headers.get('x-cron-secret') === cronSecret;

    if (!isCron && authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await admin.auth.getUser(token);
      if (!user) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }
    }

    const { action } = await req.json().catch(() => ({ action: 'sync' }));

    switch (action) {
      case 'sync': {
        // Sync active subscriptions from Stripe
        const { data: subs } = await admin.from('subscriptions')
          .select('*')
          .eq('status', 'active');

        let synced = 0;
        for (const sub of (subs || [])) {
          if (sub.stripe_subscription_id) {
            try {
              const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
              const status = stripeSub.status === 'active' ? 'active'
                : stripeSub.status === 'past_due' ? 'past_due'
                : stripeSub.status === 'canceled' ? 'cancelled'
                : stripeSub.status;

              await admin.from('subscriptions').update({
                status,
                current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
                cancel_at_period_end: stripeSub.cancel_at_period_end,
              }).eq('id', sub.id);

              await admin.from('companies').update({
                subscription_status: status,
              }).eq('id', sub.company_id);

              synced++;
            } catch (e) {
              console.error(`Failed to sync subscription ${sub.stripe_subscription_id}:`, e);
            }
          }
        }

        return new Response(JSON.stringify({ action: 'sync', synced }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check-expiring': {
        // Find subscriptions expiring in 3 days
        const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        const now = new Date().toISOString();

        const { data: expiring } = await admin.from('subscriptions')
          .select('*, companies(name)')
          .eq('status', 'active')
          .eq('cancel_at_period_end', true)
          .lte('current_period_end', threeDaysFromNow)
          .gte('current_period_end', now);

        // Log expiring subscriptions for notification
        for (const sub of (expiring || [])) {
          await admin.from('notifications').insert({
            company_id: sub.company_id,
            type: 'subscription_expiring',
            title: 'Subscription Expiring Soon',
            body: `Your ${sub.plan_code} plan expires on ${sub.current_period_end}`,
            metadata: { plan_code: sub.plan_code, expires: sub.current_period_end },
          }).catch(e => console.error('notification insert error:', e));
        }

        return new Response(JSON.stringify({ action: 'check-expiring', found: (expiring || []).length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create-portal-session': {
        // Create Stripe Customer Portal session for self-service
        const { company_id } = await req.json().catch(() => ({ company_id: null }));

        if (!company_id) {
          return new Response(JSON.stringify({ error: 'company_id required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: sub } = await admin.from('subscriptions')
          .select('stripe_customer_id')
          .eq('company_id', company_id)
          .single();

        if (!sub?.stripe_customer_id) {
          return new Response(JSON.stringify({ error: 'No active subscription found' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const session = await stripe.billingPortal.sessions.create({
          customer: sub.stripe_customer_id,
          return_url: 'https://app.zien-ai.app/settings/billing',
        });

        return new Response(JSON.stringify({ url: session.url }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-usage': {
        // Get current usage stats for a company
        const { company_id } = await req.json().catch(() => ({ company_id: null }));

        if (!company_id) {
          return new Response(JSON.stringify({ error: 'company_id required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: sub } = await admin.from('subscriptions')
          .select('*')
          .eq('company_id', company_id)
          .single();

        // Count active members
        const { count: memberCount } = await admin.from('company_members')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company_id)
          .eq('status', 'active');

        // Count AI calls this month
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { count: aiCalls } = await admin.from('ai_chat_history')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company_id)
          .gte('created_at', monthStart.toISOString());

        // Plan limits
        const planLimits: Record<string, { members: number; aiCalls: number; storage: string }> = {
          starter: { members: 10, aiCalls: 500, storage: '5GB' },
          business: { members: 50, aiCalls: 5000, storage: '50GB' },
          enterprise: { members: -1, aiCalls: -1, storage: 'Unlimited' },
        };

        const limits = planLimits[sub?.plan_code || 'starter'] || planLimits.starter;

        return new Response(JSON.stringify({
          plan: sub?.plan_code || 'free',
          status: sub?.status || 'none',
          usage: {
            members: { current: memberCount || 0, limit: limits.members },
            aiCalls: { current: aiCalls || 0, limit: limits.aiCalls },
            storage: limits.storage,
          },
          period_end: sub?.current_period_end,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action', available: ['sync', 'check-expiring', 'create-portal-session', 'get-usage'] }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Stripe worker error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
