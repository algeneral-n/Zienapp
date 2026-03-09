/**
 * Marketing Automation Routes
 * Campaigns, audience segments, email sending via Resend, analytics
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient, checkMembership } from '../supabase';

export async function handleMarketing(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    const { userId, supabase } = await requireAuth(request, env);
    const companyId = request.headers.get('x-company-id') || '';

    // ─── Campaigns CRUD ─────────────────────────────────────────────────
    if (path === '/api/marketing/campaigns' && request.method === 'GET') {
        return listCampaigns(companyId, supabase);
    }

    if (path === '/api/marketing/campaigns' && request.method === 'POST') {
        return createCampaign(request, companyId, userId, supabase);
    }

    if (path.match(/^\/api\/marketing\/campaigns\/[^/]+$/) && request.method === 'PATCH') {
        const campaignId = path.split('/').pop()!;
        return updateCampaign(request, campaignId, companyId, supabase);
    }

    if (path.match(/^\/api\/marketing\/campaigns\/[^/]+\/send$/) && request.method === 'POST') {
        const campaignId = path.split('/')[4];
        return sendCampaign(campaignId, companyId, env, supabase);
    }

    // ─── Audience Segments ──────────────────────────────────────────────
    if (path === '/api/marketing/segments' && request.method === 'GET') {
        return listSegments(companyId, supabase);
    }

    if (path === '/api/marketing/segments' && request.method === 'POST') {
        return createSegment(request, companyId, userId, supabase);
    }

    // ─── Templates ──────────────────────────────────────────────────────
    if (path === '/api/marketing/templates' && request.method === 'GET') {
        return listTemplates(companyId, supabase);
    }

    if (path === '/api/marketing/templates' && request.method === 'POST') {
        return createTemplate(request, companyId, userId, supabase);
    }

    // ─── AI Copy Generation ─────────────────────────────────────────────
    if (path === '/api/marketing/generate-copy' && request.method === 'POST') {
        return generateMarketingCopy(request, env);
    }

    // ─── Analytics ──────────────────────────────────────────────────────
    if (path === '/api/marketing/analytics' && request.method === 'GET') {
        return getCampaignAnalytics(companyId, supabase);
    }

    return errorResponse('Not found', 404);
}

// ─── Campaign Handlers ──────────────────────────────────────────────────────

async function listCampaigns(
    companyId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

    if (error) return errorResponse(error.message);
    return jsonResponse({ campaigns: data || [] });
}

async function createCampaign(
    request: Request,
    companyId: string,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        name: string;
        type: string;
        subject?: string;
        body_html?: string;
        body_text?: string;
        audience_filter?: Record<string, unknown>;
        scheduled_at?: string;
    };

    if (!body.name || !body.type) {
        return errorResponse('Missing name or type');
    }

    const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
            company_id: companyId,
            name: body.name,
            type: body.type,
            subject: body.subject,
            body_html: body.body_html,
            body_text: body.body_text,
            audience_filter: body.audience_filter || {},
            scheduled_at: body.scheduled_at,
            status: body.scheduled_at ? 'scheduled' : 'draft',
            created_by: userId,
        })
        .select()
        .single();

    if (error) return errorResponse(error.message);
    return jsonResponse({ campaign: data }, 201);
}

async function updateCampaign(
    request: Request,
    campaignId: string,
    companyId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as Record<string, unknown>;

    const { data, error } = await supabase
        .from('marketing_campaigns')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', campaignId)
        .eq('company_id', companyId)
        .select()
        .single();

    if (error) return errorResponse(error.message);
    return jsonResponse({ campaign: data });
}

async function sendCampaign(
    campaignId: string,
    companyId: string,
    env: Env,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    // 1. Fetch campaign
    const { data: campaign } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('company_id', companyId)
        .single();

    if (!campaign) return errorResponse('Campaign not found', 404);
    if (campaign.status === 'sent' || campaign.status === 'sending') {
        return errorResponse('Campaign already sent or in progress');
    }

    // 2. Build recipient list from audience filter
    const { data: recipients } = await supabase
        .from('clients')
        .select('email, name')
        .eq('company_id', companyId)
        .not('email', 'is', null);

    if (!recipients?.length) {
        return errorResponse('No recipients found');
    }

    // 3. Mark as sending
    await supabase
        .from('marketing_campaigns')
        .update({ status: 'sending', total_recipients: recipients.length })
        .eq('id', campaignId);

    // 4. Send via Resend
    const resendKey = env.RESEND_API_KEY;
    if (!resendKey) {
        await supabase.from('marketing_campaigns')
            .update({ status: 'draft' })
            .eq('id', campaignId);
        return errorResponse('Email service not configured');
    }

    let sentCount = 0;
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const emails = batch.map(r => r.email).filter(Boolean);

        try {
            await fetch('https://api.resend.com/emails/batch', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    emails.map(email => ({
                        from: 'ZIEN <noreply@zien-ai.app>',
                        to: email,
                        subject: campaign.subject || campaign.name,
                        html: campaign.body_html || `<p>${campaign.body_text || ''}</p>`,
                    }))
                ),
            });
            sentCount += emails.length;
        } catch (err) {
            console.error('Batch send error:', err);
        }
    }

    // 5. Update campaign status
    await supabase
        .from('marketing_campaigns')
        .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            total_sent: sentCount,
        })
        .eq('id', campaignId);

    return jsonResponse({ success: true, sent: sentCount, total: recipients.length });
}

// ─── Segment Handlers ───────────────────────────────────────────────────────

async function listSegments(
    companyId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const { data } = await supabase
        .from('marketing_audience_segments')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

    return jsonResponse({ segments: data || [] });
}

async function createSegment(
    request: Request,
    companyId: string,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        name: string;
        description?: string;
        filter_rules: Record<string, unknown>;
    };

    const { data, error } = await supabase
        .from('marketing_audience_segments')
        .insert({
            company_id: companyId,
            name: body.name,
            description: body.description,
            filter_rules: body.filter_rules || {},
            created_by: userId,
        })
        .select()
        .single();

    if (error) return errorResponse(error.message);
    return jsonResponse({ segment: data }, 201);
}

// ─── Template Handlers ──────────────────────────────────────────────────────

async function listTemplates(
    companyId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const { data } = await supabase
        .from('marketing_email_templates')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

    return jsonResponse({ templates: data || [] });
}

async function createTemplate(
    request: Request,
    companyId: string,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        name: string;
        subject: string;
        body_html: string;
        body_text?: string;
        category?: string;
        variables?: string[];
    };

    const { data, error } = await supabase
        .from('marketing_email_templates')
        .insert({
            company_id: companyId,
            name: body.name,
            subject: body.subject,
            body_html: body.body_html,
            body_text: body.body_text,
            category: body.category || 'general',
            variables: body.variables || [],
            created_by: userId,
        })
        .select()
        .single();

    if (error) return errorResponse(error.message);
    return jsonResponse({ template: data }, 201);
}

// ─── AI Marketing Copy ──────────────────────────────────────────────────────

async function generateMarketingCopy(
    request: Request,
    env: Env,
): Promise<Response> {
    const body = (await request.json()) as {
        type: 'email_subject' | 'email_body' | 'sms' | 'social_post' | 'ad_copy';
        product?: string;
        audience?: string;
        tone?: string;
        language?: string;
    };

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) return errorResponse('AI service not configured');

    const prompt = `Generate marketing copy for a ${body.type}. 
Product/Service: ${body.product || 'ZIEN platform'}
Target Audience: ${body.audience || 'business owners'}
Tone: ${body.tone || 'professional'}
Language: ${body.language || 'English'}
Requirements:
- Be concise and compelling
- Include a clear call to action
- Match the specified tone
Return ONLY the copy text, no explanations.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a world-class marketing copywriter. Generate compelling, conversion-focused copy.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: 500,
            temperature: 0.8,
        }),
    });

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const copy = data?.choices?.[0]?.message?.content || '';

    return jsonResponse({ copy, type: body.type });
}

// ─── Campaign Analytics ─────────────────────────────────────────────────────

async function getCampaignAnalytics(
    companyId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const { data: campaigns } = await supabase
        .from('marketing_campaigns')
        .select('id, name, type, status, total_recipients, total_sent, total_opened, total_clicked, total_bounced, total_unsubscribed, sent_at')
        .eq('company_id', companyId)
        .in('status', ['sent', 'completed'])
        .order('sent_at', { ascending: false })
        .limit(20);

    const totalSent = (campaigns || []).reduce((sum, c) => sum + (c.total_sent || 0), 0);
    const totalOpened = (campaigns || []).reduce((sum, c) => sum + (c.total_opened || 0), 0);
    const totalClicked = (campaigns || []).reduce((sum, c) => sum + (c.total_clicked || 0), 0);

    return jsonResponse({
        campaigns: campaigns || [],
        summary: {
            totalCampaigns: campaigns?.length || 0,
            totalSent,
            totalOpened,
            totalClicked,
            openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0',
            clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0',
        },
    });
}
