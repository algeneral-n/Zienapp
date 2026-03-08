/**
 * ZIEN API — Email Marketing Routes
 * /api/email/*
 * 
 * Handles: campaign sending, subscriber management, auto-flows,
 * and periodic marketing email dispatch.
 */

import { Env, jsonResponse, errorResponse } from '../index';

const BASE_URL = 'https://plt.zien-ai.app';

// ─── Brand Images ───────────────────────────────────────────────────────────
const IMAGES = {
    neon: `${BASE_URL}/zien-brand-neon.png`,       // Neon blue board
    badge: `${BASE_URL}/zien-brand-badge.png`,     // 3D with RARE AI badge
    white: `${BASE_URL}/zien-brand-3d-white.png`,  // 3D white background
    smart: `${BASE_URL}/zien-brand-smart.png`,     // Smart Business Management
    logo: `${BASE_URL}/zien-logo.png`,             // Standard logo
};

// ─── Email HTML Wrapper ─────────────────────────────────────────────────────
function emailWrapper(headerImage: string, bodyContent: string, footerExtra = ''): string {
    return `<!DOCTYPE html>
<html dir="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f0f4f8;-webkit-font-smoothing:antialiased;}
.wrap{max-width:600px;margin:20px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
.header{background:linear-gradient(135deg,#0a1628 0%,#1e3a5f 50%,#2563eb 100%);padding:40px 24px;text-align:center;}
.header img{max-height:100px;max-width:80%;}
.divider{height:4px;background:linear-gradient(90deg,#2563eb,#06b6d4,#2563eb);}
.body{padding:32px 24px;color:#374151;line-height:1.8;}
.body-ar{direction:rtl;text-align:right;}
.body-en{direction:ltr;text-align:left;color:#6b7280;font-size:14px;margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;}
h2{color:#1e3a5f;margin:0 0 16px 0;font-size:22px;}
h3{color:#2563eb;margin:16px 0 8px 0;font-size:18px;}
.btn{display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#ffffff!important;text-decoration:none;border-radius:12px;font-weight:bold;font-size:16px;margin:20px 0;box-shadow:0 4px 12px rgba(37,99,235,0.3);transition:transform 0.2s;}
.btn-secondary{background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 4px 12px rgba(99,102,241,0.3);}
.feature-card{background:#f8fafc;border-radius:12px;padding:16px;margin:10px 0;border-right:4px solid #2563eb;}
.feature-card h4{color:#1e3a5f;margin:0 0 4px 0;}
.feature-card p{color:#6b7280;margin:0;font-size:14px;}
.stat-row{display:flex;justify-content:space-around;text-align:center;padding:16px 0;}
.stat-item{flex:1;}
.stat-num{font-size:28px;font-weight:bold;color:#2563eb;}
.stat-label{font-size:12px;color:#9ca3af;}
.footer{padding:24px;text-align:center;background:#f9fafb;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;}
.footer a{color:#2563eb;text-decoration:none;}
.social-links a{display:inline-block;margin:0 8px;color:#2563eb;text-decoration:none;font-size:14px;}
.unsubscribe{margin-top:16px;font-size:11px;color:#d1d5db;}
.unsubscribe a{color:#9ca3af;}
</style>
</head>
<body>
<div class="wrap">
<div class="header"><img src="${headerImage}" alt="ZIEN Platform"/></div>
<div class="divider"></div>
${bodyContent}
<div class="footer">
<div class="social-links">
<a href="${BASE_URL}">Website</a> |
<a href="${BASE_URL}/academy">Academy</a> |
<a href="${BASE_URL}/features">Features</a>
</div>
<p style="margin-top:12px;"><strong>ZIEN Platform</strong> — Powered by RARE AI</p>
<p><a href="mailto:support@zien-ai.app">support@zien-ai.app</a></p>
<p>&copy; 2026 ZIEN Technologies. All rights reserved.</p>
${footerExtra}
<div class="unsubscribe">
<a href="${BASE_URL}/unsubscribe?email={{email}}">Unsubscribe | الغاء الاشتراك</a>
</div>
</div>
</div>
</body>
</html>`;
}

