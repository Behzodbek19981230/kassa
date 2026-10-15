import { Fragment, type UIEvent, useMemo, useState } from 'react';
import { FaExclamationTriangle, FaFileExport, FaTelegramPlane } from 'react-icons/fa';
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
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import ColumnVisibilityMenu from '@/components/ColumnVisibilityMenu';
import { useCurrentCompany } from '@/lib/company';
import { type ColumnVisibilityDef, useColumnVisibility } from '@/lib/useColumnVisibility';
import { SCROLL_AREA_CLASS, SCROLL_BODY_CLASS, SCROLL_PANEL_CLASS } from '@/lib/layout';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { brandService } from '@/services/brand/brand.service';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useWarehouseAllListInfiniteQuery } from '@/services/warehouse/warehouse.queries';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';
import WarehouseProductImagesModal from '@/pages/WarehouseProductsPage/components/WarehouseProductImagesModal';
import WarehouseProductThumbnail from '@/pages/WarehouseProductsPage/components/WarehouseProductThumbnail';
import WarehouseRealPriceModal from '@/pages/WarehouseProductsPage/components/WarehouseRealPriceModal';
import WarehouseSendTelegramModal from '@/pages/WarehousePage/components/WarehouseSendTelegramModal';
import { catalogCardId } from '@/services/sklad-product/catalog-stock';

const COLUMNS: ColumnVisibilityDef[] = [
	{ id: 'image', label: 'Rasm' },
	{ id: 'index', label: '#', hideable: false },
	{ id: 'sklad', label: 'Sklad' },
	{ id: 'brand', label: 'Model' },
	{ id: 'category', label: 'Nomi' },
	{ id: 'size', label: "O'lchami" },
	{ id: 'type', label: 'Tip' },
	{ id: 'count', label: 'Soni' },
	{ id: 'real_price', label: 'Asl Narxi ($)' },
	{ id: 'total', label: 'Jami narxi ($)' },
	{ id: 'actions', label: 'Harakatlar', hideable: false },
];

/** Columns before "Soni"; the "Jami:" label of the total rows goes in the last visible one. */
const LABEL_COLUMNS = ['index', 'sklad', 'brand', 'category', 'size', 'type'];

