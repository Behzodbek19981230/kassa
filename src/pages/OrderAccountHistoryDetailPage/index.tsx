import { Fragment, useMemo, useState } from 'react';
import { FaArrowLeft, FaCoins, FaDownload, FaExclamationTriangle, FaUndo } from 'react-icons/fa';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	useNotification,
} from '@/components/ui';
import { loadBlobIntoTab, openPendingTab } from '@/lib/blob';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useOrderAccountHistoryProductsQuery } from '@/services/order-account-history/order-account-history.queries';
import { orderAccountHistoryService } from '@/services/order-account-history/order-account-history.service';
import type { OrderAccountHistoryProductItem } from '@/services/order-account-history/order-account-history.types';
import { useVozvratCalculateMutation } from '@/services/vozvrat/vozvrat.queries';
import type { VozvratCalculateResponse, VozvratCartItemInput } from '@/services/vozvrat/vozvrat.types';
import EditGivenCountModal from '@/pages/OrderAccountHistoryDetailPage/components/EditGivenCountModal';
import ConfirmVozvratModal from '@/pages/VozvratPage/components/ConfirmVozvratModal';

type PrintRole = 'xodim' | 'sklad' | 'mijoz' | 'admin';

export default function OrderAccountHistoryDetailPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const orderId = id ? Number(id) : undefined;

	const { data, isLoading, isError } = useOrderAccountHistoryProductsQuery(orderId);
	const { notify } = useNotification();
	const { canWrite } = useCurrentCompany();
	const [printingRole, setPrintingRole] = useState<PrintRole | null>(null);
	const [editingItem, setEditingItem] = useState<OrderAccountHistoryProductItem | null>(null);

	const today = new Date().toISOString().slice(0, 10);
	const [vozvratOpen, setVozvratOpen] = useState(false);
	const [calcResult, setCalcResult] = useState<VozvratCalculateResponse | null>(null);
	const calculateMutation = useVozvratCalculateMutation();

	const vozvratItems: VozvratCartItemInput[] = useMemo(() => {
		if (!data) return [];
		return data.products.groups.flatMap((g) =>
			g.items
				.filter((item) => item.remaining_after_vozvrat > 0)
				.map((item) => ({
					warehouse: item.warehouse,
					brand: item.brand,
					product_category: item.product_category,
					size: item.size,
					type: item.type,
					type_sklad: item.type_sklad,
					count: item.remaining_after_vozvrat,
					price: item.price,
				})),
		);
	}, [data]);

	function handleOpenVozvrat() {
		if (!data) return;
		if (vozvratItems.length === 0) {
			notify({ title: "Vozvrat qilib bo'lmaydi", text: 'Bu buyurtmada qaytariladigan mahsulot topilmadi.' });
			return;
		}
		calculateMutation.mutate(
			{ client: data.order.client, date: today, items: vozvratItems },
			{
				onSuccess: (result) => {
					setCalcResult(result);
					setVozvratOpen(true);
				},
				onError: (err) => {
					notify({ title: 'Xatolik', text: getApiErrorMessage(err, 'Hisoblashda xatolik yuz berdi') });
				},
			},
		);
	}

	async function printFor(role: PrintRole) {
		const url =
			role === 'xodim'
				? data?.actions.print_worker_url
				: role === 'sklad'
					? data?.actions.print_sklad_url
					: role === 'mijoz'
						? data?.actions.print_client_url
						: undefined;

		if (!url) {
			notify({ title: 'Tez orada', text: 'Bu chop qilish turi hali ulanmagan.' });
			return;
		}

		const tab = openPendingTab();
		setPrintingRole(role);
		try {
			const blob = await orderAccountHistoryService.printByUrl(url);
			loadBlobIntoTab(blob, tab);
		} catch {
			tab?.close();
			notify({ title: 'Xatolik', text: "PDF yuklab bo'lmadi" });
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
				<FaExclamationTriangle /> Buyurtma topilmadi
			</div>
		);
	}

	const { order, report, products } = data;

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
						disabled={printingRole === 'xodim'}
						onClick={() => printFor('xodim')}
					>
						<FaDownload className='mr-1.5' />{' '}
						{printingRole === 'xodim' ? 'Yuklanmoqda...' : 'Chop qilish Xodim uchun'}
					</Button>
					<Button
						type='button'
						variant='primary'
						size='xs'
						disabled={printingRole === 'sklad'}
						onClick={() => printFor('sklad')}
					>
						<FaDownload className='mr-1.5' />{' '}
						{printingRole === 'sklad' ? 'Yuklanmoqda...' : 'Chop qilish Sklad uchun'}
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
					<Button
						type='button'
						variant='danger'
						size='xs'
						disabled={!canWrite || calculateMutation.isPending}
						onClick={handleOpenVozvrat}
					>
						<FaUndo className='mr-1.5' />{' '}
						{calculateMutation.isPending ? 'Hisoblanmoqda...' : 'Vozvrat qilish'}
					</Button>
				</div>
			</div>

			<div className='mb-5 rounded-[3px] bg-white p-5 shadow-sm'>
				<h4 className='mb-4 text-sm font-semibold text-ca-heading'>Hisobot</h4>

				<div className='-mx-2.5 flex flex-wrap gap-y-3 text-xs'>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>Dollar kursi:</span>{' '}
						<span className='font-bold text-ca-orange'>{formatNumber(report.exchange_rate)}</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2' />

					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>Jami to'lanadigan summa ($):</span>{' '}
						<span className='font-bold text-ca-orange'>{formatNumber(report.payable_amount, 2)} $</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-heading'>To'langan summa dollarda ($):</span>{' '}
						<span className='font-bold text-ca-heading'>{formatNumber(report.sum_dollar, 2)} $</span>
					</div>

					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>To'langan summa ($):</span>{' '}
						<span className='font-bold text-ca-orange'>{formatNumber(report.paid_amount, 2)} $</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-heading'>To'langan summa so'mda:</span>{' '}
						<span className='font-bold text-ca-heading'>{formatNumber(report.sum_som)}</span>
					</div>

					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>Chegirma ($):</span>{' '}
						<span className='font-bold text-ca-orange'>{formatNumber(report.discount_amount, 2)} $</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-heading'>To'langan summa kartada:</span>{' '}
						<span className='font-bold text-ca-heading'>{formatNumber(report.sum_cart, 2)}</span>
					</div>

					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>Qolgan qarz ($):</span>{' '}
						<span className='font-bold text-ca-orange'>{formatNumber(report.total_debt, 2)} $</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-heading'>Qaytim:</span>{' '}
						<span className='font-bold text-ca-heading'>
							{formatNumber(report.zdacha_sum)} ({formatNumber(report.zdacha_dollar, 2)} $)
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
						{products.groups.length === 0 ? (
							<TableRow>
								<TableCell colSpan={11} className='text-center text-ca-text'>
									Mahsulotlar topilmadi
								</TableCell>
							</TableRow>
						) : (
							products.groups.map((group) => (
								<Fragment key={group.brand_name}>
									<TableRow>
										<TableCell colSpan={11} className='bg-ca-aqua/15 font-semibold text-ca-aqua'>
											{group.brand_name}
										</TableCell>
									</TableRow>
									{group.items.map((item, index) => (
										<Fragment key={item.id}>
											<TableRow>
												<TableCell>{index + 1}.</TableCell>
												<TableCell>{item.type_sklad_name}</TableCell>
												<TableCell>{item.brand_name}</TableCell>
												<TableCell>{item.product_category_name}</TableCell>
												<TableCell>{item.size}</TableCell>
												<TableCell>{item.type_name}</TableCell>
												<TableCell>
													<span className='inline-flex items-center gap-1.5'>
														{item.count}
														{item.has_vozvrat && (
															<Tooltip content={`Qaytarilgan: ${item.vozvrat_count} ta`}>
																<FaUndo className='text-ca-orange' />
															</Tooltip>
														)}
													</span>
												</TableCell>
												<TableCell>
													<button
														type='button'
														className='inline-flex items-center gap-1.5 font-semibold text-ca-green hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline'
														disabled={!canWrite}
														onClick={() => setEditingItem(item)}
													>
														{item.given_count} <FaCoins className='text-ca-orange' />
													</button>
												</TableCell>
												<TableCell>
													<span className='inline-flex items-center gap-1.5'>
														{formatNumber(item.price)}
														{item.is_price_diff && (
															<Tooltip content="Narxlarda tafovut">
																<FaExclamationTriangle className='text-ca-orange' />
															</Tooltip>
														)}
													</span>
												</TableCell>
												<TableCell>{formatNumber(item.real_price)}</TableCell>
												<TableCell
													className={`font-semibold ${item.profit < 0 ? 'text-ca-red' : 'text-ca-green'}`}
												>
													{formatNumber(item.profit)}
												</TableCell>
											</TableRow>
											{item.has_vozvrat &&
												item.vozvrat_products.map((vp) => (
													<TableRow key={vp.id} className='bg-ca-orange/10'>
														<TableCell colSpan={11} className='py-1.5 text-[11px] text-ca-orange'>
															<span className='inline-flex flex-wrap items-center gap-1.5'>
																<FaUndo />
																<span className='font-semibold'>
																	{vp.vozvrat_order_date_label} sanada {formatNumber(vp.count)} ta
																	qaytarilgan
																</span>
																<span>({formatNumber(vp.price_total, 2)} $)</span>
																<Link
																	to={`/vozvrat-order-history/${vp.vozvrat_order}`}
																	className='font-semibold underline hover:no-underline'
																>
																	Vozvratni ko'rish
																</Link>
															</span>
														</TableCell>
													</TableRow>
												))}
										</Fragment>
									))}
									<TableRow className='bg-ca-silver'>
										<TableCell colSpan={6} className='font-semibold text-ca-heading'>
											Jami:
										</TableCell>
										<TableCell className='font-semibold text-ca-heading'>{group.totals.count}</TableCell>
										<TableCell className='font-semibold text-ca-heading'>{group.totals.given_count}</TableCell>
										<TableCell className='font-semibold text-ca-heading'>
											{formatNumber(group.totals.price_total)}
										</TableCell>
										<TableCell className='font-semibold text-ca-heading'>
											{formatNumber(group.totals.real_price_total)}
										</TableCell>
										<TableCell className='font-semibold text-ca-heading'>
											{formatNumber(group.totals.profit_total)}
										</TableCell>
									</TableRow>
								</Fragment>
							))
						)}
						<TableRow className='bg-ca-heading'>
							<TableCell className='bg-ca-heading text-white' colSpan={6}>
								Jami:
							</TableCell>
							<TableCell className='bg-ca-heading font-semibold text-white'>{products.totals.count}</TableCell>
							<TableCell className='bg-ca-heading font-semibold text-white'>
								{products.totals.given_count}
							</TableCell>
							<TableCell className='bg-ca-heading font-semibold text-white'>
								{formatNumber(products.totals.price_total)}
							</TableCell>
							<TableCell className='bg-ca-heading font-semibold text-white'>
								{formatNumber(products.totals.real_price_total)}
							</TableCell>
							<TableCell className='bg-ca-heading font-semibold text-white'>
								{formatNumber(products.totals.profit_total)}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>

			<EditGivenCountModal
				open={editingItem !== null}
				setOpen={(open) => {
					if (!open) setEditingItem(null);
				}}
				item={editingItem}
				orderId={orderId}
			/>

			{vozvratOpen && calcResult && (
				<ConfirmVozvratModal
					open={vozvratOpen}
					setOpen={setVozvratOpen}
					companyId={order.company}
					clientId={order.client}
					date={today}
					items={vozvratItems}
					totalProductSum={calcResult.totals.total_product_sum}
					exchangeRate={report.exchange_rate || calcResult.exchange_rate}
					oldDebt={report.total_debt}
					onConfirmed={(message) => {
						notify({ title: message });
						setVozvratOpen(false);
						setCalcResult(null);
					}}
				/>
			)}
		</>
	);
}
