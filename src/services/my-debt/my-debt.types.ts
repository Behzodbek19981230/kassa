import type { ListParams } from '@/services/api/types';

export interface MyDebtCompanyDetail {
	id: number;
	name: string;
	logo: string | null;
}

export interface MyDebtConsignorDetail {
	id: number;
	created_time: string;
	updated_time: string;
	name: string;
	phone: string;
	address: string;
	created_by: number;
	updated_by: number | null;
}

export interface MyDebtUserDetail {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
}

export interface MyDebtItem {
	id: number;
	company_detail: MyDebtCompanyDetail;
	consignor_detail: MyDebtConsignorDetail;
	created_by_detail: MyDebtUserDetail | null;
	updated_by_detail: MyDebtUserDetail | null;
	created_time: string;
	updated_time: string;
	cr_date: string;
	total_debt: string;
	created_by: number;
	updated_by: number | null;
	company: number;
	consignor: number;
}

export interface MyDebtListParams extends ListParams {
	company_id?: number;
	consignor?: number;
	created_by?: number;
}

export interface MyDebtPayload {
	company: number;
	consignor: number;
	total_debt: number;
	cr_date: string;
}
