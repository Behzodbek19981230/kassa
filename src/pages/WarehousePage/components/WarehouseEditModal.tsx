import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { FaPlus, FaSpinner, FaTrash } from 'react-icons/fa';
import {
	Button,
	Checkbox,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	PriceInput,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { generateId } from '@/lib/utils';
import { skladTypeService } from '@/services/sklad-type/sklad-type.service';
import {
	useUpdateWarehouseSkladProductsMutation,
	useWarehouseSkladProductsQuery,
} from '@/services/warehouse/warehouse.queries';
import type { Warehouse, WarehouseSkladProductRow } from '@/services/warehouse/warehouse.types';

interface WarehouseEditModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: Warehouse;
}

interface SkladRow {
	key: string;
	/** null for a row added in this modal. */
	id: number | null;
	typeSklad: string;
	typeSkladName: string;
	count: string;
	realPrice: string;
	workerPrice: string;
	updatedTime?: string;
	/** The stock on the server; only a row with no stock can be deleted. */
	savedCount: number;
}

function toRow(p: WarehouseSkladProductRow): SkladRow {
	return {
		key: String(p.id),
		id: p.id,
		typeSklad: String(p.type_sklad),
		typeSkladName: p.type_sklad_name,
		count: String(p.count),
		realPrice: p.real_price ?? '',
		workerPrice: p.worker_price ?? '',
		updatedTime: p.updated_time,
		savedCount: p.count,
	};
}

const emptyRow = (): SkladRow => ({
	key: generateId(),
	id: null,
	typeSklad: '',
	typeSkladName: '',
	count: '0',
	realPrice: '',
	workerPrice: '',
	savedCount: 0,
});

