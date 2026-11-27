import { useState, type ReactNode } from 'react';
import {
	FaArrowLeft,
	FaCheck,
	FaExclamationTriangle,
	FaFileExcel,
	FaListUl,
	FaPrint,
	FaRegClock,
	FaUndoAlt,
} from 'react-icons/fa';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Panel } from '@/components/ui';
import { formatDateTime } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/errors';
import { usePermissions } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import CancelClosingModal from '@/pages/kassa/KassaClosingDetailPage/CancelClosingModal';
import { ClosingStatusPill } from '@/pages/kassa/KassaClosingsPage';
import { ChannelIcon, DiffPill, ErrorBox, InfoStrip, KTable, KTd, KTh, LoadingBlock, PanelTitle, StatCard } from '@/pages/kassa/shared';
import { useCompanyName, useFileDownloader, usePdfOpener } from '@/pages/kassa/hooks';
import { closingTypeLabel } from '@/pages/kassa/kassaType';
import { KassaTypeBadge } from '@/pages/kassa/KassaTypeUi';
import {
	channelLabel,
	durationLabel,
	fmtAmount,
	fmtChannel,
	fmtShortDateTime,
	fmtSigned,
	fmtUsd,
	num,
	round2,
	signTone,
	SOURCE_LABELS,
	SOURCE_SHORT,
} from '@/pages/kassa/utils';
import {
	useCashClosingListQuery,
	useCashClosingQuery,
	useCashMovementsQuery,
} from '@/services/cash-register/cash-register.queries';
import { cashRegisterService } from '@/services/cash-register/cash-register.service';
import type { CashClosingLine } from '@/services/cash-register/cash-register.types';

/** "so'm" | "$" | "transfer" | "Humo": the short channel name used in the "Farq" summary. */
function diffLabel(line: CashClosingLine) {
	if (line.channel === 'cash_som') return "so'm";
	if (line.channel === 'cash_usd') return '$';
	if (line.channel === 'transfer') return 'transfer';
	return line.card_name || 'karta';
}

/** Σ of the card columns of an `{ code: money }` row. */
function cardSum(amounts: Record<string, string>, cardCodes: string[]) {
	const codes = cardCodes.length ? cardCodes : Object.keys(amounts).filter((k) => k.startsWith('card'));
	return round2(codes.reduce((s, code) => s + num(amounts[code]), 0));
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className='flex items-baseline justify-between gap-3 py-1.5'>
			<span className='text-sm text-ca-text'>{label}</span>
			<span className='text-right text-base font-bold text-ca-heading'>{children}</span>
		</div>
	);
}

/**
 * 06 "Topshirish akti": the frozen result of one closing of one seller type, built only from that type's
 * records; every seller who entered records in the period gets a row of their own.
 */
