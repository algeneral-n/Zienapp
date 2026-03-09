/**
 * Voice Automation Routes
 * Voice agent configs, call logs, TTS, STT, AI voice conversations
 */

import type { Env } from '../index';
import { jsonResponse, errorResponse } from '../index';
import { requireAuth, createAdminClient } from '../supabase';

export async function handleVoice(
    request: Request,
    env: Env,
    path: string,
): Promise<Response> {
    const { userId, supabase } = await requireAuth(request, env);
    const companyId = request.headers.get('x-company-id') || '';

    // ─── Voice Agent Config ─────────────────────────────────────────────
    if (path === '/api/voice/config' && request.method === 'GET') {
        return getVoiceConfig(companyId, supabase);
    }

    if (path === '/api/voice/config' && request.method === 'PUT') {
        return updateVoiceConfig(request, companyId, userId, supabase);
    }

    // ─── Text-to-Speech ─────────────────────────────────────────────────
    if (path === '/api/voice/synthesize' && request.method === 'POST') {
        return synthesizeSpeech(request, env);
    }

    // ─── Speech-to-Text ─────────────────────────────────────────────────
    if (path === '/api/voice/transcribe' && request.method === 'POST') {
        return transcribeSpeech(request, env);
    }

    // ─── AI Voice Conversation ──────────────────────────────────────────
    if (path === '/api/voice/converse' && request.method === 'POST') {
        return voiceConverse(request, companyId, env, supabase);
    }

    // ─── Call Logs ──────────────────────────────────────────────────────
    if (path === '/api/voice/calls' && request.method === 'GET') {
        return listCallLogs(companyId, supabase);
    }

    if (path === '/api/voice/calls' && request.method === 'POST') {
        return logCall(request, companyId, supabase);
    }

    // ─── Voice Analytics ────────────────────────────────────────────────
    if (path === '/api/voice/analytics' && request.method === 'GET') {
        return getVoiceAnalytics(companyId, supabase);
    }

    return errorResponse('Not found', 404);
}

// ─── Voice Config ───────────────────────────────────────────────────────────

async function getVoiceConfig(
    companyId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const { data } = await supabase
        .from('voice_agent_configs')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

    return jsonResponse({
        config: data || {
            agent_name: 'RARE Voice',
            voice_id: '6ZVgc4q9LWAloWbuwjuu',
            language: 'ar',
            max_call_duration: 300,
            is_active: false,
        },
    });
}

async function updateVoiceConfig(
    request: Request,
    companyId: string,
    userId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        agent_name?: string;
        voice_id?: string;
        language?: string;
        greeting_text?: string;
        system_prompt?: string;
        max_call_duration?: number;
        is_active?: boolean;
    };

    const { data, error } = await supabase
        .from('voice_agent_configs')
        .upsert({
            company_id: companyId,
            ...body,
            updated_at: new Date().toISOString(),
            created_by: userId,
        }, { onConflict: 'company_id' })
        .select()
        .single();

    if (error) return errorResponse(error.message);
    return jsonResponse({ config: data });
}

// ─── Text-to-Speech (ElevenLabs) ────────────────────────────────────────────

async function synthesizeSpeech(request: Request, env: Env): Promise<Response> {
    const body = (await request.json()) as {
        text: string;
        voice_id?: string;
        model_id?: string;
    };

    if (!body.text) return errorResponse('Missing text');

    const apiKey = env.ELEVENLABS_API_KEY;
    if (!apiKey) return errorResponse('Voice service not configured');

    const voiceId = body.voice_id || '6ZVgc4q9LWAloWbuwjuu';
    const modelId = body.model_id || 'eleven_multilingual_v2';

    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg',
            },
            body: JSON.stringify({
                text: body.text,
                model_id: modelId,
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    style: 0.3,
                    use_speaker_boost: true,
                },
            }),
        }
    );

    if (!response.ok) {
        const err = await response.text();
        return errorResponse(`TTS failed: ${err}`, 502);
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
        headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': String(audioBuffer.byteLength),
            'Cache-Control': 'public, max-age=3600',
        },
    });
}

// ─── Speech-to-Text (OpenAI Whisper) ────────────────────────────────────────

