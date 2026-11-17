import { apiClient } from '@/services/api/client';
import type { PaginatedResponse } from '@/services/api/types';
import type {
	CardPayment,
	CardPaymentCardTotal,
	CardPaymentListParams,
	CardPaymentTotals,
	CardPaymentTotalsParams,
} from '@/services/card-payment/card-payment.types';

const BASE_PATH = '/card-payment';

type RawRecord = Record<string, unknown>;

// The totals response shape was not documented, so the usual key spellings are accepted.
const AMOUNT_KEYS = ['total_amount', 'total', 'amount', 'total_summa', 'summa', 'sum'];
const COUNT_KEYS = ['count', 'payments_count', 'payment_count', 'total_count'];
const CARD_KEYS = ['payment_card', 'payment_card_id', 'card', 'card_id', 'id'];
const ROW_KEYS = ['cards', 'by_card', 'results', 'items', 'data'];

const isRecord = (value: unknown): value is RawRecord => typeof value === 'object' && value !== null;

function pick(source: RawRecord, keys: string[]): number | undefined {
	for (const key of keys) {
		const value = source[key];
		// A nested card object (`payment_card: { id, ... }`) counts by its id.
		const raw = isRecord(value) ? value.id : value;
		if (raw !== null && raw !== undefined && raw !== '' && !Number.isNaN(Number(raw))) return Number(raw);
	}
	return undefined;
}

function toCardTotal(row: unknown): CardPaymentCardTotal | null {
	if (!isRecord(row)) return null;
	const card = pick(row, CARD_KEYS);
	if (card === undefined) return null;
	return { payment_card: card, total: pick(row, AMOUNT_KEYS) ?? 0, count: pick(row, COUNT_KEYS) ?? 0 };
}

export function normalizeCardPaymentTotals(data: unknown): CardPaymentTotals {
	const rowsSource = Array.isArray(data)
		? data
		: isRecord(data)
			? ROW_KEYS.map((key) => data[key]).find(Array.isArray)
			: undefined;
	const cards = (rowsSource ?? []).map(toCardTotal).filter((row): row is CardPaymentCardTotal => row !== null);
	const own = isRecord(data) && !Array.isArray(data) ? data : {};
	return {
		total: pick(own, AMOUNT_KEYS) ?? cards.reduce((sum, row) => sum + row.total, 0),
		count: pick(own, COUNT_KEYS) ?? cards.reduce((sum, row) => sum + row.count, 0),
		cards,
	};
}

export const cardPaymentService = {
	list: async (params?: CardPaymentListParams) => {
		const { data } = await apiClient.get<PaginatedResponse<CardPayment>>(`${BASE_PATH}/`, { params });
		return data;
	},
	totals: async (params?: CardPaymentTotalsParams) => {
		const { data } = await apiClient.get<unknown>(`${BASE_PATH}/totals/`, { params });
		return normalizeCardPaymentTotals(data);
	},
};
