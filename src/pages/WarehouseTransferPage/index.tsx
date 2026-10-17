import { type UIEvent, useEffect, useMemo, useRef, useState } from 'react';
import { FaExchangeAlt, FaExclamationTriangle, FaSave, FaShoppingCart, FaStore, FaTrash, FaWarehouse } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import {
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
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
import ColumnVisibilityMenu from '@/components/ColumnVisibilityMenu';
import { useProductCardNames } from '@/lib/useProductCardNames';
import { useCurrentCompany } from '@/lib/company';
import { type ColumnVisibilityDef, useColumnVisibility } from '@/lib/useColumnVisibility';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { cn } from '@/lib/utils';
import { brandService } from '@/services/brand/brand.service';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import { catalogCardId } from '@/services/sklad-product/catalog-stock';
import type { SkladProduct } from '@/services/sklad-product/sklad-product.types';
import { useWarehouseSkladListInfiniteQuery } from '@/services/warehouse/warehouse.queries';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';
import {
	useCreateWarehouseTransferDraftMutation,
	useDeleteWarehouseTransferDraftMutation,
	useSendWarehouseTransferDraftMutation,
	useUpdateWarehouseTransferDraftMutation,
} from '@/services/warehouse-transfer/warehouse-transfer.queries';
import { warehouseTransferService } from '@/services/warehouse-transfer/warehouse-transfer.service';
import type { WarehouseTransferDetail } from '@/services/warehouse-transfer/warehouse-transfer.types';
import TransferDraftsModal from '@/pages/WarehouseTransferPage/components/TransferDraftsModal';
import TransferMethodPanel from '@/pages/WarehouseTransferPage/components/TransferMethodPanel';
import type { TransferCartRow } from '@/pages/WarehouseTransferPage/types';

const COLUMNS: ColumnVisibilityDef[] = [
	{ id: 'index', label: '#', hideable: false },
	{ id: 'brand', label: 'Model' },
	{ id: 'category', label: 'Nomi' },
	{ id: 'size', label: "O'lcham" },
	{ id: 'type', label: 'Tip' },
	{ id: 'available', label: 'Bor miqdor' },
];

// The rest of the page (and TransferMethodPanel) works with stock rows, so sklad-list rows are mapped to that shape.
function toSkladProduct(row: WarehouseAllListItem, typeSkladId: number): SkladProduct {
	return {
		id: row.sklad_product_id ?? row.id,
		company: row.company_id,
		warehouse: catalogCardId(row),
		type_sklad: row.type_sklad_id ?? typeSkladId,
		count: row.count,
		real_price: row.real_price,
		worker_price: null,
		cr_date: null,
		status_count: null,
		created_by: null,
		updated_by: null,
		created_time: '',
		updated_time: '',
		warehouse_detail: {
			id: catalogCardId(row),
			brand: row.brand_id,
			product_category: row.product_category_id,
			size: row.size,
			type: row.type_id,
			brand_detail: { id: row.brand_id, name: row.brand_name },
			product_category_detail: { id: row.product_category_id, name: row.product_category_name },
			type_detail: row.type_id ? { id: row.type_id, name: row.type_name ?? '' } : null,
		},
		type_sklad_detail: row.type_sklad_id ? { id: row.type_sklad_id, name: row.type_sklad_name ?? '' } : null,
	};
}

interface WarehouseTransferPageState {
	fromTypeSkladId?: number;
	toTypeSkladId?: number;
}

export default function WarehouseTransferPage() {
	const { canWrite } = useCurrentCompany();
	const cols = useColumnVisibility('warehouse-transfer-products', COLUMNS);
	const { notify } = useNotification();
	const location = useLocation();
	const navigate = useNavigate();
	const initialState = location.state as WarehouseTransferPageState | null;

	const [fromTypeSkladId, setFromTypeSkladId] = useState(
		initialState?.fromTypeSkladId ? String(initialState.fromTypeSkladId) : '',
	);
	const [toTypeSkladId, setToTypeSkladId] = useState(
		initialState?.toTypeSkladId ? String(initialState.toTypeSkladId) : '',
	);
	const [brandFilter, setBrandFilter] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [selectedSourceItem, setSelectedSourceItem] = useState<SkladProduct | null>(null);
	const [cartRows, setCartRows] = useState<TransferCartRow[]>([]);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [draftsOpen, setDraftsOpen] = useState(false);
	// The draft being edited and what it already reserves on the server (by source product card id).
	const [draftId, setDraftId] = useState<number | null>(null);
	const [draftReserved, setDraftReserved] = useState<Map<number, number>>(new Map());

	const { data: skladTypesData } = useSkladTypeListQuery({ limit: 100 });
	const skladTypes = skladTypesData?.results ?? [];
	const fromTypeSkladName = skladTypes.find((t) => String(t.id) === fromTypeSkladId)?.name;
	const toTypeSkladName = skladTypes.find((t) => String(t.id) === toTypeSkladId)?.name;
	const sameSkladType = Boolean(fromTypeSkladId) && fromTypeSkladId === toTypeSkladId;

	// Leaves the draft being edited (it stays saved on the server until sent, deleted or expired).
	function resetCart() {
		setSelectedSourceItem(null);
		setCartRows([]);
		setDraftId(null);
		setDraftReserved(new Map());
	}

	function handleFromChange(value: string) {
		setFromTypeSkladId(value);
		resetCart();
	}

	function handleToChange(value: string) {
		setToTypeSkladId(value);
		resetCart();
	}

	function handleSwapTypes() {
		setFromTypeSkladId(toTypeSkladId);
		setToTypeSkladId(fromTypeSkladId);
		resetCart();
	}

	const {
		data: productsData,
		isLoading: isProductsLoading,
		isFetching: isProductsFetching,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		isError: isProductsError,
		error: productsError,
		refetch: refetchProducts,
	} = useWarehouseSkladListInfiniteQuery(
		fromTypeSkladId
			? {
					type_sklad: Number(fromTypeSkladId),
					brand: brandFilter ? Number(brandFilter) : undefined,
					product_category: categoryFilter ? Number(categoryFilter) : undefined,
				}
			: undefined,
	);
	// The source sklad's stock rows, 50 at a time; the next page loads when the table is scrolled to the bottom.
	const products = useMemo(
		() =>
			(productsData?.groups ?? []).flatMap((brand) =>
				brand.product_categories.flatMap((category) =>
					category.warehouses.map((row) => toSkladProduct(row, Number(fromTypeSkladId))),
				),
			),
		[productsData, fromTypeSkladId],
	);

	function handleProductsScroll(e: UIEvent<HTMLDivElement>) {
		const el = e.currentTarget;
		if (hasNextPage && !isFetchingNextPage && el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
			fetchNextPage();
		}
	}
	const cardNames = useProductCardNames();

	// Quantity still free to put in the cart: server stock, minus the cart, plus what the edited draft already holds.
	const reservedByWarehouseId = useMemo(() => {
		const map = new Map<number, number>();
		for (const row of cartRows) {
			map.set(row.source.warehouseId, (map.get(row.source.warehouseId) ?? 0) + row.source.quantity);
		}
		for (const [warehouseId, quantity] of draftReserved) {
			map.set(warehouseId, (map.get(warehouseId) ?? 0) - quantity);
		}
		return map;
	}, [cartRows, draftReserved]);

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

	const createDraftMutation = useCreateWarehouseTransferDraftMutation();
	const updateDraftMutation = useUpdateWarehouseTransferDraftMutation();
	const deleteDraftMutation = useDeleteWarehouseTransferDraftMutation();
	const sendDraftMutation = useSendWarehouseTransferDraftMutation();

	function buildPayload(rows: TransferCartRow[]) {
		return {
			from_type_sklad_id: Number(fromTypeSkladId),
			to_type_sklad_id: Number(toTypeSkladId),
			items: rows.map((row) => ({
				source_warehouse_id: row.source.warehouseId,
				target_warehouse_id: row.target.warehouseId,
				mode: row.mode,
				source_quantity: row.source.quantity,
				target_quantity: row.target.quantity,
			})),
		};
	}

	// 410: the draft expired; the backend removed it and released the reserve.
	function handleDraftError(err: unknown, fallback: string) {
		const status = (err as { response?: { status?: number } })?.response?.status;
		if (status === 410) {
			resetCart();
			notify({ title: 'Karzinka muddati tugagan', text: "Karzinka o'chirilgan, qoldiq qaytarildi" });
			return;
		}
		notify({ title: 'Xatolik', text: getApiErrorMessage(err, fallback) });
	}

	// Shows a server draft as the cart (item ids change on every save, so the rows always come from the response).
	function applyDraft(draft: WarehouseTransferDetail) {
		setDraftId(draft.id);
		setDraftReserved(
			draft.items.reduce((map, item) => {
				map.set(item.source_warehouse, (map.get(item.source_warehouse) ?? 0) + item.source_quantity);
				return map;
			}, new Map<number, number>()),
		);
		setCartRows(
			draft.items.map((item) => ({
				key: `draft-${draft.id}-${item.id}`,
				mode: item.mode,
				source: {
					warehouseId: item.source_warehouse,
					typeSkladName: item.source_snapshot.type_sklad_name,
					brandName: item.source_snapshot.brand_name,
					categoryName: item.source_snapshot.product_category_name,
					size: item.source_snapshot.size,
					typeName: item.source_snapshot.type_name,
					quantity: item.source_quantity,
				},
				target: {
					warehouseId: item.target_warehouse,
					typeSkladName: item.target_snapshot.type_sklad_name,
					brandName: item.target_snapshot.brand_name,
					categoryName: item.target_snapshot.product_category_name,
					size: item.target_snapshot.size,
					typeName: item.target_snapshot.type_name,
					quantity: item.target_quantity,
				},
			})),
		);
	}

	// Like the orders cart, every change is saved to the server draft right away (it reserves the stock for 1 hour).
	async function syncCart(rows: TransferCartRow[]) {
		if (rows.length === 0) {
			if (draftId !== null) await deleteDraftMutation.mutateAsync(draftId);
			resetCart();
			return;
		}
		const payload = buildPayload(rows);
		const draft =
			draftId === null
				? await createDraftMutation.mutateAsync(payload)
				: await updateDraftMutation.mutateAsync({ id: draftId, payload });
		applyDraft(draft);
	}

	async function handleAddToCart(row: TransferCartRow) {
		try {
			await syncCart([...cartRows, row]);
			setSelectedSourceItem(null);
			notify({ title: "Karzinkaga qo'shildi" });
		} catch (err) {
			handleDraftError(err, "Karzinkaga qo'shishda xatolik yuz berdi");
		}
	}

	async function handleRemoveCartRow(key: string) {
		try {
			await syncCart(cartRows.filter((r) => r.key !== key));
		} catch (err) {
			handleDraftError(err, "Qatorni o'chirishda xatolik yuz berdi");
		}
	}

	// Clearing deletes the draft, which releases the reserved stock.
	async function handleClearCart() {
		try {
			await syncCart([]);
		} catch (err) {
			handleDraftError(err, 'Karzinkani tozalashda xatolik yuz berdi');
		}
	}

	function handleContinueDraft(draft: WarehouseTransferDetail) {
		setFromTypeSkladId(String(draft.from_type_sklad));
		setToTypeSkladId(String(draft.to_type_sklad));
		setSelectedSourceItem(null);
		applyDraft(draft);
	}

	// Restore the user's saved cart when the page opens.
	const restoredRef = useRef(false);
	useEffect(() => {
		if (restoredRef.current || initialState?.fromTypeSkladId) return;
		restoredRef.current = true;
		(async () => {
			try {
				const list = await warehouseTransferService.listDrafts({ page: 1, limit: 1 });
				const first = list.results[0];
				if (first) handleContinueDraft(await warehouseTransferService.getDraft(first.id));
			} catch {
				// No saved cart or it can't be loaded: start with an empty one.
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function handleSubmitTransfer() {
		if (draftId === null || cartRows.length === 0) return;
		try {
			await sendDraftMutation.mutateAsync(draftId);
			notify({ title: 'Transfer amalga oshirildi' });
			resetCart();
			setConfirmOpen(false);
			navigate('/warehouse-transfer/history', { replace: true });
		} catch (err) {
			setConfirmOpen(false);
			handleDraftError(err, 'Transferni amalga oshirishda xatolik yuz berdi');
		}
	}

	const isSubmitting = sendDraftMutation.isPending;
	const isSyncing =
		createDraftMutation.isPending || updateDraftMutation.isPending || deleteDraftMutation.isPending;

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
					<div className='flex items-center gap-3 rounded-[3px] bg-ca-silver-light p-4 shadow-sm'>
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
									{skladTypes
										.filter((t) => String(t.id) !== toTypeSkladId)
										.map((t) => (
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
					<div className='flex items-center gap-3 rounded-[3px] bg-ca-silver-light p-4 shadow-sm'>
						<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] bg-ca-theme/10 text-lg text-ca-theme'>
							<FaStore />
						</span>
						<div className='flex-1'>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								Qabul qilinadigan sklad
							</label>
							<Select value={toTypeSkladId} onValueChange={handleToChange} disabled={!fromTypeSkladId}>
								<SelectTrigger>
									<SelectValue placeholder='Tanlang...' />
								</SelectTrigger>
								<SelectContent>
									{skladTypes
										.filter((t) => String(t.id) !== fromTypeSkladId)
										.map((t) => (
											<SelectItem key={t.id} value={String(t.id)}>
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
				<div className='mb-5 rounded-[3px] border border-ca-danger-border bg-ca-danger-bg px-4 py-2.5 text-xs text-ca-red'>
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
										onClick={handleClearProductFilters}
									>
										Tozalash
									</Button>
								</div>
							</div>
						</div>

						<div className='mb-2 flex justify-end'>
							<ColumnVisibilityMenu state={cols} />
						</div>

						<div className='max-h-[calc(100vh-360px)] min-h-75 overflow-auto' onScroll={handleProductsScroll}>
							<Table>
								<TableHeader className='sticky top-0 z-10'>
									<TableRow>
										<TableHead className='bg-ca-theme text-white'>#</TableHead>
										{cols.isVisible('brand') && <TableHead className='bg-ca-theme text-white'>Model</TableHead>}
										{cols.isVisible('category') && <TableHead className='bg-ca-theme text-white'>Nomi</TableHead>}
										{cols.isVisible('size') && <TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>}
										{cols.isVisible('type') && <TableHead className='bg-ca-theme text-white'>Tip</TableHead>}
										{cols.isVisible('available') && <TableHead className='bg-ca-theme text-white'>Bor miqdor</TableHead>}
									</TableRow>
								</TableHeader>
								<TableBody>
									{!fromTypeSkladId && (
										<TableRow>
											<TableCell colSpan={cols.visibleCount} className='text-center text-ca-text'>
												Transfer qilinadigan sklad type tanlang
											</TableCell>
										</TableRow>
									)}
									{fromTypeSkladId && (isProductsLoading || (isProductsFetching && !isFetchingNextPage)) && (
										<TableRow>
											<TableCell colSpan={cols.visibleCount} className='text-center'>
												Yuklanmoqda...
											</TableCell>
										</TableRow>
									)}
									{fromTypeSkladId && !isProductsLoading && isProductsError && (
										<TableRow>
											<TableCell colSpan={cols.visibleCount} className='text-center text-ca-red'>
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
												<TableCell colSpan={cols.visibleCount} className='text-center'>
													Ma'lumot topilmadi
												</TableCell>
											</TableRow>
										)}
									{fromTypeSkladId &&
										!isProductsLoading &&
										!isProductsError &&
										products.map((item, index) => {
											const available = item.count - (reservedByWarehouseId.get(item.warehouse) ?? 0);
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
													{cols.isVisible('brand') && (
														<TableCell>{cardNames.brandName(item.warehouse_detail)}</TableCell>
													)}
													{cols.isVisible('category') && (
														<TableCell>{cardNames.categoryName(item.warehouse_detail)}</TableCell>
													)}
													{cols.isVisible('size') && (
														<TableCell>{formatNumber(item.warehouse_detail?.size ?? 0)}</TableCell>
													)}
													{cols.isVisible('type') && (
														<TableCell>{cardNames.typeName(item.warehouse_detail)}</TableCell>
													)}
													{cols.isVisible('available') && (
														<TableCell className='font-semibold'>
															{formatNumber(available)} {cardNames.typeName(item.warehouse_detail)}
														</TableCell>
													)}
												</TableRow>
											);
										})}
									{isFetchingNextPage && (
										<TableRow>
											<TableCell colSpan={cols.visibleCount} className='text-center'>
												Yuklanmoqda...
											</TableCell>
										</TableRow>
									)}
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
								selectedSourceItem.count - (reservedByWarehouseId.get(selectedSourceItem.warehouse) ?? 0)
							}
							onAdd={handleAddToCart}
							onCancel={() => setSelectedSourceItem(null)}
						/>
					)}
				</div>

				<div className='w-full px-2.5 lg:w-1/2'>
					<Panel title={'Transfer karzinkasi'}>
						<div className='mb-3 flex justify-end'>
							<Button type='button' variant='white' size='sm' onClick={() => setDraftsOpen(true)}>
								<FaSave className='mr-1.5' /> Saqlangan karzinkalar
							</Button>
						</div>
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
												disabled={isSyncing}
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
							<div className='mt-4 flex flex-wrap gap-2'>
								<Button type='button' variant='white' className='flex-1' loading={isSyncing} disabled={isSubmitting} onClick={handleClearCart}>
									<FaTrash className='mr-1.5' /> Karzinkani tozalash
								</Button>
								<Button
									type='button'
									variant='warning'
									className='flex-1'
									loading={isSubmitting}
									disabled={isSyncing}
									onClick={() => setConfirmOpen(true)}
								>
									<FaExchangeAlt className='mr-1.5' />{' '}
									{isSubmitting ? 'Yuborilmoqda...' : 'Transferni amalga oshirish'}
								</Button>
							</div>
						)}
					</Panel>
				</div>
			</div>

			<Modal open={confirmOpen} onOpenChange={setConfirmOpen}>
				<ModalContent>
					<ModalHeader>
						<ModalTitle>Ishonchingiz komilmi?</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>Transferni amalga oshirmoqchimisiz!</p>
						<p className='mt-1 text-ca-text'>
							Transferni o'zgartirish imkoni yo'q, o'chirib qayta qo'shishingiz mumkin.
						</p>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setConfirmOpen(false)}>
							Bekor qilish
						</Button>
						<Button
							type='button'
							variant='warning'
							loading={isSubmitting}
							onClick={handleSubmitTransfer}
						>
							<FaExchangeAlt className='mr-1.5' /> {isSubmitting ? 'Yuborilmoqda...' : 'Tasdiqlash'}
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			<TransferDraftsModal
				open={draftsOpen}
				onOpenChange={setDraftsOpen}
				onContinue={handleContinueDraft}
				onDraftGone={(id) => id === draftId && resetCart()}
				canWrite={canWrite}
			/>
		</>
	);
}
