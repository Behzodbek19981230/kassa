import { createColumnHelper, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaExpand, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
	Button,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	PageHeader,
	Panel,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { formatNumber } from '@/lib/number';
import { clientService } from '@/services/client/client.service';
import { useVozvratOrderListQuery } from '@/services/vozvrat/vozvrat.queries';
import type { VozvratOrderListItem } from '@/services/vozvrat/vozvrat.types';
import { userService } from '@/services/user/user.service';
import DeleteVozvratOrderModal from '@/pages/VozvratOrderHistoryPage/components/DeleteVozvratOrderModal';

const columnHelper = createColumnHelper<VozvratOrderListItem>();

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

export default function VozvratOrderHistoryPage() {
	const navigate = useNavigate();
	const { canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [deletingItem, setDeletingItem] = useState<VozvratOrderListItem | null>(null);

	const clientFilter = columnFilters.find((f) => f.id === 'client')?.value as string | undefined;
	const createdByFilter = columnFilters.find((f) => f.id === 'created_by')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useVozvratOrderListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		client: clientFilter ? Number(clientFilter) : undefined,
		created_by: createdByFilter ? Number(createdByFilter) : undefined,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const loadClientOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await clientService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.fio })),
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
		columnHelper.accessor('client', {
			header: 'Mijoz',
			cell: (info) => info.row.original.client_detail?.fio ?? '',
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadClientOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('created_by', {
			header: 'Xodim',
			cell: (info) => {
				const detail = info.row.original.created_by_detail;
				return detail ? userLabel(detail) : '';
			},
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadUserOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('product_summ_dollar', {
			header: 'Qaytgan mahsulot summasi ($)',
			enableColumnFilter: false,
			cell: (info) => `${formatNumber(info.getValue(), 2)} $`,
		}),
		columnHelper.accessor('all_summ_dollar', {
			header: 'Mijozga qaytarilgan summa ($)',
			enableColumnFilter: false,
			cell: (info) => `${formatNumber(info.getValue(), 2)} $`,
		}),
		columnHelper.accessor('total_debt', {
			header: 'Umumiy qarz ($)',
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
		columnHelper.accessor('date', {
			header: 'Sana',
			enableColumnFilter: false,
		}),
		columnHelper.accessor('comment', {
			header: 'Izoh',
			enableColumnFilter: false,
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableColumnFilter: false,
			cell: ({ row }) => (
				<div className='flex justify-end gap-1'>
					<Button
						type='button'
						variant='warning'
						size='icon'
						aria-label='Tahrirlash'
						disabled={!canWrite}
						onClick={() => navigate(`/vozvrat-order-history/${row.original.id}/edit`)}
					>
						<FaEdit />
					</Button>
					<Button
						type='button'
						variant='info'
						size='icon'
						aria-label='Batafsil'
						onClick={() => navigate(`/vozvrat-order-history/${row.original.id}`)}
					>
						<FaExpand />
					</Button>
					<Button
						type='button'
						variant='danger'
						size='icon'
						aria-label="O'chirish"
						disabled={!canWrite}
						onClick={() => setDeletingItem(row.original)}
					>
						<FaTrash />
					</Button>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Vozvrat buyurtmalar tarixi'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Vozvrat buyurtmalar tarixi', active: true },
				]}
			/>

			<Panel title="Ro'yxat" onReload={() => refetch()}>
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
					enableStriping
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? 'Xatolik yuz berdi' : 'Hech nima topilmadi.'}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>

			{deletingItem && (
				<DeleteVozvratOrderModal
					open={Boolean(deletingItem)}
					setOpen={(open) => !open && setDeletingItem(null)}
					item={deletingItem}
				/>
			)}
		</>
	);
}
