import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@/components/ui';
import ModelsTab from '@/pages/system/ModelsPage/ModelsTab';
import ProductCategoriesTab from '@/pages/system/ProductCategoriesPage/ProductCategoriesTab';

export default function ProductCategoriesPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get('tab') === 'categories' ? 'categories' : 'models';

	return (
		<>

			<Tabs
				value={activeTab}
				onValueChange={(tab) => setSearchParams(tab === 'models' ? {} : { tab }, { replace: true })}
				items={[
					{ value: 'models', label: 'Modellar', content: <ModelsTab /> },
					{ value: 'categories', label: 'Mahsulot toifalari', content: <ProductCategoriesTab /> },
				]}
			/>
		</>
	);
}
