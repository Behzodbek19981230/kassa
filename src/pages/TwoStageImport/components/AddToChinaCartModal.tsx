import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaCartPlus } from 'react-icons/fa';
import { z } from 'zod';
import {
	Button,
	FormField,
	InputGroup,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	PriceInput,
	useNotification,
} from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useCurrencyRateQuery } from '@/services/currency/currency.queries';
import { useAddCartItemMutation } from '@/services/two-stage-import/two-stage-import.queries';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';
import { nonNegativeNumber, positiveNumber } from '@/pages/TwoStageImport/utils';

const addToChinaCartSchema = z.object({
	typeQuantity: positiveNumber('Tip donani kiriting'),
	quantity: z
		.string()
		.trim()
		.min(1, 'Sonini kiriting')
		.refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
			message: "Soni 0 dan katta butun son bo'lishi kerak",
		}),
	priceYuan: nonNegativeNumber('Narxni kiriting (¥)'),
	priceDollar: nonNegativeNumber('Narxni kiriting ($)'),
});

type AddToChinaCartFormValues = z.infer<typeof addToChinaCartSchema>;

interface AddToChinaCartModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	product: WarehouseAllListItem;
	consignorId: number;
	/** API format, e.g. "2026-10-07T10:30:00+05:00". */
	dispatchDatetime: string;
}

export default function AddToChinaCartModal({
	open,
	setOpen,
	product,
	consignorId,
	dispatchDatetime,
}: AddToChinaCartModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const { data: usdRate } = useCurrencyRateQuery('USD');
	const rate = usdRate?.rate ?? 0;

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<AddToChinaCartFormValues>({
		resolver: zodResolver(addToChinaCartSchema),
		defaultValues: {
			typeQuantity: '1',
			quantity: '',
			priceYuan: '',
			priceDollar: '',
		},
	});

	const quantity = Number(watch('quantity')) || 0;
	const priceYuan = Number(watch('priceYuan')) || 0;
	const priceDollar = Number(watch('priceDollar')) || 0;

	const addToCartMutation = useAddCartItemMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		try {
			await addToCartMutation.mutateAsync({
				stage: 'CHINA_TO_TRANSIT',
				consignor: consignorId,
				dispatch_datetime: dispatchDatetime,
				warehouse: product.id,
				type_quantity: Number(values.typeQuantity).toFixed(4),
				quantity: Number(values.quantity),
				unit_price_yuan: Number(values.priceYuan).toFixed(2),
				unit_price_dollar: Number(values.priceDollar).toFixed(2),
			});
			notify({ title: "Mahsulot import savatiga qo'shildi" });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, "Qo'shishda xatolik yuz berdi"));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-[500px]'>
				<ModalHeader>
					<ModalTitle>Import savatiga qo'shish</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}

						<div className='mb-4 flex flex-col gap-2 rounded-[3px] bg-ca-silver p-3 text-xs'>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Dollar kursi:</span>
								<span className='font-bold text-ca-heading'>{formatNumber(rate, 2)}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Model:</span>
								<span className='truncate font-bold text-ca-red'>{product.brand_name}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Nomi:</span>
								<span className='truncate font-bold text-ca-red'>{product.product_category_name}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>O'lchami:</span>
								<span className='font-bold text-ca-red'>{formatNumber(product.size)}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Tip:</span>
								<span className='font-bold text-ca-red'>{product.type_name ?? '-'}</span>
							</div>
						</div>

						<FormField label='Tip dona' error={errors.typeQuantity?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='typeQuantity'
								control={control}
								render={({ field }) => (
									<Input
										type='number'
										inputMode='decimal'
										min={0}
										step='0.0001'
										value={field.value}
										onChange={(e) => field.onChange(e.target.value)}
										onBlur={field.onBlur}
									/>
								)}
							/>
							<p className='mt-1 text-[11px] text-ca-text'>Float qiymat</p>
						</FormField>

						<FormField label='Soni' error={errors.quantity?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='quantity'
								control={control}
								render={({ field }) => (
									<InputGroup append={product.type_name ?? 'Dona'}>
										<Input
											type='number'
											inputMode='numeric'
											min={0}
											step='1'
											value={field.value}
											onChange={(e) => field.onChange(e.target.value)}
											onBlur={field.onBlur}
										/>
									</InputGroup>
								)}
							/>
						</FormField>

						<FormField label='Narxi (¥)' error={errors.priceYuan?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='priceYuan'
								control={control}
								render={({ field }) => (
									<InputGroup prepend='¥'>
										<PriceInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
									</InputGroup>
								)}
							/>
						</FormField>

						<FormField label='Narxi ($)' error={errors.priceDollar?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='priceDollar'
								control={control}
								render={({ field }) => (
									<InputGroup prepend='$'>
										<PriceInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
									</InputGroup>
								)}
							/>
						</FormField>

						{quantity > 0 && (
							<div className='rounded-[3px] border border-ca-border bg-ca-silver-light px-3 py-2 text-xs'>
								<div className='flex items-center justify-between py-0.5'>
									<span className='text-ca-text'>Umumiy narxi (¥)</span>
									<span className='font-semibold text-ca-green'>
										{formatNumber(quantity * priceYuan, 0)} ¥
									</span>
								</div>
								<div className='flex items-center justify-between py-0.5'>
									<span className='text-ca-text'>Umumiy narxi ($)</span>
									<span className='font-semibold text-ca-green'>
										{formatNumber(quantity * priceDollar, 2)} $
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
