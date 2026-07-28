import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, DataTable, DatePicker } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { formatNumber } from '@/lib/number';
import { useDashboardUserStatisticsQuery } from '@/services/dashboard/dashboard.queries';
import type { DashboardUserStatisticsItem } from '@/services/dashboard/dashboard.types';

const BAR_COLOR = '#348fe2';
const GRID_COLOR = '#e2e8f0';
const AXIS_TEXT_COLOR = '#64748b';
const TOP_N = 10;

function todayIso() {
	return new Date().toISOString().slice(0, 10);
}

function monthStartIso() {
	const d = new Date();
	return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

interface RankingTooltipPayload {
	payload: { user_name: string; order_all_profit_dollar: number };
}

function RankingTooltip({ active, payload }: { active?: boolean; payload?: RankingTooltipPayload[] }) {
	if (!active || !payload || payload.length === 0) return null;
	const row = payload[0].payload;

	return (
		<div className='rounded-[3px] border border-ca-border bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.12)]'>
			<div className='mb-1 text-[11px] font-semibold text-ca-heading'>{row.user_name}</div>
			<div className='flex items-center gap-2 text-[11px]'>
				<span className='inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]' style={{ backgroundColor: BAR_COLOR }} />
				<span className='text-ca-text'>Foyda</span>
				<span className='ml-auto font-semibold text-ca-heading'>{formatNumber(row.order_all_profit_dollar, 2)} $</span>
			</div>
		</div>
	);
}

const columnHelper = createColumnHelper<DashboardUserStatisticsItem>();

const columns = [
	columnHelper.accessor('user_name', { header: 'Hodim' }),
	columnHelper.accessor('phone_number', { header: 'Telefon' }),
	columnHelper.accessor('order_all_product_sum', {
		header: 'Mahsulot summasi ($)',
		cell: (info) => formatNumber(info.getValue(), 2),
	}),
	columnHelper.accessor('order_all_summ_dollar', {
		header: "Buyurtmadan to'langan ($)",
		cell: (info) => formatNumber(info.getValue(), 2),
	}),
	columnHelper.accessor('order_all_profit_dollar', {
		header: 'Foyda ($)',
		cell: (info) => {
			const value = Number(info.getValue()) || 0;
			return (
				<span className={value >= 0 ? 'font-bold text-ca-green' : 'font-bold text-ca-red'}>
					{formatNumber(value, 2)}
				</span>
			);
		},
	}),
	columnHelper.accessor('debt_repayment_all_summ_dollar', {
		header: "Qarz to'lovi ($)",
		cell: (info) => formatNumber(info.getValue(), 2),
	}),
];

export default function DashboardEmployeeSection() {
	const { companyId } = useCurrentCompany();
	const [draftFrom, setDraftFrom] = useState(monthStartIso());
	const [draftTo, setDraftTo] = useState(todayIso());
	const [appliedFrom, setAppliedFrom] = useState(draftFrom);
	const [appliedTo, setAppliedTo] = useState(draftTo);

	const { data, isLoading, isFetching, isError, refetch } = useDashboardUserStatisticsQuery({
		fromdate: appliedFrom,
		todate: appliedTo,
		company: companyId ?? undefined,
	});

	const results = data?.results ?? [];
	const topResults = results.slice(0, TOP_N);

	function handleSearch() {
		setAppliedFrom(draftFrom);
		setAppliedTo(draftTo);
	}

	return (
		<div>
			<div className='mb-4 flex flex-wrap items-end gap-2'>
				<div className='w-40'>
					<label className='mb-1 block text-[11px] font-semibold text-ca-heading'>Boshlanish sana</label>
					<DatePicker value={draftFrom} onChange={setDraftFrom} />
				</div>
				<div className='w-40'>
					<label className='mb-1 block text-[11px] font-semibold text-ca-heading'>Tugash sana</label>
					<DatePicker value={draftTo} onChange={setDraftTo} />
				</div>
				<Button type='button' variant='theme' size='sm' onClick={handleSearch}>
					Qidirish
				</Button>
				<Button type='button' variant='white' size='sm' onClick={() => refetch()}>
					Yangilash
				</Button>
			</div>

			{isLoading && <p className='py-16 text-center text-xs text-ca-text'>Yuklanmoqda...</p>}
			{!isLoading && isError && (
				<p className='py-16 text-center text-xs text-ca-red'>
					<FaExclamationTriangle className='mr-1.5 inline' /> Xatolik yuz berdi
				</p>
			)}

			{!isLoading && !isError && (
				<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
					{topResults.length > 0 && (
						<div className='mb-5'>
							<div className='mb-2 text-[11px] font-semibold text-ca-heading'>
								Foyda bo'yicha top {Math.min(TOP_N, results.length)} hodim
							</div>
							<ResponsiveContainer width='100%' height={Math.max(220, topResults.length * 38)}>
								<BarChart
									data={topResults}
									layout='vertical'
									margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
									barCategoryGap={10}
								>
									<CartesianGrid stroke={GRID_COLOR} horizontal={false} />
									<XAxis
										type='number'
										tick={{ fontSize: 11, fill: AXIS_TEXT_COLOR }}
										axisLine={{ stroke: GRID_COLOR }}
										tickLine={false}
										tickFormatter={(v: number) => formatNumber(v)}
									/>
									<YAxis
										type='category'
										dataKey='user_name'
										tick={{ fontSize: 11, fill: AXIS_TEXT_COLOR }}
										axisLine={false}
										tickLine={false}
										width={120}
									/>
									<Tooltip content={<RankingTooltip />} cursor={{ fill: '#f8fafc' }} />
									<Bar dataKey='order_all_profit_dollar' fill={BAR_COLOR} barSize={20} radius={[0, 4, 4, 0]}>
										{topResults.map((row) => (
											<Cell key={row.user} />
										))}
										<LabelList
											dataKey='order_all_profit_dollar'
											position='right'
											formatter={(v: string | number | boolean | null | undefined) =>
												`${formatNumber(typeof v === 'boolean' ? Number(v) : v, 2)} $`
											}
											style={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }}
										/>
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>
					)}

					<DataTable
						columns={columns}
						data={results}
						enableSorting={false}
						enableGlobalFilter={false}
						enableColumnFilters={false}
						enableColumnVisibility
						columnVisibilityKey='dashboard-user-statistics'
						enableStriping
						enablePagination
						emptyMessage="Ma'lumot topilmadi"
					/>
				</div>
			)}
		</div>
	);
}
