import { useMemo, useState } from 'react';
import { FaChartLine, FaSearch } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Combobox, DatePicker, Skeleton } from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { getApiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { brandService } from '@/services/brand/brand.service';
import { brandSizeService } from '@/services/brand-size/brand-size.service';
import { brandSizeTypeService } from '@/services/brand-size-type/brand-size-type.service';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useSoldProductsQuery } from '@/services/sold-history/sold-history.queries';
import type { SoldProductsDayItem, SoldProductsResponse } from '@/services/sold-history/sold-history.types';
import {
	Card,
	EmptyState,
	ErrorState,
	FieldLabel,
	PageHeader,
} from '@/pages/settings/soldShared';
import { parseIsoDay, skladColor } from '@/pages/settings/soldUtils';
import {
	isFormComplete,
	PERIOD_PRESETS,
	presetRange,
	readForm,
	type SoldProductsForm,
	toProductFilter,
	writeForm,
} from '@/pages/settings/SoldProductsPage/filters';
import { formatDate } from '@/lib/date';
import SkladBar from '@/pages/settings/SoldProductsPage/SkladBar';

const ALL = 1000;

/** "Sotilgan tovarlar soni": how many of one product sold per day, split by sklad. */
export default function SoldProductsPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();
	const applied = useMemo(() => readForm(searchParams), [searchParams]);
	const [draft, setDraft] = useState<SoldProductsForm>(() =>
		applied.startDate || applied.endDate ? applied : { ...applied, ...presetRange('month30') },
	);

	const brands = useQuery({
		queryKey: ['brands', 'list', { limit: ALL }],
		queryFn: () => brandService.list({ limit: ALL }),
	});
	const categories = useQuery({
		queryKey: ['product-categories', 'list', { brand: draft.brand, limit: ALL }],
		queryFn: () => productCategoryService.list({ brand: Number(draft.brand), limit: ALL }),
		enabled: Boolean(draft.brand),
	});
	const sizes = useQuery({
		queryKey: ['brand-sizes', 'list', { brand: draft.brand, product_category: draft.productCategory, limit: ALL }],
		queryFn: () =>
			brandSizeService.list({
				brand: Number(draft.brand),
				product_category: Number(draft.productCategory),
				limit: ALL,
			}),
		enabled: Boolean(draft.brand && draft.productCategory),
	});
	const types = useQuery({
		queryKey: ['brand-size-types', 'list', { limit: ALL }],
		queryFn: () => brandSizeTypeService.list({ limit: ALL }),
	});

	const brandOptions = useMemo(
		() => (brands.data?.results ?? []).map((b) => ({ value: String(b.id), label: b.name })),
		[brands.data],
	);
	const categoryOptions = useMemo(
		() => (categories.data?.results ?? []).map((c) => ({ value: String(c.id), label: c.name })),
		[categories.data],
	);
	const sizeOptions = useMemo(() => {
		const unique = [...new Set((sizes.data?.results ?? []).map((s) => s.size))];
		return unique.map((s) => ({ value: s, label: s }));
	}, [sizes.data]);
	const typeOptions = useMemo(
		() => (types.data?.results ?? []).map((t) => ({ value: String(t.id), label: t.name })),
		[types.data],
	);

	const activePreset = PERIOD_PRESETS.find((p) => {
		const range = presetRange(p.id);
		return range.startDate === draft.startDate && range.endDate === draft.endDate;
	})?.id;

	const searched = isFormComplete(applied);
	const query = useSoldProductsQuery(
		searched ? { ...toProductFilter(applied), start_date: applied.startDate, end_date: applied.endDate } : null,
	);

	function search() {
		setSearchParams(writeForm(draft));
	}

	function openDay(date: string) {
		navigate(`/settings/sold-products/${date}?${writeForm(applied)}`, {
			state: { back: `${location.pathname}${location.search}` },
		});
	}

	return (
		<div>
			<PageHeader
				title='Sotilgan tovarlar soni'
				subtitle='Tovarni va periodni tanlang — har kuni nechta sotilgani skladlar kesimida chiqadi'
			/>

			<Card className='mb-4 p-4'>
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
					<label>
						<FieldLabel>Model</FieldLabel>
						<Combobox
							value={draft.brand}
							onChange={(v) => setDraft((f) => ({ ...f, brand: v, productCategory: '', size: '', type: '' }))}
							options={brandOptions}
							placeholder={brands.isLoading ? 'Yuklanmoqda...' : 'Model tanlang'}
							searchPlaceholder='Qidirish...'
						/>
					</label>
					<label>
						<FieldLabel>Nomi</FieldLabel>
						<Combobox
							value={draft.productCategory}
							onChange={(v) => setDraft((f) => ({ ...f, productCategory: v, size: '', type: '' }))}
							options={categoryOptions}
							disabled={!draft.brand}
							placeholder={draft.brand ? 'Nomi tanlang' : 'Avval model tanlang'}
							searchPlaceholder='Qidirish...'
						/>
					</label>
					<label>
						<FieldLabel hint='(ixtiyoriy)'>O'lcham</FieldLabel>
						<Combobox
							clearable
							value={draft.size}
							onChange={(v) => setDraft((f) => ({ ...f, size: v }))}
							options={sizeOptions}
							disabled={!draft.productCategory}
							placeholder="Barcha o'lchamlar"
							searchPlaceholder='Qidirish...'
						/>
					</label>
					<label>
						<FieldLabel hint='(ixtiyoriy)'>Type</FieldLabel>
						<Combobox
							clearable
							value={draft.type}
							onChange={(v) => setDraft((f) => ({ ...f, type: v }))}
							options={typeOptions}
							disabled={!draft.productCategory}
							placeholder='Barcha turlar'
							searchPlaceholder='Qidirish...'
						/>
					</label>
				</div>

				<div className='mt-3 flex flex-wrap items-end gap-3'>
					<div>
						<FieldLabel>Period</FieldLabel>
						<div className='flex flex-wrap gap-1'>
							{PERIOD_PRESETS.map((p) => (
								<button
									key={p.id}
									type='button'
									onClick={() => setDraft((f) => ({ ...f, ...presetRange(p.id) }))}
									className={cn(
										'h-[30px] rounded-full border px-3 text-xs font-medium transition-colors',
										activePreset === p.id
											? 'border-ca-theme bg-ca-theme/10 text-ca-theme'
											: 'border-ca-border text-ca-heading hover:bg-ca-silver',
									)}
								>
									{p.label}
								</button>
							))}
						</div>
					</div>
					<label className='w-36'>
						<FieldLabel>Boshlanish sana</FieldLabel>
						<DatePicker value={draft.startDate} onChange={(v) => setDraft((f) => ({ ...f, startDate: v }))} />
					</label>
					<label className='w-36'>
						<FieldLabel>Tugash sana</FieldLabel>
						<DatePicker value={draft.endDate} onChange={(v) => setDraft((f) => ({ ...f, endDate: v }))} />
					</label>
					<Button
						type='button'
						variant='theme'
						size='sm'
						className='ml-auto'
						disabled={!isFormComplete(draft)}
						loading={query.isFetching}
						onClick={search}
					>
						{!query.isFetching && <FaSearch className='mr-1.5' />} Qidirish
					</Button>
				</div>
			</Card>

			{!searched ? (
				<div className='flex items-center gap-3 rounded-lg border border-dashed border-ca-border px-4 py-3.5 text-sm text-ca-text'>
					<FaChartLine className='shrink-0 text-base text-ca-theme' />
					Model va nomni tanlab "Qidirish" ni bosing. O'lcham va type bo'sh qolsa, shu tovarning barcha o'lcham va
					turlari hisoblanadi.
				</div>
			) : query.isLoading ? (
				<div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'>
					{Array.from({ length: 12 }, (_, i) => (
						<Skeleton key={i} className='h-[92px] rounded-lg' />
					))}
				</div>
			) : query.isError ? (
				<ErrorState>{getApiErrorMessage(query.error, "Ma'lumotni yuklab bo'lmadi")}</ErrorState>
			) : query.data ? (
				<Results data={query.data} onOpenDay={openDay} />
			) : null}
		</div>
	);
}

