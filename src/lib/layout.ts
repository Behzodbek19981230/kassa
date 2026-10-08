// Layout for pages where the table scrolls inside its panel instead of the whole page.
// Use them as: <Panel className={SCROLL_PANEL_CLASS} bodyClassName={SCROLL_BODY_CLASS}>, with filters and totals
// as the first children and the table wrapped in <div className={SCROLL_AREA_CLASS}>.
// On desktop each panel is as tall as the viewport below the header; on small screens panels stack.
export const SCROLL_PANEL_CLASS = 'mb-0 flex h-full flex-col lg:h-[calc(100vh-10rem)]';
export const SCROLL_BODY_CLASS = 'flex min-h-0 flex-1 flex-col';
// The scroll area keeps the table header in view (sticky) and is capped on small screens.
export const SCROLL_AREA_CLASS =
	'min-h-0 flex-1 overflow-auto max-h-[60vh] lg:max-h-none [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10';
