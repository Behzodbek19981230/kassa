export type ImportStage = 'CHINA_TO_TRANSIT' | 'TRANSIT_TO_UZBEKISTAN';

export type ImportOrderStatus = 'DRAFT' | 'IN_ROAD' | 'ARRIVED' | 'RECEIVED' | 'CANCELLED';

export interface ImportCart {
	id: number;
	company: number;
	user: number;
	stage: ImportStage;
	consignor: number | null;
	source_logistics_warehouse: number | null;
	two_stage_import: number | null;
	dispatch_datetime: string;
	is_active: boolean;
}

export interface ImportCartItem {
	id: number;
	cart: number;
	warehouse: number | null;
	import_warehouse: number | null;
	type_quantity: string;
	quantity: number;
	unit_price_yuan: string;
	unit_price_dollar: string;
	total_yuan: string;
	total_dollar: string;
}

export interface ImportCartSummary {
	total_quantity: number;
	total_yuan: string;
	total_dollar: string;
}

export interface ImportCartResponse {
	cart: ImportCart | null;
	items: ImportCartItem[];
	summary: ImportCartSummary;
}

/** Warehouse row returned by `design/china-products/` (names are resolved from the warehouse catalog). */
export interface ChinaProduct {
	id: number;
	brand: number;
	product_category: number;
	type_sklad: number | null;
	size: string;
	count: number;
	real_price: string;
	type: number | null;
}

export interface ChinaProductsParams {
	brand?: number;
	product_category?: number;
	type?: number;
	type_sklad?: number;
	size?: string;
}

export interface ChinaCartItemPayload {
	stage: 'CHINA_TO_TRANSIT';
	consignor: number;
	dispatch_datetime: string;
	warehouse: number;
	type_quantity: string;
	quantity: number;
	unit_price_yuan: string;
	unit_price_dollar: string;
}

export interface UzbekistanCartItemPayload {
	stage: 'TRANSIT_TO_UZBEKISTAN';
	source_logistics_warehouse: number;
	dispatch_datetime: string;
	import_warehouse: number;
	quantity: number;
}

export type CartItemPayload = ChinaCartItemPayload | UzbekistanCartItemPayload;

export interface ChinaDispatchPayload {
	cart: number;
	exchange_rate: string;
	carrier_logistics: number;
	destination_logistics_warehouse: number;
	truck_number: string;
	weight_kg: string;
	volume_m3: string;
	service_price_yuan: string;
	service_price_dollar: string;
	note?: string;
}

export interface ImportSummary {
	id: number;
	import_number: string;
	status: string;
	total_quantity: number;
	total_yuan: string;
	total_dollar: string;
}

export interface OrderSummary {
	id: number;
	order_number: string;
	stage: ImportStage;
	status: ImportOrderStatus;
}

export interface ChinaDispatchResponse {
	import: ImportSummary;
	order: OrderSummary;
}

export interface UzbekistanDispatchPayload {
	cart: number;
	carrier_logistics: number;
	destination_type_sklad: number;
	truck_number: string;
	driver_phone: string;
	weight_kg: string;
	volume_m3: string;
	service_price_yuan: string;
	service_price_dollar: string;
	note?: string;
}

export interface TransitArrivalPayload {
	arrival_date: string;
	paid_yuan: string;
	paid_dollar: string;
	note?: string;
}

export interface LocalReceiptPayload {
	receipt_date: string;
	received_by: number;
	paid_yuan: string;
	paid_dollar: string;
	note?: string;
}

export interface CancelOrderPayload {
	note?: string;
}

/**
 * The guide does not document the fields of `ImportOrderListSerializer`. `id`, `order_number`,
 * `stage` and `status` come from the documented responses; every other field is assumed from the
 * design columns. Verify the names against the backend before relying on them.
 */
export interface ImportOrderListItem {
	id: number;
	order_number: string;
	stage: ImportStage;
	status: ImportOrderStatus;
	import_number?: string | null;
	dispatch_datetime?: string | null;
	consignor_name?: string | null;
	source_name?: string | null;
	destination_name?: string | null;
	destination_type_sklad_name?: string | null;
	total_quantity?: number | null;
	total_dollar?: string | null;
	truck_number?: string | null;
	driver_phone?: string | null;
}

export interface ImportOrderListParams {
	stage?: ImportStage;
	status?: ImportOrderStatus;
	consignor?: number;
	source_logistics_warehouse?: number;
	destination_logistics_warehouse?: number;
}

export interface TransitStockItem {
	id: number;
	company: number;
	logistics_warehouse: number;
	warehouse: number;
	quantity: number;
	reserved_quantity: number;
	available_quantity: number;
	current_type_quantity: string;
	current_price_yuan: string;
	current_price_dollar: string;
	last_arrival_at: string | null;
}
