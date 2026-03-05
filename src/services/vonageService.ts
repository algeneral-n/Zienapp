/**
 * Vonage Service — Frontend client for /api/vonage/* worker endpoints
 * Handles: Verify (OTP), SMS, Voice, Video, Status
 */

import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

async function getHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
    };
}

async function apiPost<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: await getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data as any)?.error || `API error: ${res.status}`);
    return data as T;
}

async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        headers: await getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data as any)?.error || `API error: ${res.status}`);
    return data as T;
}

/* ─── Types ───────────────────────────────────────────────────────────────── */

export interface VerifySendResult {
    request_id: string;
    status: string;
    message: string;
}

export interface VerifyCheckResult {
    status: string;
    event_id: string;
    price: string;
    currency: string;
}

export interface SMSSendResult {
    status: string;
    message_id: string;
    remaining_balance: string;
    message_price: string;
    network: string;
}

export interface VoiceCallResult {
    status: string;
    conversation_uuid: string;
    uuid: string;
}

export interface VonageStatus {
    configured: boolean;
    api_key?: string;
    application_id_set?: boolean;
    private_key_set?: boolean;
    capabilities: {
        verify: boolean;
        sms: boolean;
        voice: boolean;
        video: boolean;
    };
}

export interface VideoSessionResult {
    status: string;
    session_id: string;
    message?: string;
}

/* ─── Service ─────────────────────────────────────────────────────────────── */

export const vonageService = {
    /**
     * Send OTP verification code to a phone number
     */
    async sendVerify(to: string, brand?: string): Promise<VerifySendResult> {
        return apiPost('/api/vonage/verify/send', { to, brand });
    },

    /**
     * Check OTP verification code
     */
    async checkVerify(requestId: string, code: string): Promise<VerifyCheckResult> {
        return apiPost('/api/vonage/verify/check', { request_id: requestId, code });
    },

    /**
     * Send SMS message
     */
    async sendSMS(to: string, text: string, from?: string): Promise<SMSSendResult> {
        return apiPost('/api/vonage/sms/send', { to, text, from });
    },

    /**
     * Initiate voice call
     */
    async initiateCall(to: string, answerUrl: string, from?: string): Promise<VoiceCallResult> {
        return apiPost('/api/vonage/voice/call', { to, answer_url: answerUrl, from });
    },

    /**
     * Get Vonage configuration status
     */
    async getStatus(): Promise<VonageStatus> {
        return apiGet('/api/vonage/status');
    },

    /**
     * Create video session
     */
    async createVideoSession(): Promise<VideoSessionResult> {
        return apiPost('/api/vonage/video/session', {});
    },
};

export default vonageService;
