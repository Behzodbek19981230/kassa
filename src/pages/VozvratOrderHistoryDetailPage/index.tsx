import { Fragment, useState } from 'react';
import { FaArrowLeft, FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useNotification } from '@/components/ui';
import ColumnVisibilityMenu from '@/components/ColumnVisibilityMenu';
import { loadBlobIntoTab, openPendingTab } from '@/lib/blob';
import { formatNumber } from '@/lib/number';
import { type ColumnVisibilityDef, useColumnVisibility } from '@/lib/useColumnVisibility';
import { useVozvratOrderProductsQuery } from '@/services/vozvrat/vozvrat.queries';
import { vozvratService } from '@/services/vozvrat/vozvrat.service';

import { getApiErrorMessageAsync } from '@/lib/errors';

type PrintRole = 'mijoz' | 'admin';

const COLUMNS: ColumnVisibilityDef[] = [
	{ id: 'index', label: '#', hideable: false },
	{ id: 'location', label: 'Joyi' },
	{ id: 'brand', label: 'Model' },
	{ id: 'category', label: 'Nomi' },
	{ id: 'size', label: "O'lchami" },
	{ id: 'type', label: 'Tip' },
	{ id: 'count', label: 'Soni' },
	{ id: 'price', label: 'Narxi ($)' },
	{ id: 'real_price', label: 'Asl Narxi ($)', superAdminOnly: true },
	{ id: 'profit', label: 'Foyda ($)', superAdminOnly: true },
];

/** Columns the "Jami:" label of the total rows spans. */
const LABEL_COLUMNS = ['index', 'location', 'brand', 'category', 'size', 'type'];

export default function VozvratOrderHistoryDetailPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const orderId = id ? Number(id) : undefined;

	const { data, isLoading, isError } = useVozvratOrderProductsQuery(orderId);
	const { notify } = useNotification();
	const cols = useColumnVisibility('vozvrat-order-history-detail', COLUMNS);
	const labelSpan = LABEL_COLUMNS.filter((c) => cols.isVisible(c)).length;
	const [printingRole, setPrintingRole] = useState<PrintRole | null>(null);

	async function printFor(role: PrintRole) {
		if (!orderId) return;

		const tab = openPendingTab();
		setPrintingRole(role);
		try {
			const blob =
				role === 'mijoz' ? await vozvratService.printForClient(orderId) : await vozvratService.printForAdmin(orderId);
			loadBlobIntoTab(blob, tab);
		} catch (err) {
			tab?.close();
			notify({ title: 'Xatolik', text: await getApiErrorMessageAsync(err, "PDF yuklab bo'lmadi") });
		} finally {
			setPrintingRole(null);
		}
	}

	if (isLoading) {
		return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
	}

	if (isError || !data) {
		return (
			<div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
				<FaExclamationTriangle /> Vozvrat buyurtma topilmadi
			</div>
		);
	}

	const { vozvrat_order: order, report, products } = data;

	return (
		<>
			<div className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-ca-theme px-4 py-3 text-white'>
				<h4 className='text-sm font-normal'>{order.title}</h4>
				<div className='flex flex-wrap items-center gap-2'>
					<Button type='button' variant='info' size='xs' onClick={() => navigate(-1)}>
						<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
					</Button>
					<Button
						type='button'
						variant='warning'
						size='xs'
						disabled={printingRole === 'mijoz'}
						onClick={() => printFor('mijoz')}
					>
						<FaDownload className='mr-1.5' /> {printingRole === 'mijoz' ? 'Yuklanmoqda...' : 'Chop qilish Mijoz uchun'}
					</Button>
					<Button
						type='button'
						variant='danger'
						size='xs'
						disabled={printingRole === 'admin'}
						onClick={() => printFor('admin')}
					>
						<FaDownload className='mr-1.5' /> {printingRole === 'admin' ? 'Yuklanmoqda...' : 'Chop qilish Admin uchun'}
					</Button>
				</div>
			</div>

			<div className='mb-5 rounded-[3px] bg-ca-silver-light p-5 shadow-sm'>
				<h4 className='mb-4 text-sm font-semibold text-ca-heading'>Hisobot</h4>

				<div className='grid grid-cols-1 gap-x-8 text-xs md:grid-cols-2'>
					<div className='flex items-center justify-between gap-3 border-b border-ca-border py-2.5'>
						<span className='font-semibold text-ca-orange'>Dollar kursi:</span>
						<span className='font-bold text-ca-orange'>{formatNumber(report.exchange_rate)}</span>
					</div>
					<div className='flex items-center justify-between gap-3 border-b border-ca-border py-2.5'>
						<span className='font-semibold text-ca-orange'>Qaytgan mahsulot summasi ($):</span>
						<span className='font-bold text-ca-orange'>{formatNumber(report.product_summ_dollar, 2)} $</span>
					</div>
					<div className='flex items-center justify-between gap-3 border-b border-ca-border py-2.5'>
						<span className='font-semibold text-ca-orange'>Mijozga qaytarilgan summa ($):</span>
						<span className='font-bold text-ca-orange'>{formatNumber(report.all_summ_dollar, 2)} $</span>
					</div>
					<div className='flex items-center justify-between gap-3 border-b border-ca-border py-2.5'>
						<span className='font-semibold text-ca-heading'>Qaytarilgan summa dollarda ($):</span>
						<span className='font-bold text-ca-heading'>{formatNumber(report.sum_dollar, 2)} $</span>
					</div>
					<div className='flex items-center justify-between gap-3 border-b border-ca-border py-2.5'>
						<span className='font-semibold text-ca-heading'>Qaytarilgan summa so'mda:</span>
						<span className='font-bold text-ca-heading'>{formatNumber(report.sum_som)}</span>
					</div>
					<div className='flex items-center justify-between gap-3 border-b border-ca-border py-2.5'>
						<span className='font-semibold text-ca-orange'>Chegirma ($):</span>
						<span className='font-bold text-ca-orange'>{formatNumber(report.discount_amount, 2)} $</span>
					</div>
					<div className='flex items-center justify-between gap-3 border-b border-ca-border py-2.5'>
						<span className='font-semibold text-ca-heading'>Eski qarz ($):</span>
						<span className='font-bold text-ca-heading'>{formatNumber(report.old_total_debt, 2)} $</span>
					</div>
					<div className='flex items-center justify-between gap-3 border-b border-ca-border py-2.5'>
						<span className='font-semibold text-ca-red'>Qolgan umumiy qarz ($):</span>
						<span className='font-bold text-ca-red'>{formatNumber(report.total_debt, 2)} $</span>
					</div>
					{order.comment && (
						<div className='flex items-center justify-between gap-3 border-b border-ca-border py-2.5'>
							<span className='font-semibold text-ca-heading'>Izoh:</span>
							<span className='font-bold text-ca-heading'>{order.comment}</span>
						</div>
					)}
				</div>
			</div>

			<div className='overflow-x-auto rounded-[3px] bg-ca-silver-light shadow-sm'>
				<div className='flex items-center justify-between gap-2 p-4'>
					<h4 className='text-sm font-semibold text-ca-heading'>Vozvrat qilingan mahsulotlar</h4>
					<ColumnVisibilityMenu state={cols} />
				</div>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='bg-ca-theme text-white'>#</TableHead>
							{cols.isVisible('location') && <TableHead className='bg-ca-theme text-white'>Joyi</TableHead>}
							{cols.isVisible('brand') && <TableHead className='bg-ca-theme text-white'>Model</TableHead>}
							{cols.isVisible('category') && <TableHead className='bg-ca-theme text-white'>Nomi</TableHead>}
							{cols.isVisible('size') && <TableHead className='bg-ca-theme text-white'>O'lchami</TableHead>}
							{cols.isVisible('type') && <TableHead className='bg-ca-theme text-white'>Tip</TableHead>}
							{cols.isVisible('count') && <TableHead className='bg-ca-theme text-white'>Soni</TableHead>}
							{cols.isVisible('price') && <TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>}
							{cols.isVisible('real_price') && <TableHead className='bg-ca-theme text-white'>Asl Narxi ($)</TableHead>}
							{cols.isVisible('profit') && <TableHead className='bg-ca-theme text-white'>Foyda ($)</TableHead>}
						</TableRow>
					</TableHeader>
					<TableBody>
						{products.groups.length === 0 ? (
							<TableRow>
								<TableCell colSpan={cols.visibleCount} className='text-center text-ca-text'>
									Mahsulotlar topilmadi
								</TableCell>
							</TableRow>
						) : (
							products.groups.map((group) => (
								<Fragment key={group.brand}>
									<TableRow>
										<TableCell colSpan={cols.visibleCount} className='bg-ca-aqua/15 font-semibold text-ca-aqua'>
											{group.brand_name}
										</TableCell>
									</TableRow>
									{group.items.map((item, index) => (
										<TableRow key={item.id}>
											<TableCell>{index + 1}</TableCell>
											{cols.isVisible('location') && <TableCell>{item.type_sklad_name}</TableCell>}
											{cols.isVisible('brand') && <TableCell>{item.brand_name}</TableCell>}
											{cols.isVisible('category') && <TableCell>{item.product_category_name}</TableCell>}
											{cols.isVisible('size') && <TableCell>{item.size}</TableCell>}
											{cols.isVisible('type') && <TableCell>{item.type_name}</TableCell>}
											{cols.isVisible('count') && <TableCell>{item.count}</TableCell>}
											{cols.isVisible('price') && <TableCell>{formatNumber(item.price, 2)}</TableCell>}
											{cols.isVisible('real_price') && <TableCell>{formatNumber(item.real_price, 2)}</TableCell>}
											{cols.isVisible('profit') && (
												<TableCell
													className={`font-semibold ${Number(item.profit) < 0 ? 'text-ca-red' : 'text-ca-green'}`}
												>
													{formatNumber(item.profit, 2)}
												</TableCell>
											)}
										</TableRow>
									))}
									<TableRow className='bg-ca-silver'>
										<TableCell colSpan={labelSpan} className='font-semibold text-ca-heading'>
											Jami:
										</TableCell>
										{cols.isVisible('count') && <TableCell className='font-semibold text-ca-heading'>{group.totals.count}</TableCell>}
										{cols.isVisible('price') && (
											<TableCell className='font-semibold text-ca-heading'>
												{formatNumber(group.totals.price_total, 2)}
											</TableCell>
										)}
										{cols.isVisible('real_price') && (
											<TableCell className='font-semibold text-ca-heading'>
												{formatNumber(group.totals.real_price_total, 2)}
											</TableCell>
										)}
										{cols.isVisible('profit') && (
											<TableCell className='font-semibold text-ca-heading'>
												{formatNumber(group.totals.profit_total, 2)}
											</TableCell>
										)}
									</TableRow>
								</Fragment>
							))
						)}
						<TableRow className='bg-ca-heading dark:bg-ca-header'>
							<TableCell className='bg-ca-heading dark:bg-ca-header text-white' colSpan={labelSpan}>
								Jami:
							</TableCell>
							{cols.isVisible('count') && <TableCell className='bg-ca-heading dark:bg-ca-header font-semibold text-white'>{products.totals.count}</TableCell>}
							{cols.isVisible('price') && (
								<TableCell className='bg-ca-heading dark:bg-ca-header font-semibold text-white'>
									{formatNumber(products.totals.price_total, 2)}
								</TableCell>
							)}
							{cols.isVisible('real_price') && (
								<TableCell className='bg-ca-heading dark:bg-ca-header font-semibold text-white'>
									{formatNumber(products.totals.real_price_total, 2)}
								</TableCell>
							)}
							{cols.isVisible('profit') && (
								<TableCell className='bg-ca-heading dark:bg-ca-header font-semibold text-white'>
									{formatNumber(products.totals.profit_total, 2)}
								</TableCell>
							)}
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</>
	);
}
