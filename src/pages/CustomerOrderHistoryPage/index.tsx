import { Fragment, useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaExpand, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
	Badge,
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DatePicker,
	PageHeader,
	Pagination,
	Panel,
	RadioGroup,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	useNotification,
} from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { clientService } from '@/services/client/client.service';
import { useOrderAccountHistoryGroupedListQuery } from '@/services/order-account-history/order-account-history.queries';
import type { OrderAccountHistoryItem } from '@/services/order-account-history/order-account-history.types';
import { useUserListQuery } from '@/services/user/user.queries';
import { userService } from '@/services/user/user.service';

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

function formatDateTime(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	const date = d.toLocaleDateString('ru-RU');
	const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	return `${date} ${time}`;
}

const pageSizeOptions = [10, 25, 50, 100];

export default function CustomerOrderHistoryPage() {
	const navigate = useNavigate();
	const { notify } = useNotification();

	const [showFilters, setShowFilters] = useState(false);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
	const [dateFilter, setDateFilter] = useState('');
	const [clientFilter, setClientFilter] = useState('');
	const [createdByFilter, setCreatedByFilter] = useState('');
	const [vozvratFilter, setVozvratFilter] = useState('');

	const { data, isLoading, isFetching, isError, refetch } = useOrderAccountHistoryGroupedListQuery({
		page,
		limit: pageSize,
		date: dateFilter || undefined,
		client: clientFilter ? Number(clientFilter) : undefined,
		created_by: createdByFilter ? Number(createdByFilter) : undefined,
		is_vozvrat: vozvratFilter ? vozvratFilter === 'true' : undefined,
	});

	const groups = data?.results.groups ?? [];
	const paginationMeta = data?.pagination;
	const totalRows = paginationMeta?.total ?? 0;
	const start = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
	const end = paginationMeta ? Math.min(page * pageSize, totalRows) : 0;

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

	function resetFilters() {
		setDateFilter('');
		setClientFilter('');
		setCreatedByFilter('');
		setVozvratFilter('');
		setPage(1);
	}

	function setFilterAndResetPage<T>(setter: (v: T) => void) {
		return (v: T) => {
			setter(v);
			setPage(1);
		};
	}

	function paidSum(item: OrderAccountHistoryItem) {
		const rate = Number(item.exchange_rate) || 0;
		return (
			(Number(item.sum_dollar) || 0) +
			(rate > 0 ? (Number(item.sum_som) || 0) / rate : 0) +
			(Number(item.sum_cart) || 0) +
			(Number(item.sum_transfers) || 0)
		);
	}

	const columns = [
		{ id: 'no', header: '№', size: 40 },
		{ id: 'client', header: 'Mijoz' },
		{ id: 'created_by', header: 'Kim buyurtma oldi' },
		{ id: 'is_vozvrat', header: 'Vozvrat' },
		{ id: 'all_summ_dollar', header: "To'lanadigan summa ($)" },
		{ id: 'paid_summa', header: "To'langan summa ($)" },
		{ id: 'zdacha', header: 'Qaytim' },
		{ id: 'total_debt_today', header: 'Bugungi qarz ($)' },
		{ id: 'total_debt', header: 'Umumiy qolgan qarz ($)' },
		{ id: 'all_profit_dollar', header: 'Jami foyda ($)' },
		{ id: 'created_time', header: 'Yaratilgan vaqt' },
		{ id: 'status', header: 'Buyurtma holati' },
		{ id: 'actions', header: 'Harakatlar', align: 'right' as const },
	];

	return (
		<>
			<PageHeader
				title='Mijoz buyurtmalari tarixi'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Mijoz buyurmalari tarixi', active: true },
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
						<Button type='button' variant='theme' size='xs' onClick={resetFilters}>
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

				{showFilters && (
					<div className='mb-4 grid grid-cols-1 gap-3 rounded-[3px] border border-ca-border bg-white px-4 py-3 sm:grid-cols-2 lg:grid-cols-4'>
						<div>
							<label className='mb-1 block text-[11px] font-semibold text-ca-heading'>Sana</label>
							<DatePicker value={dateFilter} onChange={setFilterAndResetPage(setDateFilter)} />
						</div>
						<div>
							<label className='mb-1 block text-[11px] font-semibold text-ca-heading'>Mijoz</label>
							<Combobox
								clearable
								value={clientFilter}
								onChange={setFilterAndResetPage(setClientFilter)}
								loadOptions={loadClientOptions}
								placeholder='Barchasi'
								searchPlaceholder='Qidirish...'
							/>
						</div>
						<div>
							<label className='mb-1 block text-[11px] font-semibold text-ca-heading'>Kim buyurtma oldi</label>
							<Combobox
								clearable
								value={createdByFilter}
								onChange={setFilterAndResetPage(setCreatedByFilter)}
								loadOptions={loadUserOptions}
								placeholder='Barchasi'
								searchPlaceholder='Qidirish...'
							/>
						</div>
						<div>
							<label className='mb-1 block text-[11px] font-semibold text-ca-heading'>Vozvrat</label>
							<Select value={vozvratFilter} onValueChange={setFilterAndResetPage(setVozvratFilter)}>
								<SelectTrigger>
									<SelectValue placeholder='Barchasi' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value=''>Barchasi</SelectItem>
									<SelectItem value='true'>Ha</SelectItem>
									<SelectItem value='false'>Yo'q</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				)}

				<div className='mb-2.5 flex items-center gap-2 text-xs'>
					<Select
						value={String(pageSize)}
						onValueChange={(v) => {
							setPageSize(Number(v));
							setPage(1);
						}}
					>
						<SelectTrigger className='h-[30px] w-[70px]'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{pageSizeOptions.map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='overflow-x-auto'>
					<Table className='min-w-[1024px] rounded-[3px] border border-ca-border'>
						<TableHeader>
							<TableRow>
								{columns.map((col) => (
									<TableHead
										key={col.id}
										className={col.align === 'right' ? 'text-right' : undefined}
										style={col.size ? { width: col.size } : undefined}
									>
										{col.header}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								Array.from({ length: pageSize }).map((_, rowIndex) => (
									<TableRow key={`skeleton-${rowIndex}`}>
										{columns.map((col) => (
											<TableCell key={col.id}>
												<Skeleton className='h-4 w-full' />
											</TableCell>
										))}
									</TableRow>
								))
							) : groups.length ? (
								groups.map((group) => (
									<Fragment key={group.date}>
										<TableRow className='bg-ca-silver-light'>
											<TableCell colSpan={columns.length} className='py-2 font-bold text-ca-heading'>
												{group.date_label}
												<span className='ml-2 font-normal text-ca-text'>({group.count} ta)</span>
											</TableCell>
										</TableRow>
										{group.items.map((item, index) => (
											<TableRow key={item.id} className='group'>
												<TableCell>{index + 1}</TableCell>
												<TableCell>{item.client_detail?.fio ?? item.client}</TableCell>
												<TableCell>
													{item.created_by_detail
														? userLabel(item.created_by_detail)
														: (userLabelById.get(item.created_by) ?? '')}
												</TableCell>
												<TableCell>
													<Badge variant={item.is_vozvrat ? 'danger' : 'default'}>
														{item.is_vozvrat ? 'Ha' : "Yo'q"}
													</Badge>
												</TableCell>
												<TableCell>{formatNumber(item.all_summ_dollar, 2)}</TableCell>
												<TableCell>{formatNumber(paidSum(item), 2)} $</TableCell>
												<TableCell>
													{formatNumber(item.zdacha_sum)} so'm / {formatNumber(item.zdacha_dollar, 2)} $
												</TableCell>
												<TableCell>{formatNumber(item.total_debt_today, 2)}</TableCell>
												<TableCell>
													<span
														className={
															(Number(item.total_debt) || 0) > 0
																? 'font-bold text-ca-red'
																: 'font-bold text-ca-green'
														}
													>
														{formatNumber(item.total_debt, 2)} $
													</span>
												</TableCell>
												<TableCell>{formatNumber(item.all_profit_dollar, 2)}</TableCell>
												<TableCell>
													<span className='text-ca-red'>{formatDateTime(item.created_time)}</span>
												</TableCell>
												<TableCell>
													<span className='text-ca-orange'>
														Do'kon: {item.status_order_dukon ? 'Tayyor' : 'Jarayonda'}
													</span>
												</TableCell>
												<TableCell className='text-right'>
													<div className='flex justify-end gap-1'>
														<Button
															type='button'
															variant='info'
															size='icon'
															aria-label='Tahrirlash'
															onClick={stub}
														>
															<FaEdit />
														</Button>
														<Button
															type='button'
															variant='default'
															size='icon'
															aria-label='Batafsil'
															onClick={() => navigate(`/customer-order-history/${item.id}`)}
														>
															<FaExpand />
														</Button>
														<Button
															type='button'
															variant='danger'
															size='icon'
															aria-label="O'chirish"
															onClick={stub}
														>
															<FaTrash />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</Fragment>
								))
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className='p-0'>
										<div className='flex h-40 flex-col items-center justify-center gap-2 text-ca-text'>
											{isError ? (
												<FaExclamationTriangle className='text-4xl text-ca-red' />
											) : undefined}
											<div className='text-xs'>{isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}</div>
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				<div className='mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs'>
					<div>
						{isFetching && !isLoading ? 'Yangilanmoqda...' : `Ko'rsatilmoqda ${start} dan ${end} gacha, jami ${totalRows}`}
					</div>
					<Pagination page={page} totalPages={paginationMeta?.lastPage ?? 1} onPageChange={setPage} />
				</div>
			</Panel>
		</>
	);
}
