import { useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaCreditCard, FaDollarSign, FaExchangeAlt, FaMoneyBillWave, FaRegClock } from 'react-icons/fa';
import { TbSum } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { cn } from '@/lib/utils';
import { ErrorBox, EyeButton, KTable, KTd, KTh, LoadingBlock, Pill, STAT_GRID, StatCard } from '@/pages/kassa/shared';
import {
	channelLabel,
	fmtAmount,
	fmtChannel,
	fmtSigned,
	fmtUsd,
	isCardChannel,
	num,
	shiftDay,
	signTone,
	sourceBadge,
	todayIso,
	weekdayOf,
} from '@/pages/kassa/utils';
import { useCashRegisterDailyQuery } from '@/services/cash-register/cash-register.queries';
import type { CashRegisterDailyChannel } from '@/services/cash-register/cash-register.types';

function channelStat(ch: CashRegisterDailyChannel | undefined) {
	if (!ch) return { value: '—', sub: undefined };
	return {
		value: ch.channel === 'cash_usd' ? fmtChannel(ch.net, 'cash_usd') : `${fmtAmount(ch.net)} so'm`,
		sub: `kirim ${fmtChannel(ch.income, ch.channel, true)} · chiqim ${fmtChannel(ch.outcome, ch.channel, true)}`,
	};
}

const pillButton =
	'inline-flex h-7 items-center rounded-full border px-3 text-sm transition-colors disabled:pointer-events-none disabled:opacity-40';

/** Day picker: ‹ [17.11.2026, seshanba] › Bugun Kecha. Days after today can't be picked. */
function DayNavigator({ date, onChange }: { date: string; onChange: (date: string) => void }) {
	const inputRef = useRef<HTMLInputElement>(null);
	const today = todayIso();
	const yesterday = shiftDay(today, -1);

	const openPicker = () => {
		const input = inputRef.current;
		if (!input) return;
		try {
			input.showPicker();
		} catch {
			input.focus();
		}
	};

	return (
		<div className='flex flex-wrap items-center gap-2'>
			<button
				type='button'
				aria-label='Oldingi kun'
				onClick={() => onChange(shiftDay(date, -1))}
				className='flex h-7 w-7 items-center justify-center rounded-[3px] border border-ca-border bg-ca-silver text-[11px] text-ca-heading hover:bg-ca-border'
			>
				<FaChevronLeft />
			</button>
			<div className='relative'>
				<button
					type='button'
					onClick={openPicker}
					className='flex h-8 items-center gap-2 rounded-[3px] border border-ca-theme bg-ca-silver px-3 text-sm font-semibold text-ca-heading'
				>
					<FaRegClock className='text-ca-text' />
					{formatDate(date)}, {weekdayOf(date)}
				</button>
				<input
					ref={inputRef}
					type='date'
					max={today}
					value={date}
					tabIndex={-1}
					aria-hidden='true'
					onChange={(e) => {
						const next = e.target.value;
						if (next && next <= today) onChange(next);
					}}
					className='pointer-events-none absolute inset-0 h-full w-full opacity-0'
				/>
			</div>
			<button
				type='button'
				aria-label='Keyingi kun'
				disabled={date >= today}
				onClick={() => onChange(shiftDay(date, 1))}
				className='flex h-7 w-7 items-center justify-center rounded-[3px] border border-ca-border bg-ca-silver text-[11px] text-ca-heading hover:bg-ca-border disabled:pointer-events-none disabled:opacity-40'
			>
				<FaChevronRight />
			</button>
			<button
				type='button'
				onClick={() => onChange(today)}
				className={cn(
					pillButton,
					date === today ? 'border-ca-theme text-ca-theme' : 'border-ca-border text-ca-heading hover:bg-ca-silver',
				)}
			>
				Bugun
			</button>
			<button
				type='button'
				onClick={() => onChange(yesterday)}
				className={cn(
					pillButton,
					date === yesterday ? 'border-ca-theme text-ca-theme' : 'border-ca-border text-ca-heading hover:bg-ca-silver',
				)}
			>
				Kecha
			</button>
		</div>
	);
}

