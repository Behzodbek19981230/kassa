import { useState, type FormEvent } from 'react';
import { FaHistory, FaInfoCircle, FaLock, FaSave, FaTable } from 'react-icons/fa';
import { FaCoins } from 'react-icons/fa6';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DatePicker, PriceInput, Textarea, useNotification } from '@/components/ui';
import { cn } from '@/lib/utils';
import { todayTashkent } from '@/pages/TwoStageImport/utils';
import {
	AdjustmentBadge,
	CreatorName,
	EmployeeSelect,
	Field,
	GreenButton,
	MonthSelect,
	OutlineButton,
	PageTitle,
	SectionTitle,
} from '@/pages/PayrollPage/shared/components';
import { useIdempotencyKey } from '@/pages/PayrollPage/shared/useIdempotencyKey';
import {
	ADJUSTMENT_META,
	ADJUSTMENT_TYPES,
	apiFieldErrors,
	CARD,
	fmtDollar,
	fmtSom,
	formatDateTime,
	monthLabel,
	personName,
	toMoneyString,
	toNumber,
	useYearMonthParams,
} from '@/pages/PayrollPage/shared/utils';
import {
	useCreateSalaryAdjustmentMutation,
	useSalaryAdjustmentListQuery,
	useSalaryPeriodLookupQuery,
} from '@/services/payroll/payroll.queries';
import type { SalaryAdjustment, SalaryAdjustmentType } from '@/services/payroll/payroll.types';
import { useUserQuery } from '@/services/user/user.queries';

const FIELDS = ['user', 'adjustment_type', 'summa_dollar', 'summa_som', 'reason', 'adjustment_date'] as const;
type FieldErrors = Partial<Record<(typeof FIELDS)[number] | 'form', string>>;

interface FormState {
	adjustment_type: SalaryAdjustmentType;
	summa_dollar: string;
	summa_som: string;
	reason: string;
	adjustment_date: string;
}

const emptyForm = (type: SalaryAdjustmentType = 'PENALTY'): FormState => ({
	adjustment_type: type,
	summa_dollar: '',
	summa_som: '',
	reason: '',
	adjustment_date: todayTashkent(),
});

const TYPE_ACTIVE: Record<SalaryAdjustmentType, string> = {
	PENALTY: 'border-red-400 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
	BONUS: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
	ADDITION: 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
	CORRECTION: 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
};

function adjustmentMonth(a: SalaryAdjustment) {
	const year = a.year ?? a.period_detail?.year;
	const month = a.month ?? a.period_detail?.month;
	return year && month ? monthLabel(year, month) : '—';
}

