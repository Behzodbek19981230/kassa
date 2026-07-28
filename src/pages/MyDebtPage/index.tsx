import { useSearchParams } from 'react-router-dom';
import { PageHeader, Tabs } from '@/components/ui';
import MyDebtHistoryTab from '@/pages/MyDebtPage/MyDebtHistoryTab';
import MyDebtTab from '@/pages/MyDebtPage/MyDebtTab';

export default function MyDebtPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get('tab') === 'history' ? 'history' : 'debts';

	return (
		<>
			<PageHeader
				title='Mening qarzlarim hisobi'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Mening qarzlarim hisobi', active: true },
				]}
			/>

			<Tabs
				value={activeTab}
				onValueChange={(tab) => setSearchParams(tab === 'debts' ? {} : { tab }, { replace: false })}
				items={[
					{ value: 'debts', label: 'Mening qarzlarim hisobi', content: <MyDebtTab /> },
					{ value: 'history', label: "To'langan qarzlarim tarixi", content: <MyDebtHistoryTab /> },
				]}
			/>
		</>
	);
}
