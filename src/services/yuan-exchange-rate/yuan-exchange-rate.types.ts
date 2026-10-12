import type { ListParams } from '@/services/api/types';

export interface YuanExchangeRateItem {
	id: number;
	dollar_per_yuan: string | number;
	status: boolean;
	company: number;
}

export interface YuanExchangeRateListParams extends ListParams {
	company?: number;
}

export interface YuanExchangeRatePayload {
	dollar_per_yuan: string | number;
	status: boolean;
	company: number;
}
