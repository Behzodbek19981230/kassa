import { useState, type FormEvent } from 'react';
import { FaCalculator, FaLock } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DatePicker, PriceInput, Textarea, useNotification } from '@/components/ui';
import { cn } from '@/lib/utils';
import { todayTashkent } from '@/pages/TwoStageImport/utils';
import { EmployeeSelect, Field, GreenButton, MonthSelect, OutlineButton } from '@/pages/PayrollPage/shared/components';
import { useIdempotencyKey } from '@/pages/PayrollPage/shared/useIdempotencyKey';
import {
	apiFieldErrors,
	CARD,
	fmtDollar,
	fmtSom,
	monthLabel,
	toMoneyString,
	toNumber,
	useYearMonthParams,
} from '@/pages/PayrollPage/shared/utils';
import { useCreateSalaryPaymentMutation, useSalaryPeriodLookupQuery } from '@/services/payroll/payroll.queries';
import { useUserQuery } from '@/services/user/user.queries';

interface FormState {
	summa_dollar: string;
	summa_som: string;
	summa_karta: string;
	payment_date: string;
	note: string;
}

const FIELDS = ['user', 'summa_dollar', 'summa_som', 'summa_karta', 'payment_date', 'note'] as const;
type FieldErrors = Partial<Record<(typeof FIELDS)[number] | 'form', string>>;

const emptyForm = (): FormState => ({
	summa_dollar: '',
	summa_som: '',
	summa_karta: '',
	payment_date: todayTashkent(),
	note: '',
});

function SummaryBlock({
	title,
	total,
	paid,
	remaining,
}: {
	title: string;
	total: string;
	paid: string;
	remaining: string;
}) {
	return (
		<div className='space-y-1'>
			<div className='flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2.5 text-base font-bold text-ca-heading dark:bg-emerald-500/10'>
				<span>{title}</span>
				<span>{total}</span>
			</div>
			<div className='flex items-center justify-between px-4 py-2 text-sm text-ca-heading'>
				<span>Berilgan</span>
				<span>{paid}</span>
			</div>
			<div className='flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'>
				<span className='text-base font-bold'>Qolgan</span>
				<span className='text-xl font-bold'>{remaining}</span>
			</div>
		</div>
	);
}

