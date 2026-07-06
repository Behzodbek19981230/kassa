import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
	Button,
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
	PriceInput,
	useNotification,
} from '@/components/ui';
import { clientService } from '@/services/client/client.service';
import { useClientQuery } from '@/services/client/client.queries';
import { useCurrencyRateQuery } from '@/services/currency/currency.queries';
import {
	useCreateDebtRepaymentMutation,
	useDebtRepaymentQuery,
	useUpdateDebtRepaymentMutation,
} from '@/services/debt-repayment/debt-repayment.queries';
import type { DebtRepayment, DebtRepaymentPayload } from '@/services/debt-repayment/debt-repayment.types';
import { useUserInfoQuery, useUserQuery } from '@/services/user/user.queries';
import { userService } from '@/services/user/user.service';

const debtRepaymentFormSchema = z.object({
	client: z.string().min(1, 'Mijoz tanlanishi shart'),
	is_worker: z.string().min(1, 'Xodim tanlanishi shart'),
	date: z.string().min(1, 'Sana kiritilishi shart'),
	text: z.string().optional(),
	exchange_rate: z.string().optional(),
	discount_amount: z.string().optional(),
	sum_som: z.string().optional(),
	summ_dollar: z.string().optional(),
	summ_cart: z.string().optional(),
	sum_transfers: z.string().optional(),
	zdacha_sum: z.string().optional(),
	zdacha_dollar: z.string().optional(),
	all_summ_dollar: z.string().min(1, 'Umumiy summa kiritilishi shart'),
});

type DebtRepaymentFormValues = z.infer<typeof debtRepaymentFormSchema>;

interface DebtRepaymentFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: DebtRepayment;
}

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

function toFormValues(item: DebtRepayment): DebtRepaymentFormValues {
	return {
		client: item.client ? String(item.client) : '',
		is_worker: item.is_worker ? String(item.is_worker) : '',
		date: item.date,
		text: item.text ?? '',
		exchange_rate: String(item.exchange_rate),
		discount_amount: String(item.discount_amount),
		sum_som: String(item.sum_som),
		summ_dollar: String(item.summ_dollar),
		summ_cart: String(item.summ_cart),
		sum_transfers: String(item.sum_transfers),
		zdacha_sum: String(item.zdacha_sum),
		zdacha_dollar: String(item.zdacha_dollar),
		all_summ_dollar: String(item.all_summ_dollar),
	};
}

