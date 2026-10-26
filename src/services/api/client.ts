import axios, { type InternalAxiosRequestConfig } from 'axios';
import { clearSession, getRefreshToken, getToken } from '@/lib/auth';
import { forceLocalLogout, refreshAccessToken } from '@/lib/session';

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

/** Auth endpoints whose 401 means bad credentials/tokens, never "refresh and retry". */
const NO_REFRESH_URLS = ['/auth/token/', '/auth/token/refresh/', '/auth/logout/'];

apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (!axios.isAxiosError(error) || error.response?.status !== 401) return Promise.reject(error);

		const config = error.config as RetriableConfig | undefined;
		// logout() clears the session itself, whatever the server answers.
		if (config?.url === '/auth/logout/') return Promise.reject(error);
		const code = (error.response.data as { code?: string } | undefined)?.code;

		// The session itself is over (idle or unknown sid): a refresh can't bring it back.
		if (code === 'session_expired' || code === 'session_invalid') {
			forceLocalLogout(code);
			return Promise.reject(error);
		}

		// Most likely just an expired access token: refresh once and repeat the request.
		const canRefresh =
			config && !config._retried && getRefreshToken() && !NO_REFRESH_URLS.includes(config.url ?? '');
		if (canRefresh) {
			config._retried = true;
			try {
				const access = await refreshAccessToken(true);
				if (access) {
					config.headers.set('Authorization', `Bearer ${access}`);
					return apiClient(config);
				}
			} catch {
				// refreshAccessToken already logged out
			}
			return Promise.reject(error);
		}

		if (config?.url !== '/auth/token/') {
			clearSession();
			if (window.location.pathname !== '/login') {
				window.location.assign('/login');
			}
		}
		return Promise.reject(error);
	},
);
