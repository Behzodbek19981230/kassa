import { createColumnHelper, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import { Button, DataTable, Panel } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { loadLogisticsCompanyOptions } from '@/pages/TwoStageImport/options';
import { formatUserName, formatTashkentDateTime } from '@/pages/TwoStageImport/utils';
import { useLogisticsDebtHistoryQuery } from '@/services/logistics-debt/logistics-debt.queries';
import type { LogisticsDebtHistoryItem } from '@/services/logistics-debt/logistics-debt.types';

const columnHelper = createColumnHelper<LogisticsDebtHistoryItem>();

function money(value: string | null | undefined) {
   return value == null ? '-' : `${formatNumber(value, 2)} $`;
}

export default function LogisticsDebtHistoryTab() {
   // "Tarixi" on the debts tab opens this tab with ?debt=<logistics debt id>.
   const [searchParams, setSearchParams] = useSearchParams();
   const debtId = searchParams.get('debt');
   const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

   const companyFilter = columnFilters.find((f) => f.id === 'company')?.value as string | undefined;

   const { data, isLoading, isFetching, isError, error, refetch } = useLogisticsDebtHistoryQuery({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      logistics_debt: debtId ? Number(debtId) : undefined,
      logistics_company: companyFilter ? Number(companyFilter) : undefined,
   });

   const results = data?.results ?? [];
   const paginationMeta = data?.pagination;

   const columns = [
      columnHelper.display({
         id: 'date',
         header: 'Sana',
         enableColumnFilter: false,
         cell: ({ row }) => formatTashkentDateTime(row.original.created_time),
      }),
      columnHelper.display({
         id: 'company',
         header: 'Logistika firmasi',
         cell: ({ row }) => row.original.logistics_debt_detail?.logistics_company_detail?.name ?? '-',
         meta: {
            filterVariant: 'select',
            filterLoadOptions: loadLogisticsCompanyOptions,
            filterPlaceholder: 'Barchasi',
         },
      }),
      columnHelper.accessor('total_debt', {
         header: 'Qarz ($)',
         enableColumnFilter: false,
         cell: (info) => <span className='font-semibold text-ca-red'>{money(info.getValue())}</span>,
      }),
      columnHelper.accessor('all_summ_dollar', {
         header: "To'langan ($)",
         enableColumnFilter: false,
         cell: (info) => <span className='font-semibold text-ca-green'>{money(info.getValue())}</span>,
      }),
      columnHelper.accessor('discount_amount', {
         header: 'Chegirma ($)',
         enableColumnFilter: false,
         cell: (info) => money(info.getValue()),
      }),
      columnHelper.display({
         id: 'created_by',
         header: 'Kim tomonidan',
         enableColumnFilter: false,
         cell: ({ row }) => (row.original.created_by_detail ? formatUserName(row.original.created_by_detail) : '-'),
      }),
   ];

   return (
      <Panel
         title='Qarzlar tarixi'
         onReload={() => refetch()}
         actions={
            debtId && (
               <Button type='button' variant='white' size='xs' onClick={() => setSearchParams({ tab: 'history' })}>
                  Barcha qarzlar tarixi
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
            enableColumnFilters={!debtId}
            enableColumnVisibility
            columnVisibilityKey='logistics-debt-history'
            enableStriping
            isLoading={isLoading || isFetching}
            emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : 'Tarix topilmadi'}
            emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
         />
      </Panel>
   );
}
