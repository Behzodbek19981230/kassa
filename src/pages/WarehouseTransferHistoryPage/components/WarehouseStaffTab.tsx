import { createColumnHelper, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { FaExclamationTriangle, FaFilePdf, FaList } from 'react-icons/fa';
import { Badge, Button, DataTable, DatePicker, Panel, useNotification } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { loadBlobIntoTab, openPendingTab } from '@/lib/blob';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import { useWarehouseTransferListQuery } from '@/services/warehouse-transfer/warehouse-transfer.queries';
import { warehouseTransferService } from '@/services/warehouse-transfer/warehouse-transfer.service';
import type {
	WarehouseTransfer,
	WarehouseTransferStatus,
} from '@/services/warehouse-transfer/warehouse-transfer.types';
import DispatchListModal from '@/pages/WarehouseTransferHistoryPage/components/DispatchListModal';

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

const staffColumnHelper = createColumnHelper<WarehouseTransfer>();

export default function WarehouseStaffTab() {
	const { notify } = useNotification();

	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [dispatchTransferId, setDispatchTransferId] = useState<number | null>(null);
	const [printingId, setPrintingId] = useState<number | null>(null);

	const { data: skladTypesData } = useSkladTypeListQuery({ limit: 100 });

	const skladTypeFilterOptions = useMemo(
		() => (skladTypesData?.results ?? []).map((t) => ({ value: String(t.id), label: t.name })),
		[skladTypesData],
	);

	const fromFilter = columnFilters.find((f) => f.id === 'from_type_sklad')?.value as string | undefined;
	const toFilter = columnFilters.find((f) => f.id === 'to_type_sklad')?.value as string | undefined;
	const statusFilter = columnFilters.find((f) => f.id === 'status')?.value as string | undefined;

	const {
		data: listData,
		isLoading,
		isFetching,
		isError,
		error,
		refetch,
	} = useWarehouseTransferListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		from_type_sklad: fromFilter ? Number(fromFilter) : undefined,
		to_type_sklad: toFilter ? Number(toFilter) : undefined,
		status: (statusFilter as WarehouseTransferStatus) || undefined,
		date_from: dateFrom || undefined,
		date_to: dateTo || undefined,
	});
	const results = listData?.results ?? [];
	const meta = listData?.pagination;

	const handlePrint = useCallback(
		async (id: number) => {
			const tab = openPendingTab();
			setPrintingId(id);
			try {
				const blob = await warehouseTransferService.printDispatchList(id);
				loadBlobIntoTab(blob, tab);
			} catch {
				tab?.close();
				notify({ title: 'Xatolik', text: "PDF yuklab bo'lmadi" });
			} finally {
				setPrintingId(null);
			}
		},
		[notify],
	);

	const columns = useMemo(
		() => [
			staffColumnHelper.accessor('cr_date', {
				header: 'Sana',
				size: 100,
				enableColumnFilter: false,
			}),
			staffColumnHelper.accessor('from_type_sklad', {
				header: 'Qayerdan',
				cell: (info) => info.row.original.from_type_sklad_detail?.name ?? '',
				meta: { filterVariant: 'select', filterOptions: skladTypeFilterOptions, filterPlaceholder: 'Barchasi' },
			}),
			staffColumnHelper.accessor('to_type_sklad', {
				header: 'Qayerga',
				cell: (info) => info.row.original.to_type_sklad_detail?.name ?? '',
				meta: { filterVariant: 'select', filterOptions: skladTypeFilterOptions, filterPlaceholder: 'Barchasi' },
			}),
			staffColumnHelper.accessor('items_count', {
				header: 'Tovarlar soni',
				size: 110,
				enableColumnFilter: false,
			}),
			staffColumnHelper.accessor('status', {
				header: 'Status',
				cell: (info) => <Badge variant={STATUS_VARIANT[info.getValue()]}>{STATUS_LABEL[info.getValue()]}</Badge>,
				meta: {
					filterVariant: 'select',
					filterOptions: [
						{ value: 'completed', label: 'Bajarilgan' },
						{ value: 'reversed', label: 'Bekor qilingan' },
						{ value: 'reverse', label: 'Bekor qilish transferi' },
					],
					filterPlaceholder: 'Barchasi',
				},
			}),
			staffColumnHelper.display({
				id: 'actions',
				header: 'Harakatlar',
				meta: { align: 'right' },
				enableColumnFilter: false,
				size: 130,
				cell: ({ row }) => (
					<div className='flex justify-end gap-1.5'>
						<Button
							type='button'
							variant='info'
							size='icon'
							aria-label="Tayyorlash ro'yxati"
							onClick={() => setDispatchTransferId(row.original.id)}
						>
							<FaList />
						</Button>
						<Button
							type='button'
							variant='warning'
							size='icon'
							aria-label='PDF chop qilish'
							disabled={printingId === row.original.id}
							onClick={() => handlePrint(row.original.id)}
						>
							<FaFilePdf />
						</Button>
					</div>
				),
			}),
		],
		[skladTypeFilterOptions, printingId, handlePrint],
	);

	return (
		<>
			<Panel title='Sklad xodimi uchun tayyorlash ro‘yxati' onReload={() => refetch()}>
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
					columns={columns}
					data={results}
					manualPagination
					manualFiltering
					pageCount={meta?.lastPage ?? -1}
					totalRows={meta?.total}
					pagination={pagination}
					onPaginationChange={setPagination}
					columnFilters={columnFilters}
					onColumnFiltersChange={(filters) => {
						setColumnFilters(filters);
						setPagination((p) => ({ ...p, pageIndex: 0 }));
					}}
					enablePagination
					enableGlobalFilter={false}
					enableColumnFilters
					enableSorting={false}
					enableStriping
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : "Ma'lumot topilmadi"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>

			{dispatchTransferId !== null && (
				<DispatchListModal
					open={dispatchTransferId !== null}
					setOpen={(open) => !open && setDispatchTransferId(null)}
					transferId={dispatchTransferId}
				/>
			)}
		</>
	);
}