async function transcribeSpeech(request: Request, env: Env): Promise<Response> {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) return errorResponse('AI service not configured');

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    if (!audioFile) return errorResponse('Missing audio file');

    const whisperForm = new FormData();
    whisperForm.append('file', audioFile, 'audio.webm');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', (formData.get('language') as string) || 'ar');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        body: whisperForm,
    });

    if (!response.ok) {
        return errorResponse('Transcription failed', 502);
    }

    const result = (await response.json()) as { text?: string };
    return jsonResponse({ text: result.text || '' });
}

// ─── AI Voice Conversation ──────────────────────────────────────────────────

async function voiceConverse(
    request: Request,
    companyId: string,
    env: Env,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        text: string;
        conversation_id?: string;
        language?: string;
    };

    if (!body.text) return errorResponse('Missing text');

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) return errorResponse('AI service not configured');

    // Get voice config for system prompt
    const { data: voiceConfig } = await supabase
        .from('voice_agent_configs')
        .select('system_prompt, language, voice_id')
        .eq('company_id', companyId)
        .maybeSingle();

    const systemPrompt = voiceConfig?.system_prompt ||
        'You are RARE, an AI voice assistant for the ZIEN business platform. Be concise and helpful. Respond in the same language as the user.';

    // Get AI response
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: body.text },
            ],
            max_tokens: 300,
            temperature: 0.7,
        }),
    });

    const aiData = (await aiResponse.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const responseText = aiData?.choices?.[0]?.message?.content || '';

    // Synthesize speech
    const elevenLabsKey = env.ELEVENLABS_API_KEY;
    let audioBase64: string | null = null;

    if (elevenLabsKey && responseText) {
        const voiceId = voiceConfig?.voice_id || '6ZVgc4q9LWAloWbuwjuu';
        try {
            const ttsResponse = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                    method: 'POST',
                    headers: {
                        'xi-api-key': elevenLabsKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg',
                    },
                    body: JSON.stringify({
                        text: responseText,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75,
                            style: 0.3,
                            use_speaker_boost: true,
                        },
                    }),
                }
            );

            if (ttsResponse.ok) {
                const audioBuffer = await ttsResponse.arrayBuffer();
                const bytes = new Uint8Array(audioBuffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                audioBase64 = btoa(binary);
            }
        } catch (err) {
            console.error('TTS in conversation failed:', err);
        }
    }

    return jsonResponse({
        text: responseText,
        audio: audioBase64,
        audio_format: 'audio/mpeg',
    });
}

// ─── Call Logs ──────────────────────────────────────────────────────────────

async function listCallLogs(
    companyId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const { data } = await supabase
        .from('call_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);

    return jsonResponse({ calls: data || [] });
}

async function logCall(
    request: Request,
    companyId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const body = (await request.json()) as {
        caller_id?: string;
        direction: string;
        status: string;
        duration_seconds?: number;
        transcript?: string;
        sentiment?: string;
        ai_summary?: string;
        recording_url?: string;
    };

    const { data, error } = await supabase
        .from('call_logs')
        .insert({
            company_id: companyId,
            ...body,
        })
        .select()
        .single();

    if (error) return errorResponse(error.message);
    return jsonResponse({ call: data }, 201);
}

// ─── Voice Analytics ────────────────────────────────────────────────────────

async function getVoiceAnalytics(
    companyId: string,
    supabase: import('@supabase/supabase-js').SupabaseClient,
): Promise<Response> {
    const { data: calls } = await supabase
        .from('call_logs')
        .select('direction, status, duration_seconds, sentiment, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200);

    const logs = calls || [];
    const totalCalls = logs.length;
    const inbound = logs.filter(c => c.direction === 'inbound').length;
    const outbound = logs.filter(c => c.direction === 'outbound').length;
    const completed = logs.filter(c => c.status === 'completed').length;
    const missed = logs.filter(c => c.status === 'missed').length;
    const avgDuration = totalCalls > 0
        ? Math.round(logs.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / totalCalls)
        : 0;
    const positive = logs.filter(c => c.sentiment === 'positive').length;
    const negative = logs.filter(c => c.sentiment === 'negative').length;

    return jsonResponse({
        summary: {
            totalCalls,
            inbound,
            outbound,
            completed,
            missed,
            avgDuration,
            completionRate: totalCalls > 0 ? ((completed / totalCalls) * 100).toFixed(1) : '0',
            sentimentBreakdown: { positive, negative, neutral: totalCalls - positive - negative },
        },
    });
}
