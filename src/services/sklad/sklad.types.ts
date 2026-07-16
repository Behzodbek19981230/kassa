import type { ListParams } from '@/services/api/types';

export interface SkladCompanyDetail {
	id: number;
	name: string;
	logo: string | null;
}

export interface SkladConsignorDetail {
	id: number;
	created_time: string;
	updated_time: string;
	name: string;
	phone: string;
	address: string;
	created_by: number;
	updated_by: number | null;
}

export interface SkladUserDetail {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
}

export interface SkladItem {
	id: number;
	company_detail: SkladCompanyDetail;
	consignor_ref_detail: SkladConsignorDetail | null;
	created_by_detail: SkladUserDetail | null;
	updated_by_detail: SkladUserDetail | null;
	created_time: string;
	updated_time: string;
	cr_date: string;
	cr_date_time: string;
	status: number;
	consignor: number | null;
	exchange_rate: string;
	my_total_debt: string;
	sum_dollar: string;
	sum_som: string;
	discount_amount: string;
	import_product_status: boolean;
	comment: string;
	given_sum_dollar: string;
	old_my_total_debt: string;
	actived: number;
	car_number: string;
	created_by: number;
	updated_by: number | null;
	company: number;
	consignor_ref: number | null;
}

export interface SkladListParams extends ListParams {
	consignor_ref?: number;
	created_by?: number;
	import_product_status?: boolean;
}

export interface SkladUpdatePayload {
	cr_date: string;
	exchange_rate: number;
	sum_dollar: number;
	sum_som: number;
	discount_amount: number;
	given_sum_dollar: number;
	car_number?: string;
	comment?: string;
	company: number;
	consignor_ref: number;
}

export interface SkladViewSklad {
	id: number;
	company: number;
	company_name: string;
	consignor: number;
	consignor_name: string;
	cr_date: string;
	cr_date_time: string;
	cr_date_label: string;
	car_number: string;
	comment: string;
}

export interface SkladViewReport {
	exchange_rate: number;
	given_sum_dollar: number;
	sum_dollar: number;
	sum_som: number;
	discount_amount: number;
	my_total_debt: number;
	old_my_total_debt: number;
}

export interface SkladViewFilters {
	type_sklad: string | null;
}

export interface SkladViewItem {
	id: number;
	warehouse: number;
	brand: number;
	brand_name: string;
	product_category: number;
	product_category_name: string;
	size: number;
	type: number;
	type_name: string;
	type_sklad: number;
	type_sklad_name: string;
	count: number;
	price: number;
	cr_date: string;
	cr_date_time: string;
}

export interface SkladViewGroupTotals {
	count: number;
	price: number;
}

export interface SkladViewGroup {
	brand: { id: number; name: string };
	items: SkladViewItem[];
	totals: SkladViewGroupTotals;
}

export interface SkladViewProducts {
	group_count: number;
	groups: SkladViewGroup[];
	totals: SkladViewGroupTotals;
}

export interface SkladViewResponse {
	sklad: SkladViewSklad;
	report: SkladViewReport;
	filters: SkladViewFilters;
	products: SkladViewProducts;
}

export interface SkladViewParams {
	type_sklad?: number;
}
