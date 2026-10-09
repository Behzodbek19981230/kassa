import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaTruck } from 'react-icons/fa';
import { z } from 'zod';
import {
	Button,
	Combobox,
	DatePicker,
	FormField,
	InputGroup,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	PriceInput,
	Textarea,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useUserInfoQuery, useUserQuery } from '@/services/user/user.queries';
import { useLocalReceiptMutation } from '@/services/two-stage-import/two-stage-import.queries';
import type { ImportOrderListItem } from '@/services/two-stage-import/two-stage-import.types';
import { loadUserOptions } from '@/pages/TwoStageImport/options';
import { formatUserName, nonNegativeNumber, todayTashkent } from '@/pages/TwoStageImport/utils';

const localReceiptSchema = z.object({
	receiptDate: z.string().min(1, 'Qabul sanasini kiriting'),
	receivedBy: z.string().min(1, 'Qabul qiluvchi xodimni tanlang'),
	paidYuan: nonNegativeNumber("To'langan summani kiriting (¥)"),
	paidDollar: nonNegativeNumber("To'langan summani kiriting ($)"),
	note: z.string().optional(),
});

type LocalReceiptFormValues = z.infer<typeof localReceiptSchema>;

interface LocalReceiptModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	order: ImportOrderListItem;
	/** Opens the cancel dialog for this order from inside the step. */
	onCancelOrder?: () => void;
}

export default function LocalReceiptModal({ open, setOpen, order, onCancelOrder }: LocalReceiptModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const { data: currentUser } = useUserInfoQuery();

	const {
		control,
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<LocalReceiptFormValues>({
		resolver: zodResolver(localReceiptSchema),
		defaultValues: {
			receiptDate: todayTashkent(),
			receivedBy: currentUser ? String(currentUser.id) : '',
			paidYuan: '',
			paidDollar: '',
			note: '',
		},
	});

	const receivedByValue = watch('receivedBy');
	const { data: selectedReceiver } = useUserQuery(receivedByValue ? Number(receivedByValue) : undefined);

	const receiptMutation = useLocalReceiptMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		try {
			await receiptMutation.mutateAsync({
				orderId: order.id,
				payload: {
					receipt_date: values.receiptDate,
					received_by: Number(values.receivedBy),
					paid_yuan: Number(values.paidYuan).toFixed(2),
					paid_dollar: Number(values.paidDollar).toFixed(2),
					note: values.note?.trim() || undefined,
				},
			});
			notify({ title: 'Ichki skladga qabul qilindi', text: order.order_number });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Qabul qilishda xatolik yuz berdi'));
		}
	});

	const destinationLabel = order.destination_type_sklad_detail?.name ?? order.destination_logistics_warehouse_detail?.name ?? '-';

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-2xl'>
				<ModalHeader>
					<ModalTitle>O'z skladiga qabul qilish</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}

						<div className='mb-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-[3px] bg-ca-silver p-3 text-xs sm:grid-cols-5'>
							<div>
								<div className='text-ca-text'>Buyurtma raqami</div>
								<div className='font-bold text-ca-red'>{order.order_number}</div>
							</div>
							<div className='sm:col-span-2'>
								<div className='text-ca-text'>Yo'nalish</div>
								<div className='font-bold text-ca-red'>
									{order.source_logistics_warehouse_detail?.name ?? '-'} → {destinationLabel}
								</div>
							</div>
							<div>
								<div className='text-ca-text'>Soni</div>
								<div className='font-bold text-ca-red'>{formatNumber(order.total_quantity ?? 0)} dona</div>
							</div>
							<div>
								<div className='text-ca-text'>Umumiy narxi ($)</div>
								<div className='font-bold text-ca-red'>{formatNumber(order.total_dollar ?? 0, 2)} $</div>
							</div>
							<div className='col-span-2 sm:col-span-5'>
								<div className='text-ca-text'>Fura raqami</div>
								<div className='font-bold text-ca-red'>{order.truck_number ?? '-'}</div>
							</div>
						</div>

						<div className='mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
							<FormField label='Qabul sanasi' error={errors.receiptDate?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='receiptDate'
									control={control}
									render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label='Qabul qiluvchi xodim' error={errors.receivedBy?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='receivedBy'
									control={control}
									render={({ field }) => (
										<Combobox
											value={field.value}
											onChange={(v) => field.onChange(v)}
											loadOptions={loadUserOptions}
											selectedLabel={
												selectedReceiver ? formatUserName(selectedReceiver) : undefined
											}
											placeholder='Xodimni tanlang'
										/>
									)}
								/>
							</FormField>
						</div>

						<div className='mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
							<FormField label="To'langan summa (¥)" error={errors.paidYuan?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='paidYuan'
									control={control}
									render={({ field }) => (
										<InputGroup prepend='¥'>
											<PriceInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
										</InputGroup>
									)}
								/>
							</FormField>
							<FormField label="To'langan summa ($)" error={errors.paidDollar?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='paidDollar'
									control={control}
									render={({ field }) => (
										<InputGroup prepend='$'>
											<PriceInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
										</InputGroup>
									)}
								/>
							</FormField>
						</div>

						<FormField label='Izoh' horizontal={false} className='mb-3'>
							<Textarea rows={2} {...register('note')} />
						</FormField>

						<div className='rounded-[3px] border border-ca-theme/30 bg-ca-theme/5 px-3 py-2 text-xs text-ca-heading'>
							Tasdiqlanganda tranzit qoldiq kamayadi, mahsulotlar Warehousega qo'shiladi va dollar narxi
							yangilanadi.
						</div>
					</ModalBody>
					<ModalFooter>
						{onCancelOrder && (
							<Button type='button' variant='white' className='mr-auto text-ca-red' onClick={onCancelOrder}>
								Buyurtmani bekor qilish
							</Button>
						)}
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='danger' loading={receiptMutation.isPending}>
							<FaTruck className='mr-1.5' /> Skladga qabul qilish
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
