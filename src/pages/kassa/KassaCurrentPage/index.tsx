import { FaFileExcel, FaLock, FaPrint } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Panel } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { cn } from '@/lib/utils';
import CurrentTab from '@/pages/kassa/KassaCurrentPage/CurrentTab';
import DailyTab from '@/pages/kassa/KassaCurrentPage/DailyTab';
import { PanelTitle } from '@/pages/kassa/shared';
import { useCompanyName, useFileDownloader, usePdfOpener } from '@/pages/kassa/hooks';
import { kassaTypeLabel, type KassaTypeState } from '@/pages/kassa/kassaType';
import { KassaTypeBoundary, KassaTypeSwitcher } from '@/pages/kassa/KassaTypeUi';
import { fmtUsd, todayIso, toneButton } from '@/pages/kassa/utils';
import { useCashRegisterSummaryQuery } from '@/services/cash-register/cash-register.queries';
import { cashRegisterService } from '@/services/cash-register/cash-register.service';

type TabKey = 'current' | 'daily';

/** "Joriy kassa" of one seller type: the open period (01) and the per-day report (07); `?type=&tab=daily&date=`. */
export default function KassaCurrentPage() {
	return <KassaTypeBoundary title='Joriy kassa'>{(kassa) => <KassaCurrentContent kassa={kassa} />}</KassaTypeBoundary>;
}

function KassaCurrentContent({ kassa }: { kassa: KassaTypeState }) {
	const { type, canPickType, setType } = kassa;
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
	// The switcher shows each kassa's balance; only the roles that may switch get it.
	const summaryQuery = useCashRegisterSummaryQuery(canPickType);

	function setParams(next: { tab?: TabKey; date?: string }) {
		const params = new URLSearchParams();
		if (canPickType) params.set('type', String(type));
		if (next.tab === 'daily') params.set('tab', 'daily');
		if (next.tab === 'daily' && next.date && next.date !== today) params.set('date', next.date);
		setSearchParams(params, { replace: true });
	}
	const setTab = (next: TabKey) => setParams({ tab: next });
	const setDate = (next: string) => setParams({ tab: 'daily', date: next });

	return (
		<Panel
			title={<PanelTitle title='Joriy kassa' sub={[kassaTypeLabel(type), companyName].filter(Boolean).join(' · ')} />}
			actions={
				<>
					{tab === 'daily' && (
						<Button
							type='button'
							variant='excel'
							size='sm'
							loading={excel.busy}
							onClick={() => excel.download(() => cashRegisterService.dailyExcel(type, date))}
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
								tab === 'daily' ? cashRegisterService.dailyPdf(type, date) : cashRegisterService.currentPdf(type),
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
						onClick={() => navigate(`/kassa/close?type=${type}`)}
					>
						<FaLock className='mr-1.5' /> Kassani topshirish
					</Button>
				</>
			}
		>
			{canPickType && (
				<KassaTypeSwitcher
					type={type}
					onChange={setType}
					className='mb-3'
					value={(t) => {
						const row = summaryQuery.data?.types.find((r) => r.user_type === t);
						if (!row) return undefined;
						return row.is_initial ? <span className='font-normal text-ca-text'>boshlanmagan</span> : fmtUsd(row.expected_usd);
					}}
				/>
			)}

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

			{tab === 'current' ? (
				<CurrentTab type={type} canWrite={canWrite} />
			) : (
				<DailyTab type={type} date={date} onDateChange={setDate} />
			)}
		</Panel>
	);
}
