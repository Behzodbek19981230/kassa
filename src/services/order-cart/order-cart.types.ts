import type { ListParams, PaginationMeta } from '@/services/api/types';

export interface OrderCartWarehouseDetail {
	id: number;
	brand_id?: number;
	brand_name?: string;
	product_category_id?: number;
	product_category_name?: string;
	size?: number;
	type_id?: number | null;
	type_name?: string | null;
	type_sklad_id?: number | null;
	type_sklad_name?: string | null;
}

export interface OrderCartItem {
	id: number;
	client: number;
	warehouse: number;
	count: number;
	price: string;
	total_price: string;
	is_active: boolean;
	warehouse_detail?: OrderCartWarehouseDetail | null;
}

export interface OrderCartPayload {
	client: number;
	warehouse: number;
	count: number;
	price: string | number;
	is_active?: boolean;
}

export interface OrderCartListParams extends ListParams {
	client?: number;
	is_active?: boolean;
}

export interface OrderCartGroupedListParams extends ListParams {
	company?: number;
	user?: number;
	client?: number;
	is_active?: boolean;
}

export interface OrderCartGroupClient {
	id: number;
	fio: string;
}

export interface OrderCartGroup {
	client: OrderCartGroupClient;
	client_id: number;
	client_fio: string;
	created_time: string;
	items: OrderCartItem[];
}

export interface OrderCartGroupedResults {
	group_count: number;
	groups: OrderCartGroup[];
}

export interface OrderCartGroupedResponse {
	pagination: PaginationMeta;
	results: OrderCartGroupedResults;
}

export interface ClearOrderCartPayload {
	company: number;
	client: number;
}

export interface ClearOrderCartResponse {
	deleted_count: number;
}

export interface ConfirmSalePayload {
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
	comment?: string;
	order_account_status: boolean;
	fast_order: boolean;
}

export interface ConfirmSaleSummary {
	old_debt: string;
	all_product_sum: string;
	all_profit_dollar: string;
	total_debt_today: string;
	total_debt: string;
	product_count: number;
	line_count: number;
	large_price: number;
}

export interface ConfirmSaleResponse {
	order_account_history: { id: number };
	summary: ConfirmSaleSummary;
}
