import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
	Button,
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
import { useUpdateWarehouseMutation } from '@/services/warehouse/warehouse.queries';
import type { Warehouse, WarehousePayload } from '@/services/warehouse/warehouse.types';

const paymentFormSchema = z.object({
	all_sum_dollar: z.string().min(1, 'Umumiy summa kiritilishi shart'),
	all_discount_amount: z.string().min(1, 'Chegirma summasi kiritilishi shart'),
	all_my_total_debt: z.string().min(1, 'Qarz summasi kiritilishi shart'),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface WarehousePaymentModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: Warehouse;
}

export default function WarehousePaymentModal({ open, setOpen, item }: WarehousePaymentModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<PaymentFormValues>({
		resolver: zodResolver(paymentFormSchema),
		defaultValues: {
			all_sum_dollar: String(item.all_sum_dollar),
			all_discount_amount: String(item.all_discount_amount),
			all_my_total_debt: String(item.all_my_total_debt),
		},
	});

	const updateMutation = useUpdateWarehouseMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const payload: WarehousePayload = {
			cr_date: item.cr_date,
			size: item.size,
			count: item.count,
			price: item.price,
			worker_price: item.worker_price,
			status_count: item.status_count,
			company: item.company,
			brand: item.brand,
			product_category: item.product_category,
			type: item.type,
			type_sklad: item.type_sklad,
			all_sum_dollar: Number(values.all_sum_dollar) || 0,
			all_discount_amount: Number(values.all_discount_amount) || 0,
			all_my_total_debt: Number(values.all_my_total_debt) || 0,
		};

		try {
			await updateMutation.mutateAsync({ id: item.id, payload });
			notify({ title: "Hisob-kitob ma'lumotlari yangilandi" });
			setOpen(false);
		} catch {
			setFormError('Saqlashda xatolik yuz berdi');
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Hisob-kitob</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<FormField
							label='Umumiy summa ($)'
							error={errors.all_sum_dollar?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Controller
								name='all_sum_dollar'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField
							label='Chegirma summasi ($)'
							error={errors.all_discount_amount?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Controller
								name='all_discount_amount'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField
							label='Qarz summasi ($)'
							error={errors.all_my_total_debt?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Controller
								name='all_my_total_debt'
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
