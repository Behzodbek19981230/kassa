import {
	createColumnHelper,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import {
	Badge,
	Button,
	buttonProps,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	Panel,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import DeleteDistrictModal from '@/pages/system/LocationPage/components/DeleteDistrictModal';
import DistrictFormModal from '@/pages/system/LocationPage/components/DistrictFormModal';
import { useDistrictListQuery } from '@/services/district/district.queries';
import type { District } from '@/services/district/district.types';
import { useRegionListQuery } from '@/services/region/region.queries';
import { regionService } from '@/services/region/region.service';

const columnHelper = createColumnHelper<District>();

export default function DistrictsTab() {
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const nameFilter = columnFilters.find((f) => f.id === 'name')?.value as string | undefined;
	const regionFilter = columnFilters.find((f) => f.id === 'region')?.value as string | undefined;

	const { data: regionData } = useRegionListQuery({ limit: 100 });
	const regions = regionData?.results ?? [];
	const regionNameById = new Map(regions.map((r) => [r.id, r.name]));

	const loadRegionOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await regionService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((r) => ({ value: String(r.id), label: r.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const { data, isLoading, isFetching, isError, refetch } = useDistrictListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: nameFilter || undefined,
		region: regionFilter ? Number(regionFilter) : undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		columnHelper.accessor('name', { header: 'Nomi', meta: { align: 'left' } }),
		columnHelper.accessor('code', { header: 'Kodi', size: 110, enableColumnFilter: false }),
		columnHelper.accessor('region', {
			header: 'Viloyat',
			size: 200,
			cell: (info) => regionNameById.get(info.getValue()) ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadRegionOptions,
				filterSelectedLabel: (value: string) => regionNameById.get(Number(value)),
				filterPlaceholder: 'Barcha viloyatlar',
			},
		}),
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
						elementProps={{ ...buttonProps(<FaEdit />, 'warning', 'icon'), 'aria-label': 'Tahrirlash' }}
						dialog={DistrictFormModal}
						dialogProps={{ mode: 'edit' as const, item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{ ...buttonProps(<FaTrash />, 'danger', 'icon'), 'aria-label': "O'chirish" }}
						dialog={DeleteDistrictModal}
						dialogProps={{ item: row.original }}
					/>
				</div>
			),
		}),
	];

	return (
		<Panel
			title="Ro'yxat"
			actions={
				<OpenDialogButton
					element={(props) => <Button {...props} />}
					elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
					dialog={DistrictFormModal}
					dialogProps={{ mode: 'create' as const }}
				/>
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
	);
}
