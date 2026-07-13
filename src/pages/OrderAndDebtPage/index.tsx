import { useState } from 'react';
import { FaFilePdf } from 'react-icons/fa';
import {
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DatePicker,
	Panel,
	Tabs,
	useNotification,
} from '@/components/ui';
import { openBlobInNewTab } from '@/lib/blob';
import { clientService } from '@/services/client/client.service';
import { useOrderAndDebtListQuery } from '@/services/order-account-history/order-account-history.queries';
import { orderAccountHistoryService } from '@/services/order-account-history/order-account-history.service';
import type { OrderAndDebtItem } from '@/services/order-account-history/order-account-history.types';
import { roleService } from '@/services/role/role.service';
import MainTab from '@/pages/OrderAndDebtPage/components/MainTab';
import WorkerTypeTab from '@/pages/OrderAndDebtPage/components/WorkerTypeTab';

interface FilterState {
	client: string;
	userType: string;
	startDate: string;
	endDate: string;
}

const emptyFilters: FilterState = { client: '', userType: '', startDate: '', endDate: '' };

export default function OrderAndDebtPage() {
	const { notify } = useNotification();
	const [activeTab, setActiveTab] = useState<'main' | 'worker'>('main');
	const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
	const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);
	const [downloadingPdf, setDownloadingPdf] = useState<'pdf1' | 'pdf2' | 'pdf3' | null>(null);

	const hasAppliedFilters = Object.values(appliedFilters).some(Boolean);

	const { data, isLoading, isFetching, isError } = useOrderAndDebtListQuery({
		client: appliedFilters.client ? Number(appliedFilters.client) : undefined,
		user_type: appliedFilters.userType || undefined,
		start_date: appliedFilters.startDate || undefined,
		end_date: appliedFilters.endDate || undefined,
		active_tab: activeTab,
		limit: 200,
	});

	const results = data?.results;

	const loadClientOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await clientService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.fio })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadUserTypeOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await roleService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((r) => ({ value: String(r.id), label: r.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	function handleSearch() {
		setAppliedFilters(draftFilters);
	}

	function handleClear() {
		setDraftFilters(emptyFilters);
		setAppliedFilters(emptyFilters);
	}

	async function handlePrintItem(item: OrderAndDebtItem) {
		const url = item.actions.print_client_url;
		if (!url) return;
		try {
			const blob = await orderAccountHistoryService.printByUrl(url);
			openBlobInNewTab(blob);
		} catch {
			notify({ title: 'Xatolik', text: "PDF yuklab bo'lmadi" });
		}
	}

	async function handleDownloadPdf(kind: 'pdf1' | 'pdf2' | 'pdf3') {
		const url =
			kind === 'pdf1'
				? data?.pdf_actions.pdf1_url
				: kind === 'pdf2'
					? data?.pdf_actions.pdf2_account_url
					: data?.pdf_actions.pdf3_worker_type_url;
		if (!url) return;

		setDownloadingPdf(kind);
		try {
			const blob = await orderAccountHistoryService.printByUrl(url);
			openBlobInNewTab(blob);
		} catch {
			notify({ title: 'Xatolik', text: "PDF yuklab bo'lmadi" });
		} finally {
			setDownloadingPdf(null);
		}
	}

	return (
		<Panel
			title='Buyurtmalar va qarzlar'
			actions={
				<div className='flex flex-wrap items-center gap-2'>
					<Button
						type='button'
						variant='warning'
						size='xs'
						disabled={downloadingPdf === 'pdf1'}
						onClick={() => handleDownloadPdf('pdf1')}
					>
						<FaFilePdf className='mr-1.5' /> PDF1
					</Button>
					<Button
						type='button'
						variant='danger'
						size='xs'
						disabled={downloadingPdf === 'pdf2'}
						onClick={() => handleDownloadPdf('pdf2')}
					>
						<FaFilePdf className='mr-1.5' /> PDF2 Hisob uchun
					</Button>
					<Button
						type='button'
						variant='info'
						size='xs'
						disabled={downloadingPdf === 'pdf3'}
						onClick={() => handleDownloadPdf('pdf3')}
					>
						<FaFilePdf className='mr-1.5' /> PDF3 Hodim turi
					</Button>
				</div>
			}
		>
			<div className='mb-4 flex flex-wrap items-end gap-2'>
				<div className='w-48'>
					<Combobox
						clearable
						value={draftFilters.client}
						onChange={(v) => setDraftFilters((f) => ({ ...f, client: v }))}
						loadOptions={loadClientOptions}
						placeholder='Mijoz tanlang'
						searchPlaceholder='Qidirish...'
					/>
				</div>
				<div className='w-48'>
					<Combobox
						clearable
						value={draftFilters.userType}
						onChange={(v) => setDraftFilters((f) => ({ ...f, userType: v }))}
						loadOptions={loadUserTypeOptions}
						placeholder='Hodim turi tanlang'
						searchPlaceholder='Qidirish...'
					/>
				</div>
				<div className='w-40'>
					<DatePicker
						value={draftFilters.startDate}
						onChange={(v) => setDraftFilters((f) => ({ ...f, startDate: v }))}
						placeholder='Boshlanish sana'
					/>
				</div>
				<div className='w-40'>
					<DatePicker
						value={draftFilters.endDate}
						onChange={(v) => setDraftFilters((f) => ({ ...f, endDate: v }))}
						placeholder='Tugash sana'
					/>
				</div>
				<Button type='button' variant='info' size='sm' onClick={handleSearch}>
					Qidirish
				</Button>
				<Button type='button' variant='white' size='sm' disabled={!hasAppliedFilters} onClick={handleClear}>
					Tozalash
				</Button>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as 'main' | 'worker')}
				items={[
					{
						value: 'main',
						label: 'Umumiy hisobot',
						content: (
							<MainTab
								groups={results?.groups ?? []}
								items={results?.items ?? []}
								isLoading={isLoading || isFetching}
								isError={isError}
								onPrint={handlePrintItem}
							/>
						),
					},
					{
						value: 'worker',
						label: "Hodim turi bo'yicha",
						content: (
							<WorkerTypeTab
								groups={results?.worker_type_groups ?? []}
								isLoading={isLoading || isFetching}
								isError={isError}
								onPrint={handlePrintItem}
							/>
						),
					},
				]}
			/>
		</Panel>
	);
}
