import { Fragment } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Skeleton, Table, TableBody, TableCell, TableRow } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import type { ColumnVisibilityState } from '@/lib/useColumnVisibility';
import OrderAndDebtRow, { type OrderAndDebtPrintRole } from '@/pages/OrderAndDebtPage/components/OrderAndDebtRow';
import OrderAndDebtTableHeader from '@/pages/OrderAndDebtPage/components/OrderAndDebtTableHeader';
import OrderAndDebtTotalsRow from '@/pages/OrderAndDebtPage/components/OrderAndDebtTotalsRow';
import type {
	OrderAndDebtItem,
	OrderAndDebtWorkerTypeGroup,
} from '@/services/order-account-history/order-account-history.types';

interface WorkerTypeTabProps {
	groups: OrderAndDebtWorkerTypeGroup[];
	isLoading: boolean;
	isError: boolean;
	error?: unknown;
	cols: ColumnVisibilityState;
	onPrint: (item: OrderAndDebtItem, role: OrderAndDebtPrintRole) => void;
}

function sumDebt(items: OrderAndDebtItem[]) {
	return items.reduce((sum, item) => sum + item.total_debt, 0);
}

export default function WorkerTypeTab({ groups, isLoading, isError, error, cols, onPrint }: WorkerTypeTabProps) {
	return (
		<div className='overflow-x-auto'>
			<Table className='min-w-[1200px] rounded-[3px] border border-ca-border'>
				<OrderAndDebtTableHeader cols={cols} />
				<TableBody>
					{isLoading ? (
						Array.from({ length: 5 }).map((_, rowIndex) => (
							<TableRow key={`skeleton-${rowIndex}`}>
								{Array.from({ length: cols.visibleCount }).map((_, colIndex) => (
									<TableCell key={colIndex}>
										<Skeleton className='h-4 w-full' />
									</TableCell>
								))}
							</TableRow>
						))
					) : groups.length === 0 ? (
						<TableRow>
							<TableCell colSpan={cols.visibleCount} className='p-0'>
								<div className='flex h-40 flex-col items-center justify-center gap-2 text-ca-text'>
									{isError && <FaExclamationTriangle className='text-4xl text-ca-red' />}
									<div className='text-xs'>
										{isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : "Ma'lumot topilmadi"}
									</div>
								</div>
							</TableCell>
						</TableRow>
					) : (
						groups.map((group) => (
							<Fragment key={group.date}>
								<TableRow>
									<TableCell
										colSpan={cols.visibleCount}
										className='bg-ca-aqua/15 font-semibold text-ca-aqua'
									>
										{group.date_label}
									</TableCell>
								</TableRow>
								{group.types.map((typeEntry) => (
									<Fragment key={typeEntry.created_by_type}>
										<TableRow>
											<TableCell
												colSpan={cols.visibleCount}
												className='bg-ca-silver font-semibold text-ca-heading'
											>
												{typeEntry.created_by_type_name}
											</TableCell>
										</TableRow>
										{typeEntry.items.map((item) => (
											<OrderAndDebtRow key={`${item.row_type}-${item.id}`} item={item} cols={cols} onPrint={onPrint} />
										))}
										<OrderAndDebtTotalsRow
											cols={cols}
											label={`${typeEntry.created_by_type_name} jami:`}
											totals={typeEntry.totals}
											totalDebtSum={sumDebt(typeEntry.items)}
										/>
									</Fragment>
								))}
								<OrderAndDebtTotalsRow
									cols={cols}
									label='Kun jami:'
									totals={group.totals}
									totalDebtSum={sumDebt(group.types.flatMap((t) => t.items))}
								/>
							</Fragment>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
