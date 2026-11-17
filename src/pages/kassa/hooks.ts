import { useState } from 'react';
import { useNotification } from '@/components/ui';
import { loadBlobIntoTab, openPendingTab } from '@/lib/blob';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessageAsync } from '@/lib/errors';
import type { DownloadedFile } from '@/services/cash-register/cash-register.service';

/** Name of the company whose kassa is shown. */
export function useCompanyName() {
	const { companyId, companies, ownCompany } = useCurrentCompany();
	return companies.find((c) => c.id === companyId)?.name ?? ownCompany?.name ?? '';
}

/** Opens a PDF in a new tab (the tab is opened synchronously so it isn't blocked as a popup). */
export function usePdfOpener() {
	const { notify } = useNotification();
	const [busy, setBusy] = useState(false);
	async function open(load: () => Promise<Blob>) {
		const tab = openPendingTab();
		setBusy(true);
		try {
			loadBlobIntoTab(await load(), tab);
		} catch (err) {
			tab?.close();
			notify({ title: 'Xatolik', text: await getApiErrorMessageAsync(err, "PDF yuklab bo'lmadi") });
		} finally {
			setBusy(false);
		}
	}
	return { open, busy };
}

/** Downloads an .xlsx returned by the API. */
export function useFileDownloader() {
	const { notify } = useNotification();
	const [busy, setBusy] = useState(false);
	async function download(load: () => Promise<DownloadedFile>) {
		setBusy(true);
		try {
			const { blob, filename } = await load();
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			link.remove();
			setTimeout(() => URL.revokeObjectURL(url), 10_000);
		} catch (err) {
			notify({ title: 'Xatolik', text: await getApiErrorMessageAsync(err, "Faylni yuklab bo'lmadi") });
		} finally {
			setBusy(false);
		}
	}
	return { download, busy };
}
