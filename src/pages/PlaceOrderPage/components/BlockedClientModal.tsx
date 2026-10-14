import { FaExclamationTriangle } from 'react-icons/fa';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui';
import type { Client } from '@/services/client/client.types';

interface BlockedClientModalProps {
   open: boolean;
   setOpen: (open: boolean) => void;
   client: Client;
}

function formatDateTime(value?: string | null) {
   if (!value) return '-';
   const d = new Date(value);
   if (Number.isNaN(d.getTime())) return value;
   const date = d.toLocaleDateString('ru-RU');
   const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
   return `${date} ${time}`;
}

export default function BlockedClientModal({ open, setOpen, client }: BlockedClientModalProps) {
   return (
      <Modal open={open} onOpenChange={setOpen}>
         <ModalContent>
            <ModalHeader>
               <ModalTitle>Mijoz bloklangan</ModalTitle>
            </ModalHeader>
            <ModalBody>
               <div className='flex flex-col items-center gap-3 py-2 text-center'>
                  <FaExclamationTriangle className='text-5xl text-ca-red' />
                  <p className='text-sm font-semibold text-ca-heading'>Bu mijoz bloklangan</p>
                  <p className='text-xs text-ca-text'>
                     <span className='font-semibold text-ca-heading'>{client.fio}</span> uchun buyurtma ochib
                     bo'lmaydi.
                  </p>
                  <p className='text-xs text-ca-text'>
                     Bloklangan vaqt:{' '}
                     <span className='font-semibold text-ca-red'>{formatDateTime(client.is_blocked_date)}</span>
                  </p>
               </div>
            </ModalBody>
            <ModalFooter>
               <Button variant='white' onClick={() => setOpen(false)}>
                  Yopish
               </Button>
            </ModalFooter>
         </ModalContent>
      </Modal>
   );
}
