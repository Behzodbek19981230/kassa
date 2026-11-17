import type { ReactNode } from 'react';
import { FaWifi } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { paymentCardTypeLabel, type PaymentCard } from '@/services/payment-card/payment-card.types';

/** What a card picture needs; the form preview passes unsaved values. */
export type CardLike = Pick<PaymentCard, 'name' | 'card_type' | 'last4' | 'is_active'> &
	Partial<Pick<PaymentCard, 'card_type_display' | 'owner_name' | 'bank'>>;

const CARD_GRADIENTS: Record<string, string> = {
	uzcard: 'from-[#0b2a6f] via-[#1d4ed8] to-[#38bdf8]',
	humo: 'from-[#032f2a] via-[#0f766e] to-[#2dd4bf]',
	visa: 'from-[#110d45] via-[#2a2580] to-[#6d5dfc]',
	mastercard: 'from-[#0c0c0c] via-[#2b2b2b] to-[#5b4636]',
};
const FALLBACK_GRADIENT = 'from-slate-800 via-slate-700 to-slate-500';

/** The network's name in the card's top-right corner. */
function BrandMark({ card, small = false }: { card: CardLike; small?: boolean }) {
	if (card.card_type === 'mastercard') {
		const circle = small ? 'h-2.5 w-2.5' : 'h-7 w-7';
		return (
			<span className='flex items-center' aria-label='Mastercard'>
				<span className={cn(circle, 'rounded-full bg-[#eb001b]')} />
				<span className={cn(circle, small ? '-ml-1' : '-ml-3', 'rounded-full bg-[#f79e1b]/90')} />
			</span>
		);
	}
	const styles: Record<string, string> = {
		uzcard: 'font-black tracking-wide',
		humo: 'font-black italic tracking-widest',
		visa: 'font-black italic tracking-tight',
	};
	return (
		<span
			className={cn(
				'leading-none uppercase drop-shadow-sm',
				styles[card.card_type] ?? 'font-bold',
				small ? 'text-[7px]' : card.card_type === 'visa' ? 'text-2xl' : 'text-lg',
			)}
		>
			{paymentCardTypeLabel(card)}
		</span>
	);
}

function Chip({ className }: { className?: string }) {
	return (
		<span
			aria-hidden
			className={cn(
				'relative block shrink-0 overflow-hidden rounded-[5px] bg-linear-to-br from-[#f8e9a8] via-[#d4af37] to-[#9c7a1c] shadow-inner',
				className,
			)}
		>
			<span className='absolute inset-x-0 top-1/3 h-px bg-black/25' />
			<span className='absolute inset-x-0 top-2/3 h-px bg-black/25' />
			<span className='absolute inset-y-0 left-1/2 w-px bg-black/25' />
			<span className='absolute top-1/2 left-1/2 h-1/2 w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-black/25 bg-[#e6c75a]' />
		</span>
	);
}

/** Gradient, glow and sheen shared by the large and the small card. */
function CardSurface({ card, className, children }: { card: CardLike; className?: string; children: ReactNode }) {
	return (
		<div
			className={cn(
				'relative isolate overflow-hidden bg-linear-to-br text-white shadow-lg ring-1 ring-black/10',
				CARD_GRADIENTS[card.card_type] ?? FALLBACK_GRADIENT,
				!card.is_active && 'opacity-80 grayscale',
				className,
			)}
		>
			<span aria-hidden className='absolute -top-1/3 -right-1/5 -z-10 aspect-square w-3/5 rounded-full bg-white/10' />
			<span aria-hidden className='absolute -bottom-1/2 -left-1/5 -z-10 aspect-square w-3/5 rounded-full bg-white/5' />
			<span
				aria-hidden
				className='absolute inset-0 -z-10 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.14)_50%,transparent_65%)]'
			/>
			{children}
		</div>
	);
}

/** A full-size card picture: network, chip, masked number, holder and bank. */
export function PaymentCardVisual({ card, className }: { card: CardLike; className?: string }) {
	return (
		<CardSurface card={card} className={cn('aspect-[1.586/1] w-full max-w-[340px] rounded-2xl p-5', className)}>
			<div className='flex h-full flex-col'>
				<div className='flex items-start justify-between gap-3'>
					<div className='min-w-0'>
						<div className='truncate text-sm font-semibold'>{card.name || 'Karta nomi'}</div>
						{card.bank && <div className='truncate text-[11px] text-white/70'>{card.bank}</div>}
					</div>
					<BrandMark card={card} />
				</div>

				<div className='mt-auto flex items-center gap-2'>
					<Chip className='h-7 w-10' />
					<FaWifi aria-hidden className='rotate-90 text-xl text-white/80' />
				</div>

				<div className='mt-3 font-mono text-lg tracking-[0.14em] whitespace-nowrap drop-shadow-sm'>
					•••• •••• •••• {card.last4 || '••••'}
				</div>

				<div className='mt-3 flex items-end justify-between gap-3'>
					<div className='min-w-0'>
						<div className='text-[9px] tracking-widest text-white/60 uppercase'>Karta egasi</div>
						<div className='truncate text-sm font-semibold tracking-wide uppercase'>{card.owner_name || '—'}</div>
					</div>
					{!card.is_active && (
						<span className='shrink-0 rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase'>
							Nofaol
						</span>
					)}
				</div>
			</div>
		</CardSurface>
	);
}

/** A thumbnail of the card for table rows. */
export function MiniCard({ card, className }: { card: CardLike; className?: string }) {
	return (
		<CardSurface card={card} className={cn('h-10 w-16 shrink-0 rounded-md p-1 shadow-md', className)}>
			<div className='flex h-full flex-col justify-between'>
				<div className='flex justify-end'>
					<BrandMark card={card} small />
				</div>
				<Chip className='h-2 w-2.5 rounded-[2px]' />
				<div className='font-mono text-[8px] leading-none tracking-wide'>•• {card.last4}</div>
			</div>
		</CardSurface>
	);
}

/** "Humo •• 8810" over the card's name, next to its thumbnail. */
export default function CardIdentity({ card }: { card: PaymentCard }) {
	return (
		<div className='flex min-w-0 items-center gap-3'>
			<MiniCard card={card} />
			<div className='min-w-0'>
				<div className='text-sm font-bold whitespace-nowrap text-ca-heading'>
					{paymentCardTypeLabel(card)} •• {card.last4}
				</div>
				<div className='truncate text-xs text-ca-text'>{card.name}</div>
			</div>
		</div>
	);
}

/** "Faol" / "Nofaol" pill. */
export function CardStatusPill({ active }: { active: boolean }) {
	return (
		<span
			className={cn(
				'inline-flex rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
				active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-ca-text',
			)}
		>
			{active ? 'Faol' : 'Nofaol'}
		</span>
	);
}
