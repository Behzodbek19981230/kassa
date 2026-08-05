import type { ListParams } from '@/services/api/types';
import type {
	WarehouseBrandDetail,
	WarehouseProductCategoryDetail,
	WarehouseSkladTypeDetail,
	WarehouseTypeDetail,
} from '@/services/warehouse/warehouse.types';

export type TransferMode = 'same' | 'spread';

export type WarehouseTransferStatus = 'completed' | 'reversed' | 'reverse';

export interface ValidateTransferItemPayload {
	from_type_sklad_id: number;
	to_type_sklad_id: number;
	source_warehouse_id: number;
	target_warehouse_id: number;
	mode: TransferMode;
	source_quantity: number;
	target_quantity: number;
}

export interface ValidateTransferItemResponse {
	success: boolean;
	message: string;
	source_available: number;
	source_warehouse_id: number;
	target_warehouse_id: number;
}

export interface WarehouseTransferItemPayload {
	source_warehouse_id: number;
	target_warehouse_id: number;
	mode: TransferMode;
	source_quantity: number;
	target_quantity: number;
}

export interface WarehouseTransferCreatePayload {
	from_type_sklad_id: number;
	to_type_sklad_id: number;
	items: WarehouseTransferItemPayload[];
	note?: string;
}

export interface WarehouseTransferUserDetail {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
}

export interface WarehouseTransfer {
	id: number;
	created_time: string;
	from_type_sklad: number;
	from_type_sklad_detail?: WarehouseSkladTypeDetail | null;
	to_type_sklad: number;
	to_type_sklad_detail?: WarehouseSkladTypeDetail | null;
	items_count: number;
	created_by?: number | null;
	created_by_detail?: WarehouseTransferUserDetail | null;
	status: WarehouseTransferStatus;
	note?: string | null;
	is_confirmed?: boolean;
	confirmed_by?: number | null;
	confirmed_by_detail?: WarehouseTransferUserDetail | null;
	confirmed_at?: string | null;
	confirmation_note?: string | null;
}

export interface WarehouseTransferConfirmationPayload {
	is_confirmed: boolean;
	confirmation_note?: string;
}

export interface WarehouseTransferWarehouseDetail {
	id: number;
	brand: number;
	brand_detail?: WarehouseBrandDetail | null;
	product_category: number;
	product_category_detail?: WarehouseProductCategoryDetail | null;
	size: number;
	type: number;
	type_detail?: WarehouseTypeDetail | null;
	type_sklad: number;
	type_sklad_detail?: WarehouseSkladTypeDetail | null;
}

export interface WarehouseTransferSnapshot {
	warehouse_id: number;
	company_id: number;
	brand_id: number;
	brand_name: string;
	product_category_id: number;
	product_category_name: string;
	size: number;
	type_id: number;
	type_name: string;
	type_sklad_id: number;
	type_sklad_name: string;
	count_before: number;
	count_after: number;
}

export interface WarehouseTransferItemDetail {
	id: number;
	source_warehouse: number;
	source_warehouse_detail?: WarehouseTransferWarehouseDetail | null;
	target_warehouse: number;
	target_warehouse_detail?: WarehouseTransferWarehouseDetail | null;
	mode: TransferMode;
	source_quantity: number;
	target_quantity: number;
	source_snapshot: WarehouseTransferSnapshot;
	target_snapshot: WarehouseTransferSnapshot;
}

export interface WarehouseTransferDetail extends WarehouseTransfer {
	items: WarehouseTransferItemDetail[];
}

export interface WarehouseTransferListParams extends ListParams {
	from_type_sklad?: number;
	to_type_sklad?: number;
	status?: WarehouseTransferStatus;
	date_from?: string;
	date_to?: string;
}

export interface WarehouseTransferDispatchRef {
	id: number;
	name: string;
}

export interface WarehouseTransferDispatchItem {
	type_sklad: WarehouseTransferDispatchRef;
	brand: WarehouseTransferDispatchRef;
	product_category: WarehouseTransferDispatchRef;
	transfer_quantity: number;
	type: WarehouseTransferDispatchRef;
	quantity_label: string;
}

export interface WarehouseTransferDispatchList {
	id: number;
	from_type_sklad: WarehouseTransferDispatchRef;
	to_type_sklad: WarehouseTransferDispatchRef;
	status: WarehouseTransferStatus;
	items_count: number;
	items: WarehouseTransferDispatchItem[];
}
