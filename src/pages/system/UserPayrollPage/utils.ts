import { useRef } from 'react';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { todayTashkent } from '@/pages/TwoStageImport/utils';
import type { PayrollTransactionType } from '@/services/payroll/payroll.types';

export const MONTH_TABS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

export function currentYearMonth() {
	const [year, month] = todayTashkent().split('-').map(Number);
	return { year, month };
}

export function toNumber(value: string | number | null | undefined) {
	const num = Number(value);
	return Number.isFinite(num) ? num : 0;
}

/** Plain numeric input → the money string the backend expects (`"200.00"`). */
export function toMoneyString(value: string | number | null | undefined) {
	return toNumber(value).toFixed(2);
}

/** `$ 1 200` / `$ 1 200.50`: cents only when present. */
export function fmtDollar(value: string | number | null | undefined) {
	const num = toNumber(value);
	return `$ ${formatNumber(num, Number.isInteger(num) ? 0 : 2)}`;
}

/** `15 000 000 so'm`. */
export function fmtSom(value: string | number | null | undefined) {
	const num = toNumber(value);
	return `${formatNumber(num, Number.isInteger(num) ? 0 : 2)} so'm`;
}

/** "$200", "2 000 000 so'm", "$200 + 3 000 000 so'm"; "—" when both are zero. */
export function fmtMixed(dollar: number, som: number, zero = '—') {
	const parts: string[] = [];
	if (dollar) parts.push(fmtDollar(dollar));
	if (som) parts.push(fmtSom(som));
	return parts.length ? parts.join(' + ') : zero;
}

export function personName(person?: { first_name?: string; last_name?: string; username?: string } | null) {
	if (!person) return '';
	return `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim() || person.username || '';
}

/** API datetime → "15.11.2026 12:08" in Tashkent time (UTC+5, no DST). */
export function fmtDateTime(value?: string | null) {
	if (!value) return '—';
	const d = new Date(new Date(value).getTime() + 5 * 60 * 60 * 1000);
	if (Number.isNaN(d.getTime())) return value;
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export const TYPE_META: Record<PayrollTransactionType, { label: string; badge: string }> = {
	SALARY: { label: 'Oylik', badge: 'bg-emerald-600 text-white' },
	BONUS: { label: 'Bonus', badge: 'bg-amber-500 text-white' },
	PENALTY: { label: 'Jarima', badge: 'bg-red-600 text-white' },
};

export const TRANSACTION_TYPES: PayrollTransactionType[] = ['SALARY', 'BONUS', 'PENALTY'];

function newUuid() {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
	// crypto.randomUUID needs a secure context (https/localhost); fall back to a v4 UUID from getRandomValues.
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * `transaction_key` for a payroll operation. Sending the same form contents again after a failed request
 * (timeout, network error) reuses the previous key, so the backend can't record it twice. Any change to the
 * contents, or `reset()` after a successful save / reopening the modal, starts a new operation with a new key.
 */
export function useTransactionKey() {
	const pending = useRef<{ fingerprint: string; key: string } | null>(null);
	return {
		keyFor(contents: unknown) {
			const fingerprint = JSON.stringify(contents);
			if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, key: newUuid() };
			return pending.current.key;
		},
		reset() {
			pending.current = null;
		},
	};
}

/**
 * Maps a DRF 400 body (`{ field: ['msg'] }`) onto the form's fields, so each message shows under its input.
 * Messages for other fields, and non-400 errors, are collected under `form`.
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
