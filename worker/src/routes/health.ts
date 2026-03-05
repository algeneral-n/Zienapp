import type { Env } from '../index';
import { jsonResponse } from '../index';

export function handleHealth(env: Env): Response {
  return jsonResponse({
    status: 'ok',
    service: 'zien-api',
    environment: env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
}
