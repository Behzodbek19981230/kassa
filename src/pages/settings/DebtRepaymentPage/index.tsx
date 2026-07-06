import {
	createColumnHelper,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import {
	Button,
	buttonProps,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	PageHeader,
	Panel,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { formatNumber } from '@/lib/number';
import { clientService } from '@/services/client/client.service';
import { useDebtRepaymentListQuery } from '@/services/debt-repayment/debt-repayment.queries';
import type { DebtRepayment } from '@/services/debt-repayment/debt-repayment.types';
import { useUserListQuery } from '@/services/user/user.queries';
import { userService } from '@/services/user/user.service';
import DebtRepaymentFormModal from '@/pages/settings/DebtRepaymentPage/components/DebtRepaymentFormModal';
import DeleteDebtRepaymentModal from '@/pages/settings/DebtRepaymentPage/components/DeleteDebtRepaymentModal';

const columnHelper = createColumnHelper<DebtRepayment>();

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

export default function DebtRepaymentPage() {
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const clientFilter = columnFilters.find((f) => f.id === 'client')?.value as string | undefined;
	const workerFilter = columnFilters.find((f) => f.id === 'is_worker')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useDebtRepaymentListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		client: clientFilter ? Number(clientFilter) : undefined,
		is_worker: workerFilter ? Number(workerFilter) : undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const { data: userData } = useUserListQuery({ limit: 100 });
	const userLabelById = new Map((userData?.results ?? []).map((u) => [u.id, userLabel(u)]));

	const loadClientOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await clientService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.fio })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadUserOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await userService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((u) => ({ value: String(u.id), label: userLabel(u) })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const columns = [
		columnHelper.accessor('client', {
			header: 'Mijoz',
			cell: (info) => info.row.original.client_detail?.fio ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadClientOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('is_worker', {
			header: 'Qarzni olgan Xodim',
			cell: (info) => {
				const value = info.getValue();
				return value ? (userLabelById.get(value) ?? value) : '';
			},
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadUserOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('summ_dollar', {
			header: 'Summa dollarda ($)',
			size: 140,
			enableColumnFilter: false,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.accessor('discount_amount', {
			header: 'Jami chegirma ($)',
			size: 140,
			enableColumnFilter: false,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.display({
			id: 'zdacha',
			header: 'Qaytim',
			size: 150,
			enableSorting: false,
			enableColumnFilter: false,
			cell: ({ row }) =>
				`${formatNumber(row.original.zdacha_sum)} so'm / ${formatNumber(row.original.zdacha_dollar, 2)} $`,
		}),
		columnHelper.accessor('all_summ_dollar', {
			header: 'Umumiy summa ($)',
			size: 150,
			enableColumnFilter: false,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.accessor('exchange_rate', {
			header: 'Dollar kursi',
			size: 120,
			enableColumnFilter: false,
			cell: (info) => formatNumber(info.getValue()),
		}),
		columnHelper.accessor('date', { header: 'Sana', size: 110, enableColumnFilter: false }),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableSorting: false,
			enableColumnFilter: false,
			size: 150,
			cell: ({ row }) => (
				<div className='flex justify-end gap-1'>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{ ...buttonProps(<FaEdit />, 'warning', 'icon'), 'aria-label': 'Tahrirlash' }}
						dialog={DebtRepaymentFormModal}
						dialogProps={{ mode: 'edit' as const, item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{ ...buttonProps(<FaTrash />, 'danger', 'icon'), 'aria-label': "O'chirish" }}
						dialog={DeleteDebtRepaymentModal}
						dialogProps={{ item: row.original }}
					/>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title="To'langan qarzlar"
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: "To'langan qarzlar", active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
						dialog={DebtRepaymentFormModal}
						dialogProps={{ mode: 'create' as const }}
					/>
				}
				onReload={() => {
					refetch();
				}}
			>
				<DataTable
					columns={columns}
					data={results}
					manualPagination
					manualSorting
					manualFiltering
					pageCount={paginationMeta?.lastPage ?? -1}
					totalRows={paginationMeta?.total}
					pagination={pagination}
					onPaginationChange={setPagination}
					sorting={sorting}
					onSortingChange={setSorting}
					columnFilters={columnFilters}
					onColumnFiltersChange={(filters) => {
						setColumnFilters(filters);
						setPagination((p) => ({ ...p, pageIndex: 0 }));
					}}
					enablePagination
					enableGlobalFilter={false}
					enableColumnFilters
					enableColumnVisibility
					enableSorting
					enableStriping
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>
		</>
	);
}
