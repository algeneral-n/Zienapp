// ─── Structured API Errors ──────────────────────────────────────────────────
// Standard error codes and response builder for the ZIEN Worker API.

export type ErrorCode =
    | 'AUTH_REQUIRED'
    | 'AUTH_INVALID'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'VALIDATION'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'INTERNAL'
    | 'BAD_REQUEST'
    | 'MODULE_DISABLED'
    | 'PERMISSION_DENIED';

export interface ApiError {
    error: string;
    code: ErrorCode;
    details?: unknown;
    correlationId?: string;
}

const STATUS_MAP: Record<ErrorCode, number> = {
    AUTH_REQUIRED: 401,
    AUTH_INVALID: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION: 422,
    CONFLICT: 409,
    RATE_LIMITED: 429,
    INTERNAL: 500,
    BAD_REQUEST: 400,
    MODULE_DISABLED: 403,
    PERMISSION_DENIED: 403,
};

export class AppError extends Error {
    constructor(
        public readonly code: ErrorCode,
        message: string,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = 'AppError';
    }

    get status(): number {
        return STATUS_MAP[this.code];
    }

    toJSON(correlationId?: string): ApiError {
        return {
            error: this.message,
            code: this.code,
            ...(this.details !== undefined && { details: this.details }),
            ...(correlationId && { correlationId }),
        };
    }
}

/** Map generic errors (from requireAuth, guard, etc.) to AppError */
export function toAppError(err: unknown): AppError {
    if (err instanceof AppError) return err;

    const msg = err instanceof Error ? err.message : 'Internal server error';

    // Map known error messages to codes
    if (msg.includes('Authorization header')) return new AppError('AUTH_REQUIRED', msg);
    if (msg.includes('expired token') || msg.includes('Invalid or expired')) return new AppError('AUTH_INVALID', msg);
    if (msg.includes('Missing X-Company-Id')) return new AppError('BAD_REQUEST', msg);
    if (msg.includes('Not a member')) return new AppError('FORBIDDEN', msg);
    if (msg.includes('not enabled')) return new AppError('MODULE_DISABLED', msg);
    if (msg.includes('Insufficient permissions') || msg.includes('Missing permission')) return new AppError('PERMISSION_DENIED', msg);
    if (msg.includes('Platform role required')) return new AppError('FORBIDDEN', msg);

    return new AppError('INTERNAL', msg);
}
