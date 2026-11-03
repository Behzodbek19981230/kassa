import { useEffect, useState, type ReactNode } from 'react';
import {
	FaCalendarAlt,
	FaCheck,
	FaClock,
	FaExclamationTriangle,
	FaHandHoldingUsd,
	FaSearch,
	FaUsers,
	FaWallet,
} from 'react-icons/fa';
import { Link, useSearchParams } from 'react-router-dom';
import { Pagination } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { CreatorName, GreenButton, MonthSelect, PageTitle, StatusBadge } from '@/pages/PayrollPage/shared/components';
import {
	CARD,
	fmtDollar,
	fmtSom,
	monthLabel,
	personName,
	useYearMonthParams,
} from '@/pages/PayrollPage/shared/utils';
import SalaryPaymentModal from '@/pages/PayrollPage/SalaryPaymentModal';
import { usePayrollDashboardQuery } from '@/services/payroll/payroll.queries';
import type { PayrollDashboardRow } from '@/services/payroll/payroll.types';

const PAGE_SIZE = 50;

function StatCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: ReactNode; tone: string }) {
	return (
		<div className={cn(CARD, 'flex items-center gap-4 p-4')}>
			<div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl', tone)}>{icon}</div>
			<div>
				<div className='text-sm text-ca-heading'>{label}</div>
				<div className='text-2xl font-bold text-ca-heading'>{value}</div>
			</div>
		</div>
	);
}

type Loose = Record<string, unknown>;

/**
 * Reads a dashboard row whatever shape the employee comes in: a nested `user` object, a bare `user` id
 * with `user_detail`, or the employee's fields on the row itself.
 */
function normalizeRow(row: PayrollDashboardRow) {
	const raw = row as unknown as Loose;
	const nested = raw.user && typeof raw.user === 'object' ? (raw.user as Loose) : null;
	const detail = raw.user_detail && typeof raw.user_detail === 'object' ? (raw.user_detail as Loose) : null;
	const src: Loose = { ...raw, ...(detail ?? {}), ...(nested ?? {}) };
	const id = Number(nested?.id ?? detail?.id ?? (typeof raw.user === 'number' ? raw.user : raw.user_id ?? raw.id));
	const str = (v: unknown) => (typeof v === 'string' ? v : '');
	const name =
		personName({ first_name: str(src.first_name), last_name: str(src.last_name) }) ||
		str(src.full_name) ||
		str(src.user_full_name) ||
		str(src.name) ||
		str(src.username);
	const oylikDollar = (src.oylik_dollar ?? 0) as string | number;
	const oylikSom = (src.oylik_som ?? 0) as string | number;
	const p = row.period;
	return {
		id: Number.isFinite(id) && id > 0 ? id : undefined,
		name,
		payableDollar: p?.payable_dollar ?? oylikDollar,
		payableSom: p?.payable_som ?? oylikSom,
		paidDollar: p?.paid_dollar ?? 0,
		paidSom: p?.paid_som ?? 0,
		paidCard: p?.paid_card ?? 0,
		remainingDollar: p?.remaining_dollar ?? oylikDollar,
		remainingSom: p?.remaining_som ?? oylikSom,
	};
}

