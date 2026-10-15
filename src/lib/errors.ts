import { isAxiosError } from 'axios';

type ApiErrorData = string | { detail?: string; [field: string]: unknown } | undefined;

function firstFieldError(data: Exclude<ApiErrorData, string | undefined>): string | undefined {
	for (const key of Object.keys(data)) {
		if (key === 'detail') continue;
		const value = data[key];
		if (typeof value === 'string') return value;
		if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
	}
	return undefined;
}

/** An error raised by the frontend whose message is written for the user. */
export class UserFacingError extends Error {}

/** Extracts a human-readable message from a DRF-style API error response, falling back to `fallback`. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof UserFacingError) return err.message;
	if (!isAxiosError(err)) return fallback;

	const data = err.response?.data as ApiErrorData;
	if (typeof data === 'string' && data.trim()) return data;
	if (data && typeof data === 'object') {
		if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
		const fieldError = firstFieldError(data);
		if (fieldError) return fieldError;
	}
	return fallback;
}
