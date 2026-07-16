import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
	content: ReactNode;
	children: ReactNode;
	className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
	return (
		<span className={cn('group relative inline-flex', className)}>
			{children}
			<span
				role='tooltip'
				className='pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 rounded-[3px] bg-ca-heading px-2 py-1 text-[11px] whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100'
			>
				{content}
				<span className='absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ca-heading' />
			</span>
		</span>
	);
}
