import { FaArrowLeft, FaTrash, FaEdit, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, buttonProps, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import ColumnVisibilityMenu from '@/components/ColumnVisibilityMenu';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { formatNumber } from '@/lib/number';
import { type ColumnVisibilityDef, useColumnVisibility } from '@/lib/useColumnVisibility';
import { useMyDebtHistoryListQuery } from '@/services/my-debt/my-debt-history.queries';
import MyDebtHistoryDraftDeleteModal from '@/pages/MyDebtDetailPage/components/MyDebtHistoryDraftDeleteModal';
import MyDebtHistoryEditModal from '@/pages/MyDebtDetailPage/components/MyDebtHistoryEditModal';
import MyDebtHistoryHardDeleteModal from '@/pages/MyDebtDetailPage/components/MyDebtHistoryHardDeleteModal';

const userLabel = (u: { username: string; first_name: string; last_name: string }) =>
	`${u.last_name} ${u.first_name}`.trim() || u.username;

function formatDate(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleDateString('ru-RU');
}

const COLUMNS: ColumnVisibilityDef[] = [
	{ id: 'index', label: '#', hideable: false },
	{ id: 'date', label: 'Sana' },
	{ id: 'total_debt', label: 'Qarz miqdori ($)' },
	{ id: 'discount', label: 'Chegirma ($)' },
	{ id: 'rate', label: 'Dollar kursi' },
	{ id: 'total_sum', label: 'Jami summa ($)' },
	{ id: 'created_by', label: 'Kim tomonidan' },
	{ id: 'actions', label: 'Harakatlar', hideable: false },
];

export default function MyDebtDetailPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const myDebtId = id ? Number(id) : undefined;
	const { canWrite } = useCurrentCompany();
	const cols = useColumnVisibility('my-debt-detail', COLUMNS);

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
				<div className='mb-5 rounded-[3px] bg-ca-silver-light p-5 shadow-sm'>
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

			<div className='mb-2 flex justify-end'>
				<ColumnVisibilityMenu state={cols} />
			</div>

			<div className='overflow-x-auto rounded-[3px] bg-ca-silver-light shadow-sm'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='bg-ca-theme text-white'>#</TableHead>
							{cols.isVisible('date') && <TableHead className='bg-ca-theme text-white'>Sana</TableHead>}
							{cols.isVisible('total_debt') && <TableHead className='bg-ca-theme text-white'>Qarz miqdori ($)</TableHead>}
							{cols.isVisible('discount') && <TableHead className='bg-ca-theme text-white'>Chegirma ($)</TableHead>}
							{cols.isVisible('rate') && <TableHead className='bg-ca-theme text-white'>Dollar kursi</TableHead>}
							{cols.isVisible('total_sum') && <TableHead className='bg-ca-theme text-white'>Jami summa ($)</TableHead>}
							{cols.isVisible('created_by') && <TableHead className='bg-ca-theme text-white'>Kim tomonidan</TableHead>}
							<TableHead className='bg-ca-theme text-right text-white'>Harakatlar</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{results.length === 0 ? (
							<TableRow>
								<TableCell colSpan={cols.visibleCount} className='text-center text-ca-text'>
									Tarix topilmadi
								</TableCell>
							</TableRow>
						) : (
							results.map((item, index) => {
								const consignorName = item.my_total_debt_detail?.consignor_detail?.name;
								return (
									<TableRow key={item.id}>
										<TableCell>{index + 1}</TableCell>
										{cols.isVisible('date') && <TableCell>{formatDate(item.cr_date)}</TableCell>}
										{cols.isVisible('total_debt') && (
											<TableCell className='font-semibold text-ca-red'>
												{formatNumber(item.total_debt, 2)} $
											</TableCell>
										)}
										{cols.isVisible('discount') && <TableCell>{formatNumber(item.discount_amount, 2)} $</TableCell>}
										{cols.isVisible('rate') && <TableCell>{formatNumber(item.exchange_rate, 2)}</TableCell>}
										{cols.isVisible('total_sum') && (
											<TableCell className='font-semibold text-ca-heading'>
												{formatNumber(item.all_summ_dollar, 2)} $
											</TableCell>
										)}
										{cols.isVisible('created_by') && (
											<TableCell>
												{item.created_by_detail ? userLabel(item.created_by_detail) : ''}
											</TableCell>
										)}
										<TableCell>
											<div className='flex justify-end gap-1'>
												{canWrite && (
													<OpenDialogButton
														element={(props) => <Button {...props} />}
														elementProps={{
															...buttonProps(<FaEdit />, 'warning', 'icon'),
															'aria-label': 'Tahrirlash',
														}}
														dialog={MyDebtHistoryEditModal}
														dialogProps={{ item }}
													/>
												)}
												{canWrite && (
													<OpenDialogButton
														element={(props) => <Button {...props} />}
														elementProps={{
															...buttonProps(<FaTrash />, 'danger', 'icon'),
															'aria-label': 'Draftga olish',
														}}
														dialog={MyDebtHistoryDraftDeleteModal}
														dialogProps={{ id: item.id, consignorName }}
													/>
												)}
												{/* <OpenDialogButton
													element={(props) => <Button {...props} />}
													elementProps={{
														...buttonProps(<FaTrash />, 'danger', 'icon'),
														'aria-label': "Batamom o'chirish",
														disabled: !canWrite,
													}}
													dialog={MyDebtHistoryHardDeleteModal}
													dialogProps={{ id: item.id, consignorName }}
												/> */}
											</div>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>
		</>
	);
}
