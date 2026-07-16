import { createColumnHelper, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
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
import DeleteSizeModal from '@/pages/system/ProductMeasurementPage/components/DeleteSizeModal';
import SizeFormModal from '@/pages/system/ProductMeasurementPage/components/SizeFormModal';
import { useBrandSizeListQuery } from '@/services/brand-size/brand-size.queries';
import type { BrandSize } from '@/services/brand-size/brand-size.types';
import { useBrandSizeTypeListQuery } from '@/services/brand-size-type/brand-size-type.queries';
import { brandSizeTypeService } from '@/services/brand-size-type/brand-size-type.service';
import { useBrandListQuery } from '@/services/brand/brand.queries';
import { brandService } from '@/services/brand/brand.service';
import { useProductCategoryListQuery } from '@/services/product-category/product-category.queries';
import { productCategoryService } from '@/services/product-category/product-category.service';

const PAGE_SIZE = 10;

const sizeColumnHelper = createColumnHelper<BrandSize>();

export default function ProductSizesTab() {
	const { canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE });
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const brandFilter = columnFilters.find((f) => f.id === 'brand')?.value as string | undefined;
	const categoryFilter = columnFilters.find((f) => f.id === 'product_category')?.value as string | undefined;
	const typeFilter = columnFilters.find((f) => f.id === 'type')?.value as string | undefined;

	const { data: brandData } = useBrandListQuery({ limit: 100 });
	const brands = brandData?.results ?? [];
	const brandNameById = new Map(brands.map((b) => [b.id, b.name]));

	const { data: categoryData } = useProductCategoryListQuery({ limit: 100 });
	const categoryNameById = new Map((categoryData?.results ?? []).map((c) => [c.id, c.name]));

	const { data: typeData } = useBrandSizeTypeListQuery({ limit: 100 });
	const typeNameById = new Map((typeData?.results ?? []).map((t) => [t.id, t.name]));

	const { data, isLoading, isFetching, isError, refetch } = useBrandSizeListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		brand: brandFilter ? Number(brandFilter) : undefined,
		product_category: categoryFilter ? Number(categoryFilter) : undefined,
		type: typeFilter ? Number(typeFilter) : undefined,
	});

	const loadBrandOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await brandService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((b) => ({ value: String(b.id), label: b.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadCategoryFilterOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await productCategoryService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadTypeOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await brandSizeTypeService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.filter((t) => t.status).map((t) => ({ value: String(t.id), label: t.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		sizeColumnHelper.accessor('brand', {
			header: 'Model',
			cell: (info) => brandNameById.get(info.getValue()) ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadBrandOptions,
				filterSelectedLabel: (value) => brandNameById.get(Number(value)),
				filterPlaceholder: 'Barcha modellar',
			},
		}),
		sizeColumnHelper.accessor('product_category', {
			header: 'Mahsulot toifasi',
			cell: (info) => categoryNameById.get(info.getValue()) ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadCategoryFilterOptions,
				filterSelectedLabel: (value) => categoryNameById.get(Number(value)),
				filterPlaceholder: 'Barcha toifalar',
			},
		}),
		sizeColumnHelper.accessor('size', { header: "O'lchami", size: 100, enableColumnFilter: false }),
		sizeColumnHelper.accessor('type', {
			header: 'Turi',
			cell: (info) => typeNameById.get(info.getValue()) ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadTypeOptions,
				filterSelectedLabel: (value) => typeNameById.get(Number(value)),
				filterPlaceholder: 'Barcha turlar',
			},
		}),
		sizeColumnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableSorting: false,
			size: 190,
			cell: ({ row }) => (
				<div className='flex justify-end gap-1'>
					{/* <OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{ ...buttonProps(<FaEye />, 'info', 'icon'), 'aria-label': "Ko'rish" }}
						dialog={SizeViewModal}
						dialogProps={{ item: row.original }}
					/> */}
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(<FaEdit />, 'warning', 'icon'),
							'aria-label': 'Tahrirlash',
							disabled: !canWrite,
						}}
						dialog={SizeFormModal}
						dialogProps={{ mode: 'edit' as const, item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(<FaTrash />, 'danger', 'icon'),
							'aria-label': "O'chirish",
							disabled: !canWrite,
						}}
						dialog={DeleteSizeModal}
						dialogProps={{ item: row.original }}
					/>
				</div>
			),
		}),
	];

	return (
		<>
			<Panel
				title="Ro'yxat"
				actions={
					canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
							dialog={SizeFormModal}
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
					enableGlobalFilter={false}
					enableColumnFilters
					enableSorting={false}
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>
		</>
	);
}
