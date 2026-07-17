import type { ListParams } from '@/services/api/types';

export interface ExchangeRateItem {
	id: number;
	dollar: string | number;
	status: boolean;
	company: number;
}

export interface ExchangeRateListParams extends ListParams {
	company?: number;
}

export interface ExchangeRatePayload {
	dollar: string | number;
	status: boolean;
	company: number;
}
