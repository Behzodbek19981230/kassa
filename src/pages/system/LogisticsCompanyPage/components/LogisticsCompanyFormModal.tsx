import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
	Button,
	Combobox,
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
import { getApiErrorMessage } from '@/lib/errors';
import { formatUzPhone, UZ_PHONE_REGEX } from '@/lib/phone';
import { useCountryQuery } from '@/services/country/country.queries';
import {
	useCreateLogisticsCompanyMutation,
	useUpdateLogisticsCompanyMutation,
} from '@/services/logistics-company/logistics-company.queries';
import type { LogisticsCompany, LogisticsCompanyPayload } from '@/services/logistics-company/logistics-company.types';
import { loadCountryOptions } from '@/pages/TwoStageImport/options';

const logisticsCompanyFormSchema = z.object({
	name: z.string().trim().min(1, 'Nomi kiritilishi shart'),
	country: z.string().min(1, 'Davlatni tanlang'),
	// Optional, but a phone number that has been started must be complete.
	phone: z
		.string()
		.refine((value) => value === '' || UZ_PHONE_REGEX.test(value), "Telefon raqami to'liq kiritilishi kerak"),
	contactPerson: z.string(),
	address: z.string(),
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
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<LogisticsCompanyFormValues>({
		resolver: zodResolver(logisticsCompanyFormSchema),
		defaultValues: {
			name: mode === 'edit' && item ? item.name : '',
			country: mode === 'edit' && item?.country ? String(item.country) : '',
			phone: mode === 'edit' && item?.phone ? item.phone : '',
			contactPerson: mode === 'edit' && item?.contact_person ? item.contact_person : '',
			address: mode === 'edit' && item?.address ? item.address : '',
		},
	});

	const countryValue = watch('country');
	const { data: selectedCountry } = useCountryQuery(countryValue ? Number(countryValue) : undefined);

	const createMutation = useCreateLogisticsCompanyMutation();
	const updateMutation = useUpdateLogisticsCompanyMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const payload: LogisticsCompanyPayload = {
			name: values.name.trim(),
			country: Number(values.country),
			phone: values.phone.trim(),
			contact_person: values.contactPerson.trim(),
			address: values.address.trim(),
		};

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
			<ModalContent className='max-w-xl'>
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
						<FormField label='Davlat' error={errors.country?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='country'
								control={control}
								render={({ field }) => (
									<Combobox
										value={field.value}
										onChange={(v) => field.onChange(v)}
										loadOptions={loadCountryOptions}
										selectedLabel={selectedCountry?.name}
										placeholder='Davlatni tanlang'
									/>
								)}
							/>
						</FormField>
						<FormField label='Telefon' error={errors.phone?.message} horizontal={false} className='mb-3'>
							<Controller
								name='phone'
								control={control}
								render={({ field }) => (
									<Input
										inputMode='numeric'
										placeholder='+998 XX XXX XX XX'
										value={field.value}
										onChange={(e) => {
											const formatted = formatUzPhone(e.target.value);
											// Clearing the field leaves the mask's bare prefix, which means "no phone".
											field.onChange(formatted === '+998' ? '' : formatted);
										}}
										onBlur={field.onBlur}
									/>
								)}
							/>
						</FormField>
						<FormField label='Kontakt shaxs' error={errors.contactPerson?.message} horizontal={false} className='mb-3'>
							<Input {...register('contactPerson')} placeholder='Masalan: Aliyev Ali' />
						</FormField>
						<FormField label='Manzil' error={errors.address?.message} horizontal={false} className='mb-3'>
							<Textarea rows={3} {...register('address')} />
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
