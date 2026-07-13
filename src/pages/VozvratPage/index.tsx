import { Fragment, useState } from 'react';
import { FaExclamationTriangle, FaTrash, FaUndo } from 'react-icons/fa';
import {
	Button,
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
import { useCurrentCompany } from '@/lib/company';
import { formatNumber } from '@/lib/number';
import { brandService } from '@/services/brand/brand.service';
import { clientService } from '@/services/client/client.service';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useVozvratCalculateMutation, useVozvratProductsQuery } from '@/services/vozvrat/vozvrat.queries';
import type { VozvratCalculateResponse, VozvratCartItemInput, VozvratProductItem } from '@/services/vozvrat/vozvrat.types';
import AddToVozvratCartModal from '@/pages/VozvratPage/components/AddToVozvratCartModal';
import ConfirmVozvratModal from '@/pages/VozvratPage/components/ConfirmVozvratModal';
import { groupIntoVariants, rowKey, type VozvratVariant } from '@/pages/VozvratPage/utils';

const DANGER_HEADER = 'bg-[#a94442]';

interface VozvratCartRow {
	key: string;
	warehouse: number;
	brand: number;
	brand_name: string;
	product_category: number;
	product_category_name: string;
	size: number;
	type: number;
	type_name: string;
	type_sklad: number;
	type_sklad_name: string;
	count: number;
	price: number;
}

function toCartItemInput(row: VozvratCartRow): VozvratCartItemInput {
	return {
		warehouse: row.warehouse,
		brand: row.brand,
		product_category: row.product_category,
		size: row.size,
		type: row.type,
		type_sklad: row.type_sklad,
		count: row.count,
		price: row.price,
	};
}

