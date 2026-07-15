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
	Panel,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { formatNumber } from '@/lib/number';
import DeleteExpenseModal from '@/pages/system/ExpensePage/components/DeleteExpenseModal';
import ExpenseFormModal from '@/pages/system/ExpensePage/components/ExpenseFormModal';
import { useExpenseListQuery } from '@/services/expense/expense.queries';
import type { Expense } from '@/services/expense/expense.types';
import { useExpenseTypeListQuery } from '@/services/expense-type/expense-type.queries';
import { expenseTypeService } from '@/services/expense-type/expense-type.service';

const columnHelper = createColumnHelper<Expense>();

export default function ExpensesTab() {
	const { companyId, canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const nameFilter = columnFilters.find((f) => f.id === 'nomi')?.value as string | undefined;
	const typeFilter = columnFilters.find((f) => f.id === 'type')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useExpenseListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		company_id: companyId ?? undefined,
		search: nameFilter || undefined,
		type: typeFilter ? Number(typeFilter) : undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const { data: typeData } = useExpenseTypeListQuery({ limit: 100 });
	const typeNameById = new Map((typeData?.results ?? []).map((t) => [t.id, t.name]));

	const loadTypeOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await expenseTypeService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((t) => ({ value: String(t.id), label: t.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const columns = [
		columnHelper.accessor('nomi', { header: 'Nomi', meta: { align: 'left' } }),
		columnHelper.accessor('type', {
			header: 'Turi',
			cell: (info) => typeNameById.get(info.getValue()) ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadTypeOptions,
				filterSelectedLabel: (value) => typeNameById.get(Number(value)),
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('summa', {
			header: 'Summa',
			size: 120,
			enableColumnFilter: false,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.accessor('date_cr', { header: 'Sana', size: 110, enableColumnFilter: false }),
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
						elementProps={{
							...buttonProps(<FaEdit />, 'warning', 'icon'),
							'aria-label': 'Tahrirlash',
							disabled: !canWrite,
						}}
						dialog={ExpenseFormModal}
						dialogProps={{ mode: 'edit' as const, item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(<FaTrash />, 'danger', 'icon'),
							'aria-label': "O'chirish",
							disabled: !canWrite,
						}}
						dialog={DeleteExpenseModal}
						dialogProps={{ item: row.original }}
					/>
				</div>
			),
		}),
	];

	return (
		<Panel
			title="Ro'yxat"
			actions={
				canWrite && (
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
						dialog={ExpenseFormModal}
						dialogProps={{ mode: 'create' as const }}
					/>
				)
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
	);
}
