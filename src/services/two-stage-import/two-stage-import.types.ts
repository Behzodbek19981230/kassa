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

export interface ChinaProductsParams {
	brand?: number;
	product_category?: number;
	type?: number;
	type_sklad?: number;
	size?: string;
	page?: number;
	limit?: number;
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

/** One row of `design/orders/`. Shape taken from the live response; nested `*_detail` objects carry the names. */
export interface ImportOrderListItem {
	id: number;
	order_number: string;
	stage: ImportStage;
	status: ImportOrderStatus;
	order_datetime?: string | null;
	consignor?: number | null;
	consignor_detail?: { id: number; name: string } | null;
	carrier_logistics?: number | null;
	carrier_logistics_detail?: { id: number; name: string } | null;
	source_logistics_warehouse?: number | null;
	source_logistics_warehouse_detail?: LogisticsWarehouseDetail | null;
	destination_logistics_warehouse?: number | null;
	destination_logistics_warehouse_detail?: LogisticsWarehouseDetail | null;
	destination_type_sklad?: number | null;
	destination_type_sklad_detail?: { id: number; name: string } | null;
	truck_number?: string | null;
	driver_phone?: string | null;
	total_quantity?: number | null;
	total_yuan?: string | null;
	total_dollar?: string | null;
	weight_kg?: string | null;
	volume_m3?: string | null;
	note?: string | null;
	two_stage_import_detail?: {
		id: number;
		import_number: string;
		import_flow: string;
		status: string;
		total_quantity: number;
		total_dollar: string;
	} | null;
}

interface LogisticsWarehouseDetail {
	id: number;
	name: string;
	country?: number | null;
	logistics_company?: number | null;
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
	company_detail?: { id: number; name: string } | null;
	logistics_warehouse_detail?: { id: number; name: string; country?: number | null; logistics_company?: number | null } | null;
	warehouse_detail?: {
		id: number;
		size: string;
		count: number;
		cr_date: string;
		real_price: string;
		brand: number | null;
		product_category: number | null;
		type: number | null;
		type_sklad: number | null;
	} | null;
}