function productTitle(filters: SoldProductsResponse['filters']) {
	return [filters.brand.name, filters.product_category.name, filters.size, filters.type?.name]
		.filter(Boolean)
		.join(' · ');
}

function Results({ data, onOpenDay }: { data: SoldProductsResponse; onOpenDay: (date: string) => void }) {
	const { filters, totals, results } = data;
	return (
		<>
			<Card className='mb-4 p-4'>
				<div className='flex flex-wrap items-end gap-x-6 gap-y-3'>
					<div>
						<div className='text-base font-semibold text-ca-heading'>{productTitle(filters)}</div>
						<div className='text-xs text-ca-text'>
							{formatDate(filters.start_date)} — {formatDate(filters.end_date)} · {results.length} kun
						</div>
					</div>
					<div className='border-l border-ca-border pl-6'>
						<div className='text-xs text-ca-text'>Jami sotilgan</div>
						<div className='text-3xl leading-9 font-bold text-ca-theme tabular-nums'>{formatNumber(totals.count)}</div>
					</div>
					{totals.sklads.map((sklad, i) => (
						<div key={`${sklad.name}-${i}`} className='border-l border-ca-border pl-6'>
							<div className='flex items-center gap-1.5 text-xs text-ca-text'>
								<span className='h-2.5 w-2.5 rounded-sm' style={{ background: skladColor(i) }} />
								{sklad.name}
							</div>
							<div className='text-xl leading-7 font-bold text-ca-heading tabular-nums'>
								{formatNumber(sklad.count)}{' '}
								<span className='text-xs font-medium text-ca-text'>
									{totals.count ? Math.round((sklad.count / totals.count) * 100) : 0}%
								</span>
							</div>
						</div>
					))}
				</div>
				<SkladBar sklads={totals.sklads} total={totals.count} className='mt-3 h-2.5' />
			</Card>

			{results.length === 0 ? (
				<EmptyState>Sotuv topilmadi — tanlangan periodda bu tovar sotilmagan.</EmptyState>
			) : (
				<div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'>
					{results.map((day) => (
						<DayCard key={day.date} day={day} onClick={() => onOpenDay(day.date)} />
					))}
				</div>
			)}
		</>
	);
}

