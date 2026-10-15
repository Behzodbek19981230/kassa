export interface ProductAccountHistoryUpdateCountPayload {
	given_count: number;
}

export interface ProductAccountHistoryCreatePayload {
	order_account_history: number;
	warehouse: number;
	count: number;
	price: string | number;
}

export interface ProductAccountHistoryItem {
	id: number;
	order_account_history: number;
	warehouse: number;
	count: number;
	given_count: number;
	price: string;
}

export interface ProductAccountHistoryUpdateCountProduct {
	id: number;
	order_account_history: number;
	count: number;
	given_count: number;
}

export interface ProductAccountHistoryUpdateCountOrder {
	id: number;
	is_debtor: number;
	debtor_products_count: number;
}

export interface ProductAccountHistoryUpdateCountResponse {
	success: boolean;
	message: string;
	product: ProductAccountHistoryUpdateCountProduct;
	order: ProductAccountHistoryUpdateCountOrder;
}

export interface ProductAccountHistoryListParams {
	order_account_history?: number;
	page?: number;
	limit?: number;
}

/** A sold line as the list endpoint returns it; only the fields the edit form reads are typed. */
export interface ProductAccountHistoryLine extends ProductAccountHistoryItem {
	brand: number;
	product_category: number;
	type: number | null;
	type_sklad: number | null;
	size: string;
	sklad_product: number | null;
	brand_detail?: { id: number; name: string } | null;
	product_category_detail?: { id: number; name: string } | null;
	type_detail?: { id: number; name: string } | null;
	type_sklad_detail?: { id: number; name: string } | null;
}
