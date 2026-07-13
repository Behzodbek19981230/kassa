import type { ListParams } from '@/services/api/types';

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

export interface VozvratOrderCompanyDetail {
	id: number;
	name: string;
	logo: string | null;
}

export interface VozvratOrderClientDetail {
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

export interface VozvratOrderUserDetail {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
}

export interface VozvratOrderListItem {
	id: number;
	company_detail: VozvratOrderCompanyDetail;
	client_detail: VozvratOrderClientDetail;
	created_by_detail: VozvratOrderUserDetail | null;
	updated_by_detail: VozvratOrderUserDetail | null;
	created_time: string;
	updated_time: string;
	date: string;
	exchange_rate: string;
	discount_amount: string | null;
	sum_som: string;
	sum_dollar: string;
	sum_cart: string;
	product_summ_dollar: string;
	all_summ_dollar: string;
	old_total_debt: string;
	total_debt: string;
	confirmation: boolean;
	cr_date_time: string;
	large_price: number;
	is_delete: number;
	comment: string;
	update_status: number | null;
	created_by: number;
	updated_by: number | null;
	company: number;
	client: number;
}

export interface VozvratOrderListParams extends ListParams {
	company?: number;
	client?: number;
	created_by?: number;
	date?: string;
}
