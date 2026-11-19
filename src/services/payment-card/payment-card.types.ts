import type { ListParams } from '@/services/api/types';

export type PaymentCardType = 'uzcard' | 'humo' | 'visa' | 'mastercard';

export const PAYMENT_CARD_TYPE_OPTIONS: { value: PaymentCardType; label: string }[] = [
	{ value: 'uzcard', label: 'Uzcard' },
	{ value: 'humo', label: 'Humo' },
	{ value: 'visa', label: 'Visa' },
	{ value: 'mastercard', label: 'Mastercard' },
];

export interface PaymentCardUserDetail {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
}

export interface PaymentCard {
	id: number;
	name: string;
	card_type: PaymentCardType;
	card_type_display?: string;
	last4: string;
	owner_name: string;
	bank: string;
	is_active: boolean;
	sort_order: number;
	note: string;
	company?: number;
	created_by?: number | null;
	created_by_detail?: PaymentCardUserDetail | null;
	created_time?: string;
	updated_time?: string;
}

export interface PaymentCardPayload {
	name: string;
	card_type: PaymentCardType;
	last4: string;
	owner_name: string;
	bank: string;
	sort_order: number;
	is_active: boolean;
	note: string;
}

export interface PaymentCardListParams extends ListParams {
	is_active?: boolean;
}

/** "Humo kartasi •• 1251 (Ali Valiyev)": how a card is named in selects and tables. */
export function paymentCardLabel(card: Pick<PaymentCard, 'name' | 'last4'> & Partial<Pick<PaymentCard, 'owner_name'>>): string {
	const base = card.last4 ? `${card.name} •• ${card.last4}` : card.name;
	return card.owner_name ? `${base} (${card.owner_name})` : base;
}

/** "Humo": the backend's display label, else the option label for the type. */
export function paymentCardTypeLabel(card: Pick<PaymentCard, 'card_type' | 'card_type_display'>): string {
	return (
		card.card_type_display ||
		PAYMENT_CARD_TYPE_OPTIONS.find((o) => o.value === card.card_type)?.label ||
		String(card.card_type ?? '')
	);
}
