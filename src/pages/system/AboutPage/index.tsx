import {
	createColumnHelper,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { Button, buttonProps, DataTable, PageHeader, Panel } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import AboutFormModal from '@/pages/system/AboutPage/components/AboutFormModal';
import DeleteAboutModal from '@/pages/system/AboutPage/components/DeleteAboutModal';
import { useAboutListQuery } from '@/services/about/about.queries';
import type { About } from '@/services/about/about.types';

const columnHelper = createColumnHelper<About>();

export default function AboutPage() {
	const { canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const nomerFilter = columnFilters.find((f) => f.id === 'nomer_nakladnoy')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useAboutListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: nomerFilter || undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		columnHelper.accessor('nomer_nakladnoy', { header: 'Nakladnoy raqami', meta: { align: 'left' } }),
		columnHelper.accessor('postavshik', {
			header: 'Yetkazib beruvchi',
			meta: { align: 'left' },
			enableColumnFilter: false,
		}),
		columnHelper.accessor('phone', { header: 'Telefon', size: 160, enableColumnFilter: false }),
		columnHelper.accessor('dostavshik', {
			header: 'Dostavchik',
			meta: { align: 'left' },
			enableColumnFilter: false,
		}),
		columnHelper.accessor('t_p', { header: 't_p', enableColumnFilter: false }),
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
						dialog={AboutFormModal}
						dialogProps={{ mode: 'edit' as const, item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(<FaTrash />, 'danger', 'icon'),
							'aria-label': "O'chirish",
							disabled: !canWrite,
						}}
						dialog={DeleteAboutModal}
						dialogProps={{ item: row.original }}
					/>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Biz haqimizda'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Biz haqimizda', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
							dialog={AboutFormModal}
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
		</>
	);
}
