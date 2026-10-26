import { useState } from 'react';
import { FaArrowLeft, FaHistory } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button, Panel, Tabs } from '@/components/ui';
import OrderAccountHistoryDraftTab from '@/pages/CartDraftsPage/components/OrderAccountHistoryDraftTab';

export default function CartDraftsPage() {
	const navigate = useNavigate();
	const [refetchActive, setRefetchActive] = useState<() => void>(() => () => undefined);

	return (
		<>

			<Panel
				title={
					<span className='flex flex-wrap items-center gap-3'>
						Ro'yxat
						<Button
							type='button'
							variant='danger'
							size='xs'
							onClick={() => navigate('/cart-drafts/deleted-orders')}
						>
							<FaHistory className='mr-1.5' /> O'chirilgan buyurtmalar tarixi
						</Button>
					</span>
				}
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
