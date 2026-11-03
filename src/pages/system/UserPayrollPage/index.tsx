import { createColumnHelper, type SortingState } from '@tanstack/react-table';
import { useState, type ReactNode } from 'react';
import { FaArrowLeft, FaArrowRight, FaCalculator, FaDatabase, FaExclamationTriangle, FaGift, FaMinusCircle, FaPen, FaPlus, FaUser } from 'react-icons/fa';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, DataTable, Panel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import PayrollActionModal from '@/pages/system/UserPayrollPage/PayrollActionModal';
import SalaryRateModal from '@/pages/system/UserPayrollPage/SalaryRateModal';
import {
	currentYearMonth,
	fmtDateTime,
	fmtDollar,
	fmtMixed,
	fmtSom,
	MONTH_TABS,
	personName,
	toNumber,
	TRANSACTION_TYPES,
	TYPE_META,
} from '@/pages/system/UserPayrollPage/utils';
import { usePayrollSummaryQuery, usePayrollTransactionListQuery } from '@/services/payroll/payroll.queries';
import type { PayrollTransaction, PayrollTransactionType } from '@/services/payroll/payroll.types';
import { useUserQuery } from '@/services/user/user.queries';

const columnHelper = createColumnHelper<PayrollTransaction>();

const ALL_TYPES = 'ALL';

/** Year and month live in the URL, so a reload or a shared link opens the same month. */
function useYearMonth() {
	const [searchParams, setSearchParams] = useSearchParams();
	const fallback = currentYearMonth();
	const yearParam = Number(searchParams.get('year'));
	const monthParam = Number(searchParams.get('month'));
	const year = Number.isInteger(yearParam) && yearParam >= 1000 && yearParam <= 9999 ? yearParam : fallback.year;
	const month = Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12 ? monthParam : fallback.month;

	const set = (next: { year?: number; month?: number }) =>
		setSearchParams(
			(prev) => {
				const params = new URLSearchParams(prev);
				params.set('year', String(next.year ?? year));
				params.set('month', String(next.month ?? month));
				return params;
			},
			{ replace: true },
		);

	return { year, month, set };
}

function Pill({ className, children }: { className: string; children: ReactNode }) {
	return (
		<span className={cn('inline-flex items-center rounded-md px-3 py-1 text-base font-bold whitespace-nowrap', className)}>
			{children}
		</span>
	);
}

function StatCard({
	tone,
	icon,
	title,
	children,
	footer,
}: {
	tone: 'blue' | 'red' | 'green' | 'amber';
	icon: ReactNode;
	title: string;
	children: ReactNode;
	footer?: ReactNode;
}) {
	const tones = {
		blue: 'border-ca-theme/70 bg-ca-theme/10 [&_.stat-icon]:bg-ca-theme/20 [&_.stat-icon]:text-ca-theme',
		red: 'border-red-500/60 bg-red-500/10 [&_.stat-icon]:bg-red-500/20 [&_.stat-icon]:text-red-500',
		green: 'border-emerald-500/60 bg-emerald-500/10 [&_.stat-icon]:bg-emerald-500/20 [&_.stat-icon]:text-emerald-500',
		amber: 'border-amber-500/60 bg-amber-500/10 [&_.stat-icon]:bg-amber-500/20 [&_.stat-icon]:text-amber-500',
	};
	return (
		<div className={cn('flex min-w-0 flex-1 items-center gap-4 rounded-xl border px-4 py-3', tones[tone])}>
			<span className='stat-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl'>{icon}</span>
			<div className='min-w-0'>
				<div className='mb-1.5 text-sm font-semibold text-ca-heading'>{title}</div>
				<div className='flex flex-wrap gap-1.5'>{children}</div>
				{footer && <div className='mt-1.5 text-[11px] text-ca-text'>{footer}</div>}
			</div>
		</div>
	);
}

function Connector({ children }: { children: ReactNode }) {
	return <span className='hidden shrink-0 items-center text-lg text-ca-heading xl:flex'>{children}</span>;
}

/**
 * Money pills for a card: the dollar amount and, when present, the so'm amount.
 * `prefix` marks penalties ("− $ 300").
 */
function MoneyPills({ dollar, som, className, prefix = '' }: { dollar: number; som: number; className: string; prefix?: string }) {
	return (
		<>
			{(dollar !== 0 || som === 0) && <Pill className={className}>{`${dollar ? prefix : ''}${fmtDollar(dollar)}`}</Pill>}
			{som !== 0 && <Pill className={className}>{`${prefix}${fmtSom(som)}`}</Pill>}
		</>
	);
}

