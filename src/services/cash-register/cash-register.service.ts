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

export const cashRegisterService = {
	current: async () => {
		const { data } = await apiClient.get<CashRegisterCurrent>('/cash-register/current/');
		return data;
	},
	currentPdf: () => getPdf('/cash-register/current/pdf/'),

	daily: async (date?: string) => {
		const { data } = await apiClient.get<CashRegisterDaily>('/cash-register/daily/', {
			params: date ? { date } : undefined,
		});
		return data;
	},
	dailyPdf: (date: string) => getPdf('/cash-register/daily/pdf/', { date }),
	dailyExcel: (date: string) =>
		getFile('/cash-register/daily/excel/', `kassa-kun-${date.replaceAll('-', '')}.xlsx`, { date }),

	movements: async (params: CashMovementsParams) => {
		const { data } = await apiClient.get<CashMovementsResponse>('/cash-register/movements/', { params });
		return data;
	},
	movementsExcel: (params: Pick<CashMovementsParams, 'kind' | 'closing'>) =>
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
