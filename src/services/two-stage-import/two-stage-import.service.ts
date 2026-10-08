import { apiClient } from '@/services/api/client';
import type {
	CancelOrderPayload,
	CartItemPayload,
	ChinaDispatchPayload,
	ChinaDispatchResponse,
	ChinaProduct,
	ChinaProductsParams,
	ImportCartResponse,
	ImportOrderListItem,
	ImportOrderListParams,
	ImportStage,
	LocalReceiptPayload,
	TransitArrivalPayload,
	TransitStockItem,
	UzbekistanDispatchPayload,
} from '@/services/two-stage-import/two-stage-import.types';

const BASE_PATH = '/design';

export const twoStageImportService = {
	getChinaProducts: async (params?: ChinaProductsParams) => {
		const { data } = await apiClient.get<ChinaProduct[]>(`${BASE_PATH}/china-products/`, { params });
		return data;
	},
	getCart: async (stage: ImportStage) => {
		const { data } = await apiClient.get<ImportCartResponse>(`${BASE_PATH}/cart/`, { params: { stage } });
		return data;
	},
	addCartItem: async (payload: CartItemPayload) => {
		const { data } = await apiClient.post<ImportCartResponse>(`${BASE_PATH}/cart/item/`, payload);
		return data;
	},
	chinaDispatch: async (payload: ChinaDispatchPayload) => {
		const { data } = await apiClient.post<ChinaDispatchResponse>(`${BASE_PATH}/china-dispatch/`, payload);
		return data;
	},
	getOrders: async (params?: ImportOrderListParams) => {
		const { data } = await apiClient.get<ImportOrderListItem[]>(`${BASE_PATH}/orders/`, { params });
		return data;
	},
	transitArrival: async (orderId: number, payload: TransitArrivalPayload) => {
		const { data } = await apiClient.post<ImportOrderListItem>(
			`${BASE_PATH}/order/${orderId}/transit-arrival/`,
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
			`${BASE_PATH}/order/${orderId}/local-receipt/`,
			payload,
		);
		return data;
	},
	cancelOrder: async (orderId: number, payload: CancelOrderPayload) => {
		const { data } = await apiClient.post<ImportOrderListItem>(`${BASE_PATH}/order/${orderId}/cancel/`, payload);
		return data;
	},
};
