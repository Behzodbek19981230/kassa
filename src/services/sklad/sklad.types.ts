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
	company?: number;
	consignor_ref?: number;
	created_by?: number;
	import_product_status?: boolean;
}
