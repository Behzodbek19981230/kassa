import { Fragment } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Skeleton, Table, TableBody, TableCell, TableRow } from '@/components/ui';
import OrderAndDebtRow from '@/pages/OrderAndDebtPage/components/OrderAndDebtRow';
import OrderAndDebtTableHeader, {
	ORDER_AND_DEBT_COLUMN_COUNT,
} from '@/pages/OrderAndDebtPage/components/OrderAndDebtTableHeader';
import OrderAndDebtTotalsRow from '@/pages/OrderAndDebtPage/components/OrderAndDebtTotalsRow';
import type {
	OrderAndDebtItem,
	OrderAndDebtWorkerTypeGroup,
} from '@/services/order-account-history/order-account-history.types';

interface WorkerTypeTabProps {
	groups: OrderAndDebtWorkerTypeGroup[];
	isLoading: boolean;
	isError: boolean;
	onPrint: (item: OrderAndDebtItem) => void;
}

function sumDebt(items: OrderAndDebtItem[]) {
	return items.reduce((sum, item) => sum + item.total_debt, 0);
}

export default function WorkerTypeTab({ groups, isLoading, isError, onPrint }: WorkerTypeTabProps) {
	return (
		<div className='overflow-x-auto'>
			<Table className='min-w-[1200px] rounded-[3px] border border-ca-border'>
				<OrderAndDebtTableHeader />
				<TableBody>
					{isLoading ? (
						Array.from({ length: 5 }).map((_, rowIndex) => (
							<TableRow key={`skeleton-${rowIndex}`}>
								{Array.from({ length: ORDER_AND_DEBT_COLUMN_COUNT }).map((_, colIndex) => (
									<TableCell key={colIndex}>
										<Skeleton className='h-4 w-full' />
									</TableCell>
								))}
							</TableRow>
						))
					) : groups.length === 0 ? (
						<TableRow>
							<TableCell colSpan={ORDER_AND_DEBT_COLUMN_COUNT} className='p-0'>
								<div className='flex h-40 flex-col items-center justify-center gap-2 text-ca-text'>
									{isError && <FaExclamationTriangle className='text-4xl text-ca-red' />}
									<div className='text-xs'>{isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}</div>
								</div>
							</TableCell>
						</TableRow>
					) : (
						groups.map((group) => (
							<Fragment key={group.date}>
								<TableRow>
									<TableCell
										colSpan={ORDER_AND_DEBT_COLUMN_COUNT}
										className='bg-ca-aqua/15 font-semibold text-ca-aqua'
									>
										{group.date_label}
									</TableCell>
								</TableRow>
								{group.types.map((typeEntry) => (
									<Fragment key={typeEntry.created_by_type}>
										<TableRow>
											<TableCell
												colSpan={ORDER_AND_DEBT_COLUMN_COUNT}
												className='bg-ca-silver font-semibold text-ca-heading'
											>
												{typeEntry.created_by_type_name}
											</TableCell>
										</TableRow>
										{typeEntry.items.map((item) => (
											<OrderAndDebtRow key={`${item.row_type}-${item.id}`} item={item} onPrint={onPrint} />
										))}
										<OrderAndDebtTotalsRow
											label={`${typeEntry.created_by_type_name} jami:`}
											totals={typeEntry.totals}
											totalDebtSum={sumDebt(typeEntry.items)}
										/>
									</Fragment>
								))}
								<OrderAndDebtTotalsRow
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
