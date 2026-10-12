import {
   Button,
   Modal,
   ModalBody,
   ModalContent,
   ModalFooter,
   ModalHeader,
   ModalTitle,
   useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { useDeleteOrderMutation } from '@/services/two-stage-import/two-stage-import.queries';
import type { ImportOrderListItem } from '@/services/two-stage-import/two-stage-import.types';

interface DeleteOrderModalProps {
   open: boolean;
   setOpen: (open: boolean) => void;
   order: ImportOrderListItem;
}

export default function DeleteOrderModal({ open, setOpen, order }: DeleteOrderModalProps) {
   const { notify } = useNotification();
   const deleteMutation = useDeleteOrderMutation();

   const handleDelete = async () => {
      try {
         await deleteMutation.mutateAsync(order.id);
         notify({ title: "Buyurtma o'chirildi" });
         setOpen(false);
      } catch (err) {
         notify({ title: "O'chirishda xatolik yuz berdi", text: getApiErrorMessage(err, 'Xatolik yuz berdi') });
      }
   };

   return (
      <Modal open={open} onOpenChange={setOpen}>
         <ModalContent>
            <ModalHeader>
               <ModalTitle>O'chirishni tasdiqlang</ModalTitle>
            </ModalHeader>
            <ModalBody>
               <p>"{order.order_number}" raqamli buyurtmani o'chirmoqchimisiz?</p>
            </ModalBody>
            <ModalFooter>
               <Button variant='white' onClick={() => setOpen(false)}>
                  Bekor qilish
               </Button>
               <Button variant='danger' onClick={handleDelete} loading={deleteMutation.isPending}>
                  O'chirish
               </Button>
            </ModalFooter>
         </ModalContent>
      </Modal>
   );
}
