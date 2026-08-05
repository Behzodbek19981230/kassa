import { createColumnHelper, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { FaExclamationTriangle, FaExpand, FaTrash, FaUndo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, DataTable, DatePicker, Panel } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import { useWarehouseTransferListQuery } from '@/services/warehouse-transfer/warehouse-transfer.queries';
import type {
	WarehouseTransfer,
	WarehouseTransferStatus,
} from '@/services/warehouse-transfer/warehouse-transfer.types';
import ReverseTransferModal from '@/pages/WarehouseTransferDetailPage/components/ReverseTransferModal';

const STATUS_LABEL: Record<WarehouseTransferStatus, string> = {
	completed: 'Bajarilgan',
	reversed: 'Bekor qilingan',
	reverse: 'Bekor qilish transferi',
};

const STATUS_VARIANT: Record<WarehouseTransferStatus, 'success' | 'default' | 'warning'> = {
	completed: 'success',
	reversed: 'default',
	reverse: 'warning',
};

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

const historyColumnHelper = createColumnHelper<WarehouseTransfer>();

export default function TransferHistoryTab() {
	const navigate = useNavigate();
	const { canWrite } = useCurrentCompany();

	const [historyPagination, setHistoryPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [historyColumnFilters, setHistoryColumnFilters] = useState<ColumnFiltersState>([]);
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [reverseTransfer, setReverseTransfer] = useState<WarehouseTransfer | null>(null);

	const { data: skladTypesData } = useSkladTypeListQuery({ limit: 100 });

	const skladTypeFilterOptions = useMemo(
		() => (skladTypesData?.results ?? []).map((t) => ({ value: String(t.id), label: t.name })),
		[skladTypesData],
	);

	const fromFilter = historyColumnFilters.find((f) => f.id === 'from_type_sklad')?.value as string | undefined;
	const toFilter = historyColumnFilters.find((f) => f.id === 'to_type_sklad')?.value as string | undefined;
	const statusFilter = historyColumnFilters.find((f) => f.id === 'status')?.value as string | undefined;

	const {
		data: historyData,
		isLoading: isHistoryLoading,
		isFetching: isHistoryFetching,
		isError: isHistoryError,
		error: historyError,
		refetch: refetchHistory,
	} = useWarehouseTransferListQuery({
		page: historyPagination.pageIndex + 1,
		limit: historyPagination.pageSize,
		from_type_sklad: fromFilter ? Number(fromFilter) : undefined,
		to_type_sklad: toFilter ? Number(toFilter) : undefined,
		status: (statusFilter as WarehouseTransferStatus) || undefined,
		date_from: dateFrom || undefined,
		date_to: dateTo || undefined,
	});
	const historyResults = historyData?.results ?? [];
	const historyMeta = historyData?.pagination;

	const historyColumns = useMemo(
		() => [
			historyColumnHelper.display({
				id: 'index',
				header: '#',
				size: 50,
				enableColumnFilter: false,
				cell: ({ row }) => historyPagination.pageIndex * historyPagination.pageSize + row.index + 1,
			}),
			historyColumnHelper.accessor('created_time', {
				header: 'Sana',
				size: 100,
				enableColumnFilter: false,
				cell: (info) =>
					new Date(info.getValue()).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' }),
			}),
			historyColumnHelper.accessor('from_type_sklad', {
				header: 'Qayerdan',
				cell: (info) => info.row.original.from_type_sklad_detail?.name ?? '',
				meta: { filterVariant: 'select', filterOptions: skladTypeFilterOptions, filterPlaceholder: 'Barchasi' },
			}),
			historyColumnHelper.accessor('to_type_sklad', {
				header: 'Qayerga',
				cell: (info) => info.row.original.to_type_sklad_detail?.name ?? '',
				meta: { filterVariant: 'select', filterOptions: skladTypeFilterOptions, filterPlaceholder: 'Barchasi' },
			}),
			historyColumnHelper.accessor('items_count', {
				header: 'Tovarlar soni',
				size: 110,
				enableColumnFilter: false,
			}),
			historyColumnHelper.display({
				id: 'created_by',
				header: 'Foydalanuvchi',
				enableColumnFilter: false,
				cell: ({ row }) => {
					const u = row.original.created_by_detail;
					return u ? userLabel(u) : '';
				},
			}),

			historyColumnHelper.accessor('is_confirmed', {
				header: 'Chiqarilishi tasdiqlangan',
				enableColumnFilter: false,
				cell: (info) => (
					<Badge variant={info.getValue() ? 'success' : 'default'}>
						{info.getValue() ? 'Bajarildi' : 'Jarayonda'}
					</Badge>
				),
			}),
			historyColumnHelper.display({
				id: 'confirmed_by',
				header: 'Kim tasdiqladi',
				enableColumnFilter: false,
				cell: ({ row }) => {
					const u = row.original.confirmed_by_detail;
					return u ? userLabel(u) : '';
				},
			}),
			historyColumnHelper.accessor('confirmed_at', {
				header: 'Tasdiqlangan vaqti',
				enableColumnFilter: false,
				cell: (info) => {
					const value = info.getValue();
					return value
						? new Date(value).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
						: '';
				},
			}),
			historyColumnHelper.accessor('confirmation_note', {
				header: 'Tasdiqlash izohi',
				enableColumnFilter: false,
				cell: (info) => info.getValue() ?? '',
			}),
			historyColumnHelper.display({
				id: 'actions',
				header: 'Harakatlar',
				meta: { align: 'right' },
				enableColumnFilter: false,
				size: 170,
				cell: ({ row }) => (
					<div className='flex justify-end gap-1.5'>
						<Button
							type='button'
							variant='info'
							size='icon'
							aria-label='Batafsil'
							onClick={() => navigate(`/warehouse-transfer/${row.original.id}`)}
						>
							<FaExpand />
						</Button>
						{canWrite && row.original.status === 'completed' && !row.original.is_confirmed && (
							<Button
								type='button'
								variant='danger'
								size='icon'
								aria-label='Bekor qilish'
								onClick={() => setReverseTransfer(row.original)}
							>
								<FaTrash />
							</Button>
						)}
					</div>
				),
			}),
		],
		[skladTypeFilterOptions, navigate, canWrite, historyPagination],
	);

	return (
		<>
			<Panel title='Transfer tarixi' onReload={() => refetchHistory()}>
				<div className='mb-4 flex flex-wrap items-end gap-3'>
					<div>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Sanadan</label>
						<DatePicker value={dateFrom} onChange={setDateFrom} />
					</div>
					<div>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Sanagacha</label>
						<DatePicker value={dateTo} onChange={setDateTo} />
					</div>
					{(dateFrom || dateTo) && (
						<Button
							type='button'
							variant='default'
							size='sm'
							onClick={() => {
								setDateFrom('');
								setDateTo('');
							}}
						>
							Tozalash
						</Button>
					)}
				</div>

				<DataTable
					columns={historyColumns}
					data={historyResults}
					manualPagination
					manualFiltering
					pageCount={historyMeta?.lastPage ?? -1}
					totalRows={historyMeta?.total}
					pagination={historyPagination}
					onPaginationChange={setHistoryPagination}
					columnFilters={historyColumnFilters}
					onColumnFiltersChange={(filters) => {
						setHistoryColumnFilters(filters);
						setHistoryPagination((p) => ({ ...p, pageIndex: 0 }));
					}}
					enablePagination
					enableGlobalFilter={false}
					enableColumnFilters
					enableColumnVisibility
					columnVisibilityKey='warehouse-transfer-history'
					enableSorting={false}
					enableStriping
					isLoading={isHistoryLoading || isHistoryFetching}
					emptyMessage={
						isHistoryError ? getApiErrorMessage(historyError, 'Xatolik yuz berdi') : "Ma'lumot topilmadi"
					}
					emptyIcon={isHistoryError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>

			{reverseTransfer && (
				<ReverseTransferModal
					open={Boolean(reverseTransfer)}
					setOpen={(open) => !open && setReverseTransfer(null)}
					transfer={reverseTransfer}
					onReversed={() => {
						setReverseTransfer(null);
						refetchHistory();
					}}
				/>
			)}
		</>
	);
}