// ─── Campaign Templates ─────────────────────────────────────────────────────

function getWelcomeTemplate(): string {
    return emailWrapper(IMAGES.neon, `
<div class="body body-ar">
  <h2>مرحبا بك في عائلة ZIEN!</h2>
  <p>نحن سعداء بانضمامك الى ZIEN Platform — المنصة الذكية لادارة الاعمال المدعومة بالذكاء الاصطناعي RARE AI.</p>
  
  <h3>ماذا يمكنك فعله الان؟</h3>
  <div class="feature-card">
    <h4>لوحة التحكم الذكية</h4>
    <p>تابع كل شيء من مكان واحد — المبيعات، الفريق، المشاريع، والمحاسبة.</p>
  </div>
  <div class="feature-card">
    <h4>RARE AI — مساعدك الذكي</h4>
    <p>اسال RARE اي سؤال عن عملك واحصل على اجابات فورية وتحليلات ذكية.</p>
  </div>
  <div class="feature-card">
    <h4>+10 وحدات متكاملة</h4>
    <p>محاسبة، موارد بشرية، CRM، مشاريع، لوجستيات، متجر، وتكاملات خارجية.</p>
  </div>

  <div style="text-align:center;">
    <a href="${BASE_URL}/dashboard" class="btn">ابدا الان  Get Started</a>
  </div>

  <div class="body-en">
    <h3>Welcome to the ZIEN Family!</h3>
    <p>We're thrilled to have you on board. ZIEN Platform is your all-in-one smart business management solution powered by RARE AI.</p>
    <p>Explore your dashboard, set up your team, and let RARE AI help you make smarter decisions.</p>
  </div>
</div>`);
}

function getFeaturesTemplate(): string {
    return emailWrapper(IMAGES.badge, `
<div class="body body-ar">
  <h2>اكتشف قوة ZIEN Platform</h2>
  <p>اهلا مرة اخرى! اليك اهم 10 ادوات يمكنك استخدامها لتطوير عملك:</p>
  
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr>
      <td style="padding:8px;background:#eff6ff;border-radius:8px;text-align:center;width:50%;">
        <strong style="color:#2563eb;font-size:20px;">المحاسبة</strong><br/>
        <span style="color:#6b7280;font-size:12px;">فواتير، مصروفات، تقارير</span>
      </td>
      <td style="padding:8px;background:#f0fdf4;border-radius:8px;text-align:center;width:50%;">
        <strong style="color:#16a34a;font-size:20px;">الموارد البشرية</strong><br/>
        <span style="color:#6b7280;font-size:12px;">موظفين، رواتب، اجازات</span>
      </td>
    </tr>
    <tr><td colspan="2" style="height:8px;"></td></tr>
    <tr>
      <td style="padding:8px;background:#fef3c7;border-radius:8px;text-align:center;">
        <strong style="color:#d97706;font-size:20px;">CRM</strong><br/>
        <span style="color:#6b7280;font-size:12px;">عملاء، صفقات، متابعة</span>
      </td>
      <td style="padding:8px;background:#fce7f3;border-radius:8px;text-align:center;">
        <strong style="color:#db2777;font-size:20px;">المشاريع</strong><br/>
        <span style="color:#6b7280;font-size:12px;">مهام، فرق، تتبع</span>
      </td>
    </tr>
    <tr><td colspan="2" style="height:8px;"></td></tr>
    <tr>
      <td style="padding:8px;background:#ede9fe;border-radius:8px;text-align:center;">
        <strong style="color:#7c3aed;font-size:20px;">RARE AI</strong><br/>
        <span style="color:#6b7280;font-size:12px;">ذكاء اصطناعي متقدم</span>
      </td>
      <td style="padding:8px;background:#ecfdf5;border-radius:8px;text-align:center;">
        <strong style="color:#059669;font-size:20px;">التكاملات</strong><br/>
        <span style="color:#6b7280;font-size:12px;">Stripe, Vonage, وغيرها</span>
      </td>
    </tr>
  </table>

  <div style="text-align:center;">
    <a href="${BASE_URL}/features" class="btn">اكتشف كل الميزات</a>
    <br/>
    <a href="${BASE_URL}/academy" class="btn btn-secondary">دورات اكاديمية ZIEN</a>
  </div>

  <div class="body-en">
    <h3>Discover the Power of ZIEN</h3>
    <p>From accounting and HR to AI-powered insights and project management — ZIEN has everything your business needs in one platform.</p>
  </div>
</div>`);
}