export default function DebtRepaymentFormModal({ open, setOpen, mode, item }: DebtRepaymentFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const { data: userInfo } = useUserInfoQuery();

	const repaymentQuery = useDebtRepaymentQuery(mode === 'edit' ? item?.id : undefined);
	const currentItem = repaymentQuery.data ?? item;

	const { data: usdRate } = useCurrencyRateQuery('USD');

	const {
		control,
		register,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm<DebtRepaymentFormValues>({
		resolver: zodResolver(debtRepaymentFormSchema),
		defaultValues:
			mode === 'edit' && item
				? toFormValues(item)
				: {
						client: '',
						is_worker: '',
						date: new Date().toISOString().slice(0, 10),
						text: '',
						exchange_rate: '',
						discount_amount: '0',
						sum_som: '0',
						summ_dollar: '0',
						summ_cart: '0',
						sum_transfers: '0',
						zdacha_sum: '0',
						zdacha_dollar: '0',
						all_summ_dollar: '',
					},
	});

	useEffect(() => {
		if (mode === 'edit' && repaymentQuery.data) {
			reset(toFormValues(repaymentQuery.data));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, repaymentQuery.data]);

	const clientValue = watch('client');
	const clientDetailQuery = useClientQuery(clientValue ? Number(clientValue) : undefined);

	const workerValue = watch('is_worker');
	const workerDetailQuery = useUserQuery(workerValue ? Number(workerValue) : undefined);
	const workerLabel = workerDetailQuery.data ? userLabel(workerDetailQuery.data) : undefined;

	useEffect(() => {
		if (mode === 'create' && usdRate) {
			setValue('exchange_rate', String(usdRate.rate));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, usdRate]);

	const sumSom = watch('sum_som');
	const summDollar = watch('summ_dollar');
	const summCart = watch('summ_cart');
	const sumTransfers = watch('sum_transfers');
	const discountAmount = watch('discount_amount');
	const exchangeRate = watch('exchange_rate');

	useEffect(() => {
		const rate = Number(exchangeRate) || 0;
		const total =
			(rate > 0 ? (Number(sumSom) || 0) / rate : 0) +
			(Number(summDollar) || 0) +
			(Number(summCart) || 0) +
			(Number(sumTransfers) || 0) +
			(Number(discountAmount) || 0);
		setValue('all_summ_dollar', total.toFixed(2));
	}, [sumSom, summDollar, summCart, sumTransfers, discountAmount, exchangeRate, setValue]);

	const createMutation = useCreateDebtRepaymentMutation();
	const updateMutation = useUpdateDebtRepaymentMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const loadClientOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await clientService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.fio })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadUserOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await userService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((u) => ({ value: String(u.id), label: userLabel(u) })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const company = item?.company ?? userInfo?.companies?.[0];
		if (!company) {
			setFormError('Tashkilot topilmadi');
			return;
		}

		const totalDebt = Number(clientDetailQuery.data?.total_debt ?? item?.total_debt) || 0;
		const allSummDollar = Number(values.all_summ_dollar) || 0;

		const payload: DebtRepaymentPayload = {
			client: Number(values.client),
			is_worker: Number(values.is_worker),
			date: values.date,
			text: values.text?.trim() ?? '',
			exchange_rate: Number(values.exchange_rate) || usdRate?.rate || 0,
			discount_amount: Number(values.discount_amount) || 0,
			sum_som: Number(values.sum_som) || 0,
			summ_dollar: Number(values.summ_dollar) || 0,
			summ_cart: Number(values.summ_cart) || 0,
			sum_transfers: Number(values.sum_transfers) || 0,
			zdacha_sum: Number(values.zdacha_sum) || 0,
			zdacha_dollar: Number(values.zdacha_dollar) || 0,
			all_summ_dollar: allSummDollar,
			summa: allSummDollar,
			total_debt: totalDebt,
			total_debt_old: Number(item?.total_debt_old ?? totalDebt) || 0,
			is_delete: 0,
			company,
		};

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: "To'lov yangilandi" });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "To'lov qo'shildi" });
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
					<ModalTitle>{mode === 'edit' ? "To'lovni tahrirlash" : "To'lov qo'shish"}</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						{usdRate && (
							<div className='mb-4 rounded border border-ca-theme/30 bg-ca-theme/5 px-4 py-2 text-center text-sm font-semibold text-ca-theme'>
								Joriy dollar kursi: {usdRate.rate.toLocaleString('ru-RU')} so'm
							</div>
						)}
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField
								label='Mijoz'
								error={errors.client?.message}
								required
								horizontal={false}
								className='mb-0'
							>
								<Controller
									name='client'
									control={control}
									render={({ field }) => (
										<Combobox
											value={field.value}
											onChange={field.onChange}
											loadOptions={loadClientOptions}
											selectedLabel={currentItem?.client_detail?.fio}
											placeholder='Tanlang...'
											searchPlaceholder='Mijoz qidirish...'
										/>
									)}
								/>
							</FormField>
							<FormField
								label='Qarzni olgan xodim'
								error={errors.is_worker?.message}
								required
								horizontal={false}
								className='mb-0'
							>
								<Controller
									name='is_worker'
									control={control}
									render={({ field }) => (
										<Combobox
											value={field.value}
											onChange={field.onChange}
											loadOptions={loadUserOptions}
											selectedLabel={workerLabel}
											placeholder='Tanlang...'
											searchPlaceholder='Xodim qidirish...'
										/>
									)}
								/>
							</FormField>
						</div>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField
								label='Sana'
								error={errors.date?.message}
								required
								horizontal={false}
								className='mb-0'
							>
								<Controller
									name='date'
									control={control}
									render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label="Naqd (so'mda)" horizontal={false} className='mb-0'>
								<Controller
									name='sum_som'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label='Summa dollarda ($)' horizontal={false} className='mb-0'>
								<Controller
									name='summ_dollar'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Karta orqali ($)' horizontal={false} className='mb-0'>
								<Controller
									name='summ_cart'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label="O'tkazma orqali ($)" horizontal={false} className='mb-0'>
								<Controller
									name='sum_transfers'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label="Qaytim (so'mda)" horizontal={false} className='mb-0'>
								<Controller
									name='zdacha_sum'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label='Qaytim (dollarda)' horizontal={false} className='mb-0'>
								<Controller
									name='zdacha_dollar'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField
								label='Jami chegirma ($)'
								error={errors.discount_amount?.message}
								horizontal={false}
								className='mb-0'
							>
								<Controller
									name='discount_amount'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField
								label='Umumiy summa ($)'
								error={errors.all_summ_dollar?.message}
								required
								horizontal={false}
								className='mb-0'
							>
								<Controller
									name='all_summ_dollar'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} disabled />}
								/>
							</FormField>
						</div>
						<FormField label='Izoh' horizontal={false} className='mb-0'>
							<Input {...register('text')} />
						</FormField>
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
