import { createColumnHelper, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { Button, buttonProps, DataTable, Panel } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import DeleteTypeModal from '@/pages/system/ProductMeasurementPage/components/DeleteTypeModal';
import TypeFormModal from '@/pages/system/ProductMeasurementPage/components/TypeFormModal';
import { useBrandSizeTypeListQuery } from '@/services/brand-size-type/brand-size-type.queries';
import type { BrandSizeType } from '@/services/brand-size-type/brand-size-type.types';

const PAGE_SIZE = 10;

const typeColumnHelper = createColumnHelper<BrandSizeType>();

export default function SizeTypesTab() {
	const { canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE });
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const nameFilter = columnFilters.find((f) => f.id === 'name')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useBrandSizeTypeListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: nameFilter || undefined,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		typeColumnHelper.accessor('sorting', { header: 'Tartibi', size: 100, enableColumnFilter: false }),
		typeColumnHelper.accessor('name', { header: 'Nomi', meta: { align: 'left' } }),
		typeColumnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableSorting: false,
			enableColumnFilter: false,
			size: 190,
			cell: ({ row }) => (
				<div className='flex justify-end gap-1'>
					{/* <OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{ ...buttonProps(<FaEye />, 'info', 'icon'), 'aria-label': "Ko'rish" }}
						dialog={TypeViewModal}
						dialogProps={{ item: row.original }}
					/> */}
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(<FaEdit />, 'warning', 'icon'),
							'aria-label': 'Tahrirlash',
							disabled: !canWrite,
						}}
						dialog={TypeFormModal}
						dialogProps={{ mode: 'edit' as const, item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(<FaTrash />, 'danger', 'icon'),
							'aria-label': "O'chirish",
							disabled: !canWrite,
						}}
						dialog={DeleteTypeModal}
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
							dialog={TypeFormModal}
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
					enableColumnVisibility
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>
		</>
	);
}
