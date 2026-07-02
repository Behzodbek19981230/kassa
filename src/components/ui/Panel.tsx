import { FaCompress, FaExpand, FaMinus, FaRedo, FaTimes } from 'react-icons/fa';
import type { PanelProps } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useRef, useState } from 'react';

export function Panel({
	title,
	children,
	actions,
	toolbar,
	footer,
	className = '',
	bodyClassName = '',
	onReload,
}: PanelProps) {
	const [collapsed, setCollapsed] = useState(false);
	const [expanded, setExpanded] = useState(false);
	const itemRef = useRef<HTMLDivElement>(null);
	const onExpand = () => setExpanded((e) => !e);

	const onRemoveClick = () => {
		if (itemRef.current) {
			itemRef.current.remove();
		}
	};

	return (
		<div
			className={cn(
				'mb-5 overflow-hidden rounded-[3px] bg-white shadow-none',
				expanded && 'fixed inset-0 z-1040 m-0 overflow-y-auto rounded-none',
				className,
			)}
			ref={itemRef}
		>
			<div className='flex items-center bg-ca-panel-inverse px-[15px] py-[10px] text-white'>
				<div className='order-2 ml-auto flex items-center gap-2'>
					{actions}
					<Button
						variant='default'
						size='icon-xs'
						type='button'
						aria-label={expanded ? 'Collapse to normal size' : 'Expand panel'}
						onClick={onExpand}
					>
						{expanded ? <FaCompress /> : <FaExpand />}
					</Button>
					<Button variant='success' size='icon-xs' type='button' aria-label='Reload panel' onClick={onReload}>
						<FaRedo />
					</Button>
					<Button
						variant='warning'
						size='icon-xs'
						type='button'
						aria-label='Collapse panel'
						onClick={() => setCollapsed((c) => !c)}
					>
						<FaMinus />
					</Button>
					<Button
						variant='danger'
						size='icon-xs'
						type='button'
						aria-label='Remove panel'
						onClick={onRemoveClick}
					>
						<FaTimes />
					</Button>
				</div>
				<h4 className='order-1 flex-1 text-xs leading-5 font-normal'>{title}</h4>
			</div>
			{toolbar && !collapsed && (
				<div className='border-t border-ca-border bg-white px-[15px] py-[10px]'>{toolbar}</div>
			)}
			{!collapsed && <div className={cn('p-[15px]', bodyClassName)}>{children}</div>}
			{footer && !collapsed && (
				<div className='border-t border-ca-border bg-white px-[15px] py-[14px]'>{footer}</div>
			)}
		</div>
	);
}
