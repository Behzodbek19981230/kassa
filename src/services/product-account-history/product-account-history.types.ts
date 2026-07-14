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