export default function WarehouseEditModal({ open, setOpen, item }: WarehouseEditModalProps) {
	const { notify } = useNotification();
	const query = useWarehouseSkladProductsQuery(item.id);
	const updateMutation = useUpdateWarehouseSkladProductsMutation();

	const [rows, setRows] = useState<SkladRow[] | null>(null);
	const [isActive, setIsActive] = useState(true);
	const [formError, setFormError] = useState('');

	// Rows are taken from the server once (and again after a 409), so a background refetch doesn't wipe edits.
	useEffect(() => {
		if (query.data && rows === null) {
			setRows(query.data.sklad_products.map(toRow));
			setIsActive(query.data.warehouse.is_active ?? true);
		}
	}, [query.data, rows]);

	const warehouse = query.data?.warehouse;
	const totalCount = (rows ?? []).reduce((sum, r) => sum + (Number(r.count) || 0), 0);

	const updateRow = (key: string, patch: Partial<SkladRow>) =>
		setRows((prev) => prev && prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

	const loadSkladOptions =
		(rowKey: string) =>
		async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
			const taken = new Set((rows ?? []).filter((r) => r.key !== rowKey).map((r) => r.typeSklad));
			const result = await skladTypeService.list({ search: search || undefined, page, limit: 20 });
			return {
				options: result.results
					.filter((s) => !taken.has(String(s.id)))
					.map((s) => ({ value: String(s.id), label: s.name })),
				hasMore: result.pagination.currentPage < result.pagination.lastPage,
			};
		};

	const handleSubmit = async () => {
		if (!rows) return;
		setFormError('');

		if (rows.some((r) => !r.typeSklad)) {
			setFormError('Har bir qatorda sklad tanlanishi shart');
			return;
		}
		const skladIds = rows.map((r) => r.typeSklad);
		if (new Set(skladIds).size !== skladIds.length) {
			setFormError('Bir xil skladni ikki marta tanlab bo\'lmaydi');
			return;
		}

		const payload = {
			is_active: isActive,
			sklad_products: rows.map((r) => ({
				id: r.id,
				type_sklad: Number(r.typeSklad),
				count: Number(r.count) || 0,
				real_price: r.realPrice || '0',
				worker_price: r.workerPrice || '0',
				...(r.id !== null && { updated_time: r.updatedTime }),
			})),
		};

		try {
			await updateMutation.mutateAsync({ id: item.id, payload });
			notify({ title: 'Tovar yangilandi' });
			setOpen(false);
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 409) {
				const fresh = await query.refetch();
				if (fresh.data) setRows(fresh.data.sklad_products.map(toRow));
			}
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
		}
	};

	const summary = [
		{ label: 'Model', value: warehouse?.model.name ?? item.brand_detail?.name },
		{ label: 'Nomi', value: warehouse?.product_category.name ?? item.product_category_detail?.name },
		{ label: "O'lcham", value: formatNumber(warehouse?.size ?? item.size, 2) },
		{ label: 'Tip', value: warehouse?.type?.name ?? item.type_detail?.name },
	];

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-4xl'>
				<ModalHeader>
					<ModalTitle>Mahsulotni o'zgartirish</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{formError && (
						<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}

					<div className='mb-4 grid grid-cols-2 gap-3 rounded bg-ca-silver px-4 py-3 sm:grid-cols-4'>
						{summary.map((s) => (
							<div key={s.label}>
								<div className='text-xs text-ca-text'>{s.label}</div>
								<div className='font-semibold text-ca-heading'>{s.value || '—'}</div>
							</div>
						))}
					</div>

					<h5 className='mb-2 font-bold text-ca-heading'>Skladlar va qoldiqlar</h5>

					{query.isError ? (
						<p className='text-xs text-ca-red'>Ma'lumotni yuklashda xatolik yuz berdi</p>
					) : rows === null ? (
						<div className='flex justify-center py-4 text-ca-text'>
							<FaSpinner className='animate-spin' />
						</div>
					) : (
						<>
							<div className='overflow-x-auto'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='min-w-50'>Sklad</TableHead>
											<TableHead className='min-w-25'>Soni</TableHead>
											<TableHead className='min-w-30'>Haqiqiy narx ($)</TableHead>
											<TableHead className='min-w-30'>Ishchi uchun narx ($)</TableHead>
											<TableHead className='w-10' />
										</TableRow>
									</TableHeader>
									<TableBody>
										{rows.map((row) => {
											const canDelete = row.id === null || row.savedCount === 0;
											return (
												<TableRow key={row.key}>
													<TableCell>
														<Combobox
															value={row.typeSklad}
															onChange={(value, option) =>
																updateRow(row.key, { typeSklad: value, typeSkladName: option?.label ?? '' })
															}
															loadOptions={loadSkladOptions(row.key)}
															selectedLabel={row.typeSkladName || undefined}
															placeholder='Tanlang...'
															searchPlaceholder='Qidirish...'
															disabled={row.id !== null}
														/>
													</TableCell>
													<TableCell>
														<PriceInput decimals={0}
															value={row.count}
															onChange={(v) => updateRow(row.key, { count: v })}
														/>
													</TableCell>
													<TableCell>
														<PriceInput
															value={row.realPrice}
															onChange={(v) => updateRow(row.key, { realPrice: v })}
														/>
													</TableCell>
													<TableCell>
														<PriceInput
															value={row.workerPrice}
															onChange={(v) => updateRow(row.key, { workerPrice: v })}
														/>
													</TableCell>
													<TableCell>
														<Button
															type='button'
															variant='danger'
															size='icon'
															aria-label="O'chirish"
															disabled={!canDelete}
															title={canDelete ? undefined : "Qoldig'i bor skladni o'chirib bo'lmaydi"}
															onClick={() => setRows((prev) => prev && prev.filter((r) => r.key !== row.key))}
														>
															<FaTrash />
														</Button>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
							<button
								type='button'
								className='mt-2 flex w-full items-center justify-center gap-2 rounded border-2 border-dashed border-ca-border py-2 font-semibold text-ca-theme transition-colors hover:border-ca-theme hover:bg-ca-theme/5'
								onClick={() => setRows((prev) => [...(prev ?? []), emptyRow()])}
							>
								<FaPlus /> Yangi sklad qo'shish
							</button>
						</>
					)}
				</ModalBody>
				<ModalFooter className='justify-between'>
					<div className='flex items-center gap-4'>
						<span className='text-ca-text'>
							Jami qoldiq: <b className='text-ca-heading'>{formatNumber(totalCount)} dona</b>
						</span>
						<Checkbox
							id='warehouse-is-active'
							label='Faol'
							checked={isActive}
							onCheckedChange={setIsActive}
							disabled={rows === null}
							inline
						/>
					</div>
					<div className='flex gap-2'>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button
							type='button'
							variant='primary'
							onClick={handleSubmit}
							loading={updateMutation.isPending}
							disabled={rows === null}
						>
							Saqlash
						</Button>
					</div>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
