import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import {
	useCreateLogisticsCompanyMutation,
	useUpdateLogisticsCompanyMutation,
} from '@/services/logistics-company/logistics-company.queries';
import type { LogisticsCompany, LogisticsCompanyPayload } from '@/services/logistics-company/logistics-company.types';

const logisticsCompanyFormSchema = z.object({
	name: z.string().trim().min(1, 'Nomi kiritilishi shart'),
});

type LogisticsCompanyFormValues = z.infer<typeof logisticsCompanyFormSchema>;

interface LogisticsCompanyFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: LogisticsCompany;
}

export default function LogisticsCompanyFormModal({ open, setOpen, mode, item }: LogisticsCompanyFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LogisticsCompanyFormValues>({
		resolver: zodResolver(logisticsCompanyFormSchema),
		defaultValues: { name: mode === 'edit' && item ? item.name : '' },
	});

	const createMutation = useCreateLogisticsCompanyMutation();
	const updateMutation = useUpdateLogisticsCompanyMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const payload: LogisticsCompanyPayload = { name: values.name.trim() };

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: 'Logistika firmasi yangilandi' });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Logistika firmasi qo'shildi" });
			}
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>
						{mode === 'edit' ? 'Logistika firmasini tahrirlash' : "Logistika firmasi qo'shish"}
					</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<FormField label='Nomi' error={errors.name?.message} required horizontal={false} className='mb-3'>
							<Input {...register('name')} placeholder='Masalan: Silk Road Cargo' />
						</FormField>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='success' loading={isSaving}>
							Saqlash
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
