import type { ListParams } from '@/services/api/types';

export interface LogisticsCompany {
	id: number;
	name: string;
}

export interface LogisticsCompanyPayload {
	name: string;
}

export type LogisticsCompanyListParams = ListParams;
