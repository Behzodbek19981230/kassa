import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
	content: ReactNode;
	children: ReactNode;
	className?: string;
	/** Which side of the trigger the bubble opens on. Use 'bottom' near the top of the viewport (e.g. the header), where a 'top' bubble would render off-screen. */
	side?: 'top' | 'bottom';
}

export function Tooltip({ content, children, className, side = 'top' }: TooltipProps) {
	return (
		<span className={cn('group relative inline-flex', className)}>
			{children}
			<span
				role='tooltip'
				className={cn(
					'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-[3px] bg-ca-heading px-2 py-1 text-[11px] whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100',
					side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
				)}
			>
				{content}
				<span
					className={cn(
						'absolute left-1/2 -translate-x-1/2 border-4 border-transparent',
						side === 'top' ? 'top-full border-t-ca-heading' : 'bottom-full border-b-ca-heading',
					)}
				/>
			</span>
		</span>
	);
}
