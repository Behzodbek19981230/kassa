import type { ListParams } from '@/services/api/types';

export interface YuanExchangeRateItem {
	id: number;
	/** Despite the backend field name, the value is yuan per 1 dollar (1 $ = N ¥). */
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
