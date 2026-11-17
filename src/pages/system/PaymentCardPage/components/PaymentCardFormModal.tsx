import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
	Button,
	Checkbox,
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
import { getApiErrorMessage } from '@/lib/errors';
import {
	useCreatePaymentCardMutation,
	useUpdatePaymentCardMutation,
} from '@/services/payment-card/payment-card.queries';
import {
	PAYMENT_CARD_TYPE_OPTIONS,
	type PaymentCard,
	type PaymentCardPayload,
	type PaymentCardType,
} from '@/services/payment-card/payment-card.types';
import { PaymentCardVisual, type CardLike } from '@/pages/system/PaymentCardPage/components/CardIdentity';

const paymentCardFormSchema = z.object({
	name: z.string().trim().min(1, 'Nomi kiritilishi shart'),
	cardType: z.string().min(1, 'Turini tanlang'),
	lastFour: z.string().regex(/^\d{4}$/, 'Karta raqamining oxirgi 4 ta raqamini kiriting'),
	owner: z.string(),
	bank: z.string(),
	note: z.string(),
	sortOrder: z.string().regex(/^\d+$/, 'Butun son kiriting'),
	isActive: z.boolean(),
});

type PaymentCardFormValues = z.infer<typeof paymentCardFormSchema>;

interface PaymentCardFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: PaymentCard;
	/** Position suggested for a new card: after the existing ones. */
	nextSortOrder?: number;
}

export default function PaymentCardFormModal({ open, setOpen, mode, item, nextSortOrder = 1 }: PaymentCardFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const editing = mode === 'edit' && item;

	const {
		register,
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<PaymentCardFormValues>({
		resolver: zodResolver(paymentCardFormSchema),
		defaultValues: {
			name: editing ? item.name : '',
			cardType: editing ? item.card_type : 'uzcard',
			lastFour: editing ? (item.last4 ?? '') : '',
			owner: editing ? (item.owner_name ?? '') : '',
			bank: editing ? (item.bank ?? '') : '',
			note: editing ? (item.note ?? '') : '',
			sortOrder: String(editing ? (item.sort_order ?? 0) : nextSortOrder),
			isActive: editing ? item.is_active : true,
		},
	});

	const [name, cardType, lastFour, owner, bank, isActive] = watch(['name', 'cardType', 'lastFour', 'owner', 'bank', 'isActive']);
	const preview: CardLike = {
		name,
		card_type: cardType as PaymentCardType,
		last4: lastFour,
		owner_name: owner,
		bank,
		is_active: isActive,
	};

	const createMutation = useCreatePaymentCardMutation();
	const updateMutation = useUpdatePaymentCardMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const payload: PaymentCardPayload = {
			name: values.name.trim(),
			card_type: values.cardType as PaymentCardType,
			last4: values.lastFour,
			owner_name: values.owner.trim(),
			bank: values.bank.trim(),
			note: values.note.trim(),
			sort_order: Number(values.sortOrder),
			is_active: values.isActive,
		};

		try {
			if (editing) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: 'Karta yangilandi' });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Karta qo'shildi" });
			}
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-lg'>
				<ModalHeader>
					<ModalTitle>{editing ? 'Kartani tahrirlash' : "Karta qo'shish"}</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						<PaymentCardVisual card={preview} className='mx-auto mb-4 max-w-[300px]' />
						{formError && (
							<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<FormField label='Nomi' error={errors.name?.message} required horizontal={false} className='mb-3'>
							<Input {...register('name')} autoComplete='off' placeholder="Masalan: Do'kon kartasi" />
						</FormField>
						<div className='grid grid-cols-1 gap-x-3 sm:grid-cols-2'>
							<FormField label='Turi' error={errors.cardType?.message} required horizontal={false} className='mb-1'>
								<Controller
									name='cardType'
									control={control}
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger>
												<SelectValue placeholder='Tanlang...' />
											</SelectTrigger>
											<SelectContent>
												{PAYMENT_CARD_TYPE_OPTIONS.map((option) => (
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
								label='Oxirgi 4 raqam'
								error={errors.lastFour?.message}
								required
								horizontal={false}
								className='mb-1'
							>
								<Controller
									name='lastFour'
									control={control}
									render={({ field }) => (
										<Input
											inputMode='numeric'
											autoComplete='off'
											maxLength={4}
											placeholder='0000'
											value={field.value}
											onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
											onBlur={field.onBlur}
										/>
									)}
								/>
							</FormField>
						</div>
						<p className='mb-3 text-xs text-ca-text'>To'liq karta raqami saqlanmaydi.</p>
						<div className='grid grid-cols-1 gap-x-3 sm:grid-cols-2'>
							<FormField label='Egasi' error={errors.owner?.message} horizontal={false} className='mb-3'>
								<Input {...register('owner')} autoComplete='off' placeholder='Masalan: Sardor A.' />
							</FormField>
							<FormField label='Bank' error={errors.bank?.message} horizontal={false} className='mb-3'>
								<Input {...register('bank')} autoComplete='off' placeholder='Masalan: Kapitalbank' />
							</FormField>
						</div>
						<FormField
							label="Tartib (ro'yxatda nechanchi)"
							error={errors.sortOrder?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Input type='number' inputMode='numeric' min={0} step={1} {...register('sortOrder')} />
						</FormField>
						<FormField label='Izoh' error={errors.note?.message} horizontal={false} className='mb-3'>
							<Textarea rows={2} {...register('note')} />
						</FormField>
						<Controller
							name='isActive'
							control={control}
							render={({ field }) => (
								<Checkbox
									id='payment-card-active'
									label='Faol'
									checked={field.value}
									onCheckedChange={(checked) => field.onChange(checked === true)}
								/>
							)}
						/>
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
