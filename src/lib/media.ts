const MEDIA_BASE_URL = import.meta.env.VITE_API_BASE_URL_WITHOUT_VERSION ?? '';

/** Resolves a relative media path (e.g. `/assets/company_logos/...`) returned by the API into an absolute URL. */
export function resolveMediaUrl(path?: string | null): string | undefined {
	if (!path) return undefined;
	if (/^https?:\/\//.test(path)) return path;
	return `${MEDIA_BASE_URL}${path}`;
}
