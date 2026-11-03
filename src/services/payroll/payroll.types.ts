import type { ListParams, PaginationMeta } from '@/services/api/types';

/** Money values travel as strings, e.g. `"500.00"`. */
export type Money = string;

export type SalaryPeriodStatus = 'OPEN' | 'PARTIAL' | 'PAID' | 'CLOSED';

export type SalaryAdjustmentType = 'PENALTY' | 'BONUS' | 'ADDITION' | 'CORRECTION';

/** Lists may answer `{ results, pagination }` (project standard) or DRF-style `{ count, results }`. */
export interface PayrollListResponse<T> {
	results: T[];
	pagination?: PaginationMeta;
	count?: number;
	next?: string | null;
	previous?: string | null;
}

export interface PayrollUserBrief {
	id: number;
	username?: string;
	first_name: string;
	last_name: string;
	oylik_dollar: Money;
	oylik_som: Money;
	avatar?: string | null;
}

export interface SalaryPeriod {
	id: number;
	user: number;
	year: number;
	month: number;
	base_oylik_dollar?: Money;
	base_oylik_som?: Money;
	payable_dollar: Money;
	payable_som: Money;
	paid_dollar: Money;
	paid_som: Money;
	paid_card: Money;
	remaining_dollar: Money;
	remaining_som: Money;
	status: SalaryPeriodStatus;
}

/** `GET /payroll/dashboard/` row. `period` is null until the first payment/adjustment of the month. */
export interface PayrollDashboardRow {
	user: PayrollUserBrief;
	period: SalaryPeriod | null;
}

export interface PayrollDashboardSummary {
	total?: number;
	open?: number;
	partial?: number;
	paid?: number;
	closed?: number;
}

export interface PayrollDashboardResponse extends PayrollListResponse<PayrollDashboardRow> {
	summary?: PayrollDashboardSummary;
}

export interface PayrollDashboardParams {
	year: number;
	month: number;
	page?: number;
	page_size?: number;
	search?: string;
}

export interface SalaryPeriodListParams extends ListParams {
	user?: number;
	year?: number;
	month?: number;
}

export interface PayrollCreatorDetail {
	id: number;
	username?: string;
	first_name?: string;
	last_name?: string;
}

export interface SalaryPayment {
	id: number;
	user: number;
	period: number;
	year?: number;
	month?: number;
	summa_dollar: Money;
	summa_som: Money;
	summa_karta: Money;
	payment_date: string;
	note: string | null;
	payment_key?: string;
	created_time?: string;
	created_by?: number | null;
	created_by_detail?: PayrollCreatorDetail | null;
}

export interface SalaryPaymentPayload {
	user: number;
	year: number;
	month: number;
	summa_dollar: Money;
	summa_som: Money;
	summa_karta: Money;
	/** YYYY-MM-DD */
	payment_date: string;
	note: string;
	payment_key: string;
}

export interface SalaryPaymentResponse extends Partial<SalaryPayment> {
	salary_period?: SalaryPeriod;
}

export interface SalaryPaymentListParams extends ListParams {
	period?: number;
	user?: number;
}

export interface SalaryAdjustment {
	id: number;
	user: number;
	period: number;
	year?: number;
	month?: number;
	adjustment_type: SalaryAdjustmentType;
	summa_dollar: Money;
	summa_som: Money;
	reason: string;
	adjustment_date: string;
	adjustment_key?: string;
	created_time?: string;
	created_by?: number | null;
	created_by_detail?: PayrollCreatorDetail | null;
	user_detail?: PayrollCreatorDetail | null;
	period_detail?: Pick<SalaryPeriod, 'id' | 'year' | 'month'> | null;
}

export interface SalaryAdjustmentPayload {
	user: number;
	year: number;
	month: number;
	adjustment_type: SalaryAdjustmentType;
	summa_dollar: Money;
	summa_som: Money;
	reason: string;
	/** YYYY-MM-DD */
	adjustment_date: string;
	adjustment_key: string;
}

export interface SalaryAdjustmentResponse extends Partial<SalaryAdjustment> {
	salary_period?: SalaryPeriod;
}

export interface SalaryAdjustmentListParams extends ListParams {
	period?: number;
	user?: number;
}

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
	created_by_detail?: PayrollCreatorDetail | null;
}

export interface UserSalaryHistoryListParams extends ListParams {
	user?: number;
}
