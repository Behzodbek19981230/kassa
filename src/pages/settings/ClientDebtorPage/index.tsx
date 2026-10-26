import { createColumnHelper, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaDollarSign, FaExclamationTriangle, FaFilePdf, FaSyncAlt, FaUserClock } from 'react-icons/fa';
import {
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	Panel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useNotification,
} from '@/components/ui';
import { loadBlobIntoTab, openPendingTab } from '@/lib/blob';
import { getApiErrorMessage, getApiErrorMessageAsync } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import StatCard from '@/pages/TwoStageImport/components/StatCard';
import { clientService } from '@/services/client/client.service';
import { useClientDebtorListQuery } from '@/services/client-debtor/client-debtor.queries';
import { clientDebtorService } from '@/services/client-debtor/client-debtor.service';
import type { ClientDebtor, ClientDebtorFilterParams } from '@/services/client-debtor/client-debtor.types';
import { CLIENT_TYPE_OPTIONS, type ClientType } from '@/services/client/client.types';

const ALL = 'all';

const columnHelper = createColumnHelper<ClientDebtor>();

function formatDate(value: string | null) {
	if (!value) return '';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleDateString('ru-RU');
}

export default function ClientDebtorPage() {
	const { notify } = useNotification();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 100 });
	const [type, setType] = useState('');
	const [client, setClient] = useState('');
	const [isExporting, setIsExporting] = useState(false);

	const filterParams: ClientDebtorFilterParams = {
		type: (type || undefined) as ClientType | undefined,
		client: client ? Number(client) : undefined,
	};
	const hasFilters = Boolean(type || client);

	const { data, isLoading, isFetching, isError, error, refetch } = useClientDebtorListQuery({
		...filterParams,
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
	});

	const paginationMeta = data?.pagination;
	const summary = data?.summary;

	const loadClientOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await clientService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.fio })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	function resetPage() {
		setPagination((p) => ({ ...p, pageIndex: 0 }));
	}

	function handleClear() {
		setType('');
		setClient('');
		resetPage();
	}

	async function handleExportPdf() {
		const tab = openPendingTab();
		setIsExporting(true);
		try {
			const blob = await clientDebtorService.pdf(filterParams);
			loadBlobIntoTab(blob, tab);
		} catch (err) {
			tab?.close();
			notify({ title: 'Xatolik', text: await getApiErrorMessageAsync(err, "PDF yuklab bo'lmadi") });
		} finally {
			setIsExporting(false);
		}
	}

	const columns = [
		columnHelper.display({
			id: 'index',
			header: '#',
			size: 50,
			cell: ({ row }) => pagination.pageIndex * pagination.pageSize + row.index + 1,
		}),
		columnHelper.accessor('fio', {
			header: 'FIO',
			cell: (info) => <span className='font-semibold text-ca-theme'>{info.getValue()}</span>,
		}),
		columnHelper.accessor('type_name', { header: 'Mijoz turi', size: 180 }),
		columnHelper.accessor('total_debt', {
			header: 'Qarzi ($)',
			size: 150,
			cell: (info) => <span className='font-bold text-ca-red'>{formatNumber(info.getValue(), 2)}</span>,
		}),
		columnHelper.accessor('last_order_date', {
			header: 'Oxirgi buyurtma sanasi',
			size: 170,
			cell: (info) => <span className='text-ca-orange'>{formatDate(info.getValue())}</span>,
		}),
	];

	return (
		<Panel
			title="Qarzdorlar ro'yxati"
			actions={
				<Button type='button' variant='warning' size='xs' disabled={isExporting} onClick={handleExportPdf}>
					<FaFilePdf className='mr-1.5' /> {isExporting ? 'Yuklanmoqda...' : 'PDF Export qilish'}
				</Button>
			}
			onReload={() => refetch()}
		>
			<div className='mb-4 flex flex-wrap items-end gap-2'>
				<div className='w-full sm:w-64'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>Mijoz turi:</label>
					<Select
						value={type || ALL}
						onValueChange={(v) => {
							setType(v === ALL ? '' : v);
							resetPage();
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder='Mijoz turini tanlang' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>Barchasi</SelectItem>
							{CLIENT_TYPE_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className='w-full sm:w-72'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>Mijozni tanlang:</label>
					<Combobox
						clearable
						value={client}
						onChange={(v) => {
							setClient(v);
							resetPage();
						}}
						loadOptions={loadClientOptions}
						placeholder='Mijozni tanlang'
						searchPlaceholder='Qidirish...'
					/>
				</div>
				<Button type='button' variant='white' size='sm' disabled={!hasFilters} onClick={handleClear}>
					<FaSyncAlt className='mr-1.5' /> Filterni tozalash
				</Button>
			</div>

			<div className='-mx-2.5 flex flex-wrap'>
				<StatCard
					icon={<FaUserClock />}
					label='Jami qarzdorlar soni'
					value={formatNumber(summary?.debtor_count ?? 0)}
				/>
				<StatCard
					icon={<FaDollarSign />}
					label='Jami qarz summasi ($)'
					value={<span className='text-ca-red'>{formatNumber(summary?.total_debt ?? 0, 2)}</span>}
					accent='danger'
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.results ?? []}
				manualPagination
				pageCount={paginationMeta?.lastPage ?? -1}
				totalRows={paginationMeta?.total}
				pagination={pagination}
				onPaginationChange={setPagination}
				enablePagination
				enableSorting={false}
				enableGlobalFilter={false}
				enableColumnFilters={false}
				enableColumnVisibility
				columnVisibilityKey='client-debtors'
				enableStriping
				isLoading={isLoading || isFetching}
				emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : "Ma'lumot topilmadi"}
				emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
			/>
		</Panel>
	);
}
