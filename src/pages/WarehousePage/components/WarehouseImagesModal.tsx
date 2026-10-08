import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
   FaChevronLeft,
   FaChevronRight,
   FaCloudUploadAlt,
   FaImages,
   FaSpinner,
   FaStar,
   FaTrash,
} from 'react-icons/fa';
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
   useSetMainWarehouseImageMutation,
   useUpdateWarehouseImageNumbersMutation,
   useWarehouseImageListQuery,
} from '@/services/warehouse-image/warehouse-image.queries';
import type { WarehouseImage } from '@/services/warehouse-image/warehouse-image.types';
import type { Warehouse } from '@/services/warehouse/warehouse.types';

interface WarehouseImagesModalProps {
   open: boolean;
   setOpen: (open: boolean) => void;
   item: Warehouse;
}

// Images without a number keep the order the API returned them in.
function sortByNumber(list: WarehouseImage[]): WarehouseImage[] {
   return [...list].sort(
      (a, b) => (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER),
   );
}

export default function WarehouseImagesModal({ open, setOpen, item }: WarehouseImagesModalProps) {
   const { notify } = useNotification();
   const [isUploading, setIsUploading] = useState(false);
   const [deletingId, setDeletingId] = useState<number | null>(null);
   const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

   const { data, isLoading, isFetching } = useWarehouseImageListQuery({ warehouse: item.id, limit: 100 });
   const images = useMemo(() => sortByNumber(data?.results ?? []), [data]);
   const slides = images.map((img) => ({ src: img.image }));

   const createMutation = useCreateWarehouseImageMutation();
   const deleteMutation = useDeleteWarehouseImageMutation();
   const reorderMutation = useUpdateWarehouseImageNumbersMutation();
   const setMainMutation = useSetMainWarehouseImageMutation();
   const isSaving = reorderMutation.isPending || setMainMutation.isPending;

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

   // Moves one image by one place. Only images whose position changed are sent, each with its new 1-based number.
   const moveImage = async (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= images.length) return;

      const reordered = [...images];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

      const currentNumber = new Map(images.map((img, pos) => [img.id, img.number ?? pos + 1]));
      const changes = reordered.flatMap((img, pos) =>
         currentNumber.get(img.id) === pos + 1 ? [] : [{ id: img.id, number: pos + 1 }],
      );

      try {
         await reorderMutation.mutateAsync(changes);
      } catch {
         notify({ title: 'Rasm tartibini saqlashda xatolik yuz berdi' });
      }
   };

   // Makes one image the main one. The previous main image is unmarked by the same mutation.
   const setMain = async (img: WarehouseImage) => {
      const previousMain = images.find((other) => other.is_main);
      try {
         await setMainMutation.mutateAsync({ id: img.id, previousMainId: previousMain?.id });
         notify({ title: 'Asosiy rasm belgilandi' });
      } catch {
         notify({ title: 'Asosiy rasmni saqlashda xatolik yuz berdi' });
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
                           <div className='absolute left-2 top-2 flex gap-1'>
                              <span className='rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white'>
                                 {idx + 1}
                              </span>
                              {img.is_main && (
                                 <span className='flex items-center gap-1 rounded bg-ca-theme px-1.5 py-0.5 text-[10px] font-semibold text-white'>
                                    <FaStar className='text-[8px]' /> Asosiy
                                 </span>
                              )}
                           </div>
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
                           <div className='absolute inset-x-0 bottom-2 flex justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100'>
                              <button
                                 type='button'
                                 aria-label='Chapga surish'
                                 disabled={idx === 0 || isSaving}
                                 onClick={() => moveImage(idx, -1)}
                                 className='flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ca-heading shadow transition-colors hover:bg-white disabled:opacity-30'
                              >
                                 <FaChevronLeft className='text-xs' />
                              </button>
                              <button
                                 type='button'
                                 aria-label={img.is_main ? 'Asosiy rasm' : 'Asosiy qilish'}
                                 title={img.is_main ? 'Asosiy rasm' : 'Asosiy qilish'}
                                 disabled={img.is_main || isSaving}
                                 onClick={() => setMain(img)}
                                 className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-ca-red/10 disabled:cursor-default disabled:opacity-100',
                                    'text-ca-red',
                                 )}
                              >
                                 <FaStar className='text-lg' />
                              </button>
                              <button
                                 type='button'
                                 aria-label="O'ngga surish"
                                 disabled={idx === images.length - 1 || isSaving}
                                 onClick={() => moveImage(idx, 1)}
                                 className='flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ca-heading shadow transition-colors hover:bg-white disabled:opacity-30'
                              >
                                 <FaChevronRight className='text-xs' />
                              </button>
                           </div>
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
