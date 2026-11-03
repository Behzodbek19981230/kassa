import type { ReactNode } from 'react';
import {
	FaCalendarAlt,
	FaDollarSign,
	FaExclamationTriangle,
	FaHandHoldingUsd,
	FaHistory,
	FaLock,
	FaPlus,
	FaRegCalendarAlt,
	FaSlidersH,
	FaUser,
} from 'react-icons/fa';
import { FaCoins } from 'react-icons/fa6';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AdjustmentBadge, MonthSelect, PageTitle, SectionTitle, StatusBadge } from '@/pages/PayrollPage/shared/components';
import {
	ADJUSTMENT_META,
	CARD,
	fmtDollar,
	fmtSom,
	monthLabel,
	personName,
	toNumber,
	useYearMonthParams,
} from '@/pages/PayrollPage/shared/utils';
import {
	useSalaryAdjustmentListQuery,
	useSalaryPaymentListQuery,
	useSalaryPeriodLookupQuery,
} from '@/services/payroll/payroll.queries';
import type { SalaryAdjustmentType } from '@/services/payroll/payroll.types';
import { useUserQuery } from '@/services/user/user.queries';

interface OperationRow {
	key: string;
	date: string;
	sortKey: string;
	type: ReactNode;
	note: string;
	dollar: number;
	som: number;
	card: number;
	sign: 1 | -1;
}

function AccountLine({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'red' }) {
	return (
		<div className='flex items-center justify-between py-1.5 text-sm'>
			<span className='text-ca-heading'>{label}</span>
			<span
				className={cn(
					'font-semibold text-ca-heading',
					tone === 'green' && 'text-emerald-600 dark:text-emerald-400',
					tone === 'red' && 'text-red-500',
				)}
			>
				{value}
			</span>
		</div>
	);
}

function AccountCard({
	icon,
	title,
	children,
	remaining,
}: {
	icon: ReactNode;
	title: string;
	children: ReactNode;
	remaining: string;
}) {
	return (
		<div className={cn(CARD, 'overflow-hidden p-1.5')}>
			<div className='flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-500/10'>
				<span className='flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-lg text-white'>
					{icon}
				</span>
				<h3 className='text-lg font-bold text-ca-heading'>{title}</h3>
			</div>
			<div className='border-b border-ca-border px-4 py-2'>{children}</div>
			<div className='mt-1.5 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-500/10'>
				<span className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>Qolgan</span>
				<span className='text-2xl font-bold text-emerald-700 dark:text-emerald-400'>{remaining}</span>
			</div>
		</div>
	);
}

function TypePill({ className, children }: { className: string; children: ReactNode }) {
	return (
		<span className={cn('inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap', className)}>
			{children}
		</span>
	);
}

