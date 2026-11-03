import type { ListParams, PaginationMeta } from '@/services/api/types';

/** Money values travel as strings, e.g. `"500.00"`. */
export type Money = string;

export type PayrollTransactionType = 'SALARY' | 'BONUS' | 'PENALTY';

export interface PayrollPersonDetail {
	id: number;
	username?: string;
	first_name?: string;
	last_name?: string;
}

export interface PayrollListResponse<T> {
	results: T[];
	pagination?: PaginationMeta;
}

/* ---------- GET /payroll/summary/ ---------- */

export interface PayrollSummaryParams {
	user: number;
	year: number;
	month: number;
}

export interface PayrollSummaryUser extends PayrollPersonDetail {
	oylik_dollar: Money;
	oylik_som: Money;
}

/** The month's totals as the backend computed them; the page shows these as-is. */
export interface PayrollSummaryTotals {
	base_oylik_dollar: Money;
	base_oylik_som: Money;
	penalty_dollar: Money;
	penalty_som: Money;
	payable_dollar: Money;
	payable_som: Money;
	paid_dollar: Money;
	paid_som: Money;
	paid_card: Money;
	remaining_dollar: Money;
	remaining_som: Money;
	bonus_dollar: Money;
	bonus_som: Money;
	bonus_card: Money;
}

export interface PayrollSummaryResponse {
	user: PayrollSummaryUser;
	year: number;
	month: number;
	/** Months of `year` that have at least one transaction. */
	active_months: number[];
	summary: PayrollSummaryTotals;
}

/* ---------- /payroll-transaction/ ---------- */

export interface PayrollTransaction {
	id: number;
	user: number;
	year: number;
	month: number;
	transaction_type: PayrollTransactionType;
	transaction_type_display?: string;
	summa_dollar: Money;
	summa_som: Money;
	summa_karta: Money;
	/** Whole amount in dollars: summa_dollar + (summa_som + summa_karta) / rate. */
	all_summa_dollar?: Money;
	transaction_time: string;
	note?: string | null;
	created_by?: number | null;
	created_by_detail?: PayrollPersonDetail | null;
}

export interface PayrollTransactionListParams extends ListParams {
	user: number;
	year: number;
	month: number;
	transaction_type?: PayrollTransactionType;
}

export interface PayrollTransactionPayload {
	user: number;
	year: number;
	month: number;
	transaction_type: PayrollTransactionType;
	summa_dollar: Money;
	summa_som: Money;
	summa_karta: Money;
	/** Whole amount in dollars, computed from the three amounts at today's rate. */
	all_summa_dollar: Money;
	/** ISO 8601 with offset, e.g. `2026-11-03T14:30:00+05:00`. */
	transaction_time: string;
	note: string;
	/** Idempotency key: a new UUID per operation, the same one when retrying it. */
	transaction_key: string;
}

export interface PayrollTransactionCreateResponse {
	transaction: PayrollTransaction;
	/** May hold only some of the totals; merged over the cached summary. */
	summary?: Partial<PayrollSummaryTotals>;
}

/* ---------- salary rate ---------- */

export interface SalaryRateUpdatePayload {
	user: number;
	oylik_dollar: Money;
	oylik_som: Money;
	effective_year: number;
	effective_month: number;
}

export interface UserSalaryHistory {
	id: number;
	user: number;
	old_oylik_dollar: Money;
	new_oylik_dollar: Money;
	old_oylik_som: Money;
	new_oylik_som: Money;
	effective_year: number;
	effective_month: number;
	changed_time: string;
	created_by: number | null;
	created_by_detail?: PayrollPersonDetail | null;
}

export interface UserSalaryHistoryListParams extends ListParams {
	user: number;
}
