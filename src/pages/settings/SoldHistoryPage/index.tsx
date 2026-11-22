import { useState } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, DatePicker, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { useSoldDatesQuery } from '@/services/sold-history/sold-history.queries';
import type { SoldDateItem } from '@/services/sold-history/sold-history.types';
import {
	Card,
	DayBadge,
	EmptyState,
	ErrorState,
	FieldLabel,
	ListFooter,
	PageHeader,
} from '@/pages/settings/soldShared';
import { parseIsoDay } from '@/pages/settings/soldUtils';

const PAGE_SIZE = 30;
// Phones: 1–2 columns, tablets and notebooks: 4, wide monitors: 5.
const DATE_GRID = 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4 min-[1800px]:grid-cols-5';

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
					<div className={DATE_GRID}>
						{Array.from({ length: 14 }, (_, i) => (
							<Skeleton key={i} className='h-[82px] rounded-lg' />
						))}
					</div>
				) : isError ? (
					<ErrorState>{getApiErrorMessage(error, "Sanalarni yuklab bo'lmadi")}</ErrorState>
				) : results.length === 0 ? (
					<EmptyState>Tanlangan oraliqda sotuv yoki qarz to'lovi topilmadi.</EmptyState>
				) : (
					<div className='space-y-5'>
						{groupByMonth(results).map((group) => (
							<div key={group.label}>
								<div className='mb-2.5 flex items-center gap-2'>
									<span className='text-sm font-bold text-ca-heading'>{group.label}</span>
									<span className='rounded-full bg-ca-muted px-2 py-0.5 text-[11px] font-semibold text-ca-text'>
										{group.items.length} kun
									</span>
									<span className='h-px flex-1 bg-ca-border' />
								</div>
								<div className={DATE_GRID}>
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

/** Below 210px (4 columns on a tablet) the card shrinks its badge and text so the full date still fits. */
function DateCard({ item, onClick }: { item: SoldDateItem; onClick: () => void }) {
	return (
		<button
			type='button'
			onClick={onClick}
			className='group @container min-w-0 rounded-lg border border-ca-border bg-ca-silver p-3 text-left transition-colors hover:border-ca-theme hover:bg-ca-table-hover'
		>
			<span className='flex items-center gap-2 @min-[210px]:gap-3'>
				<DayBadge date={item.date} className='h-12 w-12 @min-[210px]:h-14 @min-[210px]:w-14' />
				<span className='min-w-0 flex-1'>
					<span className='block truncate text-sm leading-5 font-bold text-ca-heading @min-[210px]:text-base'>
						{item.date_label}
					</span>
					<span className='block truncate text-xs text-ca-text'>{parseIsoDay(item.date).weekday}</span>
					<span className='mt-1.5 flex flex-wrap gap-1'>
						{item.order_count > 0 && (
							<span className='rounded bg-ca-theme/15 px-1.5 py-0.5 text-[11px] font-semibold text-ca-theme'>
								{item.order_count} buyurtma
							</span>
						)}
						{item.debt_count > 0 && (
							<span className='rounded bg-ca-red/15 px-1.5 py-0.5 text-[11px] font-semibold text-ca-red'>
								{item.debt_count} qarz
							</span>
						)}
					</span>
				</span>
				<FaChevronRight className='hidden shrink-0 text-xs text-ca-text opacity-40 transition-opacity group-hover:opacity-100 @min-[210px]:block' />
			</span>
		</button>
	);
}
