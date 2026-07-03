import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, type ChangeEvent } from 'react';
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
	Textarea,
	useNotification,
} from '@/components/ui';
import { formatUzPhone, UZ_PHONE_REGEX } from '@/lib/phone';
import { useCreateCompanyMutation, useUpdateCompanyMutation } from '@/services/company/company.queries';
import type { Company, CompanyPayload } from '@/services/company/company.types';
import { districtService } from '@/services/district/district.service';
import { regionService } from '@/services/region/region.service';

const companyFormSchema = z.object({
	name: z.string().min(1, 'Nomi kiritilishi shart'),
	code: z.string().min(1, 'Kodi kiritilishi shart'),
	phone: z.string().regex(UZ_PHONE_REGEX, "Telefon raqami to'liq kiritilishi shart"),
	region: z.string().min(1, 'Viloyat tanlanishi shart'),
	district: z.string().min(1, 'Tuman tanlanishi shart'),
	address: z.string().min(1, 'Manzil kiritilishi shart'),
	active: z.boolean(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface CompanyFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: Company;
}

export default function CompanyFormModal({ open, setOpen, mode, item }: CompanyFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [logoPreview, setLogoPreview] = useState<string | null>(item?.logo ?? null);

	const {
		register,
		control,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<CompanyFormValues>({
		resolver: zodResolver(companyFormSchema),
		defaultValues:
			mode === 'edit' && item
				? {
						name: item.name,
						code: item.code,
						phone: item.phone,
						region: item.region ? String(item.region) : '',
						district: item.district ? String(item.district) : '',
						address: item.address,
						active: item.is_active,
					}
				: { name: '', code: '', phone: '+998', region: '', district: '', address: '', active: true },
	});

	const regionValue = watch('region');

	const createMutation = useCreateCompanyMutation();
	const updateMutation = useUpdateCompanyMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		return () => {
			if (logoFile && logoPreview) URL.revokeObjectURL(logoPreview);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [logoFile]);

	const loadRegionOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await regionService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((r) => ({ value: String(r.id), label: r.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadDistrictOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		if (!regionValue) return { options: [], hasMore: false };
		const result = await districtService.list({
			region: Number(regionValue),
			search: search || undefined,
			page,
			limit: 20,
		});
		return {
			options: result.results.map((d) => ({ value: String(d.id), label: d.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const handleRegionChange = (value: string) => {
		setValue('region', value);
		setValue('district', '');
	};

	const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] ?? null;
		setLogoFile(file);
		setLogoPreview(file ? URL.createObjectURL(file) : (item?.logo ?? null));
	};

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const payload: CompanyPayload = {
			name: values.name.trim(),
			code: values.code.trim(),
			phone: values.phone.trim(),
			region: Number(values.region),
			district: Number(values.district),
			address: values.address.trim(),
			is_active: values.active,
		};

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload, logo: logoFile });
				notify({ title: 'Tashkilot yangilandi' });
			} else {
				await createMutation.mutateAsync({ payload, logo: logoFile });
				notify({ title: "Tashkilot qo'shildi" });
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
					<ModalTitle>{mode === 'edit' ? 'Tashkilotni tahrirlash' : "Tashkilot qo'shish"}</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<FormField label='Logo' horizontal={false} className='mb-3'>
							<div className='flex items-center gap-3'>
								{logoPreview && (
									<img src={logoPreview} alt='Logo' className='h-12 w-12 rounded object-cover' />
								)}
								<input type='file' accept='image/*' onChange={handleLogoChange} className='text-xs' />
							</div>
						</FormField>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Nomi' error={errors.name?.message} required horizontal={false} className='mb-0'>
								<Input {...register('name')} />
							</FormField>
							<FormField label='Kodi' error={errors.code?.message} required horizontal={false} className='mb-0'>
								<Input {...register('code')} />
							</FormField>
						</div>
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
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Viloyat' error={errors.region?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='region'
									control={control}
									render={({ field }) => (
										<Combobox
											value={field.value}
											onChange={handleRegionChange}
											loadOptions={loadRegionOptions}
											selectedLabel={item?.region_detail?.name}
											placeholder='Tanlang...'
											searchPlaceholder='Viloyat qidirish...'
											clearable
										/>
									)}
								/>
							</FormField>
							<FormField label='Tuman' error={errors.district?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='district'
									control={control}
									render={({ field }) => (
										<Combobox
											value={field.value}
											onChange={field.onChange}
											loadOptions={loadDistrictOptions}
											selectedLabel={item?.district_detail?.name}
											placeholder='Tanlang...'
											searchPlaceholder='Tuman qidirish...'
											disabled={!regionValue}
											clearable
										/>
									)}
								/>
							</FormField>
						</div>
						<FormField label='Manzil' error={errors.address?.message} required horizontal={false} className='mb-3'>
							<Textarea rows={2} {...register('address')} />
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
