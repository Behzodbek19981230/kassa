import { apiClient } from '@/services/api/client';
import type { ListResponse } from '@/services/api/list-page';
import type { PaginationMeta } from '@/services/api/types';
import type { WarehouseAllListBrandGroup } from '@/services/warehouse/warehouse.types';
import type {
	CancelOrderPayload,
	CartItemPayload,
	ChinaDispatchPayload,
	ChinaDispatchResponse,
	ChinaProductsParams,
	ImportCartResponse,
	ImportOrderListItem,
	ImportStage,
	RouteOrderEditPayload,
	RouteOrderEditResponse,
	RouteOrderListParams,
	ImportCart,
	ImportCartParams,
	LocalReceiptPayload,
	LogisticsPartnersParams,
	LogisticsPartnersResponse,
	OrderProductsParams,
	OrderProductsResponse,
	PartnerStockExportFormat,
	PartnerStockParams,
	PartnerStockResponse,
	PriceHistoryResponse,
	TransitArrivalPayload,
	TransitStockItem,
	UzbekistanDispatchPayload,
} from '@/services/two-stage-import/two-stage-import.types';

const BASE_PATH = '/design';

// Each route (stage) has its own order list / products / confirm endpoints.
const ROUTE_ORDERS_PATH: Record<ImportStage, string> = {
	CHINA_TO_TRANSIT: `${BASE_PATH}/china-transit-orders`,
	TRANSIT_TO_UZBEKISTAN: `${BASE_PATH}/transit-uzbekistan-orders`,
};

// The route lists answer with a plain array; pagination comes in X-* headers.
function paginationFromHeaders(headers: Record<string, unknown>): PaginationMeta {
	const num = (name: string) => Number(headers[name] ?? 0) || 0;
	return {
		currentPage: num('x-page') || 1,
		lastPage: num('x-total-pages') || 1,
		perPage: num('x-limit'),
		total: num('x-total-count'),
	};
}

