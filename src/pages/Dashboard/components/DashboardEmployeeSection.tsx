import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Button, DataTable, DatePicker } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useDashboardUserStatisticsQuery } from '@/services/dashboard/dashboard.queries';
import type { DashboardUserStatisticsItem } from '@/services/dashboard/dashboard.types';

function todayIso() {
	return new Date().toISOString().slice(0, 10);
}

function monthStartIso() {
	const d = new Date();
	return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

const columnHelper = createColumnHelper<DashboardUserStatisticsItem>();

const columns = [
	columnHelper.accessor('user_name', { header: 'Hodim' }),
	columnHelper.accessor('phone_number', { header: 'Telefon' }),
	columnHelper.accessor('order_all_product_sum', {
		header: 'Mahsulot summasi ($)',
		cell: (info) => formatNumber(info.getValue(), 2),
	}),
	columnHelper.accessor('order_all_summ_dollar', {
		header: "Buyurtmadan to'langan ($)",
		cell: (info) => formatNumber(info.getValue(), 2),
	}),
	columnHelper.accessor('order_all_profit_dollar', {
		header: 'Foyda ($)',
		cell: (info) => {
			const value = Number(info.getValue()) || 0;
			return (
				<span className={value >= 0 ? 'font-bold text-ca-green' : 'font-bold text-ca-red'}>
					{formatNumber(value, 2)}
				</span>
			);
		},
	}),
	columnHelper.accessor('debt_repayment_all_summ_dollar', {
		header: "Qarz to'lovi ($)",
		cell: (info) => formatNumber(info.getValue(), 2),
	}),
];

export default function DashboardEmployeeSection() {
	const { companyId } = useCurrentCompany();
	const [draftFrom, setDraftFrom] = useState(monthStartIso());
	const [draftTo, setDraftTo] = useState(todayIso());
	const [appliedFrom, setAppliedFrom] = useState(draftFrom);
	const [appliedTo, setAppliedTo] = useState(draftTo);

	const { data, isLoading, isFetching, isError, error, refetch } = useDashboardUserStatisticsQuery({
		fromdate: appliedFrom,
		todate: appliedTo,
		company: companyId ?? undefined,
	});

	const results = data?.results ?? [];

	function handleSearch() {
		setAppliedFrom(draftFrom);
		setAppliedTo(draftTo);
	}

	return (
		<div>
			<div className='mb-4 flex flex-wrap items-end gap-2'>
				<div className='w-40'>
					<label className='mb-1 block text-[11px] font-semibold text-ca-heading'>Boshlanish sana</label>
					<DatePicker value={draftFrom} onChange={setDraftFrom} />
				</div>
				<div className='w-40'>
					<label className='mb-1 block text-[11px] font-semibold text-ca-heading'>Tugash sana</label>
					<DatePicker value={draftTo} onChange={setDraftTo} />
				</div>
				<Button type='button' variant='theme' size='sm' onClick={handleSearch}>
					Qidirish
				</Button>
				<Button type='button' variant='white' size='sm' onClick={() => refetch()}>
					Yangilash
				</Button>
			</div>

			{isLoading && <p className='py-16 text-center text-xs text-ca-text'>Yuklanmoqda...</p>}
			{!isLoading && isError && (
				<p className='py-16 text-center text-xs text-ca-red'>
					<FaExclamationTriangle className='mr-1.5 inline' /> {getApiErrorMessage(error, 'Xatolik yuz berdi')}
				</p>
			)}

			{!isLoading && !isError && (
				<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
					<DataTable
						columns={columns}
						data={results}
						enableSorting={false}
						enableGlobalFilter={false}
						enableColumnFilters={false}
						enableColumnVisibility
						columnVisibilityKey='dashboard-user-statistics'
						enableStriping
						enablePagination
						emptyMessage="Ma'lumot topilmadi"
					/>
				</div>
			)}
		</div>
	);
}
