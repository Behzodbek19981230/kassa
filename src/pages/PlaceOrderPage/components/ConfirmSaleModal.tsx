import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaCashRegister } from 'react-icons/fa';
import { z } from 'zod';
import {
	Button,
	Checkbox,
	DatePicker,
	FormField,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	PriceInput,
	Textarea,
	useNotification,
} from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { useConfirmSaleMutation } from '@/services/order-cart/order-cart.queries';
import type { ConfirmSaleSummary } from '@/services/order-cart/order-cart.types';
import { useCurrencyRateQuery } from '@/services/currency/currency.queries';

const confirmSaleFormSchema = z.object({
	date: z.string().min(1, 'Sana kiritilishi shart'),
	discount_amount: z.string().optional(),
	sum_dollar: z.string().optional(),
	sum_som: z.string().optional(),
	sum_cart: z.string().optional(),
	sum_transfers: z.string().optional(),
	zdacha_dollar: z.string().optional(),
	zdacha_sum: z.string().optional(),
	driver_info: z.string().optional(),
	comment: z.string().optional(),
	order_account_status: z.boolean(),
	fast_order: z.boolean(),
});

type ConfirmSaleFormValues = z.infer<typeof confirmSaleFormSchema>;

interface ConfirmSaleModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	companyId: number;
	clientId: number;
	cartCount: number;
	allSummDollar: number;
	onConfirmed: (summary: ConfirmSaleSummary) => void;
}

export default function ConfirmSaleModal({
	open,
	setOpen,
	companyId,
	clientId,
	cartCount,
	allSummDollar,
	onConfirmed,
}: ConfirmSaleModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const { data: usdRate } = useCurrencyRateQuery('USD');
	const rate = usdRate?.rate ?? 0;

	const {
		control,
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<ConfirmSaleFormValues>({
		resolver: zodResolver(confirmSaleFormSchema),
		defaultValues: {
			date: new Date().toISOString().slice(0, 10),
			discount_amount: '0',
			sum_dollar: '0',
			sum_som: '0',
			sum_cart: '0',
			sum_transfers: '0',
			zdacha_dollar: '0',
			zdacha_sum: '0',
			driver_info: '',
			comment: '',
			order_account_status: true,
			fast_order: false,
		},
	});

	const discountAmount = watch('discount_amount');
	const sumDollar = watch('sum_dollar');
	const sumSom = watch('sum_som');
	const sumCart = watch('sum_cart');
	const sumTransfers = watch('sum_transfers');

	const paidDollar =
		(Number(sumDollar) || 0) +
		(rate > 0 ? (Number(sumSom) || 0) / rate : 0) +
		(Number(sumCart) || 0) +
		(Number(sumTransfers) || 0);
	const remaining = allSummDollar - (Number(discountAmount) || 0) - paidDollar;

	const confirmSaleMutation = useConfirmSaleMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		if (!rate) {
			setFormError("Dollar kursi yuklanmoqda, birozdan so'ng qayta urinib ko'ring.");
			return;
		}

		try {
			const result = await confirmSaleMutation.mutateAsync({
				company: companyId,
				client: clientId,
				date: values.date,
				exchange_rate: rate,
				discount_amount: values.discount_amount || '0',
				all_summ_dollar: String(allSummDollar),
				sum_dollar: values.sum_dollar || '0',
				sum_som: values.sum_som || '0',
				sum_cart: values.sum_cart || '0',
				sum_transfers: values.sum_transfers || '0',
				zdacha_dollar: values.zdacha_dollar || '0',
				zdacha_sum: values.zdacha_sum || '0',
				driver_info: values.driver_info?.trim(),
				comment: values.comment?.trim(),
				order_account_status: values.order_account_status,
				fast_order: values.fast_order,
			});
			notify({ title: 'Buyurtma tasdiqlandi' });
			setOpen(false);
			onConfirmed(result.summary);
		} catch {
			setFormError('Tasdiqlashda xatolik yuz berdi');
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-2xl'>
				<ModalHeader>
					<ModalTitle>Sotish</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}

						<div className='mb-4 grid grid-cols-3 gap-2 rounded-[3px] bg-ca-silver p-3 text-center text-xs'>
							<div>
								<div className='text-ca-text'>Soni</div>
								<div className='font-bold text-ca-red'>{formatNumber(cartCount)}</div>
							</div>
							<div>
								<div className='text-ca-text'>Jami ($)</div>
								<div className='font-bold text-ca-red'>
									{formatNumber(allSummDollar, 2)}$
									{rate > 0 && (
										<span className='ml-1 font-normal text-ca-text'>
											({formatNumber(allSummDollar * rate, 0)})
										</span>
									)}
								</div>
							</div>
							<div>
								<div className='text-ca-text'>Qoldiq</div>
								<div className={remaining > 0 ? 'font-bold text-ca-red' : 'font-bold text-ca-green'}>
									{formatNumber(remaining, 2)}$
									{rate > 0 && (
										<span className='ml-1 font-normal text-ca-text'>
											({formatNumber(remaining * rate, 0)})
										</span>
									)}
								</div>
							</div>
						</div>

						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Sana' error={errors.date?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='date'
									control={control}
									render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label='Dollar kursi' horizontal={false} className='mb-0'>
								<PriceInput value={rate ? String(rate) : ''} disabled />
							</FormField>
						</div>

						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Jami summa ($)' horizontal={false} className='mb-0'>
								<PriceInput value={allSummDollar.toFixed(2)} disabled />
							</FormField>
							<FormField label='Chegirma ($)' horizontal={false} className='mb-0'>
								<Controller
									name='discount_amount'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>

						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label="To'langan summa ($)" horizontal={false} className='mb-0'>
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
						</div>

						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Summa kartada' horizontal={false} className='mb-0'>
								<Controller
									name='sum_cart'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label='Summa transferda' horizontal={false} className='mb-0'>
								<Controller
									name='sum_transfers'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>

						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Qaytim ($)' horizontal={false} className='mb-0'>
								<Controller
									name='zdacha_dollar'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label="Qaytim so'm" horizontal={false} className='mb-0'>
								<Controller
									name='zdacha_sum'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>

						<FormField label="Haydovchi ma'lumotlari" horizontal={false} className='mb-3'>
							<Input {...register('driver_info')} />
						</FormField>

						<FormField label='Izoh' horizontal={false} className='mb-4'>
							<Textarea rows={2} {...register('comment')} />
						</FormField>

						<div className='flex items-center gap-6'>
							<Controller
								name='order_account_status'
								control={control}
								render={({ field }) => (
									<Checkbox
										label='Tasdiqlash:'
										checked={field.value}
										onCheckedChange={field.onChange}
										inline
									/>
								)}
							/>
							<Controller
								name='fast_order'
								control={control}
								render={({ field }) => (
									<Checkbox
										label='Tezda tayyorlash:'
										checked={field.value}
										onCheckedChange={field.onChange}
										inline
									/>
								)}
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='danger' disabled={confirmSaleMutation.isPending}>
							<FaCashRegister className='mr-1.5' /> Sotishni tasdiqlash
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