function getIncompleteSignupTemplate(): string {
    return emailWrapper(IMAGES.white, `
<div class="body body-ar">
  <h2>حسابك بانتظارك!</h2>
  <p>لاحظنا انك بدات التسجيل في ZIEN Platform لكن لم تكمل العملية.</p>
  <p>لا تقلق — حسابك محفوظ وجاهز لك. اكمل التسجيل الان واحصل على:</p>
  
  <div class="feature-card">
    <h4>14 يوم مجانا</h4>
    <p>جرب كل الميزات بدون اي التزام او بطاقة ائتمان.</p>
  </div>
  <div class="feature-card">
    <h4>RARE AI مجانا</h4>
    <p>مساعد ذكي يساعدك في اتخاذ القرارات من اليوم الاول.</p>
  </div>

  <div style="text-align:center;">
    <a href="${BASE_URL}/register" class="btn">اكمل التسجيل الان  Complete Signup</a>
  </div>

  <div class="body-en">
    <h3>Your Account is Waiting!</h3>
    <p>We noticed you started signing up but didn't finish. No worries — your account is saved and ready for you.</p>
    <p>Complete your signup now and get 14 days free with full access to RARE AI.</p>
  </div>
</div>`);
}

function getNewsletterTemplate(): string {
    return emailWrapper(IMAGES.smart, `
<div class="body body-ar">
  <h2>جديد ZIEN هذا الشهر</h2>
  <p>اهلا بك — اليك اخر تحديثات ZIEN Platform:</p>
  
  <div class="feature-card">
    <h4>تحديثات جديدة</h4>
    <p>اضفنا ميزات جديدة لتحسين تجربتك في ادارة الاعمال. تابع التفاصيل على منصتنا.</p>
  </div>

  <div class="feature-card">
    <h4>نصائح RARE AI</h4>
    <p>هل تعلم ان RARE يمكنه تحليل بيانات شركتك واقتراح تحسينات تلقائيا؟ جربه الان!</p>
  </div>

  <div class="feature-card">
    <h4>اكاديمية ZIEN</h4>
    <p>دورات جديدة متاحة — تعلم كيف تستفيد من كل وحدة في المنصة.</p>
  </div>

  <div style="text-align:center;">
    <a href="${BASE_URL}/dashboard" class="btn">افتح لوحة التحكم</a>
    <br/>
    <a href="${BASE_URL}/academy" class="btn btn-secondary">شاهد الدورات الجديدة</a>
  </div>

  <div class="body-en">
    <h3>What's New at ZIEN This Month</h3>
    <p>We've been busy building new features and improvements. Check out the latest updates, RARE AI tips, and new academy courses.</p>
  </div>
</div>`);
}

