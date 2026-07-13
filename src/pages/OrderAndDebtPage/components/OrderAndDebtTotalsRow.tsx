import { TableCell, TableRow } from '@/components/ui';
import { formatNumber } from '@/lib/number';
import type { OrderAndDebtTotals } from '@/services/order-account-history/order-account-history.types';

interface OrderAndDebtTotalsRowProps {
	label: string;
	totals: OrderAndDebtTotals;
	totalDebtSum: number;
}

export default function OrderAndDebtTotalsRow({ label, totals, totalDebtSum }: OrderAndDebtTotalsRowProps) {
	const paidJami = totals.sum_dollar + totals.sum_cart + totals.sum_som;

	return (
		<TableRow className='bg-ca-silver'>
			<TableCell colSpan={3} />
			<TableCell className='font-semibold text-ca-theme'>
				{label} {formatNumber(totals.all_product_sum, 2)}
			</TableCell>
			<TableCell className='text-[11px] leading-5'>
				<div className='font-semibold text-ca-green'>Jami ($): {formatNumber(paidJami, 2)}</div>
				<div className='font-semibold text-ca-red'>Dollar ($): {formatNumber(totals.sum_dollar, 2)}</div>
				<div>Naqt: {formatNumber(totals.sum_som, 2)}</div>
				<div className='text-ca-theme'>Karta: {formatNumber(totals.sum_cart, 2)}</div>
				<div>
					Qaytim: {formatNumber(totals.paid_zdacha_sum, 2)} ({formatNumber(totals.paid_zdacha_dollar, 2)} $)
				</div>
			</TableCell>
			<TableCell className='text-[11px] leading-5'>
				<div className='font-semibold text-ca-green'>Jami ($): {formatNumber(totals.paid_debt, 2)}</div>
				<div>O'tkazma: {formatNumber(totals.debt_sum_transfers, 2)}</div>
				<div>Naqt: {formatNumber(totals.debt_sum_som, 2)}</div>
				<div className='text-ca-theme'>Karta: {formatNumber(totals.debt_summ_cart, 2)}</div>
				<div>
					Qaytim: {formatNumber(totals.debt_zdacha_sum, 2)} ({formatNumber(totals.debt_zdacha_dollar, 2)} $)
				</div>
			</TableCell>
			<TableCell className='font-semibold text-ca-theme'>{formatNumber(totals.all_profit_dollar, 2)}</TableCell>
			<TableCell className='font-semibold text-ca-theme'>{formatNumber(totalDebtSum, 2)}</TableCell>
			<TableCell colSpan={3} />
		</TableRow>
	);
}