export default function VozvratPage() {
	const { companyId } = useCurrentCompany();
	const { notify } = useNotification();

	const [brandFilter, setBrandFilter] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [clientId, setClientId] = useState('');
	const [cartRows, setCartRows] = useState<VozvratCartRow[]>([]);
	const [calcResult, setCalcResult] = useState<VozvratCalculateResponse | null>(null);
	const [selectedVariant, setSelectedVariant] = useState<VozvratVariant | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);

	const today = new Date().toISOString().slice(0, 10);

	const { data, isLoading, isFetching, isError, refetch } = useVozvratProductsQuery(
		clientId
			? {
					client_id: Number(clientId),
					brand_id: brandFilter ? Number(brandFilter) : undefined,
					product_category_id: categoryFilter ? Number(categoryFilter) : undefined,
				}
			: undefined,
	);

	const exchangeRate = data?.exchange_rate ?? calcResult?.exchange_rate ?? 0;
	const calculateMutation = useVozvratCalculateMutation();

	function recalculate(rows: VozvratCartRow[]) {
		if (rows.length === 0 || !clientId) {
			setCalcResult(null);
			return;
		}
		calculateMutation.mutate(
			{ client: Number(clientId), date: today, items: rows.map(toCartItemInput) },
			{ onSuccess: (result) => setCalcResult(result) },
		);
	}

	function handleClientChange(value: string) {
		setClientId(value);
		setCartRows([]);
		setCalcResult(null);
	}

	function handleAddToCart(product: VozvratProductItem, count: number, price: number) {
		const key = rowKey(product);
		setCartRows((prev) => {
			const existingIndex = prev.findIndex((r) => r.key === key);
			const next =
				existingIndex >= 0
					? prev.map((r, i) => (i === existingIndex ? { ...r, count: r.count + count, price } : r))
					: [
							...prev,
							{
								key,
								warehouse: product.warehouse,
								brand: product.brand,
								brand_name: product.brand_name,
								product_category: product.product_category,
								product_category_name: product.product_category_name,
								size: product.size,
								type: product.type,
								type_name: product.type_name,
								type_sklad: product.type_sklad,
								type_sklad_name: product.type_sklad_name,
								count,
								price,
							},
						];
			recalculate(next);
			return next;
		});
	}

	function handleRemoveRow(key: string) {
		setCartRows((prev) => {
			const next = prev.filter((r) => r.key !== key);
			recalculate(next);
			return next;
		});
	}

	function handleConfirmed(message: string) {
		notify({ title: message });
		setCartRows([]);
		setCalcResult(null);
	}

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

	function handleClearFilters() {
		setBrandFilter('');
		setCategoryFilter('');
	}

	const cartTotalCount = calcResult?.totals.count ?? cartRows.reduce((sum, r) => sum + r.count, 0);
	const cartTotalSum =
		calcResult?.totals.total_product_sum ?? cartRows.reduce((sum, r) => sum + r.count * r.price, 0);
	const cartTotalSumSom = calcResult?.totals.total_product_sum_som ?? cartTotalSum * exchangeRate;

	return (
		<>
			<PageHeader
				title='Vozvrat'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Vozvrat', active: true },
				]}
			/>

			<div className='-mx-2.5 flex flex-wrap'>
				<div className='w-full px-2.5 lg:w-1/2'>
					<Panel
						title='Vozvrat qilinadigan mahsulotlarni tanlang'
						headerClassName={DANGER_HEADER}
						onReload={() => refetch()}
					>
						<div className='-mx-2.5 mb-4 flex flex-wrap gap-y-3'>
							<div className='w-full px-2.5 sm:w-1/2'>
								<label className='mb-1 block text-xs font-semibold text-ca-heading'>Modelni tanlang:</label>
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
											placeholder='Kategoriyani tanlang'
											clearable
										/>
									</div>
									<Button
										type='button'
										variant='default'
										size='sm'
										disabled={!brandFilter && !categoryFilter}
										onClick={handleClearFilters}
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
										<TableHead className='bg-ca-theme text-white'>O'lchami</TableHead>
										<TableHead className='bg-ca-theme text-white'>Qolgan soni</TableHead>
										<TableHead className='bg-ca-theme text-white'>Tip</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{!clientId && (
										<TableRow>
											<TableCell colSpan={6} className='text-center text-ca-text'>
												Mijoz tanlangandan keyin xarid qilingan mahsulotlar chiqadi.
											</TableCell>
										</TableRow>
									)}
									{clientId && (isLoading || isFetching) && (
										<TableRow>
											<TableCell colSpan={6} className='text-center'>
												Yuklanmoqda...
											</TableCell>
										</TableRow>
									)}
									{clientId && !isLoading && isError && (
										<TableRow>
											<TableCell colSpan={6} className='text-center text-ca-red'>
												<FaExclamationTriangle className='mr-1.5 inline' /> Xatolik yuz berdi
											</TableCell>
										</TableRow>
									)}
									{clientId &&
										!isLoading &&
										!isError &&
										(data?.groups.length ?? 0) === 0 && (
											<TableRow>
												<TableCell colSpan={6} className='text-center'>
													Mahsulot topilmadi
												</TableCell>
											</TableRow>
										)}
									{clientId &&
										!isLoading &&
										!isError &&
										data?.groups.map((group) => {
											const variants = groupIntoVariants(group.items);
											return (
												<Fragment key={group.brand.id}>
													<TableRow>
														<TableCell colSpan={6} className='bg-cyan-100 font-bold text-ca-red'>
															{group.brand.name}
														</TableCell>
													</TableRow>
													{variants.map((variant, vIndex) => {
														const available = variant.rows.reduce((sum, row) => {
															const inCart = cartRows.find((r) => r.key === rowKey(row))?.count ?? 0;
															return sum + (row.remaining_count - inCart);
														}, 0);
														const disabled = available <= 0;
														return (
															<TableRow
																key={variant.key}
																onClick={() => !disabled && setSelectedVariant(variant)}
																className={
																	disabled
																		? 'cursor-not-allowed bg-red-50 opacity-50'
																		: 'cursor-pointer bg-red-50 hover:bg-red-100'
																}
															>
																<TableCell>{vIndex + 1}</TableCell>
																<TableCell>{variant.brandName}</TableCell>
																<TableCell>{variant.categoryName}</TableCell>
																<TableCell>{formatNumber(variant.size)}</TableCell>
																<TableCell className='font-semibold'>{formatNumber(available)}</TableCell>
																<TableCell>{variant.typeName}</TableCell>
															</TableRow>
														);
													})}
												</Fragment>
											);
										})}
								</TableBody>
							</Table>
						</div>
					</Panel>
				</div>

				<div className='w-full px-2.5 lg:w-1/2'>
					<Panel title='Mijoz vozvrat buyurtmasi' headerClassName={DANGER_HEADER}>
						<div className='mb-4 flex flex-wrap items-center gap-3'>
							<div className='min-w-[200px] flex-1'>
								<Combobox
									value={clientId}
									onChange={handleClientChange}
									loadOptions={loadClientOptions}
									selectedLabel={data?.client.fio}
									placeholder='Mijozni tanlang'
									clearable
								/>
							</div>
							{clientId && (
								<div className='text-xs whitespace-nowrap text-ca-heading'>
									Qarzi ($): <span className='font-bold text-ca-red'>{formatNumber(data?.client.total_debt ?? 0)}</span>
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
										<TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>
										<TableHead className='bg-ca-theme text-white'>Soni</TableHead>
										<TableHead className='bg-ca-theme text-white'>Umum.narxi ($)</TableHead>
										<TableHead className='bg-ca-theme text-white' />
									</TableRow>
								</TableHeader>
								<TableBody>
									{cartRows.length === 0 && (
										<TableRow>
											<TableCell colSpan={10} className='text-center'>
												{clientId ? "Karzinka bo'sh" : 'Mijozni tanlang'}
											</TableCell>
										</TableRow>
									)}
									{cartRows.map((row, index) => {
										const calcItem = calcResult?.items[index];
										const priceDollar = calcItem?.price_dollar ?? row.price;
										const priceSom = calcItem?.price_som ?? row.price * exchangeRate;
										const totalDollar = calcItem?.total_price_dollar ?? row.price * row.count;
										const totalSom = calcItem?.total_price_som ?? totalDollar * exchangeRate;
										return (
											<TableRow key={row.key} className='bg-red-50'>
												<TableCell>{index + 1}</TableCell>
												<TableCell>{row.type_sklad_name}</TableCell>
												<TableCell>{row.brand_name}</TableCell>
												<TableCell>{row.product_category_name}</TableCell>
												<TableCell>{formatNumber(row.size)}</TableCell>
												<TableCell>{row.type_name}</TableCell>
												<TableCell className='font-semibold text-ca-green'>
													{formatNumber(priceDollar, 2)} $
													<span className='ml-1 font-normal text-ca-text'>({formatNumber(priceSom, 0)})</span>
												</TableCell>
												<TableCell>{formatNumber(row.count)}</TableCell>
												<TableCell className='font-semibold'>
													{formatNumber(totalDollar, 2)} $
													<span className='ml-1 font-normal text-ca-text'>({formatNumber(totalSom, 0)})</span>
												</TableCell>
												<TableCell>
													<Button
														type='button'
														variant='danger'
														size='icon'
														aria-label="O'chirish"
														onClick={() => handleRemoveRow(row.key)}
													>
														<FaTrash />
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
									{cartRows.length > 0 && (
										<TableRow className='bg-ca-heading'>
											<TableCell className='bg-ca-heading text-white' colSpan={7}>
												Jami
											</TableCell>
											<TableCell className='bg-ca-heading font-semibold text-white'>
												{formatNumber(cartTotalCount)}
											</TableCell>
											<TableCell className='bg-ca-heading font-semibold text-white'>
												{formatNumber(cartTotalSum, 2)} $
												<span className='ml-1 font-normal text-white/70'>
													({formatNumber(cartTotalSumSom, 0)})
												</span>
											</TableCell>
											<TableCell className='bg-ca-heading text-white' />
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>

						<div className='mt-4'>
							<Button
								type='button'
								variant='danger'
								className='w-full'
								size='lg'
								disabled={!clientId || cartRows.length === 0}
								onClick={() => setConfirmOpen(true)}
							>
								<FaUndo className='mr-1.5' /> Vozvrat qilish
							</Button>
						</div>
					</Panel>
				</div>
			</div>

			{selectedVariant && (
				<AddToVozvratCartModal
					open={Boolean(selectedVariant)}
					setOpen={(open) => !open && setSelectedVariant(null)}
					variant={selectedVariant}
					availableByKey={Object.fromEntries(
						selectedVariant.rows.map((row) => {
							const inCart = cartRows.find((r) => r.key === rowKey(row))?.count ?? 0;
							return [rowKey(row), row.remaining_count - inCart];
						}),
					)}
					onAdd={(row, count, price) => handleAddToCart(row, count, price)}
				/>
			)}

			{confirmOpen && companyId && clientId && (
				<ConfirmVozvratModal
					open={confirmOpen}
					setOpen={setConfirmOpen}
					companyId={companyId}
					clientId={Number(clientId)}
					date={today}
					items={cartRows.map(toCartItemInput)}
					totalProductSum={cartTotalSum}
					exchangeRate={exchangeRate}
					oldDebt={data?.client.total_debt ?? 0}
					onConfirmed={handleConfirmed}
				/>
			)}
		</>
	);
}