function getTrialEndingTemplate(): string {
    return emailWrapper(IMAGES.badge, `
<div class="body body-ar">
  <h2>تنتهي فترتك التجريبية قريبا!</h2>
  <p>فترتك التجريبية المجانية في ZIEN Platform على وشك الانتهاء.</p>
  <p>لا تفقد الوصول الى بياناتك وادواتك — اشترك الان واستمر في النمو:</p>

  <div style="background:#eff6ff;border-radius:12px;padding:20px;margin:16px 0;text-align:center;">
    <div style="font-size:14px;color:#6b7280;">خطة Business</div>
    <div style="font-size:36px;font-weight:bold;color:#2563eb;">$49<span style="font-size:16px;color:#9ca3af;">/شهر</span></div>
    <div style="font-size:13px;color:#6b7280;">كل الوحدات + RARE AI + دعم فني</div>
  </div>

  <div style="text-align:center;">
    <a href="${BASE_URL}/billing" class="btn">اشترك الان  Subscribe Now</a>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:13px;">يمكنك الغاء الاشتراك في اي وقت بدون اي التزامات.</p>

  <div class="body-en">
    <h3>Your Trial is Ending Soon!</h3>
    <p>Don't lose access to your data and tools. Subscribe now and keep growing your business with ZIEN Platform.</p>
  </div>
</div>`);
}

// Map campaign slugs to template generators
const TEMPLATE_MAP: Record<string, () => string> = {
    'welcome': getWelcomeTemplate,
    'feature-discovery': getFeaturesTemplate,
    'incomplete-reengagement': getIncompleteSignupTemplate,
    'monthly-newsletter': getNewsletterTemplate,
    'trial-ending': getTrialEndingTemplate,
};

// ─── Supabase Helper ────────────────────────────────────────────────────────

function supabaseHeaders(env: Env) {
    return {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    };
}

async function supabaseQuery(env: Env, table: string, query: string): Promise<any[]> {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
        headers: supabaseHeaders(env),
    });
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    return res.json();
}

