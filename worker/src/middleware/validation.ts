// ─── Request Validation Helper ──────────────────────────────────────────────
// Lightweight body validation without external dependencies.
// For edge-compatible validation on Cloudflare Workers.

import { AppError } from '../utils/errors';

export interface FieldRule {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    maxLength?: number;
    minLength?: number;
    min?: number;
    max?: number;
    enum?: readonly string[];
}

export type Schema = Record<string, FieldRule>;

/**
 * Validate a parsed JSON body against a schema.
 * Throws AppError('VALIDATION', ...) on first failure.
 *
 * Usage:
 *   const body = await parseBody(request, {
 *     prompt:    { required: true, type: 'string', maxLength: 10000 },
 *     agentType: { required: true, type: 'string', enum: ['hr','accounting'] },
 *     page:      { type: 'number', min: 1 },
 *   });
 */
export async function parseBody<T = Record<string, unknown>>(
    request: Request,
    schema: Schema,
): Promise<T> {
    let body: any;
    try {
        body = await request.json();
    } catch {
        throw new AppError('VALIDATION', 'Invalid JSON body');
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        throw new AppError('VALIDATION', 'Request body must be a JSON object');
    }

    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
        const val = body[field];

        if (rules.required && (val === undefined || val === null || val === '')) {
            errors.push(`${field} is required`);
            continue;
        }

        if (val === undefined || val === null) continue;

        if (rules.type) {
            const actual = Array.isArray(val) ? 'array' : typeof val;
            if (actual !== rules.type) {
                errors.push(`${field} must be ${rules.type}, got ${actual}`);
                continue;
            }
        }

        if (rules.type === 'string' || typeof val === 'string') {
            if (rules.maxLength !== undefined && val.length > rules.maxLength) {
                errors.push(`${field} exceeds max length ${rules.maxLength}`);
            }
            if (rules.minLength !== undefined && val.length < rules.minLength) {
                errors.push(`${field} must be at least ${rules.minLength} characters`);
            }
            if (rules.enum && !rules.enum.includes(val)) {
                errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
            }
        }

        if (rules.type === 'number' || typeof val === 'number') {
            if (rules.min !== undefined && val < rules.min) {
                errors.push(`${field} must be >= ${rules.min}`);
            }
            if (rules.max !== undefined && val > rules.max) {
                errors.push(`${field} must be <= ${rules.max}`);
            }
        }
    }

    if (errors.length) {
        throw new AppError('VALIDATION', 'Validation failed', errors);
    }

    return body as T;
}

/** Parse URL query params with basic type coercion */
export function parseQuery(url: URL, schema: Schema): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [field, rules] of Object.entries(schema)) {
        const raw = url.searchParams.get(field);

        if (rules.required && (raw === null || raw === '')) {
            throw new AppError('VALIDATION', `Query param '${field}' is required`);
        }

        if (raw === null) continue;

        if (rules.type === 'number') {
            const num = Number(raw);
            if (isNaN(num)) throw new AppError('VALIDATION', `Query param '${field}' must be a number`);
            result[field] = num;
        } else if (rules.type === 'boolean') {
            result[field] = raw === 'true' || raw === '1';
        } else {
            result[field] = raw;
        }
    }

    return result;
}
