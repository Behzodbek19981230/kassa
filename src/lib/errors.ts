import { isAxiosError } from 'axios';

type ApiErrorData = string | { detail?: string; [field: string]: unknown } | undefined;

// Nested serializers return errors like `{ items: [{}, { count: ['...'] }] }`, so arrays and objects are walked depth-first.
function firstMessage(value: unknown): string | undefined {
	if (typeof value === 'string') return value.trim() || undefined;
	if (Array.isArray(value)) {
		for (const entry of value) {
			const message = firstMessage(entry);
			if (message) return message;
		}
		return undefined;
	}
	if (value && typeof value === 'object') {
		for (const entry of Object.values(value)) {
			const message = firstMessage(entry);
			if (message) return message;
		}
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
	// A crash returns Django's (or nginx's) HTML error page — never show the markup to the user.
	if (typeof data === 'string' && /^\s*</.test(data)) {
		const status = err.response?.status;
		return status ? `${fallback} (${status})` : fallback;
	}
	if (typeof data === 'string' && data.trim()) return data;
	if (data && typeof data === 'object') {
		const message = firstMessage(data.detail) ?? firstMessage(data);
		if (message) return message;
	}
	return fallback;
}

/** Like `getApiErrorMessage`, but also reads error bodies that arrive as a Blob (requests made with `responseType: 'blob'`). */
export async function getApiErrorMessageAsync(err: unknown, fallback: string): Promise<string> {
	if (isAxiosError(err) && err.response?.data instanceof Blob) {
		try {
			const parsed: unknown = JSON.parse(await err.response.data.text());
			const message = firstMessage((parsed as { detail?: unknown })?.detail) ?? firstMessage(parsed);
			if (message) return message;
		} catch {
			// Not JSON — fall through to the fallback.
		}
		return fallback;
	}
	return getApiErrorMessage(err, fallback);
}
