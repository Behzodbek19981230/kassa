import { isAxiosError } from 'axios';
import { type ReactNode, useEffect } from 'react';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
	Badge,
	Button,
	Panel,
	Skeleton,
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
import { formatTashkentDate, formatTashkentDateTime } from '@/pages/TwoStageImport/utils';
import { useOrderDeleteHistoryQuery } from '@/services/order-delete-history/order-delete-history.queries';

const LIST_PATH = '/cart-drafts/deleted-orders';

const formatMoney = (value: unknown) => formatNumber(Number(value) || 0, 2);

interface InfoRowProps {
	label: string;
	children: ReactNode;
}

function InfoRow({ label, children }: InfoRowProps) {
	return (
		<div className='flex gap-3 py-1'>
			<span className='w-44 shrink-0 font-semibold text-ca-heading'>{label}:</span>
			<span className='min-w-0 wrap-break-word text-ca-heading'>{children}</span>
		</div>
	);
}

/** Read-only snapshot of one deleted order (`/order-delete-history/{id}/`), opened from the history list. */
export default function OrderDeleteHistoryDetailPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const { id } = useParams();
	const auditId = Number(id) || undefined;
	const { notify } = useNotification();
	const { data, isLoading, isError, error } = useOrderDeleteHistoryQuery(auditId);
	const isNotFound = isAxiosError(error) && error.response?.status === 404;

	// The audit is purged after a month, so a stale link can 404 — drop back to the list.
	useEffect(() => {
		if (!isNotFound) return;
		notify({ title: 'Bu tarix topilmadi yoki saqlash muddati tugagan.' });
		navigate(LIST_PATH, { replace: true });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isNotFound]);

	const products = data?.products ?? [];
	const totals = products.reduce(
		(acc, p) => {
			const count = Number(p.product_data.count) || 0;
			acc.count += count;
			acc.given += Number(p.product_data.given_count) || 0;
			acc.sum += count * (Number(p.product_data.price) || 0);
			return acc;
		},
		{ count: 0, given: 0, sum: 0 },
	);

	const order = data?.order_data;

	return (
		<Panel
			title={
				<span className='flex items-center gap-2'>
					O'chirilgan buyurtma tafsilotlari <Badge variant='default'>Faqat ko'rish</Badge>
				</span>
			}
			actions={
				<Button
					type='button'
					variant='info'
					size='xs'
					// Going back keeps the list's page; a directly opened link has no history to return to.
					onClick={() => (location.key === 'default' ? navigate(LIST_PATH) : navigate(-1))}
				>
					<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
				</Button>
			}
		>
			{isLoading ? (
				<>
					<div className='mb-4 grid gap-4 rounded-[3px] border border-ca-border p-4 md:grid-cols-2'>
						{Array.from({ length: 2 }).map((_, col) => (
							<div key={col} className='space-y-2'>
								{Array.from({ length: 6 }).map((_, row) => (
									<Skeleton key={row} className='h-4 w-full' />
								))}
							</div>
						))}
					</div>
					<div className='space-y-2'>
						{Array.from({ length: 5 }).map((_, row) => (
							<Skeleton key={row} className='h-6 w-full' />
						))}
					</div>
				</>
			) : isError || !data ? (
				!isNotFound && (
					<div className='flex items-center justify-center gap-2 p-5 text-xs text-ca-red'>
						<FaExclamationTriangle /> {getApiErrorMessage(error, 'Xatolik yuz berdi')}
					</div>
				)
			) : (
				<>
					<div className='mb-4 grid rounded-[3px] border border-ca-border text-xs md:grid-cols-2'>
						<div className='p-4 md:border-r md:border-ca-border'>
							<InfoRow label='Mijoz'>{data.client_name || '-'}</InfoRow>
							<InfoRow label='Telefon'>{data.client_phone || '-'}</InfoRow>
							<InfoRow label='Buyurtma sanasi'>{formatTashkentDate(data.order_date)}</InfoRow>
							<InfoRow label='Kim yaratgan'>{data.original_created_by_name || '-'}</InfoRow>
							<InfoRow label="Kim o'chirgan">{data.deleted_by_name || '-'}</InfoRow>
							<InfoRow label="O'chirilgan vaqt">{formatTashkentDateTime(data.deleted_at)}</InfoRow>
						</div>
						<div className='border-t border-ca-border p-4 md:border-t-0'>
							<InfoRow label="To'lanadigan summa ($)">{formatMoney(order?.all_product_sum)}</InfoRow>
							<InfoRow label="To'langan summa ($)">{formatMoney(order?.all_summ_dollar)}</InfoRow>
							<InfoRow label='Chegirma ($)'>{formatMoney(order?.discount_amount)}</InfoRow>
							<InfoRow label='Eski qarz ($)'>{formatMoney(order?.total_debt_old)}</InfoRow>
							<InfoRow label='Bugungi qarz ($)'>{formatMoney(order?.total_debt_today)}</InfoRow>
							<InfoRow label='Yakuniy qarz ($)'>
								<span className='font-semibold text-ca-red'>{formatMoney(order?.total_debt)}</span>
							</InfoRow>
							<InfoRow label='Izoh'>{order?.order_commit || '-'}</InfoRow>
						</div>
					</div>

					<h5 className='mb-2 text-sm font-semibold text-ca-heading'>O'chirilgan mahsulotlar</h5>
					<div className='overflow-x-auto rounded-[3px] border border-ca-border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>#</TableHead>
									<TableHead>Model</TableHead>
									<TableHead>Mahsulot</TableHead>
									<TableHead>O'lcham</TableHead>
									<TableHead>Tip</TableHead>
									<TableHead>Sklad turi</TableHead>
									<TableHead className='text-right'>Soni</TableHead>
									<TableHead className='text-right'>Berilgan</TableHead>
									<TableHead className='text-right'>Narxi ($)</TableHead>
									<TableHead className='text-right'>Jami ($)</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{products.length === 0 ? (
									<TableRow>
										<TableCell colSpan={10} className='py-6 text-center text-ca-text'>
											Bu buyurtmada saqlangan mahsulotlar mavjud emas.
										</TableCell>
									</TableRow>
								) : (
									<>
										{products.map((p, index) => {
											const count = Number(p.product_data.count) || 0;
											const price = Number(p.product_data.price) || 0;
											return (
												<TableRow key={p.id}>
													<TableCell>{index + 1}</TableCell>
													<TableCell>{p.brand_name || '-'}</TableCell>
													<TableCell>{p.product_category_name || '-'}</TableCell>
													<TableCell>
														{p.product_data.size != null ? formatNumber(p.product_data.size) : '-'}
													</TableCell>
													<TableCell>{p.type_name || '-'}</TableCell>
													<TableCell>{p.type_sklad_name || '-'}</TableCell>
													<TableCell className='text-right'>{formatNumber(count)}</TableCell>
													<TableCell className='text-right'>
														{formatNumber(Number(p.product_data.given_count) || 0)}
													</TableCell>
													<TableCell className='text-right'>{formatMoney(price)}</TableCell>
													<TableCell className='text-right'>{formatMoney(count * price)}</TableCell>
												</TableRow>
											);
										})}
										<TableRow className='bg-ca-panel-inverse font-semibold text-white'>
											<TableCell colSpan={6}>Jami:</TableCell>
											<TableCell className='text-right'>{formatNumber(totals.count)}</TableCell>
											<TableCell className='text-right'>{formatNumber(totals.given)}</TableCell>
											<TableCell />
											<TableCell className='text-right'>{formatMoney(totals.sum)}</TableCell>
										</TableRow>
									</>
								)}
							</TableBody>
						</Table>
					</div>
				</>
			)}
		</Panel>
	);
}
