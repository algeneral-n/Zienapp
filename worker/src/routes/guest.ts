/**
 * Guest Preview API — OTP-based verification for anonymous visitors
 * Routes: /api/guest/*
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';

// In-memory OTP store (Cloudflare Worker global scope — ephemeral per isolate)
// In production, use KV namespace or D1 for persistence
const otpStore = new Map<string, { code: string; expiresAt: number; verified: boolean }>();

function generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

function generateGuestToken(email: string): string {
    const payload = {
        email,
        type: 'guest_preview',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };
    return btoa(JSON.stringify(payload));
}

async function sendOTPEmail(email: string, otp: string, env: Env): Promise<boolean> {
    const apiKey = env.RESEND_API_KEY;
    const fromEmail = env.RESEND_FROM_EMAIL || 'noreply@zien-ai.app';

    if (!apiKey) {
        console.error('RESEND_API_KEY not configured');
        return false;
    }

    const html = `
<!DOCTYPE html>
<html dir="ltr">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter','Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;letter-spacing:-1px;">ZIEN</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px;">Guest Preview Access</p>
    </div>
    <div style="padding:40px 32px;text-align:center;">
      <p style="color:#475569;font-size:15px;margin:0 0 24px;">Your verification code:</p>
      <div style="background:#f1f5f9;border-radius:16px;padding:24px;margin:0 auto 24px;max-width:240px;">
        <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#1e40af;">${otp}</span>
      </div>
      <p style="color:#94a3b8;font-size:12px;margin:0;">This code expires in 10 minutes. Do not share it.</p>
    </div>
    <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:10px;margin:0;font-weight:700;text-transform:uppercase;letter-spacing:1px;">ZIEN Platform Preview</p>
    </div>
  </div>
</body>
</html>`;

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `ZIEN Platform <${fromEmail}>`,
                to: [email],
                subject: 'ZIEN Guest Preview - Verification Code',
                html,
            }),
        });
        return res.ok;
    } catch (e) {
        console.error('Failed to send OTP email:', e);
        return false;
    }
}

export async function handleGuest(request: Request, env: Env, path: string): Promise<Response> {
    const sub = path.replace('/api/guest/', '').replace(/\/$/, '');

    // POST /api/guest/request-otp
    if (sub === 'request-otp' && request.method === 'POST') {
        try {
            const body = await request.json() as { email?: string };
            const email = body.email?.trim().toLowerCase();

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return errorResponse('Valid email is required', 400, request);
            }

            // Rate limit: max 3 OTPs per email per 10 min
            const existing = otpStore.get(email);
            if (existing && existing.expiresAt > Date.now() && !existing.verified) {
                // Already has a pending OTP, still valid
                return jsonResponse({ sent: true, message: 'OTP already sent. Check your email.' }, 200, request);
            }

            const otp = generateOTP();
            otpStore.set(email, {
                code: otp,
                expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
                verified: false,
            });

            // Also log to Supabase for analytics
            try {
                const sbUrl = env.SUPABASE_URL;
                const sbKey = env.SUPABASE_SERVICE_ROLE_KEY;
                if (sbUrl && sbKey) {
                    await fetch(`${sbUrl}/rest/v1/guest_preview_sessions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': sbKey,
                            'Authorization': `Bearer ${sbKey}`,
                            'Prefer': 'return=minimal',
                        },
                        body: JSON.stringify({
                            email,
                            status: 'otp_sent',
                            ip_address: request.headers.get('cf-connecting-ip') || 'unknown',
                            user_agent: request.headers.get('user-agent') || '',
                        }),
                    });
                }
            } catch (_e) {
                // Non-critical — analytics insertion failure should not block OTP
            }

            const sent = await sendOTPEmail(email, otp, env);
            if (!sent) {
                return errorResponse('Failed to send verification email. Try again.', 500, request);
            }

            return jsonResponse({ sent: true, message: 'Verification code sent to your email.' }, 200, request);
        } catch (e: any) {
            return errorResponse(e.message || 'Invalid request', 400, request);
        }
    }

    // POST /api/guest/verify-otp
    if (sub === 'verify-otp' && request.method === 'POST') {
        try {
            const body = await request.json() as { email?: string; otp?: string };
            const email = body.email?.trim().toLowerCase();
            const otp = body.otp?.trim();

            if (!email || !otp) {
                return errorResponse('Email and OTP are required', 400, request);
            }

            const stored = otpStore.get(email);
            if (!stored) {
                return errorResponse('No pending verification found. Request a new code.', 404, request);
            }

            if (stored.expiresAt < Date.now()) {
                otpStore.delete(email);
                return errorResponse('Verification code has expired. Request a new one.', 410, request);
            }

            if (stored.code !== otp) {
                return errorResponse('Invalid verification code.', 401, request);
            }

            // Mark as verified
            stored.verified = true;
            const token = generateGuestToken(email);

            // Update analytics
            try {
                const sbUrl = env.SUPABASE_URL;
                const sbKey = env.SUPABASE_SERVICE_ROLE_KEY;
                if (sbUrl && sbKey) {
                    await fetch(`${sbUrl}/rest/v1/guest_preview_sessions?email=eq.${encodeURIComponent(email)}&status=eq.otp_sent`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': sbKey,
                            'Authorization': `Bearer ${sbKey}`,
                            'Prefer': 'return=minimal',
                        },
                        body: JSON.stringify({
                            status: 'verified',
                            verified_at: new Date().toISOString(),
                        }),
                    });
                }
            } catch (_e) {
                // Non-critical
            }

            return jsonResponse({
                verified: true,
                token,
                expiresIn: 3600,
                message: 'Email verified. Welcome to ZIEN Preview.',
            }, 200, request);
        } catch (e: any) {
            return errorResponse(e.message || 'Invalid request', 400, request);
        }
    }

    return errorResponse('Guest endpoint not found', 404, request);
}
