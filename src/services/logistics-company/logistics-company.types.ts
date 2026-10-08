import type { ListParams } from '@/services/api/types';

/** `country`, `country_name`, `phone`, `address` and `contact_person` are assumed from the requested fields; the guide does not list them. */
export interface LogisticsCompany {
	id: number;
	name: string;
	country?: number | null;
	country_name?: string | null;
	phone?: string | null;
	address?: string | null;
	contact_person?: string | null;
}

export interface LogisticsCompanyPayload {
	name: string;
	country: number;
	phone: string;
	address: string;
	contact_person: string;
}

export type LogisticsCompanyListParams = ListParams;
