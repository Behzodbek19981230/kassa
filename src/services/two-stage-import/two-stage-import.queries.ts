import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseListPage } from '@/services/api/list-page';
import { mergeBrandGroups } from '@/services/warehouse/warehouse.service';
import { twoStageImportService } from '@/services/two-stage-import/two-stage-import.service';
import type {
	CancelOrderPayload,
	CartItemPayload,
	ChinaDispatchPayload,
	ChinaProductsParams,
	ImportOrderListParams,
	ImportStage,
	LocalReceiptPayload,
	LogisticsPartnersParams,
	OrderProductsParams,
	PartnerStockParams,
	TransitArrivalPayload,
	UzbekistanDispatchPayload,
} from '@/services/two-stage-import/two-stage-import.types';

const twoStageKeys = {
	all: ['two-stage-import'] as const,
	chinaProducts: (params?: ChinaProductsParams) => ['two-stage-import', 'china-products', params] as const,
	cart: (stage: ImportStage) => ['two-stage-import', 'cart', stage] as const,
	orders: (params?: ImportOrderListParams) => ['two-stage-import', 'orders', params] as const,
	transitStock: (logisticsWarehouse?: number) =>
		['two-stage-import', 'transit-stock', logisticsWarehouse ?? null] as const,
	uzbekistanInRoad: ['two-stage-import', 'uzbekistan-in-road'] as const,
};

const CHINA_PRODUCTS_PAGE_SIZE = 50;

export function useChinaProductsQuery(params?: ChinaProductsParams) {
	return useInfiniteQuery({
		queryKey: twoStageKeys.chinaProducts(params),
		queryFn: async ({ pageParam }) => {
			const data = await twoStageImportService.getChinaProducts({
				...params,
				page: pageParam,
				limit: CHINA_PRODUCTS_PAGE_SIZE,
			});
			return parseListPage(data, pageParam);
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => lastPage.nextPage,
		// A brand can appear on several pages, so its groups are merged into one before rendering.
		select: (data) => mergeBrandGroups(data.pages.flatMap((page) => page.results)),
	});
}

export function useImportCartQuery(stage: ImportStage) {
	return useQuery({
		queryKey: twoStageKeys.cart(stage),
		queryFn: () => twoStageImportService.getCart(stage),
	});
}

export function useImportOrdersQuery(params?: ImportOrderListParams) {
	return useQuery({
		queryKey: twoStageKeys.orders(params),
		queryFn: () => twoStageImportService.getOrders(params),
	});
}

export function useTransitStockQuery(logisticsWarehouse?: number) {
	return useQuery({
		queryKey: twoStageKeys.transitStock(logisticsWarehouse),
		queryFn: () => twoStageImportService.getTransitStock(logisticsWarehouse),
	});
}

export function useLogisticsPartnersQuery(params?: LogisticsPartnersParams) {
	return useQuery({
		queryKey: ['two-stage-import', 'logistics-partners', params] as const,
		queryFn: () => twoStageImportService.getLogisticsPartners(params),
		placeholderData: keepPreviousData,
	});
}

export function usePartnerStockQuery(partnerId?: number, params?: PartnerStockParams) {
	return useQuery({
		queryKey: ['two-stage-import', 'logistics-partners', partnerId, 'stock', params] as const,
		queryFn: () => twoStageImportService.getPartnerStock(partnerId!, params),
		enabled: !!partnerId,
		placeholderData: keepPreviousData,
	});
}

export function usePartnerPriceHistoryQuery(partnerId?: number, stockId?: number, params?: { page?: number; limit?: number }) {
	return useQuery({
		queryKey: ['two-stage-import', 'logistics-partners', partnerId, 'price-history', stockId, params] as const,
		queryFn: () => twoStageImportService.getPartnerPriceHistory(partnerId!, stockId!, params),
		enabled: !!partnerId && !!stockId,
	});
}

export function useOrderProductsQuery(orderId?: number, params?: OrderProductsParams) {
	return useQuery({
		queryKey: ['two-stage-import', 'order-products', orderId, params] as const,
		queryFn: () => twoStageImportService.getOrderProducts(orderId!, params),
		enabled: !!orderId,
		placeholderData: keepPreviousData,
	});
}

export function useUzbekistanInRoadQuery() {
	return useQuery({
		queryKey: twoStageKeys.uzbekistanInRoad,
		queryFn: () => twoStageImportService.getUzbekistanInRoad(),
	});
}

function useInvalidateTwoStageImport() {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries({ queryKey: twoStageKeys.all });
	};
}

export function useAddCartItemMutation() {
	const invalidate = useInvalidateTwoStageImport();
	return useMutation({
		mutationFn: (payload: CartItemPayload) => twoStageImportService.addCartItem(payload),
		onSuccess: invalidate,
	});
}

export function useDeleteCartItemMutation() {
	const invalidate = useInvalidateTwoStageImport();
	return useMutation({
		mutationFn: (id: number) => twoStageImportService.removeCartItem(id),
		onSuccess: invalidate,
	});
}

export function useClearCartMutation() {
	const invalidate = useInvalidateTwoStageImport();
	return useMutation({
		mutationFn: (stage: ImportStage) => twoStageImportService.clearCart(stage),
		onSuccess: invalidate,
	});
}

export function useChinaDispatchMutation() {
	const invalidate = useInvalidateTwoStageImport();
	return useMutation({
		mutationFn: (payload: ChinaDispatchPayload) => twoStageImportService.chinaDispatch(payload),
		onSuccess: invalidate,
	});
}

export function useTransitArrivalMutation() {
	const invalidate = useInvalidateTwoStageImport();
	return useMutation({
		mutationFn: ({ orderId, payload }: { orderId: number; payload: TransitArrivalPayload }) =>
			twoStageImportService.transitArrival(orderId, payload),
		onSuccess: invalidate,
	});
}

export function useUzbekistanDispatchMutation() {
	const invalidate = useInvalidateTwoStageImport();
	return useMutation({
		mutationFn: (payload: UzbekistanDispatchPayload) => twoStageImportService.uzbekistanDispatch(payload),
		onSuccess: invalidate,
	});
}

export function useLocalReceiptMutation() {
	const queryClient = useQueryClient();
	const invalidate = useInvalidateTwoStageImport();
	return useMutation({
		mutationFn: ({ orderId, payload }: { orderId: number; payload: LocalReceiptPayload }) =>
			twoStageImportService.localReceipt(orderId, payload),
		onSuccess: () => {
			invalidate();
			// Receipt adds stock to the internal Warehouse, so warehouse lists must refresh too.
			queryClient.invalidateQueries({ queryKey: ['warehouse'] });
		},
	});
}

export function useCancelOrderMutation() {
	const invalidate = useInvalidateTwoStageImport();
	return useMutation({
		mutationFn: ({ orderId, payload }: { orderId: number; payload: CancelOrderPayload }) =>
			twoStageImportService.cancelOrder(orderId, payload),
		onSuccess: invalidate,
	});
}
