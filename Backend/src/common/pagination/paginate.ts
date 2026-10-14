import { PaginationQueryDto } from './pagination-query.dto';

export interface Paginated<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/** Wraps a page of rows in the standard list response. */
export function paginate<T>(
    data: T[],
    total: number,
    query: PaginationQueryDto,
): Paginated<T> {
    return {
        data,
        meta: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / query.limit)),
        },
    };
}