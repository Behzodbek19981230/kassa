/** Formats a number (or numeric string) with space thousand separators, for display. */
export function formatNumber(value: number | string | null | undefined, decimals?: number): string {
	if (value === null || value === undefined || value === '') return '';
	const num = Number(value);
	if (Number.isNaN(num)) return String(value);

	const fixed = decimals !== undefined ? num.toFixed(decimals) : String(num);
	const [intPart, decPart] = fixed.split('.');
	const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	return decPart !== undefined ? `${grouped}.${decPart}` : grouped;
}