export default function EmployeePayrollPage() {
	const { userId } = useParams();
	const id = Number(userId) || undefined;
	const [ym, setYm] = useYearMonthParams();

	const userQuery = useUserQuery(id);
	const user = userQuery.data;
	const periodQuery = useSalaryPeriodLookupQuery({ user: id, year: ym.year, month: ym.month });
	const period = periodQuery.data ?? null;

	const paymentsQuery = useSalaryPaymentListQuery(
		{ period: period?.id, ordering: '-payment_date', limit: 100 },
		Boolean(period),
	);
	const adjustmentsQuery = useSalaryAdjustmentListQuery(
		{ period: period?.id, ordering: '-adjustment_date', limit: 100 },
		Boolean(period),
	);
	const payments = period ? (paymentsQuery.data?.results ?? []) : [];
	const adjustments = period ? (adjustmentsQuery.data?.results ?? []) : [];

	const sumAdjustments = (types: SalaryAdjustmentType[], field: 'summa_dollar' | 'summa_som') =>
		adjustments.filter((a) => types.includes(a.adjustment_type)).reduce((s, a) => s + toNumber(a[field]), 0);
	const plusTypes: SalaryAdjustmentType[] = ['BONUS', 'ADDITION', 'CORRECTION'];

	const baseDollar = period?.base_oylik_dollar ?? user?.oylik_dollar ?? 0;
	const baseSom = period?.base_oylik_som ?? user?.oylik_som ?? 0;
	const isClosed = period?.status === 'CLOSED';
	const monthQuery = `year=${ym.year}&month=${ym.month}`;

	const operations: OperationRow[] = [
		{
			key: 'base',
			date: `${ym.year}-${String(ym.month).padStart(2, '0')}-01`,
			sortKey: '0',
			type: (
				<TypePill className='bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'>
					Oylik hisoblandi
				</TypePill>
			),
			note: `${monthLabel(ym.year, ym.month)} uchun asosiy oylik`,
			dollar: toNumber(baseDollar),
			som: toNumber(baseSom),
			card: 0,
			sign: 1,
		},
		...payments.map<OperationRow>((p) => ({
			key: `p-${p.id}`,
			date: p.payment_date,
			sortKey: `${p.payment_date} ${p.created_time ?? ''}`,
			type: (
				<TypePill className='bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'>Pul berish</TypePill>
			),
			note: p.note ?? '',
			dollar: toNumber(p.summa_dollar),
			som: toNumber(p.summa_som),
			card: toNumber(p.summa_karta),
			sign: 1,
		})),
		...adjustments.map<OperationRow>((a) => ({
			key: `a-${a.id}`,
			date: a.adjustment_date,
			sortKey: `${a.adjustment_date} ${a.created_time ?? ''}`,
			type: <AdjustmentBadge type={a.adjustment_type} />,
			note: a.reason,
			dollar: toNumber(a.summa_dollar),
			som: toNumber(a.summa_som),
			card: 0,
			sign: ADJUSTMENT_META[a.adjustment_type]?.sign ?? 1,
		})),
	];
	// The base salary row first, then operations oldest → newest, as in the design.
	operations.sort((a, b) => (a.key === 'base' ? -1 : b.key === 'base' ? 1 : a.sortKey.localeCompare(b.sortKey)));

	if (userQuery.isLoading) {
		return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
	}
	if (!user) {
		return (
			<div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
				<FaExclamationTriangle /> Xodim topilmadi
			</div>
		);
	}

	const signed = (value: number, sign: 1 | -1, format: (v: number) => string) =>
		value === 0 ? format(0) : `${sign < 0 ? '- ' : ''}${format(value)}`;

	return (
		<>
			<PageTitle
				back
				icon={
					user.avatar ? (
						<img src={user.avatar} alt='' className='h-12 w-12 rounded-full object-cover' />
					) : (
						<FaUser />
					)
				}
				title={personName(user)}
				subtitle="Xodim oylik ma'lumotlari va hisob-kitobi"
				actions={
					<div className='flex items-center gap-2 rounded-lg border border-ca-border bg-ca-silver-light pl-3 shadow-sm'>
						<FaCalendarAlt className='text-ca-heading' />
						<div className='w-52'>
							<MonthSelect value={ym} onChange={setYm} suffix=' oyligi' />
						</div>
					</div>
				}
			/>

			<div className='mb-3 flex flex-wrap items-center gap-2 text-xs text-ca-text'>
				Holati: <StatusBadge status={period?.status} />
				{!period && !periodQuery.isLoading && (
					<span>Bu oy uchun hali to'lov yoki jarima/bonus kiritilmagan.</span>
				)}
				{isClosed && (
					<span className='inline-flex items-center gap-1 text-ca-red'>
						<FaLock /> Davr yopilgan — amallar bloklangan
					</span>
				)}
			</div>

			<div className='mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2'>
				<AccountCard icon={<FaDollarSign />} title='Dollar hisobi' remaining={fmtDollar(period?.remaining_dollar ?? baseDollar)}>
					<AccountLine label='Asosiy oylik' value={fmtDollar(baseDollar)} />
					<AccountLine label="Bonus / qo'shimcha" value={fmtDollar(sumAdjustments(plusTypes, 'summa_dollar'))} tone='green' />
					<AccountLine label='Jarima' value={fmtDollar(sumAdjustments(['PENALTY'], 'summa_dollar'))} tone='red' />
					<AccountLine label='Beriladigan oylik' value={fmtDollar(period?.payable_dollar ?? baseDollar)} />
					<AccountLine label='Berilgan' value={fmtDollar(period?.paid_dollar ?? 0)} />
				</AccountCard>
				<AccountCard icon={<FaCoins />} title="So'm hisobi" remaining={fmtSom(period?.remaining_som ?? baseSom)}>
					<AccountLine label='Asosiy oylik' value={fmtSom(baseSom)} />
					<AccountLine label="Bonus / qo'shimcha" value={fmtSom(sumAdjustments(plusTypes, 'summa_som'))} tone='green' />
					<AccountLine label='Jarima' value={fmtSom(sumAdjustments(['PENALTY'], 'summa_som'))} tone='red' />
					<AccountLine label='Beriladigan oylik' value={fmtSom(period?.payable_som ?? baseSom)} />
					<AccountLine label="Summa so'm" value={fmtSom(period?.paid_som ?? 0)} />
					<AccountLine label='Summa karta' value={fmtSom(period?.paid_card ?? 0)} />
				</AccountCard>
			</div>

			<SectionTitle
				icon={<FaHistory />}
				actions={
					<div className='flex flex-wrap gap-2'>
						<Link
							to={`/payroll/rates?user=${user.id}`}
							className='inline-flex h-9 items-center gap-2 rounded-lg border border-ca-border bg-ca-silver-light px-4 text-xs font-semibold text-ca-heading shadow-sm hover:bg-ca-silver'
						>
							<FaSlidersH /> Oylik tarifi
						</Link>
						{isClosed ? (
							<>
								<span className='inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-lg bg-emerald-600/50 px-4 text-xs font-semibold text-white'>
									<FaPlus /> Jarima yoki bonus
								</span>
								<span className='inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-lg bg-emerald-600/50 px-4 text-xs font-semibold text-white'>
									<FaHandHoldingUsd /> Pul berish
								</span>
							</>
						) : (
							<>
								<Link
									to={`/payroll/adjustments?user=${user.id}&${monthQuery}`}
									className='inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700'
								>
									<FaPlus /> Jarima yoki bonus
								</Link>
								<Link
									to={`/payroll/pay?user=${user.id}&${monthQuery}`}
									className='inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700'
								>
									<FaHandHoldingUsd /> Pul berish
								</Link>
							</>
						)}
					</div>
				}
			>
				Operatsiyalar tarixi
			</SectionTitle>

			<div className={cn(CARD, 'overflow-x-auto')}>
				<table className='w-full min-w-[760px] text-sm'>
					<thead>
						<tr className='border-b border-ca-border bg-ca-silver text-left text-ca-heading'>
							<th className='px-5 py-3 font-semibold'>Sana</th>
							<th className='px-5 py-3 font-semibold'>Turi</th>
							<th className='px-5 py-3 font-semibold'>Izoh</th>
							<th className='px-5 py-3 text-right font-semibold'>Dollar</th>
							<th className='px-5 py-3 text-right font-semibold'>So'm</th>
							<th className='px-5 py-3 text-right font-semibold'>Karta</th>
						</tr>
					</thead>
					<tbody>
						{operations.map((op) => (
							<tr key={op.key} className='border-b border-ca-border last:border-b-0'>
								<td className='px-5 py-3 whitespace-nowrap text-ca-heading'>
									<FaRegCalendarAlt className='mr-2 inline text-ca-text' />
									{op.date}
								</td>
								<td className='px-5 py-3'>{op.type}</td>
								<td className='px-5 py-3 text-ca-heading'>{op.note}</td>
								<td className={cn('px-5 py-3 text-right text-ca-heading', op.sign < 0 && op.dollar > 0 && 'text-red-500')}>
									{signed(op.dollar, op.sign, fmtDollar)}
								</td>
								<td className={cn('px-5 py-3 text-right text-ca-heading', op.sign < 0 && op.som > 0 && 'text-red-500')}>
									{signed(op.som, op.sign, fmtSom)}
								</td>
								<td className='px-5 py-3 text-right text-ca-heading'>{fmtSom(op.card)}</td>
							</tr>
						))}
						{(paymentsQuery.isFetching || adjustmentsQuery.isFetching || periodQuery.isLoading) && (
							<tr>
								<td colSpan={6} className='px-5 py-3 text-center text-ca-text'>
									Yuklanmoqda...
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</>
	);
}
