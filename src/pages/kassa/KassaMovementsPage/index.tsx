import { FaArrowLeft, FaFileExcel } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Pagination, Panel } from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { EyeButton, KTable, KTd, KTh, PageSizeInfo, PanelTitle, Pill } from '@/pages/kassa/shared';
import { useFileDownloader, usePdfOpener } from '@/pages/kassa/hooks';
import { closingTypeLabel, kassaTypeLabel, type KassaTypeState } from '@/pages/kassa/kassaType';
import { KassaTypeBoundary, KassaTypeSwitcher } from '@/pages/kassa/KassaTypeUi';
import {
	docNumber,
	fmtAmount,
	fmtChannel,
	fmtShortDateTime,
	fmtSigned,
	movementBadge,
	num,
	signTone,
	SOURCE_LABELS,
	SOURCE_TONE,
	sumSources,
	todayIso,
	toneButton,
	type Tone,
} from '@/pages/kassa/utils';
import {
	useCashClosingQuery,
	useCashMovementsQuery,
	useCashRegisterCurrentQuery,
	useCashRegisterDailyQuery,
	useCashRegisterSummaryQuery,
} from '@/services/cash-register/cash-register.queries';
import { cashRegisterService } from '@/services/cash-register/cash-register.service';
import type { CashMovement, CashSourceKind, CashSourceRow } from '@/services/cash-register/cash-register.types';
import { soldHistoryService } from '@/services/sold-history/sold-history.service';
import { useUserListQuery } from '@/services/user/user.queries';
import { SYSTEM_USER_PARAMS, userFullName } from '@/services/user/user.types';

/** An option of the "Sotuvchi" filter; `count` = their records in the period, when known. */
interface SellerOption {
	id: number;
	name: string;
	count?: number;
}

const ALL_KINDS: CashSourceKind[] = ['order', 'debt', 'expense', 'vozvrat', 'correction'];
const DAY_KINDS: CashSourceKind[] = ['order', 'debt', 'expense'];
const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_LIMIT = 25;

/** A zero amount is shown as "—" so the non-zero cells stand out. */
function AmountCell({ value }: { value: string }) {
	if (!num(value)) return <KTd align='right' className='text-ca-text/60'>—</KTd>;
	return (
		<KTd align='right' className={signTone(value)}>
			{fmtAmount(value)}
		</KTd>
	);
}

function CardCell({ row }: { row: CashMovement }) {
	if (row.cards.length) {
		return (
			<KTd align='right'>
				<span className='flex flex-col items-end gap-0.5'>
					{row.cards.map((c) => (
						<span key={c.card} className={signTone(c.amount)}>
							{c.card_name} {fmtAmount(c.amount)}
						</span>
					))}
				</span>
			</KTd>
		);
	}
	if (!num(row.card)) return <KTd align='right' className='text-ca-text/60'>—</KTd>;
	return (
		<KTd align='right' className={signTone(row.card)} title='Kartasi belgilanmagan'>
			{fmtAmount(row.card)}
		</KTd>
	);
}

const sellerSelectClass =
	'h-8 min-w-[220px] rounded-[3px] border border-ca-field-border bg-ca-silver-light px-2 text-sm text-ca-heading focus:border-ca-field-border-strong focus:outline-none';

/**
 * 02 "Davr harakatlari": every record behind one seller type's kassa — the open period, one closing
 * (`?closing=`, whose type wins over `?type=`) or one day (`?date=`). One type can have several sellers,
 * so "Kim" and the seller filter (`?created_by=`) tell them apart. The sellers come from `current.sellers`
 * (open period), the closing's frozen `sellers`, or — for a day — the users of that type.
 */
export default function KassaMovementsPage() {
	return (
		<KassaTypeBoundary title='Davr harakatlari'>{(kassa) => <KassaMovementsContent kassa={kassa} />}</KassaTypeBoundary>
	);
}

