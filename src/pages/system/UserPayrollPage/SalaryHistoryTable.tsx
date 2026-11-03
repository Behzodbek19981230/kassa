import { fmtDateTime, fmtDollar, fmtSom, MONTH_TABS, personName } from '@/pages/system/UserPayrollPage/utils';
import { useUserSalaryHistoryQuery } from '@/services/payroll/payroll.queries';

/** Salary changes of one employee (`GET /user-salary-history/`), newest first. */
export default function SalaryHistoryTable({ userId, enabled = true }: { userId: number; enabled?: boolean }) {
	const historyQuery = useUserSalaryHistoryQuery({ user: userId, ordering: '-changed_time', limit: 100 }, enabled);
	const history = historyQuery.data?.results ?? [];

	return (
		<div className='max-h-80 overflow-auto rounded-lg border border-ca-border'>
			<table className='w-full text-xs'>
				<thead className='sticky top-0 bg-ca-silver text-left text-ca-heading'>
					<tr>
						<th className='px-3 py-2 font-semibold'>Oydan</th>
						<th className='px-3 py-2 font-semibold'>Eski oylik</th>
						<th className='px-3 py-2 font-semibold'>Yangi oylik</th>
						<th className='px-3 py-2 font-semibold'>O'zgartirilgan vaqt</th>
						<th className='px-3 py-2 font-semibold'>Kim</th>
					</tr>
				</thead>
				<tbody>
					{history.length === 0 ? (
						<tr>
							<td colSpan={5} className='px-3 py-4 text-center text-ca-text'>
								{historyQuery.isLoading
									? 'Yuklanmoqda...'
									: historyQuery.isError
										? 'Tarixni yuklashda xatolik yuz berdi'
										: "O'zgarishlar yo'q"}
							</td>
						</tr>
					) : (
						history.map((h) => (
							<tr key={h.id} className='border-t border-ca-border text-ca-heading'>
								<td className='px-3 py-2 whitespace-nowrap'>
									{MONTH_TABS[h.effective_month - 1]} {h.effective_year}
								</td>
								<td className='px-3 py-2 whitespace-nowrap'>
									{fmtDollar(h.old_oylik_dollar)} / {fmtSom(h.old_oylik_som)}
								</td>
								<td className='px-3 py-2 font-semibold whitespace-nowrap'>
									{fmtDollar(h.new_oylik_dollar)} / {fmtSom(h.new_oylik_som)}
								</td>
								<td className='px-3 py-2 whitespace-nowrap'>{fmtDateTime(h.changed_time)}</td>
								<td className='px-3 py-2'>{personName(h.created_by_detail) || '—'}</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
