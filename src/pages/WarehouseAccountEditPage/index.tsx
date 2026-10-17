import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { FaArrowLeft, FaExclamationTriangle, FaPlus, FaTrash } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import {
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DatePicker,
	Input,
	Panel,
	PriceInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useNotification,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { generateId } from '@/lib/utils';
import { useEditSkladMutation, useSkladDetailQuery } from '@/services/sklad/sklad.queries';
import type { SkladEditItemPayload } from '@/services/sklad/sklad.types';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import { warehouseService } from '@/services/warehouse/warehouse.service';
import type { Warehouse } from '@/services/warehouse/warehouse.types';

// A receipt line: one product (card) received into one sklad.
interface EditableRow {
	key: string;
	/** The saved line's id; new lines have none. */
	id?: number;
	warehouse: string;
	productLabel: string;
	type_sklad: string;
	count: string;
	price: string;
}

const emptyRow = (): EditableRow => ({
	key: generateId(),
	warehouse: '',
	productLabel: '',
	type_sklad: '',
	count: '',
	price: '',
});

// "Model | Nomi | O'lcham | Tip", the same label the backend gives saved lines.
function productLabel(card: Warehouse) {
	return [card.brand_detail?.name, card.product_category_detail?.name, card.size, card.type_detail?.name]
		.filter((part) => part !== undefined && part !== null && part !== '')
		.join(' | ');
}

const loadProductOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
	const result = await warehouseService.list({ search: search || undefined, page, limit: 50 });
	return {
		options: result.results.map((card) => ({ value: String(card.id), label: productLabel(card) })),
		hasMore: result.pagination.currentPage < result.pagination.lastPage,
	};
};

const rowTotal = (row: EditableRow) => (Number(row.count) || 0) * (Number(row.price) || 0);

