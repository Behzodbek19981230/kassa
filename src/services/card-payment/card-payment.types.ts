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

/** Backend `CardPayment.Direction`. */
export type CardPaymentDirection = 'in' | 'out';

export const CARD_PAYMENT_DIRECTION_LABELS: Record<CardPaymentDirection, string> = {
	in: 'Kirim',
	out: 'Chiqim',
};

/** The order or debt repayment a payment belongs to; only its client's name is shown. */
export interface CardPaymentClientSource {
	id: number;
	client_name?: string | null;
	client_detail?: CardPaymentClientDetail | null;
}

export interface CardPaymentExpenseSource {
	id: number;
	nomi?: string | null;
}

/**
 * One payment on a store card (read-only).
 * `amount`, `client_detail` and `note` follow the backend's usual naming but are not confirmed yet.
 * `order`, `debt_repayment` and `expense` may come as an id (with a `*_detail` object beside it)
 * or as the nested object itself; the flat `*_name` fields are read when the serializer sends them.
 */
export interface CardPayment {
	id: number;
	payment_card: number;
	direction?: CardPaymentDirection | null;
	amount: Money;
	client?: number | null;
	client_detail?: CardPaymentClientDetail | null;
	order?: number | CardPaymentClientSource | null;
	order_detail?: CardPaymentClientSource | null;
	order_client_name?: string | null;
	debt_repayment?: number | CardPaymentClientSource | null;
	debt_repayment_detail?: CardPaymentClientSource | null;
	debt_repayment_client_name?: string | null;
	expense?: number | CardPaymentExpenseSource | null;
	expense_detail?: CardPaymentExpenseSource | null;
	expense_name?: string | null;
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
