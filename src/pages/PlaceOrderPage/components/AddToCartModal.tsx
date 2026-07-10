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
	PriceInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useNotification,
} from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useCurrencyRateQuery } from '@/services/currency/currency.queries';
import { useCreateOrderCartMutation } from '@/services/order-cart/order-cart.queries';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';

export interface ProductVariant {
	brandName: string;
	categoryName: string;
	size: number;
	typeName: string | null;
	rows: WarehouseAllListItem[];
}

const DEFAULT_LOCATION_LABEL = 'Dokon';

interface AddToCartModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	variant: ProductVariant;
	clientId: number;
}

export default function AddToCartModal({ open, setOpen, variant, clientId }: AddToCartModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const { data: usdRate } = useCurrencyRateQuery('USD');
	const rate = usdRate?.rate ?? 0;

	const locationOptions = useMemo(() => {
		const seen = new Map<string, { value: string; label: string; row: WarehouseAllListItem }>();
		for (const row of variant.rows) {
			const key = String(row.type_sklad_id ?? 'null');
			if (!seen.has(key)) {
				seen.set(key, { value: key, label: row.type_sklad_name ?? DEFAULT_LOCATION_LABEL, row });
			}
		}
		return Array.from(seen.values());
	}, [variant.rows]);

	const stockByLocation = useMemo(
		() => new Map(locationOptions.map((option) => [option.value, option.row.count])),
		[locationOptions],
	);

	const addToCartSchema = useMemo(
		() =>
			z
				.object({
					joy: z.string().min(1, 'Joyni tanlang'),
					count: z
						.string()
						.min(1, 'Sonini kiriting')
						.refine((v) => Number(v) > 0, "Soni 0 dan katta bo'lishi kerak"),
					priceSom: z.string().optional(),
					priceDollar: z.string().optional(),
				})
				.superRefine((values, ctx) => {
					const available = stockByLocation.get(values.joy);
					if (available !== undefined && Number(values.count) > available) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							path: ['count'],
							message: `Omborda faqat ${formatNumber(available)} ta mavjud`,
						});
					}
					if (!values.priceDollar || Number(values.priceDollar) <= 0) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							path: ['priceDollar'],
							message: 'Narxni kiriting',
						});
					}
				}),
		[stockByLocation],
	);

	type AddToCartFormValues = z.infer<typeof addToCartSchema>;

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<AddToCartFormValues>({
		resolver: zodResolver(addToCartSchema),
		defaultValues: {
			joy: locationOptions[0]?.value ?? '',
			count: '0',
			priceSom: '',
			priceDollar: '',
		},
	});

	const joyValue = watch('joy');
	const countValue = watch('count');
	const priceDollarValue = watch('priceDollar');
	const availableStock = stockByLocation.get(joyValue);
	const lineTotal = (Number(countValue) || 0) * (Number(priceDollarValue) || 0);

	function handlePriceSomChange(value: string) {
		setValue('priceSom', value);
		setValue('priceDollar', rate > 0 && value ? (Number(value) / rate).toFixed(2) : '', {
			shouldValidate: true,
		});
	}

	function handlePriceDollarChange(value: string) {
		setValue('priceDollar', value, { shouldValidate: true });
		setValue('priceSom', rate > 0 && value ? (Number(value) * rate).toFixed(0) : '');
	}

	const createMutation = useCreateOrderCartMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const location = locationOptions.find((option) => option.value === values.joy);
		if (!location) {
			setFormError('Joy topilmadi');
			return;
		}

		try {
			await createMutation.mutateAsync({
				client: clientId,
				warehouse: location.row.id,
				count: Number(values.count),
				price: Number(values.priceDollar).toFixed(2),
			});
			notify({ title: "Mahsulot buyurtmaga qo'shildi" });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, "Qo'shishda xatolik yuz berdi"));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-[500px]'>
				<ModalHeader>
					<ModalTitle>Mijoz buyurtmasiga qo'shish</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}

						<div className='mb-4 flex flex-col gap-2 rounded-[3px] bg-ca-silver p-3 text-xs'>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Dollar kursi:</span>
								<span className='font-bold text-ca-heading'>{formatNumber(rate)}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Model:</span>
								<span className='truncate font-bold text-ca-red'>{variant.brandName}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Nomi:</span>
								<span className='truncate font-bold text-ca-red'>{variant.categoryName}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>O'lchami:</span>
								<span className='font-bold text-ca-red'>{formatNumber(variant.size)}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-ca-heading'>Tip:</span>
								<span className='font-bold text-ca-red'>{variant.typeName ?? '-'}</span>
							</div>
						</div>

						<FormField label='Joy' error={errors.joy?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='joy'
								control={control}
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue placeholder='Tanlang...' />
										</SelectTrigger>
										<SelectContent>
											{locationOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
													<span className='ml-2 text-ca-text'>
														({formatNumber(option.row.count)} ta)
													</span>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							{availableStock !== undefined && (
								<p className='mt-1 text-[11px] text-ca-text'>
									Omborda mavjud:{' '}
									<span className='font-semibold text-ca-heading'>
										{formatNumber(availableStock)} ta
									</span>
								</p>
							)}
						</FormField>

						<FormField label='Soni' error={errors.count?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='count'
								control={control}
								render={({ field }) => (
									<InputGroup append={variant.typeName ?? undefined}>
										<Input
											type='number'
											inputMode='numeric'
											min={0}
											max={availableStock}
											step='1'
											value={field.value}
											onChange={(e) => field.onChange(e.target.value)}
											onBlur={field.onBlur}
										/>
									</InputGroup>
								)}
							/>
						</FormField>

						<FormField label="Narxi so'm" horizontal={false} className='mb-3'>
							<Controller
								name='priceSom'
								control={control}
								render={({ field }) => (
									<PriceInput value={field.value} onChange={handlePriceSomChange} onBlur={field.onBlur} />
								)}
							/>
						</FormField>

						<FormField
							label='Narxi ($)'
							error={errors.priceDollar?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Controller
								name='priceDollar'
								control={control}
								render={({ field }) => (
									<InputGroup prepend='$'>
										<PriceInput
											value={field.value}
											onChange={handlePriceDollarChange}
											onBlur={field.onBlur}
										/>
									</InputGroup>
								)}
							/>
						</FormField>

						{lineTotal > 0 && (
							<div className='flex items-center justify-between rounded-[3px] border border-ca-border bg-[#f8fafc] px-3 py-2 text-xs'>
								<span className='text-ca-text'>Umumiy narxi</span>
								<span className='text-sm font-bold text-ca-green'>{formatNumber(lineTotal, 2)} $</span>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='danger' disabled={createMutation.isPending}>
							<FaCartPlus className='mr-1.5' /> Buyurtmaga qo'shish
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
