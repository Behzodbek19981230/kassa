import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { FaCheck, FaClock, FaDatabase, FaGavel, FaGift, FaInfoCircle, FaWallet } from 'react-icons/fa';
import {
	DatePicker,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	PriceInput,
	Textarea,
	useNotification,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { formatNumber } from '@/lib/number';
import { cn } from '@/lib/utils';
import { nowTashkentLocal, toApiDateTime } from '@/pages/TwoStageImport/utils';
import {
	apiFieldErrors,
	fmtDollar,
	fmtMixed,
	fmtSom,
	toMoneyString,
	toNumber,
	useTransactionKey,
} from '@/pages/system/UserPayrollPage/utils';
import { useCreatePayrollTransactionMutation } from '@/services/payroll/payroll.queries';
import type { PayrollSummaryTotals, PayrollTransactionType } from '@/services/payroll/payroll.types';

const FIELDS = [
	'transaction_type',
	'transaction_time',
	'summa_dollar',
	'summa_som',
	'summa_karta',
	'all_summa_dollar',
	'note',
	'transaction_key',
] as const;
type FieldName = (typeof FIELDS)[number];
type FieldErrors = Partial<Record<FieldName | 'date' | 'time' | 'form', string>>;

interface FormState {
	type: PayrollTransactionType;
	date: string;
	time: string;
	summa_dollar: string;
	summa_som: string;
	summa_karta: string;
	note: string;
}

function emptyForm(type: PayrollTransactionType = 'SALARY'): FormState {
	const [date, time] = nowTashkentLocal().split('T');
	return { type, date, time, summa_dollar: '', summa_som: '', summa_karta: '', note: '' };
}

const TABS: {
	type: PayrollTransactionType;
	label: string;
	icon: ReactNode;
	active: string;
	idle: string;
	info: ReactNode;
	infoClass: string;
}[] = [
	{
		type: 'SALARY',
		label: "Oylik to'lov",
		icon: <FaCheck />,
		active: 'border-ca-theme bg-ca-theme text-white',
		idle: 'border-ca-theme/50 text-ca-theme hover:bg-ca-theme/10',
		info: (
			<>
				<b>Oylik to'lov</b> — oylik maoshdan to'lov.
			</>
		),
		infoClass: 'border-ca-theme/40 bg-ca-theme/10 [&_svg]:text-ca-theme',
	},
	{
		type: 'BONUS',
		label: 'Bonus',
		icon: <FaGift />,
		active: 'border-amber-500 bg-amber-500 text-white',
		idle: 'border-amber-500/50 text-amber-500 hover:bg-amber-500/10',
		info: (
			<>
				<b>Bonus</b> — oylikdan tashqari alohida pul, oylik qoldig'iga ta'sir qilmaydi.
			</>
		),
		infoClass: 'border-amber-500/40 bg-amber-500/10 [&_svg]:text-amber-500',
	},
	{
		type: 'PENALTY',
		label: 'Jarima',
		icon: <FaGavel />,
		active: 'border-red-500 bg-red-500 text-white',
		idle: 'border-red-500/50 text-red-500 hover:bg-red-500/10',
		info: (
			<>
				<b>Jarima</b> — faqat dollar va so'm kiritiladi, miqdorlar oylik maoshdan ayiriladi (karta o'chiriladi).
			</>
		),
		infoClass: 'border-red-500/40 bg-red-500/10 [&_svg]:text-red-500',
	},
];

const NOTE_PLACEHOLDER: Record<PayrollTransactionType, string> = {
	SALARY: 'Masalan: Noyabr oyligi — qisman to‘lov',
	BONUS: 'Masalan: Reja ortig‘i uchun bonus',
	PENALTY: 'Masalan: Ishga kechikish',
};

function Field({
	label,
	required,
	error,
	children,
	className,
}: {
	label: string;
	required?: boolean;
	error?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={className}>
			<label className='mb-1.5 block text-sm font-semibold text-ca-heading'>
				{label}
				{required && <span className='ml-0.5 text-ca-red'>*</span>}
			</label>
			{children}
			{error && <p className='mt-1 text-[11px] text-ca-red'>{error}</p>}
		</div>
	);
}

interface PayrollActionModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	userId: number;
	year: number;
	month: number;
	/** The backend's totals for `year`/`month`; used for the quick checks and the "qoladi" line. */
	summary?: PayrollSummaryTotals;
}