function KassaMovementsContent({ kassa }: { kassa: KassaTypeState }) {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const closing = Number(searchParams.get('closing')) || undefined;
	const rawDate = searchParams.get('date');
	const date = !closing && rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && rawDate <= todayIso() ? rawDate : undefined;
	const allowedKinds = date ? DAY_KINDS : ALL_KINDS;
	const kindParam = (searchParams.get('kind') ?? '')
		.split(',')
		.filter((k): k is CashSourceKind => allowedKinds.includes(k as CashSourceKind));
	const kind = kindParam.join(',');
	const page = Math.max(Number(searchParams.get('page')) || 1, 1);
	const limitParam = Number(searchParams.get('limit'));
	const limit = PAGE_SIZES.includes(limitParam) ? limitParam : DEFAULT_LIMIT;
	const createdBy = Number(searchParams.get('created_by')) || undefined;

	const closingQuery = useCashClosingQuery(closing);
	// A closing belongs to one type; until it loads, the URL's type is only a guess, so the switcher waits.
	const type = (closing ? closingQuery.data?.user_type : undefined) ?? kassa.type;
	const showSwitcher = kassa.canPickType && !closing;

	const movementsQuery = useCashMovementsQuery({
		user_type: closing ? undefined : type,
		kind: kind || undefined,
		created_by: createdBy,
		closing,
		date,
		page,
		limit,
	});
	// The total row is the whole period's total, not the page's: it comes from the matching summary.
	const currentQuery = useCashRegisterCurrentQuery(type, !closing && !date);
	const dailyQuery = useCashRegisterDailyQuery(type, date === todayIso() ? undefined : date, Boolean(date));
	const summaryQuery = useCashRegisterSummaryQuery(showSwitcher && !date);
	const dayUsersQuery = useUserListQuery({ ...SYSTEM_USER_PARAMS, type, limit: 200 }, Boolean(date));

	const pdf = usePdfOpener();
	const excel = useFileDownloader();

	function update(next: { kind?: string; page?: number; limit?: number; createdBy?: number | null }) {
		const params = new URLSearchParams();
		if (kassa.canPickType && !closing) params.set('type', String(type));
		if (closing) params.set('closing', String(closing));
		if (date) params.set('date', date);
		const k = next.kind ?? kind;
		if (k) params.set('kind', k);
		const seller = next.createdBy === undefined ? createdBy : next.createdBy;
		if (seller) params.set('created_by', String(seller));
		const l = next.limit ?? limit;
		if (l !== DEFAULT_LIMIT) params.set('limit', String(l));
		const p = next.page ?? 1;
		if (p > 1) params.set('page', String(p));
		setSearchParams(params, { replace: true });
	}

	function openRecord(row: CashMovement) {
		const source = row.kind === 'correction' ? row.source : row.kind;
		if (row.id == null || !source) return;
		if (source === 'order') navigate(`/customer-order-history/${row.id}`);
		else if (source === 'vozvrat') navigate(`/vozvrat-order-history/${row.id}`);
		else if (source === 'expense') navigate('/system/expenses');
		else if (source === 'debt') pdf.open(() => soldHistoryService.printDebt(row.id as number));
	}

	const data = movementsQuery.data;
	const counts = data?.counts;
	const results = data?.results ?? [];
	const typeLabel = kassaTypeLabel(type);
	const sellerSource = closing ? closingQuery.data?.sellers : date ? undefined : currentQuery.data?.sellers;
	const sellers: SellerOption[] = date
		? (dayUsersQuery.data?.results ?? []).map((u) => ({ id: u.id, name: userFullName(u) }))
		: (sellerSource ?? []).flatMap((u) => (u.user == null ? [] : [{ id: u.user, name: u.name, count: u.count }]));
	const sellersLoaded = date ? Boolean(dayUsersQuery.data) : Boolean(sellerSource);
	const selectedKinds = kindParam.length ? kindParam : allowedKinds;
	const selectedCount = counts ? selectedKinds.reduce((s, k) => s + (counts[k] ?? 0), 0) : 0;

	let sources: CashSourceRow[] | undefined;
	let title = 'Davr harakatlari';
	let sub: string | undefined;
	if (closing) {
		const c = closingQuery.data;
		sources = c?.sources;
		title = c ? `Topshirish ${closingTypeLabel(c.user_type, true)} #${c.number} harakatlari` : 'Topshirish harakatlari';
		sub = c
			? `${c.user_type_display || closingTypeLabel(c.user_type)} · ${c.is_initial ? "Boshlang'ich" : formatDateTime(c.period_start)} → ${formatDateTime(c.closed_at)}`
			: undefined;
	} else if (date) {
		sources = dailyQuery.data?.sources;
		title = 'Kun harakatlari';
		sub = `${typeLabel} · ${formatDate(date)}`;
	} else {
		const c = currentQuery.data;
		sources = c?.sources;
		const period = c?.period_start ? `${formatDateTime(c.period_start)} → hozir` : c ? 'boshlanmagan' : undefined;
		sub = period ? `${typeLabel} · ${period}` : typeLabel;
	}
	const cardCodes = [...new Set((sources ?? []).flatMap((s) => Object.keys(s.amounts).filter((k) => k.startsWith('card'))))];
	// The summaries aren't split by seller (and a seller's corrections aren't in `sellers[].amounts`), so with a
	// seller picked there is no exact period total to show.
	const totals =
		sources && !createdBy
			? {
					som: sumSources(sources, ['cash_som'], selectedKinds),
					usd: sumSources(sources, ['cash_usd'], selectedKinds),
					transfer: sumSources(sources, ['transfer'], selectedKinds),
					card: sumSources(sources, cardCodes, selectedKinds),
				}
			: undefined;

	const tabs: { key: string; label: string; tone: Tone; count?: number }[] = [
		{
			key: '',
			label: 'Hammasi',
			tone: 'blue',
			count: counts ? allowedKinds.reduce((s, k) => s + (counts[k] ?? 0), 0) : undefined,
		},
		...allowedKinds.map((k) => ({ key: k, label: SOURCE_LABELS[k], tone: SOURCE_TONE[k], count: counts?.[k] })),
	];

	return (
		<Panel
			title={<PanelTitle title={title} sub={sub} />}
			actions={
				<>
					{closing && (
						<Button type='button' variant='slate' size='sm' onClick={() => navigate(`/kassa/closings/${closing}`)}>
							<FaArrowLeft className='mr-1.5' /> Aktga qaytish
						</Button>
					)}
					{date && (
						<Button
							type='button'
							variant='slate'
							size='sm'
							onClick={() =>
								navigate(
									date === todayIso()
										? `/kassa/current?type=${type}&tab=daily`
										: `/kassa/current?type=${type}&tab=daily&date=${date}`,
								)
							}
						>
							<FaArrowLeft className='mr-1.5' /> Hisobotga qaytish
						</Button>
					)}
					<Button
						type='button'
						variant='excel'
						size='sm'
						loading={excel.busy}
						onClick={() =>
							excel.download(() =>
								date
									? cashRegisterService.dailyExcel(type, date)
									: cashRegisterService.movementsExcel({
											user_type: closing ? undefined : type,
											kind: kind || undefined,
											closing,
											created_by: createdBy,
										}),
							)
						}
					>
						<FaFileExcel className='mr-1.5' /> Excel
					</Button>
				</>
			}
		>
			{showSwitcher && (
				<KassaTypeSwitcher
					type={type}
					onChange={kassa.setType}
					className='mb-3'
					value={(t) => {
						const row = date ? undefined : summaryQuery.data?.types.find((r) => r.user_type === t);
						return row ? (row.count ?? 0) : undefined;
					}}
				/>
			)}

			<div className='mb-3 flex flex-wrap items-center gap-1.5'>
				{tabs.map((t) => (
					<button
						key={t.key || 'all'}
						type='button'
						onClick={() => update({ kind: t.key, page: 1 })}
						className={cn(
							'h-8 rounded-[3px] border px-3 text-sm transition-colors',
							toneButton(t.tone, kind === t.key),
						)}
					>
						{t.label}
						{t.count !== undefined && ` (${t.count})`}
					</button>
				))}
				<label className='ml-auto flex items-center gap-2 text-xs text-ca-text'>
					Sotuvchi:
					<select
						value={createdBy ?? ''}
						onChange={(e) => update({ createdBy: Number(e.target.value) || null, page: 1 })}
						className={sellerSelectClass}
					>
						<option value=''>Hammasi{sellersLoaded ? ` (${sellers.length})` : ''}</option>
						{/* A seller picked by link who has no records here still needs an option to show. */}
						{createdBy && sellersLoaded && !sellers.some((u) => u.id === createdBy) && (
							<option value={createdBy}>#{createdBy}</option>
						)}
						{sellers.map((u) => (
							<option key={u.id} value={u.id}>
								{u.name}
								{u.count !== undefined && ` (${u.count})`}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className={cn('transition-opacity', movementsQuery.isFetching && 'opacity-70')}>
				<KTable>
					<thead>
						<tr>
							<KTh>Vaqt</KTh>
							<KTh>Turi</KTh>
							<KTh>Hujjat</KTh>
							<KTh>Mijoz / izoh</KTh>
							<KTh align='right'>Naqd so'm</KTh>
							<KTh align='right'>Naqd $</KTh>
							<KTh align='right'>Transfer</KTh>
							<KTh align='right'>Karta</KTh>
							<KTh>Kim</KTh>
							<KTh className='w-12' />
						</tr>
					</thead>
					<tbody>
						{movementsQuery.isLoading ? (
							Array.from({ length: 6 }, (_, i) => (
								<tr key={i}>
									<KTd colSpan={10}>
										<div className='h-4 animate-pulse rounded bg-ca-silver' />
									</KTd>
								</tr>
							))
						) : movementsQuery.isError ? (
							<tr>
								<KTd colSpan={10} align='center' className='py-8 text-ca-red'>
									{getApiErrorMessage(movementsQuery.error, "Harakatlarni yuklab bo'lmadi")}
								</KTd>
							</tr>
						) : results.length === 0 ? (
							<tr>
								<KTd colSpan={10} align='center' className='py-8 text-ca-text'>
									Yozuvlar yo'q
								</KTd>
							</tr>
						) : (
							results.map((row, i) => {
								const badge = movementBadge(row);
								const source = row.kind === 'correction' ? row.source : row.kind;
								const canOpen = row.id != null && source != null && row.action !== 'delete';
								return (
									<tr key={`${row.kind}-${row.action}-${row.id ?? 'x'}-${i}`} className='hover:bg-ca-table-hover'>
										<KTd>{fmtShortDateTime(row.created_time)}</KTd>
										<KTd>
											<Pill tone={badge.tone}>{badge.label}</Pill>
										</KTd>
										<KTd>
											{canOpen ? (
												<button type='button' onClick={() => openRecord(row)} className='text-ca-theme hover:underline'>
													{docNumber(source, row.id)}
												</button>
											) : (
												<span className='text-ca-text'>{docNumber(source, row.id)}</span>
											)}
										</KTd>
										<KTd className='max-w-90 truncate whitespace-nowrap' title={row.title}>
											{row.title || '—'}
										</KTd>
										<AmountCell value={row.som} />
										<AmountCell value={row.usd} />
										<AmountCell value={row.transfer} />
										<CardCell row={row} />
										<KTd>{row.created_by_name || row.created_by || '—'}</KTd>
										<KTd align='center'>
											<EyeButton onClick={() => openRecord(row)} disabled={!canOpen} />
										</KTd>
									</tr>
								);
							})
						)}
						{totals && counts && (
							<tr className='bg-ca-silver'>
								<KTd colSpan={4} className='font-bold'>
									{date ? "Kun bo'yicha jami" : "Davr bo'yicha jami"} ({selectedCount} yozuv)
								</KTd>
								<KTd align='right' className='font-bold'>
									{fmtSigned(totals.som)}
								</KTd>
								<KTd align='right' className='font-bold'>
									{fmtChannel(totals.usd, 'cash_usd', true)}
								</KTd>
								<KTd align='right' className='font-bold'>
									{fmtSigned(totals.transfer)}
								</KTd>
								<KTd align='right' className='font-bold'>
									{fmtSigned(totals.card)}
								</KTd>
								<KTd colSpan={2} />
							</tr>
						)}
					</tbody>
				</KTable>
			</div>

			{data && data.pagination.total > 0 && (
				<div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
					<PageSizeInfo
						total={data.pagination.total}
						page={data.pagination.currentPage}
						perPage={limit}
						options={PAGE_SIZES}
						onPerPageChange={(l) => update({ limit: l, page: 1 })}
					/>
					{data.pagination.lastPage > 1 && (
						<Pagination
							page={data.pagination.currentPage}
							totalPages={data.pagination.lastPage}
							onPageChange={(p) => update({ page: p })}
						/>
					)}
				</div>
			)}
		</Panel>
	);
}
