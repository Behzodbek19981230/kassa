import { createColumnHelper, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaDollarSign, FaExclamationTriangle, FaExpand, FaPlus, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
	Button,
	buttonProps,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	Panel,
	useNotification,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { consignorService } from '@/services/consignor/consignor.service';
import { useMyDebtListQuery } from '@/services/my-debt/my-debt.queries';
import type { MyDebtItem } from '@/services/my-debt/my-debt.types';
import { userService } from '@/services/user/user.service';
import MyDebtFormModal from '@/pages/MyDebtPage/components/MyDebtFormModal';
import MyDebtPayModal from '@/pages/MyDebtPage/components/MyDebtPayModal';

const columnHelper = createColumnHelper<MyDebtItem>();

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

function formatDate(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleDateString('ru-RU');
}

export default function MyDebtTab() {
	const navigate = useNavigate();
	const { notify } = useNotification();
	const { canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 200 });
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [addModalOpen, setAddModalOpen] = useState(false);

	const consignorFilter = columnFilters.find((f) => f.id === 'consignor')?.value as string | undefined;
	const updatedByFilter = columnFilters.find((f) => f.id === 'updated_by')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, error, refetch } = useMyDebtListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		consignor: consignorFilter ? Number(consignorFilter) : undefined,
		created_by: updatedByFilter ? Number(updatedByFilter) : undefined,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;
	const totalDebt = results.reduce((sum, item) => sum + (Number(item.total_debt) || 0), 0);

	function stub() {
		notify({ title: 'Tez orada', text: 'Bu funksiya hali ulanmagan.' });
	}

	const loadConsignorOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await consignorService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.name })),
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
		columnHelper.accessor('consignor', {
			header: "Yuk jo'natuvchi",
			cell: (info) => info.row.original.consignor_detail?.name ?? '',
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadConsignorOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('total_debt', {
			header: 'Qarz miqdori ($)',
			enableColumnFilter: false,
			cell: (info) => {
				const value = Number(info.getValue()) || 0;
				return (
					<span className={value > 0 ? 'font-bold text-ca-red' : 'font-bold text-ca-green'}>
						{formatNumber(value, 2)} $
					</span>
				);
			},
		}),
		columnHelper.accessor('updated_time', {
			header: "Oxirgi o'zgargan sana",
			enableColumnFilter: false,
			cell: (info) => formatDate(info.getValue()),
		}),
		columnHelper.accessor('updated_by', {
			header: 'Kim tomonidan',
			cell: (info) => {
				const detail = info.row.original.updated_by_detail ?? info.row.original.created_by_detail;
				return detail ? userLabel(detail) : '';
			},
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadUserOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableColumnFilter: false,
			cell: ({ row }) => (
				<div className='flex justify-end gap-1'>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(<FaDollarSign />, 'warning', 'icon'),
							'aria-label': "To'lash",
							disabled: !canWrite,
						}}
						dialog={MyDebtPayModal}
						dialogProps={{
							companyId: row.original.company,
							consignorId: row.original.consignor,
							consignorName: row.original.consignor_detail?.name,
							currentDebt: Number(row.original.total_debt) || 0,
						}}
					/>
					<Button
						type='button'
						variant='info'
						size='icon'
						aria-label='Batafsil'
						onClick={() => navigate(`/my-debts/${row.original.id}`)}
					>
						<FaExpand />
					</Button>
					<Button
						type='button'
						variant='danger'
						size='icon'
						aria-label="O'chirish"
						disabled={!canWrite}
						onClick={stub}
					>
						<FaTrash />
					</Button>
				</div>
			),
		}),
	];

	return (
		<>
			<Panel
				title={`Mening barcha qarzim: ${formatNumber(totalDebt, 2)} $`}
				onReload={() => refetch()}
				actions={
					canWrite && (
						<Button type='button' variant='info' size='xs' onClick={() => setAddModalOpen(true)}>
							<FaPlus className='mr-1.5' /> Qarz qo'shish
						</Button>
					)
				}
			>
				<DataTable
					columns={columns}
					data={results}
					manualPagination
					manualFiltering
					pageCount={paginationMeta?.lastPage ?? -1}
					totalRows={paginationMeta?.total}
					pagination={pagination}
					onPaginationChange={setPagination}
					columnFilters={columnFilters}
					onColumnFiltersChange={(filters) => {
						setColumnFilters(filters);
						setPagination((p) => ({ ...p, pageIndex: 0 }));
					}}
					enablePagination
					enableSorting={false}
					enableGlobalFilter={false}
					enableColumnFilters
					enableColumnVisibility
					columnVisibilityKey='my-debt'
					enableStriping
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : 'Hech nima topilmadi.'}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>

			<MyDebtFormModal open={addModalOpen} setOpen={setAddModalOpen} />
		</>
	);
}
