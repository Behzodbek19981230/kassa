import { useSearchParams } from 'react-router-dom';
import { PageHeader, Tabs } from '@/components/ui';
import ExpensesTab from '@/pages/system/ExpensePage/ExpensesTab';
import ExpenseTypesTab from '@/pages/system/ExpensePage/ExpenseTypesTab';

export default function ExpensePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get('tab') === 'types' ? 'types' : 'expenses';

	return (
		<>
			<PageHeader
				title='Xarajatlar'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Xarajatlar', active: true },
				]}
			/>

			<Tabs
				value={activeTab}
				onValueChange={(tab) => setSearchParams(tab === 'expenses' ? {} : { tab }, { replace: false })}
				items={[
					{ value: 'expenses', label: 'Xarajatlar', content: <ExpensesTab /> },
					{ value: 'types', label: 'Xarajat turi', content: <ExpenseTypesTab /> },
				]}
			/>
		</>
	);
}
