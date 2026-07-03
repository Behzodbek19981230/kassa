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
import BrandFormModal from '@/pages/system/ModelsPage/components/BrandFormModal';
import DeleteBrandModal from '@/pages/system/ModelsPage/components/DeleteBrandModal';
import { useBrandListQuery } from '@/services/brand/brand.queries';
import type { Brand } from '@/services/brand/brand.types';

const columnHelper = createColumnHelper<Brand>();

export default function ModelsPage() {
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const nameFilter = columnFilters.find((f) => f.id === 'name')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useBrandListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: nameFilter || undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		columnHelper.accessor('sorting', { header: 'Tartibi', size: 100, enableColumnFilter: false }),
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
						elementProps={{ ...buttonProps(<FaEdit />, 'warning', 'icon'), 'aria-label': 'Tahrirlash' }}
						dialog={BrandFormModal}
						dialogProps={{ mode: 'edit' as const, item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{ ...buttonProps(<FaTrash />, 'danger', 'icon'), 'aria-label': "O'chirish" }}
						dialog={DeleteBrandModal}
						dialogProps={{ item: row.original }}
					/>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Modellar'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Modellar', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
						dialog={BrandFormModal}
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
