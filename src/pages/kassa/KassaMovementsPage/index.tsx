import { FaArrowLeft, FaFileExcel } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Pagination, Panel } from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { EyeButton, KTable, KTd, KTh, PageSizeInfo, PanelTitle, Pill } from '@/pages/kassa/shared';
import { useFileDownloader, usePdfOpener } from '@/pages/kassa/hooks';
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
	sumSources,
	todayIso,
} from '@/pages/kassa/utils';
import {
	useCashClosingQuery,
	useCashMovementsQuery,
	useCashRegisterCurrentQuery,
	useCashRegisterDailyQuery,
} from '@/services/cash-register/cash-register.queries';
import { cashRegisterService } from '@/services/cash-register/cash-register.service';
import type { CashMovement, CashSourceKind, CashSourceRow } from '@/services/cash-register/cash-register.types';
import { soldHistoryService } from '@/services/sold-history/sold-history.service';

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

/** 02 "Davr harakatlari": every record behind the kassa — the open period, one closing (`?closing=`) or one day (`?date=`). */
export default function KassaMovementsPage() {
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

	const movementsQuery = useCashMovementsQuery({ kind: kind || undefined, closing, date, page, limit });
	// The total row is the whole period's total, not the page's: it comes from the matching summary.
	const currentQuery = useCashRegisterCurrentQuery(!closing && !date);
	const closingQuery = useCashClosingQuery(closing);
	const dailyQuery = useCashRegisterDailyQuery(date === todayIso() ? undefined : date, Boolean(date));

	const pdf = usePdfOpener();
	const excel = useFileDownloader();

	function update(next: { kind?: string; page?: number; limit?: number }) {
		const params = new URLSearchParams();
		if (closing) params.set('closing', String(closing));
		if (date) params.set('date', date);
		const k = next.kind ?? kind;
		if (k) params.set('kind', k);
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
	const selectedKinds = kindParam.length ? kindParam : allowedKinds;
	const selectedCount = counts ? selectedKinds.reduce((s, k) => s + (counts[k] ?? 0), 0) : 0;

	let sources: CashSourceRow[] | undefined;
	let title = 'Davr harakatlari';
	let sub: string | undefined;
	if (closing) {
		const c = closingQuery.data;
		sources = c?.sources;
		title = c ? `Topshirish #${c.number} harakatlari` : 'Topshirish harakatlari';
		sub = c ? `${c.is_initial ? "Boshlang'ich" : formatDateTime(c.period_start)} → ${formatDateTime(c.closed_at)}` : undefined;
	} else if (date) {
		sources = dailyQuery.data?.sources;
		title = 'Kun harakatlari';
		sub = formatDate(date);
	} else {
		const c = currentQuery.data;
		sources = c?.sources;
		sub = c?.period_start ? `${formatDateTime(c.period_start)} → hozir` : c ? 'boshlanmagan' : undefined;
	}
	const cardCodes = [...new Set((sources ?? []).flatMap((s) => Object.keys(s.amounts).filter((k) => k.startsWith('card'))))];
	const totals = sources && {
		som: sumSources(sources, ['cash_som'], selectedKinds),
		usd: sumSources(sources, ['cash_usd'], selectedKinds),
		transfer: sumSources(sources, ['transfer'], selectedKinds),
		card: sumSources(sources, cardCodes, selectedKinds),
	};

	const tabs: { key: string; label: string; count?: number }[] = [
		{ key: '', label: 'Hammasi', count: counts ? allowedKinds.reduce((s, k) => s + (counts[k] ?? 0), 0) : undefined },
		...allowedKinds.map((k) => ({ key: k, label: SOURCE_LABELS[k], count: counts?.[k] })),
	];

	return (
		<Panel
			title={<PanelTitle title={title} sub={sub} />}
			actions={
				<>
					{closing && (
						<Button type='button' variant='info' size='sm' onClick={() => navigate(`/kassa/closings/${closing}`)}>
							<FaArrowLeft className='mr-1.5' /> Aktga qaytish
						</Button>
					)}
					{date && (
						<Button
							type='button'
							variant='info'
							size='sm'
							onClick={() => navigate(date === todayIso() ? '/kassa/current?tab=daily' : `/kassa/current?tab=daily&date=${date}`)}
						>
							<FaArrowLeft className='mr-1.5' /> Hisobotga qaytish
						</Button>
					)}
					<Button
						type='button'
						variant='inverse'
						size='sm'
						loading={excel.busy}
						onClick={() =>
							excel.download(() =>
								date
									? cashRegisterService.dailyExcel(date)
									: cashRegisterService.movementsExcel({ kind: kind || undefined, closing }),
							)
						}
					>
						<FaFileExcel className='mr-1.5' /> Excel
					</Button>
				</>
			}
		>
			<div className='mb-3 flex flex-wrap gap-1.5'>
				{tabs.map((t) => (
					<button
						key={t.key || 'all'}
						type='button'
						onClick={() => update({ kind: t.key, page: 1 })}
						className={cn(
							'h-8 rounded-[3px] border px-3 text-sm transition-colors',
							kind === t.key
								? 'border-ca-theme bg-ca-theme text-white'
								: 'border-ca-border bg-ca-silver text-ca-heading hover:bg-ca-border',
						)}
					>
						{t.label}
						{t.count !== undefined && ` (${t.count})`}
					</button>
				))}
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
										<KTd>{row.created_by || '—'}</KTd>
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
