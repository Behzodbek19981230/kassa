import type { ListParams } from '@/services/api/types';

type Money = number | string;

interface CardPaymentUserDetail {
	id: number;
	username?: string;
	first_name?: string;
	last_name?: string;
}

interface CardPaymentClientDetail {
	id: number;
	fio?: string;
	phone?: string;
}

/**
 * One payment received on a store card (read-only).
 * `amount`, `client_detail` and `note` follow the backend's usual naming but are not confirmed yet.
 */
export interface CardPayment {
	id: number;
	payment_card: number;
	amount: Money;
	client?: number | null;
	client_detail?: CardPaymentClientDetail | null;
	note?: string | null;
	created_by?: number | null;
	created_by_detail?: CardPaymentUserDetail | null;
	created_time: string;
}

export interface CardPaymentListParams extends ListParams {
	payment_card?: number;
	start_date?: string;
	end_date?: string;
}

export interface CardPaymentTotalsParams {
	payment_card?: number;
	start_date?: string;
	end_date?: string;
}

/** Sum and number of payments of one card. */
export interface CardPaymentCardTotal {
	payment_card: number;
	total: number;
	count: number;
}

/** `/card-payment/totals/` read into one shape: overall sum and count, plus a row per card. */
export interface CardPaymentTotals {
	total: number;
	count: number;
	cards: CardPaymentCardTotal[];
}
