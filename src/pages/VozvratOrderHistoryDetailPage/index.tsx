import { Fragment } from 'react';
import { FaArrowLeft, FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useNotification } from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { useVozvratOrderQuery, useVozvratProductsQuery } from '@/services/vozvrat/vozvrat.queries';

export default function VozvratOrderHistoryDetailPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const orderId = id ? Number(id) : undefined;

	const { data: order, isLoading: isOrderLoading, isError: isOrderError } = useVozvratOrderQuery(orderId);
	const { data: productsData, isLoading: isProductsLoading } = useVozvratProductsQuery(
		order ? { client_id: order.client } : undefined,
	);
	const { notify } = useNotification();

	function printForClient() {
		notify({ title: 'Tez orada', text: 'Bu funksiya hali ulanmagan.' });
	}

	if (isOrderLoading) {
		return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
	}

	if (isOrderError || !order) {
		return (
			<div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
				<FaExclamationTriangle /> Vozvrat buyurtma topilmadi
			</div>
		);
	}

	const groups = productsData?.groups ?? [];

	return (
		<>
			<div className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-ca-theme px-4 py-3 text-white'>
				<h4 className='text-sm font-normal'>
					{order.date} sanadagi <span className='font-semibold'>{order.client_detail.fio}</span>dan qabul qilingan
					vozvrat
				</h4>
				<div className='flex flex-wrap items-center gap-2'>
					<Button type='button' variant='info' size='xs' onClick={() => navigate(-1)}>
						<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
					</Button>
					<Button type='button' variant='warning' size='xs' onClick={printForClient}>
						<FaDownload className='mr-1.5' /> Chop qilish Mijoz uchun
					</Button>
				</div>
			</div>

			<div className='mb-5 rounded-[3px] bg-white p-5 shadow-sm'>
				<h4 className='mb-4 text-sm font-semibold text-ca-heading'>Hisobot</h4>

				<div className='divide-y divide-ca-border text-xs'>
					<div className='flex items-center justify-between py-2.5'>
						<span className='font-semibold text-ca-orange'>Dollar kursi:</span>
						<span className='font-bold text-ca-orange'>{formatNumber(order.exchange_rate)}</span>
					</div>
					<div className='flex items-center justify-between py-2.5'>
						<span className='font-semibold text-ca-orange'>Qaytgan mahsulot summasi ($):</span>
						<span className='font-bold text-ca-orange'>{formatNumber(order.product_summ_dollar, 2)} $</span>
					</div>
					<div className='flex items-center justify-between py-2.5'>
						<span className='font-semibold text-ca-orange'>Mijozga qaytarilgan summa ($):</span>
						<span className='font-bold text-ca-orange'>{formatNumber(order.all_summ_dollar, 2)} $</span>
					</div>
					<div className='flex items-center justify-between py-2.5'>
						<span className='font-semibold text-ca-heading'>Qaytarilgan summa dollarda ($):</span>
						<span className='font-bold text-ca-heading'>{formatNumber(order.sum_dollar, 2)} $</span>
					</div>
					<div className='flex items-center justify-between py-2.5'>
						<span className='font-semibold text-ca-heading'>Qaytarilgan summa so'mda:</span>
						<span className='font-bold text-ca-heading'>{formatNumber(order.sum_som)}</span>
					</div>
					<div className='flex items-center justify-between py-2.5'>
						<span className='font-semibold text-ca-orange'>Chegirma ($):</span>
						<span className='font-bold text-ca-orange'>{formatNumber(order.discount_amount, 2)} $</span>
					</div>
					<div className='flex items-center justify-between py-2.5'>
						<span className='font-semibold text-ca-heading'>Eski qarz ($):</span>
						<span className='font-bold text-ca-heading'>{formatNumber(order.old_total_debt, 2)} $</span>
					</div>
					<div className='flex items-center justify-between py-2.5'>
						<span className='font-semibold text-ca-red'>Qolgan umumiy qarz ($):</span>
						<span className='font-bold text-ca-red'>{formatNumber(order.total_debt, 2)} $</span>
					</div>
					{order.comment && (
						<div className='flex items-center justify-between py-2.5'>
							<span className='font-semibold text-ca-heading'>Izoh:</span>
							<span className='font-bold text-ca-heading'>{order.comment}</span>
						</div>
					)}
				</div>
			</div>

			<div className='overflow-x-auto rounded-[3px] bg-white shadow-sm'>
				<h4 className='p-4 text-sm font-semibold text-ca-heading'>
					Mijozning qaytarishi mumkin bo'lgan qolgan mahsulotlari
				</h4>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='bg-ca-theme text-white'>#</TableHead>
							<TableHead className='bg-ca-theme text-white'>Joyi</TableHead>
							<TableHead className='bg-ca-theme text-white'>Model</TableHead>
							<TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
							<TableHead className='bg-ca-theme text-white'>O'lchami</TableHead>
							<TableHead className='bg-ca-theme text-white'>Tip</TableHead>
							<TableHead className='bg-ca-theme text-white'>Qolgan soni</TableHead>
							<TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>
							<TableHead className='bg-ca-theme text-white'>Narxi (so'm)</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isProductsLoading ? (
							<TableRow>
								<TableCell colSpan={9} className='text-center text-ca-text'>
									Yuklanmoqda...
								</TableCell>
							</TableRow>
						) : groups.length === 0 ? (
							<TableRow>
								<TableCell colSpan={9} className='text-center text-ca-text'>
									Mahsulotlar topilmadi
								</TableCell>
							</TableRow>
						) : (
							groups.map((group) => (
								<Fragment key={group.brand.id}>
									<TableRow>
										<TableCell colSpan={9} className='bg-ca-aqua/15 font-semibold text-ca-aqua'>
											{group.brand.name}
										</TableCell>
									</TableRow>
									{group.items.map((item, index) => (
										<TableRow key={`${item.warehouse}-${item.product_category}-${item.size}-${item.type}`}>
											<TableCell>{index + 1}</TableCell>
											<TableCell>{item.type_sklad_name}</TableCell>
											<TableCell>{item.brand_name}</TableCell>
											<TableCell>{item.product_category_name}</TableCell>
											<TableCell>{item.size}</TableCell>
											<TableCell>{item.type_name}</TableCell>
											<TableCell>{item.remaining_count}</TableCell>
											<TableCell>{formatNumber(item.price_dollar, 2)}</TableCell>
											<TableCell>{formatNumber(item.price_som)}</TableCell>
										</TableRow>
									))}
								</Fragment>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</>
	);
}
