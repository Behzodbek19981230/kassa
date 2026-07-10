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
	consignor: number;
	warehouse: number;
	count: number;
	price: string;
	total_price: string;
	is_active: boolean;
	warehouse_detail?: ImportCartDraftWarehouseDetail | null;
}

export interface ImportCartDraftPayload {
	consignor: number;
	warehouse: number;
	count: number;
	price: string | number;
	is_active?: boolean;
}

export interface ImportCartDraftListParams extends ListParams {
	consignor?: number;
	is_active?: boolean;
}
