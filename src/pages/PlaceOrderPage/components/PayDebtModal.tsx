import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
	Button,
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
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useClientQuery } from '@/services/client/client.queries';
import { useCurrencyRateQuery } from '@/services/currency/currency.queries';
import { usePayDebtMutation } from '@/services/order-account-history/order-account-history.queries';

const payDebtFormSchema = z.object({
	date: z.string().min(1, 'Sana kiritilishi shart'),
	text: z.string().optional(),
	discount_amount: z.string().optional(),
	sum_som: z.string().optional(),
	summ_dollar: z.string().optional(),
	summ_cart: z.string().optional(),
	sum_transfers: z.string().optional(),
	zdacha_sum: z.string().optional(),
	zdacha_dollar: z.string().optional(),
});

type PayDebtFormValues = z.infer<typeof payDebtFormSchema>;

interface PayDebtModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	companyId: number;
	clientId: number;
	onPaid?: () => void;
}

export default function PayDebtModal({ open, setOpen, companyId, clientId, onPaid }: PayDebtModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const { data: client } = useClientQuery(clientId);
	const { data: usdRate } = useCurrencyRateQuery('USD');
	const rate = usdRate?.rate ?? 0;

	const {
		control,
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<PayDebtFormValues>({
		resolver: zodResolver(payDebtFormSchema),
		defaultValues: {
			date: new Date().toISOString().slice(0, 10),
			text: '',
			discount_amount: '0',
			sum_som: '0',
			summ_dollar: '0',
			summ_cart: '0',
			sum_transfers: '0',
			zdacha_sum: '0',
			zdacha_dollar: '0',
		},
	});

	const sumSom = watch('sum_som');
	const summDollar = watch('summ_dollar');
	const summCart = watch('summ_cart');
	const sumTransfers = watch('sum_transfers');
	const discountAmount = watch('discount_amount');

	const somTotal = (Number(sumSom) || 0) + (Number(summCart) || 0) + (Number(sumTransfers) || 0);
	const allSummDollar = (rate > 0 ? somTotal / rate : 0) + (Number(summDollar) || 0) + (Number(discountAmount) || 0);

	const payDebtMutation = usePayDebtMutation();

	useEffect(() => {
		if (!open) setFormError('');
	}, [open]);

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		if (!rate) {
			setFormError("Dollar kursi yuklanmoqda, birozdan so'ng qayta urinib ko'ring.");
			return;
		}

		try {
			await payDebtMutation.mutateAsync({
				company: companyId,
				client: clientId,
				date: values.date,
				text: values.text?.trim() ?? '',
				exchange_rate: rate,
				discount_amount: Number(values.discount_amount) || 0,
				sum_som: Number(values.sum_som) || 0,
				summ_dollar: Number(values.summ_dollar) || 0,
				summ_cart: Number(values.summ_cart) || 0,
				sum_transfers: Number(values.sum_transfers) || 0,
				zdacha_sum: Number(values.zdacha_sum) || 0,
				zdacha_dollar: Number(values.zdacha_dollar) || 0,
				all_summ_dollar: allSummDollar,
				summa: allSummDollar,
				is_worker: client?.is_worker ?? 0,
			});
			notify({ title: "Qarz to'landi" });
			setOpen(false);
			onPaid?.();
		} catch (err) {
			setFormError(getApiErrorMessage(err, "To'lashda xatolik yuz berdi"));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-2xl'>
				<ModalHeader>
					<ModalTitle>Qarz to'lash</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}

						<div className='mb-4 grid grid-cols-2 gap-2 rounded-[3px] bg-ca-silver p-3 text-center text-xs'>
							<div>
								<div className='text-ca-text'>Joriy qarzi ($)</div>
								<div className='font-bold text-ca-red'>{formatNumber(client?.total_debt ?? 0, 2)}</div>
							</div>
							<div>
								<div className='text-ca-text'>To'lanadigan summa ($)</div>
								<div className='font-bold text-ca-green'>{formatNumber(allSummDollar, 2)}</div>
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
							<FormField label="Naqd (so'mda)" horizontal={false} className='mb-0'>
								<Controller
									name='sum_som'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label='Summa dollarda ($)' horizontal={false} className='mb-0'>
								<Controller
									name='summ_dollar'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>

						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Karta orqali' horizontal={false} className='mb-0'>
								<Controller
									name='summ_cart'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label="O'tkazma orqali" horizontal={false} className='mb-0'>
								<Controller
									name='sum_transfers'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>

						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label="Qaytim (so'mda)" horizontal={false} className='mb-0'>
								<Controller
									name='zdacha_sum'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label='Qaytim (dollarda)' horizontal={false} className='mb-0'>
								<Controller
									name='zdacha_dollar'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>

						<FormField label='Jami chegirma ($)' horizontal={false} className='mb-3'>
							<Controller
								name='discount_amount'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>

						<FormField label='Izoh' horizontal={false} className='mb-0'>
							<Input {...register('text')} />
						</FormField>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='success' disabled={payDebtMutation.isPending}>
							Saqlash
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
