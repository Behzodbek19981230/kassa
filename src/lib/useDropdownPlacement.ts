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

/**
 * Height of the on-screen keyboard (px) covering the page. Chrome Android often only shrinks the
 * *visual* viewport when the keyboard opens, leaving the layout viewport (and so Radix's
 * collision detection and `fixed` overlays) full height — the gap between the two is the keyboard.
 */
function subscribeKeyboard(listener: () => void) {
	const vv = window.visualViewport;
	if (!vv) return () => {};
	vv.addEventListener('resize', listener);
	vv.addEventListener('scroll', listener);
	return () => {
		vv.removeEventListener('resize', listener);
		vv.removeEventListener('scroll', listener);
	};
}

function getKeyboardInset() {
	const vv = window.visualViewport;
	if (!vv) return 0;
	const inset = Math.round(window.innerHeight - vv.height - vv.offsetTop);
	// ignore browser-chrome jitter; a real keyboard is at least ~150px tall
	return inset > 120 ? inset : 0;
}

export function useKeyboardInset() {
	return useSyncExternalStore(subscribeKeyboard, getKeyboardInset, () => 0);
}

/** Keeps the `--kb-inset` CSS variable in sync so non-React-aware CSS (modal overlays) can avoid the keyboard. */
export function useKeyboardInsetCssVar() {
	const inset = useKeyboardInset();
	useEffect(() => {
		document.documentElement.style.setProperty('--kb-inset', `${inset}px`);
	}, [inset]);
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
	const isTablet = useIsTablet();
	const keyboardInset = useKeyboardInset();
	const collisionPadding = { top: 8, left: 8, right: 8, bottom: 8 + keyboardInset };
	return isTablet ? { side: 'bottom' as const, collisionPadding } : { collisionPadding };
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