export default function PayrollPage() {
	const [ym, setYm] = useYearMonthParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const page = Math.max(1, Number(searchParams.get('page')) || 1);
	const [payOpen, setPayOpen] = useState(false);
	const [searchText, setSearchText] = useState(searchParams.get('search') ?? '');
	const search = searchParams.get('search') ?? '';

	// Debounce the search box into the URL.
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchText.trim() === search) return;
			setSearchParams(
				(prev) => {
					const params = new URLSearchParams(prev);
					if (searchText.trim()) params.set('search', searchText.trim());
					else params.delete('search');
					params.delete('page');
					return params;
				},
				{ replace: true },
			);
		}, 400);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchText]);

	const setPage = (next: number) =>
		setSearchParams((prev) => {
			const params = new URLSearchParams(prev);
			params.set('page', String(next));
			return params;
		});

	const { data, isLoading, isFetching, isError, error } = usePayrollDashboardQuery({
		year: ym.year,
		month: ym.month,
		page,
		page_size: PAGE_SIZE,
		search: search || undefined,
	});

	const rows = data?.results ?? [];
	const total = data?.pagination?.total ?? data?.count ?? rows.length;
	const totalPages = data?.pagination?.lastPage ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
	const countBy = (statuses: (string | null)[]) =>
		rows.filter((r) => statuses.includes(r.period?.status ?? null)).length;
	const summary = data?.summary;
	const paidCount = summary?.paid ?? countBy(['PAID']);
	const partialCount = summary?.partial ?? countBy(['PARTIAL']);
	const openCount = summary?.open ?? countBy(['OPEN', null]);
	const startIndex = (page - 1) * PAGE_SIZE;

	return (
		<>
			<PageTitle
				icon={<FaWallet />}
				title='Oyliklar'
				subtitle={
					<>
						Xodimlar · <span className='font-semibold text-emerald-600'>{monthLabel(ym.year, ym.month)}</span>
					</>
				}
				actions={
					<>
						<Link
							to={`/payroll/adjustments?year=${ym.year}&month=${ym.month}`}
							className='inline-flex h-9 items-center gap-2 rounded-lg border border-ca-border bg-ca-silver-light px-4 text-xs font-semibold text-ca-heading shadow-sm hover:bg-ca-silver'
						>
							Jarima / Bonus
						</Link>
						<GreenButton type='button' onClick={() => setPayOpen(true)}>
							<FaHandHoldingUsd /> Pul berish
						</GreenButton>
					</>
				}
			/>

			<div className='mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
				<StatCard
					icon={<FaUsers />}
					label='Jami xodimlar'
					value={summary?.total ?? total}
					tone='bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
				/>
				<StatCard
					icon={<FaCheck />}
					label="To'liq to'langan"
					value={paidCount}
					tone='bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
				/>
				<StatCard
					icon={<FaClock />}
					label="Qisman to'langan"
					value={partialCount}
					tone='bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400'
				/>
				<StatCard
					icon={<FaExclamationTriangle />}
					label="To'lanmagan"
					value={openCount}
					tone='bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
				/>
			</div>

			<div className={cn(CARD, 'mb-5 flex flex-wrap items-center gap-3 p-4')}>
				<div className='flex w-full items-center gap-2 rounded-lg border border-emerald-500 bg-emerald-50/60 px-3 py-1.5 sm:w-80 dark:bg-emerald-500/5'>
					<FaCalendarAlt className='shrink-0 text-emerald-600' />
					<span className='text-sm font-semibold text-emerald-700 dark:text-emerald-400'>Oy:</span>
					<div className='flex-1'>
						<MonthSelect value={ym} onChange={setYm} />
					</div>
				</div>
				<div className='relative ml-auto w-full sm:w-96'>
					<FaSearch className='absolute top-1/2 left-3 -translate-y-1/2 text-ca-text' />
					<input
						type='search'
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						placeholder='Qidirish'
						className='h-10 w-full rounded-lg border border-ca-field-border bg-ca-silver-light pr-3 pl-9 text-sm text-ca-heading placeholder:text-ca-text focus:border-emerald-500 focus:outline-none lg:text-xs'
					/>
				</div>
			</div>

			<div className={cn(CARD, 'overflow-hidden')}>
				<div className='overflow-x-auto'>
					<table className='w-full min-w-[1100px] text-xs'>
						<thead>
							<tr className='border-b border-ca-border text-left text-ca-heading'>
								<th className='px-4 py-3 font-semibold'>#</th>
								<th className='px-4 py-3 font-semibold'>Xodim</th>
								<th className='px-4 py-3 text-right font-semibold'>Dollar oyligi</th>
								<th className='px-4 py-3 text-right font-semibold'>So'm oyligi</th>
								<th className='px-4 py-3 text-right font-semibold'>Berilgan dollar</th>
								<th className='px-4 py-3 text-right font-semibold'>Berilgan so'm</th>
								<th className='px-4 py-3 text-right font-semibold'>Summa karta</th>
								<th className='px-4 py-3 text-right font-semibold'>Qolgan</th>
								<th className='px-4 py-3 text-center font-semibold'>Holati</th>
								<th className='px-4 py-3 text-center font-semibold'>Batafsil</th>
							</tr>
						</thead>
						<tbody className={cn(isFetching && !isLoading && 'opacity-60')}>
							{isLoading ? (
								<tr>
									<td colSpan={10} className='px-4 py-10 text-center text-ca-text'>
										Yuklanmoqda...
									</td>
								</tr>
							) : isError ? (
								<tr>
									<td colSpan={10} className='px-4 py-10 text-center text-ca-red'>
										<FaExclamationTriangle className='mx-auto mb-2 text-3xl' />
										{getApiErrorMessage(error, 'Xatolik yuz berdi')}
									</td>
								</tr>
							) : rows.length === 0 ? (
								<tr>
									<td colSpan={10} className='px-4 py-10 text-center text-ca-text'>
										Xodimlar topilmadi
									</td>
								</tr>
							) : (
								rows.map((row, index) => {
									const v = normalizeRow(row);
									const detailUrl = v.id ? `/payroll/rates?user=${v.id}` : undefined;
									return (
										<tr
											key={v.id ?? index}
											className='border-b border-ca-border last:border-b-0 hover:bg-ca-table-hover'
										>
											<td className='px-4 py-3 text-ca-heading'>{startIndex + index + 1}</td>
											<td className='px-4 py-3 text-sm font-semibold text-ca-heading'>
												{v.name || (v.id ? <CreatorName id={v.id} /> : '—')}
											</td>
											<td className='px-4 py-3 text-right text-ca-heading'>{fmtDollar(v.payableDollar)}</td>
											<td className='px-4 py-3 text-right text-ca-heading'>{fmtSom(v.payableSom)}</td>
											<td className='px-4 py-3 text-right text-ca-heading'>{fmtDollar(v.paidDollar)}</td>
											<td className='px-4 py-3 text-right text-ca-heading'>{fmtSom(v.paidSom)}</td>
											<td className='px-4 py-3 text-right text-ca-heading'>{fmtSom(v.paidCard)}</td>
											<td className='px-4 py-3 text-right leading-5 font-semibold text-ca-heading'>
												<div>{fmtDollar(v.remainingDollar)} $</div>
												<div>{fmtSom(v.remainingSom)} so'm</div>
											</td>
											<td className='px-4 py-3 text-center'>
												<StatusBadge status={row.period?.status} />
											</td>
											<td className='px-4 py-3 text-center'>
												<Link
													to={detailUrl ?? '#'}
													className='inline-flex h-8 items-center rounded-lg border border-emerald-600 px-4 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
												>
													Batafsil
												</Link>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
				<div className='flex flex-wrap items-center justify-between gap-3 border-t border-ca-border px-4 py-3'>
					<span className='text-sm text-ca-text'>Jami: {total} ta xodim</span>
					{totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
				</div>
			</div>

			<SalaryPaymentModal open={payOpen} setOpen={setPayOpen} initialYm={ym} />
		</>
	);
}
