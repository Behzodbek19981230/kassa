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
	Textarea,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { generateId } from '@/lib/utils';
import WarehouseProductRow, {
	emptyWarehouseRow,
	type WarehouseRowValue,
} from '@/pages/WarehousePage/components/WarehouseProductRow';
import {
	useOrderAccountHistoryProductsQuery,
	useOrderAccountHistoryQuery,
	useUpdateOrderAccountHistoryMutation,
} from '@/services/order-account-history/order-account-history.queries';
import {
	useCreateProductAccountHistoryMutation,
	useDeleteProductAccountHistoryMutation,
	useUpdateProductAccountHistoryMutation,
} from '@/services/product-account-history/product-account-history.queries';
import type { ProductAccountHistoryCreatePayload } from '@/services/product-account-history/product-account-history.types';
import type { Warehouse } from '@/services/warehouse/warehouse.types';

const editOrderFormSchema = z.object({
	date: z.string().min(1, 'Sana kiritilishi shart'),
	exchange_rate: z.string().min(1, 'Dollar kursini kiriting'),
	discount_amount: z.string().optional(),
	sum_dollar: z.string().optional(),
	sum_som: z.string().optional(),
	sum_cart: z.string().optional(),
	sum_transfers: z.string().optional(),
	zdacha_dollar: z.string().optional(),
	zdacha_sum: z.string().optional(),
	driver_info: z.string().optional(),
	order_commit: z.string().optional(),
	order_account_status: z.boolean(),
	fast_order: z.boolean(),
});

type EditOrderFormValues = z.infer<typeof editOrderFormSchema>;

interface EditableProductRow extends WarehouseRowValue {
	productId?: number;
}

export default function OrderAccountHistoryEditPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const orderId = id ? Number(id) : undefined;
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const { data: item, isLoading, isError } = useOrderAccountHistoryQuery(orderId);
	const { data: productsData } = useOrderAccountHistoryProductsQuery(orderId);

	const [rows, setRows] = useState<EditableProductRow[]>([]);
	const [removedProductIds, setRemovedProductIds] = useState<number[]>([]);
	const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
	const [resolvedWarehouseByKey, setResolvedWarehouseByKey] = useState<Record<string | number, number | undefined>>(
		{},
	);

	useEffect(() => {
		if (!productsData) return;
		const items = productsData.products.groups.flatMap((g) => g.items);
		setRows(
			items.map((productItem) => ({
				key: generateId(),
				productId: productItem.id,
				brand: String(productItem.brand),
				product_category: String(productItem.product_category),
				brandSize: '',
				size: productItem.size,
				type: productItem.type,
				type_sklad: String(productItem.type_sklad),
				price: String(productItem.price),
				count: productItem.count,
			})),
		);
		setRemovedProductIds([]);
	}, [productsData]);

	const updateRow = (index: number, next: EditableProductRow) => {
		setRows((prev) => prev.map((row, i) => (i === index ? next : row)));
	};
	const addRow = () => setRows((prev) => [...prev, { ...emptyWarehouseRow(), count: null }]);
	const removeRow = (index: number) => {
		const row = rows[index];
		if (row?.productId) {
			setRemovedProductIds((prev) => [...prev, row.productId!]);
		}
		setRows((prev) => prev.filter((_, i) => i !== index));
	};

	function handleResolveStock(key: string | number, warehouse: Warehouse | undefined) {
		setResolvedWarehouseByKey((prev) => {
			if (prev[key] === warehouse?.id) return prev;
			return { ...prev, [key]: warehouse?.id };
		});
	}

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<EditOrderFormValues>({
		resolver: zodResolver(editOrderFormSchema),
		values: item
			? {
					date: item.date,
					exchange_rate: item.exchange_rate,
					discount_amount: item.discount_amount,
					sum_dollar: item.sum_dollar,
					sum_som: item.sum_som,
					sum_cart: item.sum_cart,
					sum_transfers: item.sum_transfers,
					zdacha_dollar: item.zdacha_dollar,
					zdacha_sum: item.zdacha_sum,
					driver_info: item.driver_info ?? '',
					order_commit: item.order_commit ?? '',
					order_account_status: Boolean(item.order_account_status),
					fast_order: Boolean(item.fast_order),
				}
			: undefined,
	});

	const updateMutation = useUpdateOrderAccountHistoryMutation();
	const createProductMutation = useCreateProductAccountHistoryMutation();
	const updateProductMutation = useUpdateProductAccountHistoryMutation();
	const deleteProductMutation = useDeleteProductAccountHistoryMutation();
	const isSaving =
		updateMutation.isPending ||
		createProductMutation.isPending ||
		updateProductMutation.isPending ||
		deleteProductMutation.isPending;

	const onSubmit = handleSubmit(async (values) => {
		if (!item) return;
		setFormError('');

		const rowErrs: Record<number, string> = {};
		rows.forEach((row, i) => {
			if (!row.brand || !row.product_category || !row.brandSize || !row.price || !row.type_sklad || !row.count) {
				rowErrs[i] = "Barcha maydonlar to'ldirilishi shart";
			} else if (!resolvedWarehouseByKey[row.key]) {
				rowErrs[i] = 'Bu tovar omborda topilmadi';
			}
		});
		if (Object.keys(rowErrs).length) {
			setRowErrors(rowErrs);
			setFormError("Mahsulotlar bo'limida xatolik bor");
			return;
		}
		setRowErrors({});

		try {
			await updateMutation.mutateAsync({
				id: item.id,
				payload: {
					company: item.company,
					client: item.client,
					date: values.date,
					exchange_rate: values.exchange_rate,
					discount_amount: values.discount_amount || '0',
					all_summ_dollar: item.all_summ_dollar,
					sum_dollar: values.sum_dollar || '0',
					sum_som: values.sum_som || '0',
					sum_cart: values.sum_cart || '0',
					sum_transfers: values.sum_transfers || '0',
					zdacha_dollar: values.zdacha_dollar || '0',
					zdacha_sum: values.zdacha_sum || '0',
					driver_info: values.driver_info?.trim(),
					order_commit: values.order_commit?.trim(),
					order_account_status: values.order_account_status,
					fast_order: values.fast_order,
				},
			});

			for (const row of rows) {
				const warehouseId = resolvedWarehouseByKey[row.key]!;
				const payload: ProductAccountHistoryCreatePayload = {
					order_account_history: item.id,
					warehouse: warehouseId,
					count: row.count ?? 0,
					price: row.price,
				};
				if (row.productId) {
					await updateProductMutation.mutateAsync({ id: row.productId, payload });
				} else {
					await createProductMutation.mutateAsync(payload);
				}
			}

			for (const productId of removedProductIds) {
				await deleteProductMutation.mutateAsync(productId);
			}

			notify({ title: 'Buyurtma yangilandi' });
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
				<FaExclamationTriangle /> Buyurtma topilmadi
			</div>
		);
	}

	return (
		<>
			<div className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-ca-theme px-4 py-3 text-white'>
				<h4 className='text-sm font-normal'>
					<span className='font-semibold'>{item.client_name ?? item.client_detail?.fio}</span> ning{' '}
					{item.date} sanadagi mahsulotlarini o'zgartirish
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
							<Input value={item.client_name ?? item.client_detail?.fio ?? ''} disabled />
						</FormField>
						<FormField label='Eski Qarz ($)' horizontal={false} className='mb-0'>
							<Input value={formatNumber(item.total_debt_old, 2)} disabled />
						</FormField>
						<FormField label='Sana' error={errors.date?.message} required horizontal={false} className='mb-0'>
							<Controller
								name='date'
								control={control}
								render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField
							label='Dollar kursi'
							error={errors.exchange_rate?.message}
							required
							horizontal={false}
							className='mb-0'
						>
							<Controller
								name='exchange_rate'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
					</div>
				</div>

				<div className='mb-5 rounded-[3px] bg-white p-5 shadow-sm'>
					{rows.map((row, index) => (
						<WarehouseProductRow
							key={row.key}
							value={row}
							onChange={(next) => updateRow(index, next as EditableProductRow)}
							error={rowErrors[index]}
							showAdd={index === rows.length - 1}
							onAdd={addRow}
							showRemove
							onRemove={() => removeRow(index)}
							companyId={item.company}
							showCount
							resolveStock
							onResolveStock={handleResolveStock}
						/>
					))}
					{rows.length === 0 && (
						<Button type='button' variant='success' size='sm' onClick={addRow}>
							Mahsulot qo'shish
						</Button>
					)}
				</div>

				<div className='mb-5 rounded-[3px] bg-white p-5 shadow-sm'>
					<div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-5'>
						<FormField label='Jami summa dollarda ($)' horizontal={false} className='mb-0'>
							<PriceInput value={formatNumber(item.all_summ_dollar, 2)} disabled />
						</FormField>
						<FormField label='Jami chegirma ($)' horizontal={false} className='mb-0'>
							<Controller
								name='discount_amount'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField label='Summa dollarda ($)' horizontal={false} className='mb-0'>
							<Controller
								name='sum_dollar'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
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
					</div>

					<div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-5'>
						<FormField label='Qaytim ($)' horizontal={false} className='mb-0'>
							<Controller
								name='zdacha_dollar'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField label="Qaytim so'mda" horizontal={false} className='mb-0'>
							<Controller
								name='zdacha_sum'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField label='Izoh' horizontal={false} className='mb-0'>
							<Textarea rows={1} {...register('order_commit')} />
						</FormField>
						<FormField label="Haydovchi ma'lumotlari" horizontal={false} className='mb-0'>
							<Input {...register('driver_info')} />
						</FormField>
						<FormField label='Summa transferda' horizontal={false} className='mb-0'>
							<Controller
								name='sum_transfers'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
					</div>

					<div className='mb-4 flex items-center gap-6'>
						<Controller
							name='order_account_status'
							control={control}
							render={({ field }) => (
								<Checkbox label='Tasdiqlash:' checked={field.value} onCheckedChange={field.onChange} inline />
							)}
						/>
						<Controller
							name='fast_order'
							control={control}
							render={({ field }) => (
								<Checkbox label='Tezda tayyorlash:' checked={field.value} onCheckedChange={field.onChange} inline />
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
