import { todayTashkent } from '@/pages/TwoStageImport/utils';
import type { SoldProductFilter } from '@/services/sold-history/sold-history.types';

/** The product filter and period as kept in the URL, so A and B always get the exact same values. */
export interface SoldProductsForm {
	brand: string;
	productCategory: string;
	size: string;
	type: string;
	startDate: string;
	endDate: string;
}

export function readForm(params: URLSearchParams): SoldProductsForm {
	return {
		brand: params.get('brand') ?? '',
		productCategory: params.get('product_category') ?? '',
		// Sent back exactly as it came from the size list: "24 " and "24" are different sizes.
		size: params.get('size') ?? '',
		type: params.get('type') ?? '',
		startDate: params.get('start_date') ?? '',
		endDate: params.get('end_date') ?? '',
	};
}

export function writeForm(form: SoldProductsForm): URLSearchParams {
	const params = new URLSearchParams();
	if (form.brand) params.set('brand', form.brand);
	if (form.productCategory) params.set('product_category', form.productCategory);
	if (form.size) params.set('size', form.size);
	if (form.type) params.set('type', form.type);
	if (form.startDate) params.set('start_date', form.startDate);
	if (form.endDate) params.set('end_date', form.endDate);
	return params;
}

export function isFormComplete(form: SoldProductsForm) {
	return Boolean(form.brand && form.productCategory && form.startDate && form.endDate);
}

export function toProductFilter(form: SoldProductsForm): SoldProductFilter {
	return {
		brand: Number(form.brand),
		product_category: Number(form.productCategory),
		size: form.size || undefined,
		type: form.type ? Number(form.type) : undefined,
	};
}

// ---- Period presets ----

const pad = (n: number) => String(n).padStart(2, '0');

function addDays(iso: string, days: number) {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function monthStart(iso: string, monthOffset = 0) {
	const [y, m] = iso.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1 + monthOffset, 1));
	return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-01`;
}

export type PeriodPreset = 'today' | 'week' | 'month30' | 'thisMonth' | 'lastMonth';

export const PERIOD_PRESETS: { id: PeriodPreset; label: string }[] = [
	{ id: 'today', label: 'Bugun' },
	{ id: 'week', label: 'Oxirgi 7 kun' },
	{ id: 'month30', label: 'Oxirgi 30 kun' },
	{ id: 'thisMonth', label: 'Shu oy' },
	{ id: 'lastMonth', label: "O'tgan oy" },
];

export function presetRange(preset: PeriodPreset): { startDate: string; endDate: string } {
	const today = todayTashkent();
	switch (preset) {
		case 'today':
			return { startDate: today, endDate: today };
		case 'week':
			return { startDate: addDays(today, -6), endDate: today };
		case 'month30':
			return { startDate: addDays(today, -29), endDate: today };
		case 'thisMonth':
			return { startDate: monthStart(today), endDate: today };
		case 'lastMonth':
			return { startDate: monthStart(today, -1), endDate: addDays(monthStart(today), -1) };
	}
}
