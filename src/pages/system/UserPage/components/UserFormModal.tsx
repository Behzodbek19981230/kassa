import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { FaCamera, FaUser } from 'react-icons/fa';
import { z } from 'zod';
import {
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	type ComboboxOption,
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
	PriceInput,
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
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import {
	useCreateEmployeeMutation,
	useCreateUserMutation,
	useUpdateEmployeeMutation,
	useUpdateUserMutation,
	useUserQuery,
} from '@/services/user/user.queries';
import {
	getUserTypeSkladIds,
	isSystemUser,
	USER_TYPE_LABELS,
	USER_TYPE_OPTIONS,
	type EmployeePayload,
	type EmployeeType,
	type User,
	type UserPayload,
} from '@/services/user/user.types';

import { getApiErrorMessage } from '@/lib/errors';
import { ROLE } from '@/lib/permissions';
import { useCurrentCompany } from '@/lib/company';
import { formatNumber } from '@/lib/number';
import { cn } from '@/lib/utils';

const GENDER_OPTIONS = [
	{ value: 'male', label: 'Erkak' },
	{ value: 'female', label: 'Ayol' },
];
/** Pre-selected gender for new users, and the fallback for users saved without one. */
const DEFAULT_GENDER = 'male';

const MULTI_COMPANY_ROLE_KEYS: string[] = [ROLE.SUPER_ADMIN, ROLE.MANAGER];

/**
 * A system user (Tab 1) needs login, role and company; an account-only employee (Tab 2 / 3) only
 * a name and phone number, and its login, role and company fields are neither shown nor sent.
 */
function buildUserFormSchema(mode: 'create' | 'edit', isEmployee: boolean) {
	// Required for a system user, optional for an employee.
	const systemRequired = (message: string) => (isEmployee ? z.string() : z.string().min(1, message));
	const password = z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak");
	return z
		.object({
			username: systemRequired('Login kiritilishi shart'),
			first_name: z.string().trim().min(1, 'Ism kiritilishi shart'),
			last_name: z.string().trim().min(1, 'Familiya kiritilishi shart'),
			second_name: z.string().optional(),
			gender: systemRequired('Jinsi tanlanishi shart'),
			date_of_birthday: systemRequired("Tug'ilgan sana kiritilishi shart"),
			phone_number: z.string().regex(UZ_PHONE_REGEX, "Telefon raqami to'liq kiritilishi shart"),
			email: isEmployee ? z.string() : z.union([z.string().email("Email noto'g'ri kiritilgan"), z.literal('')]),
			region: systemRequired('Viloyat tanlanishi shart'),
			district: systemRequired('Tuman tanlanishi shart'),
			role: systemRequired('Rol tanlanishi shart'),
			// Empty → no type (null); 4 and 5 are never offered here.
			type: z.string(),
			companies: isEmployee
				? z.array(z.string())
				: z.array(z.string()).min(1, 'Kamida bitta tashkilot tanlanishi shart'),
			trade_company: systemRequired('Asosiy tashkilot tanlanishi shart'),
			type_sklads: z.array(z.string()),
			address: systemRequired('Manzil kiritilishi shart'),
			oylik_dollar: z.string(),
			oylik_som: z.string(),
			password: isEmployee ? z.string() : mode === 'create' ? password : z.union([password, z.literal('')]),
		})
		.refine((data) => isEmployee || data.companies.includes(data.trade_company), {
			message: "Asosiy tashkilot tanlangan tashkilotlar ichidan bo'lishi kerak",
			path: ['trade_company'],
		});
}

type UserFormValues = z.infer<ReturnType<typeof buildUserFormSchema>>;

function userToFormValues(user: User): UserFormValues {
	return {
		username: user.username,
		first_name: user.first_name,
		last_name: user.last_name,
		second_name: user.second_name ?? '',
		gender: user.gender || DEFAULT_GENDER,
		date_of_birthday: user.date_of_birthday ?? '',
		phone_number: formatUzPhone(user.phone_number ?? ''),
		email: user.email,
		region: user.region ? String(user.region) : '',
		district: user.district ? String(user.district) : '',
		role: user.role ? String(user.role) : '',
		type: user.type ? String(user.type) : '',
		companies: user.companies.map(String),
		trade_company: user.trade_company ? String(user.trade_company) : '',
		type_sklads: getUserTypeSkladIds(user).map(String),
		address: user.address ?? '',
		oylik_dollar: user.oylik_dollar != null ? String(Number(user.oylik_dollar) || 0) : '',
		oylik_som: user.oylik_som != null ? String(Number(user.oylik_som) || 0) : '',
		password: '',
	};
}

interface UserFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: User;
	/** Create only: adds an account-only employee of this type (Tab 2 / Tab 3) instead of a system user. */
	employeeType?: EmployeeType;
}

