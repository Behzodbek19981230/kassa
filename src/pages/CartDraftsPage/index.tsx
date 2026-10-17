import { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button, Panel, Tabs } from '@/components/ui';
import OrderAccountHistoryDraftTab from '@/pages/CartDraftsPage/components/OrderAccountHistoryDraftTab';

export default function CartDraftsPage() {
	const navigate = useNavigate();
	const [refetchActive, setRefetchActive] = useState<() => void>(() => () => undefined);

	return (
		<>

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
