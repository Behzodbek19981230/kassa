import { createColumnHelper, type PaginationState, type SortingState, type ColumnFiltersState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaCheckSquare, FaEdit, FaExclamationTriangle, FaExpand, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
	Button,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	PageHeader,
	Panel,
	useNotification,
} from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { consignorService } from '@/services/consignor/consignor.service';
import { useSkladListQuery } from '@/services/sklad/sklad.queries';
import type { SkladItem } from '@/services/sklad/sklad.types';
import { userService } from '@/services/user/user.service';

const columnHelper = createColumnHelper<SkladItem>();

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

function formatTime(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleTimeString('ru-RU');
}

export default function WarehouseAccountPage() {
	const navigate = useNavigate();
	const { notify } = useNotification();

	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const consignorFilter = columnFilters.find((f) => f.id === 'consignor_ref')?.value as string | undefined;
	const createdByFilter = columnFilters.find((f) => f.id === 'created_by')?.value as string | undefined;
	const statusFilter = columnFilters.find((f) => f.id === 'import_product_status')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useSkladListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		consignor_ref: consignorFilter ? Number(consignorFilter) : undefined,
		created_by: createdByFilter ? Number(createdByFilter) : undefined,
		import_product_status: statusFilter ? statusFilter === 'true' : undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const loadConsignorOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await consignorService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.name })),
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

	function stub() {
		notify({ title: 'Tez orada', text: 'Bu funksiya hali ulanmagan.' });
	}

	const columns = [
		columnHelper.accessor('consignor_ref', {
			header: "Yuk jo'natuvchi",
			cell: (info) => (
				<span className='font-semibold text-ca-red'>{info.row.original.consignor_ref_detail?.name ?? ''}</span>
			),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadConsignorOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('created_by', {
			header: 'Qabul qiluvchi xodim',
			cell: (info) => {
				const detail = info.row.original.created_by_detail;
				return <span className='font-semibold text-ca-red'>{detail ? userLabel(detail) : ''}</span>;
			},
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadUserOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('given_sum_dollar', {
			header: 'Berilishi kerak Summa ($)',
			size: 150,
			enableColumnFilter: false,
			cell: (info) => (
				<span className='font-semibold text-ca-red'>{formatNumber(info.getValue(), 2)} $</span>
			),
		}),
		columnHelper.display({
			id: 'given_summa',
			header: 'Berilgan Summa ($)',
			size: 140,
			enableSorting: false,
			enableColumnFilter: false,
			cell: ({ row }) => {
				const item = row.original;
				const rate = Number(item.exchange_rate) || 0;
				const paid = (Number(item.sum_dollar) || 0) + (rate > 0 ? (Number(item.sum_som) || 0) / rate : 0);
				return <span className='font-semibold text-ca-red'>{formatNumber(paid, 2)} $</span>;
			},
		}),
		columnHelper.accessor('discount_amount', {
			header: 'Jami chegirma ($)',
			size: 140,
			enableColumnFilter: false,
			cell: (info) => (
				<span className='font-semibold text-ca-red'>{formatNumber(info.getValue(), 2)} $</span>
			),
		}),
		columnHelper.accessor('my_total_debt', {
			header: 'Mening barcha qarzim ($)',
			size: 170,
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
		columnHelper.accessor('car_number', {
			header: 'Avtomobil raqami',
			size: 130,
			enableColumnFilter: false,
			cell: (info) => <span className='font-semibold text-ca-red'>{info.getValue()}</span>,
		}),
		columnHelper.accessor('comment', {
			header: 'Izoh',
			size: 120,
			enableColumnFilter: false,
		}),
		columnHelper.accessor('exchange_rate', {
			header: 'Dollar kursi',
			size: 120,
			enableColumnFilter: false,
			cell: (info) => `${formatNumber(info.getValue(), 2)} $`,
		}),
		columnHelper.accessor('cr_date', {
			header: 'Sana',
			size: 100,
			enableColumnFilter: false,
		}),
		columnHelper.accessor('cr_date_time', {
			header: 'Vaqti',
			size: 100,
			enableColumnFilter: false,
			cell: (info) => formatTime(info.getValue()),
		}),
		columnHelper.accessor('import_product_status', {
			header: 'Holati',
			size: 130,
			cell: (info) => (
				<span className={info.getValue() ? 'font-bold text-ca-green' : 'font-bold text-ca-orange'}>
					{info.getValue() ? 'Tasdiqlangan' : 'Tasdiqlanmagan'}
				</span>
			),
			meta: {
				filterVariant: 'select',
				filterOptions: [
					{ value: 'true', label: 'Tasdiqlangan' },
					{ value: 'false', label: 'Tasdiqlanmagan' },
				],
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableSorting: false,
			enableColumnFilter: false,
			size: 150,
			cell: ({ row }) => (
				<div className='flex flex-wrap justify-end gap-1'>
					{!row.original.import_product_status && (
						<Button type='button' variant='danger' size='icon' aria-label='Tasdiqlash' onClick={stub}>
							<FaCheckSquare />
						</Button>
					)}
					<Button
						type='button'
						variant='warning'
						size='icon'
						aria-label='Tahrirlash'
						onClick={() => navigate(`/warehouse-report/${row.original.id}/edit`)}
					>
						<FaEdit />
					</Button>
					<Button
						type='button'
						variant='info'
						size='icon'
						aria-label='Batafsil'
						onClick={() => navigate(`/warehouse-report/${row.original.id}`)}
					>
						<FaExpand />
					</Button>
					<Button type='button' variant='danger' size='icon' aria-label="O'chirish" onClick={stub}>
						<FaTrash />
					</Button>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Omborxona hisobi'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Omborxona hisobi', active: true },
				]}
			/>

			<Panel title="Import qilingan mahsulotlar ro'yxat" onReload={() => refetch()}>
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
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>
		</>
	);
}
