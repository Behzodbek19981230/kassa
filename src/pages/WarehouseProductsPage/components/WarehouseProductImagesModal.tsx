import { useState } from 'react';
import { FaImages, FaSpinner } from 'react-icons/fa';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/ui';
import { useWarehouseImageListQuery } from '@/services/warehouse-image/warehouse-image.queries';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';

interface WarehouseProductImagesModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: WarehouseAllListItem;
}

export default function WarehouseProductImagesModal({ open, setOpen, item }: WarehouseProductImagesModalProps) {
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

	const { data, isLoading, isFetching } = useWarehouseImageListQuery({ warehouse: item.id, limit: 100 });
	const galleryImages = (data?.results ?? []).map((img) => img.image);
	const images = galleryImages.length > 0 ? galleryImages : item.image ? [item.image] : [];
	const slides = images.map((src) => ({ src }));

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-4xl'>
				<ModalHeader>
					<ModalTitle>Tovar rasmlari</ModalTitle>
					<p className='mt-0.5 text-[11px] font-normal text-ca-text'>
						{item.brand_name} &middot; {item.product_category_name} &middot; {images.length} ta rasm
					</p>
				</ModalHeader>
				<ModalBody>
					{isLoading || isFetching ? (
						<div className='flex items-center justify-center gap-2 py-10 text-ca-text'>
							<FaSpinner className='animate-spin' /> Yuklanmoqda...
						</div>
					) : images.length === 0 ? (
						<div className='flex flex-col items-center gap-2 py-10 text-ca-text'>
							<FaImages className='text-3xl text-ca-border' />
							<p>Rasmlar mavjud emas</p>
						</div>
					) : (
						<div className='grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5'>
							{images.map((src, idx) => (
								<div
									key={src + idx}
									className='group relative aspect-square overflow-hidden rounded-lg border border-ca-border bg-ca-silver shadow-sm transition-shadow hover:shadow-md'
								>
									<img
										src={src}
										alt='Tovar rasmi'
										onClick={() => setLightboxIndex(idx)}
										className='h-full w-full cursor-zoom-in object-cover transition-transform duration-200 group-hover:scale-105'
									/>
								</div>
							))}
						</div>
					)}
				</ModalBody>
			</ModalContent>

			<Lightbox
				open={lightboxIndex !== null}
				close={() => setLightboxIndex(null)}
				index={lightboxIndex ?? 0}
				slides={slides}
				plugins={[Fullscreen, Slideshow, Thumbnails, Zoom]}
				on={{ view: ({ index }) => setLightboxIndex(index) }}
				zoom={{ maxZoomPixelRatio: 4, zoomInMultiplier: 2 }}
			/>
		</Modal>
	);
}
