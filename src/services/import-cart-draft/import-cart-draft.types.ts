import type { ListParams } from '@/services/api/types';

export interface ImportCartDraftWarehouseDetail {
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

export interface ImportCartDraftItem {
	id: number;
	company: number;
	consignor: number;
	warehouse: number;
	count: number;
	price_dollar: string;
	price_som: string;
	total_price_dollar: string;
	total_price_som: string;
	is_active: boolean;
	warehouse_detail?: ImportCartDraftWarehouseDetail | null;
}

export interface ImportCartDraftPayload {
	company: number;
	consignor: number;
	warehouse: number;
	count: number;
	price_dollar: string | number;
	price_som: string | number;
	is_active?: boolean;
}

export interface ImportCartDraftListParams extends ListParams {
	consignor?: number;
	is_active?: boolean;
}

export interface ClearImportCartPayload {
	company: number;
	consignor: number;
}

export interface ClearImportCartResponse {
	deleted_count: number;
}

export interface ConfirmImportPayload {
	company: number;
	consignor: number;
	date: string;
	exchange_rate: string | number;
	given_sum_dollar: string | number;
	sum_dollar: string | number;
	sum_som: string | number;
	discount_amount: string | number;
	car_number?: string;
	comment?: string;
}

export type ConfirmImportResponse = Record<string, unknown>;
