/** CORS configuration for the ZIEN API Worker */

const ALLOWED_ORIGINS = [
  'https://www.zien-ai.app',
  'https://zien-ai.app',
  'http://localhost:5173',     // Vite dev
  'http://localhost:3000',
];

/** Base headers without origin (origin set per-request). */
const baseCorsHeaders: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key, X-Company-Id',
  'Access-Control-Max-Age': '86400',
};

/** Returns validated CORS origin or the primary domain. */
export function getAllowedOrigin(request: Request): string {
  const origin = request.headers.get('Origin') ?? '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

/** Build CORS headers for a specific request (uses validated origin). */
export function corsHeaders(request?: Request): Record<string, string> {
  const origin = request ? getAllowedOrigin(request) : ALLOWED_ORIGINS[0];
  return {
    ...baseCorsHeaders,
    'Access-Control-Allow-Origin': origin,
  };
}

export function handleCors(request?: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
