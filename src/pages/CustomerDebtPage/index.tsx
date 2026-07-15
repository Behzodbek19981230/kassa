import { createColumnHelper, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { FaExclamationTriangle, FaExpand } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
	Badge,
	Button,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	PageHeader,
	Panel,
	RadioGroup,
	useNotification,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { formatNumber } from '@/lib/number';
import { clientService } from '@/services/client/client.service';
import { useOrderAccountHistoryGroupedListQuery } from '@/services/order-account-history/order-account-history.queries';
import type { OrderAccountHistoryItem } from '@/services/order-account-history/order-account-history.types';
import { useUserListQuery } from '@/services/user/user.queries';
import { userService } from '@/services/user/user.service';

type GroupedOrderAccountHistoryItem = OrderAccountHistoryItem & {
	_no: number;
	_groupFirst: boolean;
	_dateLabel: string;
};

const columnHelper = createColumnHelper<GroupedOrderAccountHistoryItem>();

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

function formatDateTime(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	const date = d.toLocaleDateString('ru-RU');
	const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	return `${date} ${time}`;
}

export default function CustomerDebtPage() {
	const navigate = useNavigate();
	const { notify } = useNotification();
	const { companyId } = useCurrentCompany();

	const [showFilters, setShowFilters] = useState(false);
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const clientFilter = columnFilters.find((f) => f.id === 'client')?.value as string | undefined;
	const createdByFilter = columnFilters.find((f) => f.id === 'created_by')?.value as string | undefined;
	const vozvratFilter = columnFilters.find((f) => f.id === 'is_vozvrat')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useOrderAccountHistoryGroupedListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		company_id: companyId ?? undefined,
		client: clientFilter ? Number(clientFilter) : undefined,
		created_by: createdByFilter ? Number(createdByFilter) : undefined,
		is_vozvrat: vozvratFilter ? vozvratFilter === 'true' : undefined,
		is_debtor: 1,
	});

	const paginationMeta = data?.pagination;

	const results: GroupedOrderAccountHistoryItem[] = useMemo(
		() =>
			(data?.results.groups ?? []).flatMap((group) =>
				group.items.map((item, index) => ({
					...item,
					_no: group.count - index,
					_groupFirst: index === 0,
					_dateLabel: group.date_label,
				})),
			),
		[data],
	);

	const { data: userData } = useUserListQuery({ limit: 100 });
	const userLabelById = new Map((userData?.results ?? []).map((u) => [u.id, userLabel(u)]));

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

	function stub() {
		notify({ title: 'Tez orada', text: 'Bu funksiya hali ulanmagan.' });
	}

	const columns = [
		columnHelper.display({
			id: 'no',
			header: '№',
			size: 40,
			enableColumnFilter: false,
			cell: ({ row }) => row.original._no,
		}),
		columnHelper.accessor('date', {
			header: 'Sana',
			size: 100,
			enableColumnFilter: false,
			cell: ({ row }) =>
				row.original._groupFirst ? (
					<span className='font-semibold text-ca-theme'>{row.original._dateLabel}</span>
				) : null,
		}),
		columnHelper.accessor('client', {
			header: 'Mijoz',
			cell: (info) => info.row.original.client_name ?? info.getValue(),
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadClientOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('created_by', {
			header: 'Kim buyurtma oldi',
			cell: (info) => {
				const detail = info.row.original.created_by_detail;
				return detail ? userLabel(detail) : (userLabelById.get(info.getValue()) ?? '');
			},
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadUserOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('is_vozvrat', {
			header: 'Vozvrat',
			size: 90,
			cell: (info) => (
				<Badge variant={info.getValue() ? 'danger' : 'default'}>{info.getValue() ? 'Ha' : "Yo'q"}</Badge>
			),
			meta: {
				filterVariant: 'select',
				filterOptions: [
					{ value: 'true', label: 'Ha' },
					{ value: 'false', label: "Yo'q" },
				],
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('all_summ_dollar', {
			header: "To'lanadigan summa ($)",
			size: 150,
			enableColumnFilter: false,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.display({
			id: 'paid_summa',
			header: "To'langan summa ($)",
			size: 150,
			enableColumnFilter: false,
			cell: ({ row }) => {
				const item = row.original;
				const rate = Number(item.exchange_rate) || 0;
				const paid =
					(Number(item.sum_dollar) || 0) +
					(rate > 0 ? (Number(item.sum_som) || 0) / rate : 0) +
					(Number(item.sum_cart) || 0) +
					(Number(item.sum_transfers) || 0);
				return `${formatNumber(paid, 2)} $`;
			},
		}),
		columnHelper.display({
			id: 'zdacha',
			header: 'Qaytim',
			size: 150,
			enableColumnFilter: false,
			cell: ({ row }) =>
				`${formatNumber(row.original.zdacha_sum)} so'm / ${formatNumber(row.original.zdacha_dollar, 2)} $`,
		}),
		columnHelper.accessor('total_debt_today', {
			header: 'Bugungi qarz ($)',
			size: 130,
			enableColumnFilter: false,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.accessor('total_debt', {
			header: 'Umumiy qolgan qarz ($)',
			size: 160,
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
		columnHelper.accessor('all_profit_dollar', {
			header: 'Jami foyda ($)',
			size: 130,
			enableColumnFilter: false,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.accessor('created_time', {
			header: 'Yaratilgan vaqt',
			size: 140,
			enableColumnFilter: false,
			cell: (info) => <span className='text-ca-red'>{formatDateTime(info.getValue())}</span>,
		}),
		columnHelper.display({
			id: 'status',
			header: 'Buyurtma holati',
			size: 130,
			enableColumnFilter: false,
			cell: ({ row }) => (
				<span className='text-ca-orange'>
					Do'kon: {row.original.status_order_dukon ? 'Tayyor' : 'Jarayonda'}
				</span>
			),
		}),
		columnHelper.display({
			id: 'keshbek',
			header: 'Keshbek ($)',
			size: 110,
			enableColumnFilter: false,
			cell: ({ row }) => (
				<span className='font-semibold text-ca-green'>
					{formatNumber(row.original.client_detail?.keshbek ?? 0, 2)} $
				</span>
			),
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableColumnFilter: false,
			size: 90,
			cell: ({ row }) => (
				<div className='flex justify-end gap-1'>
					<Button
						type='button'
						variant='default'
						size='icon'
						aria-label='Batafsil'
						onClick={() => navigate(`/customer-order-history/${row.original.id}`)}
					>
						<FaExpand />
					</Button>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Mijozdan qarzdorlik'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Mijozdan qarzdorlik', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					<div className='flex flex-wrap items-center gap-2'>
						<Button type='button' variant='info' size='xs' onClick={stub}>
							$ Dollar kursni o'zgartirish
						</Button>
						<Button type='button' variant='warning' size='xs' onClick={stub}>
							<FaExclamationTriangle className='mr-1.5' /> Narxdagi farq
						</Button>
						<Button type='button' variant='danger' size='xs' onClick={() => navigate('/place-order')}>
							Karzinka
						</Button>
						<Button
							type='button'
							variant='theme'
							size='xs'
							onClick={() => {
								setColumnFilters([]);
								setPagination((p) => ({ ...p, pageIndex: 0 }));
							}}
						>
							Hammasi
						</Button>
					</div>
				}
				onReload={() => refetch()}
			>
				<div className='mb-4 flex items-center gap-3 rounded-[3px] border border-ca-border bg-white px-4 py-3'>
					<span className='text-xs font-semibold text-ca-heading'>Filter ko'rinsinmi?</span>
					<RadioGroup
						name='show-filters'
						inline
						value={String(showFilters)}
						onChange={(v) => setShowFilters(v === 'true')}
						options={[
							{ value: 'true', label: 'Ha' },
							{ value: 'false', label: "Yo'q" },
						]}
					/>
				</div>

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
					enableColumnFilters={showFilters}
					enableColumnVisibility
					enableStriping
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>
		</>
	);
}
