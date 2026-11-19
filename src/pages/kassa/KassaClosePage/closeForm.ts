import { isAxiosError } from 'axios';
import type { CashRegisterChannel, CashRegisterCurrent } from '@/services/cash-register/cash-register.types';
import { num, round2, sumUsd, toUsd } from '@/pages/kassa/utils';

export interface LineInput {
	actual: string;
	handed_over: string;
}

export const EMPTY_LINE: LineInput = { actual: '', handed_over: '0' };

/** One channel of the closing form with the preview the server will compute the same way. */
export interface PreviewRow {
	channel: CashRegisterChannel;
	input: LineInput;
	filled: boolean;
	opening: number;
	turnover: number;
	expected: number | null;
	actual: number;
	handed: number;
	/** `actual − expected`; null until counted or on the initial closing. */
	diff: number | null;
	/** `actual − handed_over`; null until counted. */
	rest: number | null;
}

export interface UsdTotals {
	opening: number | null;
	turnover: number | null;
	expected: number | null;
	actual: number | null;
	diff: number | null;
	handed: number | null;
	rest: number | null;
}

export function buildPreview(current: CashRegisterCurrent, inputs: Record<string, LineInput>) {
	const rate = num(current.exchange_rate) || null;
	const rows: PreviewRow[] = current.channels.map((ch) => {
		const input = inputs[ch.code] ?? EMPTY_LINE;
		const filled = input.actual.trim() !== '';
		const actual = num(input.actual);
		const handed = num(input.handed_over);
		const expected = current.is_initial || ch.expected == null ? null : num(ch.expected);
		return {
			channel: ch,
			input,
			filled,
			opening: num(ch.opening),
			turnover: num(ch.turnover),
			expected,
			actual,
			handed,
			diff: filled && expected !== null ? round2(actual - expected) : null,
			rest: filled ? round2(actual - handed) : null,
		};
	});

	const usdOf = (pick: (r: PreviewRow) => number | null) =>
		sumUsd(rows.map((r) => toUsd(pick(r) ?? 0, r.channel.channel, rate)));
	const t = current.totals;
	const usd: UsdTotals = {
		opening: t?.opening_usd != null ? num(t.opening_usd) : usdOf((r) => r.opening),
		turnover: t?.turnover_usd != null ? num(t.turnover_usd) : usdOf((r) => r.turnover),
		expected: current.is_initial ? null : t?.expected_usd != null ? num(t.expected_usd) : usdOf((r) => r.expected),
		actual: usdOf((r) => r.actual),
		diff: current.is_initial ? null : usdOf((r) => r.diff),
		handed: usdOf((r) => r.handed),
		rest: usdOf((r) => r.rest),
	};

	const diffRows = rows.filter((r) => r.diff !== null && r.diff !== 0);
	return { rows, usd, diffRows, rate };
}

export interface FormErrors {
	general: string[];
	lines: Record<string, Partial<Record<'actual' | 'handed_over' | 'card', string>>>;
	comment?: string;
	received_by?: string;
}

export const NO_ERRORS: FormErrors = { general: [], lines: {} };

export function hasErrors(e: FormErrors) {
	return e.general.length > 0 || Object.keys(e.lines).length > 0 || Boolean(e.comment) || Boolean(e.received_by);
}

/** Client-side checks; the server repeats them. */
export function validate(rows: PreviewRow[], comment: string, receivedBy: string, isInitial: boolean): FormErrors {
	const errors: FormErrors = { general: [], lines: {} };
	for (const r of rows) {
		const line: FormErrors['lines'][string] = {};
		if (!r.filled) line.actual = 'Sanalgan summani kiriting';
		else if (r.actual < 0) line.actual = "Manfiy bo'lishi mumkin emas";
		if (r.handed < 0) line.handed_over = "Manfiy bo'lishi mumkin emas";
		else if (r.filled && r.handed > r.actual) line.handed_over = 'Topshirilgan summa sanalgan summadan katta.';
		if (Object.keys(line).length) errors.lines[r.channel.code] = line;
	}
	const hasDiff = !isInitial && rows.some((r) => r.diff !== null && r.diff !== 0);
	if (!comment.trim()) errors.comment = hasDiff ? 'Farq bor: izoh yozish majburiy.' : 'Izoh yozish majburiy.';
	else if (comment.length > 2000) errors.comment = 'Izoh 2000 belgidan oshmasin.';
	if (!receivedBy) errors.received_by = 'Qabul qiluvchini tanlang.';
	return errors;
}

const asText = (v: unknown): string | undefined => {
	if (typeof v === 'string') return v;
	if (Array.isArray(v)) return v.filter((x) => typeof x === 'string').join(' ') || undefined;
	return undefined;
};

/** Maps a 400 body onto the form: `lines` as strings is a form-level error, as objects it is per row (by index). */
export function parseServerErrors(data: unknown, codes: string[]): FormErrors {
	const errors: FormErrors = { general: [], lines: {} };
	if (!data || typeof data !== 'object') return errors;
	for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
		if (key === 'lines' && Array.isArray(value)) {
			value.forEach((entry, index) => {
				if (typeof entry === 'string') errors.general.push(entry);
				else if (entry && typeof entry === 'object') {
					const code = codes[index];
					const line: FormErrors['lines'][string] = {};
					for (const [field, msg] of Object.entries(entry as Record<string, unknown>)) {
						const text = asText(msg);
						if (!text) continue;
						if (field === 'actual' || field === 'handed_over' || field === 'card') line[field] = text;
						else errors.general.push(`${index + 1}-qator: ${text}`);
					}
					if (code && Object.keys(line).length) errors.lines[code] = line;
				}
			});
		} else if (key === 'comment') errors.comment = asText(value);
		else if (key === 'received_by') errors.received_by = asText(value);
		else {
			const text = asText(value);
			if (text) errors.general.push(text);
		}
	}
	return errors;
}

export function conflictOf(err: unknown): { detail: string; current: CashRegisterCurrent } | null {
	if (!isAxiosError(err) || err.response?.status !== 409) return null;
	const body = err.response.data as { detail?: string; current?: CashRegisterCurrent } | undefined;
	if (!body?.current) return null;
	return { detail: body.detail ?? '', current: body.current };
}
