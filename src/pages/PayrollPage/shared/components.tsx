import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import {
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import {
	ADJUSTMENT_META,
	monthOptions,
	personName,
	STATUS_META,
	toMonthValue,
	fromMonthValue,
	type YearMonth,
} from '@/pages/PayrollPage/shared/utils';
import type { PayrollCreatorDetail, SalaryAdjustmentType, SalaryPeriodStatus } from '@/services/payroll/payroll.types';
import { useUserQuery } from '@/services/user/user.queries';
import { userService } from '@/services/user/user.service';

export function MonthSelect({
	value,
	onChange,
	suffix = '',
	disabled,
}: {
	value: YearMonth;
	onChange: (next: YearMonth) => void;
	/** Appended to each label, e.g. " oyligi". */
	suffix?: string;
	disabled?: boolean;
}) {
	const options = monthOptions();
	const current = toMonthValue(value);
	if (!options.some((o) => o.value === current)) {
		options.push({ value: current, label: `${value.year} / ${value.month}` });
	}

	return (
		<Select
			value={current}
			onValueChange={(next) => {
				const parsed = fromMonthValue(next);
				if (parsed) onChange(parsed);
			}}
			disabled={disabled}
		>
			<SelectTrigger>
				<SelectValue placeholder='Oyni tanlang' />
			</SelectTrigger>
			<SelectContent>
				{options.map((o) => (
					<SelectItem key={o.value} value={o.value}>
						{o.label}
						{suffix}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

async function loadEmployeeOptions({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> {
	const result = await userService.list({ search: search || undefined, page, limit: 20 });
	return {
		options: result.results.map((u) => ({ value: String(u.id), label: personName(u) })),
		hasMore: result.pagination.currentPage < result.pagination.lastPage,
	};
}

export function EmployeeSelect({
	value,
	onChange,
	disabled,
}: {
	value?: number;
	onChange: (id: number | undefined) => void;
	disabled?: boolean;
}) {
	const { data: user } = useUserQuery(value);
	return (
		<Combobox
			value={value ? String(value) : ''}
			onChange={(next) => onChange(next ? Number(next) : undefined)}
			loadOptions={loadEmployeeOptions}
			selectedLabel={user ? personName(user) : undefined}
			placeholder='Xodimni tanlang'
			searchPlaceholder='Xodim qidirish...'
			disabled={disabled}
		/>
	);
}

export function StatusBadge({ status }: { status: SalaryPeriodStatus | null | undefined }) {
	const meta = STATUS_META[status ?? 'NONE'];
	return (
		<span
			className={cn(
				'inline-flex min-w-[76px] items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap',
				meta.className,
			)}
		>
			{meta.label}
		</span>
	);
}

export function AdjustmentBadge({ type }: { type: SalaryAdjustmentType }) {
	const meta = ADJUSTMENT_META[type];
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold whitespace-nowrap',
				meta?.className,
			)}
		>
			{meta?.label ?? type}
		</span>
	);
}

/** "Kim kiritgan": the creator's name, from the embedded detail or looked up by id. */
export function CreatorName({ id, detail }: { id?: number | null; detail?: PayrollCreatorDetail | null }) {
	const { data } = useUserQuery(detail || id == null ? undefined : id);
	const name = personName(detail ?? data);
	return <>{name || (id != null ? `#${id}` : '—')}</>;
}

export function PageTitle({
	icon,
	title,
	subtitle,
	back = false,
	backTo = '/payroll/employees',
	actions,
}: {
	icon?: ReactNode;
	title: ReactNode;
	subtitle?: ReactNode;
	back?: boolean;
	/** Where "Orqaga" goes when there is no previous page to return to. */
	backTo?: string;
	actions?: ReactNode;
}) {
	const navigate = useNavigate();
	const location = useLocation();
	return (
		<div className='mb-5 flex flex-wrap items-center gap-3'>
			{back && (
				<button
					type='button'
					aria-label='Orqaga'
					// Opened directly (no in-app history): fall back to the payroll list.
					onClick={() => (location.key === 'default' ? navigate(backTo) : navigate(-1))}
					className='flex h-10 items-center gap-2 rounded-lg border border-ca-border bg-ca-silver-light px-3 text-xs font-semibold text-ca-heading shadow-sm hover:bg-ca-silver'
				>
					<FaArrowLeft /> Orqaga
				</button>
			)}
			{icon && (
				<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'>
					{icon}
				</div>
			)}
			<div className='min-w-0 flex-1'>
				<h1 className='text-xl font-bold text-ca-heading'>{title}</h1>
				{subtitle && <p className='mt-0.5 text-xs text-ca-text'>{subtitle}</p>}
			</div>
			{actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
		</div>
	);
}

export function SectionTitle({ icon, children, actions }: { icon?: ReactNode; children: ReactNode; actions?: ReactNode }) {
	return (
		<div className='mb-3 flex flex-wrap items-center gap-2'>
			{icon && <span className='text-lg text-emerald-600 dark:text-emerald-400'>{icon}</span>}
			<h2 className='flex-1 text-base font-bold text-ca-heading'>{children}</h2>
			{actions}
		</div>
	);
}

/** Green primary action button used across the payroll designs. */
export function GreenButton({
	className,
	children,
	loading,
	disabled,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
	return (
		<button
			{...props}
			disabled={disabled || loading}
			className={cn(
				'inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60',
				className,
			)}
		>
			{loading && (
				<span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white' />
			)}
			{children}
		</button>
	);
}

export function OutlineButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...props}
			className={cn(
				'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-ca-border bg-ca-silver-light px-4 text-xs font-semibold text-ca-heading shadow-sm transition-colors hover:bg-ca-silver disabled:cursor-not-allowed disabled:opacity-60',
				className,
			)}
		>
			{children}
		</button>
	);
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
	return (
		<div>
			<label className='mb-1.5 block text-sm font-semibold text-ca-heading'>{label}</label>
			{children}
			{error && <p className='mt-1 text-[11px] text-ca-red'>{error}</p>}
		</div>
	);
}
