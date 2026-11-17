import { createColumnHelper, type PaginationState, type SortingState } from '@tanstack/react-table';
import { useState, type ReactNode } from 'react';
import { FaArrowLeft, FaExclamationTriangle, FaMoneyBillWave, FaReceipt } from 'react-icons/fa';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, DataTable, DatePicker, Panel } from '@/components/ui';
import { formatDateTime } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { cn } from '@/lib/utils';
import { personName } from '@/pages/system/UserPayrollPage/utils';
import { useCardPaymentListQuery, useCardPaymentTotalsQuery } from '@/services/card-payment/card-payment.queries';
import {
	CARD_PAYMENT_DIRECTION_LABELS,
	type CardPayment,
	type CardPaymentClientSource,
	type CardPaymentDirection,
	type CardPaymentExpenseSource,
} from '@/services/card-payment/card-payment.types';
import { usePaymentCardQuery } from '@/services/payment-card/payment-card.queries';
import { paymentCardTypeLabel } from '@/services/payment-card/payment-card.types';
import { CardStatusPill, PaymentCardVisual } from '@/pages/system/PaymentCardPage/components/CardIdentity';

const columnHelper = createColumnHelper<CardPayment>();

/** A relation sent either as an id (detail beside it) or as the nested object itself. */
function related<T extends { id: number }>(ref: number | T | null | undefined, detail: T | null | undefined) {
	const nested = typeof ref === 'object' && ref !== null ? ref : null;
	return { id: nested?.id ?? (typeof ref === 'number' ? ref : detail?.id), detail: detail ?? nested };
}

const clientNameOf = (source: CardPaymentClientSource | null) => source?.client_detail?.fio || source?.client_name || '';
const expenseNameOf = (source: CardPaymentExpenseSource | null) => source?.nomi || '';

/** Name of the client or expense, with the record's number beside it. */
function SourceCell({ id, name }: { id?: number; name: string }) {
	if (!id && !name) return <>—</>;
	return (
		<span className='whitespace-nowrap'>
			{name || '—'}
			{id ? <span className='ml-1.5 text-xs text-ca-text'>#{id}</span> : null}
		</span>
	);
}

function DirectionPill({ direction }: { direction?: CardPaymentDirection | null }) {
	if (!direction) return <>—</>;
	return (
		<span
			className={cn(
				'inline-flex rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
				direction === 'in' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-ca-red',
			)}
		>
			{CARD_PAYMENT_DIRECTION_LABELS[direction] ?? direction}
		</span>
	);
}

const columns = [
	columnHelper.accessor('created_time', {
		header: 'Sana va vaqt',
		meta: { align: 'left' },
		cell: (info) => <span className='whitespace-nowrap'>{formatDateTime(info.getValue(), '—')}</span>,
	}),
	columnHelper.accessor('direction', {
		header: "Yo'nalish",
		meta: { align: 'center' },
		enableSorting: false,
		cell: (info) => <DirectionPill direction={info.getValue()} />,
	}),
	columnHelper.accessor('amount', {
		header: 'Summa',
		meta: { align: 'right' },
		cell: (info) => {
			const direction = info.row.original.direction;
			return (
				<span
					className={cn(
						'font-semibold whitespace-nowrap',
						direction === 'in' && 'text-emerald-600',
						direction === 'out' && 'text-ca-red',
					)}
				>
					{formatNumber(info.getValue()) || '—'}
				</span>
			);
		},
	}),
	columnHelper.accessor('client_detail', {
		header: 'Mijoz',
		meta: { align: 'left' },
		enableSorting: false,
		cell: (info) => info.getValue()?.fio || '—',
	}),
	columnHelper.display({
		id: 'order',
		header: 'Savdo',
		meta: { align: 'left' },
		cell: ({ row }) => {
			const { id, detail } = related(row.original.order, row.original.order_detail);
			return <SourceCell id={id} name={row.original.order_client_name || clientNameOf(detail)} />;
		},
	}),
	columnHelper.display({
		id: 'debt_repayment',
		header: "Qarz to'lovi",
		meta: { align: 'left' },
		cell: ({ row }) => {
			const { id, detail } = related(row.original.debt_repayment, row.original.debt_repayment_detail);
			return <SourceCell id={id} name={row.original.debt_repayment_client_name || clientNameOf(detail)} />;
		},
	}),
	columnHelper.display({
		id: 'expense',
		header: 'Xarajat',
		meta: { align: 'left' },
		cell: ({ row }) => {
			const { id, detail } = related(row.original.expense, row.original.expense_detail);
			return <SourceCell id={id} name={row.original.expense_name || expenseNameOf(detail)} />;
		},
	}),
	columnHelper.accessor('note', {
		header: 'Izoh',
		meta: { align: 'left' },
		enableSorting: false,
		cell: (info) => (
			<span className='block max-w-[260px] truncate' title={info.getValue() ?? undefined}>
				{info.getValue() || '—'}
			</span>
		),
	}),
	columnHelper.accessor('created_by_detail', {
		header: 'Kim kiritgan',
		meta: { align: 'left' },
		enableSorting: false,
		cell: (info) => personName(info.getValue()) || '—',
	}),
];

function TotalCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: 'green' | 'blue' }) {
	return (
		<div className='flex items-center gap-4 rounded-lg border border-ca-border bg-ca-silver-light px-4 py-3'>
			<span
				className={cn(
					'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg',
					tone === 'green' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-ca-theme/15 text-ca-theme',
				)}
			>
				{icon}
			</span>
			<div className='min-w-0'>
				<div className='truncate text-xs text-ca-heading'>{label}</div>
				<div className='text-xl font-bold text-ca-heading'>{value}</div>
			</div>
		</div>
	);
}

