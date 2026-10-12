import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaExclamationTriangle, FaEye, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';
import {
   Badge,
   Tooltip,
   Button,
   Combobox,
   PageHeader,
   Pagination,
   Panel,
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import ColumnVisibilityMenu from '@/components/ColumnVisibilityMenu';
import { type ColumnVisibilityDef, useColumnVisibility } from '@/lib/useColumnVisibility';
import { useConsignorQuery } from '@/services/consignor/consignor.queries';
import { useLogisticsWarehouseQuery } from '@/services/logistics-warehouse/logistics-warehouse.queries';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import { useRouteOrdersQuery } from '@/services/two-stage-import/two-stage-import.queries';
import type {
   ImportOrderListItem,
   ImportStage,
   RouteOrderListParams,
} from '@/services/two-stage-import/two-stage-import.types';
import {
   loadConsignorOptions,
   loadCountryOptions,
   createLogisticsWarehouseLoader,
   logisticsWarehouseLabel,
} from '@/pages/TwoStageImport/options';
import CancelOrderModal from '@/pages/TwoStageImport/components/CancelOrderModal';
import DeleteOrderModal from '@/pages/TwoStageImport/components/DeleteOrderModal';
import LocalReceiptModal from '@/pages/TwoStageImport/components/LocalReceiptModal';
import TransitArrivalModal from '@/pages/TwoStageImport/components/TransitArrivalModal';
import {
   ORDER_STATUS_LABELS,
   ORDER_STATUS_VARIANTS,
   SCROLL_AREA_CLASS,
   SCROLL_BODY_CLASS,
   ROUTE_ORDER_STATUS_OPTIONS,
   SCROLL_PANEL_CLASS,
   STAGE_OPTIONS,
   formatTashkentDate,
} from '@/pages/TwoStageImport/utils';

type OrderAction = { kind: 'arrival' | 'receipt' | 'cancel' | 'delete'; order: ImportOrderListItem };

const COLUMNS: ColumnVisibilityDef[] = [
   { id: 'index', label: '#', hideable: false },
   { id: 'date', label: 'Sana' },
   { id: 'sender', label: "Yuk jo'natuvchi" },
   { id: 'direction', label: "Yo'nalish" },
   { id: 'total_quantity', label: 'Jami soni' },
   { id: 'total_dollar', label: 'Jami ($)' },
   { id: 'truck', label: 'Fura' },
   { id: 'status', label: 'Holati' },
   { id: 'actions', label: 'Amal', hideable: false },
];

const loadWarehouseOptions = createLogisticsWarehouseLoader();
const PAGE_SIZE = 50;

// The step a row opens. An order in transit opens its next step. A draft opens the cancel dialog.
function primaryAction(order: ImportOrderListItem): OrderAction | null {
   if (order.status === 'DRAFT') return { kind: 'cancel', order };
   if (order.status !== 'IN_ROAD') return null;
   return order.stage === 'CHINA_TO_TRANSIT' ? { kind: 'arrival', order } : { kind: 'receipt', order };
}

export default function ImportOrdersPage() {
   const navigate = useNavigate();
   const { canWrite } = useCurrentCompany();
   const cols = useColumnVisibility('logistics-orders', COLUMNS);

   const [stage, setStage] = useState<ImportStage>('CHINA_TO_TRANSIT');
   const [consignorFilter, setConsignorFilter] = useState('');
   const [statusFilter, setStatusFilter] = useState('');
   const [countryFilter, setCountryFilter] = useState('');
   const [sourceFilter, setSourceFilter] = useState('');
   const [destinationFilter, setDestinationFilter] = useState('');
   const [page, setPage] = useState(1);
   const [action, setAction] = useState<OrderAction | null>(null);

   const isChina = stage === 'CHINA_TO_TRANSIT';

   const { data: selectedConsignor } = useConsignorQuery(consignorFilter ? Number(consignorFilter) : undefined);
   const { data: selectedSource } = useLogisticsWarehouseQuery(sourceFilter ? Number(sourceFilter) : undefined);
   const { data: selectedDestination } = useLogisticsWarehouseQuery(
      isChina && destinationFilter ? Number(destinationFilter) : undefined,
   );
   const { data: skladTypes } = useSkladTypeListQuery({ limit: 200 });
   const skladTypeOptions = (skladTypes?.results ?? []).map((t) => ({ value: String(t.id), label: t.name }));

   // China orders go into a logistics warehouse; Uzbekistan orders leave one and go into a TypeSklad.
   const ordersQuery = useRouteOrdersQuery(stage, {
      status: (statusFilter as RouteOrderListParams['status']) || undefined,
      consignor: consignorFilter ? Number(consignorFilter) : undefined,
      country: countryFilter ? Number(countryFilter) : undefined,
      source_logistics_warehouse: !isChina && sourceFilter ? Number(sourceFilter) : undefined,
      destination_logistics_warehouse: isChina && destinationFilter ? Number(destinationFilter) : undefined,
      destination_type_sklad: !isChina && destinationFilter ? Number(destinationFilter) : undefined,
      page,
      limit: PAGE_SIZE,
   });
   const orders = ordersQuery.data?.results ?? [];
   const pagination = ordersQuery.data?.pagination;

   const closeAction = (open: boolean) => !open && setAction(null);

   // Any filter change starts over from the first page.
   function withPageReset<T>(setter: (value: T) => void) {
      return (value: T) => {
         setter(value);
         setPage(1);
      };
   }

   function changeStage(next: ImportStage) {
      if (next === stage) return;
      setStage(next);
      // Warehouse filters mean different things per route, so they don't carry over.
      setSourceFilter('');
      setDestinationFilter('');
      setPage(1);
   }

   return (
      <>
         <PageHeader
            title='Import buyurtmalar'
            breadcrumb={[
               { label: 'Asosiy', path: '/' },
               { label: 'Logistika' },
               { label: 'Import buyurtmalar', active: true },
            ]}
         />

         <Panel
            title="Import buyurtmalar ro'yxati"
            className={SCROLL_PANEL_CLASS}
            bodyClassName={SCROLL_BODY_CLASS}
            onReload={() => ordersQuery.refetch()}
            actions={
               canWrite && (
                  <Button type='button' variant='danger' size='xs' onClick={() => navigate('/two-stage-import/china-dispatch')}>
                     <FaPlus className='mr-1.5' /> Xitoydan yuk chiqarish
                  </Button>
               )
            }
         >
            <div className='mb-4 flex flex-wrap gap-2'>
               {STAGE_OPTIONS.map((option) => (
                  <Button
                     key={option.value}
                     type='button'
                     variant={stage === option.value ? 'theme' : 'white'}
                     size='sm'
                     onClick={() => changeStage(option.value as ImportStage)}
                  >
                     {option.label}
                  </Button>
               ))}
            </div>

            <div className='-mx-2.5 mb-4 flex flex-wrap gap-y-3'>
               <div className='w-full px-2.5 sm:w-1/2 xl:w-1/5'>
                  <label className='mb-1 block text-xs font-semibold text-ca-heading'>Holati:</label>
                  <Combobox
                     value={statusFilter}
                     onChange={withPageReset(setStatusFilter)}
                     options={ROUTE_ORDER_STATUS_OPTIONS}
                     placeholder='Faol (yetib kelmagan)'
                     clearable
                  />
               </div>
               <div className='w-full px-2.5 sm:w-1/2 xl:w-1/5'>
                  <label className='mb-1 block text-xs font-semibold text-ca-heading'>Yuk jo'natuvchi:</label>
                  <Combobox
                     value={consignorFilter}
                     onChange={withPageReset(setConsignorFilter)}
                     loadOptions={loadConsignorOptions}
                     selectedLabel={selectedConsignor?.name}
                     placeholder='Barchasi'
                     clearable
                  />
               </div>
               <div className='w-full px-2.5 sm:w-1/2 xl:w-1/5'>
                  <label className='mb-1 block text-xs font-semibold text-ca-heading'>
                     {isChina ? 'Qabul qiluvchi sklad davlati:' : 'Jo\'natuvchi sklad davlati:'}
                  </label>
                  <Combobox
                     value={countryFilter}
                     onChange={withPageReset(setCountryFilter)}
                     loadOptions={loadCountryOptions}
                     placeholder='Barchasi'
                     clearable
                  />
               </div>
               {!isChina && (
                  <div className='w-full px-2.5 sm:w-1/2 xl:w-1/5'>
                     <label className='mb-1 block text-xs font-semibold text-ca-heading'>Jo'natuvchi sklad:</label>
                     <Combobox
                        value={sourceFilter}
                        onChange={withPageReset(setSourceFilter)}
                        loadOptions={loadWarehouseOptions}
                        selectedLabel={selectedSource ? logisticsWarehouseLabel(selectedSource) : undefined}
                        placeholder='Barchasi'
                        clearable
                     />
                  </div>
               )}
               <div className='w-full px-2.5 sm:w-1/2 xl:w-1/5'>
                  <label className='mb-1 block text-xs font-semibold text-ca-heading'>Qabul qiluvchi sklad:</label>
                  {isChina ? (
                     <Combobox
                        key='logistics-destination'
                        value={destinationFilter}
                        onChange={withPageReset(setDestinationFilter)}
                        loadOptions={loadWarehouseOptions}
                        selectedLabel={selectedDestination ? logisticsWarehouseLabel(selectedDestination) : undefined}
                        placeholder='Barchasi'
                        clearable
                     />
                  ) : (
                     <Combobox
                        key='sklad-destination'
                        value={destinationFilter}
                        onChange={withPageReset(setDestinationFilter)}
                        options={skladTypeOptions}
                        placeholder='Barchasi'
                        clearable
                     />
                  )}
               </div>
            </div>

            <div className='mb-2 flex justify-end'>
               <ColumnVisibilityMenu state={cols} />
            </div>

            <div className={SCROLL_AREA_CLASS}>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className='bg-ca-theme text-white'>#</TableHead>
                        {cols.isVisible('date') && <TableHead className='bg-ca-theme text-white'>Sana</TableHead>}
                        {cols.isVisible('sender') && <TableHead className='bg-ca-theme text-white'>Yuk jo'natuvchi</TableHead>}
                        {cols.isVisible('direction') && <TableHead className='bg-ca-theme text-white'>Yo'nalish</TableHead>}
                        {cols.isVisible('total_quantity') && <TableHead className='bg-ca-theme text-white'>Jami soni</TableHead>}
                        {cols.isVisible('total_dollar') && <TableHead className='bg-ca-theme text-white'>Jami ($)</TableHead>}
                        {cols.isVisible('truck') && <TableHead className='bg-ca-theme text-white'>Fura</TableHead>}
                        {cols.isVisible('status') && <TableHead className='bg-ca-theme text-white'>Holati</TableHead>}
                        <TableHead className='bg-ca-theme text-white'>Amal</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {ordersQuery.isLoading && (
                        <TableRow>
                           <TableCell colSpan={cols.visibleCount} className='text-center'>
                              Yuklanmoqda...
                           </TableCell>
                        </TableRow>
                     )}
                     {!ordersQuery.isLoading && ordersQuery.isError && (
                        <TableRow>
                           <TableCell colSpan={cols.visibleCount} className='text-center text-ca-red'>
                              <FaExclamationTriangle className='mr-1.5 inline' />{' '}
                              {getApiErrorMessage(ordersQuery.error, 'Xatolik yuz berdi')}
                           </TableCell>
                        </TableRow>
                     )}
                     {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={cols.visibleCount} className='text-center'>
                              Ma'lumot topilmadi
                           </TableCell>
                        </TableRow>
                     )}
                     {orders.map((order, index) => (
                        <TableRow key={order.id} onClick={() => { const next = primaryAction(order); if (canWrite && next) setAction(next); }} className={canWrite && primaryAction(order) ? 'cursor-pointer hover:bg-ca-table-hover' : undefined}>
                           <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>

                           {cols.isVisible('date') && <TableCell>{formatTashkentDate(order.order_datetime)}</TableCell>}
                           {cols.isVisible('sender') && <TableCell>{order.sender_name || '-'}</TableCell>}
                           {cols.isVisible('direction') && <TableCell>{order.direction_name || '-'}</TableCell>}
                           {cols.isVisible('total_quantity') && <TableCell>{formatNumber(order.total_quantity ?? 0)}</TableCell>}
                           {cols.isVisible('total_dollar') && <TableCell className='font-semibold'>{formatNumber(order.total_dollar ?? 0, 2)} $</TableCell>}
                           {cols.isVisible('truck') && <TableCell>{order.truck_number ?? '-'}</TableCell>}
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
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/two-stage-import/orders/${order.id}?stage=${order.stage}`);
                                       }}
                                    >
                                       <FaEye />
                                    </Button>
                                 </Tooltip>
                                 {canWrite && primaryAction(order) && (
                                    <Tooltip content={primaryAction(order)?.kind === 'cancel' ? 'Bekor qilish' : 'Tasdiqlash'}>
                                       <Button
                                          type='button'
                                          variant={primaryAction(order)?.kind === 'cancel' ? 'danger' : 'success'}
                                          size='icon'
                                          aria-label={primaryAction(order)?.kind === 'cancel' ? 'Bekor qilish' : 'Tasdiqlash'}
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             setAction(primaryAction(order));
                                          }}
                                       >
                                          {primaryAction(order)?.kind === 'cancel' ? <FaTimes /> : <FaCheck />}
                                       </Button>
                                    </Tooltip>
                                 )}
                                 {canWrite && (
                                    <Tooltip content="O'chirish">
                                       <Button
                                          type='button'
                                          variant='danger'
                                          size='icon'
                                          aria-label="O'chirish"
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             setAction({ kind: 'delete', order });
                                          }}
                                       >
                                          <FaTrash />
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

            {pagination && pagination.lastPage > 1 && (
               <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-xs text-ca-text'>
                     Jami {formatNumber(pagination.total)} ta, {pagination.currentPage}-sahifa ({pagination.lastPage} tadan)
                  </span>
                  <Pagination page={page} totalPages={pagination.lastPage} onPageChange={setPage} />
               </div>
            )}
         </Panel>

         {action?.kind === 'arrival' && (
            <TransitArrivalModal
               open
               setOpen={closeAction}
               order={action.order}
               onCancelOrder={() => setAction({ kind: 'cancel', order: action.order })}
            />
         )}
         {action?.kind === 'receipt' && <LocalReceiptModal
            open
            setOpen={closeAction}
            order={action.order}
            onCancelOrder={() => setAction({ kind: 'cancel', order: action.order })}
         />}
         {action?.kind === 'cancel' && <CancelOrderModal open setOpen={closeAction} order={action.order} />}
         {action?.kind === 'delete' && <DeleteOrderModal open setOpen={closeAction} order={action.order} />}
      </>
   );
}
