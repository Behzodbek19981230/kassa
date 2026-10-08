import { useMemo, useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import {
	Button,
	Combobox,
	DatePicker,
	PageHeader,
	Panel,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useConsignorQuery } from '@/services/consignor/consignor.queries';
import { useChinaProductsQuery, useImportCartQuery } from '@/services/two-stage-import/two-stage-import.queries';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';
import {
	createCategoryLoader,
	loadBrandOptions,
	loadConsignorOptions,
	loadSizeTypeOptions,
} from '@/pages/TwoStageImport/options';
import { useWarehouseCatalog } from '@/pages/TwoStageImport/useWarehouseCatalog';
import AddToChinaCartModal from '@/pages/TwoStageImport/components/AddToChinaCartModal';
import ChinaDispatchConfirmModal from '@/pages/TwoStageImport/components/ChinaDispatchConfirmModal';
import {
	SCROLL_AREA_CLASS,
	SCROLL_BODY_CLASS,
	SCROLL_PANEL_CLASS,
	fromApiDateTime,
	nowTashkentLocal,
	toApiDateTime,
} from '@/pages/TwoStageImport/utils';

const STAGE = 'CHINA_TO_TRANSIT' as const;

export default function ChinaDispatchPage() {
	const { canWrite } = useCurrentCompany();
	const { byId, sizes } = useWarehouseCatalog();

	const [brandFilter, setBrandFilter] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [sizeFilter, setSizeFilter] = useState('');
	const [typeFilter, setTypeFilter] = useState('');
	const [consignorInput, setConsignorInput] = useState('');
	const [dispatchInput, setDispatchInput] = useState('');
	const [defaultDispatch] = useState(nowTashkentLocal);
	const [selectedProduct, setSelectedProduct] = useState<WarehouseAllListItem | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);

	const brandId = brandFilter ? Number(brandFilter) : undefined;
	const loadCategoryOptions = useMemo(() => createCategoryLoader(brandId), [brandId]);

	const sizeOptions = useMemo(() => sizes.map((size) => ({ value: String(size), label: formatNumber(size) })), [sizes]);

	const productsQuery = useChinaProductsQuery({
		brand: brandId,
		product_category: categoryFilter ? Number(categoryFilter) : undefined,
		size: sizeFilter || undefined,
		type: typeFilter ? Number(typeFilter) : undefined,
	});
	const products = (productsQuery.data ?? []).flatMap((p) => {
		const row = byId.get(p.id);
		return row ? [row] : [];
	});

	const cartQuery = useImportCartQuery(STAGE);
	const cart = cartQuery.data?.cart ?? null;
	const cartItems = cartQuery.data?.items ?? [];
	const summary = cartQuery.data?.summary;

	// The cart keeps the consignor and dispatch time of the open import, so they are prefilled from it.
	const consignorValue = consignorInput || (cart?.consignor ? String(cart.consignor) : '');
	const dispatchValue = dispatchInput || (cart ? fromApiDateTime(cart.dispatch_datetime) : defaultDispatch);
	const canPick = canWrite && Boolean(consignorValue) && Boolean(dispatchValue);

	const { data: selectedConsignor } = useConsignorQuery(consignorValue ? Number(consignorValue) : undefined);

	function clearFilters() {
		setBrandFilter('');
		setCategoryFilter('');
		setSizeFilter('');
		setTypeFilter('');
	}

	return (
		<>
			<PageHeader
				title='Xitoydan yuk chiqarish'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Ikki bosqichli import' },
					{ label: 'Xitoydan yuk chiqarish', active: true },
				]}
			/>

			<div className='-mx-2.5 flex flex-wrap'>
				<div className='w-full px-2.5 lg:w-1/2'>
					<Panel
						title='Ombordagi mahsulotlar'
						onReload={() => productsQuery.refetch()}
						className={SCROLL_PANEL_CLASS}
						bodyClassName={SCROLL_BODY_CLASS}
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
								<Combobox
									value={categoryFilter}
									onChange={(value) => setCategoryFilter(value)}
									loadOptions={loadCategoryOptions}
									placeholder='Kategoriyani tanlang'
									clearable
								/>
							</div>
							<div className='w-full px-2.5 sm:w-1/2'>
								<label className='mb-1 block text-xs font-semibold text-ca-heading'>O'lcham:</label>
								<Combobox
									value={sizeFilter}
									onChange={(value) => setSizeFilter(value)}
									options={sizeOptions}
									placeholder='Barchasi'
									clearable
								/>
							</div>
							<div className='w-full px-2.5 sm:w-1/2'>
								<label className='mb-1 block text-xs font-semibold text-ca-heading'>Tip:</label>
								<div className='flex gap-2'>
									<div className='flex-1'>
										<Combobox
											value={typeFilter}
											onChange={(value) => setTypeFilter(value)}
											loadOptions={loadSizeTypeOptions}
											placeholder='Barchasi'
											clearable
										/>
									</div>
									<Button
										type='button'
										variant='default'
										size='sm'
										disabled={!brandFilter && !categoryFilter && !sizeFilter && !typeFilter}
										onClick={clearFilters}
									>
										Tozalash
									</Button>
								</div>
							</div>
						</div>

						<div className={SCROLL_AREA_CLASS}>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='bg-ca-theme text-white'>#</TableHead>
										<TableHead className='bg-ca-theme text-white'>Model</TableHead>
										<TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
										<TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>
										<TableHead className='bg-ca-theme text-white'>Tip</TableHead>
										<TableHead className='bg-ca-theme text-white'>Amal</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{productsQuery.isLoading && (
										<TableRow>
											<TableCell colSpan={6} className='text-center'>
												Yuklanmoqda...
											</TableCell>
										</TableRow>
									)}
									{productsQuery.isError && (
										<TableRow>
											<TableCell colSpan={6} className='text-center text-ca-red'>
												<FaExclamationTriangle className='mr-1.5 inline' />{' '}
												{getApiErrorMessage(productsQuery.error, 'Xatolik yuz berdi')}
											</TableCell>
										</TableRow>
									)}
									{!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && (
										<TableRow>
											<TableCell colSpan={6} className='text-center'>
												Ma'lumot topilmadi
											</TableCell>
										</TableRow>
									)}
									{products.map((row, index) => (
										<TableRow key={row.id} className='bg-red-50'>
											<TableCell>{index + 1}</TableCell>
											<TableCell>{row.brand_name}</TableCell>
											<TableCell>{row.product_category_name}</TableCell>
											<TableCell>{formatNumber(row.size)}</TableCell>
											<TableCell>{row.type_name ?? ''}</TableCell>
											<TableCell>
												<Button
													type='button'
													variant='danger'
													size='xs'
													disabled={!canPick}
													onClick={() => setSelectedProduct(row)}
												>
													Tanlash
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</Panel>
				</div>

				<div className='w-full px-2.5 lg:w-1/2'>
					<Panel
						title='Import savatchasi'
						onReload={() => cartQuery.refetch()}
						className={SCROLL_PANEL_CLASS}
						bodyClassName={SCROLL_BODY_CLASS}
					>
						<div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
							<div>
								<label className='mb-1 block text-xs font-semibold text-ca-heading'>Yuk jo'natuvchi:</label>
								<Combobox
									value={consignorValue}
									onChange={(value) => setConsignorInput(value)}
									loadOptions={loadConsignorOptions}
									selectedLabel={selectedConsignor?.name}
									placeholder="Yuk jo'natuvchini tanlang"
								/>
							</div>
							<div>
								<label className='mb-1 block text-xs font-semibold text-ca-heading'>Yuk chiqish vaqti:</label>
								<DatePicker showTime value={dispatchValue} onChange={setDispatchInput} />
							</div>
						</div>

						<div className={SCROLL_AREA_CLASS}>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='bg-ca-theme text-white'>#</TableHead>
										<TableHead className='bg-ca-theme text-white'>Model</TableHead>
										<TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
										<TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>
										<TableHead className='bg-ca-theme text-white'>Tip</TableHead>
										<TableHead className='bg-ca-theme text-white'>Tip dona</TableHead>
										<TableHead className='bg-ca-theme text-white'>Narxi (¥)</TableHead>
										<TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>
										<TableHead className='bg-ca-theme text-white'>Soni</TableHead>
										<TableHead className='bg-ca-theme text-white'>Jami ($)</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{cartQuery.isLoading && (
										<TableRow>
											<TableCell colSpan={10} className='text-center'>
												Yuklanmoqda...
											</TableCell>
										</TableRow>
									)}
									{!cartQuery.isLoading && cartItems.length === 0 && (
										<TableRow>
											<TableCell colSpan={10} className='text-center'>
												Import savati bo'sh
											</TableCell>
										</TableRow>
									)}
									{cartItems.map((item, index) => {
										const row = item.warehouse != null ? byId.get(item.warehouse) : undefined;
										return (
											<TableRow key={item.id} className='bg-red-50'>
												<TableCell>{index + 1}</TableCell>
												<TableCell>{row?.brand_name ?? '-'}</TableCell>
												<TableCell>{row?.product_category_name ?? '-'}</TableCell>
												<TableCell>{formatNumber(row?.size ?? '')}</TableCell>
												<TableCell>{row?.type_name ?? ''}</TableCell>
												<TableCell>{formatNumber(item.type_quantity, 2)}</TableCell>
												<TableCell>{formatNumber(item.unit_price_yuan, 0)}</TableCell>
												<TableCell className='font-semibold text-ca-green'>
													{formatNumber(item.unit_price_dollar, 2)} $
												</TableCell>
												<TableCell>{formatNumber(item.quantity)}</TableCell>
												<TableCell className='font-semibold'>{formatNumber(item.total_dollar, 2)} $</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>

						{summary && cartItems.length > 0 && (
							<div className='mt-4 flex flex-wrap items-center justify-around gap-3 rounded-[3px] border border-ca-border bg-ca-silver px-4 py-3 text-sm'>
								<span className='text-ca-heading'>
									Jami: <span className='font-bold'>{formatNumber(summary.total_quantity)} dona</span>
								</span>
								<span className='font-bold text-ca-heading'>{formatNumber(summary.total_yuan, 0)} ¥</span>
								<span className='font-bold text-ca-green'>{formatNumber(summary.total_dollar, 2)} $</span>
							</div>
						)}

						{canWrite && (
							<div className='mt-4'>
								<Button
									type='button'
									variant='danger'
									size='lg'
									className='w-full'
									disabled={!cart || cartItems.length === 0}
									onClick={() => setConfirmOpen(true)}
								>
									Davom etish
								</Button>
							</div>
						)}
					</Panel>
				</div>
			</div>

			{selectedProduct && consignorValue && (
				<AddToChinaCartModal
					open={Boolean(selectedProduct)}
					setOpen={(open) => !open && setSelectedProduct(null)}
					product={selectedProduct}
					consignorId={Number(consignorValue)}
					dispatchDatetime={toApiDateTime(dispatchValue)}
				/>
			)}

			{confirmOpen && cart && summary && (
				<ChinaDispatchConfirmModal open={confirmOpen} setOpen={setConfirmOpen} cart={cart} summary={summary} />
			)}
		</>
	);
}
