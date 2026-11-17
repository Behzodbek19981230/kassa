import { formatNumber } from '@/lib/number';
import { todayTashkent } from '@/pages/TwoStageImport/utils';
import { parseIsoDay } from '@/pages/settings/soldUtils';
import type {
	CashChannelBase,
	CashChannelKind,
	CashMovement,
	CashSourceKind,
	CashSourceRow,
} from '@/services/cash-register/cash-register.types';

const MINUS = '−';
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

/** API money string → number; null/empty/garbage → 0. */
export function num(value: string | number | null | undefined): number {
	const n = Number(value ?? 0);
	return Number.isFinite(n) ? n : 0;
}

/** Half-up to 2 decimals, the same rounding the backend uses for "$ ekv.". */
export function round2(value: number): number {
	return Math.round((value + Math.sign(value) * Number.EPSILON) * 100) / 100;
}

/** "20 000 000" for whole amounts, "1 234.50" otherwise; negatives get a real minus sign. */
export function fmtAmount(value: string | number | null | undefined): string {
	const n = round2(num(value));
	const abs = Math.abs(n);
	const body = Number.isInteger(abs) ? formatNumber(abs) : formatNumber(abs, 2);
	return n < 0 ? `${MINUS}${body}` : body;
}

/** "+18 450 000" / "−1 850 000" / "0". */
export function fmtSigned(value: string | number | null | undefined): string {
	const n = round2(num(value));
	if (n > 0) return `+${fmtAmount(n)}`;
	return fmtAmount(n);
}

/** "$ 6 355.00" ($ equivalents always carry 2 decimals); `null` (no exchange rate) → "—". */
export function fmtUsd(value: string | number | null | undefined, { signed = false } = {}): string {
	if (value === null || value === undefined || value === '') return '—';
	const n = round2(num(value));
	const body = `$ ${formatNumber(Math.abs(n), 2)}`;
	if (n < 0) return `${MINUS}${body}`;
	if (n > 0 && signed) return `+${body}`;
	return body;
}

/** A channel amount in its own currency: naqd dollar gets a "$" prefix. */
export function fmtChannel(value: string | number | null | undefined, channel: CashChannelKind, signed = false): string {
	const text = signed ? fmtSigned(value) : fmtAmount(value);
	if (channel !== 'cash_usd') return text;
	const n = round2(num(value));
	if (n < 0) return `${MINUS}$ ${text.slice(1)}`;
	if (n > 0 && signed) return `+$ ${text.slice(1)}`;
	return `$ ${text}`;
}

/** "Naqd so'm" | "Naqd dollar" | "Transfer" | "Uzcard *4521" | "Kartasi belgilanmagan". */
export function channelLabel(ch: CashChannelBase, short = false): string {
	switch (ch.channel) {
		case 'cash_som':
			return "Naqd so'm";
		case 'cash_usd':
			return short ? 'Naqd $' : 'Naqd dollar';
		case 'transfer':
			return 'Transfer';
		default:
			if (ch.card == null) return ch.card_name || 'Kartasi belgilanmagan';
			return ch.last4 ? `${ch.card_name ?? 'Karta'} *${ch.last4}` : (ch.card_name ?? 'Karta');
	}
}

/** "$ ekv." of an amount: naqd dollar as is, everything else divided by the rate; `null` without a rate. */
export function toUsd(amount: number, channel: CashChannelKind, rate: number | null): number | null {
	if (channel === 'cash_usd') return round2(amount);
	if (!rate) return null;
	return round2(amount / rate);
}

/** Sums nullable $ values; any `null` (no rate) makes the total `null`. */
export function sumUsd(values: (number | null)[]): number | null {
	let total = 0;
	for (const v of values) {
		if (v === null) return null;
		total += v;
	}
	return round2(total);
}

export const SOURCE_LABELS: Record<CashSourceKind, string> = {
	order: 'Buyurtmalar',
	debt: "Qarz to'lovlari",
	expense: 'Xarajatlar',
	vozvrat: 'Vozvrat',
	correction: 'Tuzatishlar',
};

export const SOURCE_SHORT: Record<CashSourceKind, string> = {
	order: 'buyurtma',
	debt: 'qarz',
	expense: 'xarajat',
	vozvrat: 'vozvrat',
	correction: 'tuzatish',
};

