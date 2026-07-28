import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, PageHeader, Panel, Tabs } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { useOrderCartGroupedListQuery } from '@/services/order-cart/order-cart.queries';
import OrderAccountHistoryTable from '@/pages/CustomerOrderHistoryPage/components/OrderAccountHistoryTable';

export default function CustomerOrderHistoryPage() {
	const navigate = useNavigate();
	const { canWrite } = useCurrentCompany();
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get('tab') === 'debtors' ? 'debtors' : 'all';
	const [refetchActive, setRefetchActive] = useState<() => void>(() => () => undefined);

	const { data: cartDraftData } = useOrderCartGroupedListQuery({ is_active: true, limit: 1 });
	const cartDraftCount = cartDraftData?.pagination.total ?? 0;

	return (
		<>
			<PageHeader
				title='Mijoz buyurtmalari tarixi'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Mijoz buyurmalari tarixi', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					<Button type='button' variant='danger' size='xs' onClick={() => navigate('/cart-drafts')}>
						Karzinka {cartDraftCount > 0 && `(${cartDraftCount})`}
					</Button>
				}
				onReload={() => refetchActive()}
			>
				<Tabs
					value={activeTab}
					onValueChange={(tab) => setSearchParams(tab === 'all' ? {} : { tab }, { replace: false })}
					items={[
						{
							value: 'all',
							label: 'Barchasi',
							content: (
								<OrderAccountHistoryTable
									isDebtorOnly={false}
									canWrite={canWrite}
									onRefetchReady={(fn) => setRefetchActive(() => fn)}
								/>
							),
						},
						{
							value: 'debtors',
							label: 'Qarzdorlar',
							content: (
								<OrderAccountHistoryTable
									isDebtorOnly
									canWrite={canWrite}
									onRefetchReady={(fn) => setRefetchActive(() => fn)}
								/>
							),
						},
					]}
				/>
			</Panel>
		</>
	);
}
