import {
	createColumnHelper,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { Badge, Button, buttonProps, DataTable, PageHeader, Panel } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { useCountryListQuery } from '@/services/country/country.queries';
import { useLogisticsCompanyListQuery } from '@/services/logistics-company/logistics-company.queries';
import { useLogisticsWarehouseListQuery } from '@/services/logistics-warehouse/logistics-warehouse.queries';
import type { LogisticsWarehouse } from '@/services/logistics-warehouse/logistics-warehouse.types';
import DeleteLogisticsWarehouseModal from '@/pages/system/LogisticsWarehousePage/components/DeleteLogisticsWarehouseModal';
import LogisticsWarehouseFormModal from '@/pages/system/LogisticsWarehousePage/components/LogisticsWarehouseFormModal';

const columnHelper = createColumnHelper<LogisticsWarehouse>();

export default function LogisticsWarehousePage() {
	const { canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const nameFilter = columnFilters.find((f) => f.id === 'name')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, error, refetch } = useLogisticsWarehouseListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: nameFilter || undefined,
		ordering,
	});

	// Fallbacks for rows that only carry an id: resolve the names from the reference lists.
	const { data: countriesData } = useCountryListQuery({ limit: 200 });
	const countryNames = useMemo(
		() => new Map((countriesData?.results ?? []).map((c) => [c.id, c.name])),
		[countriesData],
	);
	const { data: logisticsCompaniesData } = useLogisticsCompanyListQuery({ limit: 200 });
	const logisticsCompanyNames = useMemo(
		() => new Map((logisticsCompaniesData?.results ?? []).map((c) => [c.id, c.name])),
		[logisticsCompaniesData],
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
		columnHelper.display({
			id: 'logistics-company',
			header: 'Logistika firmasi',
			meta: { align: 'left' },
			enableSorting: false,
			enableColumnFilter: false,
			cell: ({ row }) =>
				row.original.logistics_company_name ??
				logisticsCompanyNames.get(row.original.logistics_company ?? -1) ??
				'-',
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
				<span className='block max-w-55 truncate' title={info.getValue() ?? undefined}>
					{info.getValue() || '-'}
				</span>
			),
		}),
		columnHelper.display({
			id: 'is-active',
			header: 'Holati',
			meta: { align: 'left' },
			enableSorting: false,
			enableColumnFilter: false,
			cell: ({ row }) =>
				row.original.is_active === false ? (
					<Badge variant='default'>Nofaol</Badge>
				) : (
					<Badge variant='success'>Faol</Badge>
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
					{canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{
								...buttonProps(<FaEdit />, 'warning', 'icon'),
								'aria-label': 'Tahrirlash',
							}}
							dialog={LogisticsWarehouseFormModal}
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
							dialog={DeleteLogisticsWarehouseModal}
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
				title='Logistika skladlari'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Tizim boshqaruvi' },
					{ label: 'Logistika skladlari', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
							dialog={LogisticsWarehouseFormModal}
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
					columnVisibilityKey='logistics-warehouse'
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