/** "Oylik amali": salary payment, bonus or penalty for one employee and month. */
export default function PayrollActionModal({ open, setOpen, userId, year, month, summary }: PayrollActionModalProps) {
	const { notify } = useNotification();
	const { exchangeRate } = useCurrentCompany();
	const mutation = useCreatePayrollTransactionMutation();
	const transactionKey = useTransactionKey();
	const [form, setForm] = useState<FormState>(() => emptyForm());
	const [errors, setErrors] = useState<FieldErrors>({});

	// Every opening is a new operation: fresh form, fresh UUID.
	useEffect(() => {
		if (open) {
			setForm(emptyForm());
			setErrors({});
			transactionKey.reset();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const isPenalty = form.type === 'PENALTY';
	const isBonus = form.type === 'BONUS';
	const dollar = toNumber(form.summa_dollar);
	const som = toNumber(form.summa_som);
	const card = isPenalty ? 0 : toNumber(form.summa_karta);
	// So'm and card amounts converted at today's rate; 0 when the rate isn't set yet.
	const dollarRate = toNumber(exchangeRate?.dollar);
	const allDollar = dollarRate > 0 ? Math.round((dollar + (som + card) / dollarRate) * 100) / 100 : dollar;
	const remainingDollar = toNumber(summary?.remaining_dollar);
	const remainingSom = toNumber(summary?.remaining_som);
	const afterDollar = isBonus ? remainingDollar : remainingDollar - dollar;
	const afterSom = isBonus ? remainingSom : remainingSom - som - card;

	const update = <K extends keyof FormState>(field: K) => (value: FormState[K]) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
	};

	const setType = (type: PayrollTransactionType) => {
		setForm((prev) => ({ ...prev, type, summa_karta: type === 'PENALTY' ? '' : prev.summa_karta }));
		setErrors({});
	};

	function validate(): FieldErrors {
		const next: FieldErrors = {};
		if (!form.date) next.date = 'Sana kiritilishi shart';
		if (!/^\d{2}:\d{2}$/.test(form.time)) next.time = 'Vaqt kiritilishi shart';
		if (dollar < 0) next.summa_dollar = "Summa manfiy bo'lmasin";
		if (som < 0) next.summa_som = "Summa manfiy bo'lmasin";
		if (card < 0) next.summa_karta = "Summa manfiy bo'lmasin";
		if (dollar <= 0 && som <= 0 && card <= 0) next.summa_dollar = "Kamida bitta summa 0 dan katta bo'lishi kerak";
		if (!isBonus && summary) {
			const what = isPenalty ? 'Jarima' : "To'lov";
			if (dollar > remainingDollar) next.summa_dollar = `${what} oylik qoldig'idan oshmasin: ${fmtDollar(remainingDollar)}`;
			if (som + card > remainingSom) next.summa_som = `${what} oylik qoldig'idan oshmasin: ${fmtSom(remainingSom)}`;
		}
		if (form.type !== 'SALARY' && !form.note.trim()) next.note = 'Izoh kiritilishi shart';
		return next;
	}

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (mutation.isPending) return;
		const found = validate();
		setErrors(found);
		if (Object.values(found).some(Boolean)) return;

		const contents = {
			user: userId,
			year,
			month,
			transaction_type: form.type,
			summa_dollar: toMoneyString(dollar),
			summa_som: toMoneyString(som),
			summa_karta: toMoneyString(card),
			all_summa_dollar: toMoneyString(allDollar),
			transaction_time: toApiDateTime(`${form.date}T${form.time}`),
			note: form.note.trim(),
		};

		try {
			await mutation.mutateAsync({ ...contents, transaction_key: transactionKey.keyFor(contents) });
			transactionKey.reset();
			notify({ title: `${TABS.find((t) => t.type === form.type)?.label} saqlandi` });
			setOpen(false);
		} catch (err) {
			const mapped: FieldErrors = apiFieldErrors(err, FIELDS);
			if (mapped.transaction_time) {
				mapped.date = mapped.transaction_time;
				delete mapped.transaction_time;
			}
			if (mapped.transaction_key || mapped.transaction_type) {
				mapped.form = [mapped.form, mapped.transaction_key, mapped.transaction_type].filter(Boolean).join(' ');
				delete mapped.transaction_key;
				delete mapped.transaction_type;
			}
			setErrors(mapped);
		}
	};

	return (
		<Modal open={open} onOpenChange={(next) => !mutation.isPending && setOpen(next)}>
			<ModalContent className='max-w-[640px] rounded-xl'>
				<form onSubmit={onSubmit} noValidate>
					<ModalHeader className='px-6 py-5'>
						<ModalTitle className='text-xl font-bold'>Oylik amali</ModalTitle>
					</ModalHeader>
					<ModalBody className='space-y-4 px-6 py-5'>
						<div role='radiogroup' className='grid grid-cols-3 overflow-hidden rounded-lg'>
							{TABS.map((tab, i) => {
								const active = form.type === tab.type;
								return (
									<button
										key={tab.type}
										type='button'
										role='radio'
										aria-checked={active}
										onClick={() => setType(tab.type)}
										className={cn(
											'flex h-11 items-center justify-center gap-2 border text-sm font-semibold transition-colors',
											i === 0 && 'rounded-l-lg',
											i === TABS.length - 1 && 'rounded-r-lg',
											active ? tab.active : tab.idle,
										)}
									>
										{tab.icon}
										{tab.label}
									</button>
								);
							})}
						</div>

						<div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
							{TABS.map((tab) => (
								<div
									key={tab.type}
									className={cn(
										'flex gap-2 rounded-lg border px-3 py-2.5 text-[11px] leading-relaxed text-ca-heading transition-opacity',
										tab.infoClass,
										form.type !== tab.type && 'opacity-45',
									)}
								>
									<FaInfoCircle className='mt-0.5 shrink-0 text-sm' />
									<span>{tab.info}</span>
								</div>
							))}
						</div>

						{errors.form && (
							<div className='rounded-lg border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{errors.form}
							</div>
						)}

						<div className='grid grid-cols-2 gap-4'>
							<Field label='Sana' required error={errors.date}>
								<DatePicker value={form.date} onChange={update('date')} />
							</Field>
							<Field label='Vaqt' required error={errors.time}>
								<div className='relative'>
									<FaClock className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ca-text' />
									<Input
										type='time'
										value={form.time}
										onChange={(e) => update('time')(e.target.value)}
										className='pl-9'
									/>
								</div>
							</Field>
						</div>

						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							<Field label='All summa dollar' error={errors.all_summa_dollar}>
								<PriceInput value={allDollar ? String(allDollar) : ''} placeholder='0' disabled readOnly />
								<p className='mt-1 text-[11px] text-ca-text'>
									{dollarRate > 0
										? `Avtomatik: 1 $ = ${formatNumber(dollarRate)} so'm`
										: "Bugungi kurs kiritilmagan — so'm hisobga olinmaydi"}
								</p>
							</Field>
							<Field label='Summa dollar' required error={errors.summa_dollar}>
								<PriceInput value={form.summa_dollar} onChange={update('summa_dollar')} placeholder='0' />
							</Field>
							<Field label="Summa so'm" required error={errors.summa_som}>
								<PriceInput value={form.summa_som} onChange={update('summa_som')} placeholder='0' />
							</Field>
							<Field label='Summa karta' required={!isPenalty} error={errors.summa_karta}>
								<PriceInput
									value={isPenalty ? '' : form.summa_karta}
									onChange={update('summa_karta')}
									placeholder={isPenalty ? 'Jarimada karta yo‘q' : '0'}
									disabled={isPenalty}
								/>
							</Field>
						</div>

						<Field label='Izoh' required={form.type !== 'SALARY'} error={errors.note}>
							<Textarea
								rows={3}
								value={form.note}
								onChange={(e) => update('note')(e.target.value)}
								placeholder={NOTE_PLACEHOLDER[form.type]}
							/>
						</Field>

						<div className='flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-ca-border bg-ca-silver px-4 py-3 text-sm font-semibold text-ca-heading'>
							<span className='flex items-center gap-2'>
								<FaDatabase className='text-ca-theme' />
								Jami: {fmtMixed(dollar, som + card, '0')}
							</span>
							<span className='hidden h-5 w-px bg-ca-border sm:block' />
							<span className='flex items-center gap-2'>
								<FaWallet className='text-ca-theme' />
								{isBonus
									? `Oylik qoldig'i o'zgarmaydi: ${fmtMixed(afterDollar, afterSom, '0')}`
									: `${isPenalty ? 'Jarimadan' : "To'lovdan"} keyin qoladi: ${fmtMixed(afterDollar, afterSom, '0')}`}
							</span>
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