/** 07 "Sana bo'yicha hisobot": orders, debt payments and expenses entered on one calendar day. */
export default function DailyTab({ date, onDateChange }: { date: string; onDateChange: (date: string) => void }) {
	const navigate = useNavigate();
	// Today goes without `date`, so a client clock running ahead never asks for a "future" day.
	const { data, isLoading, isError, error, isFetching } = useCashRegisterDailyQuery(
		date === todayIso() ? undefined : date,
	);

	const header = (
		<div className='flex flex-wrap items-center justify-between gap-2'>
			<DayNavigator date={date} onChange={onDateChange} />
			<span className='text-xs text-ca-text'>
				Faqat <b className='text-ca-heading'>{formatDate(date)}</b> kuni (00:00 → 23:59) kiritilgan buyurtma, qarz
				to'lovi va xarajatlar
			</span>
		</div>
	);

	if (isLoading)
		return (
			<div className='space-y-3'>
				{header}
				<LoadingBlock />
			</div>
		);
	if (isError || !data)
		return (
			<div className='space-y-3'>
				{header}
				<ErrorBox>{getApiErrorMessage(error, "Hisobotni yuklab bo'lmadi")}</ErrorBox>
			</div>
		);

	const { channels, sources, totals } = data;
	const byCode = (code: string) => channels.find((c) => c.code === code);
	const cards = channels.filter(isCardChannel);
	const sum = (key: 'net' | 'income' | 'outcome') => cards.reduce((s, c) => s + num(c[key]), 0);

	const som = channelStat(byCode('cash_som'));
	const usd = channelStat(byCode('cash_usd'));
	const transfer = channelStat(byCode('transfer'));

	return (
		<div className='space-y-3'>
			{header}
			<div className={cn('space-y-3 transition-opacity', isFetching && 'opacity-70')}>
				<div className={STAT_GRID}>
					<StatCard icon={<FaMoneyBillWave />} tone='green' label="Naqd so'm" value={som.value} sub={som.sub} />
					<StatCard icon={<FaDollarSign />} tone='blue' label='Naqd dollar' value={usd.value} sub={usd.sub} />
					<StatCard icon={<FaExchangeAlt />} tone='teal' label='Transfer' value={transfer.value} sub={transfer.sub} />
					<StatCard
						icon={<FaCreditCard />}
						tone='purple'
						label={`Kartalar (${cards.length} ta)`}
						value={`${fmtAmount(sum('net'))} so'm`}
						sub={`kirim ${fmtSigned(sum('income'))} · chiqim ${fmtSigned(sum('outcome'))}`}
					/>
					<StatCard
						icon={<TbSum />}
						tone='orange'
						label='Jami ($ ekvivalent)'
						value={fmtUsd(totals.net_usd)}
						sub={data.exchange_rate ? `kurs 1$ = ${formatNumber(num(data.exchange_rate))} so'm` : 'kurs kiritilmagan'}
					/>
				</div>

				<KTable>
					<thead>
						<tr>
							<KTh>Manba</KTh>
							<KTh align='right'>Soni</KTh>
							{channels.map((ch) => (
								<KTh key={ch.code} align='right'>
									{channelLabel(ch)}
								</KTh>
							))}
							<KTh align='right'>Jami ($ ekv.)</KTh>
							<KTh className='w-12' />
						</tr>
					</thead>
					<tbody>
						{sources.map((row) => {
							const badge = sourceBadge(row.source);
							return (
								<tr key={row.source} className='hover:bg-ca-table-hover'>
									<KTd>
										<span className='flex items-center gap-2'>
											<Pill tone={badge.tone}>{badge.label}</Pill>
											{row.label}
										</span>
									</KTd>
									<KTd align='right'>{row.count ?? '—'}</KTd>
									{channels.map((ch) => (
										<KTd key={ch.code} align='right' className={signTone(row.amounts[ch.code])}>
											{fmtSigned(row.amounts[ch.code])}
										</KTd>
									))}
									<KTd align='right' className={cn('font-bold', num(row.total_usd) < 0 && 'text-red-500')}>
										{fmtUsd(row.total_usd)}
									</KTd>
									<KTd align='center'>
										<EyeButton
											title="Yozuvlarni ko'rish"
											onClick={() => navigate(`/kassa/movements?date=${data.date}&kind=${row.source}`)}
										/>
									</KTd>
								</tr>
							);
						})}
						<tr className='bg-ca-silver'>
							<KTd className='font-bold'>Jami ({formatDate(data.date)})</KTd>
							<KTd align='right' className='font-bold'>
								{totals.count}
							</KTd>
							{channels.map((ch) => (
								<KTd key={ch.code} align='right' className='font-bold'>
									{fmtChannel(ch.net, ch.channel)}
								</KTd>
							))}
							<KTd align='right' className='font-bold'>
								{fmtUsd(totals.net_usd)}
							</KTd>
							<KTd />
						</tr>
					</tbody>
				</KTable>

				<div className='flex flex-wrap items-center justify-between gap-2 text-xs text-ca-text'>
					<span>
						Kun:{' '}
						<span className='text-ca-theme'>
							{formatDate(data.date)} · {weekdayOf(data.date)}
						</span>
						{data.is_today && ' · hozirgacha (kun tugamagan)'}
					</span>
					<span>Jami ($ ekv.) = so'm, transfer va kartalar / kurs + naqd $</span>
				</div>
			</div>
		</div>
	);
}
