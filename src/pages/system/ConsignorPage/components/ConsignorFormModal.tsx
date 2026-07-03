import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
	Button,
	FormField,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	Textarea,
	useNotification,
} from '@/components/ui';
import { formatUzPhone, UZ_PHONE_REGEX } from '@/lib/phone';
import { useCreateConsignorMutation, useUpdateConsignorMutation } from '@/services/consignor/consignor.queries';
import type { Consignor, ConsignorPayload } from '@/services/consignor/consignor.types';

const consignorFormSchema = z.object({
	name: z.string().min(1, 'Nomi kiritilishi shart'),
	phone: z.string().regex(UZ_PHONE_REGEX, "Telefon raqami to'liq kiritilishi shart"),
	address: z.string().min(1, 'Manzil kiritilishi shart'),
});

type ConsignorFormValues = z.infer<typeof consignorFormSchema>;

interface ConsignorFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: Consignor;
}

export default function ConsignorFormModal({ open, setOpen, mode, item }: ConsignorFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<ConsignorFormValues>({
		resolver: zodResolver(consignorFormSchema),
		defaultValues:
			mode === 'edit' && item
				? { name: item.name, phone: item.phone, address: item.address }
				: { name: '', phone: '+998', address: '' },
	});

	const createMutation = useCreateConsignorMutation();
	const updateMutation = useUpdateConsignorMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const payload: ConsignorPayload = {
			name: values.name.trim(),
			phone: values.phone.trim(),
			address: values.address.trim(),
		};

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: "Yuk jo'natuvchi yangilandi" });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Yuk jo'natuvchi qo'shildi" });
			}
			setOpen(false);
		} catch {
			setFormError('Saqlashda xatolik yuz berdi');
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{mode === 'edit' ? "Yuk jo'natuvchini tahrirlash" : "Yuk jo'natuvchi qo'shish"}</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<FormField label='Nomi' error={errors.name?.message} required horizontal={false} className='mb-3'>
							<Input {...register('name')} />
						</FormField>
						<FormField label='Telefon' error={errors.phone?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='phone'
								control={control}
								render={({ field }) => (
									<Input
										inputMode='numeric'
										placeholder='+998 XX XXX XX XX'
										value={field.value}
										onChange={(e) => field.onChange(formatUzPhone(e.target.value))}
										onBlur={field.onBlur}
									/>
								)}
							/>
						</FormField>
						<FormField label='Manzil' error={errors.address?.message} required horizontal={false} className='mb-3'>
							<Textarea rows={3} {...register('address')} />
						</FormField>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='success' disabled={isSaving}>
							Saqlash
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
