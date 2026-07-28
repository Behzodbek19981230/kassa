import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
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
import { usePayMyDebtMutation } from '@/services/my-debt/my-debt.queries';
import type { MyDebtItem, MyDebtPayPayload } from '@/services/my-debt/my-debt.types';

const myDebtPayFormSchema = z
	.object({
		date: z.string().min(1, 'Sana kiritilishi shart'),
		all_summ_dollar: z.string().optional(),
		discount_amount: z.string().optional(),
		text: z.string().optional(),
	})
	.refine((values) => (Number(values.all_summ_dollar) || 0) > 0 || (Number(values.discount_amount) || 0) > 0, {
		message: "To'langan summa yoki chegirma miqdoridan biri kiritilishi shart",
		path: ['all_summ_dollar'],
	});

type MyDebtPayFormValues = z.infer<typeof myDebtPayFormSchema>;

interface MyDebtPayModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: MyDebtItem;
}

export default function MyDebtPayModal({ open, setOpen, item }: MyDebtPayModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const {
		control,
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<MyDebtPayFormValues>({
		resolver: zodResolver(myDebtPayFormSchema),
		defaultValues: {
			date: new Date().toISOString().slice(0, 10),
			all_summ_dollar: '',
			discount_amount: '',
			text: '',
		},
	});

	const payMutation = usePayMyDebtMutation();

	function handleOpenChange(next: boolean) {
		if (!next) {
			reset({ date: new Date().toISOString().slice(0, 10), all_summ_dollar: '', discount_amount: '', text: '' });
			setFormError('');
		}
		setOpen(next);
	}

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');

		const payload: MyDebtPayPayload = {
			company: item.company,
			consignor: item.consignor,
			date: values.date,
			all_summ_dollar: Number(values.all_summ_dollar) || 0,
			discount_amount: Number(values.discount_amount) || 0,
			text: values.text?.trim() ?? '',
		};

		try {
			const result = await payMutation.mutateAsync(payload);
			notify({
				title: "To'lov qabul qilindi",
				text: `Qolgan qarz: ${formatNumber(result.summary.my_total_debt, 2)} $`,
			});
			handleOpenChange(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
		}
	});

	return (
		<Modal open={open} onOpenChange={handleOpenChange}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{item.consignor_detail?.name} qarzini to'lash</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<div className='mb-4 rounded border border-ca-theme/30 bg-ca-theme/5 px-4 py-2 text-center text-sm font-semibold text-ca-theme'>
							Joriy qarz: {formatNumber(item.total_debt, 2)} $
						</div>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField
								label="To'langan summa ($)"
								error={errors.all_summ_dollar?.message}
								horizontal={false}
								className='mb-0'
							>
								<Controller
									name='all_summ_dollar'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label='Chegirma ($)' horizontal={false} className='mb-0'>
								<Controller
									name='discount_amount'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>
						<FormField label='Sana' error={errors.date?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='date'
								control={control}
								render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField label='Izoh' horizontal={false} className='mb-0'>
							<Input {...register('text')} />
						</FormField>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => handleOpenChange(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='success' disabled={payMutation.isPending}>
							To'lash
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
