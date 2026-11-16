import { cn } from '@/lib/utils';
import { skladColor } from '@/pages/settings/soldUtils';
import type { SoldSkladCount } from '@/services/sold-history/sold-history.types';

/** Stacked bar of sold counts per sklad, colored by the sklad's index. */
export default function SkladBar({
	sklads,
	total,
	className,
}: {
	sklads: SoldSkladCount[];
	total: number;
	className?: string;
}) {
	return (
		<div className={cn('flex overflow-hidden rounded-full bg-ca-muted', className)}>
			{total > 0 &&
				sklads.map((sklad, i) =>
					sklad.count > 0 ? (
						<div
							key={`${sklad.name}-${i}`}
							title={`${sklad.name}: ${sklad.count}`}
							style={{ width: `${(sklad.count / total) * 100}%`, background: skladColor(i) }}
						/>
					) : null,
				)}
		</div>
	);
}
