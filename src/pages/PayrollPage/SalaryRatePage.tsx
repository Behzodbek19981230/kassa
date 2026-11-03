import { useEffect, useState, type FormEvent } from 'react';
import { FaBuilding, FaClock, FaRegCalendarAlt, FaSyncAlt, FaUser, FaUserTie } from 'react-icons/fa';
import { FaCoins } from 'react-icons/fa6';
import { useSearchParams } from 'react-router-dom';
import { PriceInput, useNotification } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
	CreatorName,
	EmployeeSelect,
	Field,
	GreenButton,
	MonthSelect,
	PageTitle,
	SectionTitle,
} from '@/pages/PayrollPage/shared/components';
import {
	apiFieldErrors,
	CARD,
	currentYearMonth,
	fmtDollar,
	fmtSom,
	formatDateTime,
	MONTH_NAMES_UZ,
	monthLabel,
	personName,
	toMoneyString,
	toNumber,
	type YearMonth,
} from '@/pages/PayrollPage/shared/utils';
import { useUpdateSalaryRateMutation, useUserSalaryHistoryQuery } from '@/services/payroll/payroll.queries';
import { useUserQuery } from '@/services/user/user.queries';

const FIELDS = ['user', 'oylik_dollar', 'oylik_som', 'effective_year', 'effective_month'] as const;
type FieldErrors = Partial<Record<(typeof FIELDS)[number] | 'form', string>>;

function joinedLabel(value?: string | null) {
	if (!value) return '';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return '';
	return `${d.getFullYear()} ${MONTH_NAMES_UZ[d.getMonth()]}`;
}

function Highlight({ changed, children }: { changed: boolean; children: string }) {
	return changed ? (
		<span className='inline-block rounded-md bg-emerald-100 px-3 py-1 font-bold text-ca-heading dark:bg-emerald-500/20'>
			{children}
		</span>
	) : (
		<>{children}</>
	);
}