export default function UserFormModal({ open, setOpen, mode, item, employeeType }: UserFormModalProps) {
	const { notify } = useNotification();
	// Editing keeps the user's kind; Tab 1 ↔ Tab 2/3 can't be switched.
	const employeeKind: EmployeeType | null =
		mode === 'edit' && item ? (isSystemUser(item) ? null : (item.type as EmployeeType)) : (employeeType ?? null);
	const isEmployee = employeeKind != null;
	const { exchangeRate } = useCurrentCompany();
	// Today's $ → so'm rate; 0 when not set, and then the two salary fields are filled independently.
	const dollarRate = Number(exchangeRate?.dollar) || 0;
	const [formError, setFormError] = useState('');
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(item?.avatar ?? null);
	const [roleLabel, setRoleLabel] = useState(item?.roles?.name ?? '');
	const [roleKey, setRoleKey] = useState(item?.roles?.key ?? '');
	// Combobox options only carry id + label, so remember each loaded role's key by id.
	const roleKeyByIdRef = useRef<Record<string, string>>({});
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
		resolver: zodResolver(buildUserFormSchema(mode, isEmployee)),
		defaultValues:
			mode === 'edit' && item
				? userToFormValues(item)
				: {
						username: '',
						first_name: '',
						last_name: '',
						second_name: '',
						gender: DEFAULT_GENDER,
						date_of_birthday: '',
						phone_number: '+998',
						email: '',
						region: '',
						district: '',
						role: '',
						type: '',
						companies: [],
						trade_company: '',
						type_sklads: [],
						address: '',
						oylik_dollar: '',
						oylik_som: '',
						password: '',
					},
	});

	useEffect(() => {
		if (mode === 'edit' && userQuery.data) {
			reset(userToFormValues(userQuery.data));
			setAvatarPreview(userQuery.data.avatar ?? null);
			setRoleLabel(userQuery.data.roles?.name ?? '');
			setRoleKey(userQuery.data.roles?.key ?? '');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userQuery.data]);

	// Sklad types are a short list, so they're loaded once and offered as static options.
	const { data: skladTypeData } = useSkladTypeListQuery({ limit: 100 });
	const skladTypeOptions = (skladTypeData?.results ?? []).map((t) => ({ value: String(t.id), label: t.name }));
	const skladTypeLabels = Object.fromEntries(
		(currentUser?.type_sklads_detail ?? []).map((t) => [String(t.id), t.name]),
	);

	const regionValue = watch('region');
	const companiesValue = watch('companies');
	const tradeCompanyValue = watch('trade_company');
	const isMultiCompanyRole = MULTI_COMPANY_ROLE_KEYS.includes(roleKey);

	const createMutation = useCreateUserMutation();
	const updateMutation = useUpdateUserMutation();
	const createEmployeeMutation = useCreateEmployeeMutation();
	const updateEmployeeMutation = useUpdateEmployeeMutation();
	const isSaving =
		createMutation.isPending ||
		updateMutation.isPending ||
		createEmployeeMutation.isPending ||
		updateEmployeeMutation.isPending;

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

	const companyLabels = Object.fromEntries((currentUser?.companies_detail ?? []).map((c) => [String(c.id), c.name]));
	const [companyLabelCache, setCompanyLabelCache] = useState<Record<string, string>>({});

	useEffect(() => {
		if (currentUser?.companies_detail?.length) {
			setCompanyLabelCache((prev) => ({ ...prev, ...companyLabels }));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUser?.companies_detail]);

	useEffect(() => {
		if (tradeCompanyValue && !companiesValue.includes(tradeCompanyValue)) {
			setValue('trade_company', '', { shouldValidate: true });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [companiesValue]);

	const tradeCompanyOptions = companiesValue.map((id) => ({
		value: id,
		label: companyLabelCache[id] ?? companyLabels[id] ?? id,
	}));

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
		result.results.forEach((r) => {
			roleKeyByIdRef.current[String(r.id)] = r.key;
		});
		return {
			options: result.results.map((r) => ({ value: String(r.id), label: r.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadCompanyOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await companyService.list({ search: search || undefined, page, limit: 20 });
		const options = result.results.map((c) => ({ value: String(c.id), label: c.name }));
		setCompanyLabelCache((prev) => ({
			...prev,
			...Object.fromEntries(options.map((o) => [o.value, o.label])),
		}));
		return {
			options,
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const handleRegionChange = (value: string) => {
		setValue('region', value);
		setValue('district', '');
	};

	const handleRoleChange = (value: string, option: ComboboxOption | null) => {
		setValue('role', value, { shouldValidate: true });
		const key = option ? (roleKeyByIdRef.current[value] ?? '') : '';
		setRoleLabel(option?.label ?? '');
		setRoleKey(key);
		if (option && !MULTI_COMPANY_ROLE_KEYS.includes(key)) {
			setValue('companies', tradeCompanyValue ? [tradeCompanyValue] : [], { shouldValidate: true });
		}
	};

	const handleTradeCompanyChange = (value: string) => {
		setValue('trade_company', value, { shouldValidate: true });
		if (!isMultiCompanyRole) {
			setValue('companies', value ? [value] : [], { shouldValidate: true });
		}
	};

	const saveEmployee = async (values: UserFormValues) => {
		const payload: EmployeePayload = {
			first_name: values.first_name.trim(),
			last_name: values.last_name.trim(),
			second_name: values.second_name?.trim() ?? '',
			phone_number: values.phone_number.trim(),
			gender: values.gender,
			date_of_birthday: values.date_of_birthday,
			region: values.region ? Number(values.region) : null,
			district: values.district ? Number(values.district) : null,
			address: values.address.trim(),
		};
		if (mode === 'edit' && item) {
			await updateEmployeeMutation.mutateAsync({ id: item.id, payload, avatar: avatarFile });
			notify({ title: 'Hodim yangilandi' });
			return;
		}
		payload.type = employeeKind ?? undefined;
		payload.oylik_dollar = (Number(values.oylik_dollar) || 0).toFixed(2);
		payload.oylik_som = (Number(values.oylik_som) || 0).toFixed(2);
		await createEmployeeMutation.mutateAsync({ payload, avatar: avatarFile });
		notify({ title: "Hodim qo'shildi" });
	};

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		if (isEmployee) {
			try {
				await saveEmployee(values);
				setOpen(false);
			} catch (err) {
				setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
			}
			return;
		}
		const payload: UserPayload = {
			username: values.username.trim(),
			first_name: values.first_name.trim(),
			last_name: values.last_name.trim(),
			second_name: values.second_name?.trim() ?? '',
			gender: values.gender,
			date_of_birthday: values.date_of_birthday,
			phone_number: values.phone_number.trim(),
			email: values.email.trim(),
			region: Number(values.region),
			district: Number(values.district),
			role: Number(values.role),
			type: values.type ? Number(values.type) : null,
			companies: values.companies.map(Number),
			trade_company: Number(values.trade_company),
			type_sklads: values.type_sklads.map(Number),
			address: values.address.trim(),
		};
		if (values.password) payload.password = values.password;
		// The salary is set only for a new user; later changes go through the payroll page's rate modal
		// so they land in the salary history.
		if (mode === 'create') {
			payload.oylik_dollar = (Number(values.oylik_dollar) || 0).toFixed(2);
			payload.oylik_som = (Number(values.oylik_som) || 0).toFixed(2);
		}

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload, avatar: avatarFile });
				notify({ title: 'Foydalanuvchi yangilandi' });
			} else {
				await createMutation.mutateAsync({ payload, avatar: avatarFile });
				notify({ title: "Foydalanuvchi qo'shildi" });
			}
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-4xl'>
				<ModalHeader>
					<ModalTitle>
						{isEmployee
							? `${USER_TYPE_LABELS[employeeKind]}: ${mode === 'edit' ? 'tahrirlash' : "qo'shish"}`
							: mode === 'edit'
								? 'Foydalanuvchini tahrirlash'
								: "Foydalanuvchi qo'shish"}
					</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
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
									<img
										src={avatarPreview}
										alt='Avatar'
										className='h-full w-full rounded-full object-cover'
									/>
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
						{!isEmployee && (
							<div className='mb-3 grid grid-cols-2 gap-3'>
								<FormField
									label='Login'
									error={errors.username?.message}
									required
									horizontal={false}
									className='mb-0'
								>
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
						)}
						<div className='mb-3 grid grid-cols-3 gap-3'>
							<FormField
								label='Ism'
								error={errors.first_name?.message}
								required
								horizontal={false}
								className='mb-0'
							>
								<Input {...register('first_name')} />
							</FormField>
							<FormField
								label='Familiya'
								error={errors.last_name?.message}
								required
								horizontal={false}
								className='mb-0'
							>
								<Input {...register('last_name')} />
							</FormField>
							<FormField
								label='Otasining ismi'
								error={errors.second_name?.message}
								horizontal={false}
								className='mb-0'
							>
								<Input {...register('second_name')} />
							</FormField>
						</div>
						{/* An employee has no email: gender, birthday and phone fit one row. */}
						<div className={cn('mb-3 grid gap-3', isEmployee ? 'grid-cols-3' : 'grid-cols-2')}>
							<FormField
								label='Jinsi'
								error={errors.gender?.message}
								required={!isEmployee}
								horizontal={false}
								className='mb-0'
							>
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
								required={!isEmployee}
								horizontal={false}
								className='mb-0'
							>
								<Controller
									name='date_of_birthday'
									control={control}
									render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField
								label='Telefon'
								error={errors.phone_number?.message}
								required
								horizontal={false}
								className='mb-0'
							>
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
							{!isEmployee && (
								<FormField
									label='Email'
									error={errors.email?.message}
									horizontal={false}
									className='mb-0'
								>
									<Input type='email' {...register('email')} />
								</FormField>
							)}
						</div>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField
								label='Viloyat'
								error={errors.region?.message}
								required={!isEmployee}
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
											selectedLabel={
												field.value === String(currentUser?.region ?? '')
													? (currentUser?.region_detail?.name ?? regionDetailQuery.data?.name)
													: undefined
											}
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
								required={!isEmployee}
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
											selectedLabel={
												field.value === String(currentUser?.district ?? '')
													? (currentUser?.district_detail?.name ?? districtDetailQuery.data?.name)
													: undefined
											}
											placeholder='Tanlang...'
											searchPlaceholder='Tuman qidirish...'
											disabled={!regionValue}
											clearable
										/>
									)}
								/>
							</FormField>
						</div>
						{!isEmployee && (
							<>
								<div className='mb-3 grid grid-cols-2 gap-3'>
									<FormField
										label='Rol'
										error={errors.role?.message}
										required
										horizontal={false}
										className='mb-0'
									>
										<Controller
											name='role'
											control={control}
											render={({ field }) => (
												<Combobox
													value={field.value}
													onChange={handleRoleChange}
													loadOptions={loadRoleOptions}
													selectedLabel={roleLabel || undefined}
													placeholder='Tanlang...'
													searchPlaceholder='Rol qidirish...'
													clearable
												/>
											)}
										/>
									</FormField>
									<FormField
										label='Turi'
										error={errors.type?.message}
										horizontal={false}
										className='mb-0'
									>
										<Controller
											name='type'
											control={control}
											render={({ field }) => (
												<Combobox
													value={field.value}
													onChange={(value) => field.onChange(value)}
													options={USER_TYPE_OPTIONS}
													placeholder='Tanlanmagan'
													searchPlaceholder='Turi qidirish...'
													clearable
												/>
											)}
										/>
									</FormField>
								</div>
								{isMultiCompanyRole && (
									<FormField
										label='Tashkilotlar'
										error={errors.companies?.message}
										required
										horizontal={false}
										className='mb-3'
									>
										<MultiCombobox
											value={companiesValue}
											onChange={(values) => setValue('companies', values, { shouldValidate: true })}
											loadOptions={loadCompanyOptions}
											selectedLabels={companyLabels}
											placeholder='Tanlang...'
											searchPlaceholder='Tashkilot qidirish...'
										/>
									</FormField>
								)}
								<div className='mb-3 grid grid-cols-2 gap-3'>
									<FormField
										label='Asosiy tashkilot'
										error={errors.trade_company?.message}
										required
										horizontal={false}
										className='mb-0'
									>
										<Controller
											name='trade_company'
											control={control}
											render={({ field }) =>
												isMultiCompanyRole ? (
													<Combobox
														value={field.value}
														onChange={handleTradeCompanyChange}
														options={tradeCompanyOptions}
														placeholder={
															companiesValue.length ? 'Tanlang...' : 'Avval tashkilot tanlang'
														}
														searchPlaceholder='Tashkilot qidirish...'
														disabled={companiesValue.length === 0}
														clearable
													/>
												) : (
													<Combobox
														value={field.value}
														onChange={handleTradeCompanyChange}
														loadOptions={loadCompanyOptions}
														selectedLabel={
															(field.value === String(currentUser?.trade_company ?? '')
																? currentUser?.trade_company_detail?.name
																: undefined) ?? companyLabelCache[field.value]
														}
														placeholder='Tanlang...'
														searchPlaceholder='Tashkilot qidirish...'
														clearable
													/>
												)
											}
										/>
									</FormField>
									<FormField
										label='Sklad turi'
										error={errors.type_sklads?.message}
										horizontal={false}
										className='mb-0'
									>
										<Controller
											name='type_sklads'
											control={control}
											render={({ field }) => (
												<MultiCombobox
													value={field.value}
													onChange={field.onChange}
													options={skladTypeOptions}
													selectedLabels={skladTypeLabels}
													placeholder='Tanlang...'
													searchPlaceholder='Sklad turi qidirish...'
												/>
											)}
										/>
									</FormField>
								</div>
							</>
						)}
						{mode === 'create' && (
							<div className='mb-3 grid grid-cols-2 gap-3'>
								<FormField label='Oylik dollar' horizontal={false} className='mb-0'>
									<Controller
										name='oylik_dollar'
										control={control}
										render={({ field }) => (
											<PriceInput
												value={field.value}
												onChange={(v) => {
													field.onChange(v);
													if (dollarRate > 0) {
														setValue('oylik_som', v === '' ? '' : String(Math.round((Number(v) || 0) * dollarRate)));
													}
												}}
												placeholder='0.00'
											/>
										)}
									/>
								</FormField>
								<FormField label="Oylik so'm" horizontal={false} className='mb-0'>
									<Controller
										name='oylik_som'
										control={control}
										render={({ field }) => (
											<PriceInput
												value={field.value}
												onChange={(v) => {
													field.onChange(v);
													if (dollarRate > 0) {
														const dollar = Math.round(((Number(v) || 0) / dollarRate) * 100) / 100;
														setValue('oylik_dollar', v === '' ? '' : String(dollar));
													}
												}}
												placeholder='0'
											/>
										)}
									/>
								</FormField>
								<p className='col-span-2 -mt-1 text-[11px] text-ca-text'>
									{dollarRate > 0
										? `1 $ = ${formatNumber(dollarRate)} so'm kursi bo'yicha biri kiritilsa, ikkinchisi avtomatik hisoblanadi.`
										: "Bugungi dollar kursi kiritilmagan — summalar avtomatik hisoblanmaydi."}
								</p>
							</div>
						)}
						<FormField
							label='Manzil'
							error={errors.address?.message}
							required={!isEmployee}
							horizontal={false}
							className='mb-3'
						>
							<Textarea rows={2} {...register('address')} />
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
