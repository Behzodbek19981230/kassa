import {
	createColumnHelper,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaTrash, FaWarehouse } from 'react-icons/fa';
import { Button, buttonProps, DataTable, PageHeader, Panel } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { useCountryListQuery } from '@/services/country/country.queries';
import { useLogisticsCompanyListQuery } from '@/services/logistics-company/logistics-company.queries';
import type { LogisticsCompany } from '@/services/logistics-company/logistics-company.types';
import DeleteLogisticsCompanyModal from '@/pages/system/LogisticsCompanyPage/components/DeleteLogisticsCompanyModal';
import LogisticsCompanyWarehousesModal from '@/pages/system/LogisticsCompanyPage/components/LogisticsCompanyWarehousesModal';
import LogisticsCompanyFormModal from '@/pages/system/LogisticsCompanyPage/components/LogisticsCompanyFormModal';

const columnHelper = createColumnHelper<LogisticsCompany>();

export default function LogisticsCompanyPage() {
	const { canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const nameFilter = columnFilters.find((f) => f.id === 'name')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, error, refetch } = useLogisticsCompanyListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: nameFilter || undefined,
		ordering,
	});

	// Fallback for rows that only carry the country id: resolve its name from the country list.
	const { data: countriesData } = useCountryListQuery({ limit: 200 });
	const countryNames = useMemo(
		() => new Map((countriesData?.results ?? []).map((c) => [c.id, c.name])),
		[countriesData],
	);

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		columnHelper.accessor('name', { header: 'Nomi', meta: { align: 'left' } }),
		columnHelper.display({
			id: 'country',
			header: 'Davlat',
			meta: { align: 'left' },
			enableSorting: false,
			enableColumnFilter: false,
			cell: ({ row }) => row.original.country_name ?? countryNames.get(row.original.country ?? -1) ?? '-',
		}),
		columnHelper.accessor('phone', {
			header: 'Telefon',
			meta: { align: 'left' },
			enableSorting: false,
			enableColumnFilter: false,
			cell: (info) => info.getValue() || '-',
		}),
		columnHelper.accessor('contact_person', {
			header: 'Kontakt shaxs',
			meta: { align: 'left' },
			enableSorting: false,
			enableColumnFilter: false,
			cell: (info) => info.getValue() || '-',
		}),
		columnHelper.accessor('address', {
			header: 'Manzil',
			meta: { align: 'left' },
			enableSorting: false,
			enableColumnFilter: false,
			cell: (info) => (
				<span className='block max-w-[220px] truncate' title={info.getValue() ?? undefined}>
					{info.getValue() || '-'}
				</span>
			),
		}),
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
								...buttonProps(<FaWarehouse />, 'theme', 'icon'),
								'aria-label': 'Skladlar',
							}}
							dialog={LogisticsCompanyWarehousesModal}
							dialogProps={{ company: row.original }}
						/>
					{canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{
								...buttonProps(<FaEdit />, 'warning', 'icon'),
								'aria-label': 'Tahrirlash',
							}}
							dialog={LogisticsCompanyFormModal}
							dialogProps={{ mode: 'edit' as const, item: row.original }}
						/>
					)}
					{canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{
								...buttonProps(<FaTrash />, 'danger', 'icon'),
								'aria-label': "O'chirish",
							}}
							dialog={DeleteLogisticsCompanyModal}
							dialogProps={{ item: row.original }}
						/>
					)}
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Logistika firmalari'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Tizim boshqaruvi' },
					{ label: 'Logistika firmalari', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
							dialog={LogisticsCompanyFormModal}
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
					columnVisibilityKey='logistics-company'
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
