import { useMemo, useState } from 'react';
import { FaExchangeAlt, FaExclamationTriangle, FaShoppingCart, FaStore, FaTrash, FaWarehouse } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import {
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
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
import { useCreateWarehouseTransferMutation } from '@/services/warehouse-transfer/warehouse-transfer.queries';
import TransferMethodPanel from '@/pages/WarehouseTransferPage/components/TransferMethodPanel';
import type { TransferCartRow } from '@/pages/WarehouseTransferPage/types';

interface WarehouseTransferPageState {
	fromTypeSkladId?: number;
	toTypeSkladId?: number;
}

export default function WarehouseTransferPage() {
	const { canWrite } = useCurrentCompany();
	const { notify } = useNotification();
	const location = useLocation();
	const initialState = location.state as WarehouseTransferPageState | null;

	const [fromTypeSkladId, setFromTypeSkladId] = useState(
		initialState?.fromTypeSkladId ? String(initialState.fromTypeSkladId) : '',
	);
	const [toTypeSkladId, setToTypeSkladId] = useState(
		initialState?.toTypeSkladId ? String(initialState.toTypeSkladId) : '',
	);
	const [brandFilter, setBrandFilter] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [selectedSourceItem, setSelectedSourceItem] = useState<Warehouse | null>(null);
	const [cartRows, setCartRows] = useState<TransferCartRow[]>([]);

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

	function handleSwapTypes() {
		setFromTypeSkladId(toTypeSkladId);
		setToTypeSkladId(fromTypeSkladId);
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
			notify({
				title: 'Xatolik',
				text: getApiErrorMessage(err, 'Transferni amalga oshirishda xatolik yuz berdi'),
			});
		}
	}

	const totalSourceQty = cartRows.reduce((sum, row) => sum + row.source.quantity, 0);
	const totalTargetQty = cartRows.reduce((sum, row) => sum + row.target.quantity, 0);

	return (
		<>
			<PageHeader
				title='Skladlararo transfer'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Skladlararo transfer', active: true },
				]}
			/>

			<div className='relative -mx-2.5 mb-0 flex flex-wrap'>
				<div className='w-full px-2.5 pb-5 lg:w-1/2'>
					<div className='flex items-center gap-3 rounded-[3px] bg-white p-4 shadow-sm'>
						<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] bg-ca-theme/10 text-lg text-ca-theme'>
							<FaWarehouse />
						</span>
						<div className='flex-1'>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								Transfer qilinadigan sklad
							</label>
							<Select value={fromTypeSkladId} onValueChange={handleFromChange}>
								<SelectTrigger>
									<SelectValue placeholder='Tanlang...' />
								</SelectTrigger>
								<SelectContent>
									{skladTypes.map((t) => (
										<SelectItem
											key={t.id}
											value={String(t.id)}
											disabled={String(t.id) === toTypeSkladId}
										>
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
								Qabul qilinadigan sklad
							</label>
							<Select value={toTypeSkladId} onValueChange={handleToChange}>
								<SelectTrigger>
									<SelectValue placeholder='Tanlang...' />
								</SelectTrigger>
								<SelectContent>
									{skladTypes.map((t) => (
										<SelectItem
											key={t.id}
											value={String(t.id)}
											disabled={String(t.id) === fromTypeSkladId}
										>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				<Button
					type='button'
					variant='theme'
					size='icon'
					onClick={handleSwapTypes}
					disabled={!fromTypeSkladId && !toTypeSkladId}
					aria-label='Sklad typelarni almashtirish'
					className='absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm transition-transform hover:rotate-180'
				>
					<FaExchangeAlt />
				</Button>
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
									{fromTypeSkladId &&
										!isProductsLoading &&
										!isProductsError &&
										products.length === 0 && (
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
											const disabled =
												!canWrite || !toTypeSkladId || sameSkladType || available <= 0;
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
		</>
	);
}
