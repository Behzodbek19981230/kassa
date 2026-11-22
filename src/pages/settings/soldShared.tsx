import type { ReactNode } from 'react';
import { FaChevronLeft } from 'react-icons/fa';
import { Pagination } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/services/api/types';
import { parseIsoDay } from '@/pages/settings/soldUtils';

export function PageHeader({
	title,
	subtitle,
	onBack,
	actions,
}: {
	title: ReactNode;
	subtitle?: ReactNode;
	onBack?: () => void;
	actions?: ReactNode;
}) {
	return (
		<div className='mb-3 flex flex-wrap items-center gap-x-3 gap-y-2'>
			{onBack && (
				<button
					type='button'
					onClick={onBack}
					aria-label='Orqaga'
					className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ca-border bg-ca-silver-light text-ca-heading hover:bg-ca-border'
				>
					<FaChevronLeft className='text-xs' />
				</button>
			)}
			<div className='min-w-0'>
				<h1 className='text-lg leading-6 font-semibold text-ca-heading'>{title}</h1>
				{subtitle && <div className='text-xs text-ca-text'>{subtitle}</div>}
			</div>
			{actions && <div className='ml-auto flex flex-wrap items-end gap-2'>{actions}</div>}
		</div>
	);
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<section className={cn('rounded-lg border border-ca-border bg-ca-silver-light p-3', className)}>{children}</section>
	);
}

export interface StatItem {
	label: string;
	value: string;
	/** Zero amounts are dimmed so the non-zero ones stand out. */
	dim?: boolean;
}

const TONE = {
	theme: { solid: 'bg-ca-theme', panel: 'border-ca-theme/25 bg-ca-theme/5' },
	red: { solid: 'bg-ca-red', panel: 'border-ca-red/25 bg-ca-red/5' },
} as const;

/**
 * Totals block: the grand total (`highlight`) as a large solid tile, the breakdown in a tinted panel beside it,
 * so the totals never blend in with the list cards below.
 */
export function StatTiles({
	items,
	highlight,
	tone = 'theme',
}: {
	items: StatItem[];
	highlight?: StatItem;
	tone?: 'theme' | 'red';
}) {
	return (
		<div className='flex flex-col gap-3 lg:flex-row lg:items-stretch'>
			{highlight && (
				<div
					className={cn(
						'flex shrink-0 flex-col justify-center rounded-lg px-4 py-3 text-white shadow-sm lg:w-60',
						TONE[tone].solid,
					)}
				>
					<div className='truncate text-xs font-medium opacity-90'>{highlight.label}</div>
					<div className='mt-1 truncate text-2xl leading-8 font-bold tabular-nums'>{highlight.value}</div>
				</div>
			)}
			<dl
				className={cn(
					'grid flex-1 grid-cols-2 gap-x-4 gap-y-3 rounded-lg border px-4 py-3 sm:grid-cols-3 xl:grid-cols-6',
					TONE[tone].panel,
				)}
			>
				{items.map((item) => (
					<div key={item.label} className='min-w-0'>
						<dt className='truncate text-[11px] text-ca-text'>{item.label}</dt>
						<dd
							className={cn(
								'mt-0.5 truncate text-base tabular-nums',
								item.dim ? 'font-medium text-ca-text/70' : 'font-bold text-ca-heading',
							)}
						>
							{item.value}
						</dd>
					</div>
				))}
			</dl>
		</div>
	);
}

/** Labelled rule that separates a totals block from the list under it. */
export function SectionDivider({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<div className={cn('flex items-center gap-3', className)}>
			<span className='shrink-0 text-[11px] font-semibold tracking-wider text-ca-text uppercase'>{children}</span>
			<span className='h-px flex-1 bg-ca-border' />
		</div>
	);
}

/** Calendar-style day tile: big day number over the short month, on a solid accent. */
export function DayBadge({ date, className }: { date: string; className?: string }) {
	const { day, monthShort } = parseIsoDay(date);
	return (
		<span
			className={cn(
				'flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-ca-theme leading-none text-white shadow-sm',
				className,
			)}
		>
			<span className='text-2xl font-bold tabular-nums'>{day}</span>
			<span className='mt-1 text-[10px] font-semibold tracking-wider opacity-90'>{monthShort}</span>
		</span>
	);
}

export function ListFooter({
	pagination,
	unit,
	onPageChange,
}: {
	pagination?: PaginationMeta;
	unit: string;
	onPageChange: (page: number) => void;
}) {
	if (!pagination || pagination.total === 0) return null;
	const from = (pagination.currentPage - 1) * pagination.perPage + 1;
	const to = Math.min(pagination.currentPage * pagination.perPage, pagination.total);
	return (
		<div className='mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ca-border pt-2'>
			<span className='text-[11px] text-ca-text'>
				{from}–{to} / {pagination.total} {unit}
			</span>
			{pagination.lastPage > 1 && (
				<Pagination page={pagination.currentPage} totalPages={pagination.lastPage} onPageChange={onPageChange} />
			)}
		</div>
	);
}

export function EmptyState({ children }: { children: ReactNode }) {
	return (
		<div className='rounded-md border border-dashed border-ca-border px-3 py-6 text-center text-xs text-ca-text'>
			{children}
		</div>
	);
}

export function ErrorState({ children }: { children: ReactNode }) {
	return (
		<div className='rounded-md border border-ca-danger-border bg-ca-danger-bg px-3 py-3 text-xs text-ca-red'>
			{children}
		</div>
	);
}

/** Field label above a control, same scale as the filter rows across the app. */
export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
	return (
		<span className='mb-1 block text-xs font-medium text-ca-heading'>
			{children}
			{hint && <span className='ml-1 font-normal text-ca-text'>{hint}</span>}
		</span>
	);
}
