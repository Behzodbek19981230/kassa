import { useState } from 'react';
import { FaBoxes, FaExclamationTriangle, FaMoneyBillWave, FaTruck } from 'react-icons/fa';
import { Badge, PageHeader, Panel, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useUzbekistanInRoadQuery } from '@/services/two-stage-import/two-stage-import.queries';
import type { ImportOrderListItem } from '@/services/two-stage-import/two-stage-import.types';
import CancelOrderModal from '@/pages/TwoStageImport/components/CancelOrderModal';
import LocalReceiptModal from '@/pages/TwoStageImport/components/LocalReceiptModal';
import StatCard from '@/pages/TwoStageImport/components/StatCard';
import {
   ORDER_STATUS_LABELS,
   ORDER_STATUS_VARIANTS,
   SCROLL_AREA_CLASS,
   SCROLL_BODY_CLASS,
   SCROLL_PANEL_CLASS,
   formatTashkentDate,
} from '@/pages/TwoStageImport/utils';

export default function UzbekistanInRoadPage() {
   const { canWrite } = useCurrentCompany();
   const inRoadQuery = useUzbekistanInRoadQuery();
   const orders = inRoadQuery.data ?? [];
   // Clicking a row opens the receipt step. Cancelling is offered inside that step.
   const [receiptOrder, setReceiptOrder] = useState<ImportOrderListItem | null>(null);
   const [cancelOrder, setCancelOrder] = useState<ImportOrderListItem | null>(null);

   const totals = orders.reduce(
      (acc, order) => ({
         quantity: acc.quantity + (order.total_quantity ?? 0),
         dollar: acc.dollar + Number(order.total_dollar ?? 0),
      }),
      { quantity: 0, dollar: 0 },
   );

   return (
      <>
         <PageHeader
            title="O'zbekistonga yo'ldagi buyurtmalar"
            breadcrumb={[
               { label: 'Asosiy', path: '/' },
               { label: 'Logistika' },
               { label: "O'zbekistonga yo'ldagi buyurtmalar", active: true },
            ]}
         />

         <Panel
            title="O'zbekistonga yo'ldagi buyurtmalar"
            onReload={() => inRoadQuery.refetch()}
            className={SCROLL_PANEL_CLASS}
            bodyClassName={SCROLL_BODY_CLASS}
         >
            <div className='-mx-2.5 flex flex-wrap'>
               <StatCard icon={<FaTruck />} label="Yo'lda" value={formatNumber(orders.length)} accent='warning' />
               <StatCard icon={<FaBoxes />} label='Jami soni' value={`${formatNumber(totals.quantity)} dona`} />
               <StatCard
                  icon={<FaMoneyBillWave />}
                  label='Jami qiymat ($)'
                  value={`${formatNumber(totals.dollar, 2)} $`}
                  accent='danger'
               />
            </div>

            <div className={SCROLL_AREA_CLASS}>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className='bg-ca-theme text-white'>#</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Buyurtma №</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Jo'natilgan sana</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Manba</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Qabul sklad</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Soni</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Jami ($)</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Fura</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Telefon</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Holati</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {inRoadQuery.isLoading && (
                        <TableRow>
                           <TableCell colSpan={10} className='text-center'>
                              Yuklanmoqda...
                           </TableCell>
                        </TableRow>
                     )}
                     {!inRoadQuery.isLoading && inRoadQuery.isError && (
                        <TableRow>
                           <TableCell colSpan={10} className='text-center text-ca-red'>
                              <FaExclamationTriangle className='mr-1.5 inline' />{' '}
                              {getApiErrorMessage(inRoadQuery.error, 'Xatolik yuz berdi')}
                           </TableCell>
                        </TableRow>
                     )}
                     {!inRoadQuery.isLoading && !inRoadQuery.isError && orders.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={10} className='text-center'>
                              Ma'lumot topilmadi
                           </TableCell>
                        </TableRow>
                     )}
                     {orders.map((order, index) => (
                        <TableRow
                           key={order.id}
                           onClick={() => canWrite && setReceiptOrder(order)}
                           className={canWrite ? 'cursor-pointer hover:bg-ca-table-hover' : undefined}
                        >
                           <TableCell>{index + 1}</TableCell>
                           <TableCell className='font-semibold text-ca-heading'>{order.order_number}</TableCell>
                           <TableCell>{formatTashkentDate(order.order_datetime)}</TableCell>
                           <TableCell>{order.source_logistics_warehouse_detail?.name ?? '-'}</TableCell>
                           <TableCell>{order.destination_type_sklad_detail?.name ?? order.destination_logistics_warehouse_detail?.name ?? '-'}</TableCell>
                           <TableCell>{formatNumber(order.total_quantity ?? 0)}</TableCell>
                           <TableCell className='font-semibold'>{formatNumber(order.total_dollar ?? 0, 2)} $</TableCell>
                           <TableCell>{order.truck_number ?? '-'}</TableCell>
                           <TableCell>{order.driver_phone ?? '-'}</TableCell>
                           <TableCell>
                              <Badge variant={ORDER_STATUS_VARIANTS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </div>
         </Panel>

         {receiptOrder && (
            <LocalReceiptModal
               open
               setOpen={(open) => !open && setReceiptOrder(null)}
               order={receiptOrder}
               onCancelOrder={() => {
                  setCancelOrder(receiptOrder);
                  setReceiptOrder(null);
               }}
            />
         )}
         {cancelOrder && (
            <CancelOrderModal open setOpen={(open) => !open && setCancelOrder(null)} order={cancelOrder} />
         )}
      </>
   );
}
