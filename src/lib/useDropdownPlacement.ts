import { useEffect, useSyncExternalStore, type RefObject } from 'react';

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

function useIsTablet() {
	return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * Radix popper props for select/combobox dropdowns. On tablets the list prefers opening below
 * the field (see useScrollTriggerIntoView, which makes room for it above the on-screen
 * keyboard); on desktop Radix keeps its default placement.
 */
export function useDropdownPlacement() {
	return useIsTablet() ? { side: 'bottom' as const, collisionPadding: 8 } : {};
}

/**
 * On tablets, when a searchable dropdown opens its on-screen keyboard covers the lower half
 * of the screen. The viewport meta (`interactive-widget=resizes-content`) shrinks the layout
 * viewport to what is visible; this scrolls the field to the top of that area so the options
 * have room to open below it instead of flipping above.
 */
export function useScrollTriggerIntoView(open: boolean, triggerRef: RefObject<HTMLElement | null>) {
	const isTablet = useIsTablet();
	useEffect(() => {
		if (!open || !isTablet) return;
		const id = window.setTimeout(() => {
			triggerRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
		}, 300);
		return () => window.clearTimeout(id);
	}, [open, isTablet, triggerRef]);
}
