import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaTruck } from 'react-icons/fa';
import { z } from 'zod';
import {
	Button,
	Combobox,
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
import { Input } from '@/components/ui/Input';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useCurrencyRateQuery } from '@/services/currency/currency.queries';
import { useChinaDispatchMutation } from '@/services/two-stage-import/two-stage-import.queries';
import type { ImportCart, ImportCartSummary } from '@/services/two-stage-import/two-stage-import.types';
import { useLogisticsCompanyQuery } from '@/services/logistics-company/logistics-company.queries';
import { useLogisticsWarehouseQuery } from '@/services/logistics-warehouse/logistics-warehouse.queries';
import {
	createLogisticsWarehouseLoader,
	loadLogisticsCompanyOptions,
	logisticsWarehouseLabel,
} from '@/pages/TwoStageImport/options';
import { nonNegativeNumber, positiveNumber } from '@/pages/TwoStageImport/utils';

const loadDestinationOptions = createLogisticsWarehouseLoader();

const chinaDispatchSchema = z.object({
	weightKg: positiveNumber("Og'irlikni kiriting"),
	carrierLogistics: z.string().min(1, 'Logistika 1 ni tanlang'),
	servicePriceYuan: nonNegativeNumber('Xizmat narxini kiriting (¥)'),
	truckNumber: z.string().trim().min(1, 'Fura raqamini kiriting'),
	volumeM3: positiveNumber('Hajmni kiriting'),
	servicePriceDollar: nonNegativeNumber('Xizmat narxini kiriting ($)'),
	destinationWarehouse: z.string().min(1, 'Logistika 2 skladini tanlang'),
	note: z.string().optional(),
});

type ChinaDispatchFormValues = z.infer<typeof chinaDispatchSchema>;

interface ChinaDispatchConfirmModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	cart: ImportCart;
	summary: ImportCartSummary;
}

export default function ChinaDispatchConfirmModal({ open, setOpen, cart, summary }: ChinaDispatchConfirmModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const { data: usdRate } = useCurrencyRateQuery('USD');
	const rate = usdRate?.rate ?? 0;

	const {
		control,
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<ChinaDispatchFormValues>({
		resolver: zodResolver(chinaDispatchSchema),
		defaultValues: {
			weightKg: '',
			carrierLogistics: '',
			servicePriceYuan: '',
			truckNumber: '',
			volumeM3: '',
			servicePriceDollar: '',
			destinationWarehouse: '',
			note: '',
		},
	});

	const carrierId = watch('carrierLogistics');
	const destinationId = watch('destinationWarehouse');
	const { data: selectedCarrier } = useLogisticsCompanyQuery(carrierId ? Number(carrierId) : undefined);
	const { data: selectedDestination } = useLogisticsWarehouseQuery(destinationId ? Number(destinationId) : undefined);

	const dispatchMutation = useChinaDispatchMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		if (!rate) {
			setFormError("Dollar kursi yuklanmoqda, birozdan so'ng qayta urinib ko'ring.");
			return;
		}

		try {
			const result = await dispatchMutation.mutateAsync({
				cart: cart.id,
				exchange_rate: rate.toFixed(2),
				carrier_logistics: Number(values.carrierLogistics),
				destination_logistics_warehouse: Number(values.destinationWarehouse),
				truck_number: values.truckNumber.trim(),
				weight_kg: Number(values.weightKg).toFixed(3),
				volume_m3: Number(values.volumeM3).toFixed(4),
				service_price_yuan: Number(values.servicePriceYuan).toFixed(2),
				service_price_dollar: Number(values.servicePriceDollar).toFixed(2),
				note: values.note?.trim() || undefined,
			});
			notify({ title: 'Import buyurtma yaratildi', text: result.order.order_number });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Tasdiqlashda xatolik yuz berdi'));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-2xl'>
				<ModalHeader>
					<ModalTitle>Xitoydan tranzit skladga jo'natishni tasdiqlash</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}

						<div className='mb-4 grid grid-cols-3 gap-2 rounded-[3px] bg-ca-silver p-3 text-center text-xs'>
							<div>
								<div className='text-ca-text'>Jami soni</div>
								<div className='text-base font-bold text-ca-red'>{formatNumber(summary.total_quantity)}</div>
							</div>
							<div>
								<div className='text-ca-text'>Jami yuan</div>
								<div className='text-base font-bold text-ca-red'>
									{formatNumber(summary.total_yuan, 0)} ¥
								</div>
							</div>
							<div>
								<div className='text-ca-text'>Jami dollar</div>
								<div className='text-base font-bold text-ca-red'>
									{formatNumber(summary.total_dollar, 2)} $
								</div>
							</div>
						</div>

						<div className='grid grid-cols-2 gap-x-3'>
							<div>
								<FormField label="Og'irlik (kg)" error={errors.weightKg?.message} required horizontal={false} className='mb-3'>
									<Input type='number' inputMode='decimal' min={0} step='0.001' {...register('weightKg')} />
								</FormField>
								<FormField label='Logistika 1' error={errors.carrierLogistics?.message} required horizontal={false} className='mb-3'>
									<Controller
										name='carrierLogistics'
										control={control}
										render={({ field }) => (
											<Combobox
												value={field.value}
												onChange={(v) => field.onChange(v)}
												loadOptions={loadLogisticsCompanyOptions}
												selectedLabel={selectedCarrier?.name}
												placeholder='Logistika firmasini tanlang'
											/>
										)}
									/>
								</FormField>
								<FormField label='Xizmat narxi (¥)' error={errors.servicePriceYuan?.message} required horizontal={false} className='mb-3'>
									<Controller
										name='servicePriceYuan'
										control={control}
										render={({ field }) => (
											<InputGroup prepend='¥'>
												<PriceInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
											</InputGroup>
										)}
									/>
								</FormField>
								<FormField label='Fura raqami' error={errors.truckNumber?.message} required horizontal={false} className='mb-3'>
									<Input {...register('truckNumber')} placeholder='01 A 123 AA' />
								</FormField>
							</div>

							<div>
								<FormField label='Hajm (m³)' error={errors.volumeM3?.message} required horizontal={false} className='mb-3'>
									<Input type='number' inputMode='decimal' min={0} step='0.0001' {...register('volumeM3')} />
								</FormField>
								<FormField label='Xizmat narxi ($)' error={errors.servicePriceDollar?.message} required horizontal={false} className='mb-3'>
									<Controller
										name='servicePriceDollar'
										control={control}
										render={({ field }) => (
											<InputGroup prepend='$'>
												<PriceInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
											</InputGroup>
										)}
									/>
								</FormField>
								<FormField label='Logistika 2 skladi' error={errors.destinationWarehouse?.message} required horizontal={false} className='mb-3'>
									<Controller
										name='destinationWarehouse'
										control={control}
										render={({ field }) => (
											<Combobox
												value={field.value}
												onChange={(v) => field.onChange(v)}
												loadOptions={loadDestinationOptions}
												selectedLabel={selectedDestination ? logisticsWarehouseLabel(selectedDestination) : undefined}
												placeholder='Logistika skladini tanlang'
											/>
										)}
									/>
								</FormField>
							</div>
						</div>

						<FormField label='Izoh' horizontal={false} className='mb-0'>
							<Textarea rows={2} {...register('note')} />
						</FormField>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='danger' loading={dispatchMutation.isPending}>
							<FaTruck className='mr-1.5' /> Import buyurtmani tasdiqlash
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
