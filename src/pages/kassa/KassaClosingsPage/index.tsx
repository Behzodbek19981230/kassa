import { useMemo, type ReactNode } from 'react';
import { FaCheck, FaExclamationTriangle, FaListUl, FaPrint, FaRegClock, FaSort, FaSortDown, FaSortUp } from 'react-icons/fa';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DatePicker, Input, Pagination, Panel } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { EyeButton, KTable, KTd, KTh, PageSizeInfo, PanelTitle, Pill, STAT_GRID, StatCard } from '@/pages/kassa/shared';
import { useCompanyName, usePdfOpener } from '@/pages/kassa/hooks';
import { fmtShortDateTime, fmtUsd, num } from '@/pages/kassa/utils';
import { useCashClosingListQuery } from '@/services/cash-register/cash-register.queries';
import { cashRegisterService } from '@/services/cash-register/cash-register.service';
import type { CashClosing, CashClosingListParams } from '@/services/cash-register/cash-register.types';
import { useUserListQuery } from '@/services/user/user.queries';

const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_LIMIT = 25;

const STATUS_FILTERS: { value: string; label: string; params: Partial<CashClosingListParams> }[] = [
	{ value: '', label: 'Hammasi', params: {} },
	{ value: 'exact', label: "To'g'ri", params: { status: 'closed', result: 'exact' } },
	{ value: 'shortage', label: 'Kamomad', params: { status: 'closed', result: 'shortage' } },
	{ value: 'surplus', label: 'Ortiqcha', params: { status: 'closed', result: 'surplus' } },
	{ value: 'cancelled', label: 'Bekor qilingan', params: { status: 'cancelled' } },
];

export function ClosingStatusPill({ closing }: { closing: Pick<CashClosing, 'status' | 'result'> }) {
	if (closing.status === 'cancelled') return <Pill tone='gray'>Bekor qilingan</Pill>;
	if (closing.result === 'shortage') return <Pill tone='red'>Kamomad</Pill>;
	if (closing.result === 'surplus') return <Pill tone='orange'>Ortiqcha</Pill>;
	return <Pill tone='green'>To'g'ri</Pill>;
}

const filterClass =
	'h-8 w-full rounded-[3px] border border-ca-field-border bg-ca-silver-light px-2 text-sm font-normal text-ca-heading focus:border-ca-field-border-strong focus:outline-none';

function FilterCell({ children }: { children?: ReactNode }) {
	return <th className='border-b border-ca-border bg-ca-silver px-2 py-1.5 font-normal [&:not(:last-child)]:border-r'>{children}</th>;
}

