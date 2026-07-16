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
	client_name?: string;
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
	status_order_label?: string;
	is_price_diff: boolean;
}

export interface OrderAccountHistoryUpdatePayload {
	company: number;
	client: number;
	date: string;
	exchange_rate: string | number;
	discount_amount: string | number;
	all_summ_dollar: string | number;
	sum_dollar: string | number;
	sum_som: string | number;
	sum_cart: string | number;
	sum_transfers: string | number;
	zdacha_dollar: string | number;
	zdacha_sum: string | number;
	driver_info?: string;
	order_commit?: string;
	order_account_status: boolean;
	fast_order: boolean;
}

export interface OrderAccountHistoryUpdateSaleItemPayload {
	warehouse: number;
	count: number;
	price: string | number;
}

export interface OrderAccountHistoryUpdateSalePayload {
	date: string;
	exchange_rate: string | number;
	discount_amount: string | number;
	all_summ_dollar: string | number;
	sum_dollar: string | number;
	sum_som: string | number;
	sum_cart: string | number;
	sum_transfers: string | number;
	driver_info?: string;
	fast_order: boolean;
	order_account_status: boolean;
	comment?: string;
	items: OrderAccountHistoryUpdateSaleItemPayload[];
}

export interface OrderAccountHistoryUpdateSaleOrder {
	id: number;
	client: number;
	date: string;
	exchange_rate: string;
	all_product_sum: string;
	all_summ_dollar: string;
	discount_amount: string;
	total_debt_today: string;
	total_debt: string;
	update_status: number;
}

export interface OrderAccountHistoryUpdateSaleSummary {
	all_product_sum: string;
	total_debt_today: string;
	order_total_debt: string;
	client_total_debt: string;
	product_count: number;
	line_count: number;
	large_price: number;
}

export interface OrderAccountHistoryUpdateSaleResponse {
	success: boolean;
	message: string;
	order_account_history: OrderAccountHistoryUpdateSaleOrder;
	summary: OrderAccountHistoryUpdateSaleSummary;
}

export interface OrderAccountHistoryListParams extends ListParams {
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
	client?: number;
	created_by?: number;
	is_vozvrat?: boolean;
	is_debtor?: 1 | 0;
	date?: string;
	start_date?: string;
	end_date?: string;
	order_account_status?: boolean;
}

export interface OrderAccountHistoryProductsOrder {
	id: number;
	company: number;
	client: number;
	client_name: string;
	client_phone: string;
	created_by: number;
	created_by_name: string;
	date: string;
	date_label: string;
	cr_date_time: string;
	created_time_label: string;
	title: string;
}

export interface OrderAccountHistoryProductsReport {
	exchange_rate: number;
	all_product_sum: number;
	payable_amount: number;
	paid_amount: number;
	all_summ_dollar: number;
	sum_dollar: number;
	sum_som: number;
	sum_cart: number;
	sum_transfers: number;
	discount_amount: number;
	total_debt_old: number;
	total_debt_today: number;
	remaining_debt: number;
	total_debt: number;
	zdacha_sum: number;
	zdacha_dollar: number;
	all_profit_dollar: number;
}

export interface OrderAccountHistoryVozvratProductItem {
	id: number;
	vozvrat_order: number;
	vozvrat_order_date: string;
	vozvrat_order_date_label: string;
	source_order_account_history: number;
	source_product_account_history: number;
	warehouse: number;
	type_sklad: number;
	type_sklad_name: string;
	brand: number;
	brand_name: string;
	product_category: number;
	product_category_name: string;
	size: number;
	type: number;
	type_name: string;
	count: number;
	given_count: number;
	price: number;
	price_total: number;
	real_price: number;
	real_price_total: number;
	profit: number;
	profit_total: number;
	is_debtor: boolean;
	is_price_diff: boolean;
	old_count: number | null;
	vozvrat_summa: number;
	cr_date: string;
}

export interface OrderAccountHistoryProductItem {
	number: number;
	id: number;
	warehouse: number;
	type_sklad: number;
	type_sklad_name: string;
	brand: number;
	brand_name: string;
	product_category: number;
	product_category_name: string;
	size: number;
	type: number;
	type_name: string;
	count: number;
	given_count: number;
	vozvrat_count: number;
	remaining_after_vozvrat: number;
	price: number;
	price_total: number;
	real_price: number;
	real_price_total: number;
	profit: number;
	profit_total: number;
	is_debtor: boolean;
	is_price_diff: boolean;
	vozvrat_order: number | null;
	has_vozvrat: boolean;
	vozvrat_products: OrderAccountHistoryVozvratProductItem[];
	old_count: number | null;
	vozvrat_summa: number;
}

