import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBoxes, FaCheck, FaExclamationTriangle, FaEye, FaMoneyBillWave, FaTruck } from 'react-icons/fa';
import {
   Badge,
   Button,
   PageHeader,
   Panel,
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
   Tooltip,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import ColumnVisibilityMenu from '@/components/ColumnVisibilityMenu';
import { type ColumnVisibilityDef, useColumnVisibility } from '@/lib/useColumnVisibility';
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

const COLUMNS: ColumnVisibilityDef[] = [
   { id: 'index', label: '#', hideable: false },
   { id: 'date', label: "Jo'natilgan sana" },
   { id: 'source', label: 'Manba' },
   { id: 'destination', label: 'Qabul sklad' },
   { id: 'total_quantity', label: 'Soni' },
   { id: 'total_dollar', label: 'Jami ($)' },
   { id: 'truck', label: 'Fura' },
   { id: 'driver_phone', label: 'Telefon' },
   { id: 'status', label: 'Holati' },
   { id: 'actions', label: 'Amal', hideable: false },
];

export default function UzbekistanInRoadPage() {
   const navigate = useNavigate();
   const { canWrite } = useCurrentCompany();
   const cols = useColumnVisibility('logistics-uzbekistan-in-road', COLUMNS);
   const inRoadQuery = useUzbekistanInRoadQuery();
   const orders = inRoadQuery.data ?? [];
   // The row's confirm action opens the receipt step. Cancelling is offered inside that step.
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
               <StatCard icon={<FaBoxes />} label='Jami soni' value={`${formatNumber(totals.quantity)} `} />
               <StatCard
                  icon={<FaMoneyBillWave />}
                  label='Jami qiymat ($)'
                  value={`${formatNumber(totals.dollar, 2)} $`}
                  accent='danger'
               />
            </div>

            <div className='mb-2 flex justify-end'>
               <ColumnVisibilityMenu state={cols} />
            </div>

            <div className={SCROLL_AREA_CLASS}>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className='bg-ca-theme text-white'>#</TableHead>
                        {cols.isVisible('date') && <TableHead className='bg-ca-theme text-white'>Jo'natilgan sana</TableHead>}
                        {cols.isVisible('source') && <TableHead className='bg-ca-theme text-white'>Manba</TableHead>}
                        {cols.isVisible('destination') && <TableHead className='bg-ca-theme text-white'>Qabul sklad</TableHead>}
                        {cols.isVisible('total_quantity') && <TableHead className='bg-ca-theme text-white'>Soni</TableHead>}
                        {cols.isVisible('total_dollar') && <TableHead className='bg-ca-theme text-white'>Jami ($)</TableHead>}
                        {cols.isVisible('truck') && <TableHead className='bg-ca-theme text-white'>Fura</TableHead>}
                        {cols.isVisible('driver_phone') && <TableHead className='bg-ca-theme text-white'>Telefon</TableHead>}
                        {cols.isVisible('status') && <TableHead className='bg-ca-theme text-white'>Holati</TableHead>}
                        <TableHead className='bg-ca-theme text-white'>Amal</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {inRoadQuery.isLoading && (
                        <TableRow>
                           <TableCell colSpan={cols.visibleCount} className='text-center'>
                              Yuklanmoqda...
                           </TableCell>
                        </TableRow>
                     )}
                     {!inRoadQuery.isLoading && inRoadQuery.isError && (
                        <TableRow>
                           <TableCell colSpan={cols.visibleCount} className='text-center text-ca-red'>
                              <FaExclamationTriangle className='mr-1.5 inline' />{' '}
                              {getApiErrorMessage(inRoadQuery.error, 'Xatolik yuz berdi')}
                           </TableCell>
                        </TableRow>
                     )}
                     {!inRoadQuery.isLoading && !inRoadQuery.isError && orders.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={cols.visibleCount} className='text-center'>
                              Ma'lumot topilmadi
                           </TableCell>
                        </TableRow>
                     )}
                     {orders.map((order, index) => (
                        <TableRow key={order.id}>
                           <TableCell>{index + 1}</TableCell>
                           {cols.isVisible('date') && <TableCell>{formatTashkentDate(order.order_datetime)}</TableCell>}
                           {cols.isVisible('source') && <TableCell>{order.source_logistics_warehouse_detail?.name ?? '-'}</TableCell>}
                           {cols.isVisible('destination') && <TableCell>{order.destination_type_sklad_detail?.name ?? order.destination_logistics_warehouse_detail?.name ?? '-'}</TableCell>}
                           {cols.isVisible('total_quantity') && <TableCell>{formatNumber(order.total_quantity ?? 0)}</TableCell>}
                           {cols.isVisible('total_dollar') && <TableCell className='font-semibold'>{formatNumber(order.total_dollar ?? 0, 2)} $</TableCell>}
                           {cols.isVisible('truck') && <TableCell>{order.truck_number ?? '-'}</TableCell>}
                           {cols.isVisible('driver_phone') && <TableCell>{order.driver_phone ?? '-'}</TableCell>}
                           {cols.isVisible('status') && (
                              <TableCell>
                                 <Badge variant={ORDER_STATUS_VARIANTS[order.status]} className='px-2.5 py-1 text-xs whitespace-nowrap'>{ORDER_STATUS_LABELS[order.status]}</Badge>
                              </TableCell>
                           )}
                           <TableCell>
                              <div className='flex gap-1.5'>
                                 <Tooltip content="Ko'rish">
                                    <Button
                                       type='button'
                                       variant='theme'
                                       size='icon'
                                       aria-label="Ko'rish"
                                       onClick={() => navigate(`/two-stage-import/orders/${order.id}?stage=${order.stage}`)}
                                    >
                                       <FaEye />
                                    </Button>
                                 </Tooltip>
                                 {canWrite && (
                                    <Tooltip content='Tasdiqlash'>
                                       <Button
                                          type='button'
                                          variant='success'
                                          size='icon'
                                          aria-label='Tasdiqlash'
                                          onClick={() => setReceiptOrder(order)}
                                       >
                                          <FaCheck />
                                       </Button>
                                    </Tooltip>
                                 )}
                              </div>
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
