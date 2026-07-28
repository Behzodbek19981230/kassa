import type { ListParams } from '@/services/api/types';

export interface MyDebtCompanyDetail {
	id: number;
	name: string;
	logo: string | null;
}

export interface MyDebtConsignorDetail {
	id: number;
	created_time: string;
	updated_time: string;
	name: string;
	phone: string;
	address: string;
	created_by: number;
	updated_by: number | null;
}

export interface MyDebtUserDetail {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
}

export interface MyDebtItem {
	id: number;
	company_detail: MyDebtCompanyDetail;
	consignor_detail: MyDebtConsignorDetail;
	created_by_detail: MyDebtUserDetail | null;
	updated_by_detail: MyDebtUserDetail | null;
	created_time: string;
	updated_time: string;
	cr_date: string;
	total_debt: string;
	created_by: number;
	updated_by: number | null;
	company: number;
	consignor: number;
}

export interface MyDebtListParams extends ListParams {
	consignor?: number;
	created_by?: number;
}

export interface MyDebtPayload {
	company: number;
	consignor: number;
	total_debt: number;
	cr_date: string;
}

export interface MyDebtPayPayload {
	company: number;
	consignor: number;
	date: string;
	all_summ_dollar?: number;
	discount_amount?: number;
	text?: string;
}

export interface MyDebtPaySummary {
	consignor: number;
	old_my_total_debt: string;
	paid_amount: string;
	discount_amount: string;
	my_total_debt: string;
}

export interface MyDebtPayResultDebt {
	id: number;
	company: number;
	cr_date: string;
	total_debt: string;
	consignor: number;
}

export interface MyDebtPayResultHistory {
	id: number;
	company: number;
	cr_date: string;
	cr_date_time: string;
	total_debt: string;
	discount_amount: string;
	my_total_debt: number;
	exchange_rate: string;
	all_summ_dollar: string;
}

export interface MyDebtPayResponse {
	my_total_debt: MyDebtPayResultDebt;
	my_total_debt_history: MyDebtPayResultHistory;
	summary: MyDebtPaySummary;
}
