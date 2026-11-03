import { useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { todayTashkent } from '@/pages/TwoStageImport/utils';
import type { SalaryAdjustmentType, SalaryPeriodStatus } from '@/services/payroll/payroll.types';

export const MONTH_NAMES_UZ = [
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

export interface YearMonth {
	year: number;
	month: number;
}

export function monthLabel(year: number, month: number) {
	return `${year} ${MONTH_NAMES_UZ[month - 1] ?? month}`;
}

export function currentYearMonth(): YearMonth {
	const [year, month] = todayTashkent().split('-').map(Number);
	return { year, month };
}

export function toMonthValue({ year, month }: YearMonth) {
	return `${year}-${String(month).padStart(2, '0')}`;
}

export function fromMonthValue(value: string): YearMonth | null {
	const match = /^(\d{4})-(\d{1,2})$/.exec(value);
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	return month >= 1 && month <= 12 ? { year, month } : null;
}

function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
	const index = year * 12 + (month - 1) + delta;
	return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** Months offered in the pickers: newest first, from a year ahead (advances) back two years. */
export function monthOptions(around: YearMonth = currentYearMonth()) {
	const options: { value: string; label: string }[] = [];
	for (let delta = 12; delta >= -24; delta--) {
		const ym = addMonths(around, delta);
		options.push({ value: toMonthValue(ym), label: monthLabel(ym.year, ym.month) });
	}
	return options;
}

/** `?year=2026&month=12` in the URL, falling back to the current month. */
export function useYearMonthParams(): [YearMonth, (next: YearMonth) => void] {
	const [searchParams, setSearchParams] = useSearchParams();
	const fallback = currentYearMonth();
	const year = Number(searchParams.get('year')) || fallback.year;
	const monthParam = Number(searchParams.get('month'));
	const month = monthParam >= 1 && monthParam <= 12 ? monthParam : fallback.month;

	const setYearMonth = (next: YearMonth) => {
		setSearchParams(
			(prev) => {
				const params = new URLSearchParams(prev);
				params.set('year', String(next.year));
				params.set('month', String(next.month));
				params.delete('page');
				return params;
			},
			{ replace: true },
		);
	};

	return [{ year, month }, setYearMonth];
}

export function toNumber(value: string | number | null | undefined) {
	const num = Number(value);
	return Number.isFinite(num) ? num : 0;
}

/** Plain numeric input → the money string the backend expects (`"500.00"`). */
export function toMoneyString(value: string | number | null | undefined) {
	return toNumber(value).toFixed(2);
}

/** Dollar amounts, always with cents: `1 200.00`. */
export function fmtDollar(value: string | number | null | undefined) {
	return formatNumber(toNumber(value), 2);
}

/** So'm amounts: cents only when present: `2 500 000`. */
export function fmtSom(value: string | number | null | undefined) {
	const num = toNumber(value);
	return formatNumber(num, Number.isInteger(num) ? 0 : 2);
}

export function personName(person?: { first_name?: string; last_name?: string; username?: string } | null) {
	if (!person) return '';
	return `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim() || person.username || '';
}

export function formatDateTime(value?: string | null) {
	if (!value) return '';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const STATUS_META: Record<SalaryPeriodStatus | 'NONE', { label: string; className: string }> = {
	NONE: {
		label: 'Ochiq',
		className: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
	},
	OPEN: {
		label: 'Ochiq',
		className: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
	},
	PARTIAL: {
		label: 'Qisman',
		className:
			'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
	},
	PAID: {
		label: "To'langan",
		className:
			'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
	},
	CLOSED: {
		label: 'Yopilgan',
		className:
			'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/30',
	},
};

export const ADJUSTMENT_META: Record<SalaryAdjustmentType, { label: string; className: string; sign: 1 | -1 }> = {
	PENALTY: {
		label: 'Jarima',
		sign: -1,
		className: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
	},
	BONUS: {
		label: 'Bonus',
		sign: 1,
		className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
	},
	ADDITION: {
		label: "Qo'shimcha haq",
		sign: 1,
		className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
	},
	CORRECTION: {
		label: 'Tuzatish',
		sign: 1,
		className: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
	},
};

export const ADJUSTMENT_TYPES = Object.keys(ADJUSTMENT_META) as SalaryAdjustmentType[];

/** Card surface shared by the payroll pages. */
export const CARD = 'rounded-xl border border-ca-border bg-ca-silver-light shadow-sm';

/**
 * Maps a DRF 400 body (`{ field: ['msg'] }`) onto the form's fields, so each message shows under its input.
 * Messages for unknown fields (and non-400 errors) are collected under `form`.
 */
export function apiFieldErrors<F extends string>(err: unknown, fields: readonly F[]): Partial<Record<F | 'form', string>> {
	const response = (err as { response?: { status?: number; data?: unknown } })?.response;
	const result: Partial<Record<F | 'form', string>> = {};
	const body = response?.data;
	if (response?.status === 400 && body && typeof body === 'object' && !Array.isArray(body)) {
		for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
			const message = Array.isArray(value) ? String(value[0] ?? '') : typeof value === 'string' ? value : '';
			if (!message) continue;
			if ((fields as readonly string[]).includes(key)) result[key as F] = message;
			else result.form = result.form ? `${result.form} ${message}` : message;
		}
		if (Object.keys(result).length) return result;
	}
	result.form = getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi');
	return result;
}
