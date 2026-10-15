import {
   createColumnHelper,
   type ColumnFiltersState,
   type PaginationState,
   type SortingState,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaImages, FaTelegramPlane, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
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
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { usePermissions } from '@/lib/permissions';
import { useProductCardNames } from '@/lib/useProductCardNames';
import DeleteWarehouseModal from '@/pages/WarehousePage/components/DeleteWarehouseModal';
import WarehouseEditModal from '@/pages/WarehousePage/components/WarehouseEditModal';
import WarehouseImagesModal from '@/pages/WarehousePage/components/WarehouseImagesModal';
import WarehouseSendTelegramModal from '@/pages/WarehousePage/components/WarehouseSendTelegramModal';
import { useSkladProductListQuery } from '@/services/sklad-product/sklad-product.queries';
import type { SkladProduct } from '@/services/sklad-product/sklad-product.types';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import { skladTypeService } from '@/services/sklad-type/sklad-type.service';

// Each row is one product's stock and price in one sklad (SkladProduct); the product itself is its card.
const columnHelper = createColumnHelper<SkladProduct>();

const SEARCH_DEBOUNCE_MS = 400;

const loadSkladTypeOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
   const result = await skladTypeService.list({ search: search || undefined, page, limit: 20 });
   return {
      options: result.results.map((s) => ({ value: String(s.id), label: s.name })),
      hasMore: result.pagination.currentPage < result.pagination.lastPage,
   };
};

