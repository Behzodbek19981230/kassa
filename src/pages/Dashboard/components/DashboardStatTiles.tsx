import type { ReactNode } from 'react';
import { FaBoxes, FaUserClock, FaUsers, FaUserShield, FaWarehouse } from 'react-icons/fa';
import { formatNumber } from '@/lib/number';
import { cn } from '@/lib/utils';
import type { DashboardCards } from '@/services/dashboard/dashboard.types';

interface Tile {
	key: keyof DashboardCards;
	label: string;
	icon: ReactNode;
	accent: 'theme' | 'red';
}

const TILES: Tile[] = [
	{ key: 'clients_count', label: 'Mijozlar soni', icon: <FaUsers />, accent: 'theme' },
	{ key: 'debtor_clients_count', label: 'Qarzdor mijozlar soni', icon: <FaUserClock />, accent: 'red' },
	{ key: 'warehouse_items_count', label: 'Ombordagi tovarlar', icon: <FaWarehouse />, accent: 'theme' },
	{ key: 'users_count', label: 'Foydalanuvchilar soni', icon: <FaUserShield />, accent: 'theme' },
];

const accentClasses = {
	theme: { badge: 'bg-ca-theme/10 text-ca-theme', value: 'text-ca-heading' },
	red: { badge: 'bg-ca-red/10 text-ca-red', value: 'text-ca-red' },
} as const;

interface DashboardStatTilesProps {
	cards?: DashboardCards;
	isLoading: boolean;
}

export default function DashboardStatTiles({ cards, isLoading }: DashboardStatTilesProps) {
	return (
		<div className='-mx-2.5 flex flex-wrap'>
			{TILES.map((tile) => {
				const accent = accentClasses[tile.accent];
				const value = cards ? formatNumber(cards[tile.key]) : undefined;
				return (
					<div key={tile.key} className='w-full px-2.5 pb-5 sm:w-1/2 lg:w-1/4'>
						<div className='flex h-full items-center gap-3 rounded-[3px] border border-ca-border bg-white p-4'>
							<div
								className={cn(
									'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base',
									accent.badge,
								)}
							>
								{tile.icon}
							</div>
							<div className='min-w-0'>
								<div className='truncate text-[11px] font-medium text-ca-text'>{tile.label}</div>
								<div className={cn('text-2xl font-semibold', accent.value)}>
									{isLoading ? (
										<span className='inline-block h-6 w-14 animate-pulse rounded bg-ca-silver' />
									) : (
										(value ?? '—')
									)}
								</div>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
