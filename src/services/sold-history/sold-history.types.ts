import type { PaginationMeta } from '@/services/api/types';

/** Money values arrive as strings with two decimals: "7850.00". */
type Money = string;

export interface SoldClientRef {
	id: number;
	fio: string;
}

// ---- Sotilgan tovarlar tarixi (sold-dates) ----

export interface SoldDatesParams {
	page?: number;
	page_size?: number;
	start_date?: string;
	end_date?: string;
}

export interface SoldDateItem {
	date: string;
	date_label: string;
	order_count: number;
	debt_count: number;
}

export interface SoldDatesResponse {
	pagination: PaginationMeta;
	results: SoldDateItem[];
}

export interface SoldDayParams {
	page?: number;
	page_size?: number;
	client?: number;
}

interface SoldDayPaymentTotals {
	count: number;
	sum_dollar: Money;
	sum_som: Money;
	sum_cart: Money;
	sum_transfers: Money;
	zdacha_sum: Money;
	zdacha_dollar: Money;
}

export interface SoldDayOrderTotals extends SoldDayPaymentTotals {
	all_summ_dollar: Money;
}

export interface SoldDayDebtTotals extends SoldDayPaymentTotals {
	paid_debt_dollar: Money;
}

export interface SoldDayOrderRow {
	id: number;
	number: number;
	time: string;
	client: SoldClientRef | null;
	all_product_sum: Money;
	all_summ_dollar: Money;
	order_account_status: boolean | null;
	is_vozvrat: number;
	is_sent: number;
}

export interface SoldDayDebtRow {
	id: number;
	number: number;
	time: string;
	client: SoldClientRef | null;
	paid_debt_dollar: Money;
}

interface SoldDayResponse<TTotals, TRow> {
	date: string;
	date_label: string;
	totals: TTotals;
	/** Filled only on page=1; `[]` on later pages. */
	clients: SoldClientRef[];
	pagination: PaginationMeta;
	results: TRow[];
}

export type SoldDayOrdersResponse = SoldDayResponse<SoldDayOrderTotals, SoldDayOrderRow>;
export type SoldDayDebtsResponse = SoldDayResponse<SoldDayDebtTotals, SoldDayDebtRow>;

// ---- Sotilgan tovarlar soni (sold-products) ----

export interface SoldProductFilter {
	brand: number;
	product_category: number;
	size?: string;
	type?: number;
}

export interface SoldProductsParams extends SoldProductFilter {
	start_date: string;
	end_date: string;
}

export interface SoldProductsDayParams extends SoldProductFilter {
	page?: number;
	page_size?: number;
}

/** `id` is null for the "Skladsiz" bucket, so index / name is used as the key. */
export interface SoldSklad {
	id: number | null;
	name: string;
}

export interface SoldSkladCount extends SoldSklad {
	count: number;
}

export interface SoldProductsFilters {
	brand: { id: number; name: string };
	product_category: { id: number; name: string };
	size: string | null;
	type: { id: number; name: string } | null;
	start_date?: string;
	end_date?: string;
}

export interface SoldProductsTotals {
	count: number;
	sklads: SoldSkladCount[];
}

export interface SoldProductsDayItem {
	date: string;
	date_label: string;
	count: number;
	sklads: SoldSkladCount[];
}

export interface SoldProductsResponse {
	filters: SoldProductsFilters;
	sklads: SoldSklad[];
	totals: SoldProductsTotals;
	results: SoldProductsDayItem[];
}

export interface SoldProductLine {
	id: number;
	number: number;
	type_sklad: SoldSklad | null;
	brand_name: string;
	product_category_name: string;
	size: string;
	type_name: string;
	count: number;
	is_searched: boolean;
}

export interface SoldProductOrder {
	id: number;
	number: number;
	time: string;
	client: SoldClientRef | null;
	searched_count: number;
	exchange_rate: Money;
	all_product_sum: Money;
	all_summ_dollar: Money;
	discount_amount: Money;
	total_debt: Money;
	sum_dollar: Money;
	sum_som: Money;
	sum_cart: Money;
	sum_transfers: Money;
	zdacha_sum: Money;
	zdacha_dollar: Money;
	products: SoldProductLine[];
}

export interface SoldProductsPaymentTotals {
	sum_dollar: Money;
	sum_som: Money;
	sum_cart: Money;
	sum_transfers: Money;
	zdacha_sum: Money;
	zdacha_dollar: Money;
	all_summ_dollar: Money;
}

export interface SoldProductsDayResponse {
	date: string;
	date_label: string;
	filters: SoldProductsFilters;
	sklads: SoldSklad[];
	totals: SoldProductsTotals;
	payment_totals: SoldProductsPaymentTotals;
	pagination: PaginationMeta;
	results: SoldProductOrder[];
}
