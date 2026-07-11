import { useState } from 'react';
import { FaArrowLeft, FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useNotification } from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { useOrderAccountHistoryQuery } from '@/services/order-account-history/order-account-history.queries';
import { orderAccountHistoryService } from '@/services/order-account-history/order-account-history.service';

type PrintRole = 'xodim' | 'sklad' | 'mijoz' | 'admin';

function openPdfBlob(blob: Blob) {
	const url = URL.createObjectURL(blob);
	window.open(url, '_blank');
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function formatDateTime(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	const date = d.toLocaleDateString('ru-RU');
	const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	return `${date} ${time}`;
}

export default function OrderAccountHistoryDetailPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const orderId = id ? Number(id) : undefined;

	const { data: order, isLoading, isError } = useOrderAccountHistoryQuery(orderId);
	const { notify } = useNotification();
	const [printingRole, setPrintingRole] = useState<PrintRole | null>(null);

	async function printFor(role: PrintRole) {
		if (!orderId) return;

		if (role !== 'mijoz' && role !== 'xodim') {
			notify({ title: 'Tez orada', text: 'Bu chop qilish turi hali ulanmagan.' });
			return;
		}

		setPrintingRole(role);
		try {
			const blob =
				role === 'mijoz'
					? await orderAccountHistoryService.printForClient(orderId)
					: await orderAccountHistoryService.printForWorker(orderId);
			openPdfBlob(blob);
		} catch {
			notify({ title: 'Xatolik', text: 'PDF yuklab bo\'lmadi' });
		} finally {
			setPrintingRole(null);
		}
	}

	if (isLoading) {
		return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
	}

	if (isError || !order) {
		return (
			<div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
				<FaExclamationTriangle /> Buyurtma topilmadi
			</div>
		);
	}

	const exchangeRate = Number(order.exchange_rate) || 0;
	const paidTotal =
		(Number(order.sum_dollar) || 0) +
		(exchangeRate > 0 ? (Number(order.sum_som) || 0) / exchangeRate : 0) +
		(Number(order.sum_cart) || 0) +
		(Number(order.sum_transfers) || 0);

	return (
		<>
			<div className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-ca-theme px-4 py-3 text-white'>
				<h4 className='text-sm font-normal'>
					{order.client_detail?.fio} <span className='font-semibold'>{formatDateTime(order.created_time)}</span>{' '}
					sanadagi buyurmalar ro'yxati
				</h4>
				<div className='flex flex-wrap items-center gap-2'>
					<Button type='button' variant='info' size='xs' onClick={() => navigate(-1)}>
						<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
					</Button>
					<Button
						type='button'
						variant='warning'
						size='xs'
						disabled={printingRole === 'xodim'}
						onClick={() => printFor('xodim')}
					>
						<FaDownload className='mr-1.5' />{' '}
						{printingRole === 'xodim' ? 'Yuklanmoqda...' : 'Chop qilish Xodim uchun'}
					</Button>
					<Button type='button' variant='primary' size='xs' onClick={() => printFor('sklad')}>
						<FaDownload className='mr-1.5' /> Chop qilish Sklad uchun
					</Button>
					<Button
						type='button'
						variant='warning'
						size='xs'
						disabled={printingRole === 'mijoz'}
						onClick={() => printFor('mijoz')}
					>
						<FaDownload className='mr-1.5' />{' '}
						{printingRole === 'mijoz' ? 'Yuklanmoqda...' : 'Chop qilish Mijoz uchun'}
					</Button>
					<Button type='button' variant='danger' size='xs' onClick={() => printFor('admin')}>
						<FaDownload className='mr-1.5' /> Chop qilish Admin uchun
					</Button>
				</div>
			</div>

			<div className='mb-5 rounded-[3px] bg-white p-5 shadow-sm'>
				<h4 className='mb-4 text-sm font-semibold text-ca-heading'>Hisobot</h4>

				<div className='-mx-2.5 flex flex-wrap gap-y-3 text-xs'>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>Dollar kursi:</span>{' '}
						<span className='font-bold text-ca-orange'>{formatNumber(order.exchange_rate)}</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2' />

					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>Jami to'lanadigan summa ($):</span>{' '}
						<span className='font-bold text-ca-orange'>{formatNumber(order.all_summ_dollar, 2)} $</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-heading'>To'langan summa dollarda ($):</span>{' '}
						<span className='font-bold text-ca-heading'>{formatNumber(order.sum_dollar, 2)} $</span>
					</div>

					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>To'langan summa ($):</span>{' '}
						<span className='font-bold text-ca-orange'>{formatNumber(paidTotal, 2)} $</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-heading'>To'langan summa so'mda:</span>{' '}
						<span className='font-bold text-ca-heading'>{formatNumber(order.sum_som)}</span>
					</div>

					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>Chegirma ($):</span>{' '}
						<span className='font-bold text-ca-orange'>{formatNumber(order.discount_amount, 2)} $</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-heading'>To'langan summa kartada:</span>{' '}
						<span className='font-bold text-ca-heading'>{formatNumber(order.sum_cart, 2)}</span>
					</div>

					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>Qolgan qarz ($):</span>{' '}
						<span className='font-bold text-ca-orange'>{formatNumber(order.total_debt, 2)} $</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-heading'>Qaytim:</span>{' '}
						<span className='font-bold text-ca-heading'>
							{formatNumber(order.zdacha_sum)} ({formatNumber(order.zdacha_dollar, 2)} $)
						</span>
					</div>
				</div>
			</div>

			<div className='overflow-x-auto rounded-[3px] bg-white shadow-sm'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='bg-ca-theme text-white'>#</TableHead>
							<TableHead className='bg-ca-theme text-white'>Joyi</TableHead>
							<TableHead className='bg-ca-theme text-white'>Model</TableHead>
							<TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
							<TableHead className='bg-ca-theme text-white'>Holati</TableHead>
							<TableHead className='bg-ca-theme text-white'>O'lchami</TableHead>
							<TableHead className='bg-ca-theme text-white'>Tip</TableHead>
							<TableHead className='bg-ca-theme text-white'>Soni</TableHead>
							<TableHead className='bg-ca-theme text-white'>Berilgan soni</TableHead>
							<TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>
							<TableHead className='bg-ca-theme text-white'>Asl Narxi ($)</TableHead>
							<TableHead className='bg-ca-theme text-white'>Foyda ($)</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow>
							<TableCell colSpan={12} className='text-center text-ca-text'>
								Mahsulotlar ro'yxati hali ulanmagan
							</TableCell>
						</TableRow>
						<TableRow className='bg-ca-heading'>
							<TableCell className='bg-ca-heading text-white' colSpan={9}>
								Jami
							</TableCell>
							<TableCell className='bg-ca-heading font-semibold text-white'>
								{formatNumber(order.all_summ_dollar, 2)}
							</TableCell>
							<TableCell className='bg-ca-heading font-semibold text-white'>
								{formatNumber(order.all_product_sum, 2)}
							</TableCell>
							<TableCell className='bg-ca-heading font-semibold text-white'>
								{formatNumber(order.all_profit_dollar, 2)}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</>
	);
}
