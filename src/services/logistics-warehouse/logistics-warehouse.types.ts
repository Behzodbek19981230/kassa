import type { ListParams } from '@/services/api/types';

/**
 * `country_name`, `logistics_company_name` and the `company` / `logistics_company` ids are not in the guide.
 * The backend rejects a create without `company` and `logistics_company` (400 "Ushbu maydon to'ldirilishi shart").
 */
export interface LogisticsWarehouse {
	id: number;
	name: string;
	country?: number | null;
	country_name?: string | null;
	company?: number | null;
	logistics_company?: number | null;
	logistics_company_name?: string | null;
}

export interface LogisticsWarehousePayload {
	name: string;
	country: number;
	company: number;
	logistics_company: number;
}

export interface LogisticsWarehouseListParams extends ListParams {
	country?: number;
	/** Only the warehouses of this logistics company. The filter name is assumed; the guide does not list it. */
	logistics_company?: number;
}
