export function formatUzPhone(value: string): string {
	const digits = value.replace(/\D/g, '').replace(/^998/, '').slice(0, 9);

	let formatted = '+998';
	if (digits.length > 0) formatted += ` ${digits.slice(0, 2)}`;
	if (digits.length > 2) formatted += ` ${digits.slice(2, 5)}`;
	if (digits.length > 5) formatted += ` ${digits.slice(5, 7)}`;
	if (digits.length > 7) formatted += ` ${digits.slice(7, 9)}`;

	return formatted;
}

export const UZ_PHONE_REGEX = /^\+998 \d{2} \d{3} \d{2} \d{2}$/;
