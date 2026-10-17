import type { ReactNode } from 'react';
import { FaColumns } from 'react-icons/fa';
import {
	Button,
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	PanelHeaderAction,
} from '@/components/ui';
import type { ColumnVisibilityState } from '@/lib/useColumnVisibility';

/** "Ustunlar" dropdown for hand-built tables — the same control `DataTable` shows with `enableColumnVisibility`. */
export default function ColumnVisibilityMenu({
	state,
	leading,
}: {
	state: ColumnVisibilityState;
	/** Extra controls (e.g. a per-page select) rendered just before the button, in the same header spot. */
	leading?: ReactNode;
}) {
	return (
		<PanelHeaderAction inlineClassName='mb-2 flex items-center justify-end gap-2'>
			{leading}
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type='button' variant='white' size='sm'>
					<FaColumns className='mr-1.5' /> Ustunlar
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='min-w-[180px] p-2'>
				{state.columns
					.filter((col) => col.hideable !== false)
					.map((col) => (
						<Checkbox
							key={col.id}
							inline
							label={col.label}
							checked={state.isVisible(col.id)}
							onCheckedChange={(v) => state.setVisible(col.id, !!v)}
							className='px-2 py-1'
						/>
					))}
			</DropdownMenuContent>
		</DropdownMenu>
		</PanelHeaderAction>
	);
}
