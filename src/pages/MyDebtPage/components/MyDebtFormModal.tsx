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
import { getApiErrorMessage } from '@/lib/errors';
import { consignorService } from '@/services/consignor/consignor.service';
import { useCreateMyDebtMutation } from '@/services/my-debt/my-debt.queries';
import type { MyDebtPayload } from '@/services/my-debt/my-debt.types';

const myDebtFormSchema = z.object({
	consignor: z.string().min(1, "Yuk jo'natuvchi tanlanishi shart"),
	total_debt: z.string().min(1, 'Qarz miqdori kiritilishi shart'),
	cr_date: z.string().min(1, 'Sana kiritilishi shart'),
});

type MyDebtFormValues = z.infer<typeof myDebtFormSchema>;

interface MyDebtFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
}

export default function MyDebtFormModal({ open, setOpen }: MyDebtFormModalProps) {
	const { notify } = useNotification();
	const { companyId } = useCurrentCompany();
	const [formError, setFormError] = useState('');

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<MyDebtFormValues>({
		resolver: zodResolver(myDebtFormSchema),
		defaultValues: { consignor: '', total_debt: '', cr_date: new Date().toISOString().slice(0, 10) },
	});

	const createMutation = useCreateMyDebtMutation();

	const loadConsignorOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await consignorService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	function handleOpenChange(next: boolean) {
		if (!next) {
			reset({ consignor: '', total_debt: '', cr_date: new Date().toISOString().slice(0, 10) });
			setFormError('');
		}
		setOpen(next);
	}

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		if (!companyId) {
			setFormError('Tashkilot topilmadi');
			return;
		}

		const payload: MyDebtPayload = {
			company: companyId,
			consignor: Number(values.consignor),
			total_debt: Number(values.total_debt) || 0,
			cr_date: values.cr_date,
		};

		try {
			await createMutation.mutateAsync(payload);
			notify({ title: "Qarz qo'shildi" });
			handleOpenChange(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
		}
	});

	return (
		<Modal open={open} onOpenChange={handleOpenChange}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Qo'shish</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<FormField
							label="Yuk jo'natuvchi"
							error={errors.consignor?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Controller
								name='consignor'
								control={control}
								render={({ field }) => (
									<Combobox
										value={field.value}
										onChange={field.onChange}
										loadOptions={loadConsignorOptions}
										placeholder='Tanlang...'
										searchPlaceholder="Yuk jo'natuvchi qidirish..."
									/>
								)}
							/>
						</FormField>
						<div className='grid grid-cols-2 gap-3'>
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
								label="Oxirgi o'zgargan sana"
								error={errors.cr_date?.message}
								required
								horizontal={false}
								className='mb-0'
							>
								<Controller
									name='cr_date'
									control={control}
									render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='default' onClick={() => handleOpenChange(false)}>
							Yopish
						</Button>
						<Button type='submit' variant='theme' disabled={createMutation.isPending}>
							O'zgartirish
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
