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
	useNotification,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { useCountryQuery } from '@/services/country/country.queries';
import { useLogisticsCompanyQuery } from '@/services/logistics-company/logistics-company.queries';
import {
	useCreateLogisticsWarehouseMutation,
	useUpdateLogisticsWarehouseMutation,
} from '@/services/logistics-warehouse/logistics-warehouse.queries';
import type {
	LogisticsWarehouse,
	LogisticsWarehousePayload,
} from '@/services/logistics-warehouse/logistics-warehouse.types';
import { loadCountryOptions, loadLogisticsCompanyOptions } from '@/pages/TwoStageImport/options';

const logisticsWarehouseFormSchema = z.object({
	name: z.string().trim().min(1, 'Nomi kiritilishi shart'),
	country: z.string().min(1, 'Davlatni tanlang'),
	logisticsCompany: z.string().min(1, 'Logistika firmasini tanlang'),
});

type LogisticsWarehouseFormValues = z.infer<typeof logisticsWarehouseFormSchema>;

interface LogisticsWarehouseFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: LogisticsWarehouse;
}

export default function LogisticsWarehouseFormModal({ open, setOpen, mode, item }: LogisticsWarehouseFormModalProps) {
	const { notify } = useNotification();
	const { companyId } = useCurrentCompany();
	const [formError, setFormError] = useState('');

	const {
		register,
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<LogisticsWarehouseFormValues>({
		resolver: zodResolver(logisticsWarehouseFormSchema),
		defaultValues: {
			name: mode === 'edit' && item ? item.name : '',
			country: mode === 'edit' && item?.country ? String(item.country) : '',
			logisticsCompany: mode === 'edit' && item?.logistics_company ? String(item.logistics_company) : '',
		},
	});

	const countryValue = watch('country');
	const { data: selectedCountry } = useCountryQuery(countryValue ? Number(countryValue) : undefined);

	const logisticsCompanyValue = watch('logisticsCompany');
	const { data: selectedLogisticsCompany } = useLogisticsCompanyQuery(
		logisticsCompanyValue ? Number(logisticsCompanyValue) : undefined,
	);

	const createMutation = useCreateLogisticsWarehouseMutation();
	const updateMutation = useUpdateLogisticsWarehouseMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const company = (mode === 'edit' && item?.company) || companyId;
		if (!company) {
			setFormError("Kompaniya aniqlanmadi. Sahifani yangilab qayta urinib ko'ring.");
			return;
		}

		const payload: LogisticsWarehousePayload = {
			name: values.name.trim(),
			country: Number(values.country),
			company,
			logistics_company: Number(values.logisticsCompany),
		};

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: 'Logistika skladi yangilandi' });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Logistika skladi qo'shildi" });
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
						{mode === 'edit' ? 'Logistika skladini tahrirlash' : "Logistika skladi qo'shish"}
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
							<Input {...register('name')} placeholder='Masalan: Almaty Transit' />
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
						<FormField
							label='Logistika firmasi'
							error={errors.logisticsCompany?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Controller
								name='logisticsCompany'
								control={control}
								render={({ field }) => (
									<Combobox
										value={field.value}
										onChange={(v) => field.onChange(v)}
										loadOptions={loadLogisticsCompanyOptions}
										selectedLabel={selectedLogisticsCompany?.name}
										placeholder='Logistika firmasini tanlang'
									/>
								)}
							/>
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
