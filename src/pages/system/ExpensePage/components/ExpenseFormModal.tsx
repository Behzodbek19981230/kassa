import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
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
import { useCurrentCompany } from '@/lib/company';
import { roundMoney } from '@/lib/number';
import { useCreateExpenseMutation, useUpdateExpenseMutation } from '@/services/expense/expense.queries';
import type { Expense, ExpensePayload } from '@/services/expense/expense.types';
import { useExpenseTypeListQuery } from '@/services/expense-type/expense-type.queries';
import { expenseTypeService } from '@/services/expense-type/expense-type.service';
import { usePaymentCardQuery } from '@/services/payment-card/payment-card.queries';
import { paymentCardService } from '@/services/payment-card/payment-card.service';
import { paymentCardLabel } from '@/services/payment-card/payment-card.types';
import { getApiErrorMessage } from '@/lib/errors';

const num = (value: string | number | null | undefined) => Number(value) || 0;

const expenseFormSchema = z
	.object({
		nomi: z.string().min(1, 'Nomi kiritilishi shart'),
		type: z.string().min(1, 'Turi tanlanishi shart'),
		date_cr: z.string().min(1, 'Sana kiritilishi shart'),
		sum_som: z.string(),
		summ_dollar: z.string(),
		summ_cart: z.string(),
		payment_card: z.string(),
	})
	.superRefine((values, ctx) => {
		if (num(values.summ_cart) > 0 && !values.payment_card) {
			ctx.addIssue({ code: 'custom', path: ['payment_card'], message: 'Karta tanlanishi shart' });
		}
	});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: Expense;
}

/** Zero amounts show as an empty field. */
const amountOrEmpty = (value: string | number | null | undefined) => (num(value) ? String(value) : '');

export default function ExpenseFormModal({ open, setOpen, mode, item }: ExpenseFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const { companyId, exchangeRate } = useCurrentCompany();
	const rate = num(exchangeRate?.dollar);

	const { data: typeData } = useExpenseTypeListQuery({ limit: 100 });
	const typeNameById = new Map((typeData?.results ?? []).map((t) => [t.id, t.name]));

	const {
		control,
		register,
		handleSubmit,
		watch,
		formState: { errors, dirtyFields },
	} = useForm<ExpenseFormValues>({
		resolver: zodResolver(expenseFormSchema),
		defaultValues:
			mode === 'edit' && item
				? {
						nomi: item.nomi,
						type: String(item.type),
						date_cr: item.date_cr,
						sum_som: amountOrEmpty(item.sum_som),
						summ_dollar: amountOrEmpty(item.summ_dollar),
						summ_cart: amountOrEmpty(item.summ_cart),
						payment_card: item.payment_card ? String(item.payment_card) : '',
					}
				: {
						nomi: '',
						type: '',
						date_cr: new Date().toISOString().slice(0, 10),
						sum_som: '',
						summ_dollar: '',
						summ_cart: '',
						payment_card: '',
					},
	});

	const [sumSom, summDollar, summCart, paymentCard] = watch(['sum_som', 'summ_dollar', 'summ_cart', 'payment_card']);
	const paidByCard = num(summCart) > 0;
	const { data: selectedCard } = usePaymentCardQuery(paidByCard && paymentCard ? Number(paymentCard) : undefined);

	// An edit that leaves the amounts alone keeps the saved total rather than re-converting it at today's rate
	// (older expenses only have `summa`).
	const keepSavedTotal = mode === 'edit' && !(dirtyFields.sum_som || dirtyFields.summ_dollar || dirtyFields.summ_cart);
	const allSummDollar =
		keepSavedTotal && item
			? num(item.all_summ_dollar) || num(item.summa)
			: roundMoney((rate > 0 ? (num(sumSom) + num(summCart)) / rate : 0) + num(summDollar));

	const createMutation = useCreateExpenseMutation();
	const updateMutation = useUpdateExpenseMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const loadTypeOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await expenseTypeService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((t) => ({ value: String(t.id), label: t.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadCardOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await paymentCardService.list({ is_active: true, search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((card) => ({ value: String(card.id), label: paymentCardLabel(card) })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const company = item?.company ?? companyId ?? undefined;
		if (!company) {
			setFormError('Tashkilot topilmadi');
			return;
		}
		if (!keepSavedTotal) {
			if (!(num(values.sum_som) || num(values.summ_dollar) || num(values.summ_cart))) {
				setFormError('Summa kiritilishi shart');
				return;
			}
			if (rate <= 0 && (num(values.sum_som) || num(values.summ_cart))) {
				setFormError("Dollar kursi o'rnatilmagan, so'mdagi summani dollarga o'girib bo'lmaydi");
				return;
			}
		}

		const payload: ExpensePayload = {
			nomi: values.nomi.trim(),
			type: Number(values.type),
			date_cr: values.date_cr,
			sum_som: num(values.sum_som),
			summ_dollar: num(values.summ_dollar),
			summ_cart: num(values.summ_cart),
			payment_card: num(values.summ_cart) > 0 ? Number(values.payment_card) : null,
			all_summ_dollar: allSummDollar,
			summa: keepSavedTotal && item ? num(item.summa) : allSummDollar,
			company,
		};

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: 'Xarajat yangilandi' });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Xarajat qo'shildi" });
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
					<ModalTitle>{mode === 'edit' ? 'Xarajatni tahrirlash' : "Xarajat qo'shish"}</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						{rate > 0 && (
							<div className='mb-4 rounded border border-ca-theme/30 bg-ca-theme/5 px-4 py-2 text-center text-sm font-semibold text-ca-theme'>
								Joriy dollar kursi: {rate.toLocaleString('ru-RU')} so'm
							</div>
						)}
						<FormField label='Nomi' error={errors.nomi?.message} required horizontal={false} className='mb-3'>
							<Input {...register('nomi')} />
						</FormField>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Turi' error={errors.type?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='type'
									control={control}
									render={({ field }) => (
										<Combobox
											value={field.value}
											onChange={field.onChange}
											loadOptions={loadTypeOptions}
											selectedLabel={typeNameById.get(Number(field.value))}
											placeholder='Tanlang...'
											searchPlaceholder='Tur qidirish...'
										/>
									)}
								/>
							</FormField>
							<FormField label='Sana' error={errors.date_cr?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='date_cr'
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
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} placeholder='0' />}
								/>
							</FormField>
							<FormField label='Summa dollarda ($)' horizontal={false} className='mb-0'>
								<Controller
									name='summ_dollar'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} placeholder='0' />}
								/>
							</FormField>
						</div>
						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label="Karta orqali (so'mda)" horizontal={false} className='mb-0'>
								<Controller
									name='summ_cart'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} placeholder='0' />}
								/>
							</FormField>
							{paidByCard && (
								<FormField
									label='Qaysi kartadan'
									error={errors.payment_card?.message}
									required
									horizontal={false}
									className='mb-0'
								>
									<Controller
										name='payment_card'
										control={control}
										render={({ field }) => (
											<Combobox
												value={field.value}
												onChange={field.onChange}
												loadOptions={loadCardOptions}
												selectedLabel={selectedCard ? paymentCardLabel(selectedCard) : undefined}
												placeholder='Kartani tanlang...'
												searchPlaceholder='Karta qidirish...'
											/>
										)}
									/>
								</FormField>
							)}
						</div>
						<FormField label='Umumiy summa ($)' horizontal={false} className='mb-0'>
							<PriceInput value={allSummDollar ? allSummDollar.toFixed(2) : ''} placeholder='0' disabled />
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
