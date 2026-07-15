import {
	createColumnHelper,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import {
	Button,
	buttonProps,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	PageHeader,
	Panel,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { formatNumber } from '@/lib/number';
import ClientFormModal from '@/pages/settings/ClientPage/components/ClientFormModal';
import DeleteClientModal from '@/pages/settings/ClientPage/components/DeleteClientModal';
import { useClientListQuery } from '@/services/client/client.queries';
import { CLIENT_PROFIT_LOSS_OPTIONS, CLIENT_TYPE_OPTIONS } from '@/services/client/client.types';
import type { Client, ClientType } from '@/services/client/client.types';
import { districtService } from '@/services/district/district.service';
import { useRegionListQuery } from '@/services/region/region.queries';
import { regionService } from '@/services/region/region.service';
import { userService } from '@/services/user/user.service';

const columnHelper = createColumnHelper<Client>();
const clientTypeLabelByValue = new Map(CLIENT_TYPE_OPTIONS.map((o) => [o.value, o.label]));
const profitLossLabelByValue = new Map(CLIENT_PROFIT_LOSS_OPTIONS.map((o) => [o.value, o.label]));

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

export default function ClientPage() {
	const { companyId, canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const nameFilter = columnFilters.find((f) => f.id === 'fio')?.value as string | undefined;
	const workerUserFilter = columnFilters.find((f) => f.id === 'worker_user')?.value as string | undefined;
	const regionFilter = columnFilters.find((f) => f.id === 'region')?.value as string | undefined;
	const districtFilter = columnFilters.find((f) => f.id === 'district')?.value as string | undefined;
	const typeFilter = columnFilters.find((f) => f.id === 'type')?.value as string | undefined;
	const profitLossFilter = columnFilters.find((f) => f.id === 'is_profit_loss')?.value as string | undefined;
	const createdByFilter = columnFilters.find((f) => f.id === 'created_by')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useClientListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		company_id: companyId ?? undefined,
		search: nameFilter || undefined,
		worker_user: workerUserFilter ? Number(workerUserFilter) : undefined,
		region: regionFilter ? Number(regionFilter) : undefined,
		district: districtFilter ? Number(districtFilter) : undefined,
		type: (typeFilter as ClientType) || undefined,
		is_profit_loss: profitLossFilter ? (Number(profitLossFilter) as 0 | 1) : undefined,
		created_by: createdByFilter ? Number(createdByFilter) : undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const { data: regionData } = useRegionListQuery({ limit: 100 });
	const regionNameById = new Map((regionData?.results ?? []).map((r) => [r.id, r.name]));

	const loadRegionOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await regionService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((r) => ({ value: String(r.id), label: r.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadDistrictOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await districtService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((d) => ({ value: String(d.id), label: d.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadUserOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await userService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((u) => ({ value: String(u.id), label: userLabel(u) })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const columns = [
		columnHelper.accessor('fio', { header: 'FIO', meta: { align: 'left' } }),
		columnHelper.accessor('total_debt', {
			header: 'Qarzi ($)',
			size: 120,
			enableColumnFilter: false,
			cell: (info) => <span className='font-semibold text-ca-red'>{formatNumber(info.getValue(), 2)}</span>,
		}),
		columnHelper.accessor('phone', { header: 'Telefon nomer', size: 160, enableColumnFilter: false }),
		columnHelper.accessor('worker_user', {
			header: "Mas'ul xodim",
			cell: (info) => info.row.original.worker_user_detail && userLabel(info.row.original.worker_user_detail),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadUserOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('region', {
			header: 'Viloyat',
			cell: (info) => info.row.original.region_detail?.name ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadRegionOptions,
				filterSelectedLabel: (value) => regionNameById.get(Number(value)),
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('district', {
			header: 'Tuman',
			cell: (info) => info.row.original.district_detail?.name ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadDistrictOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('type', {
			header: 'Mijoz turi',
			cell: (info) => clientTypeLabelByValue.get(info.getValue()) ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterOptions: CLIENT_TYPE_OPTIONS,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('is_profit_loss', {
			header: 'Foyda/Zarar hisoblanasinmi?',
			size: 170,
			cell: (info) => (
				<span className={info.getValue() ? 'font-semibold text-ca-green' : 'font-semibold text-ca-red'}>
					{info.getValue() ? 'Hisoblansin' : 'Hisoblanmasin'}
				</span>
			),
			meta: {
				filterVariant: 'select',
				filterOptions: CLIENT_PROFIT_LOSS_OPTIONS,
				filterSelectedLabel: (value) => profitLossLabelByValue.get(value),
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('created_by', {
			header: "Kim qo'shgan",
			cell: (info) => info.row.original.created_by_detail && userLabel(info.row.original.created_by_detail),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadUserOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('keshbek', {
			header: 'Keshbek (%)',
			size: 110,
			enableColumnFilter: false,
			cell: (info) => `${formatNumber(info.getValue(), 2)}%`,
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
						dialog={ClientFormModal}
						dialogProps={{ mode: 'edit' as const, item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(<FaTrash />, 'danger', 'icon'),
							'aria-label': "O'chirish",
							disabled: !canWrite,
						}}
						dialog={DeleteClientModal}
						dialogProps={{ item: row.original }}
					/>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Mijozlar'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Mijozlar', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
							dialog={ClientFormModal}
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
					enableExportPdf
					enableExportExcel
					exportFileName='mijozlar.csv'
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>
		</>
	);
}
