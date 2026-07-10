import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaCashRegister } from 'react-icons/fa';
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
	Textarea,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useCurrencyRateQuery } from '@/services/currency/currency.queries';
import { useConfirmImportMutation } from '@/services/import-cart-draft/import-cart-draft.queries';

const confirmImportFormSchema = z.object({
	date: z.string().min(1, 'Sana kiritilishi shart'),
	discount_amount: z.string().optional(),
	sum_dollar: z.string().optional(),
	sum_som: z.string().optional(),
	car_number: z.string().optional(),
	comment: z.string().optional(),
});

type ConfirmImportFormValues = z.infer<typeof confirmImportFormSchema>;

interface ConfirmImportModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	companyId: number;
	consignorId: number;
	cartCount: number;
	allImportDollar: number;
	onConfirmed: () => void;
}

export default function ConfirmImportModal({
	open,
	setOpen,
	companyId,
	consignorId,
	cartCount,
	allImportDollar,
	onConfirmed,
}: ConfirmImportModalProps) {
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
	} = useForm<ConfirmImportFormValues>({
		resolver: zodResolver(confirmImportFormSchema),
		defaultValues: {
			date: new Date().toISOString().slice(0, 10),
			discount_amount: '0',
			sum_dollar: '0',
			sum_som: '0',
			car_number: '',
			comment: '',
		},
	});

	const discountAmount = watch('discount_amount');
	const sumDollar = watch('sum_dollar');
	const sumSom = watch('sum_som');

	const givenSumDollar = (Number(sumDollar) || 0) + (rate > 0 ? (Number(sumSom) || 0) / rate : 0);
	const remaining = allImportDollar - givenSumDollar - (Number(discountAmount) || 0);

	const confirmImportMutation = useConfirmImportMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		if (!rate) {
			setFormError("Dollar kursi yuklanmoqda, birozdan so'ng qayta urinib ko'ring.");
			return;
		}

		try {
			await confirmImportMutation.mutateAsync({
				company: companyId,
				consignor: consignorId,
				date: values.date,
				exchange_rate: rate,
				given_sum_dollar: givenSumDollar.toFixed(2),
				sum_dollar: values.sum_dollar || '0',
				sum_som: values.sum_som || '0',
				discount_amount: values.discount_amount || '0',
				car_number: values.car_number?.trim(),
				comment: values.comment?.trim(),
			});
			notify({ title: 'Import tasdiqlandi' });
			setOpen(false);
			onConfirmed();
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Tasdiqlashda xatolik yuz berdi'));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-2xl'>
				<ModalHeader>
					<ModalTitle>Importni tasdiqlash</ModalTitle>
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
								<div className='text-ca-text'>Jami import ($)</div>
								<div className='font-bold text-ca-red'>
									{formatNumber(allImportDollar, 2)}$
									{rate > 0 && (
										<span className='ml-1 font-normal text-ca-text'>
											({formatNumber(allImportDollar * rate, 0)})
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
							<FormField label='Sum dollar ($)' horizontal={false} className='mb-0'>
								<Controller
									name='sum_dollar'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label="Sum so'mda" horizontal={false} className='mb-0'>
								<Controller
									name='sum_som'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>

						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Chegirma ($)' horizontal={false} className='mb-0'>
								<Controller
									name='discount_amount'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label='Berilgan summa ($)' horizontal={false} className='mb-0'>
								<PriceInput value={givenSumDollar.toFixed(2)} disabled />
							</FormField>
						</div>

						<FormField label='Mashina raqami' horizontal={false} className='mb-3'>
							<Input {...register('car_number')} placeholder='01A123AA' />
						</FormField>

						<FormField label='Izoh' horizontal={false} className='mb-0'>
							<Textarea rows={2} {...register('comment')} />
						</FormField>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='danger' disabled={confirmImportMutation.isPending}>
							<FaCashRegister className='mr-1.5' /> Importni tasdiqlash
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
