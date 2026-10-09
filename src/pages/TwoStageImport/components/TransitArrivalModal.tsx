import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaTruck } from 'react-icons/fa';
import { z } from 'zod';
import {
	Button,
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
import { useTransitArrivalMutation } from '@/services/two-stage-import/two-stage-import.queries';
import type { ImportOrderListItem } from '@/services/two-stage-import/two-stage-import.types';
import { ORDER_STATUS_LABELS, nonNegativeNumber, todayTashkent } from '@/pages/TwoStageImport/utils';

const transitArrivalSchema = z.object({
	arrivalDate: z.string().min(1, 'Yetib kelgan sanani kiriting'),
	paidYuan: nonNegativeNumber("To'langan summani kiriting (¥)"),
	paidDollar: nonNegativeNumber("To'langan summani kiriting ($)"),
	note: z.string().optional(),
});

type TransitArrivalFormValues = z.infer<typeof transitArrivalSchema>;

interface TransitArrivalModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	order: ImportOrderListItem;
	/** Opens the cancel dialog for this order from inside the step. */
	onCancelOrder?: () => void;
}

export default function TransitArrivalModal({ open, setOpen, order, onCancelOrder }: TransitArrivalModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TransitArrivalFormValues>({
		resolver: zodResolver(transitArrivalSchema),
		defaultValues: {
			arrivalDate: todayTashkent(),
			paidYuan: '',
			paidDollar: '',
			note: '',
		},
	});

	const arrivalMutation = useTransitArrivalMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		try {
			await arrivalMutation.mutateAsync({
				orderId: order.id,
				payload: {
					arrival_date: values.arrivalDate,
					paid_yuan: Number(values.paidYuan).toFixed(2),
					paid_dollar: Number(values.paidDollar).toFixed(2),
					note: values.note?.trim() || undefined,
				},
			});
			notify({ title: 'Tranzit skladga qabul qilindi', text: order.order_number });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Qabul qilishda xatolik yuz berdi'));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-2xl'>
				<ModalHeader>
					<ModalTitle>Tranzit logistika skladiga qabul qilish</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}

						<div className='mb-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-[3px] bg-ca-silver p-3 text-xs sm:grid-cols-4'>
							<div>
								<div className='text-ca-text'>Import raqami</div>
								<div className='font-bold text-ca-red'>{order.two_stage_import_detail?.import_number ?? order.order_number}</div>
							</div>
							<div>
								<div className='text-ca-text'>Yuk jo'natuvchi</div>
								<div className='font-bold text-ca-red'>{order.consignor_detail?.name ?? '-'}</div>
							</div>
							<div>
								<div className='text-ca-text'>Soni</div>
								<div className='font-bold text-ca-red'>{formatNumber(order.total_quantity ?? 0)} dona</div>
							</div>
							<div>
								<div className='text-ca-text'>Jami narx ($)</div>
								<div className='font-bold text-ca-red'>{formatNumber(order.total_dollar ?? 0, 2)} $</div>
							</div>
							<div className='sm:col-span-2'>
								<div className='text-ca-text'>Yo'nalish</div>
								<div className='font-bold text-ca-red'>
									{order.source_logistics_warehouse_detail?.name ?? '-'} → {order.destination_logistics_warehouse_detail?.name ?? '-'}
								</div>
							</div>
							<div>
								<div className='text-ca-text'>Holati</div>
								<div className='font-bold text-ca-heading'>{ORDER_STATUS_LABELS[order.status]}</div>
							</div>
							<div>
								<div className='text-ca-text'>Tranzit sklad (manzil)</div>
								<div className='font-bold text-ca-red'>{order.destination_logistics_warehouse_detail?.name ?? '-'}</div>
							</div>
						</div>

						<div className='mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
							<FormField label='Yetib kelgan sana' error={errors.arrivalDate?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='arrivalDate'
									control={control}
									render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
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
							Tasdiqlanganda mahsulotlar {order.destination_logistics_warehouse_detail?.name ?? 'tranzit'} skladga qo'shiladi va narx
							tarixi saqlanadi.
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
						<Button type='submit' variant='danger' loading={arrivalMutation.isPending}>
							<FaTruck className='mr-1.5' /> Yetib kelganini tasdiqlash
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
