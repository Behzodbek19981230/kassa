import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
	Button,
	Checkbox,
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
import { useCreateBrandMutation, useUpdateBrandMutation } from '@/services/brand/brand.queries';
import { brandService } from '@/services/brand/brand.service';
import type { Brand, BrandPayload } from '@/services/brand/brand.types';

const brandFormSchema = z.object({
	name: z.string().min(1, 'Nomi kiritilishi shart'),
	sorting: z.string(),
	active: z.boolean(),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;

interface BrandFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: Brand;
}

export default function BrandFormModal({ open, setOpen, mode, item }: BrandFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const [sortingHint, setSortingHint] = useState('');

	const {
		register,
		control,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<BrandFormValues>({
		resolver: zodResolver(brandFormSchema),
		defaultValues:
			mode === 'edit' && item
				? { name: item.name, sorting: String(item.sorting), active: item.status === 1 }
				: { name: '', sorting: '0', active: true },
	});

	const createMutation = useCreateBrandMutation();
	const updateMutation = useUpdateBrandMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		brandService
			.getNextSorting()
			.then(({ first_empty_sorting, message }) => {
				setSortingHint(message);
				if (mode === 'create') setValue('sorting', String(first_empty_sorting));
			})
			.catch(() => {
				// keep default sorting if the suggestion request fails
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const payload: BrandPayload = {
			name: values.name.trim(),
			sorting: Number(values.sorting) || 0,
			status: values.active ? 1 : 0,
			sup_status: values.active ? 1 : 0,
		};

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: 'Model yangilandi' });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Model qo'shildi" });
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
					<ModalTitle>{mode === 'edit' ? 'Modelni tahrirlash' : "Model qo'shish"}</ModalTitle>
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
						<FormField label='Tartibi' error={errors.sorting?.message} horizontal={false} className='mb-3'>
							<Input type='number' {...register('sorting')} />
							{sortingHint && <i className='mt-1 block text-xs text-ca-text'>{sortingHint}</i>}
						</FormField>
						<Controller
							name='active'
							control={control}
							render={({ field }) => (
								<Checkbox
									inline
									label='Faol'
									checked={field.value}
									onCheckedChange={(v) => field.onChange(!!v)}
								/>
							)}
						/>
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
