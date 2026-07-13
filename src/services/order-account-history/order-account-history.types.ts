import type { ListParams, PaginationMeta } from '@/services/api/types';

export interface OrderAccountHistoryCompanyDetail {
	id: number;
	name: string;
	logo: string | null;
}

export interface OrderAccountHistoryClientDetail {
	id: number;
	created_time: string;
	updated_time: string;
	fio: string;
	phone: string;
	address: string;
	total_debt: string;
	keshbek: string;
	is_worker: number;
	is_partner: number;
	is_profit_loss: number;
	type: string;
	created_by: number;
	updated_by: number;
	company: number;
	region: number;
	district: number;
	worker_user: number | null;
}

export interface OrderAccountHistoryUserDetail {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
}

export interface OrderAccountHistoryItem {
	id: number;
	company_detail: OrderAccountHistoryCompanyDetail;
	client_detail: OrderAccountHistoryClientDetail;
	created_by_detail: OrderAccountHistoryUserDetail | null;
	updated_by_detail: OrderAccountHistoryUserDetail | null;
	created_time: string;
	updated_time: string;
	date: string;
	exchange_rate: string;
	discount_amount: string;
	all_summ_dollar: string;
	all_profit_dollar: string;
	total_debt: string;
	date_last_debt_payment: string | null;
	number_of_orders: string;
	last_order_date: string;
	sum_som: string;
	sum_dollar: string;
	sum_cart: string;
	sum_transfers: string;
	cr_date: string;
	all_product_sum: string;
	cr_date_time: string;
	total_debt_old: string;
	dollar_sumda: string;
	order_account_status: boolean;
	total_debt_today: string;
	update_status: number;
	status_order_dukon: number;
	status_order_sklad: number;
	order_commit: string;
	is_debt: number;
	is_delete: number;
	is_worker: number;
	large_price: number;
	driver_info: string;
	fast_order: number;
	is_debtor: number;
	zdacha_sum: string;
	zdacha_dollar: string;
	is_sent: number;
	is_vozvrat: boolean | null;
	created_by: number;
	updated_by: number | null;
	company: number;
	client: number;
}

export interface OrderAccountHistoryListParams extends ListParams {
	company?: number;
	client?: number;
	created_by?: number;
	is_vozvrat?: boolean;
	date?: string;
}

export interface OrderAccountHistoryGroup {
	date: string;
	date_label: string;
	count: number;
	totals: Record<string, unknown>;
	items: OrderAccountHistoryItem[];
}

export interface OrderAccountHistoryGroupedResults {
	group_count: number;
	groups: OrderAccountHistoryGroup[];
}

export interface OrderAccountHistoryGroupedFilters {
	date: string | null;
	start_date: string | null;
	end_date: string | null;
	client: number | null;
	created_by: number | null;
	is_vozvrat: boolean | null;
	company: number | null;
	search: string | null;
	order_account_status: boolean | null;
}

export interface OrderAccountHistoryGroupedResponse {
	pagination: PaginationMeta;
	results: OrderAccountHistoryGroupedResults;
	filters: OrderAccountHistoryGroupedFilters;
}

export interface OrderAccountHistoryGroupedListParams extends ListParams {
	company?: number;
	client?: number;
	created_by?: number;
	is_vozvrat?: boolean;
	date?: string;
	start_date?: string;
	end_date?: string;
	order_account_status?: boolean;
}