export interface OrderAccountHistoryProductGroupTotals {
	count: number;
	given_count: number;
	vozvrat_count: number;
	remaining_after_vozvrat: number;
	price_total: number;
	real_price_total: number;
	profit_total: number;
}

export interface OrderAccountHistoryProductGroup {
	brand_name: string;
	items: OrderAccountHistoryProductItem[];
	totals: OrderAccountHistoryProductGroupTotals;
}

export interface OrderAccountHistoryProducts {
	group_count: number;
	groups: OrderAccountHistoryProductGroup[];
	totals: OrderAccountHistoryProductGroupTotals;
}

export interface OrderAccountHistoryProductsActions {
	print_worker_url: string;
	print_sklad_url: string;
	print_client_url: string;
}

export interface OrderAccountHistoryProductsResponse {
	order: OrderAccountHistoryProductsOrder;
	report: OrderAccountHistoryProductsReport;
	products: OrderAccountHistoryProducts;
	actions: OrderAccountHistoryProductsActions;
}

export type OrderAndDebtRowType = 'order' | 'debt_repayment';

export interface OrderAndDebtRowStyle {
	type: string;
	color: string;
	background: string;
	title: string;
}

export interface OrderAndDebtItemActions {
	products_url?: string;
	print_worker_url?: string;
	print_sklad_url?: string;
	print_client_url?: string;
}

export interface OrderAndDebtItem {
	id: number;
	day_seq: number;
	row_type: OrderAndDebtRowType;
	action: string;
	sign: '+' | '-';
	datetime: string;
	datetime_label: string;
	date: string;
	date_label: string;
	client: number;
	client_name: string;
	created_by: number;
	created_by_name: string;
	created_by_type: number;
	created_by_type_name: string;
	all_product_sum: number;
	all_summ_dollar: number;
	sum_dollar: number;
	sum_cart: number;
	sum_som: number;
	paid_debt: number;
	debt_sum_transfers: number;
	debt_sum_som: number;
	debt_summ_cart: number;
	zdacha_sum: number;
	zdacha_dollar: number;
	total_debt: number;
	all_profit_dollar: number;
	order_account_status: boolean | null;
	update_status: number | null;
	status_order_dukon: number | null;
	status_order_sklad: number | null;
	is_sent: number;
	is_debt: number;
	is_debtor: number;
	fast_order: number;
	large_price: number;
	order_commit: string;
	row_style: OrderAndDebtRowStyle;
	actions: OrderAndDebtItemActions;
}

export interface OrderAndDebtTotals {
	all_product_sum: number;
	all_summ_dollar: number;
	sum_dollar: number;
	sum_cart: number;
	sum_som: number;
	paid_zdacha_sum: number;
	paid_zdacha_dollar: number;
	paid_debt: number;
	debt_sum_transfers: number;
	debt_sum_som: number;
	debt_summ_cart: number;
	debt_zdacha_sum: number;
	debt_zdacha_dollar: number;
	all_profit_dollar: number;
}

export interface OrderAndDebtGroup {
	date: string;
	date_label: string;
	items: OrderAndDebtItem[];
	totals: OrderAndDebtTotals;
}

export interface OrderAndDebtWorkerTypeEntry {
	created_by_type: number;
	created_by_type_name: string;
	items: OrderAndDebtItem[];
	totals: OrderAndDebtTotals;
}

export interface OrderAndDebtWorkerTypeGroup {
	date: string;
	date_label: string;
	types: OrderAndDebtWorkerTypeEntry[];
	totals: OrderAndDebtTotals;
}

export interface OrderAndDebtFilters {
	client: string | null;
	created_by: string | null;
	customer_name: string | null;
	user_type: string | null;
	start_date: string | null;
	end_date: string | null;
	active_tab: string | null;
}

export interface OrderAndDebtPdfActions {
	pdf1_url: string;
	pdf2_account_url: string;
	pdf3_worker_type_url: string;
}

export interface OrderAndDebtResults {
	items: OrderAndDebtItem[];
	groups: OrderAndDebtGroup[];
	worker_type_groups: OrderAndDebtWorkerTypeGroup[];
	totals: OrderAndDebtTotals;
}

export interface OrderAndDebtResponse {
	pagination: PaginationMeta;
	filters: OrderAndDebtFilters;
	pdf_actions: OrderAndDebtPdfActions;
	results: OrderAndDebtResults;
}

export interface OrderAndDebtListParams extends ListParams {
	client?: number;
	created_by?: number;
	user_type?: string;
	start_date?: string;
	end_date?: string;
	active_tab?: 'main' | 'worker';
}
