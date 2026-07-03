import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaEye, FaTrash } from 'react-icons/fa';
import { Button, buttonProps, type ComboboxLoadParams, type ComboboxLoadResult, DataTable, PageHeader, Panel } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import CategoryFormModal from '@/pages/system/ProductCategoriesPage/components/CategoryFormModal';
import CategoryViewModal from '@/pages/system/ProductCategoriesPage/components/CategoryViewModal';
import DeleteCategoryModal from '@/pages/system/ProductCategoriesPage/components/DeleteCategoryModal';
import { useBrandListQuery } from '@/services/brand/brand.queries';
import { brandService } from '@/services/brand/brand.service';
import { useProductCategoryListQuery } from '@/services/product-category/product-category.queries';
import type { ProductCategory } from '@/services/product-category/product-category.types';
import type { ColumnFiltersState, PaginationState } from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';

const columnHelper = createColumnHelper<ProductCategory>();

export default function ProductCategoriesPage() {
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const nameFilter = columnFilters.find((f) => f.id === 'name')?.value as string | undefined;
	const brandFilter = columnFilters.find((f) => f.id === 'brand')?.value as string | undefined;

	const { data: brandData } = useBrandListQuery({ limit: 100 });
	const brands = brandData?.results ?? [];
	const brandNameById = new Map(brands.map((b) => [b.id, b.name]));

	const loadBrandOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await brandService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((b) => ({ value: String(b.id), label: b.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const { data, isLoading, isError, isFetching, refetch } = useProductCategoryListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: nameFilter || undefined,
		brand: brandFilter ? Number(brandFilter) : undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		columnHelper.accessor('sorting', { header: 'Tartibi', size: 90 }),
		columnHelper.accessor('brand', {
			header: 'Model',
			size: 220,
			cell: (info) => brandNameById.get(info.getValue()) ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadBrandOptions,
				filterSelectedLabel: (value) => brandNameById.get(Number(value)),
				filterPlaceholder: 'Barcha modellar',
			},
		}),
		columnHelper.accessor('name', { header: 'Nomi' }),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			enableSorting: false,
			meta: { align: 'right' },
			cell: ({ row }) => (
				<div className='flex justify-end gap-1'>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{ ...buttonProps(<FaEye />, 'info', 'icon'), 'aria-label': "Ko'rish" }}
						dialog={CategoryViewModal}
						dialogProps={{ item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{ ...buttonProps(<FaEdit />, 'warning', 'icon'), 'aria-label': 'Tahrirlash' }}
						dialog={CategoryFormModal}
						dialogProps={{ mode: 'edit' as const, item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{ ...buttonProps(<FaTrash />, 'danger', 'icon'), 'aria-label': "O'chirish" }}
						dialog={DeleteCategoryModal}
						dialogProps={{ item: row.original }}
					/>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Mahsulot toifalari'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Mahsulot toifalari', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
						dialog={CategoryFormModal}
						dialogProps={{ mode: 'create' as const }}
					/>
				}
				onReload={() => {
					void refetch();
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
