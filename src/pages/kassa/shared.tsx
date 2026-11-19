import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { FaCreditCard, FaDollarSign, FaExchangeAlt, FaExclamationTriangle, FaEye, FaMoneyBillWave } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import type { CashChannelKind } from '@/services/cash-register/cash-register.types';
import { round2, type Tone } from '@/pages/kassa/utils';

const TONE_SOFT: Record<Tone, string> = {
	green: 'bg-emerald-500/15 text-emerald-500',
	red: 'bg-red-500/15 text-red-500',
	orange: 'bg-amber-500/15 text-amber-500',
	blue: 'bg-ca-theme/15 text-ca-theme',
	gray: 'bg-slate-500/15 text-slate-400',
	purple: 'bg-violet-500/15 text-violet-400',
	teal: 'bg-teal-500/15 text-teal-400',
};

const TONE_SOLID: Record<Tone, string> = {
	green: 'bg-emerald-500 text-white',
	red: 'bg-red-500 text-white',
	orange: 'bg-amber-500 text-white',
	blue: 'bg-ca-theme text-white',
	gray: 'bg-slate-500 text-white',
	purple: 'bg-violet-500 text-white',
	teal: 'bg-teal-500 text-white',
};

/** Small solid label: "Kirim", "Kamomad", "Buyurtma"… */
export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-[3px] px-1.5 py-0.5 text-[11px] leading-4 font-semibold whitespace-nowrap',
				TONE_SOLID[tone],
				className,
			)}
		>
			{children}
		</span>
	);
}

/** "Kamomad" (< 0) / "Ortiqcha" (> 0) / "To'g'ri" (0). */
export function DiffPill({ value }: { value: number }) {
	const v = round2(value);
	if (v < 0) return <Pill tone='red'>Kamomad</Pill>;
	if (v > 0) return <Pill tone='orange'>Ortiqcha</Pill>;
	return <Pill tone='green'>To'g'ri</Pill>;
}

const CHANNEL_ICON: Record<CashChannelKind, { icon: ReactNode; tone: Tone }> = {
	cash_som: { icon: <FaMoneyBillWave />, tone: 'green' },
	cash_usd: { icon: <FaDollarSign />, tone: 'blue' },
	transfer: { icon: <FaExchangeAlt />, tone: 'teal' },
	card: { icon: <FaCreditCard />, tone: 'purple' },
};

export function ChannelIcon({ channel, className }: { channel: CashChannelKind; className?: string }) {
	const { icon, tone } = CHANNEL_ICON[channel];
	return (
		<span
			className={cn(
				'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs',
				TONE_SOFT[tone],
				className,
			)}
		>
			{icon}
		</span>
	);
}

export function StatCard({
	icon,
	tone,
	label,
	value,
	sub,
	valueClassName,
}: {
	icon: ReactNode;
	tone: Tone;
	label: ReactNode;
	value: ReactNode;
	sub?: ReactNode;
	valueClassName?: string;
}) {
	return (
		<div className='flex min-w-0 items-center gap-3 rounded-md border border-ca-border bg-ca-silver px-3 py-3'>
			<span
				className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg', TONE_SOFT[tone])}
			>
				{icon}
			</span>
			<div className='min-w-0'>
				<div className='truncate text-xs text-ca-heading'>{label}</div>
				<div className={cn('truncate text-xl leading-7 font-bold text-ca-heading tabular-nums', valueClassName)}>
					{value}
				</div>
				{sub && <div className='truncate text-[11px] text-ca-text'>{sub}</div>}
			</div>
		</div>
	);
}

export const STAT_GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

/** Bordered, horizontally scrollable table shell used by every kassa table. */
export function KTable({
	children,
	className,
	tableClassName,
}: {
	children: ReactNode;
	className?: string;
	tableClassName?: string;
}) {
	return (
		<div className={cn('overflow-x-auto rounded-md border border-ca-border', className)}>
			<table className={cn('w-full border-collapse text-sm', tableClassName)}>{children}</table>
		</div>
	);
}

