import { TableCell, TableRow } from '@/components/ui';
import { formatNumber } from '@/lib/number';
import type { ColumnVisibilityState } from '@/lib/useColumnVisibility';
import type { OrderAndDebtTotals } from '@/services/order-account-history/order-account-history.types';

interface OrderAndDebtTotalsRowProps {
	label: string;
	totals: OrderAndDebtTotals;
	totalDebtSum: number;
	cols: ColumnVisibilityState;
}

const LEADING_COLUMNS = ['index', 'client', 'worker'];
const TRAILING_COLUMNS = ['time', 'status', 'actions'];

export default function OrderAndDebtTotalsRow({ label, totals, totalDebtSum, cols }: OrderAndDebtTotalsRowProps) {
	const countVisible = (ids: string[]) => ids.filter((id) => cols.isVisible(id)).length;
	const paidJami = totals.sum_dollar + totals.sum_cart + totals.sum_som;

	return (
		<TableRow className='bg-ca-silver'>
			<TableCell colSpan={countVisible(LEADING_COLUMNS)} />
			{cols.isVisible('product_sum') && (
				<TableCell className='font-semibold text-ca-theme'>
					{label} {formatNumber(totals.all_product_sum, 2)}
				</TableCell>
			)}
			{cols.isVisible('paid_sum') && (
				<TableCell className='text-[13px] leading-5'>
					<div className='font-semibold text-ca-green'>Jami ($): {formatNumber(paidJami, 2)}</div>
					<div className='font-semibold text-ca-red'>Dollar ($): {formatNumber(totals.sum_dollar, 2)}</div>
					<div>Naqt: {formatNumber(totals.sum_som, 2)}</div>
					<div className='text-ca-theme'>Karta: {formatNumber(totals.sum_cart, 2)}</div>
					<div>
						Qaytim: {formatNumber(totals.paid_zdacha_sum, 2)} ({formatNumber(totals.paid_zdacha_dollar, 2)} $)
					</div>
				</TableCell>
			)}
			{cols.isVisible('paid_debt') && (
				<TableCell className='text-[13px] leading-5'>
					<div className='font-semibold text-ca-green'>Jami ($): {formatNumber(totals.paid_debt, 2)}</div>
					<div>O'tkazma: {formatNumber(totals.debt_sum_transfers, 2)}</div>
					<div>Naqt: {formatNumber(totals.debt_sum_som, 2)}</div>
					<div className='text-ca-theme'>Karta: {formatNumber(totals.debt_summ_cart, 2)}</div>
					<div>
						Qaytim: {formatNumber(totals.debt_zdacha_sum, 2)} ({formatNumber(totals.debt_zdacha_dollar, 2)} $)
					</div>
				</TableCell>
			)}
			{cols.isVisible('profit') && <TableCell className='font-semibold text-ca-theme'>{formatNumber(totals.all_profit_dollar, 2)}</TableCell>}
			{cols.isVisible('total_debt') && <TableCell className='font-semibold text-ca-theme'>{formatNumber(totalDebtSum, 2)}</TableCell>}
			<TableCell colSpan={countVisible(TRAILING_COLUMNS)} />
		</TableRow>
	);
}
