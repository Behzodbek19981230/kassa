import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Panel, Tabs } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { usePermissions } from '@/lib/permissions';
import { useOrderCartGroupedListQuery } from '@/services/order-cart/order-cart.queries';
import OrderAccountHistoryTable from '@/pages/CustomerOrderHistoryPage/components/OrderAccountHistoryTable';
import DebtRepaymentPage from '@/pages/settings/DebtRepaymentPage';

export default function CustomerOrderHistoryPage() {
	const navigate = useNavigate();
	const { canWrite } = useCurrentCompany();
	const { isSuperAdmin } = usePermissions();
	const [searchParams, setSearchParams] = useSearchParams();
	const tabParam = searchParams.get('tab');
	// "To'langan qarzlar" is Super Admin only, same as its /settings/debt-repayments route.
	const activeTab =
		tabParam === 'debtors' || (tabParam === 'debt-repayments' && isSuperAdmin) ? tabParam : 'all';
	const [refetchActive, setRefetchActive] = useState<() => void>(() => () => undefined);

	const { data: cartDraftData } = useOrderCartGroupedListQuery({ is_active: true, limit: 1 });
	const cartDraftCount = cartDraftData?.pagination.total ?? 0;

	const renderPanel = (isDebtorOnly: boolean) => (
		<Panel
			title="Ro'yxat"
			actions={
				<Button type='button' variant='danger' size='xs' onClick={() => navigate('/order-cart')}>
					Karzinka {cartDraftCount > 0 && `(${cartDraftCount})`}
				</Button>
			}
			onReload={() => refetchActive()}
			className='mb-0'
		>
			<OrderAccountHistoryTable
				isDebtorOnly={isDebtorOnly}
				canWrite={canWrite}
				onRefetchReady={(fn) => setRefetchActive(() => fn)}
			/>
		</Panel>
	);

	return (
		<Tabs
			value={activeTab}
			onValueChange={(tab) => setSearchParams(tab === 'all' ? {} : { tab }, { replace: false })}
			items={[
				{
					value: 'all',
					label: 'Buyurtmalar',
					content: renderPanel(false),
				},
				...(isSuperAdmin
					? [
							{
								value: 'debt-repayments',
								label: "To'langan qarzlar",
								content: <DebtRepaymentPage />,
							},
						]
					: []),
				{
					value: 'debtors',
					label: 'Mijozdan qarzdorlik',
					content: renderPanel(true),
				},
			]}
		/>
	);
}
