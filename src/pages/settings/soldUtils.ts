import { formatNumber } from '@/lib/number';

const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const MONTHS = [
	'Yanvar',
	'Fevral',
	'Mart',
	'Aprel',
	'May',
	'Iyun',
	'Iyul',
	'Avgust',
	'Sentabr',
	'Oktabr',
	'Noyabr',
	'Dekabr',
];
const MONTHS_SHORT = ['YAN', 'FEV', 'MAR', 'APR', 'MAY', 'IYN', 'IYL', 'AVG', 'SEN', 'OKT', 'NOY', 'DEK'];

/** "2026-11-15" -> its parts; weekday is computed in UTC so the plain date never shifts. */
export function parseIsoDay(iso: string) {
	const [y, m, d] = iso.split('-').map(Number);
	const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
	return {
		day: String(d).padStart(2, '0'),
		monthShort: MONTHS_SHORT[m - 1] ?? '',
		monthLabel: `${MONTHS[m - 1] ?? ''} ${y}`,
		weekday: WEEKDAYS[weekday] ?? '',
	};
}

export const money = (value: string | number | null | undefined) => formatNumber(value ?? 0, 2);

/** Sklad colors, picked by the sklad's array index (its `id` may be null). */
const SKLAD_PALETTE = ['#0F766E', '#DC6803', '#6941C6', '#0086C9', '#667085'];
export const skladColor = (index: number) => SKLAD_PALETTE[index % SKLAD_PALETTE.length];
