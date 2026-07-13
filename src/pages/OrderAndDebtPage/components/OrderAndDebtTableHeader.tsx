import { TableHead, TableHeader, TableRow } from '@/components/ui';

export const ORDER_AND_DEBT_COLUMN_COUNT = 11;

export default function OrderAndDebtTableHeader() {
	return (
		<TableHeader>
			<TableRow>
				<TableHead className='bg-ca-theme text-white'>#</TableHead>
				<TableHead className='bg-ca-theme text-white'>Mijoz</TableHead>
				<TableHead className='bg-ca-theme text-white'>Hodim</TableHead>
				<TableHead className='bg-ca-theme text-white'>To'lanadigan summa ($)</TableHead>
				<TableHead className='bg-ca-theme text-white'>To'langan summa ($)</TableHead>
				<TableHead className='bg-ca-theme text-white'>To'langan qarz ($)</TableHead>
				<TableHead className='bg-ca-theme text-white'>Foyda ($)</TableHead>
				<TableHead className='bg-ca-theme text-white'>Umumiy qolgan qarz ($)</TableHead>
				<TableHead className='bg-ca-theme text-white'>Vaqti</TableHead>
				<TableHead className='bg-ca-theme text-white'>Holati</TableHead>
				<TableHead className='bg-ca-theme text-white' />
			</TableRow>
		</TableHeader>
	);
}
