import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaUndo } from 'react-icons/fa';
import { z } from 'zod';
import {
	Button,
	Checkbox,
	FormField,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	PriceInput,
	Textarea,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useVozvratConfirmMutation } from '@/services/vozvrat/vozvrat.queries';
import type { VozvratCartItemInput } from '@/services/vozvrat/vozvrat.types';

const confirmVozvratFormSchema = z.object({
	sum_dollar: z.string().optional(),
	sum_som: z.string().optional(),
	sum_cart: z.string().optional(),
	comment: z.string().optional(),
	confirmation: z.boolean(),
});

type ConfirmVozvratFormValues = z.infer<typeof confirmVozvratFormSchema>;

interface ConfirmVozvratModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	companyId: number;
	clientId: number;
	date: string;
	items: VozvratCartItemInput[];
	totalProductSum: number;
	exchangeRate: number;
	oldDebt: number;
	onConfirmed: (message: string) => void;
}

export default function ConfirmVozvratModal({
	open,
	setOpen,
	companyId,
	clientId,
	date,
	items,
	totalProductSum,
	exchangeRate,
	oldDebt,
	onConfirmed,
}: ConfirmVozvratModalProps) {
	const [formError, setFormError] = useState('');

	const { control, register, handleSubmit, watch } = useForm<ConfirmVozvratFormValues>({
		resolver: zodResolver(confirmVozvratFormSchema),
		defaultValues: {
			sum_dollar: totalProductSum.toFixed(2),
			sum_som: '0',
			sum_cart: '0',
			comment: '',
			confirmation: true,
		},
	});

	const sumDollar = watch('sum_dollar');
	const sumSom = watch('sum_som');
	const sumCart = watch('sum_cart');

	const allSummDollar =
		(Number(sumDollar) || 0) +
		(exchangeRate > 0 ? (Number(sumSom) || 0) / exchangeRate : 0) +
		(Number(sumCart) || 0);
	const newDebt = oldDebt - (totalProductSum - allSummDollar);

	const confirmMutation = useVozvratConfirmMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		try {
			const result = await confirmMutation.mutateAsync({
				company: companyId,
				client: clientId,
				date,
				all_summ_dollar: allSummDollar,
				sum_dollar: Number(values.sum_dollar) || 0,
				sum_som: Number(values.sum_som) || 0,
				sum_cart: Number(values.sum_cart) || 0,
				comment: values.comment?.trim(),
				confirmation: values.confirmation,
				items,
			});
			onConfirmed(result.message);
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Vozvratni saqlashda xatolik yuz berdi'));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-xl'>
				<ModalHeader>
					<ModalTitle>Vozvratni tasdiqlash</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}

						<div className='mb-4 grid grid-cols-3 gap-2 rounded-[3px] bg-ca-silver p-3 text-center text-xs'>
							<div>
								<div className='text-ca-text'>Mahsulot summasi ($)</div>
								<div className='font-bold text-ca-red'>{formatNumber(totalProductSum, 2)}</div>
							</div>
							<div>
								<div className='text-ca-text'>Eski qarz ($)</div>
								<div className='font-bold text-ca-heading'>{formatNumber(oldDebt, 2)}</div>
							</div>
							<div>
								<div className='text-ca-text'>Yangi qarz ($)</div>
								<div className={newDebt > 0 ? 'font-bold text-ca-red' : 'font-bold text-ca-green'}>
									{formatNumber(newDebt, 2)}
								</div>
							</div>
						</div>

						<div className='mb-3 grid grid-cols-3 gap-3'>
							<FormField label='Summa dollarda ($)' horizontal={false} className='mb-0'>
								<Controller
									name='sum_dollar'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label="Summa so'mda" horizontal={false} className='mb-0'>
								<Controller
									name='sum_som'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
							<FormField label='Summa kartada' horizontal={false} className='mb-0'>
								<Controller
									name='sum_cart'
									control={control}
									render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
								/>
							</FormField>
						</div>

						<FormField label='Izoh' horizontal={false} className='mb-4'>
							<Textarea rows={2} {...register('comment')} />
						</FormField>

						<Controller
							name='confirmation'
							control={control}
							render={({ field }) => (
								<Checkbox label='Tasdiqlash:' checked={field.value} onCheckedChange={field.onChange} inline />
							)}
						/>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='danger' disabled={confirmMutation.isPending}>
							<FaUndo className='mr-1.5' /> Vozvrat qilish
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
