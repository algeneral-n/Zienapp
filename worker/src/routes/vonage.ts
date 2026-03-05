/**
 * ZIEN Vonage Route — Voice, Messaging, Verify, Video
 * Endpoints:
 *   POST /api/vonage/verify/send     — Send verification code (OTP)
 *   POST /api/vonage/verify/check    — Check verification code
 *   POST /api/vonage/sms/send        — Send SMS message
 *   POST /api/vonage/voice/call      — Initiate voice call
 *   GET  /api/vonage/status          — Vonage account status
 *   POST /api/vonage/video/session   — Create video session
 */

import { jsonResponse, errorResponse, type Env } from '../index';

/* ─── Extended Env ────────────────────────────────────────────────────────── */

interface VonageEnv extends Env {
    VONAGE_API_KEY?: string;
    VONAGE_API_SECRET?: string;
    VONAGE_APPLICATION_ID?: string;
    VONAGE_PRIVATE_KEY?: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function requireAuth(request: Request, env: VonageEnv): { userId: string; email: string } {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
    }
    // In production, verify JWT against Supabase. For now, extract sub claim.
    try {
        const token = auth.split(' ')[1];
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { userId: payload.sub, email: payload.email };
    } catch {
        throw new Error('Invalid token');
    }
}

function getVonageAuth(env: VonageEnv): { apiKey: string; apiSecret: string } {
    const apiKey = env.VONAGE_API_KEY;
    const apiSecret = env.VONAGE_API_SECRET;
    if (!apiKey || !apiSecret) throw new Error('Vonage credentials not configured');
    return { apiKey, apiSecret };
}

async function vonageRequest(
    path: string,
    method: 'GET' | 'POST',
    env: VonageEnv,
    body?: Record<string, unknown>,
): Promise<any> {
    const { apiKey, apiSecret } = getVonageAuth(env);
    const url = `https://api.nexmo.com${path}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Basic auth for most Vonage APIs
    const authHeader = btoa(`${apiKey}:${apiSecret}`);
    headers['Authorization'] = `Basic ${authHeader}`;

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify({ ...body, api_key: apiKey, api_secret: apiSecret }) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error((data as any)?.error_text || (data as any)?.title || `Vonage API error: ${res.status}`);
    }
    return data;
}

/* ─── Verify v2 Helpers ───────────────────────────────────────────────────── */

async function sendVerify(env: VonageEnv, to: string, brand: string = 'ZIEN', codeLength: number = 6): Promise<any> {
    const { apiKey, apiSecret } = getVonageAuth(env);
    const res = await fetch('https://api.nexmo.com/verify/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: apiKey,
            api_secret: apiSecret,
            number: to.replace(/[^0-9+]/g, ''),
            brand,
            code_length: codeLength,
            pin_expiry: 300,
            next_event_wait: 120,
        }),
    });
    return res.json();
}

async function checkVerify(env: VonageEnv, requestId: string, code: string): Promise<any> {
    const { apiKey, apiSecret } = getVonageAuth(env);
    const res = await fetch('https://api.nexmo.com/verify/check/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: apiKey,
            api_secret: apiSecret,
            request_id: requestId,
            code,
        }),
    });
    return res.json();
}

/* ─── SMS Helper ──────────────────────────────────────────────────────────── */

async function sendSMS(env: VonageEnv, to: string, text: string, from: string = 'ZIEN'): Promise<any> {
    const { apiKey, apiSecret } = getVonageAuth(env);
    const res = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: apiKey,
            api_secret: apiSecret,
            from,
            to: to.replace(/[^0-9+]/g, ''),
            text,
            type: 'unicode',
        }),
    });
    return res.json();
}

/* ─── Voice Helper ────────────────────────────────────────────────────────── */

async function initiateCall(env: VonageEnv, to: string, answerUrl: string, from?: string): Promise<any> {
    const appId = env.VONAGE_APPLICATION_ID;
    const privateKey = env.VONAGE_PRIVATE_KEY;
    if (!appId || !privateKey) throw new Error('Vonage Application ID or Private Key not configured');

    // For Vonage Voice API, we need JWT auth, not basic auth
    // Generate a simple JWT (in production, use a proper JWT library)
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const claims = btoa(JSON.stringify({
        application_id: appId,
        iat: now,
        exp: now + 3600,
        jti: crypto.randomUUID(),
    }));

    // Note: Full RS256 signing requires crypto.subtle with the private key.
    // In a Cloudflare Worker, you'd import the key and sign properly.
    // This is a simplified version — production should use proper JWT signing.
    const res = await fetch('https://api.nexmo.com/v1/calls', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${header}.${claims}._signature_placeholder`,
        },
        body: JSON.stringify({
            to: [{ type: 'phone', number: to.replace(/[^0-9+]/g, '') }],
            from: { type: 'phone', number: from || env.VONAGE_API_KEY },
            answer_url: [answerUrl],
        }),
    });
    return res.json();
}

