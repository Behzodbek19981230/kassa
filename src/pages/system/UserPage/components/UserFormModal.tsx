import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { FaCamera, FaUser } from 'react-icons/fa';
import { z } from 'zod';
import {
	Button,
	Checkbox,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DatePicker,
	FormField,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	MultiCombobox,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
	useNotification,
} from '@/components/ui';
import { companyService } from '@/services/company/company.service';
import { districtService } from '@/services/district/district.service';
import { useDistrictQuery } from '@/services/district/district.queries';
import { formatUzPhone, UZ_PHONE_REGEX } from '@/lib/phone';
import { regionService } from '@/services/region/region.service';
import { useRegionQuery } from '@/services/region/region.queries';
import { roleService } from '@/services/role/role.service';
import { useCreateUserMutation, useUpdateUserMutation, useUserQuery } from '@/services/user/user.queries';
import type { User, UserPayload } from '@/services/user/user.types';

const GENDER_OPTIONS = [
	{ value: 'male', label: 'Erkak' },
	{ value: 'female', label: 'Ayol' },
];

function buildUserFormSchema(mode: 'create' | 'edit') {
	return z.object({
		username: z.string().min(1, 'Login kiritilishi shart'),
		first_name: z.string().min(1, 'Ism kiritilishi shart'),
		last_name: z.string().min(1, 'Familiya kiritilishi shart'),
		second_name: z.string().optional(),
		gender: z.string().min(1, 'Jinsi tanlanishi shart'),
		date_of_birthday: z.string().min(1, "Tug'ilgan sana kiritilishi shart"),
		phone_number: z.string().regex(UZ_PHONE_REGEX, "Telefon raqami to'liq kiritilishi shart"),
		email: z.string().min(1, 'Email kiritilishi shart').email("Email noto'g'ri kiritilgan"),
		region: z.string().min(1, 'Viloyat tanlanishi shart'),
		district: z.string().min(1, 'Tuman tanlanishi shart'),
		role: z.string().min(1, 'Rol tanlanishi shart'),
		companies: z.array(z.string()).min(1, 'Kamida bitta tashkilot tanlanishi shart'),
		address: z.string().min(1, 'Manzil kiritilishi shart'),
		active: z.boolean(),
		password:
			mode === 'create'
				? z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak")
				: z.union([z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"), z.literal('')]),
	});
}

type UserFormValues = z.infer<ReturnType<typeof buildUserFormSchema>>;

function userToFormValues(user: User): UserFormValues {
	return {
		username: user.username,
		first_name: user.first_name,
		last_name: user.last_name,
		second_name: user.second_name ?? '',
		gender: user.gender ?? '',
		date_of_birthday: user.date_of_birthday ?? '',
		phone_number: user.phone_number,
		email: user.email,
		region: user.region ? String(user.region) : '',
		district: user.district ? String(user.district) : '',
		role: user.role ? String(user.role) : '',
		companies: user.companies.map(String),
		address: user.address ?? '',
		active: user.is_active,
		password: '',
	};
}

interface UserFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: User;
}

export default function UserFormModal({ open, setOpen, mode, item }: UserFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(item?.avatar ?? null);
	const avatarInputRef = useRef<HTMLInputElement>(null);

	const userQuery = useUserQuery(mode === 'edit' ? item?.id : undefined);
	const currentUser = userQuery.data ?? item;

	const regionDetailQuery = useRegionQuery(mode === 'edit' ? (currentUser?.region ?? undefined) : undefined);
	const districtDetailQuery = useDistrictQuery(mode === 'edit' ? (currentUser?.district ?? undefined) : undefined);

	const {
		register,
		control,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<UserFormValues>({
		resolver: zodResolver(buildUserFormSchema(mode)),
		defaultValues:
			mode === 'edit' && item
				? userToFormValues(item)
				: {
						username: '',
						first_name: '',
						last_name: '',
						second_name: '',
						gender: '',
						date_of_birthday: '',
						phone_number: '+998',
						email: '',
						region: '',
						district: '',
						role: '',
						companies: [],
						address: '',
						active: true,
						password: '',
					},
	});

	useEffect(() => {
		if (mode === 'edit' && userQuery.data) {
			reset(userToFormValues(userQuery.data));
			setAvatarPreview(userQuery.data.avatar ?? null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userQuery.data]);

	const regionValue = watch('region');
	const companiesValue = watch('companies');

	const createMutation = useCreateUserMutation();
	const updateMutation = useUpdateUserMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		return () => {
			if (avatarFile && avatarPreview) URL.revokeObjectURL(avatarPreview);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [avatarFile]);

	const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] ?? null;
		setAvatarFile(file);
		setAvatarPreview(file ? URL.createObjectURL(file) : (currentUser?.avatar ?? null));
	};

	const companyLabels = Object.fromEntries(
		(currentUser?.companies_detail ?? []).map((c) => [String(c.id), c.name]),
	);

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

	const loadRoleOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await roleService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((r) => ({ value: String(r.id), label: r.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadCompanyOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await companyService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const handleRegionChange = (value: string) => {
		setValue('region', value);
		setValue('district', '');
	};

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const payload: UserPayload = {
			username: values.username.trim(),
			first_name: values.first_name.trim(),
			last_name: values.last_name.trim(),
			second_name: values.second_name?.trim() ?? '',
			gender: values.gender,
			date_of_birthday: values.date_of_birthday,
			phone_number: values.phone_number.trim(),
			email: values.email.trim(),
			is_active: values.active,
			region: Number(values.region),
			district: Number(values.district),
			role: Number(values.role),
			companies: values.companies.map(Number),
			address: values.address.trim(),
		};
		if (values.password) payload.password = values.password;

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload, avatar: avatarFile });
				notify({ title: 'Foydalanuvchi yangilandi' });
			} else {
				await createMutation.mutateAsync({ payload, avatar: avatarFile });
				notify({ title: "Foydalanuvchi qo'shildi" });
			}
			setOpen(false);
		} catch {
			setFormError('Saqlashda xatolik yuz berdi');
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-4xl'>
				<ModalHeader>
					<ModalTitle>{mode === 'edit' ? 'Foydalanuvchini tahrirlash' : "Foydalanuvchi qo'shish"}</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<FormField label='Avatar' horizontal={false} className='mb-3'>
							<button
								type='button'
								onClick={() => avatarInputRef.current?.click()}
								className='group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-ca-border bg-ca-silver'
							>
								{avatarPreview ? (
									<img src={avatarPreview} alt='Avatar' className='h-full w-full rounded-full object-cover' />
								) : (
									<FaUser className='text-3xl text-ca-text' />
								)}
								<span className='absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
									<FaCamera className='text-lg text-white' />
								</span>
							</button>
							<input
								ref={avatarInputRef}
								type='file'
								accept='image/*'
								onChange={handleAvatarChange}
								className='hidden'
							/>
						</FormField>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Login' error={errors.username?.message} required horizontal={false} className='mb-0'>
								<Input {...register('username')} />
							</FormField>
							<FormField
								label='Parol'
								error={errors.password?.message}
								required={mode === 'create'}
								horizontal={false}
								className='mb-0'
							>
								<Input
									type='password'
									placeholder={mode === 'edit' ? "O'zgartirish uchun kiriting" : undefined}
									{...register('password')}
								/>
							</FormField>
						</div>
						<div className='mb-3 grid grid-cols-3 gap-3'>
							<FormField label='Ism' error={errors.first_name?.message} required horizontal={false} className='mb-0'>
								<Input {...register('first_name')} />
							</FormField>
							<FormField label='Familiya' error={errors.last_name?.message} required horizontal={false} className='mb-0'>
								<Input {...register('last_name')} />
							</FormField>
							<FormField label='Otasining ismi' error={errors.second_name?.message} horizontal={false} className='mb-0'>
								<Input {...register('second_name')} />
							</FormField>
						</div>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Jinsi' error={errors.gender?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='gender'
									control={control}
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger>
												<SelectValue placeholder='Tanlang...' />
											</SelectTrigger>
											<SelectContent>
												{GENDER_OPTIONS.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
							</FormField>
							<FormField
								label="Tug'ilgan sana"
								error={errors.date_of_birthday?.message}
								required
								horizontal={false}
								className='mb-0'
							>
								<Controller
									name='date_of_birthday'
									control={control}
									render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Telefon' error={errors.phone_number?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='phone_number'
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
							<FormField label='Email' error={errors.email?.message} required horizontal={false} className='mb-0'>
								<Input type='email' {...register('email')} />
							</FormField>
						</div>
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
											selectedLabel={currentUser?.region_detail?.name ?? regionDetailQuery.data?.name}
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
											selectedLabel={currentUser?.district_detail?.name ?? districtDetailQuery.data?.name}
											placeholder='Tanlang...'
											searchPlaceholder='Tuman qidirish...'
											disabled={!regionValue}
											clearable
										/>
									)}
								/>
							</FormField>
						</div>
						<FormField label='Rol' error={errors.role?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='role'
								control={control}
								render={({ field }) => (
									<Combobox
										value={field.value}
										onChange={field.onChange}
										loadOptions={loadRoleOptions}
										selectedLabel={currentUser?.roles?.name}
										placeholder='Tanlang...'
										searchPlaceholder='Rol qidirish...'
										clearable
									/>
								)}
							/>
						</FormField>
						<FormField label='Tashkilotlar' error={errors.companies?.message} required horizontal={false} className='mb-3'>
							<MultiCombobox
								value={companiesValue}
								onChange={(values) => setValue('companies', values, { shouldValidate: true })}
								loadOptions={loadCompanyOptions}
								selectedLabels={companyLabels}
								placeholder='Tanlang...'
								searchPlaceholder='Tashkilot qidirish...'
							/>
						</FormField>
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
