import { FaCreditCard, FaDollarSign, FaExchangeAlt, FaMoneyBillWave, FaLock } from 'react-icons/fa';
import { TbSum } from 'react-icons/tb';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { formatDateTime } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { cn } from '@/lib/utils';
import {
	CardBreakdown,
	CardUnassignedWarning,
	ErrorBox,
	EyeButton,
	InfoStrip,
	KTable,
	KTd,
	KTh,
	LoadingBlock,
	Pill,
	STAT_GRID,
	StatCard,
} from '@/pages/kassa/shared';
import { kassaTypeLabel } from '@/pages/kassa/kassaType';
import { KassaTypeBadge } from '@/pages/kassa/KassaTypeUi';
import {
	cardItems,
	channelLabel,
	fmtAmount,
	fmtChannel,
	fmtShortDateTime,
	fmtSigned,
	fmtUsd,
	isCardChannel,
	num,
	signTone,
	sourceBadge,
} from '@/pages/kassa/utils';
import { useCashMovementsQuery, useCashRegisterCurrentQuery } from '@/services/cash-register/cash-register.queries';
import type { CashRegisterChannel, CashRegisterType } from '@/services/cash-register/cash-register.types';

function channelStat(ch: CashRegisterChannel | undefined) {
	if (!ch) return { value: '—', sub: undefined };
	return {
		value: ch.channel === 'cash_usd' ? fmtChannel(ch.expected, 'cash_usd') : `${fmtAmount(ch.expected)} so'm`,
		sub: `boshida ${fmtChannel(ch.opening, ch.channel)} · ${fmtChannel(ch.turnover, ch.channel, true)}`,
	};
}

/**
 * 01 "Joriy davr" of one kassa type: opening + every source of the open period = what the program expects.
 * Only records whose creator has this `type` are counted. Every card sits in one "Karta" column (the backend's
 * totals); a click on a card amount lists the cards behind it.
 */
