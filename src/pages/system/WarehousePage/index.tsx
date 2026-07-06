import {
	createColumnHelper,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { FaDollarSign, FaEdit, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import {
	Button,
	buttonProps,
	buttonVariants,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	PageHeader,
	Panel,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import DeleteWarehouseModal from '@/pages/system/WarehousePage/components/DeleteWarehouseModal';
import WarehousePaymentModal from '@/pages/system/WarehousePage/components/WarehousePaymentModal';
import { useBrandListQuery } from '@/services/brand/brand.queries';
import { brandService } from '@/services/brand/brand.service';
import { useBrandSizeTypeListQuery } from '@/services/brand-size-type/brand-size-type.queries';
import { brandSizeTypeService } from '@/services/brand-size-type/brand-size-type.service';
import { useProductCategoryListQuery } from '@/services/product-category/product-category.queries';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useWarehouseListQuery } from '@/services/warehouse/warehouse.queries';
import type { Warehouse } from '@/services/warehouse/warehouse.types';

const columnHelper = createColumnHelper<Warehouse>();

export default function WarehousePage() {
	const navigate = useNavigate();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [onlyConfirmed, setOnlyConfirmed] = useState(false);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const brandFilter = columnFilters.find((f) => f.id === 'brand')?.value as string | undefined;
	const categoryFilter = columnFilters.find((f) => f.id === 'product_category')?.value as string | undefined;
	const typeFilter = columnFilters.find((f) => f.id === 'type')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useWarehouseListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		brand: brandFilter ? Number(brandFilter) : undefined,
		product_category: categoryFilter ? Number(categoryFilter) : undefined,
		type: typeFilter ? Number(typeFilter) : undefined,
		status_count: onlyConfirmed ? true : undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const { data: brandData } = useBrandListQuery({ limit: 100 });
	const brandNameById = new Map((brandData?.results ?? []).map((b) => [b.id, b.name]));

	const { data: categoryData } = useProductCategoryListQuery({ limit: 100 });
	const categoryNameById = new Map((categoryData?.results ?? []).map((c) => [c.id, c.name]));

	const { data: typeData } = useBrandSizeTypeListQuery({ limit: 100 });
	const typeNameById = new Map((typeData?.results ?? []).map((t) => [t.id, t.name]));

	const loadBrandOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await brandService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((b) => ({ value: String(b.id), label: b.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadCategoryOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
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

	const columns = [
		columnHelper.display({
			id: 'index',
			header: '#',
			size: 50,
			enableSorting: false,
			enableColumnFilter: false,
			cell: ({ row }) => pagination.pageIndex * pagination.pageSize + row.index + 1,
		}),
		columnHelper.accessor('brand', {
			header: 'Model',
			cell: (info) => brandNameById.get(info.getValue()) ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadBrandOptions,
				filterSelectedLabel: (value) => brandNameById.get(Number(value)),
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('product_category', {
			header: 'Nomi',
			cell: (info) => categoryNameById.get(info.getValue()) ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadCategoryOptions,
				filterSelectedLabel: (value) => categoryNameById.get(Number(value)),
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('size', { header: "O'lchami", size: 100, enableColumnFilter: false }),
		columnHelper.accessor('type', {
			header: 'Tip',
			cell: (info) => {
				const value = info.getValue();
				return value ? (typeNameById.get(value) ?? value) : '';
			},
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadTypeOptions,
				filterSelectedLabel: (value) => typeNameById.get(Number(value)),
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('count', { header: 'Soni', size: 90, enableColumnFilter: false }),
		columnHelper.accessor('price', {
			header: 'Haqiqiy Narxi ($)',
			size: 130,
			enableColumnFilter: false,
			cell: (info) => info.getValue().toFixed(2),
		}),
		columnHelper.accessor('worker_price', {
			header: 'Ishchi Uchun Narx ($)',
			size: 150,
			enableColumnFilter: false,
			cell: (info) => info.getValue().toFixed(2),
		}),
		columnHelper.accessor('cr_date', { header: 'Sana', size: 110, enableColumnFilter: false }),
		columnHelper.accessor('status_count', {
			header: 'Mahsulotlar sanalganligi',
			size: 160,
			enableColumnFilter: false,
			cell: (info) => (
				<span className={info.getValue() ? 'font-semibold text-ca-theme' : 'font-semibold text-ca-orange'}>
					{info.getValue() ? 'Tasdiqlangan' : 'Tasdiqlanmagan'}
				</span>
			),
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableSorting: false,
			enableColumnFilter: false,
			size: 170,
			cell: ({ row }) => (
				<div className='flex justify-end gap-1'>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{ ...buttonProps(<FaDollarSign />, 'warning', 'icon'), 'aria-label': 'Hisob-kitob' }}
						dialog={WarehousePaymentModal}
						dialogProps={{ item: row.original }}
					/>
					<Button
						{...buttonProps(<FaEdit />, 'info', 'icon')}
						aria-label='Tahrirlash'
						onClick={() => navigate(`/system/warehouse-prices/${row.original.id}/edit`)}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{ ...buttonProps(<FaTrash />, 'danger', 'icon'), 'aria-label': "O'chirish" }}
						dialog={DeleteWarehouseModal}
						dialogProps={{ item: row.original }}
					/>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Tovarlar va Narxlar'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Tovarlar va Narxlar', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					<>
						<Button
							type='button'
							variant={onlyConfirmed ? 'success' : 'warning'}
							size='xs'
							onClick={() => {
								setOnlyConfirmed((v) => !v);
								setPagination((p) => ({ ...p, pageIndex: 0 }));
							}}
						>
							Tekshirildi {onlyConfirmed && '✓'}
						</Button>
						<Link to='/system/warehouse-prices/create' className={buttonVariants({ variant: 'info', size: 'xs' })}>
							Qo'shish +
						</Link>
					</>
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