export function KTh({ className, align = 'left', ...props }: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
	return (
		<th
			className={cn(
				'border-b border-ca-border bg-ca-silver px-3 py-2.5 font-semibold whitespace-nowrap text-ca-heading',
				'[&:not(:last-child)]:border-r',
				align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
				className,
			)}
			{...props}
		/>
	);
}

export function KTd({ className, align = 'left', ...props }: TdHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
	return (
		<td
			className={cn(
				'border-t border-ca-border px-3 py-2.5 align-middle whitespace-nowrap text-ca-heading',
				'[&:not(:last-child)]:border-r',
				align === 'right' ? 'text-right tabular-nums' : align === 'center' ? 'text-center' : 'text-left',
				className,
			)}
			{...props}
		/>
	);
}

export function EyeButton({ onClick, disabled, title = "Ko'rish" }: { onClick: () => void; disabled?: boolean; title?: string }) {
	return (
		<button
			type='button'
			onClick={onClick}
			disabled={disabled}
			title={title}
			aria-label={title}
			className='inline-flex h-6 w-7 items-center justify-center rounded-[3px] bg-ca-aqua text-xs text-white transition-colors hover:bg-[#0891b2] disabled:pointer-events-none disabled:opacity-40'
		>
			<FaEye />
		</button>
	);
}

/** Blue left-bordered explanation strip above a table. */
export function InfoStrip({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'orange' | 'red' }) {
	return (
		<div
			className={cn(
				'rounded-[3px] border-l-[3px] bg-ca-silver px-3 py-2.5 text-sm leading-5 text-ca-heading',
				tone === 'blue' && 'border-ca-theme',
				tone === 'orange' && 'border-amber-500 bg-amber-500/10',
				tone === 'red' && 'border-red-500 bg-red-500/10',
			)}
		>
			{children}
		</div>
	);
}

export function ErrorBox({ children }: { children: ReactNode }) {
	return (
		<div className='flex items-center gap-2 rounded-md border border-ca-danger-border bg-ca-danger-bg px-3 py-3 text-sm text-ca-red'>
			<FaExclamationTriangle className='shrink-0' /> <span>{children}</span>
		</div>
	);
}

export function LoadingBlock({ className }: { className?: string }) {
	return (
		<div className={cn('space-y-3', className)}>
			<div className={STAT_GRID}>
				{Array.from({ length: 5 }, (_, i) => (
					<div key={i} className='h-[74px] animate-pulse rounded-md bg-ca-silver' />
				))}
			</div>
			<div className='h-64 animate-pulse rounded-md bg-ca-silver' />
		</div>
	);
}

/** Panel title in the design's "Joriy kassa / Elegant Chinni" shape. */
export function PanelTitle({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
	return (
		<span className='flex flex-wrap items-baseline gap-x-1'>
			<span className='text-base font-semibold'>{title}</span>
			{sub && <span className='text-xs opacity-80'>/ {sub}</span>}
		</span>
	);
}

/** Page-size select + "38 tadan 1 dan 10 gacha ko'rsatilmoqda". */
export function PageSizeInfo({
	total,
	page,
	perPage,
	onPerPageChange,
	options = [10, 25, 50, 100],
}: {
	total: number;
	page: number;
	perPage: number;
	onPerPageChange: (size: number) => void;
	options?: number[];
}) {
	const from = total === 0 ? 0 : (page - 1) * perPage + 1;
	const to = Math.min(page * perPage, total);
	return (
		<div className='flex items-center gap-2 text-xs text-ca-text'>
			<select
				value={perPage}
				onChange={(e) => onPerPageChange(Number(e.target.value))}
				className='h-8 rounded-[3px] border border-ca-field-border bg-ca-silver-light px-1.5 text-sm text-ca-heading focus:outline-none'
			>
				{options.map((o) => (
					<option key={o} value={o}>
						{o}
					</option>
				))}
			</select>
			<span>
				{total} tadan {from} dan {to} gacha ko'rsatilmoqda
			</span>
		</div>
	);
}
