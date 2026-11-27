import type { ReactNode } from 'react';
import { FaLock, FaStore, FaTruck, FaWarehouse } from 'react-icons/fa';
import { TbSum } from 'react-icons/tb';
import { Navigate, useNavigate } from 'react-router-dom';
import { Panel } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { formatDateTime } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { usePermissions } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useCompanyName } from '@/pages/kassa/hooks';
import { kassaTypeLabel } from '@/pages/kassa/kassaType';
import { KassaTypeBadge } from '@/pages/kassa/KassaTypeUi';
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
	PanelTitle,
	STAT_GRID,
	StatCard,
} from '@/pages/kassa/shared';
import { cardItems, channelLabel, fmtChannel, fmtShortDateTime, fmtUsd, isCardChannel, num } from '@/pages/kassa/utils';
import { useCashRegisterSummaryQuery } from '@/services/cash-register/cash-register.queries';
import type { CashRegisterType } from '@/services/cash-register/cash-register.types';
import type { Tone } from '@/pages/kassa/utils';

const TYPE_STAT: Record<CashRegisterType, { icon: ReactNode; tone: Tone }> = {
	1: { icon: <FaStore />, tone: 'blue' },
	2: { icon: <FaWarehouse />, tone: 'purple' },
	3: { icon: <FaTruck />, tone: 'orange' },
};

/**
 * 00 "Umumiy holat" (Super Admin / Admin): the three seller-type kassas side by side. Each is kept and handed
 * over on its own; the "Jami" row is the company kassa (Do'kon + Sklad + Dastavka).
 */
export default function KassaOverviewPage() {
	const { canViewAllKassaTypes } = usePermissions();
	if (!canViewAllKassaTypes) return <Navigate to='/kassa/current' replace />;
	return <KassaOverviewContent />;
}

