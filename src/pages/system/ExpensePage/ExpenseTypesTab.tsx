import { createColumnHelper, type ColumnFiltersState, type PaginationState, type SortingState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { Button, buttonProps, DataTable, Panel } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import DeleteExpenseTypeModal from '@/pages/system/ExpensePage/components/DeleteExpenseTypeModal';
import ExpenseTypeFormModal from '@/pages/system/ExpensePage/components/ExpenseTypeFormModal';
import { useExpenseTypeListQuery } from '@/services/expense-type/expense-type.queries';
import type { ExpenseType } from '@/services/expense-type/expense-type.types';

const columnHelper = createColumnHelper<ExpenseType>();

export default function ExpenseTypesTab() {
	const { canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const nameFilter = columnFilters.find((f) => f.id === 'name')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useExpenseTypeListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: nameFilter || undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		columnHelper.accessor('name', { header: 'Nomi', meta: { align: 'left' } }),
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
						dialog={ExpenseTypeFormModal}
						dialogProps={{ mode: 'edit' as const, item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(<FaTrash />, 'danger', 'icon'),
							'aria-label': "O'chirish",
							disabled: !canWrite,
						}}
						dialog={DeleteExpenseTypeModal}
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
						dialog={ExpenseTypeFormModal}
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
				onColumnFiltersChange={setColumnFilters}
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
