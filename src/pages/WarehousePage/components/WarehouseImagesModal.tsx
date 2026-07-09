import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaImages, FaSpinner, FaTrash } from 'react-icons/fa';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle, useNotification } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
	useCreateWarehouseImageMutation,
	useDeleteWarehouseImageMutation,
	useWarehouseImageListQuery,
} from '@/services/warehouse-image/warehouse-image.queries';
import type { Warehouse } from '@/services/warehouse/warehouse.types';

interface WarehouseImagesModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: Warehouse;
}

export default function WarehouseImagesModal({ open, setOpen, item }: WarehouseImagesModalProps) {
	const { notify } = useNotification();
	const [isUploading, setIsUploading] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

	const { data, isLoading, isFetching } = useWarehouseImageListQuery({ warehouse: item.id, limit: 100 });
	const images = data?.results ?? [];
	const slides = images.map((img) => ({ src: img.image }));

	const createMutation = useCreateWarehouseImageMutation();
	const deleteMutation = useDeleteWarehouseImageMutation();

	const uploadFiles = useCallback(
		async (files: File[]) => {
			if (files.length === 0) return;
			setIsUploading(true);
			try {
				for (const file of files) {
					await createMutation.mutateAsync({ warehouseId: item.id, image: file });
				}
				notify({ title: files.length > 1 ? "Rasmlar qo'shildi" : "Rasm qo'shildi" });
			} catch {
				notify({ title: 'Rasm yuklashda xatolik yuz berdi' });
			} finally {
				setIsUploading(false);
			}
		},
		[createMutation, item.id, notify],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		accept: { 'image/*': [] },
		multiple: true,
		onDrop: uploadFiles,
	});

	const handleDelete = async (id: number) => {
		setDeletingId(id);
		try {
			await deleteMutation.mutateAsync(id);
			notify({ title: "Rasm o'chirildi" });
		} catch {
			notify({ title: "O'chirishda xatolik yuz berdi" });
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-4xl'>
				<ModalHeader>
					<ModalTitle>Tovar rasmlari</ModalTitle>
					<p className='mt-0.5 text-[11px] font-normal text-ca-text'>
						{item.brand_detail?.name ?? item.brand} &middot; {images.length} ta rasm
					</p>
				</ModalHeader>
				<ModalBody>
					<div
						{...getRootProps()}
						className={cn(
							'mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ca-border bg-ca-silver/60 px-6 py-6 text-center transition-colors hover:border-ca-theme hover:bg-ca-theme/5',
							isDragActive && 'border-ca-theme bg-ca-theme/10',
						)}
					>
						<input {...getInputProps()} />
						{isUploading ? (
							<FaSpinner className='mb-2 animate-spin text-2xl text-ca-theme' />
						) : (
							<FaCloudUploadAlt className='mb-2 text-3xl text-ca-theme' />
						)}
						<p className='text-sm font-medium text-ca-heading'>
							{isUploading ? 'Yuklanmoqda...' : "Rasm qo'shish uchun bosing yoki shu yerga tashlang"}
						</p>
						<p className='mt-0.5 text-xs text-ca-text'>Bir nechta rasmni birdaniga tanlashingiz mumkin</p>
					</div>

					{isLoading || isFetching ? (
						<div className='flex items-center justify-center gap-2 py-10 text-ca-text'>
							<FaSpinner className='animate-spin' /> Yuklanmoqda...
						</div>
					) : images.length === 0 ? (
						<div className='flex flex-col items-center gap-2 py-10 text-ca-text'>
							<FaImages className='text-3xl text-ca-border' />
							<p>Hali rasmlar qo'shilmagan</p>
						</div>
					) : (
						<div className='grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5'>
							{images.map((img, idx) => (
								<div
									key={img.id}
									className='group relative aspect-square overflow-hidden rounded-lg border border-ca-border bg-ca-silver shadow-sm transition-shadow hover:shadow-md'
								>
									<img
										src={img.image}
										alt='Tovar rasmi'
										onClick={() => setLightboxIndex(idx)}
										className='h-full w-full cursor-zoom-in object-cover transition-transform duration-200 group-hover:scale-105'
									/>
									<div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
									<button
										type='button'
										aria-label="O'chirish"
										disabled={deletingId === img.id}
										onClick={() => handleDelete(img.id)}
										className='absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ca-red text-white opacity-0 shadow transition-opacity group-hover:opacity-100 disabled:opacity-100'
									>
										{deletingId === img.id ? (
											<FaSpinner className='animate-spin text-xs' />
										) : (
											<FaTrash className='text-xs' />
										)}
									</button>
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
