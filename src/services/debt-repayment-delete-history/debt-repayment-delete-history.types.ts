import type { ListParams, PaginationMeta } from '@/services/api/types';

/**
 * Audit row written by the backend when a debt repayment is hard-deleted from the draft cart.
 * The exact field set isn't pinned down yet, so the known ones are optional and the rest is read
 * generically (see `pickField` in the pages); `*_data` holds the snapshot of the deleted repayment.
 */
export interface DebtRepaymentDeleteHistoryRow {
	id: number;
	original_repayment_id?: number | null;
	client_id?: number | null;
	client_name?: string | null;
	client_phone?: string | null;
	original_created_by_name?: string | null;
	deleted_by_name?: string | null;
	repayment_date?: string | null;
	deleted_at?: string | null;
	[field: string]: unknown;
}

export interface DebtRepaymentDeleteHistoryDetail extends DebtRepaymentDeleteHistoryRow {
	repayment_data?: Record<string, unknown> | null;
}

export interface DebtRepaymentDeleteHistoryListResponse {
	pagination: PaginationMeta;
	results: DebtRepaymentDeleteHistoryRow[];
	filters?: unknown;
}

export type DebtRepaymentDeleteHistoryListParams = ListParams;
