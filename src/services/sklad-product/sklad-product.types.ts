import type { ListParams } from '@/services/api/types';

interface SkladProductRefDetail {
	id: number;
	name: string;
}

// The product card a stock row belongs to. Names are optional: the backend may send only ids.
export interface SkladProductWarehouseDetail {
	id: number;
	brand: number;
	product_category: number;
	size: string | number;
	type: number | null;
	brand_detail?: SkladProductRefDetail | null;
	product_category_detail?: SkladProductRefDetail | null;
	type_detail?: SkladProductRefDetail | null;
}

// One product's stock and price in one sklad; `warehouse` + `type_sklad` is unique.
export interface SkladProduct {
	id: number;
	company: number;
	warehouse: number;
	type_sklad: number;
	count: number;
	real_price: string | null;
	worker_price: string | null;
	cr_date: string | null;
	status_count: boolean | null;
	created_by: number | null;
	updated_by: number | null;
	created_time: string;
	updated_time: string;
	warehouse_detail?: SkladProductWarehouseDetail | null;
	type_sklad_detail?: SkladProductRefDetail | null;
}

// `company` and the audit fields are set by the backend.
export interface SkladProductPayload {
	warehouse: number;
	type_sklad: number;
	count?: number;
	real_price?: string | number | null;
	worker_price?: string | number | null;
	cr_date?: string | null;
	status_count?: boolean | null;
}

export interface SkladProductListParams extends ListParams {
	warehouse?: number;
	type_sklad?: number;
	count?: number;
	status_count?: boolean;
	cr_date?: string;
	is_active?: boolean;
}
