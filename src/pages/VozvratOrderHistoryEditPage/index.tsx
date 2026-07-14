import { zodResolver } from '@hookform/resolvers/zod';
import { Fragment } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaArrowLeft, FaExclamationTriangle, FaSave } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import {
	Button,
	Checkbox,
	DatePicker,
	FormField,
	Input,
	PriceInput,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import {
	useUpdateVozvratOrderMutation,
	useVozvratOrderProductsQuery,
	useVozvratOrderQuery,
} from '@/services/vozvrat/vozvrat.queries';

const editVozvratFormSchema = z.object({
	date: z.string().min(1, 'Sana kiritilishi shart'),
	exchange_rate: z.string().min(1, 'Dollar kursini kiriting'),
	discount_amount: z.string().optional(),
	sum_dollar: z.string().optional(),
	sum_som: z.string().optional(),
	sum_cart: z.string().optional(),
	comment: z.string().optional(),
	confirmation: z.boolean(),
});

type EditVozvratFormValues = z.infer<typeof editVozvratFormSchema>;

export default function VozvratOrderHistoryEditPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const vozvratId = id ? Number(id) : undefined;
	const { notify } = useNotification();

	const { data: item, isLoading, isError } = useVozvratOrderQuery(vozvratId);
	const { data: productsData } = useVozvratOrderProductsQuery(vozvratId);

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<EditVozvratFormValues>({
		resolver: zodResolver(editVozvratFormSchema),
		values: item
			? {
					date: item.date,
					exchange_rate: String(item.exchange_rate),
					discount_amount: String(item.discount_amount ?? 0),
					sum_dollar: String(item.sum_dollar),
					sum_som: String(item.sum_som),
					sum_cart: String(item.sum_cart),
					comment: item.comment ?? '',
					confirmation: Boolean(item.confirmation),
				}
			: undefined,
	});

	const updateMutation = useUpdateVozvratOrderMutation();

	const onSubmit = handleSubmit(async (values) => {
		if (!item) return;
		try {
			await updateMutation.mutateAsync({
				id: item.id,
				payload: {
					company: item.company,
					client: item.client,
					date: values.date,
					exchange_rate: values.exchange_rate,
					discount_amount: values.discount_amount || '0',
					all_summ_dollar: item.all_summ_dollar,
					sum_dollar: values.sum_dollar || '0',
					sum_som: values.sum_som || '0',
					sum_cart: values.sum_cart || '0',
					comment: values.comment?.trim(),
					confirmation: values.confirmation,
				},
			});
			notify({ title: 'Vozvrat buyurtma yangilandi' });
			navigate(-1);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, 'Yangilashda xatolik yuz berdi') });
		}
	});

	if (isLoading) {
		return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
	}

	if (isError || !item) {
		return (
			<div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
				<FaExclamationTriangle /> Vozvrat buyurtma topilmadi
			</div>
		);
	}

	const products = productsData?.products;

	return (
		<>
			<div className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-ca-theme px-4 py-3 text-white'>
				<h4 className='text-sm font-normal'>
					<span className='font-semibold'>{item.client_detail?.fio}</span> ning {item.date} sanadagi vozvrat
					buyurtmasini o'zgartirish
				</h4>
				<Button type='button' variant='warning' size='xs' onClick={() => navigate(-1)}>
					<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
				</Button>
			</div>

			<form onSubmit={onSubmit} noValidate>
				<div className='mb-5 rounded-[3px] bg-white p-5 shadow-sm'>
					<div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4'>
						<FormField label='Mijoz' horizontal={false} className='mb-0'>
							<Input value={item.client_detail?.fio ?? ''} disabled />
						</FormField>
						<FormField label='Eski Qarz ($)' horizontal={false} className='mb-0'>
							<Input value={formatNumber(item.old_total_debt, 2)} disabled />
						</FormField>
						<FormField label='Sana' error={errors.date?.message} required horizontal={false} className='mb-0'>
							<Controller
								name='date'
								control={control}
								render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField
							label='Dollar kursi'
							error={errors.exchange_rate?.message}
							required
							horizontal={false}
							className='mb-0'
						>
							<Controller
								name='exchange_rate'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
					</div>
				</div>

				<div className='mb-5 overflow-x-auto rounded-[3px] bg-white shadow-sm'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='bg-ca-theme text-white'>#</TableHead>
								<TableHead className='bg-ca-theme text-white'>Joyi</TableHead>
								<TableHead className='bg-ca-theme text-white'>Model</TableHead>
								<TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
								<TableHead className='bg-ca-theme text-white'>O'lchami</TableHead>
								<TableHead className='bg-ca-theme text-white'>Tip</TableHead>
								<TableHead className='bg-ca-theme text-white'>Soni</TableHead>
								<TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{!products || products.groups.length === 0 ? (
								<TableRow>
									<TableCell colSpan={8} className='text-center text-ca-text'>
										Mahsulotlar topilmadi
									</TableCell>
								</TableRow>
							) : (
								products.groups.map((group) => (
									<Fragment key={group.brand}>
										{group.items.map((productItem, index) => (
											<TableRow key={productItem.id}>
												<TableCell>{index + 1}</TableCell>
												<TableCell>{productItem.type_sklad_name}</TableCell>
												<TableCell>{productItem.brand_name}</TableCell>
												<TableCell>{productItem.product_category_name}</TableCell>
												<TableCell>{productItem.size}</TableCell>
												<TableCell>{productItem.type_name}</TableCell>
												<TableCell>{productItem.count}</TableCell>
												<TableCell>{formatNumber(productItem.price, 2)}</TableCell>
											</TableRow>
										))}
									</Fragment>
								))
							)}
						</TableBody>
					</Table>
					<p className='px-4 py-2 text-[11px] text-ca-text'>
						Mahsulotlar ro'yxati o'zgartirib bo'lmaydi, faqat hisob-kitob ma'lumotlari tahrirlanadi.
					</p>
				</div>

				<div className='mb-5 rounded-[3px] bg-white p-5 shadow-sm'>
					<div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4'>
						<FormField label='Qaytgan mahsulot summasi ($)' horizontal={false} className='mb-0'>
							<PriceInput value={formatNumber(item.product_summ_dollar, 2)} disabled />
						</FormField>
						<FormField label='Mijozga qaytarilgan summa ($)' horizontal={false} className='mb-0'>
							<PriceInput value={formatNumber(item.all_summ_dollar, 2)} disabled />
						</FormField>
						<FormField label='Jami chegirma ($)' horizontal={false} className='mb-0'>
							<Controller
								name='discount_amount'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
						<FormField label='Summa dollarda ($)' horizontal={false} className='mb-0'>
							<Controller
								name='sum_dollar'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>
					</div>

					<div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4'>
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
						<FormField label='Izoh' horizontal={false} className='mb-0'>
							<Input {...register('comment')} />
						</FormField>
					</div>

					<div className='mb-4 flex items-center gap-6'>
						<Controller
							name='confirmation'
							control={control}
							render={({ field }) => (
								<Checkbox label='Tasdiqlash:' checked={field.value} onCheckedChange={field.onChange} inline />
							)}
						/>
					</div>

					<Button type='submit' variant='info' className='w-full' disabled={updateMutation.isPending}>
						<FaSave className='mr-1.5' /> O'zgartirish
					</Button>
				</div>
			</form>
		</>
	);
}