export type Tone = 'green' | 'red' | 'orange' | 'blue' | 'gray' | 'purple' | 'teal';

/** Kirim (order, debt) / Chiqim (expense, vozvrat) / Tuzatish (correction). */
export function sourceBadge(source: CashSourceKind): { label: string; tone: Tone } {
	if (source === 'order' || source === 'debt') return { label: 'Kirim', tone: 'green' };
	if (source === 'correction') return { label: 'Tuzatish', tone: 'orange' };
	return { label: 'Chiqim', tone: 'red' };
}

export function movementBadge(m: Pick<CashMovement, 'kind' | 'action'>): { label: string; tone: Tone } {
	if (m.kind === 'correction') {
		if (m.action === 'update') return { label: 'Tahrir', tone: 'orange' };
		if (m.action === 'delete') return { label: "O'chirildi", tone: 'gray' };
		return { label: 'Tuzatish', tone: 'orange' };
	}
	switch (m.kind) {
		case 'order':
			return { label: 'Buyurtma', tone: 'green' };
		case 'debt':
			return { label: "Qarz to'lov", tone: 'blue' };
		case 'expense':
			return { label: 'Xarajat', tone: 'red' };
		default:
			return { label: 'Vozvrat', tone: 'red' };
	}
}

const DOC_PREFIX: Record<CashSourceKind, string> = { order: '#', debt: 'Q-', expense: 'X-', vozvrat: 'V-', correction: '' };

/** "#2287" | "Q-905" | "X-311" | "V-12"; "—" without an id. */
export function docNumber(source: CashSourceKind | null, id: number | null): string {
	if (!source || id == null) return '—';
	return `${DOC_PREFIX[source]}${id}`;
}

export const todayIso = todayTashkent;

/** "2026-11-17" ± days. */
export function shiftDay(iso: string, delta: number): string {
	const [y, m, d] = iso.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1, d + delta));
	return date.toISOString().slice(0, 10);
}

/** "2026-11-17" → "seshanba". */
export function weekdayOf(iso: string): string {
	return parseIsoDay(iso).weekday.toLowerCase();
}

function tashkentParts(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return null;
	const t = new Date(d.getTime() + TASHKENT_OFFSET_MS);
	return {
		day: pad(t.getUTCDate()),
		month: pad(t.getUTCMonth() + 1),
		year: t.getUTCFullYear(),
		hh: pad(t.getUTCHours()),
		mm: pad(t.getUTCMinutes()),
	};
}

/** "17.11 19:45" in Tashkent time. */
export function fmtShortDateTime(value?: string | null): string {
	if (!value) return '—';
	const p = tashkentParts(value);
	return p ? `${p.day}.${p.month} ${p.hh}:${p.mm}` : value;
}

/** "22 soat 40 daqiqa". */
export function durationLabel(start?: string | null, end?: string | null): string {
	if (!start || !end) return '';
	const minutes = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000));
	const days = Math.floor(minutes / 1440);
	const hours = Math.floor((minutes % 1440) / 60);
	const mins = minutes % 60;
	const parts: string[] = [];
	if (days) parts.push(`${days} kun`);
	if (hours) parts.push(`${hours} soat`);
	if (mins || parts.length === 0) parts.push(`${mins} daqiqa`);
	return parts.join(' ');
}

/** Σ of one source table column; `codes` picks the channel codes summed together (e.g. every card). */
export function sumSources(sources: CashSourceRow[], codes: string[], kinds?: CashSourceKind[]): number {
	let total = 0;
	for (const row of sources) {
		if (kinds && !kinds.includes(row.source)) continue;
		for (const code of codes) total += num(row.amounts[code]);
	}
	return round2(total);
}

export function isCardChannel(ch: CashChannelBase) {
	return ch.channel === 'card';
}

/** Text color of a signed amount: green in, red out, dimmed zero. */
export function signTone(value: string | number | null | undefined) {
	const v = round2(num(value));
	if (v > 0) return 'text-emerald-500';
	if (v < 0) return 'text-red-500';
	return 'text-ca-text/70';
}
