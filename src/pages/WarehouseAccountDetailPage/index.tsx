import { Fragment } from 'react';
import { FaArrowLeft, FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useNotification } from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { useSkladViewQuery } from '@/services/sklad/sklad.queries';

export default function WarehouseAccountDetailPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const skladId = id ? Number(id) : undefined;

	const { data, isLoading, isError } = useSkladViewQuery(skladId);
	const { notify } = useNotification();

	function printForClient() {
		notify({ title: 'Tez orada', text: 'Bu funksiya hali ulanmagan.' });
	}

	if (isLoading) {
		return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
	}

	if (isError || !data) {
		return (
			<div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
				<FaExclamationTriangle /> Sklad topilmadi
			</div>
		);
	}

	const { sklad, report, products } = data;

	return (
		<>
			<div className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-ca-theme px-4 py-3 text-white'>
				<h4 className='text-sm font-normal'>
					{sklad.cr_date_label} sanadagi <span className='font-semibold'>{sklad.consignor_name}</span>dan import
					qilingan tovarlar tarixi
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
						<span className='font-bold text-ca-orange'>{formatNumber(report.exchange_rate)}</span>
					</div>
					<div className='flex items-center justify-between py-2.5'>
						<span className='font-semibold text-ca-orange'>Jami to'lanadigan summa ($):</span>
						<span className='font-bold text-ca-orange'>{formatNumber(report.given_sum_dollar, 2)} $</span>
					</div>
					<div className='flex items-center justify-between py-2.5'>
						<span className='font-semibold text-ca-orange'>To'langan summa ($):</span>
						<span className='font-bold text-ca-orange'>{formatNumber(report.sum_dollar, 2)} $</span>
					</div>
					<div className='flex items-center justify-between py-2.5'>
						<span className='font-semibold text-ca-orange'>Chegirma ($):</span>
						<span className='font-bold text-ca-orange'>{formatNumber(report.discount_amount, 2)} $</span>
					</div>
					<div className='flex items-center justify-between py-2.5'>
						<span className='font-semibold text-ca-red'>Qolgan umumiy qarzim ($):</span>
						<span className='font-bold text-ca-red'>{formatNumber(report.my_total_debt, 2)} $</span>
					</div>
				</div>
			</div>

			<div className='overflow-x-auto rounded-[3px] bg-white shadow-sm'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='bg-ca-theme text-white'>#</TableHead>
							<TableHead className='bg-ca-theme text-white'>Model</TableHead>
							<TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
							<TableHead className='bg-ca-theme text-white'>O'lchami</TableHead>
							<TableHead className='bg-ca-theme text-white'>Soni</TableHead>
							<TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{products.groups.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className='text-center text-ca-text'>
									Mahsulotlar topilmadi
								</TableCell>
							</TableRow>
						) : (
							products.groups.map((group) => (
								<Fragment key={group.brand.id}>
									<TableRow>
										<TableCell colSpan={6} className='bg-ca-aqua/15 font-semibold text-ca-aqua'>
											{group.brand.name}
										</TableCell>
									</TableRow>
									{group.items.map((item, index) => (
										<TableRow key={item.id}>
											<TableCell>{index + 1}</TableCell>
											<TableCell>{item.brand_name}</TableCell>
											<TableCell>{item.product_category_name}</TableCell>
											<TableCell>{item.size}</TableCell>
											<TableCell>{item.count}</TableCell>
											<TableCell>{formatNumber(item.price)}</TableCell>
										</TableRow>
									))}
									<TableRow className='bg-ca-silver'>
										<TableCell colSpan={4} className='font-semibold text-ca-heading'>
											Jami:
										</TableCell>
										<TableCell className='font-semibold text-ca-heading'>{group.totals.count}</TableCell>
										<TableCell className='font-semibold text-ca-heading'>
											{formatNumber(group.totals.price)}
										</TableCell>
									</TableRow>
								</Fragment>
							))
						)}
						<TableRow className='bg-ca-heading'>
							<TableCell className='bg-ca-heading text-white' colSpan={4}>
								Jami:
							</TableCell>
							<TableCell className='bg-ca-heading font-semibold text-white'>{products.totals.count}</TableCell>
							<TableCell className='bg-ca-heading font-semibold text-white'>
								{formatNumber(products.totals.price)}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</>
	);
}
