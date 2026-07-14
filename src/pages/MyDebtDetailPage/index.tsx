import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { useMyDebtHistoryListQuery } from '@/services/my-debt/my-debt-history.queries';

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

function formatDate(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleDateString('ru-RU');
}

export default function MyDebtDetailPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const myDebtId = id ? Number(id) : undefined;

	const { data, isLoading, isError } = useMyDebtHistoryListQuery(
		{ my_total_debt: myDebtId, limit: 200 },
		typeof myDebtId === 'number',
	);

	if (isLoading) {
		return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
	}

	if (isError || !data) {
		return (
			<div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
				<FaExclamationTriangle /> Qarz tarixi topilmadi
			</div>
		);
	}

	const results = data.results;
	const debt = results[0]?.my_total_debt_detail;

	return (
		<>
			<div className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-ca-theme px-4 py-3 text-white'>
				<h4 className='text-sm font-normal'>
					<span className='font-semibold'>{debt?.consignor_detail?.name ?? ''}</span> qarzi tarixi
				</h4>
				<Button type='button' variant='info' size='xs' onClick={() => navigate(-1)}>
					<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
				</Button>
			</div>

			{debt && (
				<div className='mb-5 rounded-[3px] bg-white p-5 shadow-sm'>
					<h4 className='mb-4 text-sm font-semibold text-ca-heading'>Hisobot</h4>

					<div className='divide-y divide-ca-border text-xs'>
						<div className='flex items-center justify-between py-2.5'>
							<span className='font-semibold text-ca-heading'>Oxirgi o'zgargan sana:</span>
							<span className='font-bold text-ca-heading'>{formatDate(debt.updated_time)}</span>
						</div>
						<div className='flex items-center justify-between py-2.5'>
							<span className='font-semibold text-ca-red'>Joriy qarz ($):</span>
							<span className='font-bold text-ca-red'>{formatNumber(debt.total_debt, 2)} $</span>
						</div>
					</div>
				</div>
			)}

			<div className='overflow-x-auto rounded-[3px] bg-white shadow-sm'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='bg-ca-theme text-white'>#</TableHead>
							<TableHead className='bg-ca-theme text-white'>Sana</TableHead>
							<TableHead className='bg-ca-theme text-white'>Qarz miqdori ($)</TableHead>
							<TableHead className='bg-ca-theme text-white'>Chegirma ($)</TableHead>
							<TableHead className='bg-ca-theme text-white'>Dollar kursi</TableHead>
							<TableHead className='bg-ca-theme text-white'>Jami summa ($)</TableHead>
							<TableHead className='bg-ca-theme text-white'>Kim tomonidan</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{results.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className='text-center text-ca-text'>
									Tarix topilmadi
								</TableCell>
							</TableRow>
						) : (
							results.map((item, index) => (
								<TableRow key={item.id}>
									<TableCell>{index + 1}</TableCell>
									<TableCell>{formatDate(item.cr_date)}</TableCell>
									<TableCell className='font-semibold text-ca-red'>{formatNumber(item.total_debt, 2)} $</TableCell>
									<TableCell>{formatNumber(item.discount_amount, 2)} $</TableCell>
									<TableCell>{formatNumber(item.exchange_rate, 2)}</TableCell>
									<TableCell className='font-semibold text-ca-heading'>
										{formatNumber(item.all_summ_dollar, 2)} $
									</TableCell>
									<TableCell>{item.created_by_detail ? userLabel(item.created_by_detail) : ''}</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</>
	);
}
