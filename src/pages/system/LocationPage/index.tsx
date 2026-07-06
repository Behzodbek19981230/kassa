import { useSearchParams } from 'react-router-dom';
import { PageHeader, Tabs } from '@/components/ui';
import DistrictsTab from '@/pages/system/LocationPage/DistrictsTab';
import RegionsTab from '@/pages/system/LocationPage/RegionsTab';

export default function LocationPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get('tab') === 'districts' ? 'districts' : 'regions';

	return (
		<>
			<PageHeader
				title='Hududlar'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Hududlar', active: true },
				]}
			/>

			<Tabs
				value={activeTab}
				onValueChange={(tab) => setSearchParams(tab === 'regions' ? {} : { tab }, { replace: false })}
				items={[
					{ value: 'regions', label: 'Viloyatlar', content: <RegionsTab /> },
					{ value: 'districts', label: 'Tumanlar', content: <DistrictsTab /> },
				]}
			/>
		</>
	);
}
