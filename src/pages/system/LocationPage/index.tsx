import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@/components/ui';
import DistrictsTab from '@/pages/system/LocationPage/DistrictsTab';
import RegionsTab from '@/pages/system/LocationPage/RegionsTab';

export default function LocationPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get('tab') === 'districts' ? 'districts' : 'regions';

	return (
		<>

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
