import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@/components/ui';
import ProductSizesTab from '@/pages/system/ProductMeasurementPage/ProductSizesTab';
import SizeTypesTab from '@/pages/system/ProductMeasurementPage/SizeTypesTab';

export default function ProductMeasurementPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get('tab') === 'types' ? 'types' : 'sizes';

	return (
		<>

			<Tabs
				value={activeTab}
				onValueChange={(tab) => setSearchParams(tab === 'sizes' ? {} : { tab }, { replace: false })}
				items={[
					{ value: 'sizes', label: "Mahsulot o'lchami", content: <ProductSizesTab /> },
					{ value: 'types', label: "O'lcham turi", content: <SizeTypesTab /> },
				]}
			/>
		</>
	);
}
