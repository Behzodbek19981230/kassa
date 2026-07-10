import { FaImage } from 'react-icons/fa';
import { useWarehouseImageListQuery } from '@/services/warehouse-image/warehouse-image.queries';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';

interface WarehouseProductThumbnailProps {
	item: WarehouseAllListItem;
	onClick: () => void;
}

export default function WarehouseProductThumbnail({ item, onClick }: WarehouseProductThumbnailProps) {
	const { data } = useWarehouseImageListQuery({ warehouse: item.id, limit: 100 });
	const thumbnailSrc = data?.results[0]?.image ?? item.image;

	return (
		<button
			type='button'
			onClick={onClick}
			className='block h-9 w-9 overflow-hidden rounded border border-ca-border bg-ca-silver'
			aria-label="Rasmlarni ko'rish"
		>
			{thumbnailSrc ? (
				<img src={thumbnailSrc} alt='' className='h-full w-full object-cover' />
			) : (
				<span className='flex h-full w-full items-center justify-center text-ca-text'>
					<FaImage className='text-xs' />
				</span>
			)}
		</button>
	);
}
