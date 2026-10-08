import { FaImage } from 'react-icons/fa';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';

interface WarehouseProductThumbnailProps {
	item: WarehouseAllListItem;
	onClick: () => void;
}

// The thumbnail shows the image already in the product list, so the table makes no request per row.
// The full gallery is requested only after a click, when WarehouseProductImagesModal mounts.
export default function WarehouseProductThumbnail({ item, onClick }: WarehouseProductThumbnailProps) {
	const thumbnailSrc = item.image;

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
