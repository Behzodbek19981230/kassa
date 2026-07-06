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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
	useNotification,
} from '@/components/ui';
import { CLIENT_TYPE_OPTIONS } from '@/services/client/client.types';
import { useCreateClientMutation, useUpdateClientMutation, useClientQuery } from '@/services/client/client.queries';
import type { Client, ClientPayload, ClientType } from '@/services/client/client.types';
import { districtService } from '@/services/district/district.service';
import { formatUzPhone, UZ_PHONE_REGEX } from '@/lib/phone';
import { regionService } from '@/services/region/region.service';
import { useUserInfoQuery } from '@/services/user/user.queries';
import { userService } from '@/services/user/user.service';

const clientFormSchema = z.object({
	fio: z.string().min(1, 'F.I.Sh kiritilishi shart'),
	phone: z.string().regex(UZ_PHONE_REGEX, "Telefon raqami to'liq kiritilishi shart"),
	address: z.string().min(1, 'Manzil kiritilishi shart'),
	type: z.string().min(1, 'Turi tanlanishi shart'),
	region: z.string().min(1, 'Viloyat tanlanishi shart'),
	district: z.string().min(1, 'Tuman tanlanishi shart'),
	is_worker: z.boolean(),
	worker_user: z.string().optional(),
	is_partner: z.boolean(),
	is_profit_loss: z.boolean(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: Client;
}

function clientToFormValues(client: Client): ClientFormValues {
	return {
		fio: client.fio,
		phone: client.phone,
		address: client.address,
		type: client.type,
		region: client.region ? String(client.region) : '',
		district: client.district ? String(client.district) : '',
		is_worker: Boolean(client.is_worker),
		worker_user: client.worker_user ? String(client.worker_user) : '',
		is_partner: Boolean(client.is_partner),
		is_profit_loss: Boolean(client.is_profit_loss),
	};
}

export default function ClientFormModal({ open, setOpen, mode, item }: ClientFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const { data: userInfo } = useUserInfoQuery();

	const clientQuery = useClientQuery(mode === 'edit' ? item?.id : undefined);
	const currentClient = clientQuery.data ?? item;

	const {
		control,
		register,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm<ClientFormValues>({
		resolver: zodResolver(clientFormSchema),
		defaultValues:
			mode === 'edit' && item
				? clientToFormValues(item)
				: {
						fio: '',
						phone: '+998',
						address: '',
						type: '',
						region: '',
						district: '',
						is_worker: false,
						worker_user: '',
						is_partner: false,
						is_profit_loss: false,
					},
	});

	useEffect(() => {
		if (mode === 'edit' && clientQuery.data) {
			reset(clientToFormValues(clientQuery.data));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, clientQuery.data]);

	const regionValue = watch('region');
	const isWorker = watch('is_worker');

	const createMutation = useCreateClientMutation();
	const updateMutation = useUpdateClientMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

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

	const loadUserOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await userService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((u) => ({
				value: String(u.id),
				label: `${u.last_name} ${u.first_name}`.trim() || u.username,
			})),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const handleRegionChange = (value: string) => {
		setValue('region', value);
		setValue('district', '');
	};

	const workerUserDetail = currentClient?.worker_user_detail;
	const workerUserLabel = workerUserDetail
		? `${workerUserDetail.last_name} ${workerUserDetail.first_name}`.trim() || workerUserDetail.username
		: undefined;

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const company = item?.company ?? userInfo?.companies?.[0];
		if (!company) {
			setFormError('Tashkilot topilmadi');
			return;
		}

		const payload: ClientPayload = {
			fio: values.fio.trim(),
			phone: values.phone.trim(),
			address: values.address.trim(),
			type: values.type as ClientType,
			region: Number(values.region),
			district: Number(values.district),
			is_worker: values.is_worker ? 1 : 0,
			worker_user: values.is_worker && values.worker_user ? Number(values.worker_user) : null,
			is_partner: values.is_partner ? 1 : 0,
			is_profit_loss: values.is_profit_loss ? 1 : 0,
			company,
		};

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: 'Mijoz yangilandi' });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Mijoz qo'shildi" });
			}
			setOpen(false);
		} catch {
			setFormError('Saqlashda xatolik yuz berdi');
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-2xl'>
				<ModalHeader>
					<ModalTitle>{mode === 'edit' ? 'Mijozni tahrirlash' : "Mijoz qo'shish"}</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='F.I.Sh' error={errors.fio?.message} required horizontal={false} className='mb-0'>
								<Input {...register('fio')} />
							</FormField>
							<FormField label='Telefon' error={errors.phone?.message} required horizontal={false} className='mb-0'>
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
						</div>
						<FormField label='Turi' error={errors.type?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='type'
								control={control}
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue placeholder='Tanlang...' />
										</SelectTrigger>
										<SelectContent>
											{CLIENT_TYPE_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
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
											selectedLabel={currentClient?.region_detail?.name}
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
											selectedLabel={currentClient?.district_detail?.name}
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
						<div className='mb-3 flex flex-wrap gap-4'>
							<Controller
								name='is_worker'
								control={control}
								render={({ field }) => (
									<Checkbox inline label='Ishchi' checked={field.value} onCheckedChange={(v) => field.onChange(!!v)} />
								)}
							/>
							<Controller
								name='is_partner'
								control={control}
								render={({ field }) => (
									<Checkbox inline label='Hamkor' checked={field.value} onCheckedChange={(v) => field.onChange(!!v)} />
								)}
							/>
							<Controller
								name='is_profit_loss'
								control={control}
								render={({ field }) => (
									<Checkbox
										inline
										label='Foyda/zarar hisobiga kiradi'
										checked={field.value}
										onCheckedChange={(v) => field.onChange(!!v)}
									/>
								)}
							/>
						</div>
						{isWorker && (
							<FormField label='Foydalanuvchi' horizontal={false} className='mb-3'>
								<Controller
									name='worker_user'
									control={control}
									render={({ field }) => (
										<Combobox
											value={field.value ?? ''}
											onChange={field.onChange}
											loadOptions={loadUserOptions}
											selectedLabel={workerUserLabel}
											placeholder='Tanlang...'
											searchPlaceholder='Foydalanuvchi qidirish...'
											clearable
										/>
									)}
								/>
							</FormField>
						)}
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
