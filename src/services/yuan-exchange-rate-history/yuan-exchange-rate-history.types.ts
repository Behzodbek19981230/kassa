import type { ListParams } from '@/services/api/types';
import type {
	ExchangeRateHistoryCompanyDetail,
	ExchangeRateHistoryUserDetail,
} from '@/services/exchange-rate-history/exchange-rate-history.types';

export interface YuanExchangeRateHistoryItem {
	id: number;
	company_detail: ExchangeRateHistoryCompanyDetail;
	user_detail: ExchangeRateHistoryUserDetail;
	created_by_detail: ExchangeRateHistoryUserDetail | null;
	updated_by_detail: ExchangeRateHistoryUserDetail | null;
	created_time: string;
	updated_time: string;
	action: 'CREATE' | 'UPDATE';
	old_dollar_per_yuan: number | string | null;
	new_dollar_per_yuan: number | string | null;
	old_status: boolean | null;
	new_status: boolean | null;
	created_by: number;
	updated_by: number | null;
	company: number;
	user: number;
}

export interface YuanExchangeRateHistoryListParams extends ListParams {
	company?: number;
}
