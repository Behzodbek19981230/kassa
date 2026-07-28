import { useState } from 'react';
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { formatNumber } from '@/lib/number';
import type { DashboardMonthlyItem } from '@/services/dashboard/dashboard.types';

const GRID_COLOR = '#e2e8f0';
const AXIS_TEXT_COLOR = '#64748b';

const SERIES = [
	{ key: 'order_all_product_sum', name: 'Mahsulot summasi', color: '#2a78d6' },
	{ key: 'order_all_summ_dollar', name: "Buyurtmadan to'langan", color: '#eb6834' },
	{ key: 'debt_repayment_all_summ_dollar', name: "Qarz to'lovlari", color: '#1baf7a' },
] as const;

interface ChartPoint {
	month_label: string;
	order_all_product_sum: number;
	order_all_summ_dollar: number;
	debt_repayment_all_summ_dollar: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) {
	if (!active || !payload || payload.length === 0) return null;
	const rows = payload as { dataKey: string; value: number }[];

	return (
		<div className='rounded-[3px] border border-ca-border bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.12)]'>
			<div className='mb-1.5 text-[11px] font-semibold text-ca-heading'>{label}</div>
			<div className='flex flex-col gap-1'>
				{SERIES.map((s) => {
					const row = rows.find((r) => r.dataKey === s.key);
					if (!row) return null;
					return (
						<div key={s.key} className='flex items-center gap-2 text-[11px]'>
							<span className='inline-block h-0.5 w-3 shrink-0' style={{ backgroundColor: s.color }} />
							<span className='text-ca-text'>{s.name}</span>
							<span className='ml-auto font-semibold text-ca-heading'>{formatNumber(row.value, 2)} $</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

interface DashboardMonthlyChartProps {
	monthly?: DashboardMonthlyItem[];
	isLoading: boolean;
	isFetching: boolean;
}

export default function DashboardMonthlyChart({ monthly, isLoading, isFetching }: DashboardMonthlyChartProps) {
	const [showTable, setShowTable] = useState(false);

	const data: ChartPoint[] = (monthly ?? []).map((m) => ({
		month_label: m.month_label,
		order_all_product_sum: Number(m.order_all_product_sum) || 0,
		order_all_summ_dollar: Number(m.order_all_summ_dollar) || 0,
		debt_repayment_all_summ_dollar: Number(m.debt_repayment_all_summ_dollar) || 0,
	}));

	return (
		<div>
			<div className='mb-3 flex justify-end'>
				<div className='flex overflow-hidden rounded-[3px] border border-ca-border'>
					<Button
						type='button'
						variant={showTable ? 'white' : 'theme'}
						size='xs'
						className='rounded-none border-0'
						onClick={() => setShowTable(false)}
					>
						Grafik
					</Button>
					<Button
						type='button'
						variant={showTable ? 'theme' : 'white'}
						size='xs'
						className='rounded-none border-0 border-l border-ca-border'
						onClick={() => setShowTable(true)}
					>
						Jadval
					</Button>
				</div>
			</div>

			{isLoading && <p className='py-16 text-center text-xs text-ca-text'>Yuklanmoqda...</p>}

			{!isLoading && data.length > 0 && (
				<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
					{!showTable ? (
						<ResponsiveContainer width='100%' height={340}>
							<LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
								<CartesianGrid stroke={GRID_COLOR} vertical={false} />
								<XAxis
									dataKey='month_label'
									tick={{ fontSize: 11, fill: AXIS_TEXT_COLOR }}
									axisLine={{ stroke: GRID_COLOR }}
									tickLine={false}
								/>
								<YAxis
									tick={{ fontSize: 11, fill: AXIS_TEXT_COLOR }}
									axisLine={false}
									tickLine={false}
									width={64}
									tickFormatter={(v: number) => formatNumber(v)}
								/>
								<Tooltip content={<CustomTooltip />} cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }} />
								<Legend
									iconType='plainline'
									wrapperStyle={{ fontSize: 11, color: AXIS_TEXT_COLOR, paddingTop: 12 }}
								/>
								{SERIES.map((s) => (
									<Line
										key={s.key}
										type='monotone'
										dataKey={s.key}
										name={s.name}
										stroke={s.color}
										strokeWidth={2}
										dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: s.color }}
										activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
									/>
								))}
							</LineChart>
						</ResponsiveContainer>
					) : (
						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='bg-ca-theme text-white'>Oy</TableHead>
										{SERIES.map((s) => (
											<TableHead key={s.key} className='bg-ca-theme text-white'>
												{s.name} ($)
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.map((row) => (
										<TableRow key={row.month_label}>
											<TableCell className='font-semibold text-ca-heading'>{row.month_label}</TableCell>
											{SERIES.map((s) => (
												<TableCell key={s.key}>{formatNumber(row[s.key], 2)}</TableCell>
											))}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
