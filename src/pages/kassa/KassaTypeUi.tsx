import type { ReactNode } from 'react';
import { Panel } from '@/components/ui';
import { cn } from '@/lib/utils';
import { closingTypeLabel, KASSA_TYPES, kassaTypeInfo, useKassaType, type KassaTypeState } from '@/pages/kassa/kassaType';
import { ErrorBox, PanelTitle } from '@/pages/kassa/shared';
import type { CashRegisterType } from '@/services/cash-register/cash-register.types';

/**
 * Resolves the kassa type and renders the page with it; a user with no seller type gets an explanation
 * instead (every record lands in its creator's type, so there is no kassa to show them).
 */
export function KassaTypeBoundary({ title, children }: { title: string; children: (kassa: KassaTypeState) => ReactNode }) {
	const { state, loading } = useKassaType();
	if (loading) return null;
	if (!state) {
		return (
			<Panel title={<PanelTitle title={title} />}>
				<ErrorBox>
					Sizga xodim turi (Do'kon, Sklad yoki Dastavka sotuvchisi) belgilanmagan, shuning uchun kassa yo'q. Turni
					"Hodimlar" sahifasida belgilang.
				</ErrorBox>
			</Panel>
		);
	}
	return <>{children(state)}</>;
}

/** Small outlined label with the type's colour: "● Dastavka sotuvchisi"; `null` = a pre-split company closing. */
export function KassaTypeBadge({
	type,
	short = false,
	className,
}: {
	type: CashRegisterType | null;
	short?: boolean;
	className?: string;
}) {
	const info = type === null ? null : kassaTypeInfo(type);
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-0.5 text-[11px] leading-4 font-semibold whitespace-nowrap',
				info ? cn(info.border, info.text) : 'border-slate-400 text-slate-400',
				className,
			)}
		>
			<span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', info ? info.dot : 'bg-slate-400')} />
			{closingTypeLabel(type, short)}
		</span>
	);
}

/**
 * Segmented "Kassa turi" switcher: ● Do'kon $ 2 680.00 | ● Sklad … | ● Dastavka …
 * `value(type)` is the figure next to each name (the balance, or a record count).
 */
export function KassaTypeSwitcher({
	type,
	onChange,
	value,
	className,
}: {
	type: CashRegisterType;
	onChange: (type: CashRegisterType) => void;
	value?: (type: CashRegisterType) => ReactNode;
	className?: string;
}) {
	return (
		<div
			role='group'
			aria-label='Kassa turi'
			className={cn('flex max-w-full overflow-x-auto rounded-[3px] border border-ca-border sm:w-max', className)}
		>
			{KASSA_TYPES.map((t) => {
				const active = t.type === type;
				const figure = value?.(t.type);
				return (
					<button
						key={t.type}
						type='button'
						aria-pressed={active}
						onClick={() => !active && onChange(t.type)}
						className={cn(
							'flex shrink-0 items-center gap-2 border-r border-ca-border px-4 py-2 text-sm whitespace-nowrap text-ca-text transition-colors last:border-r-0',
							active ? cn('bg-ca-silver text-ca-heading', t.underline) : 'hover:bg-ca-silver/60',
						)}
					>
						<span className={cn('h-2 w-2 shrink-0 rounded-full', t.dot)} />
						{t.short}
						{figure !== undefined && figure !== null && (
							<b className='font-bold text-ca-heading tabular-nums'>{figure}</b>
						)}
					</button>
				);
			})}
		</div>
	);
}