export default function KassaClosingDetailPage() {
	const { id } = useParams();
	const closingId = Number(id) || 0;
	const navigate = useNavigate();
	const location = useLocation();
	const companyName = useCompanyName();
	const { canCancelCashClosing } = usePermissions();
	const pdf = usePdfOpener();
	const excel = useFileDownloader();
	const [cancelOpen, setCancelOpen] = useState(false);

	const { data, isLoading, isError, error } = useCashClosingQuery(closingId || undefined);
	// Only the latest closed closing of the same type may be cancelled; the other types are untouched.
	// Pre-split closings (`type: null`) can't be cancelled: the kassa they closed no longer exists.
	const latestQuery = useCashClosingListQuery(
		{ user_type: data?.user_type ?? undefined, status: 'closed', ordering: '-number', limit: 1 },
		canCancelCashClosing && data?.user_type != null,
	);
	const countsQuery = useCashMovementsQuery(
		{ closing: closingId, page: 1, limit: 1 },
		Boolean(data && !data.is_initial),
	);

	const goBack = () => (location.key === 'default' ? navigate('/kassa/closings') : navigate(-1));

	if (isLoading) {
		return (
			<Panel title={<PanelTitle title='Topshirish akti' />}>
				<LoadingBlock />
			</Panel>
		);
	}
	if (isError || !data) {
		return (
			<Panel
				title={<PanelTitle title='Topshirish akti' />}
				actions={
					<Button type='button' variant='slate' size='sm' onClick={goBack}>
						<FaArrowLeft className='mr-1.5' /> Orqaga
					</Button>
				}
			>
				<ErrorBox>{getApiErrorMessage(error, 'Topshirish topilmadi')}</ErrorBox>
			</Panel>
		);
	}

	const closing = data;
	const isLatest = latestQuery.data?.results[0]?.id === closing.id;
	const canCancel = canCancelCashClosing && closing.status === 'closed' && closing.user_type !== null && isLatest;
	const correctionCount = countsQuery.data?.counts.correction;

	const recordCounts = closing.sources.filter((s) => s.source !== 'correction');
	const recordTotal = recordCounts.reduce((s, row) => s + (row.count ?? 0), 0);
	const recordSub = [
		...recordCounts
			.filter((row) => row.source !== 'vozvrat' || (row.count ?? 0) > 0)
			.map((row) => `${row.count ?? 0} ${SOURCE_SHORT[row.source]}`),
		...(correctionCount ? [`${correctionCount} tuzatish`] : []),
	].join(' · ');

	const diffUsd = num(closing.total_difference_usd);
	const diffLines = closing.lines.filter((l) => num(l.difference) !== 0);
	const diffSub = diffLines.length
		? diffLines.map((l) => `${diffLabel(l)} ${fmtSigned(l.difference)}`).join(' · ')
		: 'barcha kanallar to\'g\'ri';

	const cardCodes = closing.lines.filter((l) => l.channel === 'card').map((l) => l.code);
	const typeShort = closingTypeLabel(closing.user_type, true);
	const sellers = closing.sellers ?? [];
	const sellerTotals = {
		count: sellers.reduce((s, u) => s + u.count, 0),
		som: round2(sellers.reduce((s, u) => s + num(u.amounts.cash_som), 0)),
		usd: round2(sellers.reduce((s, u) => s + num(u.amounts.cash_usd), 0)),
		transfer: round2(sellers.reduce((s, u) => s + num(u.amounts.transfer), 0)),
		cards: round2(sellers.reduce((s, u) => s + cardSum(u.amounts, cardCodes), 0)),
	};

	return (
		<Panel
			title={<PanelTitle title={`Topshirish akti: ${typeShort} #${closing.number}`} sub={closing.status_display} />}
			actions={
				<>
					<Button type='button' variant='slate' size='sm' onClick={goBack}>
						<FaArrowLeft className='mr-1.5' /> Orqaga
					</Button>
					{!closing.is_initial && (
						<Button
							type='button'
							variant='warning'
							size='sm'
							onClick={() => navigate(`/kassa/movements?closing=${closing.id}`)}
						>
							<FaListUl className='mr-1.5' /> Harakatlar
						</Button>
					)}
					<Button
						type='button'
						variant='excel'
						size='sm'
						loading={excel.busy}
						onClick={() => excel.download(() => cashRegisterService.closingExcel(closing.id, closing.number))}
					>
						<FaFileExcel className='mr-1.5' /> Excel
					</Button>
					<Button
						type='button'
						variant='purple'
						size='sm'
						loading={pdf.busy}
						onClick={() => pdf.open(() => cashRegisterService.closingPdf(closing.id))}
					>
						<FaPrint className='mr-1.5' /> Chop etish
					</Button>
					{canCancel && (
						<Button type='button' variant='danger' size='sm' onClick={() => setCancelOpen(true)}>
							<FaUndoAlt className='mr-1.5' /> Bekor qilish
						</Button>
					)}
				</>
			}
		>
			<div className='space-y-3'>
				{closing.status === 'cancelled' && (
					<InfoStrip tone='red'>
						<span className='flex flex-wrap items-center gap-2'>
							<ClosingStatusPill closing={closing} />
							<span>
								{formatDateTime(closing.cancelled_at, '—')}
								{closing.cancelled_by_name && ` · ${closing.cancelled_by_name}`}
							</span>
						</span>
						{closing.cancel_reason && <span className='mt-1 block'>Sabab: {closing.cancel_reason}</span>}
					</InfoStrip>
				)}

				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
					<StatCard
						icon={<FaRegClock />}
						tone='blue'
						label='Davr'
						value={
							closing.is_initial
								? "Boshlang'ich qoldiq"
								: `${fmtShortDateTime(closing.period_start)} → ${fmtShortDateTime(closing.closed_at)}`
						}
						sub={closing.is_initial ? formatDateTime(closing.closed_at) : durationLabel(closing.period_start, closing.closed_at)}
					/>
					<StatCard
						icon={<FaListUl />}
						tone='teal'
						label='Yozuvlar'
						value={closing.is_initial ? '—' : recordTotal}
						sub={closing.is_initial ? undefined : recordSub}
					/>
					<StatCard
						icon={diffUsd === 0 ? <FaCheck /> : <FaExclamationTriangle />}
						tone={diffUsd < 0 ? 'red' : diffUsd > 0 ? 'orange' : 'green'}
						label='Farq ($ ekv.)'
						value={closing.total_difference_usd == null ? '—' : fmtUsd(diffUsd, { signed: true })}
						valueClassName={cn(diffUsd < 0 && 'text-red-500', diffUsd > 0 && 'text-emerald-500')}
						sub={diffSub}
					/>
					<StatCard
						icon={<FaCheck />}
						tone='green'
						label='Topshirildi ($ ekv.)'
						value={fmtUsd(closing.total_handed_over_usd)}
						sub={`qoldiq: ${fmtUsd(closing.total_rest_usd)}`}
					/>
				</div>

				<KTable>
					<thead>
						<tr>
							<KTh>Kanal</KTh>
							<KTh align='right'>Davr boshi</KTh>
							<KTh align='right'>Aylanma</KTh>
							<KTh align='right'>Dasturda</KTh>
							<KTh align='right'>Sanaldi</KTh>
							<KTh align='right'>Farq</KTh>
							<KTh align='right'>Topshirildi</KTh>
							<KTh align='right'>Qoldiq</KTh>
						</tr>
					</thead>
					<tbody>
						{closing.lines.map((line) => {
							const diff = num(line.difference);
							return (
								<tr key={line.id}>
									<KTd>
										<span className='flex items-center gap-2'>
											<ChannelIcon channel={line.channel} />
											{channelLabel(line)}
										</span>
									</KTd>
									<KTd align='right' className='text-ca-text'>
										{fmtChannel(line.opening, line.channel)}
									</KTd>
									<KTd align='right'>{fmtChannel(line.turnover, line.channel)}</KTd>
									<KTd align='right' className='font-bold'>
										{fmtChannel(line.expected, line.channel)}
									</KTd>
									<KTd align='right'>{fmtChannel(line.actual, line.channel)}</KTd>
									<KTd align='right'>
										<span className='inline-flex items-center gap-1.5'>
											<span className={cn(diff < 0 && 'text-red-500', diff > 0 && 'text-emerald-500', !diff && 'text-ca-text')}>
												{fmtSigned(diff)}
											</span>
											<DiffPill value={diff} />
										</span>
									</KTd>
									<KTd align='right'>{fmtChannel(line.handed_over, line.channel)}</KTd>
									<KTd align='right' className='font-bold'>
										{fmtChannel(line.rest, line.channel)}
									</KTd>
								</tr>
							);
						})}
					</tbody>
				</KTable>

				<div className='grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]'>
					<div>
						{closing.sources.length > 0 && (
							<>
								<div className='mb-1.5 text-xs text-ca-text'>Aylanma manbalar bo'yicha</div>
								<KTable>
									<thead>
										<tr>
											<KTh>Manba</KTh>
											<KTh align='right'>Soni</KTh>
											<KTh align='right'>Naqd so'm</KTh>
											<KTh align='right'>Naqd $</KTh>
											<KTh align='right'>Transfer</KTh>
											<KTh align='right'>Kartalar</KTh>
										</tr>
									</thead>
									<tbody>
										{closing.sources.map((row) => {
											const cards = cardSum(row.amounts, cardCodes);
											const count = row.source === 'correction' ? correctionCount : row.count;
											return (
												<tr key={row.source}>
													<KTd>{SOURCE_LABELS[row.source] ?? row.label}</KTd>
													<KTd align='right'>{count ?? '—'}</KTd>
													<KTd align='right' className={signTone(row.amounts.cash_som)}>
														{fmtSigned(row.amounts.cash_som)}
													</KTd>
													<KTd align='right' className={signTone(row.amounts.cash_usd)}>
														{fmtSigned(row.amounts.cash_usd)}
													</KTd>
													<KTd align='right' className={signTone(row.amounts.transfer)}>
														{fmtSigned(row.amounts.transfer)}
													</KTd>
													<KTd align='right' className={signTone(cards)}>
														{fmtSigned(cards)}
													</KTd>
												</tr>
											);
										})}
									</tbody>
								</KTable>
							</>
						)}
						{sellers.length > 0 && (
							<>
								<div className='mt-3 mb-1.5 text-xs text-ca-text'>
									Sotuvchilar bo'yicha (shu davrda yozuv kiritganlar)
								</div>
								<KTable>
									<thead>
										<tr>
											<KTh>Sotuvchi</KTh>
											<KTh align='right'>Yozuvlar</KTh>
											<KTh align='right'>Naqd so'm</KTh>
											<KTh align='right'>Naqd $</KTh>
											<KTh align='right'>Transfer</KTh>
											<KTh align='right'>Kartalar</KTh>
										</tr>
									</thead>
									<tbody>
										{sellers.map((u, i) => {
											const cards = cardSum(u.amounts, cardCodes);
											return (
												<tr key={u.user ?? `x-${i}`}>
													<KTd>{u.name || '—'}</KTd>
													<KTd align='right'>{u.count}</KTd>
													<KTd align='right' className={signTone(u.amounts.cash_som)}>
														{fmtAmount(u.amounts.cash_som)}
													</KTd>
													<KTd align='right' className={signTone(u.amounts.cash_usd)}>
														{fmtChannel(u.amounts.cash_usd, 'cash_usd')}
													</KTd>
													<KTd align='right' className={signTone(u.amounts.transfer)}>
														{fmtAmount(u.amounts.transfer)}
													</KTd>
													<KTd align='right' className={signTone(cards)}>
														{fmtAmount(cards)}
													</KTd>
												</tr>
											);
										})}
										<tr className='bg-ca-silver'>
											<KTd className='font-bold'>Jami aylanma</KTd>
											<KTd align='right' className='font-bold'>
												{sellerTotals.count}
											</KTd>
											<KTd align='right' className='font-bold'>
												{fmtAmount(sellerTotals.som)}
											</KTd>
											<KTd align='right' className='font-bold'>
												{fmtChannel(sellerTotals.usd, 'cash_usd')}
											</KTd>
											<KTd align='right' className='font-bold'>
												{fmtAmount(sellerTotals.transfer)}
											</KTd>
											<KTd align='right' className='font-bold'>
												{fmtAmount(sellerTotals.cards)}
											</KTd>
										</tr>
									</tbody>
								</KTable>
							</>
						)}
					</div>

					<div className='rounded-md border border-ca-border bg-ca-silver px-4 py-3'>
						<InfoRow label='Kassa turi'>
							<KassaTypeBadge type={closing.user_type} />
						</InfoRow>
						<InfoRow label='Topshirdi'>{closing.created_by_name || '—'}</InfoRow>
						<InfoRow label='Qabul qildi'>{closing.received_by_name || '—'}</InfoRow>
						<InfoRow label='Yakunlangan'>{formatDateTime(closing.closed_at, '—')}</InfoRow>
						<InfoRow label='Tashkilot'>{companyName || '—'}</InfoRow>
						{closing.exchange_rate && <InfoRow label='Kurs'>1$ = {fmtChannel(closing.exchange_rate, 'cash_som')} so'm</InfoRow>}
						<div className='mt-2 border-t border-ca-border pt-2'>
							<div className='text-xs text-ca-text'>Izoh</div>
							<div className='mt-1 text-sm whitespace-pre-wrap text-ca-heading'>{closing.comment || '—'}</div>
						</div>
						<div className='mt-6 flex justify-between gap-4 text-xs text-ca-text'>
							<span>Topshirdi: ____________</span>
							<span>Qabul qildi: ____________</span>
						</div>
					</div>
				</div>
			</div>

			{canCancel && <CancelClosingModal closing={closing} open={cancelOpen} onOpenChange={setCancelOpen} />}
		</Panel>
	);
}
