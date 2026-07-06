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
import { useCreateExpenseMutation, useUpdateExpenseMutation } from '@/services/expense/expense.queries';
import type { Expense, ExpensePayload } from '@/services/expense/expense.types';
import { useExpenseTypeListQuery } from '@/services/expense-type/expense-type.queries';
import { expenseTypeService } from '@/services/expense-type/expense-type.service';
import { useUserInfoQuery } from '@/services/user/user.queries';

const expenseFormSchema = z.object({
	nomi: z.string().min(1, 'Nomi kiritilishi shart'),
	type: z.string().min(1, 'Turi tanlanishi shart'),
	summa: z.string().min(1, 'Summa kiritilishi shart'),
	date_cr: z.string().min(1, 'Sana kiritilishi shart'),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: Expense;
}

export default function ExpenseFormModal({ open, setOpen, mode, item }: ExpenseFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const { data: userInfo } = useUserInfoQuery();

	const { data: typeData } = useExpenseTypeListQuery({ limit: 100 });
	const typeNameById = new Map((typeData?.results ?? []).map((t) => [t.id, t.name]));

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ExpenseFormValues>({
		resolver: zodResolver(expenseFormSchema),
		defaultValues:
			mode === 'edit' && item
				? {
						nomi: item.nomi,
						type: String(item.type),
						summa: String(item.summa),
						date_cr: item.date_cr,
					}
				: {
						nomi: '',
						type: '',
						summa: '',
						date_cr: new Date().toISOString().slice(0, 10),
					},
	});

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

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const company = item?.company ?? userInfo?.companies?.[0];
		if (!company) {
			setFormError('Tashkilot topilmadi');
			return;
		}

		const payload: ExpensePayload = {
			nomi: values.nomi.trim(),
			type: Number(values.type),
			summa: Number(values.summa) || 0,
			date_cr: values.date_cr,
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
		} catch {
			setFormError('Saqlashda xatolik yuz berdi');
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{mode === 'edit' ? 'Xarajatni tahrirlash' : "Xarajat qo'shish"}</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<FormField
							label='Nomi'
							error={errors.nomi?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Input {...register('nomi')} />
						</FormField>
						<FormField
							label='Turi'
							error={errors.type?.message}
							required
							horizontal={false}
							className='mb-3'
						>
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
						<FormField
							label='Summa'
							error={errors.summa?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Controller
								name='summa'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField
							label='Sana'
							error={errors.date_cr?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Controller
								name='date_cr'
								control={control}
								render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
							/>
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
