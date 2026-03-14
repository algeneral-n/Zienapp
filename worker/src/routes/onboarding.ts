/**
 * ZIEN Onboarding Routes — Public endpoints for registration wizard
 * No auth required (pre-registration flow)
 *
 *   GET  /api/onboarding/industries      — list available industry blueprints
 *   GET  /api/onboarding/plans           — list subscription plans
 *   POST /api/onboarding/save-draft      — auto-save registration application
 *   POST /api/onboarding/verify-document — AI document verification
 *   POST /api/onboarding/submit          — submit application for Founder review
 *   GET  /api/onboarding/application/:id — get application status
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { createAdminClient } from '../supabase';

export async function handleOnboarding(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {

    // ─── GET /api/onboarding/industries ────────────────────────────────────
    if (path === '/api/onboarding/industries' && request.method === 'GET') {
        return getIndustries(env);
    }

    // ─── GET /api/onboarding/plans ─────────────────────────────────────────
    if (path === '/api/onboarding/plans' && request.method === 'GET') {
        return getPlans(env);
    }

    // ─── POST /api/onboarding/save-draft ───────────────────────────────────
    if (path === '/api/onboarding/save-draft' && request.method === 'POST') {
        return saveDraft(request, env);
    }

    // ─── POST /api/onboarding/verify-document ──────────────────────────────
    if (path === '/api/onboarding/verify-document' && request.method === 'POST') {
        return verifyDocument(request, env);
    }

    // ─── POST /api/onboarding/submit ───────────────────────────────────────
    if (path === '/api/onboarding/submit' && request.method === 'POST') {
        return submitApplication(request, env);
    }

    // ─── GET /api/onboarding/application/:id ───────────────────────────────
    const appMatch = path.match(/^\/api\/onboarding\/application\/([a-f0-9-]+)$/);
    if (appMatch && request.method === 'GET') {
        return getApplicationStatus(appMatch[1], env);
    }

    return errorResponse('Not found', 404);
}

// ═════════════════════════════════════════════════════════════════════════════
// Industries — fetches from industry_blueprints table
// ═════════════════════════════════════════════════════════════════════════════

async function getIndustries(env: Env): Promise<Response> {
    const admin = createAdminClient(env);

    const { data, error } = await admin
        .from('industry_blueprints')
        .select('id, industry_code, industry_name_en, industry_name_ar, recommended_modules, default_plan, default_settings, business_sizes, sub_activities')
        .eq('is_active', true)
        .order('industry_name_en');

    if (error) return errorResponse(error.message, 500);

    return jsonResponse({
        industries: (data ?? []).map((bp: Record<string, unknown>) => ({
            code: bp.industry_code,
            name_en: bp.industry_name_en,
            name_ar: bp.industry_name_ar,
            recommended_modules: bp.recommended_modules,
            default_plan: bp.default_plan,
            default_settings: bp.default_settings,
            business_sizes: bp.business_sizes,
            sub_activities: bp.sub_activities ?? [],
        })),
    });
}

// ═════════════════════════════════════════════════════════════════════════════
// Plans — fetches subscription_plans with pricing
// ═════════════════════════════════════════════════════════════════════════════

async function getPlans(env: Env): Promise<Response> {
    const admin = createAdminClient(env);

    const { data: plans, error } = await admin
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) return errorResponse(error.message, 500);

    return jsonResponse({
        plans: (plans ?? []).map((p: Record<string, unknown>) => ({
            code: p.code,
            name_en: p.name_en,
            name_ar: p.name_ar,
            price_monthly: p.price_monthly,
            price_yearly: p.price_yearly,
            currency: p.currency || 'AED',
            max_users: p.max_users,
            features: p.features,
        })),
    });
}

// ═════════════════════════════════════════════════════════════════════════════
// Save Draft — progressive auto-save of registration data
// ═════════════════════════════════════════════════════════════════════════════

async function saveDraft(request: Request, env: Env): Promise<Response> {
    const body = (await request.json()) as {
        application_id?: string;
        company_name?: string;
        company_name_ar?: string;
        industry_code?: string;
        country?: string;
        city?: string;
        employee_count?: string;
        cr_number?: string;
        gm_name?: string;
        gm_email?: string;
        gm_phone?: string;
        selected_modules?: string[];
        plan_code?: string;
        billing_cycle?: string;
        license_file_url?: string;
        id_file_url?: string;
        step_completed?: number;
    };

    const admin = createAdminClient(env);

    if (body.application_id) {
        // Update existing draft
        const updateData: Record<string, unknown> = {};
        if (body.company_name !== undefined) updateData.company_name = body.company_name;
        if (body.company_name_ar !== undefined) updateData.company_name_ar = body.company_name_ar;
        if (body.industry_code !== undefined) updateData.industry_code = body.industry_code;
        if (body.country !== undefined) updateData.country = body.country;
        if (body.city !== undefined) updateData.city = body.city;
        if (body.employee_count !== undefined) updateData.employee_count = body.employee_count;
        if (body.cr_number !== undefined) updateData.cr_number = body.cr_number;
        if (body.gm_name !== undefined) updateData.gm_name = body.gm_name;
        if (body.gm_email !== undefined) updateData.gm_email = body.gm_email;
        if (body.gm_phone !== undefined) updateData.gm_phone = body.gm_phone;
        if (body.selected_modules !== undefined) updateData.selected_modules = body.selected_modules;
        if (body.plan_code !== undefined) updateData.plan_code = body.plan_code;
        if (body.billing_cycle !== undefined) updateData.billing_cycle = body.billing_cycle;
        if (body.license_file_url !== undefined) updateData.license_file_url = body.license_file_url;
        if (body.id_file_url !== undefined) updateData.id_file_url = body.id_file_url;
        if (body.step_completed !== undefined) updateData.step_completed = body.step_completed;

        const { data, error } = await admin
            .from('registration_applications')
            .update(updateData)
            .eq('id', body.application_id)
            .eq('status', 'draft')
            .select()
            .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse({ application: data });
    }

    // Create new draft
    const { data, error } = await admin
        .from('registration_applications')
        .insert({
            company_name: body.company_name || '',
            company_name_ar: body.company_name_ar || '',
            industry_code: body.industry_code || '',
            country: body.country || 'AE',
            city: body.city || '',
            employee_count: body.employee_count || '1-10',
            cr_number: body.cr_number || '',
            gm_name: body.gm_name || '',
            gm_email: body.gm_email || '',
            gm_phone: body.gm_phone || '',
            selected_modules: body.selected_modules || [],
            plan_code: body.plan_code || '',
            billing_cycle: body.billing_cycle || 'monthly',
            step_completed: body.step_completed || 0,
            status: 'draft',
        })
        .select()
        .single();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ application: data }, 201);
}

// ═════════════════════════════════════════════════════════════════════════════
// Document Verification — AI-powered document analysis
// ═════════════════════════════════════════════════════════════════════════════

async function verifyDocument(request: Request, env: Env): Promise<Response> {
    const body = (await request.json()) as {
        application_id: string;
        document_type: 'license' | 'id';
        file_url: string;
    };

    if (!body.application_id || !body.document_type || !body.file_url) {
        return errorResponse('Missing application_id, document_type, or file_url');
    }

    const admin = createAdminClient(env);

    // Download the file from Supabase Storage for analysis
    // The file_url is a storage path like: company-docs/draft-xxx/trade_license_123.jpg
    const storagePath = body.file_url;

    const { data: fileData, error: downloadErr } = await admin.storage
        .from('company-docs')
        .download(storagePath);

    if (downloadErr || !fileData) {
        return errorResponse('Could not download document for verification', 500);
    }

    // Convert to base64 for OpenAI Vision API
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = storagePath.endsWith('.pdf') ? 'application/pdf'
        : storagePath.endsWith('.png') ? 'image/png'
            : 'image/jpeg';

    // Use OpenAI Vision to verify the document
    const verificationPrompt = body.document_type === 'license'
        ? `Analyze this image. Is this a real, legitimate business/trade license document? Check for:
       1. Does it contain official government headers, stamps, or seals?
       2. Does it have a license number, company name, and date?
       3. Does it look like a genuine document (not blank, not a random photo)?
       4. Is the image quality sufficient to read the content?
       Respond in JSON: {"is_valid": true/false, "confidence": 0-100, "document_type": "trade_license|other|unknown", "details": "brief description", "issues": ["list of issues if any"]}`
        : `Analyze this image. Is this a real, legitimate government-issued ID document (passport, national ID, or emirates ID)? Check for:
       1. Does it contain a photo and personal information?
       2. Does it have official markings, holograms indicators, or government headers?
       3. Does it look like a genuine ID document (not blank, not a random photo)?
       4. Is the image quality sufficient to read the content?
       Respond in JSON: {"is_valid": true/false, "confidence": 0-100, "document_type": "passport|national_id|emirates_id|other|unknown", "details": "brief description", "issues": ["list of issues if any"]}`;

    try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: verificationPrompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64}`,
                                    detail: 'low',
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 500,
                response_format: { type: 'json_object' },
            }),
        });

        const aiResult = (await openaiRes.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
            error?: { message?: string };
        };

        if (aiResult.error) {
            return errorResponse(`AI verification failed: ${aiResult.error.message}`, 500);
        }

        const content = aiResult.choices?.[0]?.message?.content || '{}';
        const verification = JSON.parse(content) as {
            is_valid: boolean;
            confidence: number;
            document_type: string;
            details: string;
            issues: string[];
        };

        // Update application with verification result
        const updateField = body.document_type === 'license'
            ? { license_verified: verification.is_valid, license_verification_result: verification }
            : { id_verified: verification.is_valid, id_verification_result: verification };

        await admin
            .from('registration_applications')
            .update(updateField)
            .eq('id', body.application_id);

        return jsonResponse({ verification });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return errorResponse(`Document verification error: ${msg}`, 500);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// Submit Application — sends to Founder review queue
// ═════════════════════════════════════════════════════════════════════════════

async function submitApplication(request: Request, env: Env): Promise<Response> {
    const body = (await request.json()) as {
        application_id: string;
        gm_password: string;
        agreed_to_terms: boolean;
    };

    if (!body.application_id || !body.gm_password || !body.agreed_to_terms) {
        return errorResponse('Missing application_id, gm_password, or agreed_to_terms');
    }

    const admin = createAdminClient(env);

    // Fetch the application
    const { data: app, error: fetchErr } = await admin
        .from('registration_applications')
        .select('*')
        .eq('id', body.application_id)
        .single();

    if (fetchErr || !app) {
        return errorResponse('Application not found', 404);
    }

    if (app.status !== 'draft') {
        return errorResponse('Application already submitted', 400);
    }

    // Validate required fields
    const missing: string[] = [];
    if (!app.company_name) missing.push('company_name');
    if (!app.gm_email) missing.push('gm_email');
    if (!app.gm_name) missing.push('gm_name');
    if (!app.industry_code) missing.push('industry_code');

    if (missing.length > 0) {
        return errorResponse(`Missing required fields: ${missing.join(', ')}`);
    }

    // Everything looks good — submit for review
    const { data: updated, error: updateErr } = await admin
        .from('registration_applications')
        .update({ status: 'submitted', step_completed: 6 })
        .eq('id', body.application_id)
        .select()
        .single();

    if (updateErr) return errorResponse(updateErr.message, 500);

    // Log to founder platform_actions if table exists
    try {
        await admin.from('platform_actions').insert({
            action_type: 'registration_submitted',
            actor_id: null,
            target_type: 'registration_application',
            target_id: body.application_id,
            metadata: {
                company_name: app.company_name,
                gm_email: app.gm_email,
                industry: app.industry_code,
            },
        });
    } catch {
        // platform_actions table may not exist yet
    }

    return jsonResponse({
        success: true,
        application: updated,
        message: 'Application submitted for review. You will be notified once approved.',
    });
}

// ═════════════════════════════════════════════════════════════════════════════
// Application Status
// ═════════════════════════════════════════════════════════════════════════════

async function getApplicationStatus(id: string, env: Env): Promise<Response> {
    const admin = createAdminClient(env);

    const { data, error } = await admin
        .from('registration_applications')
        .select('id, status, step_completed, license_verified, id_verified, license_verification_result, id_verification_result, review_notes, reviewed_at, created_at, updated_at')
        .eq('id', id)
        .single();

    if (error || !data) {
        return errorResponse('Application not found', 404);
    }

    return jsonResponse({ application: data });
}
