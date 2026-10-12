import { createColumnHelper, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaExclamationTriangle, FaHistory } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import { Button, DataTable, Panel, Tooltip } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { loadLogisticsCompanyOptions } from '@/pages/TwoStageImport/options';
import { formatUserName, formatTashkentDate } from '@/pages/TwoStageImport/utils';
import { useLogisticsDebtListQuery } from '@/services/logistics-debt/logistics-debt.queries';
import type { LogisticsDebtItem } from '@/services/logistics-debt/logistics-debt.types';

const columnHelper = createColumnHelper<LogisticsDebtItem>();

export default function LogisticsDebtTab() {
   const [, setSearchParams] = useSearchParams();
   const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 200 });
   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

   const companyFilter = columnFilters.find((f) => f.id === 'logistics_company')?.value as string | undefined;

   const { data, isLoading, isFetching, isError, error, refetch } = useLogisticsDebtListQuery({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      logistics_company: companyFilter ? Number(companyFilter) : undefined,
   });

   const results = data?.results ?? [];
   const paginationMeta = data?.pagination;
   const totalDebt = results.reduce((sum, item) => sum + (Number(item.total_debt) || 0), 0);

   const columns = [
      columnHelper.accessor('logistics_company', {
         header: 'Logistika firmasi',
         cell: (info) => info.row.original.logistics_company_detail?.name ?? `#${info.getValue()}`,
         meta: {
            filterVariant: 'select',
            filterLoadOptions: loadLogisticsCompanyOptions,
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
            <div className='flex justify-end'>
               <Tooltip content='Tarixi'>
                  <Button
                     type='button'
                     variant='info'
                     size='icon'
                     aria-label='Tarixi'
                     onClick={() => setSearchParams({ tab: 'history', debt: String(row.original.id) })}
                  >
                     <FaHistory />
                  </Button>
               </Tooltip>
            </div>
         ),
      }),
   ];

   return (
      <Panel title={`Logistika firmalariga jami qarzim: ${formatNumber(totalDebt, 2)} $`} onReload={() => refetch()}>
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
            columnVisibilityKey='logistics-debt'
            enableStriping
            isLoading={isLoading || isFetching}
            emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : 'Hech nima topilmadi.'}
            emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
         />
      </Panel>
   );
}
