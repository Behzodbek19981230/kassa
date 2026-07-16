import {
	createColumnHelper,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { Badge, Button, buttonProps, DataTable, PageHeader, Panel } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import CompanyFormModal from '@/pages/system/CompanyPage/components/CompanyFormModal';
import DeleteCompanyModal from '@/pages/system/CompanyPage/components/DeleteCompanyModal';
import { useCompanyListQuery } from '@/services/company/company.queries';
import type { Company } from '@/services/company/company.types';

const columnHelper = createColumnHelper<Company>();

export default function CompanyPage() {
	const { canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const nameFilter = columnFilters.find((f) => f.id === 'name')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useCompanyListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: nameFilter || undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		columnHelper.display({
			id: 'logo',
			header: 'Logo',
			size: 70,
			enableColumnFilter: false,
			enableSorting: false,
			cell: ({ row }) =>
				row.original.logo ? (
					<img src={row.original.logo} alt={row.original.name} className='h-8 w-8 rounded object-cover' />
				) : (
					<span className='text-ca-text'>—</span>
				),
		}),
		columnHelper.accessor('name', { header: 'Nomi', meta: { align: 'left' } }),
		columnHelper.accessor('code', { header: 'Kodi', size: 110, enableColumnFilter: false }),
		columnHelper.accessor('phone', { header: 'Telefon', size: 160, enableColumnFilter: false }),
		columnHelper.accessor('address', { header: 'Manzil', meta: { align: 'left' }, enableColumnFilter: false }),
		columnHelper.accessor('is_active', {
			header: 'Holati',
			size: 100,
			enableColumnFilter: false,
			cell: (info) => <Badge variant={info.getValue() ? 'success' : 'danger'}>{info.getValue() ? 'Faol' : 'Nofaol'}</Badge>,
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
							...buttonProps(<FaEdit />, 'warning', 'icon'),
							'aria-label': 'Tahrirlash',
							disabled: !canWrite,
						}}
						dialog={CompanyFormModal}
						dialogProps={{ mode: 'edit' as const, item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(<FaTrash />, 'danger', 'icon'),
							'aria-label': "O'chirish",
							disabled: !canWrite,
						}}
						dialog={DeleteCompanyModal}
						dialogProps={{ item: row.original }}
					/>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Tashkilotlar'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Tashkilotlar', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
							dialog={CompanyFormModal}
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