/** 05 "Topshirishlar tarixi": every closing with the stats of the current filter. */
export default function KassaClosingsPage() {
	const navigate = useNavigate();
	const companyName = useCompanyName();
	const pdf = usePdfOpener();
	const [searchParams, setSearchParams] = useSearchParams();

	const get = (key: string) => searchParams.get(key) ?? '';
	const page = Math.max(Number(get('page')) || 1, 1);
	const limitParam = Number(get('limit'));
	const limit = PAGE_SIZES.includes(limitParam) ? limitParam : DEFAULT_LIMIT;
	const ordering = ['number', '-number'].includes(get('ordering')) ? get('ordering') : '-number';
	const status = STATUS_FILTERS.find((s) => s.value === get('state')) ?? STATUS_FILTERS[0];
	const numberFilter = get('number');
	const from = get('from');
	const to = get('to');
	const createdBy = get('created_by');
	const receivedBy = get('received_by');

	const params: CashClosingListParams = {
		page,
		limit,
		ordering,
		...status.params,
		number: Number(numberFilter) || undefined,
		closed_at__gte: from ? `${from}T00:00:00+05:00` : undefined,
		closed_at__lte: to ? `${to}T23:59:59+05:00` : undefined,
		created_by: Number(createdBy) || undefined,
		received_by: Number(receivedBy) || undefined,
	};
	const { data, isLoading, isError, error, isFetching } = useCashClosingListQuery(params);
	const usersQuery = useUserListQuery({ limit: 200 });
	const users = useMemo(
		() =>
			(usersQuery.data?.results ?? []).map((u) => ({
				id: u.id,
				name: `${u.last_name ?? ''} ${u.first_name ?? ''}`.trim() || u.username,
			})),
		[usersQuery.data],
	);

	function update(patch: Record<string, string | number | undefined>, resetPage = true) {
		const next = new URLSearchParams(searchParams);
		for (const [key, value] of Object.entries(patch)) {
			if (value === undefined || value === '') next.delete(key);
			else next.set(key, String(value));
		}
		if (resetPage) next.delete('page');
		setSearchParams(next, { replace: true });
	}

	const stats = data?.stats;
	const results = data?.results ?? [];
	const SortIcon = ordering === 'number' ? FaSortUp : ordering === '-number' ? FaSortDown : FaSort;

	return (
		<Panel title={<PanelTitle title='Topshirishlar tarixi' sub={companyName} />}>
			<div className='space-y-3'>
				<div className={cn(STAT_GRID, 'xl:grid-cols-4')}>
					<StatCard
						icon={<FaListUl />}
						tone='blue'
						label='Jami topshirishlar'
						value={stats?.total ?? '—'}
						sub={stats ? `shu oy: ${stats.this_month}` : undefined}
					/>
					<StatCard
						icon={<FaCheck />}
						tone='green'
						label="To'g'ri chiqqan"
						value={stats?.exact ?? '—'}
						sub='farq = 0'
					/>
					<StatCard
						icon={<FaRegClock />}
						tone='orange'
						label='Ortiqcha bilan'
						value={stats?.surplus ?? '—'}
						sub={stats?.surplus_usd ? `jami ${fmtUsd(stats.surplus_usd, { signed: true })}` : undefined}
					/>
					<StatCard
						icon={<FaExclamationTriangle />}
						tone='red'
						label='Kamomad bilan'
						value={stats?.shortage ?? '—'}
						sub={stats?.shortage_usd ? `jami ${fmtUsd(stats.shortage_usd)}` : undefined}
					/>
				</div>

				<div className={cn('transition-opacity', isFetching && !isLoading && 'opacity-70')}>
					<KTable>
						<thead>
							<tr>
								<KTh>
									<button
										type='button'
										className='flex items-center gap-1'
										onClick={() => update({ ordering: ordering === '-number' ? 'number' : '-number' }, false)}
									>
										№ <SortIcon className='text-[11px] opacity-70' />
									</button>
								</KTh>
								<KTh>Davr</KTh>
								<KTh>Topshirdi</KTh>
								<KTh>Qabul qildi</KTh>
								<KTh align='right'>Dasturda ($ ekv.)</KTh>
								<KTh align='right'>Sanaldi ($ ekv.)</KTh>
								<KTh align='right'>Farq</KTh>
								<KTh align='right'>Topshirildi</KTh>
								<KTh>Holati</KTh>
								<KTh align='center'>Harakatlar</KTh>
							</tr>
							<tr>
								<FilterCell>
									<Input
										type='number'
										min={1}
										placeholder='Filtr...'
										defaultValue={numberFilter}
										key={numberFilter}
										onKeyDown={(e) => e.key === 'Enter' && update({ number: e.currentTarget.value })}
										onBlur={(e) => e.currentTarget.value !== numberFilter && update({ number: e.currentTarget.value })}
										className='h-7! min-w-16 text-sm! lg:h-7!'
									/>
								</FilterCell>
								<FilterCell>
									<div className='flex min-w-[260px] items-center gap-1'>
										<DatePicker value={from} onChange={(v) => update({ from: v })} placeholder='Dan' className='h-7 px-2 lg:h-7' />
										<DatePicker value={to} onChange={(v) => update({ to: v })} placeholder='Gacha' className='h-7 px-2 lg:h-7' />
									</div>
								</FilterCell>
								<FilterCell>
									<select value={createdBy} onChange={(e) => update({ created_by: e.target.value })} className={filterClass}>
										<option value=''>Hammasi</option>
										{users.map((u) => (
											<option key={u.id} value={u.id}>
												{u.name}
											</option>
										))}
									</select>
								</FilterCell>
								<FilterCell>
									<select value={receivedBy} onChange={(e) => update({ received_by: e.target.value })} className={filterClass}>
										<option value=''>Hammasi</option>
										{users.map((u) => (
											<option key={u.id} value={u.id}>
												{u.name}
											</option>
										))}
									</select>
								</FilterCell>
								<FilterCell />
								<FilterCell />
								<FilterCell />
								<FilterCell />
								<FilterCell>
									<select value={status.value} onChange={(e) => update({ state: e.target.value })} className={filterClass}>
										{STATUS_FILTERS.map((s) => (
											<option key={s.value} value={s.value}>
												{s.label}
											</option>
										))}
									</select>
								</FilterCell>
								<FilterCell />
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								Array.from({ length: 5 }, (_, i) => (
									<tr key={i}>
										<KTd colSpan={10}>
											<div className='h-4 animate-pulse rounded bg-ca-silver' />
										</KTd>
									</tr>
								))
							) : isError ? (
								<tr>
									<KTd colSpan={10} align='center' className='py-8 text-ca-red'>
										{getApiErrorMessage(error, "Topshirishlarni yuklab bo'lmadi")}
									</KTd>
								</tr>
							) : results.length === 0 ? (
								<tr>
									<KTd colSpan={10} align='center' className='py-8 text-ca-text'>
										Topshirishlar topilmadi
									</KTd>
								</tr>
							) : (
								results.map((c) => {
									const diff = num(c.total_difference_usd);
									return (
										<tr key={c.id} className={cn('hover:bg-ca-table-hover', c.status === 'cancelled' && 'opacity-60')}>
											<KTd>
												<Link to={`/kassa/closings/${c.id}`} className='text-ca-theme hover:underline'>
													#{c.number}
												</Link>
											</KTd>
											<KTd>
												{c.is_initial ? "Boshlang'ich" : `${fmtShortDateTime(c.period_start)} → ${fmtShortDateTime(c.closed_at)}`}
											</KTd>
											<KTd>{c.created_by_name || '—'}</KTd>
											<KTd>{c.received_by_name || '—'}</KTd>
											<KTd align='right'>{fmtUsd(c.total_expected_usd)}</KTd>
											<KTd align='right'>{fmtUsd(c.total_actual_usd)}</KTd>
											<KTd
												align='right'
												className={cn(diff < 0 && 'text-red-500', diff > 0 && 'text-emerald-500', !diff && 'text-ca-text')}
											>
												{c.total_difference_usd == null ? '—' : diff ? fmtUsd(diff, { signed: true }) : '0'}
											</KTd>
											<KTd align='right'>{fmtUsd(c.total_handed_over_usd)}</KTd>
											<KTd>
												<ClosingStatusPill closing={c} />
											</KTd>
											<KTd align='center'>
												<span className='inline-flex gap-1'>
													<EyeButton title='Aktni ochish' onClick={() => navigate(`/kassa/closings/${c.id}`)} />
													<button
														type='button'
														title='Chop etish'
														aria-label='Chop etish'
														disabled={pdf.busy}
														onClick={() => pdf.open(() => cashRegisterService.closingPdf(c.id))}
														className='inline-flex h-6 w-7 items-center justify-center rounded-[3px] bg-ca-green text-xs text-white hover:bg-emerald-600 disabled:opacity-50'
													>
														<FaPrint />
													</button>
												</span>
											</KTd>
										</tr>
									);
								})
							)}
						</tbody>
					</KTable>
				</div>

				{data && data.pagination.total > 0 && (
					<div className='flex flex-wrap items-center justify-between gap-2'>
						<PageSizeInfo
							total={data.pagination.total}
							page={data.pagination.currentPage}
							perPage={limit}
							options={PAGE_SIZES}
							onPerPageChange={(l) => update({ limit: l === DEFAULT_LIMIT ? undefined : l })}
						/>
						{data.pagination.lastPage > 1 && (
							<Pagination
								page={data.pagination.currentPage}
								totalPages={data.pagination.lastPage}
								onPageChange={(p) => update({ page: p > 1 ? p : undefined }, false)}
							/>
						)}
					</div>
				)}
			</div>
		</Panel>
	);
}
