import type { ListParams, PaginationMeta } from '@/services/api/types';

/** Audit row written by the backend when an order is hard-deleted. Kept for one calendar month. */
export interface OrderDeleteHistoryRow {
	id: number;
	original_order_id: number;
	company_id: number | null;
	client_id: number | null;
	client_name: string;
	client_phone: string;
	original_created_by_id: number | null;
	original_created_by_name: string;
	deleted_by_id: number | null;
	deleted_by_name: string;
	order_date: string | null;
	deleted_at: string;
	product_count: number;
}

/** Snapshot of the original order fields; decimals are serialized as strings and any of them may be null. */
export interface OrderDeleteOrderData {
	all_product_sum?: string | null;
	all_summ_dollar?: string | null;
	total_debt_old?: string | null;
	total_debt_today?: string | null;
	total_debt?: string | null;
	discount_amount?: string | null;
	order_commit?: string | null;
	[field: string]: unknown;
}

/** Snapshot of the original order product fields. */
export interface OrderDeleteProductData {
	size?: string | null;
	count?: number | null;
	given_count?: number | null;
	price?: string | null;
	[field: string]: unknown;
}

export interface OrderDeleteProduct {
	id: number;
	delete_history: number;
	original_product_id: number | null;
	brand_name: string;
	product_category_name: string;
	type_name: string;
	type_sklad_name: string;
	product_data: OrderDeleteProductData;
}

export interface OrderDeleteHistoryDetail extends OrderDeleteHistoryRow {
	order_data: OrderDeleteOrderData;
	products: OrderDeleteProduct[];
}

export interface OrderDeleteHistoryListResponse {
	pagination: PaginationMeta;
	results: OrderDeleteHistoryRow[];
	filters: null;
}

export interface OrderDeleteHistoryListParams extends ListParams {
	original_order_id?: number;
	client_id?: number;
}