export const twoStageImportService = {
	getChinaProducts: async (params?: ChinaProductsParams) => {
		const { data } = await apiClient.get<WarehouseAllListBrandGroup[] | ListResponse<WarehouseAllListBrandGroup>>(`${BASE_PATH}/china-products/`, {
			params,
		});
		return data;
	},
	getCart: async (params: ImportCartParams) => {
		const { data } = await apiClient.get<ImportCartResponse>(`${BASE_PATH}/cart/`, { params });
		return data;
	},
	addCartItem: async (payload: CartItemPayload) => {
		const { data } = await apiClient.post<ImportCartResponse>(`${BASE_PATH}/cart/item/`, payload);
		return data;
	},
	removeCartItem: async (id: number) => {
		await apiClient.delete(`${BASE_PATH}/cart/item-delete/${id}/`);
	},
	// The cart carries the dispatch time of the import it becomes; china-dispatch itself takes no date.
	updateCartDispatchDatetime: async (cartId: number, dispatchDatetime: string) => {
		const { data } = await apiClient.patch<ImportCart>(`/import-cart/${cartId}/`, { dispatch_datetime: dispatchDatetime });
		return data;
	},
	// Cleared by id so a different consignor's/destination's cart can't be wiped by mistake.
	clearCart: async (cartId: number) => {
		await apiClient.delete(`${BASE_PATH}/cart/clear/`, { data: { cart: cartId } });
	},
	chinaDispatch: async (payload: ChinaDispatchPayload) => {
		const { data } = await apiClient.post<ChinaDispatchResponse>(`${BASE_PATH}/china-dispatch/`, payload);
		return data;
	},
	getRouteOrders: async (stage: ImportStage, params?: RouteOrderListParams) => {
		const response = await apiClient.get<ImportOrderListItem[]>(`${ROUTE_ORDERS_PATH[stage]}/`, { params });
		return { results: response.data, pagination: paginationFromHeaders(response.headers) };
	},
	getRouteOrderEdit: async (stage: ImportStage, orderId: number) => {
		const { data } = await apiClient.get<RouteOrderEditResponse>(`${ROUTE_ORDERS_PATH[stage]}/${orderId}/edit/`);
		return data;
	},
	updateRouteOrder: async (stage: ImportStage, orderId: number, payload: RouteOrderEditPayload) => {
		const { data } = await apiClient.put<RouteOrderEditResponse>(`${ROUTE_ORDERS_PATH[stage]}/${orderId}/edit/`, payload);
		return data;
	},
	transitArrival: async (orderId: number, payload: TransitArrivalPayload) => {
		const { data } = await apiClient.post<ImportOrderListItem>(
			`${ROUTE_ORDERS_PATH.CHINA_TO_TRANSIT}/${orderId}/confirm/`,
			payload,
		);
		return data;
	},
	getTransitStock: async (logisticsWarehouse?: number) => {
		const { data } = await apiClient.get<TransitStockItem[]>(`${BASE_PATH}/transit-stock/`, {
			params: logisticsWarehouse ? { logistics_warehouse: logisticsWarehouse } : undefined,
		});
		return data;
	},
	getLogisticsPartners: async (params?: LogisticsPartnersParams) => {
		const { data } = await apiClient.get<LogisticsPartnersResponse>(`${BASE_PATH}/logistics-partners/`, { params });
		return data;
	},
	getPartnerStock: async (partnerId: number, params?: PartnerStockParams) => {
		const { data } = await apiClient.get<PartnerStockResponse>(`${BASE_PATH}/logistics-partners/${partnerId}/stock/`, {
			params,
		});
		return data;
	},
	getPartnerPriceHistory: async (partnerId: number, stockId: number, params?: { page?: number; limit?: number }) => {
		const { data } = await apiClient.get<PriceHistoryResponse>(
			`${BASE_PATH}/logistics-partners/${partnerId}/stock/${stockId}/price-history/`,
			{ params },
		);
		return data;
	},
	/** With `stage`, uses that route's products endpoint (404s for an order of the other route). */
	getOrderProducts: async (orderId: number, params?: OrderProductsParams, stage?: ImportStage) => {
		const url = stage ? `${ROUTE_ORDERS_PATH[stage]}/${orderId}/products/` : `${BASE_PATH}/order/${orderId}/products/`;
		const { data } = await apiClient.get<OrderProductsResponse>(url, { params });
		return data;
	},
	exportPartnerStock: async (
		partnerId: number,
		format: PartnerStockExportFormat,
		params?: Pick<PartnerStockParams, 'logistics_warehouse' | 'brand' | 'product_category'>,
	) => {
		const response = await apiClient.get<Blob>(`${BASE_PATH}/logistics-partners/${partnerId}/stock/export/${format}/`, {
			params,
			responseType: 'blob',
			timeout: 120_000,
		});
		return response.data;
	},
	uzbekistanDispatch: async (payload: UzbekistanDispatchPayload) => {
		const { data } = await apiClient.post<ImportOrderListItem>(`${BASE_PATH}/uzbekistan-dispatch/`, payload);
		return data;
	},
	getUzbekistanInRoad: async () => {
		const { data } = await apiClient.get<ImportOrderListItem[]>(`${BASE_PATH}/uzbekistan-in-road/`);
		return data;
	},
	localReceipt: async (orderId: number, payload: LocalReceiptPayload) => {
		const { data } = await apiClient.post<ImportOrderListItem>(
			`${ROUTE_ORDERS_PATH.TRANSIT_TO_UZBEKISTAN}/${orderId}/confirm/`,
			payload,
		);
		return data;
	},
	cancelOrder: async (orderId: number, payload: CancelOrderPayload) => {
		const { data } = await apiClient.post<ImportOrderListItem>(`${BASE_PATH}/order/${orderId}/cancel/`, payload);
		return data;
	},
	// Deleting lives on the generic import-order resource, not under BASE_PATH.
	deleteOrder: async (orderId: number) => {
		await apiClient.delete(`/import-order/${orderId}/`);
	},
};
