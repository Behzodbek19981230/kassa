import { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import {
   Button,
   Modal,
   ModalBody,
   ModalContent,
   ModalFooter,
   ModalHeader,
   ModalTitle,
   Pagination,
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { formatTashkentDateTime } from '@/pages/TwoStageImport/utils';
import { usePartnerPriceHistoryQuery } from '@/services/two-stage-import/two-stage-import.queries';

interface PriceHistoryModalProps {
   open: boolean;
   setOpen: (open: boolean) => void;
   partnerId: number;
   stockId: number;
}

const PAGE_SIZE = 20;

export default function PriceHistoryModal({ open, setOpen, partnerId, stockId }: PriceHistoryModalProps) {
   const [page, setPage] = useState(1);
   const query = usePartnerPriceHistoryQuery(partnerId, stockId, { page, limit: PAGE_SIZE });

   const stock = query.data?.stock;
   const entries = query.data?.results ?? [];
   const pagination = query.data?.pagination;

   return (
      <Modal open={open} onOpenChange={setOpen}>
         <ModalContent className='max-w-[720px]'>
            <ModalHeader>
               <ModalTitle>Kirim narxlari tarixi</ModalTitle>
            </ModalHeader>
            <ModalBody>
               {query.isLoading && <div className='py-6 text-center text-xs'>Yuklanmoqda...</div>}
               {query.isError && (
                  <div className='py-6 text-center text-xs text-ca-red'>
                     <FaExclamationTriangle className='mr-1.5 inline' />
                     {getApiErrorMessage(query.error, 'Xatolik yuz berdi')}
                  </div>
               )}

               {stock && (
                  <div className='mb-4 flex items-start gap-4'>
                     {stock.image ? (
                        <img
                           src={stock.image}
                           alt={stock.product_category?.name ?? ''}
                           className='h-24 w-24 shrink-0 rounded border border-ca-border object-cover'
                        />
                     ) : (
                        <div className='flex h-24 w-24 shrink-0 items-center justify-center rounded border border-ca-border text-[10px] text-ca-text'>
                           Rasm yo'q
                        </div>
                     )}
                     <div className='min-w-0 text-xs text-ca-heading'>
                        <div className='text-sm font-bold'>
                           {stock.brand?.name ?? '—'} • {stock.product_category?.name ?? '—'} • O'lcham:{' '}
                           {formatNumber(stock.size ?? '')} • {stock.type?.name ?? '—'}
                        </div>
                        <div className='mt-1'>
                           <span className='text-ca-text'>Sklad: </span>
                           {stock.logistics_warehouse?.name ?? '—'}
                        </div>
                        <div className='mt-2 inline-block rounded border border-ca-border bg-ca-silver px-3 py-1.5'>
                           <span className='text-ca-text'>Joriy narx: </span>
                           <span className='font-bold text-ca-theme'>{stock.price.display}</span>
                        </div>
                     </div>
                  </div>
               )}

               {query.data && (
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead className='bg-ca-theme text-white'>Kirim sanasi</TableHead>
                           <TableHead className='bg-ca-theme text-white'>Buyurtma №</TableHead>
                           <TableHead className='bg-ca-theme text-white'>Kirgan soni</TableHead>
                           <TableHead className='bg-ca-theme text-white'>Narx (¥ / $)</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {entries.length === 0 && (
                           <TableRow>
                              <TableCell colSpan={4} className='text-center'>
                                 Kirim narxlari tarixi yo'q
                              </TableCell>
                           </TableRow>
                        )}
                        {entries.map((entry) => (
                           <TableRow key={entry.id}>
                              <TableCell>{formatTashkentDateTime(entry.arrival_at)}</TableCell>
                              <TableCell>{entry.order_number ?? '—'}</TableCell>
                              <TableCell>{formatNumber(entry.count)}</TableCell>
                              <TableCell className='font-semibold text-ca-theme'>{entry.price.display}</TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               )}
            </ModalBody>
            <ModalFooter className='justify-between'>
               <div className='flex items-center gap-3 text-xs text-ca-text'>
                  {pagination && <span>{pagination.total} ta kirim</span>}
                  {pagination && pagination.lastPage > 1 && (
                     <Pagination page={page} totalPages={pagination.lastPage} onPageChange={setPage} />
                  )}
               </div>
               <Button type='button' variant='theme' onClick={() => setOpen(false)}>
                  Yopish
               </Button>
            </ModalFooter>
         </ModalContent>
      </Modal>
   );
}
