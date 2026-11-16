import { useMemo, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { cn } from '@/lib/utils';
import { useSoldProductsDayQuery } from '@/services/sold-history/sold-history.queries';
import type { SoldProductOrder, SoldProductsFilters } from '@/services/sold-history/sold-history.types';
import {
	Card,
	EmptyState,
	ErrorState,
	ListFooter,
	PageHeader,
	StatTiles,
} from '@/pages/settings/soldShared';
import { money, parseIsoDay, skladColor } from '@/pages/settings/soldUtils';
import { readForm, toProductFilter, writeForm } from '@/pages/settings/SoldProductsPage/filters';

const PAGE_SIZE = 30;
const UNKNOWN_CLIENT = "Noma'lum mijoz";

function productTitle(filters: Omit<SoldProductsFilters, 'start_date' | 'end_date'>) {
	return [filters.brand.name, filters.product_category.name, filters.size, filters.type?.name]
		.filter(Boolean)
		.join(' · ');
}

/** One day of "Sotilgan tovarlar soni": orders that contain the searched product, with payments and products. */
export default function SoldProductsDayPage() {
	const { date = '' } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const form = useMemo(() => readForm(searchParams), [searchParams]);
	const backTo =
		(location.state as { back?: string } | null)?.back ?? `/settings/sold-products?${writeForm(form)}`;

	const [page, setPage] = useState(1);
	const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
	// The very same product filter as the date card it was opened from, or the numbers won't match.
	const hasFilter = Boolean(form.brand && form.productCategory);
	const { data, isLoading, isError, error } = useSoldProductsDayQuery(
		date,
		hasFilter ? { ...toProductFilter(form), page, page_size: PAGE_SIZE } : null,
	);

	function toggle(id: number) {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	const pt = data?.payment_totals;

	return (
		<div>
			<PageHeader
				title={`${data?.date_label ?? date} sanadagi sotuvlar`}
				subtitle={
					<span className='flex flex-wrap items-center gap-1'>
						{parseIsoDay(date).weekday} · Qidirilgan tovar:
						{data && (
							<span className='rounded bg-ca-orange/15 px-1.5 font-semibold text-ca-orange'>
								{productTitle(data.filters)}
							</span>
						)}
					</span>
				}
				onBack={() => navigate(backTo)}
				actions={
					data && (
						<div className='flex flex-wrap gap-1.5'>
							<div className='rounded-md bg-ca-theme px-2.5 py-1 text-white'>
								<div className='text-[10px] opacity-90'>Jami sotilgan</div>
								<div className='text-base leading-5 font-bold tabular-nums'>{formatNumber(data.totals.count)}</div>
							</div>
							{data.totals.sklads.map((sklad, i) => (
								<div key={`${sklad.name}-${i}`} className='rounded-md border border-ca-border bg-ca-silver-light px-2.5 py-1'>
									<div className='flex items-center gap-1 text-[10px] text-ca-text'>
										<span className='h-1.5 w-1.5 rounded-sm' style={{ background: skladColor(i) }} />
										{sklad.name}
									</div>
									<div className='text-base leading-5 font-bold text-ca-heading tabular-nums'>
										{formatNumber(sklad.count)}
									</div>
								</div>
							))}
						</div>
					)
				}
			/>

			{!hasFilter ? (
				<ErrorState>Tovar filtri topilmadi. "Sotilgan tovarlar soni" sahifasidan qayta qidiring.</ErrorState>
			) : isLoading ? (
				<div className='space-y-2'>
					<Skeleton className='h-14 rounded-lg' />
					<Skeleton className='h-40 rounded-lg' />
					<Skeleton className='h-40 rounded-lg' />
				</div>
			) : isError ? (
				<ErrorState>{getApiErrorMessage(error, "Ma'lumotni yuklab bo'lmadi")}</ErrorState>
			) : data ? (
				<>
					{pt && (
						<Card className='mb-3'>
							<div className='mb-2 text-xs font-semibold text-ca-heading'>
								Shu kundagi buyurtmalar to'lovi
								<span className='ml-1.5 font-normal text-ca-text'>({data.pagination.total} ta buyurtma)</span>
							</div>
							<StatTiles
								items={[
									{ label: 'Summa dollar', value: `${money(pt.sum_dollar)} $` },
									{ label: "Summa so'm", value: money(pt.sum_som) },
									{ label: 'Summa karta', value: money(pt.sum_cart) },
									{ label: 'Summa transfer', value: money(pt.sum_transfers) },
									{ label: "Qaytim so'm", value: money(pt.zdacha_sum) },
									{ label: 'Qaytim dollar', value: `${money(pt.zdacha_dollar)} $` },
								]}
								highlight={{ label: "Jami to'langan ($)", value: `${money(pt.all_summ_dollar)} $` }}
							/>
						</Card>
					)}

					{data.results.length === 0 ? (
						<EmptyState>Bu kunda qidirilgan tovar sotilmagan.</EmptyState>
					) : (
						<div className='space-y-2'>
							{data.results.map((order) => (
								<OrderCard
									key={order.id}
									order={order}
									open={!collapsed.has(order.id)}
									onToggle={() => toggle(order.id)}
									onOpenOrder={() => navigate(`/customer-order-history/${order.id}`)}
								/>
							))}
						</div>
					)}

					<ListFooter pagination={data.pagination} unit='buyurtma' onPageChange={setPage} />
				</>
			) : null}
		</div>
	);
}

function OrderCard({
	order,
	open,
	onToggle,
	onOpenOrder,
}: {
	order: SoldProductOrder;
	open: boolean;
	onToggle: () => void;
	onOpenOrder: () => void;
}) {
	const left: { label: string; value: string; className?: string }[] = [
		{ label: 'Dollar kursi', value: formatNumber(order.exchange_rate) },
		{ label: "Jami to'lanadigan", value: `${money(order.all_product_sum)} $` },
		{ label: "To'langan summa", value: `${money(order.all_summ_dollar)} $` },
		{ label: 'Chegirma', value: `${money(order.discount_amount)} $` },
		{ label: 'Qolgan qarz', value: `${money(order.total_debt)} $`, className: 'text-ca-red' },
	];
	const right: { label: string; value: string }[] = [
		{ label: "To'langan $", value: `${money(order.sum_dollar)} $` },
		{ label: "To'langan so'm", value: money(order.sum_som) },
		{ label: "To'langan karta", value: money(order.sum_cart) },
		{ label: "To'langan transfer", value: money(order.sum_transfers) },
		{ label: "Qaytim so'm", value: money(order.zdacha_sum) },
		{ label: 'Qaytim dollar', value: `${money(order.zdacha_dollar)} $` },
	];

	return (
		<section className='overflow-hidden rounded-lg border border-ca-border bg-ca-silver-light'>
			<div className='flex items-center gap-2 bg-ca-silver px-2.5 py-1.5'>
				<span className='flex h-6 min-w-6 items-center justify-center rounded bg-ca-theme px-1 text-[11px] font-bold text-white'>
					{order.number}
				</span>
				<button
					type='button'
					onClick={onOpenOrder}
					className='truncate text-xs font-semibold text-ca-theme underline-offset-2 hover:underline'
				>
					{order.client?.fio ?? UNKNOWN_CLIENT}
				</button>
				<span className='text-[10px] text-ca-text'>{order.time}</span>
				<span className='ml-auto rounded-full bg-ca-orange/15 px-2 py-px text-[10px] font-semibold whitespace-nowrap text-ca-orange'>
					Qidirilgan: {order.searched_count} dona
				</span>
				<button
					type='button'
					onClick={onToggle}
					aria-label={open ? "Yig'ish" : 'Ochish'}
					aria-expanded={open}
					className='flex h-6 w-6 items-center justify-center rounded border border-ca-border text-ca-text hover:bg-ca-border'
				>
					<FaChevronDown className={cn('text-[10px] transition-transform', open && 'rotate-180')} />
				</button>
			</div>

			{open && (
				<div className='space-y-2 p-2.5'>
					<div className='grid grid-cols-1 gap-2 lg:grid-cols-2'>
						<KeyValueGrid items={left} className='border-ca-orange/30 bg-ca-orange/5' />
						<KeyValueGrid items={right} className='border-ca-theme/25 bg-ca-theme/5' />
					</div>

					<div className='overflow-x-auto rounded-md border border-ca-border'>
						<table className='w-full text-[11px]'>
							<thead className='bg-ca-silver text-[10px] text-ca-text'>
								<tr>
									<th className='px-2 py-1 text-left font-medium'>#</th>
									<th className='px-2 py-1 text-left font-medium'>Joyi</th>
									<th className='px-2 py-1 text-left font-medium'>Model</th>
									<th className='px-2 py-1 text-left font-medium'>Nomi</th>
									<th className='px-2 py-1 text-left font-medium'>O'lchami</th>
									<th className='px-2 py-1 text-left font-medium'>Type</th>
									<th className='px-2 py-1 text-right font-medium'>Soni</th>
								</tr>
							</thead>
							<tbody>
								{order.products.map((p) => (
									<tr
										key={p.id}
										className={cn(
											'border-t border-ca-border',
											p.is_searched
												? 'bg-ca-orange/10 font-semibold text-ca-heading shadow-[inset_3px_0_0_var(--color-ca-orange)]'
												: 'text-ca-heading',
										)}
									>
										<td className='px-2 py-1'>{p.number}</td>
										<td className='px-2 py-1'>{p.type_sklad?.name ?? 'Skladsiz'}</td>
										<td className='px-2 py-1'>{p.brand_name}</td>
										<td className='px-2 py-1'>
											{p.product_category_name}
											{p.is_searched && (
												<span className='ml-1.5 rounded-full bg-ca-orange px-1.5 py-px text-[9px] font-semibold text-white'>
													Qidirilgan
												</span>
											)}
										</td>
										<td className='px-2 py-1'>{p.size}</td>
										<td className='px-2 py-1'>{p.type_name}</td>
										<td className='px-2 py-1 text-right tabular-nums'>{formatNumber(p.count)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</section>
	);
}

function KeyValueGrid({
	items,
	className,
}: {
	items: { label: string; value: string; className?: string }[];
	className?: string;
}) {
	return (
		<dl className={cn('grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-md border px-2.5 py-1.5 sm:grid-cols-3', className)}>
			{items.map((item) => (
				<div key={item.label} className='flex min-w-0 flex-col'>
					<dt className='truncate text-[10px] text-ca-text'>{item.label}</dt>
					<dd className={cn('truncate text-xs font-semibold text-ca-heading tabular-nums', item.className)}>
						{item.value}
					</dd>
				</div>
			))}
		</dl>
	);
}