export default function WarehouseAccountEditPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const skladId = id ? Number(id) : undefined;
	const { notify } = useNotification();
	const { canWrite } = useCurrentCompany();

	useEffect(() => {
		if (!canWrite) navigate('/warehouse-report', { replace: true });
	}, [canWrite, navigate]);

	const { data, isLoading, isError } = useSkladDetailQuery(skladId);
	const { data: skladTypesData } = useSkladTypeListQuery({ limit: 100 });
	const skladTypes = skladTypesData?.results ?? [];

	const [date, setDate] = useState('');
	const [exchangeRate, setExchangeRate] = useState('');
	// The dollar payment of this receipt (`sum_dollar`); the products' total is calculated by the backend.
	const [paidDollar, setPaidDollar] = useState('');
	const [discountAmount, setDiscountAmount] = useState('');
	const [carNumber, setCarNumber] = useState('');
	const [comment, setComment] = useState('');
	const [rows, setRows] = useState<EditableRow[]>([]);
	const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
	const [formError, setFormError] = useState('');

	const editMutation = useEditSkladMutation();

	useEffect(() => {
		if (!data) return;
		setDate(data.cr_date);
		setExchangeRate(String(data.exchange_rate));
		setPaidDollar(String(data.sum_dollar));
		setDiscountAmount(String(data.discount_amount));
		setCarNumber(data.car_number ?? '');
		setComment(data.comment ?? '');
		setRows(
			data.items.map((item) => ({
				key: generateId(),
				id: item.id,
				warehouse: String(item.warehouse),
				productLabel: item.product_label,
				type_sklad: item.type_sklad ? String(item.type_sklad) : '',
				count: String(item.count),
				price: String(item.price),
			})),
		);
	}, [data]);

	const productsTotal = useMemo(() => rows.reduce((sum, row) => sum + rowTotal(row), 0), [rows]);

	const updateRow = (key: string, next: Partial<EditableRow>) =>
		setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...next } : row)));
	const addRow = () => setRows((prev) => [...prev, emptyRow()]);
	const removeRow = (key: string) => setRows((prev) => prev.filter((row) => row.key !== key));

	const goBack = () => navigate('/warehouse-report');

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setFormError('');
		if (!data) return;

		if (!date) {
			setFormError('Sana kiritilishi shart');
			return;
		}
		if (!exchangeRate || Number(exchangeRate) <= 0) {
			setFormError('Dollar kursi kiritilishi shart');
			return;
		}
		if (!comment.trim()) {
			setFormError("O'zgargan mahsulotlar bo'yicha izoh kiritilishi shart");
			return;
		}
		if (rows.length === 0) {
			setFormError('Kamida bitta mahsulot qatori kiritilishi shart');
			return;
		}

		const errors: Record<string, string> = {};
		for (const row of rows) {
			if (!row.type_sklad || !row.warehouse || row.price === '') {
				errors[row.key] = "Barcha maydonlar to'ldirilishi shart";
			} else if (!Number(row.count) || Number(row.count) <= 0) {
				errors[row.key] = 'Soni kiritilishi shart';
			}
		}
		setRowErrors(errors);
		if (Object.keys(errors).length) return;

		const items: SkladEditItemPayload[] = rows.map((row) => ({
			...(row.id !== undefined ? { id: row.id } : {}),
			warehouse: Number(row.warehouse),
			type_sklad: Number(row.type_sklad),
			count: Number(row.count),
			price: row.price,
		}));

		try {
			await editMutation.mutateAsync({
				id: skladId!,
				payload: {
					consignor_ref: data.consignor_ref ?? data.consignor ?? 0,
					cr_date: date,
					exchange_rate: exchangeRate,
					comment: comment.trim() || undefined,
					car_number: carNumber.trim() || undefined,
					sum_dollar: paidDollar || '0',
					sum_som: String(data.sum_som ?? 0),
					discount_amount: discountAmount || '0',
					items,
				},
			});
			notify({ title: 'Tovar yangilandi' });
			goBack();
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
		}
	};

	if (isLoading) {
		return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
	}

	if (isError || !data) {
		return (
			<div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
				<FaExclamationTriangle /> Sklad topilmadi
			</div>
		);
	}

	return (
		<>

			<Panel
				title='Tovarni tahrirlash'
				actions={
					<Button type='button' variant='warning' size='xs' onClick={goBack}>
						<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
					</Button>
				}
			>
				<form onSubmit={handleSubmit} noValidate>
					{formError && (
						<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}

					<div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4'>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								Yuk jo'natuvchi <span className='text-ca-red'>(Kiritilish majburiy)</span>
							</label>
							<Combobox
								value={String(data.consignor_ref ?? '')}
								onChange={() => {}}
								options={[]}
								selectedLabel={data.consignor_ref_detail?.name}
								disabled
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>Mening qarzim ($)</label>
							<PriceInput value={data.my_total_debt} disabled />
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								Sana <span className='text-ca-red'>*</span>
							</label>
							<DatePicker value={date} onChange={setDate} />
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								Dollar kursi <span className='text-ca-red'>*</span>
							</label>
							<PriceInput value={exchangeRate} onChange={setExchangeRate} />
						</div>
					</div>

					{rows.map((row, index) => (
						<div key={row.key} className='mb-3'>
							<div className='grid grid-cols-1 items-start gap-3 md:grid-cols-[200px_1fr_200px_200px_auto]'>
								<div>
									<label className='mb-1 block text-xs font-semibold text-ca-heading'>
										Sklad <span className='text-ca-red'>*</span>
									</label>
									<Select value={row.type_sklad} onValueChange={(v) => updateRow(row.key, { type_sklad: v })}>
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
								<div>
									<label className='mb-1 block text-xs font-semibold text-ca-heading'>
										Mahsulot <span className='text-ca-red'>*</span>
									</label>
									<Combobox
										value={row.warehouse}
										onChange={(value, option) =>
											updateRow(row.key, { warehouse: value, productLabel: option?.label ?? '' })
										}
										loadOptions={loadProductOptions}
										selectedLabel={row.productLabel || undefined}
										placeholder='Mahsulotni tanlang'
										searchPlaceholder='Model, nomi yoki tip...'
									/>
								</div>
								<div>
									<label className='mb-1 block text-xs font-semibold text-ca-heading'>
										Soni <span className='text-ca-red'>*</span>
									</label>
									<PriceInput
										decimals={0}
										value={row.count}
										onChange={(v) => updateRow(row.key, { count: v })}
									/>
								</div>
								<div>
									<label className='mb-1 block text-xs font-semibold text-ca-heading'>
										Narxi <span className='text-ca-red'>*</span>
									</label>
									<PriceInput value={row.price} onChange={(v) => updateRow(row.key, { price: v })} />
									<p className='mt-1 text-[11px] text-ca-text'>
										Summa:{' '}
										<span className='font-semibold text-ca-heading'>{formatNumber(rowTotal(row), 2)} $</span>
									</p>
								</div>
								<div className='flex gap-1 md:pt-5'>
									<Button
										type='button'
										variant='danger'
										size='icon'
										aria-label="Qatorni o'chirish"
										disabled={rows.length === 1}
										onClick={() => removeRow(row.key)}
									>
										<FaTrash />
									</Button>
									{index === rows.length - 1 && (
										<Button type='button' variant='success' size='icon' aria-label="Qator qo'shish" onClick={addRow}>
											<FaPlus />
										</Button>
									)}
								</div>
							</div>
							{rowErrors[row.key] && <p className='mt-1 text-xs text-ca-red'>{rowErrors[row.key]}</p>}
						</div>
					))}

					<div className='mt-2 border-t border-ca-border pt-2 text-right text-xs text-ca-text'>
						Mahsulotlar summasi:{' '}
						<span className='text-sm font-bold text-ca-heading'>{formatNumber(productsTotal, 2)} $</span>
					</div>

					<div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4'>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-red'>
								O'zgargan mahsulotlar bo'yicha izoh kiriting <span className='text-ca-red'>*</span>
							</label>
							<Input value={comment} onChange={(e) => setComment(e.target.value)} />
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>Avtomobil raqami</label>
							<Input value={carNumber} onChange={(e) => setCarNumber(e.target.value)} />
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-green'>Berilgan Summa ($)</label>
							<PriceInput value={paidDollar} onChange={setPaidDollar} />
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-orange'>Jami chegirma ($)</label>
							<PriceInput value={discountAmount} onChange={setDiscountAmount} />
						</div>
					</div>

					<Button type='submit' variant='theme' className='mt-4 h-11 w-full text-sm' loading={editMutation.isPending}>
						O'zgartirish
					</Button>
				</form>
			</Panel>
		</>
	);
}
