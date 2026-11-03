import { formatNumber } from '@/lib/number';

export const DEBT_DELETE_HISTORY_PATH = '/settings/debt-repayments-drafts/deleted';

/**
 * First non-empty value among `keys`, looked up on the audit row itself and then inside its snapshot
 * objects (`repayment_data`, or any other `*_data`), so the pages work with either flat or nested fields.
 */
export function pickField(row: Record<string, unknown> | null | undefined, ...keys: string[]): unknown {
	if (!row) return undefined;
	const sources: Record<string, unknown>[] = [row];
	for (const [key, value] of Object.entries(row)) {
		if (key.endsWith('_data') && value && typeof value === 'object' && !Array.isArray(value)) {
			sources.push(value as Record<string, unknown>);
		}
	}
	for (const source of sources) {
		for (const key of keys) {
			const value = source[key];
			if (value !== undefined && value !== null && value !== '') return value;
		}
	}
	return undefined;
}

export function pickText(row: Record<string, unknown> | null | undefined, ...keys: string[]) {
	const value = pickField(row, ...keys);
	if (value && typeof value === 'object') {
		// Nested detail objects such as `client_detail` or `created_by_detail`.
		const obj = value as Record<string, unknown>;
		const name = obj.fio ?? obj.name ?? `${obj.first_name ?? ''} ${obj.last_name ?? ''}`.trim();
		return name ? String(name) : '';
	}
	return value == null ? '' : String(value);
}

export const formatMoney = (value: unknown) => formatNumber(Number(value) || 0, 2);

export const PAID_KEYS = ['all_summ_dollar', 'paid_amount', 'summa'];
