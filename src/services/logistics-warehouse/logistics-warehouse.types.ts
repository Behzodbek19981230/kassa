import type { ListParams } from '@/services/api/types';

/**
 * `country_name`, `logistics_company_name`, `company`, `logistics_company`, `phone`, `address`, `contact_person`
 * and `is_active` are not all in the guide. The backend rejects a create without `company` and `logistics_company`
 * (400 "Ushbu maydon to'ldirilishi shart"). The contact fields and `is_active` come from the requested payload.
 */
export interface LogisticsWarehouse {
	id: number;
	name: string;
	country?: number | null;
	country_name?: string | null;
	company?: number | null;
	logistics_company?: number | null;
	logistics_company_name?: string | null;
	phone?: string | null;
	address?: string | null;
	contact_person?: string | null;
	is_active?: boolean;
}

export interface LogisticsWarehousePayload {
	name: string;
	country: number;
	company: number;
	logistics_company: number;
	phone: string;
	address: string;
	contact_person: string;
	is_active: boolean;
}

export interface LogisticsWarehouseListParams extends ListParams {
	country?: number;
	/** Only the warehouses of this logistics company. The filter name is assumed; the guide does not list it. */
	logistics_company?: number;
}
