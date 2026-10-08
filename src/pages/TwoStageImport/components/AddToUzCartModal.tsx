import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaCartPlus } from 'react-icons/fa';
import { z } from 'zod';
import {
	Button,
	FormField,
	InputGroup,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	useNotification,
} from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useAddCartItemMutation } from '@/services/two-stage-import/two-stage-import.queries';
import type { TransitStockItem } from '@/services/two-stage-import/two-stage-import.types';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';

interface AddToUzCartModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	stock: TransitStockItem;
	product: WarehouseAllListItem;
	/** API format, e.g. "2026-10-14T09:00:00+05:00". */
	dispatchDatetime: string;
}

interface AddToUzCartFormValues {
	quantity: string;
}

export default function AddToUzCartModal({ open, setOpen, stock, product, dispatchDatetime }: AddToUzCartModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const available = stock.available_quantity;

	// Quantity is limited to what is still free in transit, so the form checks it before the API does.
	const schema = useMemo(
		() =>
			z.object({
				quantity: z
					.string()
					.trim()
					.min(1, 'Sonini kiriting')
					.refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
						message: "Soni 0 dan katta butun son bo'lishi kerak",
					})
					.refine((v) => Number(v) <= available, {
						message: `Mavjud miqdor: ${formatNumber(available)}`,
					}),
			}),
		[available],
	);

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<AddToUzCartFormValues>({
		resolver: zodResolver(schema),
		defaultValues: { quantity: '' },
	});

	const quantity = Number(watch('quantity')) || 0;

	const addToCartMutation = useAddCartItemMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		try {
			await addToCartMutation.mutateAsync({
				stage: 'TRANSIT_TO_UZBEKISTAN',
				source_logistics_warehouse: stock.logistics_warehouse,
				dispatch_datetime: dispatchDatetime,
				import_warehouse: stock.id,
				quantity: Number(values.quantity),
			});
			notify({ title: "Mahsulot O'zbekistonga jo'natish savatiga qo'shildi" });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, "Qo'shishda xatolik yuz berdi"));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-[500px]'>
				<ModalHeader>
					<ModalTitle>O'zbekistonga jo'natish savatiga qo'shish</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}

						<div className='mb-4 flex flex-col gap-2 rounded-[3px] bg-ca-silver p-3 text-xs'>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Model:</span>
								<span className='truncate font-bold text-ca-red'>{product.brand_name}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Nomi:</span>
								<span className='truncate font-bold text-ca-red'>{product.product_category_name}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>O'lchami:</span>
								<span className='font-bold text-ca-red'>{formatNumber(product.size)}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Tip:</span>
								<span className='font-bold text-ca-red'>{product.type_name ?? '-'}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Mavjud:</span>
								<span className='font-bold text-ca-heading'>{formatNumber(available)}</span>
							</div>
						</div>

						<FormField label='Soni' error={errors.quantity?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='quantity'
								control={control}
								render={({ field }) => (
									<InputGroup append={product.type_name ?? 'Dona'}>
										<Input
											type='number'
											inputMode='numeric'
											min={0}
											max={available}
											step='1'
											value={field.value}
											onChange={(e) => field.onChange(e.target.value)}
											onBlur={field.onBlur}
										/>
									</InputGroup>
								)}
							/>
						</FormField>

						{quantity > 0 && (
							<div className='rounded-[3px] border border-ca-border bg-ca-silver-light px-3 py-2 text-xs'>
								<div className='flex items-center justify-between py-0.5'>
									<span className='text-ca-text'>Umumiy narxi (¥)</span>
									<span className='font-semibold text-ca-green'>
										{formatNumber(quantity * Number(stock.current_price_yuan), 0)} ¥
									</span>
								</div>
								<div className='flex items-center justify-between py-0.5'>
									<span className='text-ca-text'>Umumiy narxi ($)</span>
									<span className='font-semibold text-ca-green'>
										{formatNumber(quantity * Number(stock.current_price_dollar), 2)} $
									</span>
								</div>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='danger' loading={addToCartMutation.isPending}>
							<FaCartPlus className='mr-1.5' /> Savatga qo'shish
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
