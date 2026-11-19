import { FaFileExcel, FaLock, FaPrint } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Panel } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { cn } from '@/lib/utils';
import CurrentTab from '@/pages/kassa/KassaCurrentPage/CurrentTab';
import DailyTab from '@/pages/kassa/KassaCurrentPage/DailyTab';
import { PanelTitle } from '@/pages/kassa/shared';
import { useCompanyName, useFileDownloader, usePdfOpener } from '@/pages/kassa/hooks';
import { todayIso, toneButton } from '@/pages/kassa/utils';
import { cashRegisterService } from '@/services/cash-register/cash-register.service';

type TabKey = 'current' | 'daily';

/** "Joriy kassa": the open period (01) and the per-day report (07) as two tabs; `?tab=daily&date=`. */
export default function KassaCurrentPage() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const tab: TabKey = searchParams.get('tab') === 'daily' ? 'daily' : 'current';
	const today = todayIso();
	const rawDate = searchParams.get('date');
	const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && rawDate <= today ? rawDate : today;

	const companyName = useCompanyName();
	const { canWrite } = useCurrentCompany();
	const pdf = usePdfOpener();
	const excel = useFileDownloader();

	const setTab = (next: TabKey) => setSearchParams(next === 'daily' ? { tab: 'daily' } : {}, { replace: true });
	const setDate = (next: string) =>
		setSearchParams(next === today ? { tab: 'daily' } : { tab: 'daily', date: next }, { replace: true });

	return (
		<Panel
			title={<PanelTitle title='Joriy kassa' sub={companyName} />}
			actions={
				<>
					{tab === 'daily' && (
						<Button
							type='button'
							variant='excel'
							size='sm'
							loading={excel.busy}
							onClick={() => excel.download(() => cashRegisterService.dailyExcel(date))}
						>
							<FaFileExcel className='mr-1.5' /> Excel
						</Button>
					)}
					<Button
						type='button'
						variant='purple'
						size='sm'
						loading={pdf.busy}
						onClick={() =>
							pdf.open(() =>
								tab === 'daily' ? cashRegisterService.dailyPdf(date) : cashRegisterService.currentPdf(),
							)
						}
					>
						<FaPrint className='mr-1.5' /> Chop etish
					</Button>
					<Button
						type='button'
						variant='warning'
						size='sm'
						disabled={!canWrite}
						title={canWrite ? undefined : "Bu kompaniyada faqat ko'rishga ruxsat bor"}
						onClick={() => navigate('/kassa/close')}
					>
						<FaLock className='mr-1.5' /> Kassani topshirish
					</Button>
				</>
			}
		>
			<div className='mb-3 flex gap-1.5'>
				{(
					[
						['current', 'Joriy davr', 'blue'],
						['daily', "Sana bo'yicha hisobot", 'teal'],
					] as const
				).map(([key, label, tone]) => (
					<button
						key={key}
						type='button'
						onClick={() => setTab(key)}
						className={cn(
							'h-8 rounded-[3px] border px-3.5 text-sm transition-colors',
							toneButton(tone, tab === key),
						)}
					>
						{label}
					</button>
				))}
			</div>

			{tab === 'current' ? <CurrentTab canWrite={canWrite} /> : <DailyTab date={date} onDateChange={setDate} />}
		</Panel>
	);
}