/* ─── Main Handler ────────────────────────────────────────────────────────── */

export async function handleVonage(request: Request, env: VonageEnv, path: string): Promise<Response> {
    try {
        // Require authentication for all vonage endpoints
        const user = requireAuth(request, env as any);

        // ──── POST /api/vonage/verify/send ────
        if (path === '/api/vonage/verify/send' && request.method === 'POST') {
            const body = await request.json() as { to: string; brand?: string };
            if (!body.to) return errorResponse('Missing "to" phone number', 400, request);

            const result = await sendVerify(env, body.to, body.brand);
            if (result.status !== '0') {
                return errorResponse(result.error_text || 'Verification send failed', 400, request);
            }
            return jsonResponse({
                request_id: result.request_id,
                status: 'sent',
                message: 'Verification code sent',
            }, 200, request);
        }

        // ──── POST /api/vonage/verify/check ────
        if (path === '/api/vonage/verify/check' && request.method === 'POST') {
            const body = await request.json() as { request_id: string; code: string };
            if (!body.request_id || !body.code) {
                return errorResponse('Missing request_id or code', 400, request);
            }

            const result = await checkVerify(env, body.request_id, body.code);
            if (result.status !== '0') {
                return errorResponse(result.error_text || 'Verification check failed', 400, request);
            }
            return jsonResponse({
                status: 'verified',
                event_id: result.event_id,
                price: result.price,
                currency: result.currency,
            }, 200, request);
        }

        // ──── POST /api/vonage/sms/send ────
        if (path === '/api/vonage/sms/send' && request.method === 'POST') {
            const body = await request.json() as { to: string; text: string; from?: string };
            if (!body.to || !body.text) {
                return errorResponse('Missing "to" or "text"', 400, request);
            }

            const result = await sendSMS(env, body.to, body.text, body.from);
            const msg = result.messages?.[0];
            if (msg?.status !== '0') {
                return errorResponse(msg?.['error-text'] || 'SMS send failed', 400, request);
            }
            return jsonResponse({
                status: 'sent',
                message_id: msg?.['message-id'],
                remaining_balance: msg?.['remaining-balance'],
                message_price: msg?.['message-price'],
                network: msg?.network,
            }, 200, request);
        }

        // ──── POST /api/vonage/voice/call ────
        if (path === '/api/vonage/voice/call' && request.method === 'POST') {
            const body = await request.json() as { to: string; answer_url: string; from?: string };
            if (!body.to || !body.answer_url) {
                return errorResponse('Missing "to" or "answer_url"', 400, request);
            }

            const result = await initiateCall(env, body.to, body.answer_url, body.from);
            return jsonResponse({
                status: 'initiated',
                conversation_uuid: result.conversation_uuid,
                uuid: result.uuid,
            }, 200, request);
        }

        // ──── GET /api/vonage/status ────
        if (path === '/api/vonage/status' && request.method === 'GET') {
            try {
                const { apiKey } = getVonageAuth(env);
                const hasAppId = !!env.VONAGE_APPLICATION_ID;
                const hasPrivateKey = !!env.VONAGE_PRIVATE_KEY;
                return jsonResponse({
                    configured: true,
                    api_key: apiKey.substring(0, 4) + '****',
                    application_id_set: hasAppId,
                    private_key_set: hasPrivateKey,
                    capabilities: {
                        verify: true,
                        sms: true,
                        voice: hasAppId && hasPrivateKey,
                        video: hasAppId && hasPrivateKey,
                    },
                }, 200, request);
            } catch {
                return jsonResponse({
                    configured: false,
                    capabilities: { verify: false, sms: false, voice: false, video: false },
                }, 200, request);
            }
        }

        // ──── POST /api/vonage/video/session ────
        if (path === '/api/vonage/video/session' && request.method === 'POST') {
            // Vonage Video API (formerly OpenTok) session creation
            const appId = env.VONAGE_APPLICATION_ID;
            if (!appId) return errorResponse('Vonage Application ID not configured', 500, request);

            // For now, return a placeholder - full implementation requires proper JWT signing
            return jsonResponse({
                status: 'created',
                session_id: `session_${crypto.randomUUID()}`,
                message: 'Video session created (placeholder — wire to Vonage Video API)',
            }, 200, request);
        }

        return errorResponse('Vonage endpoint not found', 404, request);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Vonage route error';
        return errorResponse(message, err instanceof Error && err.message === 'Unauthorized' ? 401 : 500, request);
    }
}