export default function UserPayrollPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const userId = Number(id) || 0;
	const { year, month, set } = useYearMonth();
	const [typeFilter, setTypeFilter] = useState<PayrollTransactionType | typeof ALL_TYPES>(ALL_TYPES);
	const [sorting, setSorting] = useState<SortingState>([{ id: 'transaction_time', desc: true }]);
	const [actionOpen, setActionOpen] = useState(false);
	const [rateOpen, setRateOpen] = useState(false);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : '-transaction_time';

	// Summary and transactions load in parallel; both refetch when the year or month changes.
	const summaryQuery = usePayrollSummaryQuery({ user: userId, year, month }, userId > 0);
	const transactionsQuery = usePayrollTransactionListQuery(
		{
			user: userId,
			year,
			month,
			ordering,
			limit: 100,
			transaction_type: typeFilter === ALL_TYPES ? undefined : typeFilter,
		},
		userId > 0,
	);
	const { data: userDetail } = useUserQuery(userId || undefined);

	const data = summaryQuery.data;
	const s = data?.summary;
	const user = data?.user;
	const activeMonths = new Set(data && data.year === year ? data.active_months : []);
	const transactions = transactionsQuery.data?.results ?? [];
	const years = Array.from({ length: 6 }, (_, i) => currentYearMonth().year + 1 - i);
	if (!years.includes(year)) years.push(year);

	const columns = [
		columnHelper.display({
			id: 'total',
			header: "Jami to'langan",
			meta: { align: 'left' },
			cell: ({ row }) => {
				const t = row.original;
				const text = fmtMixed(toNumber(t.summa_dollar), toNumber(t.summa_som) + toNumber(t.summa_karta));
				return t.transaction_type === 'PENALTY' && text !== '—' ? (
					<span className='font-semibold text-red-500'>− {text}</span>
				) : (
					<span className='font-semibold'>{text}</span>
				);
			},
		}),
		...(['summa_dollar', 'summa_som', 'summa_karta'] as const).map((field) =>
			columnHelper.accessor(field, {
				header: field === 'summa_dollar' ? 'Summa dollar' : field === 'summa_som' ? "Summa so'm" : 'Summa karta',
				meta: { align: 'left' },
				cell: ({ row, getValue }) => {
					const value = toNumber(getValue());
					if (!value) return '—';
					const text = field === 'summa_dollar' ? fmtDollar(value) : fmtSom(value);
					return row.original.transaction_type === 'PENALTY' ? <span className='text-red-500'>− {text}</span> : text;
				},
			}),
		),
		columnHelper.accessor('transaction_type', {
			header: 'Tip',
			meta: { align: 'left' },
			cell: ({ getValue }) => {
				const meta = TYPE_META[getValue()];
				return (
					<span className={cn('inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold', meta?.badge)}>
						{meta?.label ?? getValue()}
					</span>
				);
			},
		}),
		columnHelper.accessor('transaction_time', {
			header: 'Sana va vaqt',
			meta: { align: 'left' },
			cell: ({ getValue }) => <span className='whitespace-nowrap'>{fmtDateTime(getValue())}</span>,
		}),
		columnHelper.accessor('note', {
			header: 'Izoh',
			meta: { align: 'left' },
			cell: ({ getValue }) => getValue() || '—',
		}),
		columnHelper.accessor('created_by', {
			header: 'Kim amalga oshirdi',
			meta: { align: 'left' },
			cell: ({ row }) => personName(row.original.created_by_detail) || '—',
		}),
	];

	const summaryError = summaryQuery.isError ? getApiErrorMessage(summaryQuery.error, 'Xatolik yuz berdi') : null;

	return (
		<>
			<Panel
				title="Oylik to'lovlar tarixi"
				bodyClassName='p-0'
				actions={
					<Button
						type='button'
						variant='info'
						size='xs'
						// Going back keeps the users list's page; a directly opened link has no history to return to.
						onClick={() => (location.key === 'default' ? navigate('/system/users') : navigate(-1))}
					>
						<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
					</Button>
				}
			>
				<div className='space-y-4 p-4'>
					<div className='flex flex-wrap items-center gap-3'>
						<div className='flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ca-border bg-ca-silver'>
							{userDetail?.avatar ? (
								<img src={userDetail.avatar} alt='' className='h-full w-full object-cover' />
							) : (
								<FaUser className='text-ca-text' />
							)}
						</div>
						<h2 className='text-xl font-bold text-ca-heading'>{personName(user ?? userDetail) || '…'}</h2>
						<span className='rounded-md bg-emerald-600/20 px-3 py-1 text-sm font-bold text-emerald-500'>
							{fmtDollar(user?.oylik_dollar ?? userDetail?.oylik_dollar)}
						</span>
						<span className='rounded-md bg-ca-silver px-3 py-1 text-sm font-bold text-ca-heading'>
							{fmtSom(user?.oylik_som ?? userDetail?.oylik_som)}
						</span>
						<button
							type='button'
							aria-label="Oylik tarifini o'zgartirish"
							title="Oylik tarifini o'zgartirish"
							onClick={() => setRateOpen(true)}
							className='flex h-8 w-8 items-center justify-center rounded-md border border-ca-border text-xs text-ca-text hover:bg-ca-silver hover:text-ca-heading'
						>
							<FaPen />
						</button>
						<div className='ml-auto flex items-center gap-3'>
							<div className='w-32'>
								<Select value={String(year)} onValueChange={(v) => set({ year: Number(v) })}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{years.map((y) => (
											<SelectItem key={y} value={String(y)}>
												{y}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<button
								type='button'
								onClick={() => setActionOpen(true)}
								disabled={!s || summaryQuery.isPlaceholderData}
								className='inline-flex h-10 items-center gap-2 rounded-lg bg-ca-aqua px-5 text-sm font-semibold text-white hover:bg-[#0595ad] disabled:cursor-not-allowed disabled:opacity-60'
							>
								<FaPlus /> Oylik to'lash
							</button>
						</div>
					</div>

					<div role='tablist' className='grid grid-cols-6 overflow-hidden rounded-lg border border-ca-border md:grid-cols-12'>
						{MONTH_TABS.map((label, i) => {
							const m = i + 1;
							const active = m === month;
							return (
								<button
									key={label}
									type='button'
									role='tab'
									aria-selected={active}
									onClick={() => set({ month: m })}
									className={cn(
										'flex h-10 items-center justify-center gap-1.5 border-ca-border text-sm font-medium transition-colors not-last:border-r',
										active ? 'bg-ca-theme text-white' : 'text-ca-heading hover:bg-ca-silver',
									)}
								>
									{label}
									{activeMonths.has(m) && <span className='h-2 w-2 rounded-full bg-emerald-500' />}
								</button>
							);
						})}
					</div>

					{summaryError ? (
						<div className='flex items-center gap-2 rounded-lg border border-ca-danger-border bg-ca-danger-bg px-4 py-3 text-sm text-ca-red'>
							<FaExclamationTriangle /> {summaryError}
						</div>
					) : (
						<div
							className={cn(
								'flex flex-col gap-3 transition-opacity xl:flex-row xl:items-stretch',
								(!s || summaryQuery.isFetching) && 'opacity-60',
							)}
						>
							<StatCard tone='blue' icon={<FaDatabase />} title='Asosiy oylik'>
								<MoneyPills
									dollar={toNumber(s?.base_oylik_dollar)}
									som={toNumber(s?.base_oylik_som)}
									className='bg-emerald-600 text-white'
								/>
							</StatCard>
							<Connector>
								<FaArrowRight />
							</Connector>
							<StatCard tone='red' icon={<FaMinusCircle />} title='Jarima'>
								<MoneyPills
									dollar={toNumber(s?.penalty_dollar)}
									som={toNumber(s?.penalty_som)}
									className='bg-red-600/80 text-white'
									prefix='− '
								/>
							</StatCard>
							<Connector>
								<FaArrowRight />
							</Connector>
							<StatCard
								tone='green'
								icon={<FaCalculator />}
								title='Oylikdan berilishi kerak'
								footer={
									s && (
										<>
											Berilgan: {fmtMixed(toNumber(s.paid_dollar), toNumber(s.paid_som) + toNumber(s.paid_card), '0')}
											{' · '}
											Qolgan: {fmtMixed(toNumber(s.remaining_dollar), toNumber(s.remaining_som), '0')}
										</>
									)
								}
							>
								<MoneyPills
									dollar={toNumber(s?.payable_dollar)}
									som={toNumber(s?.payable_som)}
									className='bg-emerald-600 text-white'
								/>
							</StatCard>
							<Connector>
								<FaPlus />
							</Connector>
							<StatCard tone='amber' icon={<FaGift />} title='Bonus — alohida'>
								<MoneyPills
									dollar={toNumber(s?.bonus_dollar)}
									som={toNumber(s?.bonus_som) + toNumber(s?.bonus_card)}
									className='bg-emerald-600 text-white'
								/>
							</StatCard>
						</div>
					)}

					<div className='flex items-center gap-3'>
						<span className='text-sm text-ca-heading'>Tip:</span>
						<div className='w-52'>
							<Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL_TYPES}>Barcha turlar</SelectItem>
									{TRANSACTION_TYPES.map((t) => (
										<SelectItem key={t} value={t}>
											{t === 'SALARY' ? "Oylik to'lov" : TYPE_META[t].label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<DataTable
						columns={columns}
						data={transactions}
						manualSorting
						sorting={sorting}
						onSortingChange={setSorting}
						enableSorting
						enablePagination={false}
						enableGlobalFilter={false}
						enableColumnFilters={false}
						enableStriping
						isLoading={transactionsQuery.isLoading || transactionsQuery.isFetching}
						emptyMessage={
							transactionsQuery.isError
								? getApiErrorMessage(transactionsQuery.error, 'Xatolik yuz berdi')
								: 'Bu oy uchun amallar mavjud emas'
						}
						emptyIcon={
							transactionsQuery.isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined
						}
					/>
				</div>
			</Panel>

			{userId > 0 && (
				<>
					<PayrollActionModal
						open={actionOpen}
						setOpen={setActionOpen}
						userId={userId}
						year={year}
						month={month}
						summary={s}
					/>
					<SalaryRateModal
						open={rateOpen}
						setOpen={setRateOpen}
						userId={userId}
						currentDollar={user?.oylik_dollar ?? userDetail?.oylik_dollar}
						currentSom={user?.oylik_som ?? userDetail?.oylik_som}
						year={year}
						month={month}
					/>
				</>
			)}
		</>
	);
}
