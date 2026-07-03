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
import {
	useCreateBrandSizeTypeMutation,
	useUpdateBrandSizeTypeMutation,
} from '@/services/brand-size-type/brand-size-type.queries';
import { brandSizeTypeService } from '@/services/brand-size-type/brand-size-type.service';
import type { BrandSizeType, BrandSizeTypePayload } from '@/services/brand-size-type/brand-size-type.types';

const typeFormSchema = z.object({
	name: z.string().min(1, 'Nomi kiritilishi shart'),
	sorting: z.string(),
	active: z.boolean(),
});

type TypeFormValues = z.infer<typeof typeFormSchema>;

interface TypeFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: BrandSizeType;
}

export default function TypeFormModal({ open, setOpen, mode, item }: TypeFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const [sortingHint, setSortingHint] = useState('');

	const {
		register,
		control,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<TypeFormValues>({
		resolver: zodResolver(typeFormSchema),
		defaultValues:
			mode === 'edit' && item
				? { name: item.name, sorting: String(item.sorting), active: item.status }
				: { name: '', sorting: '0', active: true },
	});

	const createMutation = useCreateBrandSizeTypeMutation();
	const updateMutation = useUpdateBrandSizeTypeMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		if (mode !== 'create') return;
		brandSizeTypeService
			.getNextSorting()
			.then(({ first_empty_sorting, message }) => {
				setValue('sorting', String(first_empty_sorting));
				setSortingHint(message);
			})
			.catch(() => {
				// keep default sorting if the suggestion request fails
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const payload: BrandSizeTypePayload = {
			name: values.name.trim(),
			sorting: Number(values.sorting) || 0,
			status: values.active,
		};

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: 'Tur yangilandi' });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Tur qo'shildi" });
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
					<ModalTitle>{mode === 'edit' ? 'Turni tahrirlash' : "Tur qo'shish"}</ModalTitle>
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
