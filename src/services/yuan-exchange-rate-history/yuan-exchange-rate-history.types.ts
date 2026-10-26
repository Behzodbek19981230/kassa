import type { ListParams } from '@/services/api/types';
import type {
	ExchangeRateHistoryCompanyDetail,
	ExchangeRateHistoryUserDetail,
} from '@/services/exchange-rate-history/exchange-rate-history.types';

export interface YuanExchangeRateHistoryItem {
	id: number;
	company_detail: ExchangeRateHistoryCompanyDetail;
	created_by_detail: ExchangeRateHistoryUserDetail | null;
	updated_by_detail: ExchangeRateHistoryUserDetail | null;
	created_time: string;
	updated_time: string;
	/** Yuan per 1 dollar, serialized as a decimal string. `old_value` is null for the initial record. */
	old_value: string | null;
	new_value: string | null;
	created_by: number | null;
	updated_by: number | null;
	exchange_rate: number;
}

export interface YuanExchangeRateHistoryListParams extends ListParams {
	company?: number;
}
