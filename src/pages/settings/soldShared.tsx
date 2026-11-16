import type { ReactNode } from 'react';
import { FaChevronLeft } from 'react-icons/fa';
import { Pagination } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/services/api/types';

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
}

/** A row of small stat tiles; `highlight` is the grand total, shown as the last (accented) tile. */
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
		<div className='grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-7'>
			{items.map((item) => (
				<div key={item.label} className='rounded-lg border border-ca-border bg-ca-silver px-3 py-2.5'>
					<div className='truncate text-[11px] text-ca-text'>{item.label}</div>
					<div className='mt-0.5 truncate text-base font-semibold text-ca-heading tabular-nums'>{item.value}</div>
				</div>
			))}
			{highlight && (
				<div
					className={cn(
						'col-span-2 rounded-lg px-3 py-2.5 text-white sm:col-span-4 xl:col-span-1',
						tone === 'red' ? 'bg-ca-red' : 'bg-ca-theme',
					)}
				>
					<div className='truncate text-[11px] opacity-90'>{highlight.label}</div>
					<div className='mt-0.5 truncate text-lg leading-6 font-bold tabular-nums'>{highlight.value}</div>
				</div>
			)}
		</div>
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
