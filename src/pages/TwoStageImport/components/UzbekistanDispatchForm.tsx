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
import { useLogisticsCompanyQuery } from '@/services/logistics-company/logistics-company.queries';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import { useUzbekistanDispatchMutation } from '@/services/two-stage-import/two-stage-import.queries';
import { loadLogisticsCompanyOptions } from '@/pages/TwoStageImport/options';
import { nonNegativeNumber, positiveNumber } from '@/pages/TwoStageImport/utils';

const uzbekistanDispatchSchema = z.object({
	weightKg: positiveNumber("Og'irlikni kiriting"),
	volumeM3: positiveNumber('Hajmni kiriting'),
	carrierLogistics: z.string().min(1, 'Tashuvchi logistikani tanlang'),
	servicePriceYuan: nonNegativeNumber('Xizmat narxini kiriting (¥)'),
	servicePriceDollar: nonNegativeNumber('Xizmat narxini kiriting ($)'),
	destinationSkladType: z.string().min(1, 'Qabul qiluvchi skladni tanlang'),
	truckNumber: z.string().trim().min(1, 'Fura raqamini kiriting'),
	driverPhone: z.string().trim().min(1, 'Haydovchi telefonini kiriting'),
});

type UzbekistanDispatchFormValues = z.infer<typeof uzbekistanDispatchSchema>;

interface UzbekistanDispatchFormProps {
	cartId?: number;
	disabled?: boolean;
}

export default function UzbekistanDispatchForm({ cartId, disabled }: UzbekistanDispatchFormProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const {
		control,
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<UzbekistanDispatchFormValues>({
		resolver: zodResolver(uzbekistanDispatchSchema),
		defaultValues: {
			weightKg: '',
			volumeM3: '',
			carrierLogistics: '',
			servicePriceYuan: '',
			servicePriceDollar: '',
			destinationSkladType: '',
			truckNumber: '',
			driverPhone: '',
		},
	});

	const carrierId = watch('carrierLogistics');
	const { data: selectedCarrier } = useLogisticsCompanyQuery(carrierId ? Number(carrierId) : undefined);
	const { data: skladTypes } = useSkladTypeListQuery({ limit: 200 });

	const dispatchMutation = useUzbekistanDispatchMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		if (!cartId) {
			setFormError("Savat bo'sh. Avval mahsulot qo'shing.");
			return;
		}

		try {
			const result = await dispatchMutation.mutateAsync({
				cart: cartId,
				carrier_logistics: Number(values.carrierLogistics),
				destination_type_sklad: Number(values.destinationSkladType),
				truck_number: values.truckNumber.trim(),
				driver_phone: values.driverPhone.trim(),
				weight_kg: Number(values.weightKg).toFixed(3),
				volume_m3: Number(values.volumeM3).toFixed(4),
				service_price_yuan: Number(values.servicePriceYuan).toFixed(2),
				service_price_dollar: Number(values.servicePriceDollar).toFixed(2),
			});
			notify({ title: "O'zbekistonga jo'natildi", text: result.order_number });
			reset();
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Tasdiqlashda xatolik yuz berdi'));
		}
	});

	return (
		<form onSubmit={onSubmit} noValidate>
			{formError && (
				<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
					{formError}
				</div>
			)}

			<div className='grid grid-cols-2 gap-x-4'>
				<FormField label="Og'irlik (kg)" error={errors.weightKg?.message} required horizontal={false} className='mb-3'>
					<Input type='number' inputMode='decimal' min={0} step='0.001' {...register('weightKg')} />
				</FormField>
				<FormField label='Hajm (m³)' error={errors.volumeM3?.message} required horizontal={false} className='mb-3'>
					<Input type='number' inputMode='decimal' min={0} step='0.0001' {...register('volumeM3')} />
				</FormField>

				<div className='col-span-2'>
					<FormField
						label='Tashuvchi logistika'
						error={errors.carrierLogistics?.message}
						required
						horizontal={false}
						className='mb-3'
					>
						<Controller
							name='carrierLogistics'
							control={control}
							render={({ field }) => (
								<Combobox
									value={field.value}
									onChange={(v) => field.onChange(v)}
									loadOptions={loadLogisticsCompanyOptions}
									selectedLabel={selectedCarrier?.name}
									placeholder='Tashuvchini tanlang'
								/>
							)}
						/>
					</FormField>
				</div>

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

				<FormField
					label='Qabul qiluvchi sklad'
					error={errors.destinationSkladType?.message}
					required
					horizontal={false}
					className='mb-3'
				>
					<Controller
						name='destinationSkladType'
						control={control}
						render={({ field }) => (
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger>
									<SelectValue placeholder='Tanlang...' />
								</SelectTrigger>
								<SelectContent>
									{(skladTypes?.results ?? []).map((type) => (
										<SelectItem key={type.id} value={String(type.id)}>
											{type.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
				</FormField>
				<FormField label='Fura raqami' error={errors.truckNumber?.message} required horizontal={false} className='mb-3'>
					<Input {...register('truckNumber')} placeholder='01 A 456 BC' />
				</FormField>

				<div />
				<FormField label='Haydovchi telefoni' error={errors.driverPhone?.message} required horizontal={false} className='mb-3'>
					<Input {...register('driverPhone')} placeholder='+998901234567' />
				</FormField>
			</div>

			<Button
				type='submit'
				variant='danger'
				size='lg'
				className='w-full'
				disabled={disabled || !cartId}
				loading={dispatchMutation.isPending}
			>
				<FaTruck className='mr-1.5' /> Buyurtmani tasdiqlash
			</Button>
		</form>
	);
}
