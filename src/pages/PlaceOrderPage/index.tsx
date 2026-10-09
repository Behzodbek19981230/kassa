import { Fragment, type UIEvent, useMemo, useState } from 'react';
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import {
	Button,
	buttonProps,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	PageHeader,
	Panel,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	useNotification,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { cn } from '@/lib/utils';
import { brandService } from '@/services/brand/brand.service';
import { useClientQuery } from '@/services/client/client.queries';
import { clientService } from '@/services/client/client.service';
import { useDeleteOrderCartMutation, useOrderCartListQuery } from '@/services/order-cart/order-cart.queries';
import type { ConfirmSaleSummary } from '@/services/order-cart/order-cart.types';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useWarehouseAllListInfiniteQuery } from '@/services/warehouse/warehouse.queries';
import type { WarehouseAllListBrandGroup } from '@/services/warehouse/warehouse.types';
import ClientFormModal from '@/pages/settings/ClientPage/components/ClientFormModal';
import AddToCartModal, { type ProductVariant } from '@/pages/PlaceOrderPage/components/AddToCartModal';
import ClearCartConfirmModal from '@/pages/PlaceOrderPage/components/ClearCartConfirmModal';
import ConfirmSaleModal from '@/pages/PlaceOrderPage/components/ConfirmSaleModal';
import PayDebtModal from '@/pages/PlaceOrderPage/components/PayDebtModal';

const DEFAULT_LOCATION_LABEL = 'Dokon';

interface BrandVariants {
	brandId: number;
	brandName: string;
	variants: ProductVariant[];
}

function buildBrandVariants(groups: WarehouseAllListBrandGroup[]): BrandVariants[] {
	const brands = new Map<number, { name: string; variants: Map<string, ProductVariant> }>();

	for (const group of groups) {
		if (!brands.has(group.brand.id)) {
			brands.set(group.brand.id, { name: group.brand.name, variants: new Map() });
		}
		const brandEntry = brands.get(group.brand.id)!;

		for (const pc of group.product_categories) {
			for (const row of pc.warehouses) {
				const key = `${row.product_category_id}-${row.size}-${row.type_id ?? 'null'}`;
				const existing = brandEntry.variants.get(key);
				if (existing) {
					existing.rows.push(row);
				} else {
					brandEntry.variants.set(key, {
						brandName: row.brand_name,
						categoryName: row.product_category_name,
						size: row.size,
						typeName: row.type_name,
						rows: [row],
					});
				}
			}
		}
	}

	return Array.from(brands.entries()).map(([brandId, entry]) => ({
		brandId,
		brandName: entry.name,
		variants: Array.from(entry.variants.values()),
	}));
}