export default function SalaryPaymentPage() {
	const navigate = useNavigate();
	const { notify } = useNotification();
	const [searchParams, setSearchParams] = useSearchParams();
	const [ym, setYm] = useYearMonthParams();
	const userId = Number(searchParams.get('user')) || undefined;

	const [form, setForm] = useState<FormState>(emptyForm);
	const [errors, setErrors] = useState<FieldErrors>({});
	const idempotency = useIdempotencyKey();

	const { data: user } = useUserQuery(userId);
	const periodQuery = useSalaryPeriodLookupQuery({ user: userId, year: ym.year, month: ym.month });
	const period = periodQuery.data ?? null;
	const mutation = useCreateSalaryPaymentMutation();

	const payableDollar = toNumber(period?.payable_dollar ?? user?.oylik_dollar);
	const payableSom = toNumber(period?.payable_som ?? user?.oylik_som);
	const paidDollar = toNumber(period?.paid_dollar);
	const paidSomTotal = toNumber(period?.paid_som) + toNumber(period?.paid_card);
	const remainingDollar = toNumber(period?.remaining_dollar ?? payableDollar);
	const remainingSom = toNumber(period?.remaining_som ?? payableSom);
	const isClosed = period?.status === 'CLOSED';

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

	const update = (field: keyof FormState) => (value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
	};

	function validate(): FieldErrors {
		const next: FieldErrors = {};
		const dollar = toNumber(form.summa_dollar);
		const som = toNumber(form.summa_som);
		const card = toNumber(form.summa_karta);
		if (!userId) next.user = 'Xodim tanlanishi shart';
		if (!form.payment_date) next.payment_date = "To'lov sanasi kiritilishi shart";
		if (dollar <= 0 && som <= 0 && card <= 0) next.summa_dollar = "Kamida bitta summa 0 dan katta bo'lishi kerak";
		if (dollar > remainingDollar) next.summa_dollar = `Qoldiqdan ortiq: ${fmtDollar(remainingDollar)} $`;
		if (som + card > remainingSom) {
			next.summa_karta = `Naqd va karta qoldiqdan ortiq: ${fmtSom(remainingSom)} so'm`;
		}
		return next;
	}

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (mutation.isPending || !userId) {
			if (!userId) setErrors({ user: 'Xodim tanlanishi shart' });
			return;
		}
		const found = validate();
		setErrors(found);
		if (Object.values(found).some(Boolean)) return;

		const contents = {
			user: userId,
			year: ym.year,
			month: ym.month,
			summa_dollar: toMoneyString(form.summa_dollar),
			summa_som: toMoneyString(form.summa_som),
			summa_karta: toMoneyString(form.summa_karta),
			payment_date: form.payment_date,
			note: form.note.trim(),
		};

		try {
			const result = await mutation.mutateAsync({ ...contents, payment_key: idempotency.keyFor(contents) });
			idempotency.reset();
			const p = result.salary_period;
			notify({
				title: "To'lov saqlandi",
				text: p ? `Qolgan: ${fmtDollar(p.remaining_dollar)} $ · ${fmtSom(p.remaining_som)} so'm` : undefined,
			});
			setForm((prev) => ({ ...emptyForm(), payment_date: prev.payment_date }));
		} catch (err) {
			setErrors(apiFieldErrors(err, FIELDS));
		}
	};

	return (
		<>
			<div className='mb-5 flex items-center gap-3'>
				<span className='h-9 w-1.5 rounded-full bg-emerald-600' />
				<h1 className='text-2xl font-bold text-ca-heading'>Pul berish</h1>
			</div>

			<div className='grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]'>
				<form onSubmit={onSubmit} noValidate className={cn(CARD, 'space-y-5 p-6')}>
					{errors.form && (
						<div className='rounded-lg border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
							{errors.form}
						</div>
					)}
					{isClosed && (
						<div className='flex items-center gap-2 rounded-lg border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
							<FaLock /> {monthLabel(ym.year, ym.month)} davri yopilgan — to'lov qilib bo'lmaydi.
						</div>
					)}

					<Field label='Xodim' error={errors.user}>
						<EmployeeSelect value={userId} onChange={setUser} />
					</Field>

					<Field label='Qaysi oy uchun'>
						<MonthSelect value={ym} onChange={setYm} />
					</Field>

					<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
						<Field label='Summa dollar' error={errors.summa_dollar}>
							<PriceInput value={form.summa_dollar} onChange={update('summa_dollar')} placeholder='0' />
						</Field>
						<Field label="Summa so'm" error={errors.summa_som}>
							<PriceInput value={form.summa_som} onChange={update('summa_som')} placeholder='0' />
						</Field>
						<Field label='Summa karta' error={errors.summa_karta}>
							<PriceInput value={form.summa_karta} onChange={update('summa_karta')} placeholder='0' />
						</Field>
					</div>

					<div className='sm:w-1/2'>
						<Field label="To'lov sanasi" error={errors.payment_date}>
							<DatePicker value={form.payment_date} onChange={update('payment_date')} />
						</Field>
					</div>

					<Field label='Izoh' error={errors.note}>
						<Textarea
							rows={3}
							value={form.note}
							onChange={(e) => update('note')(e.target.value)}
							placeholder={`${monthLabel(ym.year, ym.month).split(' ')[1]} oyligidan avans`}
						/>
					</Field>

					<div className='flex justify-end gap-3 border-t border-ca-border pt-5'>
						<OutlineButton type='button' className='h-10 min-w-36' onClick={() => navigate(-1)}>
							Bekor qilish
						</OutlineButton>
						<GreenButton
							type='submit'
							className='h-10 min-w-44 text-sm'
							loading={mutation.isPending}
							disabled={isClosed || !userId}
						>
							Saqlash
						</GreenButton>
					</div>
				</form>

				<div className={cn(CARD, 'h-fit overflow-hidden')}>
					<div className='flex items-center gap-3 bg-emerald-600 px-6 py-4 text-white'>
						<FaCalculator className='text-2xl' />
						<h2 className='text-xl font-bold'>Hozirgi hisob</h2>
					</div>
					{!userId ? (
						<p className='p-6 text-center text-sm text-ca-text'>Hisobni ko'rish uchun xodimni tanlang</p>
					) : (
						<div className='space-y-5 p-5'>
							<p className='text-xs text-ca-text'>
								{monthLabel(ym.year, ym.month)} oyligi
								{periodQuery.isFetching && ' · yangilanmoqda...'}
							</p>
							<SummaryBlock
								title='Dollar oyligi'
								total={fmtDollar(payableDollar)}
								paid={fmtDollar(paidDollar)}
								remaining={fmtDollar(remainingDollar)}
							/>
							<SummaryBlock
								title="So'm oyligi"
								total={fmtSom(payableSom)}
								paid={fmtSom(paidSomTotal)}
								remaining={fmtSom(remainingSom)}
							/>
							<div className='overflow-hidden rounded-lg border border-ca-border text-sm text-ca-heading'>
								<div className='border-b border-ca-border bg-ca-silver px-4 py-2 text-xs font-semibold text-ca-text'>
									Ushbu to'lov
								</div>
								<div className='flex justify-between border-b border-ca-border px-4 py-2.5'>
									<span>Dollar</span>
									<span>{fmtDollar(form.summa_dollar)}</span>
								</div>
								<div className='flex justify-between border-b border-ca-border px-4 py-2.5'>
									<span>Naqd so'm</span>
									<span>{fmtSom(form.summa_som)}</span>
								</div>
								<div className='flex justify-between px-4 py-2.5'>
									<span>Karta</span>
									<span>{fmtSom(form.summa_karta)}</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
