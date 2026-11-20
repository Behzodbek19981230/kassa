import { API_BASE_URL, apiClient } from '@/services/api/client';
import type {
	PayrollListResponse,
	PayrollSummaryParams,
	PayrollSummaryResponse,
	PayrollTransaction,
	PayrollTransactionCreateResponse,
	PayrollTransactionListParams,
	PayrollTransactionPayload,
	SalaryRateUpdatePayload,
	UserSalaryHistory,
	UserSalaryHistoryListParams,
} from '@/services/payroll/payroll.types';

const API_PATH_PREFIX = new URL(API_BASE_URL).pathname.replace(/\/$/, '');

/** Query values for a PDF export: null / '' / [] drop the key from `export_url`, an array is sent comma-separated. */
export type PdfExportParams = Record<string, string | number | number[] | null | undefined>;

/**
 * Fetches a PDF from a backend `export_url` (it needs the JWT, so it can't simply be opened in a tab).
 * `params` override the filters already in the URL. Error bodies arrive as a Blob (see getApiErrorMessageAsync).
 */
async function fetchPdf(exportUrl: string, params: PdfExportParams = {}) {
	const url = new URL(exportUrl, API_BASE_URL);
	for (const [key, value] of Object.entries(params)) {
		if (value == null || value === '' || (Array.isArray(value) && !value.length)) url.searchParams.delete(key);
		else url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
	}
	const path = url.pathname.startsWith(API_PATH_PREFIX) ? url.pathname.slice(API_PATH_PREFIX.length) : url.pathname;
	const { data } = await apiClient.get(`${path}${url.search}`, { responseType: 'blob' });
	return data as Blob;
}

export const payrollService = {
	/**
	 * `GET /payroll/export/pdf/` through the `export_url` of `GET /user/`. `month: null` → the whole year
	 * (a future year answers 400). `users` (empty → every employee of the tab) and `search: null`
	 * (drops the tab's search) are optional.
	 */
	exportEmployeesPdf: (
		exportUrl: string,
		params: { year: number; month: number | null; users?: number[]; search?: string | null },
	) => fetchPdf(exportUrl, params),
	/**
	 * `GET /payroll-transaction/export/pdf/` through the `export_url` of `GET /payroll-transaction/`:
	 * no params → the list as on screen; `{ month: null }` → the whole year, grouped by month.
	 */
	exportTransactionsPdf: (exportUrl: string, params?: PdfExportParams) => fetchPdf(exportUrl, params),

	summary: async (params: PayrollSummaryParams) => {
		const { data } = await apiClient.get<PayrollSummaryResponse>('/payroll/summary/', { params });
		return data;
	},

	listTransactions: async (params: PayrollTransactionListParams) => {
		const { data } = await apiClient.get<PayrollListResponse<PayrollTransaction>>('/payroll-transaction/', {
			params,
		});
		return data;
	},
	createTransaction: async (payload: PayrollTransactionPayload) => {
		const { data } = await apiClient.post<PayrollTransactionCreateResponse>('/payroll-transaction/', payload);
		return data;
	},

	deleteTransaction: async (id: number) => {
		await apiClient.delete(`/payroll-transaction/${id}/`);
	},

	updateRate: async (payload: SalaryRateUpdatePayload) => {
		const { data } = await apiClient.post<unknown>('/payroll/rate/update/', payload);
		return data;
	},
	listSalaryHistory: async (params: UserSalaryHistoryListParams) => {
		const { data } = await apiClient.get<PayrollListResponse<UserSalaryHistory>>('/user-salary-history/', {
			params,
		});
		return data;
	},
};
