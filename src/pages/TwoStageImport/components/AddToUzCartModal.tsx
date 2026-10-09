import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaCartPlus } from 'react-icons/fa';
import { z } from 'zod';
import {
	Button,
	Combobox,
	FormField,
	InputGroup,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	useNotification,
} from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import {
	useAddCartItemMutation,
	useImportCartQuery,
	useImportOrdersQuery,
} from '@/services/two-stage-import/two-stage-import.queries';
import type { TransitStockItem } from '@/services/two-stage-import/two-stage-import.types';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';

interface AddToUzCartModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	stock: TransitStockItem;
	product?: WarehouseAllListItem;
	/** API format, e.g. "2026-10-14T09:00:00+05:00". */
	dispatchDatetime: string;
}

interface AddToUzCartFormValues {
	twoStageImport: string;
	quantity: string;
}

export default function AddToUzCartModal({ open, setOpen, stock, product, dispatchDatetime }: AddToUzCartModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const available = stock.available_quantity;
	const brandName = stock.warehouse_detail?.brand_name ?? product?.brand_name;
	const categoryName = stock.warehouse_detail?.product_category_name ?? product?.product_category_name;
	const typeName = stock.warehouse_detail?.type_name ?? product?.type_name;

	// Transit stock is pooled per logistics warehouse, but a cart item must name the import it ships.
	// Once the cart holds an import, every later item goes under that same one.
	const cartQuery = useImportCartQuery('TRANSIT_TO_UZBEKISTAN');
	const cartImportId = cartQuery.data?.cart?.two_stage_import ?? null;

	const ordersQuery = useImportOrdersQuery({
		stage: 'CHINA_TO_TRANSIT',
		destination_logistics_warehouse: stock.logistics_warehouse,
	});

	const importOptions = useMemo(() => {
		const options = new Map<number, string>();
		for (const order of ordersQuery.data ?? []) {
			const detail = order.two_stage_import_detail;
			if (!detail) continue;
			if (order.destination_logistics_warehouse !== stock.logistics_warehouse) continue;
			if (order.status !== 'ARRIVED' && order.status !== 'RECEIVED') continue;
			options.set(detail.id, detail.import_number);
		}
		return Array.from(options, ([value, label]) => ({ value: String(value), label }));
	}, [ordersQuery.data, stock.logistics_warehouse]);

	// Quantity is limited to what is still free in transit, so the form checks it before the API does.
	const schema = useMemo(
		() =>
			z.object({
				twoStageImport: z.string().min(1, 'Importni tanlang'),
				quantity: z
					.string()
					.trim()
					.min(1, 'Sonini kiriting')
					.refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
						message: "Soni 0 dan katta butun son bo'lishi kerak",
					})
					.refine((v) => Number(v) <= available, {
						message: `Mavjud miqdor: ${formatNumber(available)}`,
					}),
			}),
		[available],
	);

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		getValues,
		formState: { errors },
	} = useForm<AddToUzCartFormValues>({
		resolver: zodResolver(schema),
		defaultValues: { twoStageImport: cartImportId != null ? String(cartImportId) : '', quantity: '' },
	});

	// Data can arrive after the form mounts: lock to the cart's import, or pick the only option.
	useEffect(() => {
		if (cartImportId != null) {
			setValue('twoStageImport', String(cartImportId));
		} else if (importOptions.length === 1 && !getValues('twoStageImport')) {
			setValue('twoStageImport', importOptions[0].value);
		}
	}, [cartImportId, importOptions, setValue, getValues]);

	const quantity = Number(watch('quantity')) || 0;

	const addToCartMutation = useAddCartItemMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		try {
			await addToCartMutation.mutateAsync({
				stage: 'TRANSIT_TO_UZBEKISTAN',
				source_logistics_warehouse: stock.logistics_warehouse,
				two_stage_import: Number(values.twoStageImport),
				dispatch_datetime: dispatchDatetime,
				import_warehouse: stock.id,
				quantity: Number(values.quantity),
			});
			notify({ title: "Mahsulot O'zbekistonga jo'natish savatiga qo'shildi" });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, "Qo'shishda xatolik yuz berdi"));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-[500px]'>
				<ModalHeader>
					<ModalTitle>O'zbekistonga jo'natish savatiga qo'shish</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}

						<div className='mb-4 flex flex-col gap-2 rounded-[3px] bg-ca-silver p-3 text-xs'>
							{brandName && (
								<div className='flex items-center justify-between'>
									<span className='font-semibold text-ca-heading'>Model:</span>
									<span className='font-bold text-ca-red'>{brandName}</span>
								</div>
							)}
							{categoryName && (
								<div className='flex items-center justify-between'>
									<span className='font-semibold text-ca-heading'>Nomi:</span>
									<span className='font-bold text-ca-red'>{categoryName}</span>
								</div>
							)}
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>O'lchami:</span>
								<span className='font-bold text-ca-red'>{formatNumber(stock.warehouse_detail?.size ?? product?.size ?? '')}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Tip:</span>
								<span className='font-bold text-ca-red'>{typeName ?? '-'}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Mavjud:</span>
								<span className='font-bold text-ca-heading'>{formatNumber(available)}</span>
							</div>
						</div>

						<FormField label='Import' error={errors.twoStageImport?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='twoStageImport'
								control={control}
								render={({ field }) => (
									<Combobox
										value={field.value}
										onChange={(value) => field.onChange(value)}
										options={importOptions}
										disabled={cartImportId != null}
										placeholder={ordersQuery.isLoading ? 'Yuklanmoqda...' : 'Importni tanlang'}
										emptyText='Bu omborga yetib kelgan import topilmadi'
									/>
								)}
							/>
						</FormField>

						<FormField label='Soni' error={errors.quantity?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='quantity'
								control={control}
								render={({ field }) => (
									<InputGroup append={typeName ?? 'Dona'}>
										<Input
											type='number'
											inputMode='numeric'
											min={0}
											max={available}
											step='1'
											value={field.value}
											onChange={(e) => field.onChange(e.target.value)}
											onBlur={field.onBlur}
										/>
									</InputGroup>
								)}
							/>
						</FormField>

						{quantity > 0 && (
							<div className='rounded-[3px] border border-ca-border bg-ca-silver-light px-3 py-2 text-xs'>
								<div className='flex items-center justify-between py-0.5'>
									<span className='text-ca-text'>Umumiy narxi (¥)</span>
									<span className='font-semibold text-ca-green'>
										{formatNumber(quantity * Number(stock.current_price_yuan), 0)} ¥
									</span>
								</div>
								<div className='flex items-center justify-between py-0.5'>
									<span className='text-ca-text'>Umumiy narxi ($)</span>
									<span className='font-semibold text-ca-green'>
										{formatNumber(quantity * Number(stock.current_price_dollar), 2)} $
									</span>
								</div>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='danger' loading={addToCartMutation.isPending}>
							<FaCartPlus className='mr-1.5' /> Savatga qo'shish
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
