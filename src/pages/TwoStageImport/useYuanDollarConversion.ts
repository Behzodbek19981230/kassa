import { useCurrentCompany } from '@/lib/company';

function convert(value: string, factor: number): string | null {
	if (!factor || !Number.isFinite(factor)) return null;
	if (value === '') return '';
	const num = Number(value);
	if (Number.isNaN(num)) return null;
	// Round to 2 decimals (what PriceInput accepts) and drop trailing zeros.
	return String(Number((num * factor).toFixed(2)));
}

/**
 * Converts between paired ¥ / $ price fields using today's yuan rate (dollars per 1 yuan).
 * Each converter returns null when no rate is set yet — the caller then leaves the other field alone.
 */
export function useYuanDollarConversion() {
	const { yuanExchangeRate } = useCurrentCompany();
	const dollarPerYuan = Number(yuanExchangeRate?.dollar_per_yuan ?? 0);

	return {
		yuanToDollar: (yuan: string) => convert(yuan, dollarPerYuan),
		dollarToYuan: (dollar: string) => convert(dollar, dollarPerYuan ? 1 / dollarPerYuan : 0),
	};
}
