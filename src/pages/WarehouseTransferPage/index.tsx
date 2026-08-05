import { createColumnHelper, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import {
	FaExchangeAlt,
	FaExclamationTriangle,
	FaExpand,
	FaShoppingCart,
	FaStore,
	FaTrash,
	FaWarehouse,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
	Badge,
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	DatePicker,
	PageHeader,
	Panel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	useNotification,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { cn } from '@/lib/utils';
import { brandService } from '@/services/brand/brand.service';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import { useWarehouseListQuery } from '@/services/warehouse/warehouse.queries';
import type { Warehouse } from '@/services/warehouse/warehouse.types';
import {
	useCreateWarehouseTransferMutation,
	useWarehouseTransferListQuery,
} from '@/services/warehouse-transfer/warehouse-transfer.queries';
import type {
	WarehouseTransfer,
	WarehouseTransferStatus,
} from '@/services/warehouse-transfer/warehouse-transfer.types';
import TransferMethodPanel from '@/pages/WarehouseTransferPage/components/TransferMethodPanel';
import type { TransferCartRow } from '@/pages/WarehouseTransferPage/types';

const STATUS_LABEL: Record<WarehouseTransferStatus, string> = {
	completed: 'Bajarilgan',
	reversed: 'Bekor qilingan',
	reverse: 'Bekor qilish transferi',
};

const STATUS_VARIANT: Record<WarehouseTransferStatus, 'success' | 'default' | 'warning'> = {
	completed: 'success',
	reversed: 'default',
	reverse: 'warning',
};

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

const historyColumnHelper = createColumnHelper<WarehouseTransfer>();

export default function WarehouseTransferPage() {
	const navigate = useNavigate();
	const { canWrite } = useCurrentCompany();
	const { notify } = useNotification();

	const [fromTypeSkladId, setFromTypeSkladId] = useState('');
	const [toTypeSkladId, setToTypeSkladId] = useState('');
	const [brandFilter, setBrandFilter] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [selectedSourceItem, setSelectedSourceItem] = useState<Warehouse | null>(null);
	const [cartRows, setCartRows] = useState<TransferCartRow[]>([]);

	const [historyPagination, setHistoryPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [historyColumnFilters, setHistoryColumnFilters] = useState<ColumnFiltersState>([]);
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');

	const { data: skladTypesData } = useSkladTypeListQuery({ limit: 100 });
	const skladTypes = skladTypesData?.results ?? [];
	const fromTypeSkladName = skladTypes.find((t) => String(t.id) === fromTypeSkladId)?.name;
	const toTypeSkladName = skladTypes.find((t) => String(t.id) === toTypeSkladId)?.name;
	const sameSkladType = Boolean(fromTypeSkladId) && fromTypeSkladId === toTypeSkladId;

	function handleFromChange(value: string) {
		setFromTypeSkladId(value);
		setSelectedSourceItem(null);
		setCartRows([]);
	}

	function handleToChange(value: string) {
		setToTypeSkladId(value);
		setSelectedSourceItem(null);
		setCartRows([]);
	}

	const {
		data: productsData,
		isLoading: isProductsLoading,
		isFetching: isProductsFetching,
		isError: isProductsError,
		error: productsError,
		refetch: refetchProducts,
	} = useWarehouseListQuery(
		{
			type_sklad: fromTypeSkladId ? Number(fromTypeSkladId) : undefined,
			brand: brandFilter ? Number(brandFilter) : undefined,
			product_category: categoryFilter ? Number(categoryFilter) : undefined,
			limit: 200,
		},
		Boolean(fromTypeSkladId),
	);
	const products = productsData?.results ?? [];

	const reservedByWarehouseId = useMemo(() => {
		const map = new Map<number, number>();
		for (const row of cartRows) {
			map.set(row.source.warehouseId, (map.get(row.source.warehouseId) ?? 0) + row.source.quantity);
		}
		return map;
	}, [cartRows]);

	const loadBrandOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await brandService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((b) => ({ value: String(b.id), label: b.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadCategoryOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await productCategoryService.list({
			search: search || undefined,
			page,
			limit: 20,
			brand: brandFilter ? Number(brandFilter) : undefined,
		});
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	function handleClearProductFilters() {
		setBrandFilter('');
		setCategoryFilter('');
	}

	function handleAddToCart(row: TransferCartRow) {
		setCartRows((prev) => [...prev, row]);
		setSelectedSourceItem(null);
		notify({ title: "Karzinkaga qo'shildi" });
	}

	function handleRemoveCartRow(key: string) {
		setCartRows((prev) => prev.filter((r) => r.key !== key));
	}

	function handleClearCart() {
		setCartRows([]);
	}

	const createMutation = useCreateWarehouseTransferMutation();

	async function handleSubmitTransfer() {
		if (!fromTypeSkladId || !toTypeSkladId || cartRows.length === 0) return;
		try {
			await createMutation.mutateAsync({
				from_type_sklad_id: Number(fromTypeSkladId),
				to_type_sklad_id: Number(toTypeSkladId),
				items: cartRows.map((row) => ({
					source_warehouse_id: row.source.warehouseId,
					target_warehouse_id: row.target.warehouseId,
					mode: row.mode,
					source_quantity: row.source.quantity,
					target_quantity: row.target.quantity,
				})),
			});
			notify({ title: 'Transfer amalga oshirildi' });
			setCartRows([]);
		} catch (err) {
			notify({ title: 'Xatolik', text: getApiErrorMessage(err, 'Transferni amalga oshirishda xatolik yuz berdi') });
		}
	}

	const totalSourceQty = cartRows.reduce((sum, row) => sum + row.source.quantity, 0);
	const totalTargetQty = cartRows.reduce((sum, row) => sum + row.target.quantity, 0);

	const skladTypeFilterOptions = useMemo(
		() => (skladTypesData?.results ?? []).map((t) => ({ value: String(t.id), label: t.name })),
		[skladTypesData],
	);

	const fromFilter = historyColumnFilters.find((f) => f.id === 'from_type_sklad')?.value as string | undefined;
	const toFilter = historyColumnFilters.find((f) => f.id === 'to_type_sklad')?.value as string | undefined;
	const statusFilter = historyColumnFilters.find((f) => f.id === 'status')?.value as string | undefined;

	const {
		data: historyData,
		isLoading: isHistoryLoading,
		isFetching: isHistoryFetching,
		isError: isHistoryError,
		error: historyError,
		refetch: refetchHistory,
	} = useWarehouseTransferListQuery({
		page: historyPagination.pageIndex + 1,
		limit: historyPagination.pageSize,
		from_type_sklad: fromFilter ? Number(fromFilter) : undefined,
		to_type_sklad: toFilter ? Number(toFilter) : undefined,
		status: (statusFilter as WarehouseTransferStatus) || undefined,
		date_from: dateFrom || undefined,
		date_to: dateTo || undefined,
	});
	const historyResults = historyData?.results ?? [];
	const historyMeta = historyData?.pagination;

	const historyColumns = useMemo(
		() => [
			historyColumnHelper.accessor('cr_date', {
				header: 'Sana',
				size: 100,
				enableColumnFilter: false,
			}),
			historyColumnHelper.accessor('from_type_sklad', {
				header: 'Qayerdan',
				cell: (info) => info.row.original.from_type_sklad_detail?.name ?? '',
				meta: { filterVariant: 'select', filterOptions: skladTypeFilterOptions, filterPlaceholder: 'Barchasi' },
			}),
			historyColumnHelper.accessor('to_type_sklad', {
				header: 'Qayerga',
				cell: (info) => info.row.original.to_type_sklad_detail?.name ?? '',
				meta: { filterVariant: 'select', filterOptions: skladTypeFilterOptions, filterPlaceholder: 'Barchasi' },
			}),
			historyColumnHelper.accessor('items_count', {
				header: 'Tovarlar soni',
				size: 110,
				enableColumnFilter: false,
			}),
			historyColumnHelper.display({
				id: 'created_by',
				header: 'Foydalanuvchi',
				enableColumnFilter: false,
				cell: ({ row }) => {
					const u = row.original.created_by_detail;
					return u ? userLabel(u) : '';
				},
			}),
			historyColumnHelper.accessor('status', {
				header: 'Status',
				cell: (info) => <Badge variant={STATUS_VARIANT[info.getValue()]}>{STATUS_LABEL[info.getValue()]}</Badge>,
				meta: {
					filterVariant: 'select',
					filterOptions: [
						{ value: 'completed', label: 'Bajarilgan' },
						{ value: 'reversed', label: 'Bekor qilingan' },
						{ value: 'reverse', label: 'Bekor qilish transferi' },
					],
					filterPlaceholder: 'Barchasi',
				},
			}),
			historyColumnHelper.display({
				id: 'actions',
				header: 'Harakatlar',
				meta: { align: 'right' },
				enableColumnFilter: false,
				size: 90,
				cell: ({ row }) => (
					<Button
						type='button'
						variant='info'
						size='icon'
						aria-label='Batafsil'
						onClick={() => navigate(`/warehouse-transfer/${row.original.id}`)}
					>
						<FaExpand />
					</Button>
				),
			}),
		],
		[skladTypeFilterOptions, navigate],
	);

	return (
		<>
			<PageHeader
				title='Skladlararo transfer'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Skladlararo transfer', active: true },
				]}
			/>

			<div className='-mx-2.5 mb-0 flex flex-wrap'>
				<div className='w-full px-2.5 pb-5 lg:w-1/2'>
					<div className='flex items-center gap-3 rounded-[3px] bg-white p-4 shadow-sm'>
						<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] bg-ca-theme/10 text-lg text-ca-theme'>
							<FaWarehouse />
						</span>
						<div className='flex-1'>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								Transfer qilinadigan sklad type
							</label>
							<Select value={fromTypeSkladId} onValueChange={handleFromChange}>
								<SelectTrigger>
									<SelectValue placeholder='Tanlang...' />
								</SelectTrigger>
								<SelectContent>
									{skladTypes.map((t) => (
										<SelectItem key={t.id} value={String(t.id)}>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
				<div className='w-full px-2.5 pb-5 lg:w-1/2'>
					<div className='flex items-center gap-3 rounded-[3px] bg-white p-4 shadow-sm'>
						<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] bg-ca-theme/10 text-lg text-ca-theme'>
							<FaStore />
						</span>
						<div className='flex-1'>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								Qabul qilinadigan sklad type
							</label>
							<Select value={toTypeSkladId} onValueChange={handleToChange}>
								<SelectTrigger>
									<SelectValue placeholder='Tanlang...' />
								</SelectTrigger>
								<SelectContent>
									{skladTypes.map((t) => (
										<SelectItem key={t.id} value={String(t.id)}>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
			</div>

			{sameSkladType && (
				<div className='mb-5 rounded-[3px] border border-[#fecaca] bg-[#fef2f2] px-4 py-2.5 text-xs text-ca-red'>
					<FaExclamationTriangle className='mr-1.5 inline' /> Manba va qabul qiluvchi sklad type bir xil
					bo'lishi mumkin emas
				</div>
			)}

			<div className='-mx-2.5 flex flex-wrap'>
				<div className='w-full px-2.5 lg:w-1/2'>
					<Panel title='Tovarlar' onReload={() => refetchProducts()}>
						<div className='-mx-2.5 mb-4 flex flex-wrap gap-y-3'>
							<div className='w-full px-2.5 sm:w-1/2'>
								<label className='mb-1 block text-xs font-semibold text-ca-heading'>
									Modelni tanlang:
								</label>
								<Combobox
									value={brandFilter}
									onChange={(value) => {
										setBrandFilter(value);
										setCategoryFilter('');
									}}
									loadOptions={loadBrandOptions}
									placeholder='Modelni tanlang'
									clearable
								/>
							</div>
							<div className='w-full px-2.5 sm:w-1/2'>
								<label className='mb-1 block text-xs font-semibold text-ca-heading'>Kategoriya:</label>
								<div className='flex gap-2'>
									<div className='flex-1'>
										<Combobox
											value={categoryFilter}
											onChange={setCategoryFilter}
											loadOptions={loadCategoryOptions}
											placeholder='Kategoriyani tanlang'
											clearable
										/>
									</div>
									<Button
										type='button'
										variant='default'
										size='sm'
										disabled={!brandFilter && !categoryFilter}
										onClick={handleClearProductFilters}
									>
										Tozalash
									</Button>
								</div>
							</div>
						</div>

						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='bg-ca-theme text-white'>#</TableHead>
										<TableHead className='bg-ca-theme text-white'>Model</TableHead>
										<TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
										<TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>
										<TableHead className='bg-ca-theme text-white'>Tip</TableHead>
										<TableHead className='bg-ca-theme text-white'>Bor miqdor</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{!fromTypeSkladId && (
										<TableRow>
											<TableCell colSpan={6} className='text-center text-ca-text'>
												Transfer qilinadigan sklad type tanlang
											</TableCell>
										</TableRow>
									)}
									{fromTypeSkladId && (isProductsLoading || isProductsFetching) && (
										<TableRow>
											<TableCell colSpan={6} className='text-center'>
												Yuklanmoqda...
											</TableCell>
										</TableRow>
									)}
									{fromTypeSkladId && !isProductsLoading && isProductsError && (
										<TableRow>
											<TableCell colSpan={6} className='text-center text-ca-red'>
												<FaExclamationTriangle className='mr-1.5 inline' />{' '}
												{getApiErrorMessage(productsError, 'Xatolik yuz berdi')}
											</TableCell>
										</TableRow>
									)}
									{fromTypeSkladId && !isProductsLoading && !isProductsError && products.length === 0 && (
										<TableRow>
											<TableCell colSpan={6} className='text-center'>
												Ma'lumot topilmadi
											</TableCell>
										</TableRow>
									)}
									{fromTypeSkladId &&
										!isProductsLoading &&
										!isProductsError &&
										products.map((item, index) => {
											const available = item.count - (reservedByWarehouseId.get(item.id) ?? 0);
											const disabled = !canWrite || !toTypeSkladId || sameSkladType || available <= 0;
											const isSelected = selectedSourceItem?.id === item.id;
											return (
												<TableRow
													key={item.id}
													onClick={() => !disabled && setSelectedSourceItem(item)}
													className={cn(
														isSelected ? 'bg-ca-theme/10' : 'bg-red-50',
														disabled
															? 'cursor-not-allowed opacity-50'
															: 'cursor-pointer hover:bg-red-100',
													)}
												>
													<TableCell>{index + 1}</TableCell>
													<TableCell>{item.brand_detail?.name}</TableCell>
													<TableCell>{item.product_category_detail?.name}</TableCell>
													<TableCell>{formatNumber(item.size)}</TableCell>
													<TableCell>{item.type_detail?.name}</TableCell>
													<TableCell className='font-semibold'>
														{formatNumber(available)} {item.type_detail?.name}
													</TableCell>
												</TableRow>
											);
										})}
								</TableBody>
							</Table>
						</div>
					</Panel>

					{selectedSourceItem && toTypeSkladId && (
						<TransferMethodPanel
							sourceItem={selectedSourceItem}
							fromTypeSkladId={Number(fromTypeSkladId)}
							fromTypeSkladName={fromTypeSkladName}
							toTypeSkladId={Number(toTypeSkladId)}
							toTypeSkladName={toTypeSkladName}
							availableCount={
								selectedSourceItem.count - (reservedByWarehouseId.get(selectedSourceItem.id) ?? 0)
							}
							onAdd={handleAddToCart}
							onCancel={() => setSelectedSourceItem(null)}
						/>
					)}
				</div>

				<div className='w-full px-2.5 lg:w-1/2'>
					<Panel title='Transfer karzinkasi'>
						{cartRows.length === 0 ? (
							<div className='flex flex-col items-center justify-center gap-3 py-10 text-center'>
								<FaShoppingCart className='text-4xl text-ca-border' />
								<p className='text-sm font-semibold text-ca-heading'>Hali tovar qo'shilmagan</p>
							</div>
						) : (
							<div className='space-y-3'>
								{cartRows.map((row) => (
									<div key={row.key} className='rounded-[3px] border border-ca-border p-3 text-xs'>
										<div className='flex items-start justify-between gap-2'>
											<div className='min-w-0'>
												<div className='font-semibold text-ca-heading'>
													Transfer qilinayotgan tovar
												</div>
												<div className='truncate font-bold text-ca-red'>
													{row.source.typeSkladName} / {row.source.brandName} /{' '}
													{row.source.categoryName} / {formatNumber(row.source.size)} /{' '}
													{row.source.typeName} / -{formatNumber(row.source.quantity)}
												</div>
												<div className='mt-2 font-semibold text-ca-heading'>
													Qabul qilinadigan tovar
												</div>
												<div className='truncate font-bold text-ca-green'>
													{row.target.typeSkladName} / {row.target.brandName} /{' '}
													{row.target.categoryName} / {formatNumber(row.target.size)} /{' '}
													{row.target.typeName} / +{formatNumber(row.target.quantity)}
												</div>
											</div>
											<Button
												type='button'
												variant='danger'
												size='icon'
												aria-label="O'chirish"
												onClick={() => handleRemoveCartRow(row.key)}
											>
												<FaTrash />
											</Button>
										</div>
									</div>
								))}

								<div className='rounded-[3px] bg-ca-silver p-3 text-xs'>
									<div className='flex items-center justify-between py-0.5'>
										<span className='text-ca-text'>Jami pozitsiya:</span>
										<span className='font-bold text-ca-heading'>{cartRows.length}</span>
									</div>
									<div className='flex items-center justify-between py-0.5'>
										<span className='text-ca-text'>{fromTypeSkladName} kamayadi:</span>
										<span className='font-bold text-ca-red'>-{formatNumber(totalSourceQty)}</span>
									</div>
									<div className='flex items-center justify-between py-0.5'>
										<span className='text-ca-text'>{toTypeSkladName} ko'payadi:</span>
										<span className='font-bold text-ca-green'>+{formatNumber(totalTargetQty)}</span>
									</div>
								</div>
							</div>
						)}

						{canWrite && cartRows.length > 0 && (
							<div className='mt-4 flex gap-2'>
								<Button type='button' variant='white' className='flex-1' onClick={handleClearCart}>
									<FaTrash className='mr-1.5' /> Karzinkani tozalash
								</Button>
								<Button
									type='button'
									variant='warning'
									className='flex-1'
									disabled={createMutation.isPending}
									onClick={handleSubmitTransfer}
								>
									<FaExchangeAlt className='mr-1.5' />{' '}
									{createMutation.isPending ? 'Yuborilmoqda...' : 'Transferni amalga oshirish'}
								</Button>
							</div>
						)}
					</Panel>
				</div>
			</div>

			<Panel title='Transfer tarixi' onReload={() => refetchHistory()}>
				<div className='mb-4 flex flex-wrap items-end gap-3'>
					<div>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Sanadan</label>
						<DatePicker value={dateFrom} onChange={setDateFrom} />
					</div>
					<div>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Sanagacha</label>
						<DatePicker value={dateTo} onChange={setDateTo} />
					</div>
					{(dateFrom || dateTo) && (
						<Button
							type='button'
							variant='default'
							size='sm'
							onClick={() => {
								setDateFrom('');
								setDateTo('');
							}}
						>
							Tozalash
						</Button>
					)}
				</div>

				<DataTable
					columns={historyColumns}
					data={historyResults}
					manualPagination
					manualFiltering
					pageCount={historyMeta?.lastPage ?? -1}
					totalRows={historyMeta?.total}
					pagination={historyPagination}
					onPaginationChange={setHistoryPagination}
					columnFilters={historyColumnFilters}
					onColumnFiltersChange={(filters) => {
						setHistoryColumnFilters(filters);
						setHistoryPagination((p) => ({ ...p, pageIndex: 0 }));
					}}
					enablePagination
					enableGlobalFilter={false}
					enableColumnFilters
					enableSorting={false}
					enableStriping
					isLoading={isHistoryLoading || isHistoryFetching}
					emptyMessage={isHistoryError ? getApiErrorMessage(historyError, 'Xatolik yuz berdi') : "Ma'lumot topilmadi"}
					emptyIcon={isHistoryError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>
		</>
	);
}