export default function PlaceOrderPage() {
	const { companyId, canWrite } = useCurrentCompany();
	const { notify } = useNotification();

	const [brandFilter, setBrandFilter] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [clientId, setClientId] = useState('');
	const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
	const [confirmSaleOpen, setConfirmSaleOpen] = useState(false);
	const [clearCartOpen, setClearCartOpen] = useState(false);

	const {
		data,
		isLoading,
		isFetching,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		isError,
		error,
		refetch,
	} = useWarehouseAllListInfiniteQuery({
		brand: brandFilter ? Number(brandFilter) : undefined,
		product_category: categoryFilter ? Number(categoryFilter) : undefined,
	});
	const groups = data ?? [];

	function handleScroll(e: UIEvent<HTMLDivElement>) {
		const el = e.currentTarget;
		if (hasNextPage && !isFetchingNextPage && el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
			fetchNextPage();
		}
	}

	const brandVariants = useMemo(() => buildBrandVariants(groups).filter((b) => b.variants.length > 0), [groups]);

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

	const loadClientOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await clientService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.fio })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	function handleClear() {
		setBrandFilter('');
		setCategoryFilter('');
	}

	const { exchangeRate } = useCurrentCompany();
	const rate = Number(exchangeRate?.dollar ?? 0);

	const { data: selectedClient } = useClientQuery(clientId ? Number(clientId) : undefined);

	const { data: cartData, isLoading: isCartLoading } = useOrderCartListQuery(
		{ client: clientId ? Number(clientId) : undefined, is_active: true },
		Boolean(clientId),
	);
	const cartItems = cartData?.results ?? [];

	const deleteCartMutation = useDeleteOrderCartMutation();

	const cartTotalCount = cartItems.reduce((sum, item) => sum + item.count, 0);
	const cartTotalSum = cartItems.reduce(
		(sum, item) => sum + (Number(item.total_price) || item.count * Number(item.price)),
		0,
	);

	function handleRemoveCartItem(id: number) {
		deleteCartMutation.mutate(id);
	}

	function handleSaleConfirmed(summary: ConfirmSaleSummary) {
		notify({
			title: 'Buyurtma tasdiqlandi',
			text: `Umumiy qarz: ${formatNumber(summary.total_debt, 2)} $`,
		});
		setClientId('');
	}

	return (
		<>
			<PageHeader
				title='Buyurtma qilish'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Buyurtma qilish', active: true },
				]}
			/>

			<div className='-mx-2.5 flex flex-wrap'>
				<div className='w-full px-2.5 lg:w-1/2'>
					<Panel title='Ombordagi mahsulotlar' onReload={() => refetch()}>
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
											onChange={(value) => setCategoryFilter(value)}
											loadOptions={loadCategoryOptions}
											disabled={!brandFilter}
											placeholder={brandFilter ? 'Kategoriyani tanlang' : 'Avval modelni tanlang'}
											clearable
										/>
									</div>
									<Button
										type='button'
										variant='default'
										size='sm'
										disabled={!brandFilter && !categoryFilter}
										onClick={handleClear}
									>
										Tozalash
									</Button>
								</div>
							</div>
						</div>

						<div className='max-h-[calc(100vh-320px)] min-h-[300px] overflow-auto' onScroll={handleScroll}>
							<Table>
								<TableHeader className='sticky top-0 z-10'>
									<TableRow>
										<TableHead className='bg-ca-theme text-white'>#</TableHead>
										<TableHead className='bg-ca-theme text-white'>Model</TableHead>
										<TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
										<TableHead className='bg-ca-theme text-white'>O'lchami</TableHead>
										<TableHead className='bg-ca-theme text-white'>Sklad soni</TableHead>
										<TableHead className='bg-ca-theme text-white'>Tip</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(isLoading || (isFetching && !isFetchingNextPage)) && (
										<TableRow>
											<TableCell colSpan={6} className='text-center'>
												Yuklanmoqda...
											</TableCell>
										</TableRow>
									)}
									{!isLoading && isError && (
										<TableRow>
											<TableCell colSpan={6} className='text-center text-ca-red'>
												<FaExclamationTriangle className='mr-1.5 inline' />{' '}
												{getApiErrorMessage(error, 'Xatolik yuz berdi')}
											</TableCell>
										</TableRow>
									)}
									{!isLoading && !isFetching && !isError && brandVariants.length === 0 && (
										<TableRow>
											<TableCell colSpan={6} className='text-center'>
												Ma'lumot topilmadi
											</TableCell>
										</TableRow>
									)}
									{!isLoading &&
										!isError &&
										brandVariants.map((brand) => {
											let rowIndex = 0;
											return (
												<Fragment key={brand.brandId}>
													<TableRow>
														<TableCell
															colSpan={6}
															className='bg-cyan-100 font-bold text-ca-red'
														>
															{brand.brandName}
														</TableCell>
													</TableRow>
													{brand.variants.map((variant, vIndex) => {
														rowIndex += 1;
														const stockCount = variant.rows.reduce(
															(s, r) => s + r.count,
															0,
														);
														const disabled = !clientId || !canWrite;
														return (
															<TableRow
																key={`${brand.brandId}-${vIndex}`}
																onClick={() => !disabled && setSelectedVariant(variant)}
																className={cn(
																	'bg-red-50',
																	disabled
																		? 'cursor-not-allowed opacity-50'
																		: 'cursor-pointer hover:bg-red-100',
																)}
															>
																<TableCell>{rowIndex}</TableCell>
																<TableCell>{variant.brandName}</TableCell>
																<TableCell>{variant.categoryName}</TableCell>
																<TableCell>{formatNumber(variant.size)}</TableCell>
																<TableCell className='font-semibold'>
																	{formatNumber(stockCount)}
																</TableCell>
																<TableCell>{variant.typeName ?? ''}</TableCell>
															</TableRow>
														);
													})}
												</Fragment>
											);
										})}
								{isFetchingNextPage && (
									<TableRow>
										<TableCell colSpan={6} className='text-center'>
											Yuklanmoqda...
										</TableCell>
									</TableRow>
								)}
								</TableBody>
							</Table>
						</div>
					</Panel>
				</div>

				<div className='w-full px-2.5 lg:w-1/2'>
					<Panel
						title='Mijoz buyurtmasi'
						actions={
							canWrite && (
								<OpenDialogButton
									element={(props) => <Button {...props} />}
									elementProps={buttonProps("+ Mijoz qo'shish", 'warning', 'xs')}
									dialog={ClientFormModal}
									dialogProps={{ mode: 'create' as const }}
								/>
							)
						}
					>
						<div className='mb-4 flex flex-wrap items-center gap-3'>
							<div className='min-w-[200px] flex-1'>
								<Combobox
									value={clientId}
									onChange={(value) => setClientId(value)}
									loadOptions={loadClientOptions}
									selectedLabel={selectedClient?.fio}
									placeholder='Mijozni tanlang'
									clearable
								/>
							</div>
							{clientId && (
								<div className='flex items-center gap-2 text-xs whitespace-nowrap text-ca-heading'>
									Qarzi ($):{' '}
									<span className='font-bold text-ca-red'>
										{formatNumber(selectedClient?.total_debt ?? 0)}
									</span>
									{canWrite && companyId && (
										<OpenDialogButton
											element={(props) => <Button {...props} />}
											elementProps={buttonProps("Qarz to'lash", 'success', 'xs')}
											dialog={PayDebtModal}
											dialogProps={{ companyId, clientId: Number(clientId) }}
										/>
									)}
								</div>
							)}
						</div>

						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='bg-ca-theme text-white'>#</TableHead>
										<TableHead className='bg-ca-theme text-white'>Joy</TableHead>
										<TableHead className='bg-ca-theme text-white'>Model</TableHead>
										<TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
										<TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>
										<TableHead className='bg-ca-theme text-white'>Tip</TableHead>
										<TableHead className='bg-ca-theme text-white'>Narxi ($ / so'm)</TableHead>
										<TableHead className='bg-ca-theme text-white'>Soni</TableHead>
										<TableHead className='bg-ca-theme text-white'>Umum.narxi ($ / so'm)</TableHead>
										<TableHead className='bg-ca-theme text-white' />
									</TableRow>
								</TableHeader>
								<TableBody>
									{!clientId && (
										<TableRow>
											<TableCell colSpan={10} className='text-center'>
												Mijozni tanlang
											</TableCell>
										</TableRow>
									)}
									{clientId && isCartLoading && (
										<TableRow>
											<TableCell colSpan={10} className='text-center'>
												Yuklanmoqda...
											</TableCell>
										</TableRow>
									)}
									{clientId && !isCartLoading && cartItems.length === 0 && (
										<TableRow>
											<TableCell colSpan={10} className='text-center'>
												Buyurtma bo'sh
											</TableCell>
										</TableRow>
									)}
									{clientId &&
										!isCartLoading &&
										cartItems.map((item, index) => {
											const totalPrice =
												Number(item.total_price) || item.count * Number(item.price);
											return (
												<TableRow key={item.id} className='bg-red-50'>
													<TableCell>{index + 1}</TableCell>
													<TableCell>
														{item.warehouse_detail?.type_sklad_name ??
															DEFAULT_LOCATION_LABEL}
													</TableCell>
													<TableCell>
														{item.warehouse_detail?.brand_name ??
															'-'}
													</TableCell>
													<TableCell>
														{item.warehouse_detail?.product_category_name ??
															'-'}
													</TableCell>
													<TableCell>
														{formatNumber(
															item.warehouse_detail?.size ?? '',
														)}
													</TableCell>
													<TableCell>
														{item.warehouse_detail?.type_name ?? ''}
													</TableCell>
													<TableCell className='font-semibold text-ca-green'>
														{formatNumber(item.price, 2)} $
														{rate > 0 && (
															<span className='ml-1 font-normal text-ca-text'>
																({formatNumber(Number(item.price) * rate, 0)})
															</span>
														)}
													</TableCell>
													<TableCell>{formatNumber(item.count)}</TableCell>
													<TableCell className='font-semibold'>
														{formatNumber(totalPrice, 2)} $
														{rate > 0 && (
															<span className='ml-1 font-normal text-ca-text'>
																({formatNumber(totalPrice * rate, 0)})
															</span>
														)}
													</TableCell>
													<TableCell>
														{canWrite && (
															<Button
																type='button'
																{...buttonProps(<FaTrash />, 'danger', 'icon')}
																aria-label="O'chirish"
																onClick={() => handleRemoveCartItem(item.id)}
															/>
														)}
													</TableCell>
												</TableRow>
											);
										})}
									{clientId && !isCartLoading && cartItems.length > 0 && (
										<TableRow className='bg-ca-heading dark:bg-ca-header'>
											<TableCell className='bg-ca-heading dark:bg-ca-header text-white' colSpan={7}>
												Jami
											</TableCell>
											<TableCell className='bg-ca-heading dark:bg-ca-header font-semibold text-white'>
												{formatNumber(cartTotalCount)}
											</TableCell>
											<TableCell className='bg-ca-heading dark:bg-ca-header font-semibold text-white'>
												{formatNumber(cartTotalSum, 2)} $
												{rate > 0 && (
													<span className='ml-1 font-normal text-white/70'>
														({formatNumber(cartTotalSum * rate, 0)})
													</span>
												)}
											</TableCell>
											<TableCell className='bg-ca-heading dark:bg-ca-header text-white' />
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>

						{clientId && !isCartLoading && cartItems.length > 0 && (
							<div className='mt-4 flex flex-wrap items-center justify-around gap-3 rounded-[3px] border border-ca-border bg-ca-silver px-4 py-3 text-sm'>
								<span className='text-ca-heading'>
									Jami: <span className='font-bold'>{formatNumber(cartTotalCount)} dona</span>
								</span>
								<span className='font-bold text-ca-green'>{formatNumber(cartTotalSum, 2)} $</span>
								{rate > 0 && <span className='font-bold text-ca-heading'>{formatNumber(cartTotalSum * rate, 0)} so'm</span>}
							</div>
						)}

						{canWrite && (
							<div className='mt-4 flex gap-2'>
								<Button
									type='button'
									variant='white'
									className='flex-1'
									size='lg'
									disabled={!clientId || cartItems.length === 0}
									onClick={() => setClearCartOpen(true)}
								>
									Bekor qilish
								</Button>
								<Button
									type='button'
									variant='danger'
									className='flex-1'
									size='lg'
									disabled={!clientId || cartItems.length === 0}
									onClick={() => setConfirmSaleOpen(true)}
								>
									Sotish
								</Button>
							</div>
						)}
					</Panel>
				</div>
			</div>

			{selectedVariant && (
				<AddToCartModal
					open={Boolean(selectedVariant)}
					setOpen={(open) => !open && setSelectedVariant(null)}
					variant={selectedVariant}
					clientId={Number(clientId)}
				/>
			)}

			{confirmSaleOpen && companyId && clientId && (
				<ConfirmSaleModal
					open={confirmSaleOpen}
					setOpen={setConfirmSaleOpen}
					companyId={companyId}
					clientId={Number(clientId)}
					cartCount={cartTotalCount}
					allSummDollar={cartTotalSum}
					onConfirmed={handleSaleConfirmed}
				/>
			)}

			{clearCartOpen && companyId && clientId && (
				<ClearCartConfirmModal
					open={clearCartOpen}
					setOpen={setClearCartOpen}
					companyId={companyId}
					clientId={Number(clientId)}
				/>
			)}
		</>
	);
}
