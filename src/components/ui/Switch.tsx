import { cn } from '@/lib/utils';

interface SwitchProps {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
	id?: string;
	className?: string;
}

export function Switch({ checked, onCheckedChange, disabled, id, className }: SwitchProps) {
	return (
		<button
			type='button'
			role='switch'
			id={id}
			aria-checked={checked}
			disabled={disabled}
			onClick={() => onCheckedChange(!checked)}
			className={cn(
				'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
				checked ? 'bg-ca-theme' : 'bg-ca-border',
				disabled && 'cursor-not-allowed opacity-60',
				className,
			)}
		>
			<span
				className={cn(
					'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
					checked ? 'translate-x-6' : 'translate-x-1',
				)}
			/>
		</button>
	);
}
