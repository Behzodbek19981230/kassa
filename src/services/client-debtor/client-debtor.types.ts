import type { ListParams, PaginationMeta } from '@/services/api/types';
import type { ClientType } from '@/services/client/client.types';

export interface ClientDebtor {
	id: number;
	fio: string;
	type: ClientType;
	type_name: string;
	/** Decimal fields are serialized as strings by the API. */
	total_debt: string;
	last_order_date: string | null;
}

export interface ClientDebtorSummary {
	debtor_count: number;
	total_debt: string;
}

export interface ClientDebtorListResponse {
	pagination: PaginationMeta;
	results: ClientDebtor[];
	filters: unknown;
	summary: ClientDebtorSummary;
}

export interface ClientDebtorFilterParams {
	type?: ClientType;
	client?: number;
	search?: string;
}

export type ClientDebtorListParams = ClientDebtorFilterParams & ListParams;
