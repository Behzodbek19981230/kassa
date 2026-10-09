import type { PaginationMeta } from '@/services/api/types';

// A list endpoint answers with a plain array, `{ results, pagination }` or DRF-style `{ results, next }`.
export interface ListResponse<T> {
	results: T[];
	pagination?: PaginationMeta;
	next?: string | null;
}

// Reads one page of a list response. `nextPage` is undefined when no further page exists.
export function parseListPage<T>(
	data: T[] | ListResponse<T>,
	page: number,
): { results: T[]; nextPage: number | undefined } {
	if (Array.isArray(data)) return { results: data, nextPage: undefined };
	const hasNext = data.pagination ? data.pagination.currentPage < data.pagination.lastPage : Boolean(data.next);
	return { results: data.results, nextPage: hasNext ? page + 1 : undefined };
}
