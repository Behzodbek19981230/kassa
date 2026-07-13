/**
 * Opens a blank tab synchronously (call this first, inside the click handler,
 * before any `await`) so browsers still treat it as a user-initiated popup.
 */
export function openPendingTab(): Window | null {
	return window.open('', '_blank');
}

/** Points a tab opened via `openPendingTab` at the given blob once it's ready. */
export function loadBlobIntoTab(blob: Blob, tab: Window | null) {
	const url = URL.createObjectURL(blob);
	if (tab) {
		tab.location.href = url;
	} else {
		window.open(url, '_blank');
	}
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
