import { useRef } from 'react';

function newUuid() {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
	// crypto.randomUUID needs a secure context (https/localhost); fall back to a v4 UUID from getRandomValues.
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Idempotency key for payments/adjustments. Submitting the same form contents again after a failed
 * request (timeout, network error) reuses the previous key, so the backend can't record it twice.
 * Any change to the contents, or a successful save (`reset`), starts a new operation with a new key.
 */
export function useIdempotencyKey() {
	const pending = useRef<{ fingerprint: string; key: string } | null>(null);

	return {
		keyFor(contents: unknown) {
			const fingerprint = JSON.stringify(contents);
			if (pending.current?.fingerprint !== fingerprint) {
				pending.current = { fingerprint, key: newUuid() };
			}
			return pending.current.key;
		},
		reset() {
			pending.current = null;
		},
	};
}
