export interface VozvratClientSummary {
	id: number;
	fio: string;
	total_debt: number;
}

export interface VozvratProductItem {
	warehouse: number;
	brand: number;
	brand_name: string;
	product_category: number;
	product_category_name: string;
	size: number;
	type: number;
	type_name: string;
	type_sklad: number;
	type_sklad_name: string;
	remaining_count: number;
	price_dollar: number;
	price_som: number;
}

export interface VozvratProductGroup {
	brand: { id: number; name: string };
	items: VozvratProductItem[];
}

export interface VozvratProductsTotals {
	group_count: number;
	item_count: number;
	remaining_count: number;
}

export interface VozvratProductsResponse {
	client: VozvratClientSummary;
	exchange_rate: number;
	groups: VozvratProductGroup[];
	totals: VozvratProductsTotals;
}

export interface VozvratProductsParams {
	client_id: number;
	brand_id?: number;
	product_category_id?: number;
}

export interface VozvratCartItemInput {
	warehouse: number;
	brand: number;
	product_category: number;
	size: number;
	type: number;
	type_sklad: number;
	count: number;
	price: number;
}

export interface VozvratCalculatePayload {
	client: number;
	date: string;
	items: VozvratCartItemInput[];
}

export interface VozvratCalculateItem {
	number: number;
	warehouse: number;
	brand: number;
	product_category: number;
	size: number;
	type: number;
	type_sklad: number;
	count: number;
	price: number;
	price_dollar: number;
	price_som: number;
	total_price_dollar: number;
	total_price_som: number;
}

export interface VozvratCalculateTotals {
	count: number;
	total_product_sum: number;
	total_product_sum_som: number;
}

export interface VozvratCalculateResponse {
	exchange_rate: number;
	items: VozvratCalculateItem[];
	totals: VozvratCalculateTotals;
}

export interface VozvratConfirmPayload {
	company: number;
	client: number;
	date: string;
	all_summ_dollar: number;
	sum_dollar: number;
	sum_som: number;
	sum_cart: number;
	comment?: string;
	confirmation: boolean;
	items: VozvratCartItemInput[];
}

export interface VozvratOrderSummary {
	id: number;
	client: number;
	date: string;
	exchange_rate: number;
	product_summ_dollar: number;
	all_summ_dollar: number;
	sum_dollar: number;
	sum_som: number;
	sum_cart: number;
	old_total_debt: number;
	total_debt: number;
	confirmation: boolean;
	comment: string;
}

export interface VozvratConfirmSummary {
	old_total_debt: number;
	total_product_sum: number;
	total_product_sum_som: number;
	returned_amount: number;
	total_debt: number;
	count: number;
	line_count: number;
	large_price: number;
}

export interface VozvratConfirmResponse {
	success: boolean;
	message: string;
	vozvrat_order: VozvratOrderSummary;
	summary: VozvratConfirmSummary;
}