export default function SalaryRatePage() {
	const { notify } = useNotification();
	const [searchParams, setSearchParams] = useSearchParams();
	const userId = Number(searchParams.get('user')) || undefined;

	const { data: user, isLoading: userLoading } = useUserQuery(userId);
	const historyQuery = useUserSalaryHistoryQuery(
		{ user: userId, ordering: '-changed_time', limit: 100 },
		Boolean(userId),
	);
	const history = historyQuery.data?.results ?? [];
	const mutation = useUpdateSalaryRateMutation();

	const [dollar, setDollar] = useState('');
	const [som, setSom] = useState('');
	const [effective, setEffective] = useState<YearMonth>(currentYearMonth);
	const [errors, setErrors] = useState<FieldErrors>({});

	// Prefill with the employee's current rate whenever another employee is opened (or after an update).
	useEffect(() => {
		setDollar(user ? String(toNumber(user.oylik_dollar)) : '');
		setSom(user ? String(toNumber(user.oylik_som)) : '');
		setErrors({});
	}, [user]);

	const setUser = (id: number | undefined) =>
		setSearchParams(
			(prev) => {
				const params = new URLSearchParams(prev);
				if (id) params.set('user', String(id));
				else params.delete('user');
				return params;
			},
			{ replace: true },
		);

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!userId || mutation.isPending) return;
		const next: FieldErrors = {};
		if (dollar.trim() === '' || toNumber(dollar) < 0) next.oylik_dollar = 'Oylik dollar kiritilishi shart';
		if (som.trim() === '' || toNumber(som) < 0) next.oylik_som = "Oylik so'm kiritilishi shart";
		setErrors(next);
		if (Object.keys(next).length) return;

		try {
			await mutation.mutateAsync({
				user: userId,
				oylik_dollar: toMoneyString(dollar),
				oylik_som: toMoneyString(som),
				effective_year: effective.year,
				effective_month: effective.month,
			});
			notify({
				title: 'Oylik yangilandi',
				text: `${monthLabel(effective.year, effective.month)} dan boshlab: ${fmtDollar(dollar)} $ · ${fmtSom(som)} so'm`,
			});
		} catch (err) {
			setErrors(apiFieldErrors(err, FIELDS));
		}
	};

	return (
		<>
			<PageTitle
				back
				title='Oylik tarifi'
				actions={
					<div className='w-64'>
						<EmployeeSelect value={userId} onChange={setUser} />
					</div>
				}
			/>

			{!userId ? (
				<div className={cn(CARD, 'p-10 text-center text-sm text-ca-text')}>
					Oylik tarifini ko'rish uchun yuqoridan xodimni tanlang
				</div>
			) : userLoading ? (
				<div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>
			) : !user ? (
				<div className='p-5 text-center text-ca-red'>Xodim topilmadi</div>
			) : (
				<>
					<div className={cn(CARD, 'mb-6 flex flex-wrap items-center gap-6 p-5')}>
						{user.avatar ? (
							<img src={user.avatar} alt='' className='h-28 w-28 rounded-full object-cover' />
						) : (
							<div className='flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 text-4xl text-emerald-600 dark:bg-emerald-500/10'>
								<FaUser />
							</div>
						)}
						<div className='min-w-0 flex-1'>
							<h2 className='mb-3 text-2xl font-bold text-ca-heading'>{personName(user)}</h2>
							<div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ca-heading'>
								{user.roles?.name && (
									<span className='flex items-center gap-2'>
										<FaUserTie className='text-emerald-600' /> {user.roles.name}
									</span>
								)}
								{user.trade_company_detail?.name && (
									<span className='flex items-center gap-2 border-l border-ca-border pl-6'>
										<FaBuilding className='text-emerald-600' /> {user.trade_company_detail.name}
									</span>
								)}
								{joinedLabel(user.date_joined) && (
									<span className='flex items-center gap-2 border-l border-ca-border pl-6'>
										<FaRegCalendarAlt className='text-emerald-600' /> Ishga qabul qilingan:{' '}
										{joinedLabel(user.date_joined)}
									</span>
								)}
							</div>
						</div>
					</div>

					<form
						onSubmit={onSubmit}
						noValidate
						className='mb-6 rounded-xl border border-emerald-300 bg-emerald-50/60 p-5 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/5'
					>
						<SectionTitle icon={<FaCoins />}>Joriy oylik</SectionTitle>
						{errors.form && (
							<div className='mb-3 rounded-lg border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{errors.form}
							</div>
						)}
						<div className='grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]'>
							<Field label='Oylik dollar' error={errors.oylik_dollar}>
								<PriceInput value={dollar} onChange={setDollar} placeholder='0' className='h-11 text-base font-semibold' />
							</Field>
							<Field label="Oylik so'm" error={errors.oylik_som}>
								<PriceInput value={som} onChange={setSom} placeholder='0' className='h-11 text-base font-semibold' />
							</Field>
							<Field label='Amal qilish oyi' error={errors.effective_month ?? errors.effective_year}>
								<MonthSelect value={effective} onChange={setEffective} />
							</Field>
							<div className={cn((errors.oylik_dollar || errors.oylik_som) && 'mb-5')}>
								<GreenButton type='submit' className='h-11 w-full px-6 text-sm' loading={mutation.isPending}>
									<FaSyncAlt /> Oylikni yangilash
								</GreenButton>
							</div>
						</div>
						<p className='mt-3 text-[11px] text-ca-text'>
							Tanlangan oy va keyingi ochiq davrlar yangilanadi. Oldingi va yopilgan davrlar o'zgarmaydi.
						</p>
					</form>

					<div className={cn(CARD, 'p-5')}>
						<SectionTitle icon={<FaClock />}>O'zgarish tarixi</SectionTitle>
						<div className='overflow-x-auto'>
							<table className='w-full min-w-[860px] text-sm'>
								<thead>
									<tr className='bg-ca-silver text-left text-ca-heading'>
										<th className='w-10 rounded-l-lg px-3 py-3' />
										<th className='px-3 py-3 font-semibold'>O'zgargan vaqt</th>
										<th className='px-3 py-3 text-center font-semibold'>Eski dollar</th>
										<th className='px-3 py-3 text-center font-semibold'>Yangi dollar</th>
										<th className='px-3 py-3 text-center font-semibold'>Eski so'm</th>
										<th className='px-3 py-3 text-center font-semibold'>Yangi so'm</th>
										<th className='rounded-r-lg px-3 py-3 font-semibold'>O'zgartirgan</th>
									</tr>
								</thead>
								<tbody>
									{history.length === 0 ? (
										<tr>
											<td colSpan={7} className='px-3 py-8 text-center text-ca-text'>
												{historyQuery.isLoading ? 'Yuklanmoqda...' : "O'zgarishlar tarixi yo'q"}
											</td>
										</tr>
									) : (
										history.map((h, index) => {
											const first = index === 0;
											const last = index === history.length - 1;
											return (
												<tr key={h.id} className={cn(first && 'bg-emerald-50/70 dark:bg-emerald-500/5')}>
													<td className='relative px-3 py-3'>
														{!last && (
															<span className='absolute top-1/2 left-1/2 h-full w-px -translate-x-1/2 bg-emerald-300' />
														)}
														<span
															className={cn(
																'relative mx-auto block h-3.5 w-3.5 rounded-full border-2',
																first
																	? 'border-emerald-600 bg-emerald-600'
																	: 'border-ca-field-border-strong bg-ca-silver-light',
															)}
														/>
													</td>
													<td className='px-3 py-3'>
														<div className='font-bold text-ca-heading'>
															{monthLabel(h.effective_year, h.effective_month)}
														</div>
														<div className='text-[11px] text-ca-text'>{formatDateTime(h.changed_time)}</div>
													</td>
													<td className='px-3 py-3 text-center text-ca-heading'>{fmtSom(h.old_oylik_dollar)}</td>
													<td className='px-3 py-3 text-center text-ca-heading'>
														<Highlight changed={toNumber(h.old_oylik_dollar) !== toNumber(h.new_oylik_dollar)}>
															{fmtSom(h.new_oylik_dollar)}
														</Highlight>
													</td>
													<td className='px-3 py-3 text-center text-ca-heading'>{fmtSom(h.old_oylik_som)}</td>
													<td className='px-3 py-3 text-center text-ca-heading'>
														<Highlight changed={toNumber(h.old_oylik_som) !== toNumber(h.new_oylik_som)}>
															{fmtSom(h.new_oylik_som)}
														</Highlight>
													</td>
													<td className='px-3 py-3 text-ca-heading'>
														<span className='flex items-center gap-2'>
															<span className='flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'>
																<FaUser className='text-xs' />
															</span>
															<CreatorName id={h.created_by} detail={h.created_by_detail} />
														</span>
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
			)}
		</>
	);
}
