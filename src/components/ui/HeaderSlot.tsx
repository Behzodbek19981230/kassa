import { createContext, type ReactNode, useContext } from 'react';
import { createPortal } from 'react-dom';

/** The element in the enclosing Panel/Modal header where table controls (per page, "Ustunlar") are rendered. */
export const HeaderSlotContext = createContext<HTMLElement | null>(null);

/**
 * Renders children in the rightmost spot of the enclosing Panel's or Modal's header. Outside both,
 * the children render in place (wrapped in `inlineClassName` when given).
 */
export function PanelHeaderAction({ children, inlineClassName }: { children: ReactNode; inlineClassName?: string }) {
	const slot = useContext(HeaderSlotContext);
	if (slot) return createPortal(children, slot);
	return inlineClassName ? <div className={inlineClassName}>{children}</div> : <>{children}</>;
}
