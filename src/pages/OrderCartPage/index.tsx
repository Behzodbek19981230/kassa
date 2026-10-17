import { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button, Panel } from '@/components/ui';
import OrderCartDraftTab from '@/pages/CartDraftsPage/components/OrderCartDraftTab';

export default function OrderCartPage() {
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
				<OrderCartDraftTab onRefetchReady={(fn) => setRefetchActive(() => fn)} />
			</Panel>
		</>
	);
}
