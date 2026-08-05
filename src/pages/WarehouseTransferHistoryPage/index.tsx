import { useSearchParams } from 'react-router-dom';
import { PageHeader, Tabs } from '@/components/ui';
import TransferHistoryTab from '@/pages/WarehouseTransferHistoryPage/components/TransferHistoryTab';
import WarehouseStaffTab from '@/pages/WarehouseTransferHistoryPage/components/WarehouseStaffTab';

export default function WarehouseTransferHistoryPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get('tab') === 'warehouse-staff' ? 'warehouse-staff' : 'history';

	return (
		<>
			<PageHeader
				title='Transfer tarixi'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Skladlararo transfer', path: '/warehouse-transfer' },
					{ label: 'Transfer tarixi', active: true },
				]}
			/>

			<Tabs
				value={activeTab}
				onValueChange={(tab) => setSearchParams(tab === 'history' ? {} : { tab }, { replace: false })}
				items={[
					{ value: 'history', label: 'Transfer tarixi', content: <TransferHistoryTab /> },
					{ value: 'warehouse-staff', label: 'Xodim', content: <WarehouseStaffTab /> },
				]}
			/>
		</>
	);
}
