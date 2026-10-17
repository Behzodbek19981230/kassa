import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@/components/ui';
import ExpensesTab from '@/pages/system/ExpensePage/ExpensesTab';
import ExpenseTypesTab from '@/pages/system/ExpensePage/ExpenseTypesTab';

export default function ExpensePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get('tab') === 'types' ? 'types' : 'expenses';

	return (
		<>

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
