/** Tashkent is UTC+5 all year (no DST). */
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

const pad = (n: number) => String(n).padStart(2, '0');

/** Shifts a datetime into Tashkent time so its UTC getters read Tashkent wall-clock values. */
function toTashkent(value: string): Date | null {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return null;
	return new Date(d.getTime() + TASHKENT_OFFSET_MS);
}

/**
 * Any API date / datetime -> "01.05.2026" (the app-wide display format).
 * A plain "2026-05-01" date is reformatted as-is (no timezone shift); a datetime is shown in Tashkent time.
 */
export function formatDate(value?: string | null, empty = ''): string {
	if (!value) return empty;
	const m = DATE_ONLY_RE.exec(value);
	if (m) return `${m[3]}.${m[2]}.${m[1]}`;
	const d = toTashkent(value);
	if (!d) return value;
	return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

/** Any API datetime -> "01.05.2026 14:30" in Tashkent time. A plain date gets no time part. */
export function formatDateTime(value?: string | null, empty = ''): string {
	if (!value) return empty;
	if (DATE_ONLY_RE.test(value)) return formatDate(value);
	const d = toTashkent(value);
	if (!d) return value;
	return `${formatDate(value)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** Formats a value only if it is an ISO date / datetime string; anything else is returned unchanged. */
export function formatIfIsoDate<T>(value: T): T | string {
	if (typeof value !== 'string') return value;
	if (DATE_ONLY_RE.test(value)) return formatDate(value);
	if (DATETIME_RE.test(value)) return formatDateTime(value);
	return value;
}
