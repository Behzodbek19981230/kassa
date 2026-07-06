import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
	Button,
	Checkbox,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
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
import { useCreateDistrictMutation, useUpdateDistrictMutation } from '@/services/district/district.queries';
import type { District, DistrictPayload } from '@/services/district/district.types';
import { regionService } from '@/services/region/region.service';

const districtFormSchema = z.object({
	name: z.string().min(1, 'Nomi kiritilishi shart'),
	code: z.string().min(1, 'Kodi kiritilishi shart'),
	region: z.string().min(1, 'Viloyat tanlanishi shart'),
	active: z.boolean(),
});

type DistrictFormValues = z.infer<typeof districtFormSchema>;

interface DistrictFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: District;
}

export default function DistrictFormModal({ open, setOpen, mode, item }: DistrictFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const [regionName, setRegionName] = useState('');

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<DistrictFormValues>({
		resolver: zodResolver(districtFormSchema),
		defaultValues:
			mode === 'edit' && item
				? { name: item.name, code: item.code, region: String(item.region), active: item.is_active }
				: { name: '', code: '', region: '', active: true },
	});

	const createMutation = useCreateDistrictMutation();
	const updateMutation = useUpdateDistrictMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		if (mode !== 'edit' || !item?.region) return;
		regionService.get(item.region).then((region) => setRegionName(region.name));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const loadRegionOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await regionService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((r) => ({ value: String(r.id), label: r.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const payload: DistrictPayload = {
			name: values.name.trim(),
			code: values.code.trim(),
			region: Number(values.region),
			is_active: values.active,
		};

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: 'Tuman yangilandi' });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Tuman qo'shildi" });
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
					<ModalTitle>{mode === 'edit' ? 'Tumanni tahrirlash' : "Tuman qo'shish"}</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<FormField label='Viloyat' error={errors.region?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='region'
								control={control}
								render={({ field }) => (
									<Combobox
										value={field.value}
										onChange={field.onChange}
										loadOptions={loadRegionOptions}
										selectedLabel={regionName || undefined}
										placeholder='Tanlang...'
										searchPlaceholder='Viloyat qidirish...'
										clearable
									/>
								)}
							/>
						</FormField>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Nomi' error={errors.name?.message} required horizontal={false} className='mb-0'>
								<Input {...register('name')} />
							</FormField>
							<FormField label='Kodi' error={errors.code?.message} required horizontal={false} className='mb-0'>
								<Input {...register('code')} />
							</FormField>
						</div>
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
