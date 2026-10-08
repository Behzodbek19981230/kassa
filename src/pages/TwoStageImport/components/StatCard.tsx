import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const ACCENT_CLASSES = {
	theme: 'bg-ca-theme/10 text-ca-theme',
	warning: 'bg-ca-orange/10 text-ca-orange',
	success: 'bg-ca-green/10 text-ca-green',
	danger: 'bg-ca-red/10 text-ca-red',
} as const;

interface StatCardProps {
	icon: ReactNode;
	label: string;
	value: ReactNode;
	accent?: keyof typeof ACCENT_CLASSES;
}

export default function StatCard({ icon, label, value, accent = 'theme' }: StatCardProps) {
	return (
		<div className='w-full px-2.5 pb-5 sm:w-1/2 xl:w-1/4'>
			<div className='flex h-full items-center gap-3 rounded-[3px] border border-ca-border bg-ca-silver-light p-4'>
				<div
					className={cn(
						'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base',
						ACCENT_CLASSES[accent],
					)}
				>
					{icon}
				</div>
				<div className='min-w-0'>
					<div className='truncate text-[11px] font-medium text-ca-text'>{label}</div>
					<div className='text-xl font-semibold text-ca-heading'>{value}</div>
				</div>
			</div>
		</div>
	);
}
