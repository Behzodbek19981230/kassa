import { z } from 'zod';
import type { BadgeProps } from '@/components/ui/Badge';
import type { ComboboxOption } from '@/components/ui';
import type { ImportOrderStatus, ImportStage } from '@/services/two-stage-import/two-stage-import.types';

export { SCROLL_AREA_CLASS, SCROLL_BODY_CLASS, SCROLL_PANEL_CLASS } from '@/lib/layout';

export const STAGE_LABELS: Record<ImportStage, string> = {
	CHINA_TO_TRANSIT: 'Xitoy → Tranzit sklad',
	TRANSIT_TO_UZBEKISTAN: "Tranzit sklad → O'zbekiston",
};

export const ORDER_STATUS_LABELS: Record<ImportOrderStatus, string> = {
	DRAFT: 'Qoralama',
	IN_ROAD: "Yo'lda",
	ARRIVED: 'Tranzit skladga keldi',
	RECEIVED: 'Yakunlangan',
	CANCELLED: 'Bekor qilingan',
};

export const ORDER_STATUS_VARIANTS: Record<ImportOrderStatus, BadgeProps['variant']> = {
	DRAFT: 'default',
	IN_ROAD: 'warning',
	ARRIVED: 'success',
	RECEIVED: 'success',
	CANCELLED: 'danger',
};

export const STAGE_OPTIONS: ComboboxOption[] = [
	{ value: 'CHINA_TO_TRANSIT', label: STAGE_LABELS.CHINA_TO_TRANSIT },
	{ value: 'TRANSIT_TO_UZBEKISTAN', label: STAGE_LABELS.TRANSIT_TO_UZBEKISTAN },
];

export const ORDER_STATUS_OPTIONS: ComboboxOption[] = (Object.keys(ORDER_STATUS_LABELS) as ImportOrderStatus[]).map(
	(value) => ({ value, label: ORDER_STATUS_LABELS[value] }),
);

// Uzbekistan has no DST, so the offset is fixed. It matches the +05:00 used in the API examples.
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const TASHKENT_OFFSET = '+05:00';

/** Current Tashkent time as a `YYYY-MM-DDTHH:mm` value, e.g. "2026-10-07T10:30". */
export function nowTashkentLocal() {
	return new Date(Date.now() + TASHKENT_OFFSET_MS).toISOString().slice(0, 16);
}

/** Today in Tashkent as an ISO date, e.g. "2026-10-07". */
export function todayTashkent() {
	return new Date(Date.now() + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
}

/** "2026-10-07T10:30" -> "2026-10-07T10:30:00+05:00" */
export function toApiDateTime(local: string) {
	return `${local}:00${TASHKENT_OFFSET}`;
}

/** Any API datetime -> "2026-10-07T10:30" in Tashkent time. */
export function fromApiDateTime(value: string) {
	return new Date(new Date(value).getTime() + TASHKENT_OFFSET_MS).toISOString().slice(0, 16);
}

/** Any API datetime -> "07.10.2026" in Tashkent time. */
export function formatTashkentDate(value?: string | null) {
	if (!value) return '-';
	const shifted = new Date(new Date(value).getTime() + TASHKENT_OFFSET_MS);
	const dd = String(shifted.getUTCDate()).padStart(2, '0');
	const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
	return `${dd}.${mm}.${shifted.getUTCFullYear()}`;
}

export function formatUserName(user: { first_name: string; last_name: string; username: string }) {
	return `${user.first_name} ${user.last_name}`.trim() || user.username;
}

export const positiveNumber = (requiredMessage: string) =>
	z
		.string()
		.trim()
		.min(1, requiredMessage)
		.refine((v) => Number(v) > 0, { message: "0 dan katta bo'lishi kerak" });

export const nonNegativeNumber = (requiredMessage: string) =>
	z
		.string()
		.trim()
		.min(1, requiredMessage)
		.refine((v) => Number(v) >= 0, { message: "Manfiy bo'lmasligi kerak" });
