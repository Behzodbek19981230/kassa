import type { PageHeaderProps } from '@/types';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export function PageHeader({ breadcrumb }: PageHeaderProps) {
	return (
		<div className='mb-0 flex items-center justify-between'>
			<Breadcrumb items={breadcrumb} className='float-left' />
			{/* <h1 className='clear-both mb-5 border-none p-0 text-2xl leading-7 font-medium text-ca-heading'>
				{title} {subtitle && <small className='text-[60%] font-light text-[#7c7f83]'>{subtitle}</small>}
			</h1> */}
		</div>
	);
}