export default function WarehousePage() {
   const { canWrite } = useCurrentCompany();
   const { canManageWarehouse } = usePermissions();
   const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
   const [sorting, setSorting] = useState<SortingState>([]);
   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
   const [onlyConfirmed, setOnlyConfirmed] = useState(false);

   // The backend sorts stock rows by id or count only.
   const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
   const skladTypeFilter = columnFilters.find((f) => f.id === 'type_sklad')?.value as string | undefined;
   // Model and nomi are searched by name on the backend (`search`).
   const searchFilter = (columnFilters.find((f) => f.id === 'product')?.value as string | undefined) ?? '';
   const [search, setSearch] = useState('');
   useEffect(() => {
      const timer = setTimeout(() => setSearch(searchFilter.trim()), SEARCH_DEBOUNCE_MS);
      return () => clearTimeout(timer);
   }, [searchFilter]);

   const { data, isLoading, isFetching, isError, error, refetch } = useSkladProductListQuery({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      type_sklad: skladTypeFilter ? Number(skladTypeFilter) : undefined,
      status_count: onlyConfirmed ? true : undefined,
      search: search || undefined,
      ordering,
   });

   const results = data?.results ?? [];
   const paginationMeta = data?.pagination;

   const cardNames = useProductCardNames();
   const { data: skladTypeData } = useSkladTypeListQuery({ limit: 100 });
   const skladNameById = new Map((skladTypeData?.results ?? []).map((s) => [s.id, s.name]));

   const brandName = (item: SkladProduct) => cardNames.brandName(item.warehouse_detail);
   const categoryName = (item: SkladProduct) => cardNames.categoryName(item.warehouse_detail);
   const skladName = (item: SkladProduct) =>
      item.type_sklad_detail?.name ?? skladNameById.get(item.type_sklad) ?? String(item.type_sklad);
   const productLabel = (item: SkladProduct) =>
      [brandName(item), categoryName(item)].filter(Boolean).join(' ') || `#${item.warehouse}`;

   const columns = [
      columnHelper.display({
         id: 'index',
         header: '#',
         size: 50,
         enableSorting: false,
         enableColumnFilter: false,
         cell: ({ row }) => pagination.pageIndex * pagination.pageSize + row.index + 1,
      }),
      columnHelper.accessor('type_sklad', {
         header: 'Sklad',
         enableSorting: false,
         cell: (info) => skladName(info.row.original),
         meta: {
            filterVariant: 'select',
            filterLoadOptions: loadSkladTypeOptions,
            filterSelectedLabel: (value) => skladNameById.get(Number(value)),
            filterPlaceholder: 'Barchasi',
         },
      }),
      columnHelper.accessor((row) => row.warehouse, {
         id: 'product',
         header: 'Model',
         enableSorting: false,
         cell: (info) => brandName(info.row.original),
      }),
      columnHelper.display({
         id: 'product_category',
         header: 'Nomi',
         enableSorting: false,
         enableColumnFilter: false,
         cell: ({ row }) => categoryName(row.original),
      }),
      columnHelper.display({
         id: 'size',
         header: "O'lchami",
         size: 100,
         enableSorting: false,
         enableColumnFilter: false,
         cell: ({ row }) => (row.original.warehouse_detail ? formatNumber(row.original.warehouse_detail.size) : ''),
      }),
      columnHelper.display({
         id: 'type',
         header: 'Tip',
         enableSorting: false,
         enableColumnFilter: false,
         cell: ({ row }) => cardNames.typeName(row.original.warehouse_detail),
      }),
      columnHelper.accessor('count', {
         header: 'Soni',
         size: 90,
         enableColumnFilter: false,
         cell: (info) => formatNumber(info.getValue()),
      }),
      columnHelper.accessor('real_price', {
         header: 'Asl narxi ($)',
         size: 130,
         enableSorting: false,
         enableColumnFilter: false,
         cell: (info) => formatNumber(info.getValue() ?? 0, 2),
      }),
      columnHelper.accessor('worker_price', {
         header: 'Ishchi Uchun Narx ($)',
         size: 150,
         enableSorting: false,
         enableColumnFilter: false,
         cell: (info) => formatNumber(info.getValue() ?? 0, 2),
      }),
      columnHelper.accessor('cr_date', { header: 'Sana', size: 110, enableSorting: false, enableColumnFilter: false }),
      columnHelper.accessor('status_count', {
         header: 'Mahsulotlar sanalganligi',
         size: 160,
         enableSorting: false,
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
         size: 210,
         cell: ({ row }) => {
            const item = row.original;
            const label = productLabel(item);
            const card = { id: item.warehouse };

            return (
               <div className='flex justify-end gap-1'>
                  <OpenDialogButton
                     element={(props) => <Button {...props} />}
                     elementProps={{
                        ...buttonProps(<FaTelegramPlane />, 'success', 'icon'),
                        'aria-label': 'Telegramga yuborish',
                     }}
                     dialog={WarehouseSendTelegramModal}
                     dialogProps={{ item: card, productLabel: label }}
                  />
                  {canWrite && canManageWarehouse && (
                     <OpenDialogButton
                        element={(props) => <Button {...props} />}
                        elementProps={{
                           ...buttonProps(<FaImages />, 'theme', 'icon'),
                           'aria-label': 'Rasmlar',
                        }}
                        dialog={WarehouseImagesModal}
                        dialogProps={{ item: card, productLabel: label }}
                     />
                  )}
                  {canWrite && canManageWarehouse && (
                     <OpenDialogButton
                        element={(props) => <Button {...props} />}
                        elementProps={{
                           ...buttonProps(<FaEdit />, 'info', 'icon'),
                           'aria-label': 'Tahrirlash',
                        }}
                        dialog={WarehouseEditModal}
                        dialogProps={{ item, productLabel: label, skladName: skladName(item) }}
                     />
                  )}
                  {canWrite && canManageWarehouse && (
                     <OpenDialogButton
                        element={(props) => <Button {...props} />}
                        elementProps={{
                           ...buttonProps(<FaTrash />, 'danger', 'icon'),
                           'aria-label': "O'chirish",
                           disabled: item.count > 0,
                           title: item.count > 0 ? "Qoldig'i bor tovarni o'chirib bo'lmaydi" : undefined,
                        }}
                        dialog={DeleteWarehouseModal}
                        dialogProps={{ item, productLabel: label }}
                     />
                  )}
               </div>
            );
         },
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
                  {canWrite && canManageWarehouse && (
                     <Link
                        to='/warehouse-prices/create'
                        className={buttonVariants({ variant: 'info', size: 'xs' })}
                     >
                        Qo'shish +
                     </Link>
                  )}
               </>
            }
            onReload={() => {
               refetch();
            }}
         >
            <DataTable
               columns={columns}
               data={results}
               getRowClassName={(row) => (row.count <= 0 ? 'bg-red-100 dark:bg-red-950/50' : undefined)}
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
               columnVisibilityKey='warehouse'
               enableSorting
               enableStriping
               isLoading={isLoading || isFetching}
               emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : "Ma'lumot topilmadi"}
               emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
            />
         </Panel>
      </>
   );
}
