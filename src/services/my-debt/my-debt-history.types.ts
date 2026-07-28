import type { ListParams, PaginationMeta } from '@/services/api/types';
import type { MyDebtCompanyDetail, MyDebtItem, MyDebtUserDetail } from '@/services/my-debt/my-debt.types';

export interface MyDebtHistoryItem {
	id: number;
	company_detail: MyDebtCompanyDetail;
	my_total_debt_detail: MyDebtItem;
	created_by_detail: MyDebtUserDetail | null;
	updated_by_detail: MyDebtUserDetail | null;
	created_time: string;
	updated_time: string;
	cr_date: string;
	total_debt: string;
	discount_amount: string;
	exchange_rate: string;
	all_summ_dollar: string;
	created_by: number;
	updated_by: number | null;
	company: number;
	my_total_debt: number;
}

export interface MyDebtHistoryListParams extends ListParams {
	my_total_debt?: number;
}

export interface MyDebtHistoryGroupedConsignor {
	id: number;
	name: string;
}

export interface MyDebtHistoryGroupedDebtDetail {
	id: number;
	total_debt: string;
	consignor: number;
	consignor_name: string;
}

export interface MyDebtHistoryGroupedItem {
	id: number;
	company: number;
	my_total_debt: number;
	cr_date: string;
	cr_date_time: string;
	datetime_label: string;
	date: string;
	date_label: string;
	total_debt: string;
	discount_amount: string;
	remaining_debt: string;
	all_summ_dollar: string;
	consignor: MyDebtHistoryGroupedConsignor;
	my_total_debt_detail: MyDebtHistoryGroupedDebtDetail;
	created_by: number;
	created_by_name: string;
}

export interface MyDebtHistoryGroup {
	date: string;
	date_label: string;
	count: number;
	items: MyDebtHistoryGroupedItem[];
}

export interface MyDebtHistoryGroupedResults {
	groups: MyDebtHistoryGroup[];
}

export interface MyDebtHistoryGroupedFilters {
	company: number | null;
	my_total_debt: number | null;
	consignor: number | null;
	start_date: string | null;
	end_date: string | null;
	search: string | null;
}

export interface MyDebtHistoryGroupedResponse {
	pagination: PaginationMeta;
	filters: MyDebtHistoryGroupedFilters;
	results: MyDebtHistoryGroupedResults;
}

export interface MyDebtHistoryGroupedListParams extends ListParams {
	start_date?: string;
	end_date?: string;
	consignor?: number;
	my_total_debt?: number;
}
