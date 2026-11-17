import type { ListParams } from '@/services/api/types';
import type { PaymentCard } from '@/services/payment-card/payment-card.types';

/** Decimal fields may come as strings from the API. */
type Money = number | string;

export interface Expense {
	id: number;
	nomi: string;
	summa: number;
	/** Whole expense in dollars: cash, card and dollar parts together. */
	all_summ_dollar?: Money | null;
	summ_dollar?: Money | null;
	sum_som?: Money | null;
	summ_cart?: Money | null;
	/** The store card the card part was paid from. */
	payment_card?: number | null;
	payment_card_detail?: Pick<PaymentCard, 'id' | 'name' | 'last4'> | null;
	date_cr: string;
	company: number;
	type: number;
}

export interface ExpensePayload {
	nomi: string;
	summa: number;
	all_summ_dollar: number;
	summ_dollar: number;
	sum_som: number;
	summ_cart: number;
	/** Required when `summ_cart` is above 0, otherwise null. */
	payment_card: number | null;
	date_cr: string;
	company: number;
	type: number;
}

export interface ExpenseListParams extends ListParams {
	type?: number;
}
