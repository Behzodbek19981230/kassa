import { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button, PageHeader, Panel, Tabs } from '@/components/ui';
import OrderAccountHistoryDraftTab from '@/pages/CartDraftsPage/components/OrderAccountHistoryDraftTab';
import OrderCartDraftTab from '@/pages/CartDraftsPage/components/OrderCartDraftTab';

export default function CartDraftsPage() {
	const navigate = useNavigate();
	const [refetchActive, setRefetchActive] = useState<() => void>(() => () => undefined);

	return (
		<>
			<PageHeader
				title='Karzinkalar'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Mijoz buyurmalari tarixi', path: '/customer-order-history' },
					{ label: 'Karzinkalar', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					<Button type='button' variant='info' size='xs' onClick={() => navigate(-1)}>
						<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
					</Button>
				}
				onReload={() => refetchActive()}
			>
				<OrderAccountHistoryDraftTab onRefetchReady={(fn) => setRefetchActive(() => fn)} />
			</Panel>
		</>
	);
}
