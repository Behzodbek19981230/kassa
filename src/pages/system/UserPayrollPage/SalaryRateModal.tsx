import { useEffect, useState, type FormEvent } from 'react';
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	PriceInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useNotification,
} from '@/components/ui';
import {
	apiFieldErrors,
	fmtDateTime,
	fmtDollar,
	fmtSom,
	MONTH_TABS,
	personName,
	toMoneyString,
	toNumber,
} from '@/pages/system/UserPayrollPage/utils';
import { useUpdateSalaryRateMutation, useUserSalaryHistoryQuery } from '@/services/payroll/payroll.queries';

const FIELDS = ['oylik_dollar', 'oylik_som', 'effective_year', 'effective_month'] as const;
type FieldErrors = Partial<Record<(typeof FIELDS)[number] | 'form', string>>;

interface SalaryRateModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	userId: number;
	currentDollar?: string;
	currentSom?: string;
	/** Month the new rate starts from by default (the month open on the page). */
	year: number;
	month: number;
}

/** Changes an employee's salary from a given month on, and lists earlier changes. */
export default function SalaryRateModal({
	open,
	setOpen,
	userId,
	currentDollar,
	currentSom,
	year,
	month,
}: SalaryRateModalProps) {
	const { notify } = useNotification();
	const mutation = useUpdateSalaryRateMutation();
	const historyQuery = useUserSalaryHistoryQuery({ user: userId, ordering: '-changed_time', limit: 100 }, open);
	const history = historyQuery.data?.results ?? [];

	const [dollar, setDollar] = useState('');
	const [som, setSom] = useState('');
	const [effYear, setEffYear] = useState(year);
	const [effMonth, setEffMonth] = useState(month);
	const [errors, setErrors] = useState<FieldErrors>({});

	useEffect(() => {
		if (open) {
			setDollar(String(toNumber(currentDollar) || ''));
			setSom(String(toNumber(currentSom) || ''));
			setEffYear(year);
			setEffMonth(month);
			setErrors({});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const years = Array.from({ length: 4 }, (_, i) => year - 1 + i);

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (mutation.isPending) return;
		if (toNumber(dollar) < 0 || toNumber(som) < 0) {
			setErrors({ oylik_dollar: "Oylik manfiy bo'lmasin" });
			return;
		}
		try {
			await mutation.mutateAsync({
				user: userId,
				oylik_dollar: toMoneyString(dollar),
				oylik_som: toMoneyString(som),
				effective_year: effYear,
				effective_month: effMonth,
			});
			notify({ title: 'Oylik tarifi saqlandi' });
			setOpen(false);
		} catch (err) {
			setErrors(apiFieldErrors(err, FIELDS));
		}
	};

	return (
		<Modal open={open} onOpenChange={(next) => !mutation.isPending && setOpen(next)}>
			<ModalContent className='max-w-[640px] rounded-xl'>
				<form onSubmit={onSubmit} noValidate>
					<ModalHeader className='px-6 py-5'>
						<ModalTitle className='text-xl font-bold'>Oylik tarifini o'zgartirish</ModalTitle>
					</ModalHeader>
					<ModalBody className='space-y-4 px-6 py-5'>
						{errors.form && (
							<div className='rounded-lg border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{errors.form}
							</div>
						)}
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label className='mb-1.5 block text-sm font-semibold text-ca-heading'>Oylik dollar</label>
								<PriceInput value={dollar} onChange={setDollar} placeholder='0' />
								{errors.oylik_dollar && <p className='mt-1 text-[11px] text-ca-red'>{errors.oylik_dollar}</p>}
							</div>
							<div>
								<label className='mb-1.5 block text-sm font-semibold text-ca-heading'>Oylik so'm</label>
								<PriceInput value={som} onChange={setSom} placeholder='0' />
								{errors.oylik_som && <p className='mt-1 text-[11px] text-ca-red'>{errors.oylik_som}</p>}
							</div>
							<div>
								<label className='mb-1.5 block text-sm font-semibold text-ca-heading'>Qaysi yildan</label>
								<Select value={String(effYear)} onValueChange={(v) => setEffYear(Number(v))}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{years.map((y) => (
											<SelectItem key={y} value={String(y)}>
												{y}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.effective_year && <p className='mt-1 text-[11px] text-ca-red'>{errors.effective_year}</p>}
							</div>
							<div>
								<label className='mb-1.5 block text-sm font-semibold text-ca-heading'>Qaysi oydan</label>
								<Select value={String(effMonth)} onValueChange={(v) => setEffMonth(Number(v))}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{MONTH_TABS.map((label, i) => (
											<SelectItem key={label} value={String(i + 1)}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.effective_month && <p className='mt-1 text-[11px] text-ca-red'>{errors.effective_month}</p>}
							</div>
						</div>

						<div>
							<h3 className='mb-2 text-sm font-semibold text-ca-heading'>O'zgarishlar tarixi</h3>
							<div className='max-h-60 overflow-auto rounded-lg border border-ca-border'>
								<table className='w-full text-xs'>
									<thead className='sticky top-0 bg-ca-silver text-left text-ca-heading'>
										<tr>
											<th className='px-3 py-2 font-semibold'>Oydan</th>
											<th className='px-3 py-2 font-semibold'>Eski</th>
											<th className='px-3 py-2 font-semibold'>Yangi</th>
											<th className='px-3 py-2 font-semibold'>Sana</th>
											<th className='px-3 py-2 font-semibold'>Kim</th>
										</tr>
									</thead>
									<tbody>
										{history.length === 0 ? (
											<tr>
												<td colSpan={5} className='px-3 py-4 text-center text-ca-text'>
													{historyQuery.isLoading ? 'Yuklanmoqda...' : "O'zgarishlar yo'q"}
												</td>
											</tr>
										) : (
											history.map((h) => (
												<tr key={h.id} className='border-t border-ca-border text-ca-heading'>
													<td className='px-3 py-2 whitespace-nowrap'>
														{MONTH_TABS[h.effective_month - 1]} {h.effective_year}
													</td>
													<td className='px-3 py-2'>
														{fmtDollar(h.old_oylik_dollar)} · {fmtSom(h.old_oylik_som)}
													</td>
													<td className='px-3 py-2'>
														{fmtDollar(h.new_oylik_dollar)} · {fmtSom(h.new_oylik_som)}
													</td>
													<td className='px-3 py-2 whitespace-nowrap'>{fmtDateTime(h.changed_time)}</td>
													<td className='px-3 py-2'>{personName(h.created_by_detail) || '—'}</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					</ModalBody>
					<ModalFooter className='gap-3 px-6 py-4 [&>:first-child:not(:only-child)]:mr-0'>
						<button
							type='button'
							onClick={() => setOpen(false)}
							disabled={mutation.isPending}
							className='h-10 min-w-32 rounded-lg border border-ca-border bg-ca-silver-light px-5 text-sm font-semibold text-ca-heading hover:bg-ca-silver disabled:opacity-60'
						>
							Bekor qilish
						</button>
						<button
							type='submit'
							disabled={mutation.isPending}
							className='inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-lg bg-ca-aqua px-5 text-sm font-semibold text-white hover:bg-[#0595ad] disabled:cursor-not-allowed disabled:opacity-60'
						>
							{mutation.isPending && (
								<span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white' />
							)}
							Saqlash
						</button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}
