import { createColumnHelper, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaExclamationTriangle, FaExpand, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button, buttonProps, DataTable, Panel, Tooltip } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { loadConsignorOptions } from '@/pages/TwoStageImport/options';
import MyDebtFormModal from '@/pages/MyDebtPage/components/MyDebtFormModal';
import YuanDebtPayModal from '@/pages/TwoStageImport/components/YuanDebtPayModal';
import { useYuanDollarConversion } from '@/pages/TwoStageImport/useYuanDollarConversion';
import { formatTashkentDate, formatUserName } from '@/pages/TwoStageImport/utils';
import { useConsignorDebtListQuery } from '@/services/my-debt/my-debt.queries';
import type { MyDebtItem } from '@/services/my-debt/my-debt.types';

const columnHelper = createColumnHelper<MyDebtItem>();

/** What I owe the China consignors (`/my-total-debt/consignor-debts/`), shown in yuan and dollars. */
export default function ChinaDebtPage() {
   const navigate = useNavigate();
   const { canWrite } = useCurrentCompany();
   const { dollarToYuan } = useYuanDollarConversion();
   const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 200 });
   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
   const [addModalOpen, setAddModalOpen] = useState(false);

   const consignorFilter = columnFilters.find((f) => f.id === 'consignor')?.value as string | undefined;

   const { data, isLoading, isFetching, isError, error, refetch } = useConsignorDebtListQuery({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      consignor: consignorFilter ? Number(consignorFilter) : undefined,
   });

   const results = data?.results ?? [];
   const paginationMeta = data?.pagination;
   const totalDebt = results.reduce((sum, item) => sum + (Number(item.total_debt) || 0), 0);
   const totalDebtYuan = dollarToYuan(String(totalDebt));

   const columns = [
      columnHelper.accessor('consignor', {
         header: "Yuk jo'natuvchi",
         cell: (info) => info.row.original.consignor_detail?.name ?? `#${info.getValue()}`,
         meta: {
            filterVariant: 'select',
            filterLoadOptions: loadConsignorOptions,
            filterPlaceholder: 'Barchasi',
         },
      }),
      columnHelper.display({
         id: 'total_debt_yuan',
         header: 'Qarz miqdori (¥)',
         enableColumnFilter: false,
         cell: ({ row }) => {
            const value = Number(row.original.total_debt) || 0;
            const yuan = dollarToYuan(String(value));
            return (
               <span className={value > 0 ? 'font-bold text-ca-red' : 'font-bold text-ca-green'}>
                  {yuan !== null ? `${formatNumber(yuan, 2)} ¥` : "yuan kursi yo'q"}
               </span>
            );
         },
      }),
      columnHelper.accessor('total_debt', {
         header: 'Qarz miqdori ($)',
         enableColumnFilter: false,
         cell: (info) => `${formatNumber(Number(info.getValue()) || 0, 2)} $`,
      }),
      columnHelper.display({
         id: 'updated_time',
         header: "Oxirgi o'zgargan sana",
         enableColumnFilter: false,
         cell: ({ row }) => formatTashkentDate(row.original.updated_time ?? row.original.created_time ?? null),
      }),
      columnHelper.display({
         id: 'updated_by',
         header: 'Kim tomonidan',
         enableColumnFilter: false,
         cell: ({ row }) => {
            const user = row.original.updated_by_detail ?? row.original.created_by_detail;
            return user ? formatUserName(user) : '-';
         },
      }),
      columnHelper.display({
         id: 'actions',
         header: 'Harakatlar',
         meta: { align: 'right' },
         enableColumnFilter: false,
         cell: ({ row }) => (
            <div className='flex justify-end gap-1'>
               {canWrite && (
                  <OpenDialogButton
                     element={(props) => <Button {...props} />}
                     elementProps={buttonProps("Qarz to'lash", 'success', 'xs')}
                     dialog={YuanDebtPayModal}
                     dialogProps={{
                        target: { kind: 'consignor' as const, consignorId: row.original.consignor },
                        name: row.original.consignor_detail?.name,
                        currentDebtDollar: Number(row.original.total_debt) || 0,
                     }}
                  />
               )}
               <Tooltip content='Batafsil'>
                  <Button
                     type='button'
                     variant='info'
                     size='icon'
                     aria-label='Batafsil'
                     onClick={() => navigate(`/my-debts/${row.original.id}`)}
                  >
                     <FaExpand />
                  </Button>
               </Tooltip>
            </div>
         ),
      }),
   ];

   return (
      <>

         <Panel
            title={`Xitoydagi yuk jo'natuvchilarga jami qarzim: ${
               totalDebtYuan !== null ? `${formatNumber(totalDebtYuan, 2)} ¥ / ` : ''
            }${formatNumber(totalDebt, 2)} $`}
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
               columnVisibilityKey='china-debt'
               enableStriping
               isLoading={isLoading || isFetching}
               emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : 'Hech nima topilmadi.'}
               emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
            />
         </Panel>

         <MyDebtFormModal open={addModalOpen} setOpen={setAddModalOpen} consignorType='outside_uzbekistan' />
      </>
   );
}