export default function SalaryAdjustmentPage() {
	const navigate = useNavigate();
	const { notify } = useNotification();
	const [searchParams, setSearchParams] = useSearchParams();
	const [ym, setYm] = useYearMonthParams();
	const userId = Number(searchParams.get('user')) || undefined;

	const [form, setForm] = useState<FormState>(() => emptyForm());
	const [errors, setErrors] = useState<FieldErrors>({});
	const idempotency = useIdempotencyKey();

	const { data: user } = useUserQuery(userId);
	const periodQuery = useSalaryPeriodLookupQuery({ user: userId, year: ym.year, month: ym.month });
	const period = periodQuery.data ?? null;
	const mutation = useCreateSalaryAdjustmentMutation();
	const historyQuery = useSalaryAdjustmentListQuery({
		user: userId,
		ordering: '-adjustment_date',
		limit: 100,
	});
	const history = historyQuery.data?.results ?? [];

	const isClosed = period?.status === 'CLOSED';
	const payableDollar = toNumber(period?.payable_dollar ?? user?.oylik_dollar);
	const payableSom = toNumber(period?.payable_som ?? user?.oylik_som);
	const remainingDollar = toNumber(period?.remaining_dollar ?? payableDollar);
	const remainingSom = toNumber(period?.remaining_som ?? payableSom);
	const meta = ADJUSTMENT_META[form.adjustment_type];
	const isPenalty = form.adjustment_type === 'PENALTY';
	const deltaDollar = meta.sign * toNumber(form.summa_dollar);
	const deltaSom = meta.sign * toNumber(form.summa_som);

	const setUser = (id: number | undefined) => {
		setSearchParams(
			(prev) => {
				const params = new URLSearchParams(prev);
				if (id) params.set('user', String(id));
				else params.delete('user');
				return params;
			},
			{ replace: true },
		);
		setErrors({});
	};

	const update = <K extends keyof FormState>(field: K) => (value: FormState[K]) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
	};

	function validate(): FieldErrors {
		const next: FieldErrors = {};
		const dollar = toNumber(form.summa_dollar);
		const som = toNumber(form.summa_som);
		if (!userId) next.user = 'Xodim tanlanishi shart';
		if (!form.adjustment_date) next.adjustment_date = 'Sana kiritilishi shart';
		if (!form.reason.trim()) next.reason = 'Sabab kiritilishi shart';
		if (dollar <= 0 && som <= 0) next.summa_dollar = "Kamida bitta summa 0 dan katta bo'lishi kerak";
		if (isPenalty) {
			if (dollar > payableDollar) next.summa_dollar = `Jarima oylikdan oshmasin: ${fmtDollar(payableDollar)} $`;
			if (som > payableSom) next.summa_som = `Jarima oylikdan oshmasin: ${fmtSom(payableSom)} so'm`;
		}
		return next;
	}

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (mutation.isPending) return;
		const found = validate();
		setErrors(found);
		if (Object.values(found).some(Boolean) || !userId) return;

		const contents = {
			user: userId,
			year: ym.year,
			month: ym.month,
			adjustment_type: form.adjustment_type,
			summa_dollar: toMoneyString(form.summa_dollar),
			summa_som: toMoneyString(form.summa_som),
			reason: form.reason.trim(),
			adjustment_date: form.adjustment_date,
		};

		try {
			const result = await mutation.mutateAsync({ ...contents, adjustment_key: idempotency.keyFor(contents) });
			idempotency.reset();
			const p = result.salary_period;
			notify({
				title: `${meta.label} saqlandi`,
				text: p ? `Yangi qoldiq: ${fmtDollar(p.remaining_dollar)} $ · ${fmtSom(p.remaining_som)} so'm` : undefined,
			});
			setForm((prev) => emptyForm(prev.adjustment_type));
		} catch (err) {
			setErrors(apiFieldErrors(err, FIELDS));
		}
	};

	return (
		<>
			<PageTitle
				icon={<FaCoins />}
				title='Jarima yoki bonus'
				subtitle="Xodim ish haqiga jarima, bonus, qo'shimcha haq yoki tuzatish kiritish."
			/>

			<div className='mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_440px]'>
				<form onSubmit={onSubmit} noValidate className={cn(CARD, 'space-y-4 p-6')}>
					{errors.form && (
						<div className='rounded-lg border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
							{errors.form}
						</div>
					)}
					{isClosed && (
						<div className='flex items-center gap-2 rounded-lg border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
							<FaLock /> {monthLabel(ym.year, ym.month)} davri yopilgan — jarima va bonus kiritib bo'lmaydi.
						</div>
					)}

					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
						<Field label='Xodim' error={errors.user}>
							<EmployeeSelect value={userId} onChange={setUser} />
						</Field>
						<Field label='Qaysi oy uchun'>
							<MonthSelect value={ym} onChange={setYm} />
						</Field>
					</div>

					<Field label='Amal turi' error={errors.adjustment_type}>
						<div role='radiogroup' className='grid grid-cols-2 gap-3 md:grid-cols-4'>
							{ADJUSTMENT_TYPES.map((type) => {
								const active = form.adjustment_type === type;
								return (
									<button
										key={type}
										type='button'
										role='radio'
										aria-checked={active}
										onClick={() => update('adjustment_type')(type)}
										className={cn(
											'flex h-11 items-center gap-2.5 rounded-lg border px-4 text-sm font-medium text-ca-heading transition-colors',
											active ? TYPE_ACTIVE[type] : 'border-ca-field-border hover:bg-ca-silver',
										)}
									>
										<span
											className={cn(
												'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
												active ? 'border-current' : 'border-ca-field-border',
											)}
										>
											{active && <span className='h-2 w-2 rounded-full bg-current' />}
										</span>
										{ADJUSTMENT_META[type].label}
									</button>
								);
							})}
						</div>
					</Field>

					<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
						<Field label='Summa dollar' error={errors.summa_dollar}>
							<PriceInput value={form.summa_dollar} onChange={update('summa_dollar')} placeholder='0.00' />
						</Field>
						<Field label="Summa so'm" error={errors.summa_som}>
							<PriceInput value={form.summa_som} onChange={update('summa_som')} placeholder='0' />
						</Field>
						<Field label='Sana' error={errors.adjustment_date}>
							<DatePicker value={form.adjustment_date} onChange={update('adjustment_date')} />
						</Field>
					</div>

					<Field label='Sabab' error={errors.reason}>
						<Textarea
							rows={3}
							value={form.reason}
							onChange={(e) => update('reason')(e.target.value)}
							placeholder='Masalan: Jihozni sindirgan'
						/>
					</Field>

					<div className='flex justify-end gap-3 pt-1'>
						<OutlineButton type='button' className='h-10 min-w-32' onClick={() => navigate(-1)}>
							Bekor qilish
						</OutlineButton>
						<GreenButton
							type='submit'
							className='h-10 min-w-32 text-sm'
							loading={mutation.isPending}
							disabled={isClosed || !userId}
						>
							<FaSave /> Saqlash
						</GreenButton>
					</div>
				</form>

				<div className={cn(CARD, 'h-fit p-5')}>
					<div className='mb-4 flex items-center gap-3'>
						<span className='flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-xl text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'>
							<FaTable />
						</span>
						<h2 className='text-lg font-bold text-ca-heading'>Hisobga ta'siri</h2>
					</div>
					{!userId ? (
						<p className='py-6 text-center text-sm text-ca-text'>Ta'sirni ko'rish uchun xodimni tanlang</p>
					) : (
						<>
							<div className='overflow-hidden rounded-lg border border-ca-border text-sm'>
								<div className='grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-ca-border px-4 py-3 text-ca-heading'>
									<span>Oldingi qoldiq</span>
									<span className='text-right font-semibold'>$ {fmtDollar(remainingDollar)}</span>
									<span className='text-right font-semibold'>{fmtSom(remainingSom)} so'm</span>
								</div>
								<div
									className={cn(
										'grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-ca-border px-4 py-3 font-medium',
										isPenalty
											? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
											: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
									)}
								>
									<span>O'zgarish ({meta.label})</span>
									<span className='text-right font-semibold'>
										{deltaDollar < 0 ? '- ' : '+ '}$ {fmtDollar(Math.abs(deltaDollar))}
									</span>
									<span className='text-right font-semibold'>
										{deltaSom < 0 ? '- ' : '+ '}
										{fmtSom(Math.abs(deltaSom))} so'm
									</span>
								</div>
								<div className='grid grid-cols-[1fr_auto_auto] items-center gap-4 bg-emerald-50 px-4 py-3 text-base font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'>
									<span>Yangi qoldiq</span>
									<span className='text-right'>$ {fmtDollar(remainingDollar + deltaDollar)}</span>
									<span className='text-right'>{fmtSom(remainingSom + deltaSom)} so'm</span>
								</div>
							</div>
							<div className='mt-4 flex gap-3 rounded-lg bg-ca-silver px-4 py-3 text-xs text-ca-heading'>
								<FaInfoCircle className='mt-0.5 shrink-0 text-base text-ca-text' />
								<span>
									Ushbu o'zgarish {monthLabel(ym.year, ym.month)} oyining ish haqi hisobiga tatbiq etiladi va
									xodim qoldig'ini yangilaydi. Yakuniy qiymatni server hisoblaydi.
								</span>
							</div>
						</>
					)}
				</div>
			</div>

			<div className={cn(CARD, 'p-5')}>
				<SectionTitle icon={<FaHistory />}>O'zgarishlar tarixi</SectionTitle>
				<div className='overflow-x-auto'>
					<table className='w-full min-w-[1000px] text-xs'>
						<thead>
							<tr className='bg-ca-silver text-left text-ca-heading'>
								<th className='px-3 py-3 font-semibold'>№</th>
								<th className='px-3 py-3 font-semibold'>Sana</th>
								<th className='px-3 py-3 font-semibold'>Xodim</th>
								<th className='px-3 py-3 font-semibold'>Qaysi oy uchun</th>
								<th className='px-3 py-3 font-semibold'>Amal turi</th>
								<th className='px-3 py-3 text-right font-semibold'>Summa dollar</th>
								<th className='px-3 py-3 text-right font-semibold'>Summa so'm</th>
								<th className='px-3 py-3 font-semibold'>Sabab</th>
								<th className='px-3 py-3 font-semibold'>Kim kiritgan</th>
							</tr>
						</thead>
						<tbody>
							{history.length === 0 ? (
								<tr>
									<td colSpan={9} className='px-3 py-8 text-center text-ca-text'>
										{historyQuery.isLoading ? 'Yuklanmoqda...' : "O'zgarishlar topilmadi"}
									</td>
								</tr>
							) : (
								history.map((a, index) => {
									const sign = ADJUSTMENT_META[a.adjustment_type]?.sign ?? 1;
									const tone = sign < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400';
									const dollar = toNumber(a.summa_dollar);
									const som = toNumber(a.summa_som);
									return (
										<tr key={a.id} className='border-b border-ca-border last:border-b-0'>
											<td className='px-3 py-3 text-ca-heading'>{index + 1}</td>
											<td className='px-3 py-3 whitespace-nowrap text-ca-heading'>
												{a.created_time ? formatDateTime(a.created_time) : a.adjustment_date}
											</td>
											<td className='px-3 py-3 text-ca-heading'>
												{a.user_detail ? personName(a.user_detail) : <CreatorName id={a.user} />}
											</td>
											<td className='px-3 py-3 text-ca-heading'>{adjustmentMonth(a)}</td>
											<td className='px-3 py-3'>
												<AdjustmentBadge type={a.adjustment_type} />
											</td>
											<td className={cn('px-3 py-3 text-right font-semibold', dollar > 0 ? tone : 'text-ca-heading')}>
												{dollar > 0 && sign < 0 ? '- ' : ''}$ {fmtDollar(dollar)}
											</td>
											<td className={cn('px-3 py-3 text-right font-semibold', som > 0 ? tone : 'text-ca-heading')}>
												{som > 0 && sign < 0 ? '- ' : ''}
												{fmtSom(som)}
											</td>
											<td className='px-3 py-3 text-ca-heading'>{a.reason}</td>
											<td className='px-3 py-3 text-ca-heading'>
												<CreatorName id={a.created_by} detail={a.created_by_detail} />
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
		</>
	);
}
