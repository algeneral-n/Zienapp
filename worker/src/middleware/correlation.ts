// ─── Correlation ID + Standard Response Middleware ───────────────────────────
// Wraps a route handler with:
//   1. Unique X-Correlation-Id per request
//   2. Standard JSON response envelope
//   3. Structured error handling via AppError

import { corsHeaders } from '../cors';
import { AppError, toAppError } from '../utils/errors';

/** Generate a short unique ID (no crypto.randomUUID on older Workers) */
function correlationId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `${ts}-${rand}`;
}

export type RouteHandler = (
    request: Request,
    env: any,
    path: string,
    ctx?: { correlationId: string },
) => Promise<Response>;

/** Handler that takes only (request, env) — like handlePublicAI, handleTTS */
type SimpleHandler = (request: Request, env: any) => Promise<Response>;

/**
 * Wraps a route handler to inject correlationId and catch errors uniformly.
 * Accepts both 3-arg (request, env, path) and 2-arg (request, env) handlers.
 */
export function withCorrelation(handler: RouteHandler | SimpleHandler): RouteHandler {
    return async (request, env, path) => {
        const cid = request.headers.get('x-correlation-id') || correlationId();

        try {
            const response = await handler(request, env, path, { correlationId: cid });

            // Inject correlation ID into response headers
            const headers = new Headers(response.headers);
            headers.set('X-Correlation-Id', cid);
            return new Response(response.body, {
                status: response.status,
                headers,
            });
        } catch (err) {
            const appErr = toAppError(err);
            console.error(`[${cid}] ${appErr.code}: ${appErr.message}`);
            return new Response(JSON.stringify(appErr.toJSON(cid)), {
                status: appErr.status,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Correlation-Id': cid,
                    ...corsHeaders(request),
                },
            });
        }
    };
}
