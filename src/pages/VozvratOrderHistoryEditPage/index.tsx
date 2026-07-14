import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaArrowLeft, FaExclamationTriangle, FaSave } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import {
	Button,
	Checkbox,
	DatePicker,
	FormField,
	Input,
	PriceInput,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { generateId } from '@/lib/utils';
import VozvratProductRow, {
	emptyVozvratRow,
	type VozvratRowValue,
} from '@/pages/VozvratOrderHistoryEditPage/components/VozvratProductRow';
import {
	useUpdateVozvratSaleMutation,
	useVozvratOrderProductsQuery,
	useVozvratOrderQuery,
} from '@/services/vozvrat/vozvrat.queries';
import type { VozvratProductItem, VozvratUpdateVozvratItemPayload } from '@/services/vozvrat/vozvrat.types';

const editVozvratFormSchema = z.object({
	date: z.string().min(1, 'Sana kiritilishi shart'),
	sum_dollar: z.string().optional(),
	sum_som: z.string().optional(),
	sum_cart: z.string().optional(),
	comment: z.string().optional(),
	confirmation: z.boolean(),
});

type EditVozvratFormValues = z.infer<typeof editVozvratFormSchema>;

type EditableVozvratRow = VozvratRowValue;

export default function VozvratOrderHistoryEditPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const vozvratId = id ? Number(id) : undefined;
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const { data: item, isLoading, isError } = useVozvratOrderQuery(vozvratId);
	const { data: productsData } = useVozvratOrderProductsQuery(vozvratId);

	const [rows, setRows] = useState<EditableVozvratRow[]>([]);
	const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
	const [resolvedByKey, setResolvedByKey] = useState<Record<string | number, VozvratProductItem | undefined>>({});
	const [fallbackByKey, setFallbackByKey] = useState<Record<string | number, VozvratProductItem>>({});

	useEffect(() => {
		if (!productsData) return;
		const items = productsData.products.groups.flatMap((g) => g.items);
		const fallbacks: Record<string | number, VozvratProductItem> = {};
		setRows(
			items.map((productItem) => {
				const key = generateId();
				fallbacks[key] = {
					warehouse: productItem.warehouse,
					brand: productItem.brand,
					brand_name: productItem.brand_name,
					product_category: productItem.product_category,
					product_category_name: productItem.product_category_name,
					size: Number(productItem.size),
					type: productItem.type,
					type_name: productItem.type_name,
					type_sklad: productItem.type_sklad,
					type_sklad_name: productItem.type_sklad_name,
					order_date: '',
					order_date_label: '',
					remaining_count: productItem.count,
					price_dollar: Number(productItem.price),
					price_som: Number(productItem.price_som),
				};
				return {
					key,
					brand: String(productItem.brand),
					product_category: String(productItem.product_category),
					variantKey: `${productItem.brand}-${productItem.product_category}-${productItem.size}-${productItem.type}`,
					locationKey: String(productItem.type_sklad),
					count: productItem.count,
					price: String(productItem.price),
				};
			}),
		);
		setFallbackByKey(fallbacks);
	}, [productsData]);

	const updateRow = (index: number, next: EditableVozvratRow) => {
		setRows((prev) => prev.map((row, i) => (i === index ? next : row)));
	};
	const addRow = () => setRows((prev) => [...prev, emptyVozvratRow()]);
	const removeRow = (index: number) => {
		setRows((prev) => prev.filter((_, i) => i !== index));
	};

	function handleResolve(key: string | number, row: VozvratProductItem | undefined) {
		setResolvedByKey((prev) => {
			if (prev[key] === row) return prev;
			return { ...prev, [key]: row };
		});
	}

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<EditVozvratFormValues>({
		resolver: zodResolver(editVozvratFormSchema),
		values: item
			? {
					date: item.date,
					sum_dollar: String(item.sum_dollar),
					sum_som: String(item.sum_som),
					sum_cart: String(item.sum_cart),
					comment: item.comment ?? '',
					confirmation: Boolean(item.confirmation),
				}
			: undefined,
	});

	const updateVozvratMutation = useUpdateVozvratSaleMutation();
	const isSaving = updateVozvratMutation.isPending;

	const onSubmit = handleSubmit(async (values) => {
		if (!item) return;
		setFormError('');

		const rowErrs: Record<number, string> = {};
		rows.forEach((row, i) => {
			if (!row.brand || !row.product_category || !row.variantKey || !row.locationKey || !row.price || !row.count) {
				rowErrs[i] = "Barcha maydonlar to'ldirilishi shart";
			} else if (!resolvedByKey[row.key]) {
				rowErrs[i] = 'Bu tovar mijozda topilmadi';
			}
		});
		if (Object.keys(rowErrs).length) {
			setRowErrors(rowErrs);
			setFormError("Mahsulotlar bo'limida xatolik bor");
			return;
		}
		setRowErrors({});

		const items: VozvratUpdateVozvratItemPayload[] = rows.map((row) => {
			const resolved = resolvedByKey[row.key]!;
			return {
				warehouse: resolved.warehouse,
				brand: resolved.brand,
				product_category: resolved.product_category,
				size: resolved.size,
				type: resolved.type,
				type_sklad: resolved.type_sklad,
				count: row.count ?? 0,
				price: row.price,
			};
		});

		try {
			await updateVozvratMutation.mutateAsync({
				id: item.id,
				payload: {
					date: values.date,
					all_summ_dollar: item.all_summ_dollar,
					sum_dollar: values.sum_dollar || '0',
					sum_som: values.sum_som || '0',
					sum_cart: values.sum_cart || '0',
					comment: values.comment?.trim(),
					confirmation: values.confirmation,
					items,
				},
			});

			notify({ title: 'Vozvrat buyurtma yangilandi' });
			navigate(-1);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Yangilashda xatolik yuz berdi'));
		}
	});

	if (isLoading) {
		return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
	}

	if (isError || !item) {
		return (
			<div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
				<FaExclamationTriangle /> Vozvrat buyurtma topilmadi
			</div>
		);
	}

	return (
		<>
			<div className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-ca-theme px-4 py-3 text-white'>
				<h4 className='text-sm font-normal'>
					<span className='font-semibold'>{item.client_detail?.fio}</span> ning {item.date} sanadagi vozvrat
					buyurtmasini o'zgartirish
				</h4>
				<Button type='button' variant='warning' size='xs' onClick={() => navigate(-1)}>
					<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
				</Button>
			</div>

			<form onSubmit={onSubmit} noValidate>
				<div className='mb-5 rounded-[3px] bg-white p-5 shadow-sm'>
					{formError && (
						<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}

					<div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4'>
						<FormField label='Mijoz' horizontal={false} className='mb-0'>
							<Input value={item.client_detail?.fio ?? ''} disabled />
						</FormField>
						<FormField label='Eski Qarz ($)' horizontal={false} className='mb-0'>
							<Input value={formatNumber(item.old_total_debt, 2)} disabled />
						</FormField>
						<FormField label='Sana' error={errors.date?.message} required horizontal={false} className='mb-0'>
							<Controller
								name='date'
								control={control}
								render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField label='Dollar kursi' horizontal={false} className='mb-0'>
							<PriceInput value={formatNumber(item.exchange_rate)} disabled />
						</FormField>
					</div>
				</div>

				<div className='mb-5 rounded-[3px] bg-white p-5 shadow-sm'>
					{rows.map((row, index) => (
						<VozvratProductRow
							key={row.key}
							value={row}
							onChange={(next) => updateRow(index, next as EditableVozvratRow)}
							error={rowErrors[index]}
							showAdd={index === rows.length - 1}
							onAdd={addRow}
							showRemove
							onRemove={() => removeRow(index)}
							clientId={item.client}
							onResolve={handleResolve}
							fallback={fallbackByKey[row.key]}
						/>
					))}
					{rows.length === 0 && (
						<Button type='button' variant='success' size='sm' onClick={addRow}>
							Mahsulot qo'shish
						</Button>
					)}
				</div>

				<div className='mb-5 rounded-[3px] bg-white p-5 shadow-sm'>
					<div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4'>
						<FormField label='Qaytgan mahsulot summasi ($)' horizontal={false} className='mb-0'>
							<PriceInput value={formatNumber(item.product_summ_dollar, 2)} disabled />
						</FormField>
						<FormField label='Mijozga qaytarilgan summa ($)' horizontal={false} className='mb-0'>
							<PriceInput value={formatNumber(item.all_summ_dollar, 2)} disabled />
						</FormField>
						<FormField label='Jami chegirma ($)' horizontal={false} className='mb-0'>
							<PriceInput value={formatNumber(item.discount_amount ?? 0)} disabled />
						</FormField>
						<FormField label='Summa dollarda ($)' horizontal={false} className='mb-0'>
							<Controller
								name='sum_dollar'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
					</div>

					<div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4'>
						<FormField label="Summa so'mda" horizontal={false} className='mb-0'>
							<Controller
								name='sum_som'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField label='Summa kartada' horizontal={false} className='mb-0'>
							<Controller
								name='sum_cart'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField label='Izoh' horizontal={false} className='mb-0'>
							<Input {...register('comment')} />
						</FormField>
					</div>

					<div className='mb-4 flex items-center gap-6'>
						<Controller
							name='confirmation'
							control={control}
							render={({ field }) => (
								<Checkbox label='Tasdiqlash:' checked={field.value} onCheckedChange={field.onChange} inline />
							)}
						/>
					</div>

					<Button type='submit' variant='info' className='w-full' disabled={isSaving}>
						<FaSave className='mr-1.5' /> O'zgartirish
					</Button>
				</div>
			</form>
		</>
	);
}