function KassaOverviewContent() {
	const navigate = useNavigate();
	const companyName = useCompanyName();
	const { canWrite } = useCurrentCompany();
	const { data, isLoading, isError, error, isFetching } = useCashRegisterSummaryQuery();

	const title = <PanelTitle title='Kassa: umumiy holat' sub={companyName || undefined} />;
	if (isLoading) {
		return (
			<Panel title={title}>
				<LoadingBlock />
			</Panel>
		);
	}
	if (isError || !data) {
		return (
			<Panel title={title}>
				<ErrorBox>{getApiErrorMessage(error, "Kassani yuklab bo'lmadi")}</ErrorBox>
			</Panel>
		);
	}

	const { channels, types, totals } = data;
	const initialTypes = totals.initial_types ?? [];
	// Naqd so'm, naqd dollar and transfer keep a column each; every card shares one "Karta" column.
	const plainChannels = channels.filter((c) => !isCardChannel(c));
	const cardChannels = channels.filter(isCardChannel);
	const hasCards = cardChannels.length > 0;
	const fullTypes = types.length - initialTypes.length;

	return (
		<Panel title={title}>
			<div className={cn('space-y-3 transition-opacity', isFetching && 'opacity-70')}>
				<InfoStrip>
					Har bir xodim turining kassasi <b>alohida yuritiladi va alohida topshiriladi</b>. Yozuv (buyurtma, qarz
					to'lovi, xarajat, vozvrat) uni kiritgan foydalanuvchining turi bo'yicha kassaga tushadi. Pastdagi "Jami"
					qatori kompaniyaning umumiy kassasiga teng.
				</InfoStrip>
				<CardUnassignedWarning total={totals.card_unassigned} />
				{initialTypes.length > 0 && (
					<InfoStrip tone='orange'>
						<b>Jami to'liq emas:</b> {initialTypes.map((t) => kassaTypeLabel(t)).join(', ')} kassasida hali
						boshlang'ich qoldiq kiritilmagan, u jamiga qo'shilmagan. Qulf tugmasi orqali boshlang'ich topshirishni
						qiling.
					</InfoStrip>
				)}

				<div className={cn(STAT_GRID, 'xl:grid-cols-4')}>
					{types.map((row) => (
						<StatCard
							key={row.user_type}
							icon={TYPE_STAT[row.user_type].icon}
							tone={TYPE_STAT[row.user_type].tone}
							label={row.user_type_label || kassaTypeLabel(row.user_type)}
							value={row.is_initial ? '—' : fmtUsd(row.expected_usd)}
							sub={
								row.is_initial
									? "boshlang'ich qoldiq kiritilmagan"
									: `${row.count ?? 0} yozuv${row.previous ? ` · oxirgi #${row.previous.number}, ${fmtShortDateTime(row.previous.closed_at)}` : ''}`
							}
						/>
					))}
					<StatCard
						icon={<TbSum />}
						tone='green'
						label='Jami ($ ekvivalent)'
						value={fmtUsd(totals.expected_usd)}
						sub={[
							initialTypes.length ? `${fullTypes} ta kassa (to'liq emas)` : `${types.length} ta kassa yig'indisi`,
							data.exchange_rate ? `kurs 1$ = ${formatNumber(num(data.exchange_rate))} so'm` : null,
						]
							.filter(Boolean)
							.join(' · ')}
					/>
				</div>

				<KTable>
					<thead>
						<tr>
							<KTh>Kassa turi</KTh>
							<KTh>Davr boshi</KTh>
							<KTh align='right'>Yozuvlar</KTh>
							{plainChannels.map((ch) => (
								<KTh key={ch.code} align='right'>
									{channelLabel(ch)}
								</KTh>
							))}
							{hasCards && <KTh align='right'>Karta</KTh>}
							<KTh align='right'>Jami ($ ekv.)</KTh>
							<KTh className='w-16' />
						</tr>
					</thead>
					<tbody>
						{types.map((row) => (
							<tr key={row.user_type} className='hover:bg-ca-table-hover'>
								<KTd>
									<KassaTypeBadge type={row.user_type} />
								</KTd>
								<KTd className={cn(row.is_initial && 'text-ca-text')}>
									{row.is_initial
										? "Boshlang'ich qoldiq kiritilmagan"
										: `${formatDateTime(row.period_start, '—')}${row.previous ? ` (#${row.previous.number})` : ''}`}
								</KTd>
								<KTd align='right' className={cn(row.is_initial && 'text-ca-text/60')}>
									{row.count ?? '—'}
								</KTd>
								{plainChannels.map((ch) => {
									const amount = row.amounts?.[ch.code];
									if (amount == null) {
										return (
											<KTd key={ch.code} align='right' className='text-ca-text/60'>
												—
											</KTd>
										);
									}
									return (
										<KTd
											key={ch.code}
											align='right'
											className={cn(!num(amount) && 'text-ca-text/70', num(amount) < 0 && 'text-red-500')}
										>
											{fmtChannel(amount, ch.channel)}
										</KTd>
									);
								})}
								{hasCards && (
									<KTd
										align='right'
										className={cn(!num(row.card_total) && 'text-ca-text/70', num(row.card_total) < 0 && 'text-red-500')}
									>
										<CardBreakdown
											total={row.amounts ? row.card_total : null}
											items={cardItems(cardChannels, (ch) => row.amounts?.[ch.code])}
											title={`${kassaTypeLabel(row.user_type, true)}: kartalar bo'yicha`}
										/>
									</KTd>
								)}
								<KTd align='right' className={cn('font-bold', row.is_initial && 'font-normal text-ca-text/60')}>
									{row.is_initial ? '—' : fmtUsd(row.expected_usd)}
								</KTd>
								<KTd align='center'>
									<span className='inline-flex gap-1'>
										<EyeButton
											title='Joriy kassani ochish'
											onClick={() => navigate(`/kassa/current?type=${row.user_type}`)}
										/>
										<button
											type='button'
											title={row.is_initial ? "Boshlang'ich qoldiqni kiritish" : 'Kassani topshirish'}
											aria-label={row.is_initial ? "Boshlang'ich qoldiqni kiritish" : 'Kassani topshirish'}
											disabled={!canWrite}
											onClick={() => navigate(`/kassa/close?type=${row.user_type}`)}
											className='inline-flex h-6 w-7 items-center justify-center rounded-[3px] bg-amber-500 text-xs text-white transition-colors hover:bg-amber-600 disabled:pointer-events-none disabled:opacity-40'
										>
											<FaLock />
										</button>
									</span>
								</KTd>
							</tr>
						))}
						<tr className='bg-ca-silver'>
							<KTd colSpan={2} className='font-bold'>
								Jami (kompaniya kassasi){initialTypes.length > 0 && <span className='font-normal text-amber-500'> · to'liq emas</span>}
							</KTd>
							<KTd align='right' className='font-bold'>
								{totals.count}
							</KTd>
							{plainChannels.map((ch) => (
								<KTd key={ch.code} align='right' className='font-bold'>
									{fmtChannel(totals.amounts[ch.code], ch.channel)}
								</KTd>
							))}
							{hasCards && (
								<KTd align='right' className='font-bold'>
									<CardBreakdown
										total={totals.card_total}
										items={cardItems(cardChannels, (ch) => totals.amounts[ch.code])}
										title="Kompaniya kassasi: kartalar bo'yicha"
									/>
								</KTd>
							)}
							<KTd align='right' className='font-bold'>
								{fmtUsd(totals.expected_usd)}
							</KTd>
							<KTd />
						</tr>
					</tbody>
				</KTable>

				<div className='text-xs text-ca-text'>
					Summalar = davr boshidagi qoldiq + shu davr aylanmasi (dasturda kutilgan). Yozuvlar soni tuzatishlarsiz. Jami
					($ ekv.) = so'm, transfer va kartalar / kurs + naqd $.
				</div>
			</div>
		</Panel>
	);
}
