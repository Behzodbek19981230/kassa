import { useSyncExternalStore } from 'react';

// Touch devices narrower than Tailwind's `lg` (tablets/phones).
const TABLET_QUERY = '(max-width: 1023px), (pointer: coarse)';

function subscribe(listener: () => void) {
	const mq = window.matchMedia(TABLET_QUERY);
	mq.addEventListener('change', listener);
	return () => mq.removeEventListener('change', listener);
}

function getSnapshot() {
	return window.matchMedia(TABLET_QUERY).matches;
}

/**
 * Radix popper props for select/combobox dropdowns. On tablets the list always opens below
 * the field (no flip to the top when space is tight — the page scrolls instead); on desktop
 * Radix keeps its default collision-aware placement.
 */
export function useDropdownPlacement() {
	const isTablet = useSyncExternalStore(subscribe, getSnapshot, () => false);
	return isTablet ? { side: 'bottom' as const, avoidCollisions: false } : {};
}