async function supabaseInsert(env: Env, table: string, data: any): Promise<any> {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...supabaseHeaders(env), 'Prefer': 'return=representation' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Supabase insert error: ${res.status} ${await res.text()}`);
    return res.json();
}

async function supabaseUpdate(env: Env, table: string, query: string, data: any): Promise<any> {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
        method: 'PATCH',
        headers: { ...supabaseHeaders(env), 'Prefer': 'return=representation' },
        body: JSON.stringify(data),
    });
    return res.json();
}

// ─── Email Sending via Resend ───────────────────────────────────────────────

async function sendEmail(env: Env, to: string, subject: string, html: string): Promise<boolean> {
    // Use Resend API if configured, otherwise use Supabase's built-in SMTP
    if (env.RESEND_API_KEY) {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: env.RESEND_FROM_EMAIL || 'ZIEN Platform <noreply@zien-ai.app>',
                to: [to],
                subject,
                html: html.replace(/{{email}}/g, encodeURIComponent(to)),
            }),
        });
        return res.ok;
    }

    // Fallback: Use Supabase auth admin to send custom email
    // This requires the Supabase instance to have SMTP configured
    console.warn('RESEND_API_KEY not configured. Email not sent to:', to);
    return false;
}

// ─── Campaign Execution ─────────────────────────────────────────────────────

async function executeCampaign(env: Env, campaignSlug: string, targetEmails?: string[]): Promise<{ sent: number; failed: number }> {
    // Get campaign
    const campaigns = await supabaseQuery(env, 'email_campaigns', `slug=eq.${campaignSlug}&select=*`);
    if (!campaigns.length) throw new Error(`Campaign not found: ${campaignSlug}`);
    const campaign = campaigns[0];

    // Get template
    const templateFn = TEMPLATE_MAP[campaignSlug];
    const html = templateFn ? templateFn() : campaign.html_body;

    // Get subscribers
    let subscribers: any[];
    if (targetEmails?.length) {
        const emailList = targetEmails.map(e => `"${e}"`).join(',');
        subscribers = await supabaseQuery(env, 'email_subscribers', `email=in.(${emailList})&status=eq.active`);
    } else {
        const audience = campaign.target_audience || { status: 'active' };
        const filters = Object.entries(audience).map(([k, v]) => `${k}=eq.${v}`).join('&');
        subscribers = await supabaseQuery(env, 'email_subscribers', `${filters}&select=*&limit=500`);
    }

    let sent = 0, failed = 0;
    for (const sub of subscribers) {
        // Check if already sent to this subscriber for this campaign (within 24h)
        const recentSends = await supabaseQuery(env, 'email_sends',
            `campaign_id=eq.${campaign.id}&subscriber_id=eq.${sub.id}&created_at=gte.${new Date(Date.now() - 86400000).toISOString()}&select=id&limit=1`);
        if (recentSends.length > 0) continue; // Skip duplicates

        const subject = sub.language === 'en' ? campaign.subject_en : campaign.subject_ar;
        const success = await sendEmail(env, sub.email, subject, html);

        await supabaseInsert(env, 'email_sends', {
            campaign_id: campaign.id,
            subscriber_id: sub.id,
            email: sub.email,
            status: success ? 'sent' : 'failed',
            sent_at: success ? new Date().toISOString() : null,
            error_message: success ? null : 'Send failed',
        });

        if (success) sent++;
        else failed++;
    }

    // Update campaign stats
    await supabaseUpdate(env, 'email_campaigns', `id=eq.${campaign.id}`, {
        total_sent: campaign.total_sent + sent,
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    return { sent, failed };
}

// ─── Auto-Flow Processor ────────────────────────────────────────────────────

async function processAutoFlows(env: Env, triggerEvent: string, email?: string): Promise<{ processed: number }> {
    const flows = await supabaseQuery(env, 'email_auto_flows',
        `trigger_event=eq.${triggerEvent}&is_active=eq.true&select=*`);

    let processed = 0;
    for (const flow of flows) {
        const steps = flow.steps as Array<{ delay_hours: number; campaign_slug: string }>;
        for (const step of steps) {
            if (step.delay_hours === 0) {
                // Execute immediately
                const targets = email ? [email] : undefined;
                await executeCampaign(env, step.campaign_slug, targets);
                processed++;
            } else {
                // Queue for later (in production, use Cloudflare Queues or scheduled worker)
                // For now, log the intent
                console.log(`[AutoFlow] Scheduled: ${step.campaign_slug} in ${step.delay_hours}h for ${email || 'all'}`);
            }
        }
    }
    return { processed };
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function handleEmail(request: Request, env: Env, path: string): Promise<Response> {
    const url = new URL(request.url);

    try {
        // POST /api/email/send-campaign — Send a campaign to subscribers
        if (path === '/api/email/send-campaign' && request.method === 'POST') {
            const body = await request.json() as { campaign_slug: string; emails?: string[] };
            if (!body.campaign_slug) return errorResponse('campaign_slug required', 400, request);

            const result = await executeCampaign(env, body.campaign_slug, body.emails);
            return jsonResponse({ success: true, ...result }, 200, request);
        }

        // POST /api/email/trigger-flow — Trigger an auto-flow
        if (path === '/api/email/trigger-flow' && request.method === 'POST') {
            const body = await request.json() as { trigger: string; email?: string };
            if (!body.trigger) return errorResponse('trigger required', 400, request);

            const result = await processAutoFlows(env, body.trigger, body.email);
            return jsonResponse({ success: true, ...result }, 200, request);
        }

        // POST /api/email/subscribe — Add subscriber
        if (path === '/api/email/subscribe' && request.method === 'POST') {
            const body = await request.json() as { email: string; name?: string; source?: string; language?: string };
            if (!body.email) return errorResponse('email required', 400, request);

            const result = await supabaseInsert(env, 'email_subscribers', {
                email: body.email,
                full_name: body.name || '',
                source: body.source || 'manual',
                language: body.language || 'ar',
                status: 'active',
            });
            return jsonResponse({ success: true, subscriber: result }, 201, request);
        }

        // POST /api/email/unsubscribe — Unsubscribe
        if (path === '/api/email/unsubscribe' && request.method === 'POST') {
            const body = await request.json() as { email: string };
            if (!body.email) return errorResponse('email required', 400, request);

            await supabaseUpdate(env, 'email_subscribers', `email=eq.${body.email}`, {
                status: 'unsubscribed',
                unsubscribed_at: new Date().toISOString(),
            });
            return jsonResponse({ success: true, message: 'Unsubscribed' }, 200, request);
        }

        // GET /api/email/subscribers — List subscribers (admin)
        if (path === '/api/email/subscribers' && request.method === 'GET') {
            const status = url.searchParams.get('status') || 'active';
            const limit = url.searchParams.get('limit') || '50';
            const subs = await supabaseQuery(env, 'email_subscribers',
                `status=eq.${status}&select=id,email,full_name,status,source,language,created_at&order=created_at.desc&limit=${limit}`);
            return jsonResponse({ subscribers: subs, count: subs.length }, 200, request);
        }

        // GET /api/email/campaigns — List campaigns (admin)
        if (path === '/api/email/campaigns' && request.method === 'GET') {
            const campaigns = await supabaseQuery(env, 'email_campaigns',
                'select=id,name,slug,subject_ar,campaign_type,status,total_sent,total_opened,last_sent_at,created_at&order=created_at.desc');
            return jsonResponse({ campaigns }, 200, request);
        }

        // GET /api/email/stats — Email stats summary
        if (path === '/api/email/stats' && request.method === 'GET') {
            const [subs, campaigns, sends] = await Promise.all([
                supabaseQuery(env, 'email_subscribers', 'select=id&status=eq.active'),
                supabaseQuery(env, 'email_campaigns', 'select=id,total_sent,total_opened'),
                supabaseQuery(env, 'email_sends', 'select=id&status=eq.sent'),
            ]);
            return jsonResponse({
                active_subscribers: subs.length,
                total_campaigns: campaigns.length,
                total_sent: sends.length,
                total_opened: campaigns.reduce((sum: number, c: any) => sum + (c.total_opened || 0), 0),
            }, 200, request);
        }

        // GET /api/email/preview/:slug — Preview a template
        if (path.startsWith('/api/email/preview/') && request.method === 'GET') {
            const slug = path.replace('/api/email/preview/', '');
            const templateFn = TEMPLATE_MAP[slug];
            if (!templateFn) return errorResponse('Template not found', 404, request);
            return new Response(templateFn(), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        }

        // POST /api/email/send-newsletter — Send monthly newsletter to all active subs
        if (path === '/api/email/send-newsletter' && request.method === 'POST') {
            const result = await executeCampaign(env, 'monthly-newsletter');
            return jsonResponse({ success: true, ...result }, 200, request);
        }

        // POST /api/email/track-incomplete — Track incomplete signups
        if (path === '/api/email/track-incomplete' && request.method === 'POST') {
            const body = await request.json() as { email: string; name?: string };
            if (!body.email) return errorResponse('email required', 400, request);

            // Record as incomplete signup subscriber
            const res = await fetch(`${env.SUPABASE_URL}/rest/v1/email_subscribers`, {
                method: 'POST',
                headers: {
                    ...supabaseHeaders(env),
                    'Prefer': 'return=representation,resolution=merge-duplicates',
                },
                body: JSON.stringify({
                    email: body.email,
                    full_name: body.name || '',
                    status: 'incomplete_signup',
                    source: 'incomplete',
                }),
            });

            // Trigger the incomplete signup auto-flow
            await processAutoFlows(env, 'incomplete_signup', body.email);

            return jsonResponse({ success: true, tracked: true }, 200, request);
        }

        return errorResponse('Not found', 404, request);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Email service error';
        console.error('[Email Route Error]', message);
        return errorResponse(message, 500, request);
    }
}
