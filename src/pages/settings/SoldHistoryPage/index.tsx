import { useState } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, DatePicker, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { useSoldDatesQuery } from '@/services/sold-history/sold-history.queries';
import type { SoldDateItem } from '@/services/sold-history/sold-history.types';
import {
	Card,
	EmptyState,
	ErrorState,
	FieldLabel,
	ListFooter,
	PageHeader,
} from '@/pages/settings/soldShared';
import { parseIsoDay } from '@/pages/settings/soldUtils';

const PAGE_SIZE = 30;

function groupByMonth(items: SoldDateItem[]) {
	const groups: { label: string; items: SoldDateItem[] }[] = [];
	for (const item of items) {
		const label = parseIsoDay(item.date).monthLabel;
		const last = groups[groups.length - 1];
		if (last?.label === label) last.items.push(item);
		else groups.push({ label, items: [item] });
	}
	return groups;
}

/** "Sotilgan tovarlar tarixi": days with orders or debt repayments; a day opens its orders and debts. */
export default function SoldHistoryPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();
	const page = Math.max(Number(searchParams.get('page')) || 1, 1);
	const startDate = searchParams.get('start_date') ?? '';
	const endDate = searchParams.get('end_date') ?? '';
	const [draftStart, setDraftStart] = useState(startDate);
	const [draftEnd, setDraftEnd] = useState(endDate);

	const { data, isLoading, isFetching, isError, error } = useSoldDatesQuery({
		page,
		page_size: PAGE_SIZE,
		start_date: startDate || undefined,
		end_date: endDate || undefined,
	});

	function updateParams(next: { page?: number; start?: string; end?: string }) {
		const params = new URLSearchParams();
		const start = next.start ?? startDate;
		const end = next.end ?? endDate;
		if (start) params.set('start_date', start);
		if (end) params.set('end_date', end);
		if (next.page && next.page > 1) params.set('page', String(next.page));
		setSearchParams(params);
	}

	function applyRange() {
		// A new range always starts from the first page.
		updateParams({ start: draftStart, end: draftEnd, page: 1 });
	}

	function clearRange() {
		setDraftStart('');
		setDraftEnd('');
		setSearchParams(new URLSearchParams());
	}

	function openDay(date: string) {
		navigate(`/settings/sold-history/${date}`, { state: { back: `${location.pathname}${location.search}` } });
	}

	const results = data?.results ?? [];
	const hasRange = Boolean(startDate || endDate);

	return (
		<div>
			<PageHeader
				title='Sotilgan tovarlar tarixi'
				subtitle="Sanani tanlang — o'sha kundagi buyurtmalar va qarz to'lovlari ochiladi"
				actions={
					<>
						<label className='w-36'>
							<FieldLabel>Boshlanish</FieldLabel>
							<DatePicker value={draftStart} onChange={setDraftStart} placeholder='Boshlanish' />
						</label>
						<label className='w-36'>
							<FieldLabel>Tugash</FieldLabel>
							<DatePicker value={draftEnd} onChange={setDraftEnd} placeholder='Tugash' />
						</label>
						<Button type='button' variant='theme' size='sm' onClick={applyRange} loading={isFetching && !isLoading}>
							Ko'rsatish
						</Button>
						{hasRange && (
							<Button type='button' variant='white' size='sm' onClick={clearRange}>
								Tozalash
							</Button>
						)}
					</>
				}
			/>

			<Card>
				{isLoading ? (
					<div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'>
						{Array.from({ length: 14 }, (_, i) => (
							<Skeleton key={i} className='h-[68px] rounded-lg' />
						))}
					</div>
				) : isError ? (
					<ErrorState>{getApiErrorMessage(error, "Sanalarni yuklab bo'lmadi")}</ErrorState>
				) : results.length === 0 ? (
					<EmptyState>Tanlangan oraliqda sotuv yoki qarz to'lovi topilmadi.</EmptyState>
				) : (
					<div className='space-y-3'>
						{groupByMonth(results).map((group) => (
							<div key={group.label}>
								<div className='mb-2 text-[11px] font-semibold tracking-wider text-ca-text uppercase'>
									{group.label}
								</div>
								<div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'>
									{group.items.map((item) => (
										<DateCard key={item.date} item={item} onClick={() => openDay(item.date)} />
									))}
								</div>
							</div>
						))}
					</div>
				)}

				<ListFooter pagination={data?.pagination} unit='sana' onPageChange={(p) => updateParams({ page: p })} />
			</Card>
		</div>
	);
}

function DateCard({ item, onClick }: { item: SoldDateItem; onClick: () => void }) {
	const { day, monthShort, weekday } = parseIsoDay(item.date);
	return (
		<button
			type='button'
			onClick={onClick}
			className='group flex min-w-0 items-center gap-3 rounded-lg border border-ca-border bg-ca-silver-light px-3 py-2.5 text-left transition-colors hover:border-ca-theme hover:bg-ca-table-hover'
		>
			<span className='flex w-11 shrink-0 flex-col items-center gap-0.5 rounded-md bg-ca-theme/10 py-1.5 leading-none text-ca-theme'>
				<span className='text-lg font-bold'>{day}</span>
				<span className='text-[9px] font-semibold'>{monthShort}</span>
			</span>
			<span className='min-w-0 flex-1'>
				<span className='block truncate text-sm font-semibold text-ca-heading'>{item.date_label}</span>
				<span className='block truncate text-[11px] text-ca-text'>{weekday}</span>
				<span className='block truncate text-[11px] font-medium'>
					{item.order_count > 0 && <span className='text-ca-theme'>{item.order_count} buyurtma</span>}
					{item.order_count > 0 && item.debt_count > 0 && <span className='text-ca-text'> · </span>}
					{item.debt_count > 0 && <span className='text-ca-red'>{item.debt_count} qarz</span>}
				</span>
			</span>
			<FaChevronRight className='shrink-0 text-[11px] text-ca-text opacity-50 group-hover:opacity-100' />
		</button>
	);
}
