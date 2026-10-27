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
	PriceInput,
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
import { useCurrentCompany } from '@/lib/company';
import { formatUzPhone, UZ_PHONE_REGEX } from '@/lib/phone';
import { regionService } from '@/services/region/region.service';
import { userService } from '@/services/user/user.service';

import { getApiErrorMessage } from '@/lib/errors';

const clientFormSchema = z.object({
	fio: z.string().min(1, 'F.I.Sh kiritilishi shart'),
	phone: z.string().regex(UZ_PHONE_REGEX, "Telefon raqami to'liq kiritilishi shart"),
	address: z.string(),
	total_debt: z.string().min(1, 'Qarz miqdori kiritilishi shart'),
	debt_limit: z
		.string()
		.refine((v) => !v.trim() || Number(v) >= 0, "Qarz limiti manfiy bo'lishi mumkin emas"),
	keshbek: z
		.string()
		.refine((v) => {
			if (!v.trim()) return true;
			const n = Number(v);
			return !Number.isNaN(n) && n >= 0 && n <= 100;
		}, 'Keshbek foizi 0 dan 100 gacha bo\'lishi kerak'),
	type: z.string().min(1, 'Turi tanlanishi shart'),
	worker_user: z.string(),
	region: z.string().min(1, 'Viloyat tanlanishi shart'),
	district: z.string().min(1, 'Tuman tanlanishi shart'),
	is_profit_loss: z.boolean(),
	is_blocked: z.boolean(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

interface ClientFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: Client;
	hideStatusFlags?: boolean;
}

function clientToFormValues(client: Client): ClientFormValues {
	return {
		fio: client.fio,
		phone: formatUzPhone(client.phone ?? ''),
		address: client.address ?? '',
		total_debt: client.total_debt ?? '0',
		debt_limit: client.debt_limit ?? '',
		keshbek: client.keshbek ?? '0',
		type: client.type,
		worker_user: client.worker_user ? String(client.worker_user) : '',
		region: client.region ? String(client.region) : '',
		district: client.district ? String(client.district) : '',
		is_profit_loss: Boolean(client.is_profit_loss),
		is_blocked: Boolean(client.is_blocked),
	};
}

type LockedClientField = 'total_debt' | 'debt_limit' | 'keshbek' | 'worker_user' | 'is_profit_loss' | 'is_blocked';

/** Fields only Super Admin may change on an existing client; everyone else saves them unchanged. */
function lockedClientFields(client: Client): Pick<ClientPayload, LockedClientField> {
	return {
		total_debt: Number(client.total_debt) || 0,
		debt_limit: client.debt_limit != null && client.debt_limit !== '' ? Number(client.debt_limit) : null,
		keshbek: Number(client.keshbek) || 0,
		worker_user: client.worker_user ?? null,
		is_profit_loss: client.is_profit_loss ? 1 : 0,
		is_blocked: Boolean(client.is_blocked),
	};
}

export default function ClientFormModal({ open, setOpen, mode, item, hideStatusFlags = false }: ClientFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const { companyId, isSuperAdmin } = useCurrentCompany();

	const clientQuery = useClientQuery(mode === 'edit' ? item?.id : undefined);
	const currentClient = clientQuery.data ?? item;
	// When editing, everyone but Super Admin may only change F.I.Sh, telefon, turi, viloyat, tuman and manzil.
	const isRestrictedEdit = mode === 'edit' && !isSuperAdmin;

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
						total_debt: '',
						debt_limit: '',
						keshbek: '',
						type: '',
						worker_user: '',
						region: '',
						district: '',
						is_profit_loss: false,
						is_blocked: false,
					},
	});

	useEffect(() => {
		if (mode === 'edit' && clientQuery.data) {
			reset(clientToFormValues(clientQuery.data));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, clientQuery.data]);

	const regionValue = watch('region');

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

	const loadUserOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await userService.list({ search: search || undefined, page, limit: 20, is_login_blocked: false });
		return {
			// Bloklangan xodimlarni ko'rsatmaymiz (backend filterni e'tiborsiz qoldirsa ham).
			options: result.results
				.filter((u) => !u.is_login_blocked)
				.map((u) => ({ value: String(u.id), label: userLabel(u) })),
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

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const company = item?.company ?? companyId ?? undefined;
		if (!company) {
			setFormError('Tashkilot topilmadi');
			return;
		}

		const payload: ClientPayload = {
			fio: values.fio.trim(),
			phone: values.phone.trim(),
			address: values.address.trim(),
			total_debt: Number(values.total_debt) || 0,
			debt_limit: values.debt_limit.trim() ? Number(values.debt_limit) : null,
			keshbek: Number(values.keshbek) || 0,
			type: values.type as ClientType,
			region: Number(values.region),
			district: Number(values.district),
			// Ishchi/Hamkor flags are no longer edited in this form; keep the client's existing values.
			is_worker: currentClient?.is_worker ? 1 : 0,
			worker_user: values.worker_user ? Number(values.worker_user) : null,
			is_partner: currentClient?.is_partner ? 1 : 0,
			is_profit_loss: values.is_profit_loss ? 1 : 0,
			is_blocked: values.is_blocked,
			company,
			...(isRestrictedEdit && currentClient ? lockedClientFields(currentClient) : {}),
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
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
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
							<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField
								label='F.I.Sh'
								error={errors.fio?.message}
								required
								horizontal={false}
								className='mb-0'
							>
								<Input {...register('fio')} />
							</FormField>
							<FormField
								label='Telefon'
								error={errors.phone?.message}
								required
								horizontal={false}
								className='mb-0'
							>
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
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField
								label='Turi'
								error={errors.type?.message}
								required
								horizontal={false}
								className='mb-0'
							>
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
							{!isRestrictedEdit && (
								<FormField label="Ma'sul xodim" horizontal={false} className='mb-0'>
									<Controller
										name='worker_user'
										control={control}
										render={({ field }) => (
											<Combobox
												value={field.value}
												onChange={field.onChange}
												loadOptions={loadUserOptions}
												selectedLabel={
													currentClient?.worker_user_detail
														? userLabel(currentClient.worker_user_detail)
														: undefined
												}
												placeholder='Tanlang...'
												searchPlaceholder='Xodim qidirish...'
												clearable
											/>
										)}
									/>
								</FormField>
							)}
						</div>
						{!isRestrictedEdit && (
							<div className='mb-3 grid grid-cols-3 gap-3'>
								<FormField
									label='Qarz miqdori ($)'
									error={errors.total_debt?.message}
									required
									horizontal={false}
									className='mb-0'
								>
									<Controller
										name='total_debt'
										control={control}
										render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
									/>
								</FormField>
								<FormField
									label='Qarz limit ($)'
									error={errors.debt_limit?.message}
									horizontal={false}
									className='mb-0'
								>
									<Controller
										name='debt_limit'
										control={control}
										render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
									/>
								</FormField>
								<FormField
									label='Keshbek (%)'
									error={errors.keshbek?.message}
									horizontal={false}
									className='mb-0'
								>
									<Controller
										name='keshbek'
										control={control}
										render={({ field }) => (
											<PriceInput decimals={2}
												max={100}
												value={field.value}
												onChange={(v) => field.onChange(v)}
												onBlur={field.onBlur}
											/>
										)}
									/>
								</FormField>
							</div>
						)}
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField
								label='Viloyat'
								error={errors.region?.message}
								required
								horizontal={false}
								className='mb-0'
							>
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
							<FormField
								label='Tuman'
								error={errors.district?.message}
								required
								horizontal={false}
								className='mb-0'
							>
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
						<FormField
							label='Manzil'
							error={errors.address?.message}
							horizontal={false}
							className='mb-3'
						>
							<Textarea rows={2} {...register('address')} />
						</FormField>

						{!hideStatusFlags && !isRestrictedEdit && (
							<div className='mb-3 flex flex-wrap gap-4'>
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
								<Controller
									name='is_blocked'
									control={control}
									render={({ field }) => (
										<Checkbox
											inline
											label='Bloklangan'
											checked={field.value}
											onCheckedChange={(v) => field.onChange(!!v)}
										/>
									)}
								/>
							</div>
						)}
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
