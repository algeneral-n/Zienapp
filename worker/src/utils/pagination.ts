// ─── Pagination Helper ──────────────────────────────────────────────────────
// Standard pagination for list endpoints.

export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

/** Parse and clamp pagination from URL search params */
export function parsePagination(url: URL): PaginationParams {
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const rawLimit = parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

/** Build a standard paginated response envelope */
export function paginated<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
    return {
        data,
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages: Math.ceil(total / params.limit),
        },
    };
}