function DayCard({ day, onClick }: { day: SoldProductsDayItem; onClick: () => void }) {
	return (
		<button
			type='button'
			onClick={onClick}
			className='rounded-lg border border-ca-border bg-ca-silver-light px-3 py-2.5 text-left transition-colors hover:border-ca-theme hover:bg-ca-table-hover'
		>
			<div className='flex items-start justify-between gap-2'>
				<div className='min-w-0'>
					<div className='truncate text-sm font-semibold text-ca-heading'>{day.date_label}</div>
					<div className='truncate text-xs text-ca-text'>{parseIsoDay(day.date).weekday}</div>
				</div>
				<div className='text-2xl leading-7 font-bold text-ca-theme tabular-nums'>{formatNumber(day.count)}</div>
			</div>
			<SkladBar sklads={day.sklads} total={day.count} className='my-2 h-1.5' />
			<div className='flex flex-wrap gap-x-3 text-xs text-ca-text'>
				{day.sklads.map((sklad, i) => (
					<span key={`${sklad.name}-${i}`} className='flex items-center gap-1'>
						<span className='h-2 w-2 rounded-sm' style={{ background: skladColor(i) }} />
						{sklad.name}: <b className='text-ca-heading'>{sklad.count}</b>
					</span>
				))}
			</div>
		</button>
	);
}
