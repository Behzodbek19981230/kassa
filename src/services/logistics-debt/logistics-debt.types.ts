import type { ListParams } from '@/services/api/types';

/*
 * The route-order docs only show `logistics_debt: { id, logistics_company, total_debt }`. Everything else
 * here mirrors MyTotalDebt / MyTotalDebtHistory (same backend conventions) and is optional until confirmed.
 */

export interface LogisticsDebtUserDetail {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
}

export interface LogisticsDebtItem {
	id: number;
	logistics_company: number;
	logistics_company_detail?: { id: number; name: string } | null;
	/** Owed to the logistics company, in dollars (decimal string). */
	total_debt: string;
	company?: number;
	cr_date?: string;
	created_time?: string;
	updated_time?: string;
	created_by_detail?: LogisticsDebtUserDetail | null;
	updated_by_detail?: LogisticsDebtUserDetail | null;
}

export interface LogisticsDebtListParams extends ListParams {
	logistics_company?: number;
}

export interface LogisticsDebtHistoryItem {
	id: number;
	logistics_debt: number;
	logistics_debt_detail?: LogisticsDebtItem | null;
	cr_date?: string;
	created_time: string;
	/** Debt change recorded by this entry ($). */
	total_debt?: string | null;
	/** Amount paid with this entry ($). */
	all_summ_dollar?: string | null;
	discount_amount?: string | null;
	created_by_detail?: LogisticsDebtUserDetail | null;
}

export interface LogisticsDebtHistoryListParams extends ListParams {
	logistics_debt?: number;
	logistics_company?: number;
}

/**
 * `POST /logistics-debt/payment/` — like the consignor payment: the dollar debt goes down by
 * `all_summ_dollar + discount_amount`; `paid_yuan` is only recorded (the backend converts nothing).
 */
export interface LogisticsDebtYuanPaymentPayload {
	logistics_company: number;
	/** YYYY-MM-DD */
	date: string;
	paid_yuan: string;
	all_summ_dollar: string;
	discount_amount: string;
	note?: string;
}

export interface LogisticsDebtYuanPaymentResponse {
	logistics_debt: { id: number; logistics_company: number; total_debt: string; paid_yuan: string };
	summary: {
		logistics_company: number;
		old_logistics_debt: string;
		paid_amount: string;
		paid_yuan: string;
		discount_amount: string;
		logistics_debt: string;
	};
}
