import { apiClient } from '@/services/api/client';
import type {
	CashClosingDetail,
	CashClosingListParams,
	CashClosingListResponse,
	CashClosingPayload,
	CashMovementsParams,
	CashMovementsResponse,
	CashRegisterCurrent,
	CashRegisterDaily,
	CashRegisterSummary,
	CashRegisterType,
} from '@/services/cash-register/cash-register.types';

/** A downloaded file: the server's name from Content-Disposition when it is exposed, else `fallbackName`. */
export interface DownloadedFile {
	blob: Blob;
	filename: string;
}

function filenameFrom(disposition: unknown, fallbackName: string) {
	if (typeof disposition !== 'string') return fallbackName;
	const utf = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
	if (utf) return decodeURIComponent(utf[1]);
	const plain = /filename="?([^";]+)"?/i.exec(disposition);
	return plain?.[1] ?? fallbackName;
}

async function getFile(url: string, fallbackName: string, params?: object): Promise<DownloadedFile> {
	const response = await apiClient.get<Blob>(url, { params, responseType: 'blob', timeout: 120_000 });
	return { blob: response.data, filename: filenameFrom(response.headers['content-disposition'], fallbackName) };
}

async function getPdf(url: string, params?: object): Promise<Blob> {
	const { data } = await apiClient.get<Blob>(url, { params, responseType: 'blob', timeout: 120_000 });
	return data;
}

/**
 * Every kassa read takes the kassa `user_type` (1 Do'kon, 2 Sklad, 3 Dastavka). Super Admin / Admin must send it;
 * any other role gets their own type (asking for another one is a 403).
 */
export const cashRegisterService = {
	summary: async () => {
		const { data } = await apiClient.get<CashRegisterSummary>('/cash-register/summary/');
		return data;
	},

	current: async (userType: CashRegisterType) => {
		const { data } = await apiClient.get<CashRegisterCurrent>('/cash-register/current/', {
			params: { user_type: userType },
		});
		return data;
	},
	currentPdf: (userType: CashRegisterType) => getPdf('/cash-register/current/pdf/', { user_type: userType }),

	daily: async (userType: CashRegisterType, date?: string) => {
		const { data } = await apiClient.get<CashRegisterDaily>('/cash-register/daily/', {
			params: date ? { user_type: userType, date } : { user_type: userType },
		});
		return data;
	},
	dailyPdf: (userType: CashRegisterType, date: string) =>
		getPdf('/cash-register/daily/pdf/', { user_type: userType, date }),
	dailyExcel: (userType: CashRegisterType, date: string) =>
		getFile('/cash-register/daily/excel/', `kassa-kun-${date.replaceAll('-', '')}.xlsx`, { user_type: userType, date }),

	movements: async (params: CashMovementsParams) => {
		const { data } = await apiClient.get<CashMovementsResponse>('/cash-register/movements/', { params });
		return data;
	},
	movementsExcel: (params: Pick<CashMovementsParams, 'user_type' | 'kind' | 'closing' | 'created_by'>) =>
		getFile('/cash-register/movements/excel/', 'kassa-harakatlar.xlsx', params),

	closingList: async (params?: CashClosingListParams) => {
		const { data } = await apiClient.get<CashClosingListResponse>('/cash-closing/', { params });
		return data;
	},
	closingDetail: async (id: number) => {
		const { data } = await apiClient.get<CashClosingDetail>(`/cash-closing/${id}/`);
		return data;
	},
	createClosing: async (payload: CashClosingPayload) => {
		const { data } = await apiClient.post<CashClosingDetail>('/cash-closing/', payload);
		return data;
	},
	cancelClosing: async (id: number, reason: string) => {
		const { data } = await apiClient.post<CashClosingDetail>(`/cash-closing/${id}/cancel/`, { reason });
		return data;
	},
	closingPdf: (id: number) => getPdf(`/cash-closing/${id}/pdf/`),
	closingExcel: (id: number, number?: number) =>
		getFile(`/cash-closing/${id}/excel/`, `kassa-akt-${number ?? id}.xlsx`),
};