export default function WarehouseProductsPage() {
	const { canWrite } = useCurrentCompany();
	const cols = useColumnVisibility('warehouse-products', COLUMNS);
	const [brandFilter, setBrandFilter] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [imagesItem, setImagesItem] = useState<WarehouseAllListItem | null>(null);
	const [realPriceItem, setRealPriceItem] = useState<WarehouseAllListItem | null>(null);

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
	const groups = data?.groups ?? [];

	function handleScroll(e: UIEvent<HTMLDivElement>) {
		const el = e.currentTarget;
		if (hasNextPage && !isFetchingNextPage && el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
			fetchNextPage();
		}
	}

	const brandGroups = useMemo(() => {
		return groups
			.map((g) => ({
				brand: g.brand,
				items: g.product_categories.flatMap((pc) => pc.warehouses),
			}))
			.filter((g) => g.items.length > 0);
	}, [groups]);

	const totalCount = brandGroups.reduce((sum, g) => sum + g.items.reduce((s, w) => s + w.count, 0), 0);
	const totalSum = brandGroups.reduce((sum, g) => sum + g.items.reduce((s, w) => s + Number(w.real_price) * w.count, 0), 0);
	const total = data?.total;

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

	function handleClear() {
		setBrandFilter('');
		setCategoryFilter('');
	}

	async function handleExport() {
		const { Workbook } = await import('exceljs');
		const workbook = new Workbook();
		const worksheet = workbook.addWorksheet('Ombor mahsulotlari');
		worksheet.addRow(['#', 'Model', 'Nomi', "O'lchami", 'Tip', 'Sklad', 'Soni', 'Narxi ($)', 'Jami narxi ($)']);

		let index = 0;
		brandGroups.forEach((group) => {
			worksheet.addRow([group.brand.name]);
			group.items.forEach((item) => {
				index += 1;
				worksheet.addRow([
					index,
					group.brand.name,
					item.product_category_name,
					item.size,
					item.type_name ?? '',
					item.type_sklad_name ?? '',
					item.count,
					Number(item.real_price),
					Number(item.real_price) * item.count,
				]);
			});
			const groupCount = group.items.reduce((s, w) => s + w.count, 0);
			const groupSum = group.items.reduce((s, w) => s + Number(w.real_price) * w.count, 0);
			worksheet.addRow(['', '', '', '', '', 'Jami:', groupCount, '', groupSum]);
		});
		worksheet.addRow(['', '', '', '', '', 'Jami:', totalCount, '', totalSum]);

		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'ombor-mahsulotlari.xlsx';
		link.click();
		URL.revokeObjectURL(url);
	}

	const labelColumn = LABEL_COLUMNS.filter((id) => cols.isVisible(id)).at(-1);

	/** One total row's cells, following the visible columns. */
	function renderTotalCells(count: number, sum: number, className = '') {
		return COLUMNS.filter((c) => cols.isVisible(c.id)).map((c) => {
			const content =
				c.id === labelColumn
					? 'Jami:'
					: c.id === 'count'
						? formatNumber(count)
						: c.id === 'total'
							? `${formatNumber(sum, 2)} $`
							: null;
			return (
				<TableCell key={c.id} className={content !== null ? `${className} font-semibold` : className}>
					{content}
				</TableCell>
			);
		});
	}

	let rowIndex = 0;

	return (
		<>
			<PageHeader
				title='Ombor mahsulotlari'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Ombor mahsulotlari', active: true },
				]}
			/>

			<Panel
				title="Ombordagi barcha mahsulotlar ro'yxati"
				onReload={() => refetch()}
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
							<Button type='button' variant='success' size='sm' onClick={handleExport}>
								<FaFileExport className='mr-1.5' /> Export
							</Button>
						</div>
					</div>
				</div>

				<div className='mb-4 flex flex-wrap gap-3'>
					<div className='rounded-[3px] border-l-4 border-ca-orange bg-ca-silver-light px-4 py-2 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.1)]'>
						Barcha mahsulotlar soni: <span className='font-bold'>{formatNumber(total?.warehouse_total ?? 0)} ta</span>
					</div>
					<div className='rounded-[3px] border-l-4 border-ca-theme bg-ca-silver-light px-4 py-2 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.1)]'>
						Modellar soni: <span className='font-bold'>{formatNumber(total?.brand_total ?? 0)} ta</span>
					</div>
					<div className='rounded-[3px] border-l-4 border-ca-green bg-ca-silver-light px-4 py-2 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.1)]'>
						Kategoriyalar soni: <span className='font-bold'>{formatNumber(total?.product_category_total ?? 0)} ta</span>
					</div>
				</div>

				<div className='mb-2 flex justify-end'>
					<ColumnVisibilityMenu state={cols} />
				</div>

				<div className={SCROLL_AREA_CLASS} onScroll={handleScroll}>
					<Table>
						<TableHeader>
							<TableRow>
								{cols.isVisible('image') && <TableHead className='bg-ca-theme text-white'>Rasm</TableHead>}
								<TableHead className='bg-ca-theme text-white'>#</TableHead>
								{cols.isVisible('sklad') && <TableHead className='bg-ca-theme text-white'>Sklad</TableHead>}
								{cols.isVisible('brand') && <TableHead className='bg-ca-theme text-white'>Model</TableHead>}
								{cols.isVisible('category') && <TableHead className='bg-ca-theme text-white'>Nomi</TableHead>}
								{cols.isVisible('size') && <TableHead className='bg-ca-theme text-white'>O'lchami</TableHead>}
								{cols.isVisible('type') && <TableHead className='bg-ca-theme text-white'>Tip</TableHead>}
								{cols.isVisible('count') && <TableHead className='bg-ca-theme text-white'>Soni</TableHead>}
								{cols.isVisible('real_price') && <TableHead className='bg-ca-theme text-white'>Asl Narxi ($)</TableHead>}
								{cols.isVisible('total') && <TableHead className='bg-ca-theme text-white'>Jami narxi ($)</TableHead>}
								<TableHead className='bg-ca-theme text-right text-white'>Harakatlar</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{(isLoading || (isFetching && !isFetchingNextPage)) && (
								<TableRow>
									<TableCell colSpan={cols.visibleCount} className='text-center'>
										Yuklanmoqda...
									</TableCell>
								</TableRow>
							)}
							{!isLoading && isError && (
								<TableRow>
									<TableCell colSpan={cols.visibleCount} className='text-center text-ca-red'>
										<FaExclamationTriangle className='mr-1.5 inline' /> {getApiErrorMessage(error, 'Xatolik yuz berdi')}
									</TableCell>
								</TableRow>
							)}
							{!isLoading && !isFetching && !isError && brandGroups.length === 0 && (
								<TableRow>
									<TableCell colSpan={cols.visibleCount} className='text-center'>
										Ma'lumot topilmadi
									</TableCell>
								</TableRow>
							)}
							{!isLoading &&
								!isError &&
								brandGroups.map((group) => {
									const groupCount = group.items.reduce((s, w) => s + w.count, 0);
									const groupSum = group.items.reduce((s, w) => s + Number(w.real_price) * w.count, 0);
									return (
										<Fragment key={group.brand.id}>
											<TableRow>
												<TableCell colSpan={cols.visibleCount} className='bg-cyan-100 font-bold text-ca-red dark:bg-cyan-950/60 dark:text-red-400'>
													{group.brand.name}
												</TableCell>
											</TableRow>
											{group.items.map((item) => {
												rowIndex += 1;
												return (
													<TableRow key={item.id} className='bg-red-50'>
														{cols.isVisible('image') && (
															<TableCell>
																<WarehouseProductThumbnail
																	item={item}
																	onClick={() => setImagesItem(item)}
																/>
															</TableCell>
														)}
														<TableCell>{rowIndex}</TableCell>
														{cols.isVisible('sklad') && <TableCell>{item.type_sklad_name ?? ''}</TableCell>}
														{cols.isVisible('brand') && <TableCell>{group.brand.name}</TableCell>}
														{cols.isVisible('category') && <TableCell>{item.product_category_name}</TableCell>}
														{cols.isVisible('size') && <TableCell>{formatNumber(item.size)}</TableCell>}
														{cols.isVisible('type') && <TableCell>{item.type_name ?? ''}</TableCell>}

														{cols.isVisible('count') && <TableCell>{formatNumber(item.count)}</TableCell>}
														{cols.isVisible('real_price') && (
															<TableCell>
																{canWrite ? (
																	<button
																		type='button'
																		className='font-semibold text-ca-green hover:underline'
																		onClick={() => setRealPriceItem(item)}
																	>
																		{formatNumber(item.real_price, 2)} $
																	</button>
																) : (
																	<span className='font-semibold text-ca-green'>
																		{formatNumber(item.real_price, 2)} $
																	</span>
																)}
															</TableCell>
														)}
														{cols.isVisible('total') && (
															<TableCell className='font-semibold'>
																{formatNumber(Number(item.real_price) * item.count, 2)} $
															</TableCell>
														)}
														<TableCell>
															<div className='flex justify-end'>
																<OpenDialogButton
																	element={(props) => <Button {...props} />}
																	elementProps={{
																		...buttonProps(<FaTelegramPlane />, 'success', 'icon'),
																		'aria-label': 'Telegramga yuborish',
																	}}
																	dialog={WarehouseSendTelegramModal}
																	dialogProps={{
																		item: { id: catalogCardId(item) },
																		productLabel: `${group.brand.name} ${item.product_category_name}`,
																	}}
																/>
															</div>
														</TableCell>
													</TableRow>
												);
											})}
											<TableRow>{renderTotalCells(groupCount, groupSum)}</TableRow>
										</Fragment>
									);
								})}
							{isFetchingNextPage && (
									<TableRow>
										<TableCell colSpan={cols.visibleCount} className='text-center'>
											Yuklanmoqda...
										</TableCell>
									</TableRow>
								)}
								{!isLoading && !isError && brandGroups.length > 0 && (
								<TableRow className='bg-ca-heading dark:bg-ca-header'>
									{renderTotalCells(totalCount, totalSum, 'bg-ca-heading text-white dark:bg-ca-header')}
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</Panel>

			{imagesItem && (
				<WarehouseProductImagesModal
					open={Boolean(imagesItem)}
					setOpen={(open) => !open && setImagesItem(null)}
					item={imagesItem}
				/>
			)}

			{realPriceItem && (
				<WarehouseRealPriceModal
					open={Boolean(realPriceItem)}
					setOpen={(open) => !open && setRealPriceItem(null)}
					item={realPriceItem}
				/>
			)}
		</>
	);
}
