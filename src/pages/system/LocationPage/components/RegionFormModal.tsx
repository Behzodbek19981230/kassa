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
import { useCreateRegionMutation, useUpdateRegionMutation } from '@/services/region/region.queries';
import type { Region, RegionPayload } from '@/services/region/region.types';

const regionFormSchema = z.object({
	name: z.string().min(1, 'Nomi kiritilishi shart'),
});

type RegionFormValues = z.infer<typeof regionFormSchema>;

interface RegionFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: Region;
}

export default function RegionFormModal({ open, setOpen, mode, item }: RegionFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegionFormValues>({
		resolver: zodResolver(regionFormSchema),
		defaultValues: mode === 'edit' && item ? { name: item.name } : { name: '' },
	});

	const createMutation = useCreateRegionMutation();
	const updateMutation = useUpdateRegionMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const payload: RegionPayload = { name: values.name.trim() };

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: 'Viloyat yangilandi' });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Viloyat qo'shildi" });
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
					<ModalTitle>{mode === 'edit' ? 'Viloyatni tahrirlash' : "Viloyat qo'shish"}</ModalTitle>
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