export default function CurrentTab({ type, canWrite }: { type: CashRegisterType; canWrite: boolean }) {
	const navigate = useNavigate();
	const { data, isLoading, isError, error, isFetching } = useCashRegisterCurrentQuery(type);
	// `sources[correction].count` is null: the number of corrections comes from the movements' counts.
	const countsQuery = useCashMovementsQuery({ user_type: type, page: 1, limit: 1 }, Boolean(data && !data.is_initial));
	const short = kassaTypeLabel(type, true);

	if (isLoading) return <LoadingBlock />;
	if (isError || !data) return <ErrorBox>{getApiErrorMessage(error, "Kassani yuklab bo'lmadi")}</ErrorBox>;

	if (data.is_initial) {
		return (
			<div className='space-y-4'>
				<InfoStrip>
					Kassa: <KassaTypeBadge type={type} /> <b>Hali topshirish yo'q.</b> Shu kassadagi pulni sanab,
					boshlang'ich qoldiqni kiriting. Birinchi topshirishda sanalgan summa kassaning boshlang'ich qoldig'i
					sifatida yoziladi.
				</InfoStrip>
				<CardUnassignedWarning total={data.card_unassigned?.total} sources={data.card_unassigned?.sources} />
				<div className='flex justify-center rounded-md border border-dashed border-ca-border py-10'>
					<Button
						type='button'
						variant='success'
						size='md'
						disabled={!canWrite}
						onClick={() => navigate(`/kassa/close?type=${type}`)}
					>
						<FaLock className='mr-1.5' /> Boshlang'ich qoldiqni kiritish
					</Button>
				</div>
			</div>
		);
	}

	const { channels, sources, previous, card_summary: cardSummary } = data;
	const byCode = (code: string) => channels.find((c) => c.code === code);
	// Naqd so'm, naqd dollar and transfer keep a column each; the cards share one.
	const plainChannels = channels.filter((c) => !isCardChannel(c));
	const hasCards = channels.some(isCardChannel);
	const cardChannels = channels.filter((c) => cardSummary.codes.includes(c.code));
	const correctionCount = countsQuery.data?.counts.correction;
	const countOf = (source: string, count: number | null) =>
		source === 'correction' ? (correctionCount ?? null) : count;
	const totalCount = sources.reduce((s, row) => s + (countOf(row.source, row.count) ?? 0), 0);

	const som = channelStat(byCode('cash_som'));
	const usd = channelStat(byCode('cash_usd'));
	const transfer = channelStat(byCode('transfer'));

	return (
		<div className={cn('space-y-3 transition-opacity', isFetching && 'opacity-70')}>
			<InfoStrip>
				Kassa: <KassaTypeBadge type={type} /> Joriy davr: <b>{formatDateTime(data.period_start, '—')}</b>
				{previous && (
					<>
						{' '}
						({short} #{previous.number} topshirishdan keyin)
					</>
				)}{' '}
				→ <b>hozir</b>. Faqat <b>{kassaTypeLabel(type).toLowerCase()}</b> turidagi foydalanuvchilar kiritgan buyurtma,
				qarz to'lovi, xarajat va vozvratlar hisoblanadi. Summalar yozuvlarning <b>joriy holatidan</b> olinadi: yozuv
				qo'shilsa, tahrirlansa yoki o'chirilsa kassa darhol o'zgaradi.
			</InfoStrip>

			<div className={STAT_GRID}>
				<StatCard icon={<FaMoneyBillWave />} tone='green' label="Naqd so'm" value={som.value} sub={som.sub} />
				<StatCard icon={<FaDollarSign />} tone='blue' label='Naqd dollar' value={usd.value} sub={usd.sub} />
				<StatCard icon={<FaExchangeAlt />} tone='teal' label='Transfer' value={transfer.value} sub={transfer.sub} />
				<StatCard
					icon={<FaCreditCard />}
					tone='purple'
					label={`Kartalar (${cardSummary.count} ta)`}
					value={`${fmtAmount(cardSummary.expected)} so'm`}
					sub={`boshida ${fmtAmount(cardSummary.opening)} · ${fmtSigned(cardSummary.turnover)}`}
				/>
				<StatCard
					icon={<TbSum />}
					tone='orange'
					label='Jami ($ ekvivalent)'
					value={fmtUsd(data.totals?.expected_usd)}
					sub={data.exchange_rate ? `kurs 1$ = ${formatNumber(num(data.exchange_rate))} so'm` : 'kurs kiritilmagan'}
				/>
			</div>

			<CardUnassignedWarning total={data.card_unassigned?.total} sources={data.card_unassigned?.sources} />

			<KTable>
				<thead>
					<tr>
						<KTh>Manba</KTh>
						<KTh align='right'>Soni</KTh>
						{plainChannels.map((ch) => (
							<KTh key={ch.code} align='right'>
								{channelLabel(ch)}
							</KTh>
						))}
						{hasCards && <KTh align='right'>Karta</KTh>}
						<KTh className='w-12' />
					</tr>
				</thead>
				<tbody>
					<tr className='text-ca-text italic'>
						<KTd className='text-ca-text'>
							Davr boshidagi qoldiq{previous ? ` (${short} #${previous.number} dan)` : ''}
						</KTd>
						<KTd align='right' className='text-ca-text'>
							—
						</KTd>
						{plainChannels.map((ch) => (
							<KTd key={ch.code} align='right' className='text-ca-text'>
								{fmtAmount(ch.opening)}
							</KTd>
						))}
						{hasCards && (
							<KTd align='right' className='text-ca-text'>
								<CardBreakdown
									total={cardSummary.opening}
									items={cardItems(cardChannels, (ch) => ch.opening)}
									title="Davr boshi, kartalar bo'yicha"
								/>
							</KTd>
						)}
						<KTd />
					</tr>
					{sources.map((row) => {
						const badge = sourceBadge(row.source);
						const count = countOf(row.source, row.count);
						return (
							<tr key={row.source} className='hover:bg-ca-table-hover'>
								<KTd>
									<span className='flex items-center gap-2'>
										<Pill tone={badge.tone}>{badge.label}</Pill>
										{row.label}
									</span>
								</KTd>
								<KTd align='right'>{count ?? '—'}</KTd>
								{plainChannels.map((ch) => (
									<KTd key={ch.code} align='right' className={signTone(row.amounts[ch.code])}>
										{fmtSigned(row.amounts[ch.code])}
									</KTd>
								))}
								{hasCards && (
									<KTd align='right' className={signTone(row.card_total)}>
										<CardBreakdown
											signed
											total={row.card_total ?? 0}
											items={cardItems(cardChannels, (ch) => row.amounts[ch.code])}
											title={`${row.label}, kartalar bo'yicha`}
										/>
									</KTd>
								)}
								<KTd align='center'>
									<EyeButton
										title="Harakatlarni ko'rish"
										onClick={() => navigate(`/kassa/movements?type=${type}&kind=${row.source}`)}
									/>
								</KTd>
							</tr>
						);
					})}
					<tr className='bg-ca-silver font-bold'>
						<KTd className='font-bold'>Dasturdagi summa (kutilgan)</KTd>
						<KTd align='right' className='font-bold'>
							{totalCount}
						</KTd>
						{plainChannels.map((ch) => (
							<KTd key={ch.code} align='right' className='font-bold'>
								{fmtChannel(ch.expected, ch.channel)}
							</KTd>
						))}
						{hasCards && (
							<KTd align='right' className='font-bold'>
								<CardBreakdown
									total={cardSummary.expected}
									items={cardItems(cardChannels, (ch) => ch.expected)}
									title="Dasturda, kartalar bo'yicha"
								/>
							</KTd>
						)}
						<KTd />
					</tr>
				</tbody>
			</KTable>

			<div className='flex flex-wrap items-center justify-between gap-2 text-xs text-ca-text'>
				<span>
					Oxirgi topshirish:{' '}
					{previous ? (
						<Link to={`/kassa/closings/${previous.id}`} className='text-ca-theme hover:underline'>
							{short} #{previous.number} · {formatDateTime(previous.closed_at)} · {previous.created_by_name}
						</Link>
					) : (
						'—'
					)}
				</span>
				<span>
					"Tuzatish" qatori = {fmtShortDateTime(data.period_start)} gacha yaratilgan, shu turdagi yozuvlarning shu
					davrda tahrirlangani/o'chirilgani
				</span>
			</div>
		</div>
	);
}
