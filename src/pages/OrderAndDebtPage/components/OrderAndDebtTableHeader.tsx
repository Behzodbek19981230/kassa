import { TableHead, TableHeader, TableRow } from '@/components/ui';
import type { ColumnVisibilityDef, ColumnVisibilityState } from '@/lib/useColumnVisibility';

export const ORDER_AND_DEBT_COLUMNS: ColumnVisibilityDef[] = [
	{ id: 'index', label: '#', hideable: false },
	{ id: 'client', label: 'Mijoz' },
	{ id: 'worker', label: 'Hodim' },
	{ id: 'product_sum', label: "To'lanadigan summa ($)" },
	{ id: 'paid_sum', label: "To'langan summa ($)" },
	{ id: 'paid_debt', label: "To'langan qarz ($)" },
	{ id: 'profit', label: 'Foyda ($)' },
	{ id: 'total_debt', label: 'Umumiy qolgan qarz ($)' },
	{ id: 'time', label: 'Vaqti' },
	{ id: 'status', label: 'Holati' },
	{ id: 'actions', label: '', hideable: false },
];

export default function OrderAndDebtTableHeader({ cols }: { cols: ColumnVisibilityState }) {
	return (
		<TableHeader>
			<TableRow>
				{ORDER_AND_DEBT_COLUMNS.filter((col) => cols.isVisible(col.id)).map((col) => (
					<TableHead key={col.id} className='bg-ca-theme text-white'>
						{col.label}
					</TableHead>
				))}
			</TableRow>
		</TableHeader>
	);
}
