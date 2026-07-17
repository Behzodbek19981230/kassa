import type { ListParams } from '@/services/api/types';

export interface ExchangeRateHistoryCompanyDetail {
	id: number;
	name: string;
	logo: string | null;
}

export interface ExchangeRateHistoryUserDetail {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
}

export interface ExchangeRateHistoryChangedField<T> {
	old: T | null;
	new: T | null;
}

export interface ExchangeRateHistoryChangedFields {
	dollar?: ExchangeRateHistoryChangedField<number>;
	status?: ExchangeRateHistoryChangedField<boolean>;
	company?: ExchangeRateHistoryChangedField<number>;
}

export interface ExchangeRateHistoryItem {
	id: number;
	company_detail: ExchangeRateHistoryCompanyDetail;
	user_detail: ExchangeRateHistoryUserDetail;
	created_by_detail: ExchangeRateHistoryUserDetail | null;
	updated_by_detail: ExchangeRateHistoryUserDetail | null;
	created_time: string;
	updated_time: string;
	exchange_rate_id_snapshot: number;
	action: 'CREATE' | 'UPDATE';
	old_dollar: number | string | null;
	new_dollar: number | string | null;
	old_status: boolean | null;
	new_status: boolean | null;
	changed_fields: ExchangeRateHistoryChangedFields;
	created_by: number;
	updated_by: number | null;
	company: number;
	exchange_rate: number;
	user: number;
}

export interface ExchangeRateHistoryListParams extends ListParams {
	company?: number;
}
