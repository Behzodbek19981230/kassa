import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { PageHeader, Panel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { useDashboardStatisticsQuery } from '@/services/dashboard/dashboard.queries';
import DashboardEmployeeSection from '@/pages/Dashboard/components/DashboardEmployeeSection';
import DashboardMonthlyChart from '@/pages/Dashboard/components/DashboardMonthlyChart';
import DashboardStatTiles from '@/pages/Dashboard/components/DashboardStatTiles';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function Dashboard() {
	const { companyId, isAdminOrManager } = useCurrentCompany();
	const [year, setYear] = useState(CURRENT_YEAR);

	const { data, isLoading, isFetching, refetch } = useDashboardStatisticsQuery({
		year,
		company: companyId ?? undefined,
	});

	if (!isAdminOrManager) return <Navigate to='/warehouse-products' replace />;

	return (
		<>
			<PageHeader
				title='Dashboard'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Dashboard', active: true },
				]}
			/>

			<div className='mb-4 flex items-center gap-2'>
				<span className='text-xs font-semibold text-ca-heading'>Yil:</span>
				<div className='w-32'>
					<Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{YEAR_OPTIONS.map((y) => (
								<SelectItem key={y} value={String(y)}>
									{y}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<DashboardStatTiles cards={data?.cards} isLoading={isLoading} />

			<Panel title={`Oyma-oy statistika — ${year}`} onReload={() => refetch()}>
				<DashboardMonthlyChart monthly={data?.monthly} isLoading={isLoading} isFetching={isFetching} />
			</Panel>

			<Panel title='Hodimlar kesimida statistika'>
				<DashboardEmployeeSection />
			</Panel>
		</>
	);
}
