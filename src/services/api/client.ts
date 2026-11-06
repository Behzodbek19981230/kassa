import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getRefreshToken, getToken } from '@/lib/auth';
import { forceLocalLogout, logoutReasonFor, refreshAccessToken } from '@/lib/session';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://178.212.12.22:8000/api/v1';

export const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 30_000, // 30 seconds
});

apiClient.interceptors.request.use((config) => {
	const token = getToken();
	if (token) {
		config.headers.set('Authorization', `Bearer ${token}`);
	}
	return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };
type AuthErrorBody = { code?: string; detail?: string };

/**
 * Auth endpoints whose 401 is handled by the caller: wrong credentials on login, and logout()
 * clears the session itself whatever the server answers.
 */
const NO_REFRESH_URLS = ['/auth/token/', '/auth/token/refresh/', '/auth/logout/'];

/** Error bodies of `responseType: 'blob'` requests arrive as a Blob, so they are parsed here. */
async function readErrorBody(data: unknown): Promise<AuthErrorBody> {
	try {
		if (data instanceof Blob) return JSON.parse(await data.text()) as AuthErrorBody;
		if (data && typeof data === 'object') return data as AuthErrorBody;
	} catch {
		// not JSON
	}
	return {};
}

apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (!axios.isAxiosError(error) || error.response?.status !== 401) return Promise.reject(error);

		const config = error.config as RetriableConfig | undefined;
		if (NO_REFRESH_URLS.includes(config?.url ?? '')) return Promise.reject(error);

		const { code, detail } = await readErrorBody(error.response.data);

		// An expired access token (15 min): refresh it and repeat the request once, silently.
		// A body without a code (non-JSON) is treated the same way.
		const tokenExpired = code === 'token_not_valid' || code === undefined;
		if (tokenExpired && config && !config._retried && getRefreshToken()) {
			config._retried = true;
			try {
				// The token may already have been refreshed while this request was in flight:
				// then it is just repeated with the new one, without another refresh.
				const current = getToken();
				const sentWith = String(config.headers.get('Authorization') ?? '');
				const access = current && sentWith !== `Bearer ${current}` ? current : await refreshAccessToken(true);
				if (access) {
					config.headers.set('Authorization', `Bearer ${access}`);
					return apiClient(config);
				}
			} catch {
				// refreshAccessToken already logged out if the refresh token itself was rejected
			}
			return Promise.reject(error);
		}

		// session_expired / session_invalid / user_inactive, or a repeated request that got 401 again.
		// The backend's text is shown only for these session codes; token errors get the default message.
		const reason = logoutReasonFor(code);
		forceLocalLogout(reason, reason === 'unauthorized' ? undefined : detail);
		return Promise.reject(error);
	},
);