/** Payments received on one store card: read-only list with the card's totals above it. */
export default function PaymentCardPaymentsPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const cardId = Number(id) || 0;
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [sorting, setSorting] = useState<SortingState>([{ id: 'created_time', desc: true }]);
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : '-created_time';
	const dateRange = { start_date: startDate || undefined, end_date: endDate || undefined };

	const { data: card } = usePaymentCardQuery(cardId || undefined);
	const totalsQuery = useCardPaymentTotalsQuery({ payment_card: cardId, ...dateRange }, cardId > 0);
	const paymentsQuery = useCardPaymentListQuery(
		{
			payment_card: cardId,
			...dateRange,
			ordering,
			page: pagination.pageIndex + 1,
			limit: pagination.pageSize,
		},
		cardId > 0,
	);

	// The totals may come as one row per card; this card's row wins over the overall figures.
	const totals = totalsQuery.data;
	const cardTotals = totals?.cards.find((row) => row.payment_card === cardId) ?? totals;
	const payments = paymentsQuery.data?.results ?? [];
	const paymentsMeta = paymentsQuery.data?.pagination;

	const setDate = (setter: (value: string) => void) => (value: string) => {
		setter(value);
		setPagination((p) => ({ ...p, pageIndex: 0 }));
	};

	return (
		<Panel
			title="Karta to'lovlari"
			bodyClassName='p-0'
			actions={
				<Button
					type='button'
					variant='info'
					size='xs'
					// Going back keeps the card list's page; a directly opened link has no history to return to.
					onClick={() => (location.key === 'default' ? navigate('/system/payment-cards') : navigate(-1))}
				>
					<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
				</Button>
			}
			onReload={() => {
				totalsQuery.refetch();
				paymentsQuery.refetch();
			}}
		>
			<div className='space-y-5 p-4'>
				<div className='flex flex-col gap-5 lg:flex-row'>
					{card ? (
						<PaymentCardVisual card={card} className='shrink-0 lg:w-[340px]' />
					) : (
						<div className='aspect-[1.586/1] w-full max-w-[340px] shrink-0 animate-pulse rounded-2xl bg-ca-silver lg:w-[340px]' />
					)}

					<div className='flex min-w-0 flex-1 flex-col gap-4'>
						<div>
							<div className='flex flex-wrap items-center gap-3'>
								<h2 className='text-xl font-bold text-ca-heading'>
									{card ? `${paymentCardTypeLabel(card)} •• ${card.last4}` : '…'}
								</h2>
								{card && <CardStatusPill active={card.is_active} />}
							</div>
							{card && (
								<div className='mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ca-text'>
									<span>
										Nomi: <span className='font-semibold text-ca-heading'>{card.name}</span>
									</span>
									<span>
										Egasi: <span className='font-semibold text-ca-heading'>{card.owner_name || '—'}</span>
									</span>
									<span>
										Bank: <span className='font-semibold text-ca-heading'>{card.bank || '—'}</span>
									</span>
									{card.note && <span className='basis-full'>Izoh: {card.note}</span>}
								</div>
							)}
						</div>

						{totalsQuery.isError ? (
							<div className='flex items-center gap-2 rounded-lg border border-ca-danger-border bg-ca-danger-bg px-4 py-3 text-sm text-ca-red'>
								<FaExclamationTriangle /> {getApiErrorMessage(totalsQuery.error, 'Xatolik yuz berdi')}
							</div>
						) : (
							<div
								className={cn(
									'grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2',
									(!totals || totalsQuery.isFetching) && 'opacity-60',
								)}
							>
								<TotalCard
									icon={<FaMoneyBillWave />}
									label='Jami summa'
									value={cardTotals ? formatNumber(cardTotals.total) : '—'}
									tone='green'
								/>
								<TotalCard
									icon={<FaReceipt />}
									label="To'lovlar soni"
									value={cardTotals ? `${formatNumber(cardTotals.count)} ta` : '—'}
									tone='blue'
								/>
							</div>
						)}

						<div className='mt-auto flex flex-wrap items-end gap-2'>
							<div className='w-40'>
								<label className='mb-1 block text-xs font-semibold text-ca-heading'>Boshlanish sana</label>
								<DatePicker value={startDate} onChange={setDate(setStartDate)} placeholder='Boshlanish sana' />
							</div>
							<div className='w-40'>
								<label className='mb-1 block text-xs font-semibold text-ca-heading'>Tugash sana</label>
								<DatePicker value={endDate} onChange={setDate(setEndDate)} placeholder='Tugash sana' />
							</div>
							{(startDate || endDate) && (
								<Button
									type='button'
									variant='white'
									size='sm'
									onClick={() => {
										setStartDate('');
										setEndDate('');
										setPagination((p) => ({ ...p, pageIndex: 0 }));
									}}
								>
									Sanani tozalash
								</Button>
							)}
						</div>
					</div>
				</div>

				<DataTable
					columns={columns}
					data={payments}
					manualSorting
					sorting={sorting}
					onSortingChange={setSorting}
					enableSorting
					manualPagination
					pageCount={paymentsMeta?.lastPage ?? -1}
					totalRows={paymentsMeta?.total}
					pagination={pagination}
					onPaginationChange={setPagination}
					enablePagination
					enableGlobalFilter={false}
					enableColumnFilters={false}
					enableColumnVisibility
					columnVisibilityKey='payment-card-payments'
					enableStriping
					isLoading={paymentsQuery.isLoading || paymentsQuery.isFetching}
					emptyMessage={
						paymentsQuery.isError
							? getApiErrorMessage(paymentsQuery.error, 'Xatolik yuz berdi')
							: "To'lovlar mavjud emas"
					}
					emptyIcon={paymentsQuery.isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</div>
		</Panel>
	);
}
