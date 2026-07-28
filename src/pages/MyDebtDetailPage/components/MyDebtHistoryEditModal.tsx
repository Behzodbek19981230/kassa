import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
	Button,
	DatePicker,
	FormField,
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
import { useUpdateMyDebtHistoryMutation } from '@/services/my-debt/my-debt-history.queries';
import type { MyDebtHistoryItem } from '@/services/my-debt/my-debt-history.types';

const myDebtHistoryEditSchema = z.object({
	cr_date: z.string().min(1, 'Sana kiritilishi shart'),
	total_debt: z.string().min(1, 'Qarz miqdori kiritilishi shart'),
	discount_amount: z.string().optional(),
	exchange_rate: z.string().min(1, 'Dollar kursi kiritilishi shart'),
	all_summ_dollar: z.string().min(1, 'Jami summa kiritilishi shart'),
});

type MyDebtHistoryEditFormValues = z.infer<typeof myDebtHistoryEditSchema>;

interface MyDebtHistoryEditModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: MyDebtHistoryItem;
}

export default function MyDebtHistoryEditModal({ open, setOpen, item }: MyDebtHistoryEditModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const updateMutation = useUpdateMyDebtHistoryMutation();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<MyDebtHistoryEditFormValues>({
		resolver: zodResolver(myDebtHistoryEditSchema),
		defaultValues: {
			cr_date: item.cr_date,
			total_debt: String(item.total_debt),
			discount_amount: String(item.discount_amount),
			exchange_rate: String(item.exchange_rate),
			all_summ_dollar: String(item.all_summ_dollar),
		},
	});

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		try {
			await updateMutation.mutateAsync({
				id: item.id,
				payload: {
					cr_date: values.cr_date,
					total_debt: Number(values.total_debt) || 0,
					discount_amount: Number(values.discount_amount) || 0,
					exchange_rate: Number(values.exchange_rate) || 0,
					all_summ_dollar: Number(values.all_summ_dollar) || 0,
				},
			});
			notify({ title: 'Yozuv yangilandi' });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Qarz tarixini tahrirlash</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Sana' error={errors.cr_date?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='cr_date'
									control={control}
									render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField
								label='Qarz miqdori ($)'
								error={errors.total_debt?.message}
								required
								horizontal={false}
								className='mb-0'
							>
								<Controller
									name='total_debt'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField
								label='Chegirma ($)'
								error={errors.discount_amount?.message}
								horizontal={false}
								className='mb-0'
							>
								<Controller
									name='discount_amount'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
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
						<FormField
							label='Jami summa ($)'
							error={errors.all_summ_dollar?.message}
							required
							horizontal={false}
							className='mb-0'
						>
							<Controller
								name='all_summ_dollar'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='success' disabled={updateMutation.isPending}>
							Saqlash
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
