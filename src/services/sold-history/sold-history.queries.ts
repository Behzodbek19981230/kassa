import { useQuery } from '@tanstack/react-query';
import { soldHistoryService } from '@/services/sold-history/sold-history.service';
import type {
	SoldDatesParams,
	SoldDayParams,
	SoldProductsDayParams,
	SoldProductsParams,
} from '@/services/sold-history/sold-history.types';

const soldHistoryKeys = {
	dates: (params?: SoldDatesParams) => ['sold-history', 'dates', params] as const,
	dayOrders: (date: string, params?: SoldDayParams) => ['sold-history', 'day-orders', date, params] as const,
	dayDebts: (date: string, params?: SoldDayParams) => ['sold-history', 'day-debts', date, params] as const,
	products: (params?: SoldProductsParams) => ['sold-history', 'products', params] as const,
	productsDay: (date: string, params?: SoldProductsDayParams) =>
		['sold-history', 'products-day', date, params] as const,
};

export function useSoldDatesQuery(params?: SoldDatesParams) {
	return useQuery({
		queryKey: soldHistoryKeys.dates(params),
		queryFn: () => soldHistoryService.listDates(params),
		placeholderData: (prev) => prev,
	});
}

export function useSoldDayOrdersQuery(date: string, params?: SoldDayParams) {
	return useQuery({
		queryKey: soldHistoryKeys.dayOrders(date, params),
		queryFn: () => soldHistoryService.dayOrders(date, params),
		placeholderData: (prev) => prev,
		enabled: Boolean(date),
	});
}

export function useSoldDayDebtsQuery(date: string, params?: SoldDayParams) {
	return useQuery({
		queryKey: soldHistoryKeys.dayDebts(date, params),
		queryFn: () => soldHistoryService.dayDebts(date, params),
		placeholderData: (prev) => prev,
		enabled: Boolean(date),
	});
}

/** Coming back from a day keeps the cached result instead of asking again (the doc's flow). */
const SOLD_PRODUCTS_STALE_MS = 5 * 60 * 1000;

export function useSoldProductsQuery(params: SoldProductsParams | null) {
	return useQuery({
		queryKey: soldHistoryKeys.products(params ?? undefined),
		queryFn: () => soldHistoryService.soldProducts(params!),
		enabled: params !== null,
		staleTime: SOLD_PRODUCTS_STALE_MS,
	});
}

export function useSoldProductsDayQuery(date: string, params: SoldProductsDayParams | null) {
	return useQuery({
		queryKey: soldHistoryKeys.productsDay(date, params ?? undefined),
		queryFn: () => soldHistoryService.soldProductsDay(date, params!),
		placeholderData: (prev) => prev,
		enabled: Boolean(date) && params !== null,
	});
}
