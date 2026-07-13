import { FaPlus, FaPrint } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, TableCell, TableRow } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/number';
import type { OrderAndDebtItem } from '@/services/order-account-history/order-account-history.types';

export type OrderAndDebtPrintRole = 'mijoz' | 'xodim';

interface OrderAndDebtRowProps {
	item: OrderAndDebtItem;
	onPrint: (item: OrderAndDebtItem, role: OrderAndDebtPrintRole) => void;
}

export default function OrderAndDebtRow({ item, onPrint }: OrderAndDebtRowProps) {
	const navigate = useNavigate();
	const isRed = item.row_style.color === 'red';
	const textClass = isRed ? 'text-ca-red' : 'text-ca-heading';
	const canOpen = Boolean(item.actions.products_url);
	const canPrintClient = Boolean(item.actions.print_client_url);
	const canPrintWorker = Boolean(item.actions.print_worker_url);

	return (
		<TableRow className='group'>
			<TableCell className={textClass}>{item.day_seq}</TableCell>
			<TableCell className={textClass}>{item.client_name}</TableCell>
			<TableCell className={textClass}>{item.created_by_name}</TableCell>
			<TableCell className='font-semibold text-ca-green'>
				{item.all_product_sum ? formatNumber(item.all_product_sum, 2) : ''}
			</TableCell>
			<TableCell className='font-semibold text-ca-green'>
				{item.sum_dollar || item.sum_cart || item.sum_som
					? formatNumber(item.sum_dollar + item.sum_cart + item.sum_som, 2)
					: ''}
			</TableCell>
			<TableCell className='font-semibold text-ca-green'>
				{item.paid_debt ? formatNumber(item.paid_debt, 2) : ''}
			</TableCell>
			<TableCell className={cn('font-semibold', item.all_profit_dollar < 0 ? 'text-ca-red' : 'text-ca-green')}>
				{formatNumber(item.all_profit_dollar, 2)}
			</TableCell>
			<TableCell className='font-semibold text-ca-heading'>{formatNumber(item.total_debt, 2)}</TableCell>
			<TableCell className={textClass}>{item.datetime_label}</TableCell>
			<TableCell>
				{item.row_style.title ? <Badge variant={isRed ? 'danger' : 'default'}>{item.row_style.title}</Badge> : null}
			</TableCell>
			<TableCell className='text-right'>
				{(canOpen || canPrintClient || canPrintWorker) && (
					<div className='flex justify-end gap-1'>
						{canOpen && (
							<Button
								type='button'
								variant='info'
								size='icon'
								aria-label='Batafsil'
								onClick={() => navigate(`/customer-order-history/${item.id}`)}
							>
								<FaPlus />
							</Button>
						)}
						{canPrintClient && (
							<Button
								type='button'
								variant='warning'
								size='icon'
								aria-label='Chop qilish (Mijoz)'
								onClick={() => onPrint(item, 'mijoz')}
							>
								<FaPrint />
							</Button>
						)}
						{canPrintWorker && (
							<Button
								type='button'
								variant='primary'
								size='icon'
								aria-label='Chop qilish (Xodim)'
								onClick={() => onPrint(item, 'xodim')}
							>
								<FaPrint />
							</Button>
						)}
					</div>
				)}
			</TableCell>
		</TableRow>
	);
}
