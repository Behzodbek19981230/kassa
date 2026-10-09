import { useMemo, useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import {
   Button,
   Combobox,
   DatePicker,
   PageHeader,
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
import {
   useImportCartQuery,
   useTransitStockQuery,
} from '@/services/two-stage-import/two-stage-import.queries';
import type { ImportCartItem, TransitStockItem } from '@/services/two-stage-import/two-stage-import.types';
import { createCategoryLoader, loadBrandOptions } from '@/pages/TwoStageImport/options';
import AddToUzCartModal from '@/pages/TwoStageImport/components/AddToUzCartModal';
import UzbekistanDispatchForm from '@/pages/TwoStageImport/components/UzbekistanDispatchForm';
import {
   SCROLL_AREA_CLASS,
   SCROLL_BODY_CLASS,
   SCROLL_PANEL_CLASS,
   fromApiDateTime,
   nowTashkentLocal,
   toApiDateTime,
} from '@/pages/TwoStageImport/utils';

const STAGE = 'TRANSIT_TO_UZBEKISTAN' as const;

export default function UzbekistanDispatchPage() {
   const { canWrite } = useCurrentCompany();

   const [logisticsFilter, setLogisticsFilter] = useState('');
   const [brandFilter, setBrandFilter] = useState('');
   const [categoryFilter, setCategoryFilter] = useState('');
   const [dispatchInput, setDispatchInput] = useState('');
   const [defaultDispatch] = useState(nowTashkentLocal);
   const [selected, setSelected] = useState<TransitStockItem | null>(null);
   const [dispatchOpen, setDispatchOpen] = useState(false);

   const logisticsId = logisticsFilter ? Number(logisticsFilter) : undefined;
   const loadCategoryOptions = useMemo(
      () => createCategoryLoader(brandFilter ? Number(brandFilter) : undefined),
      [brandFilter],
   );

   const stockQuery = useTransitStockQuery();
   const cartQuery = useImportCartQuery(STAGE);

   const cart = cartQuery.data?.cart ?? null;
   const cartItems = cartQuery.data?.items ?? [];
   const summary = cartQuery.data?.summary;

   const dispatchValue = dispatchInput || (cart ? fromApiDateTime(cart.dispatch_datetime) : defaultDispatch);

   const stockById = useMemo(() => new Map((stockQuery.data ?? []).map((s) => [s.id, s])), [stockQuery.data]);

   function stockForCartItem(item: ImportCartItem) {
      return item.import_warehouse != null ? stockById.get(item.import_warehouse) : undefined;
   }

   const logisticsOptions = useMemo(() => {
      const names = new Map<number, string>();
      for (const stock of stockQuery.data ?? []) {
         if (stock.logistics_warehouse_detail) names.set(stock.logistics_warehouse, stock.logistics_warehouse_detail.name);
      }
      return Array.from(names, ([value, label]) => ({ value: String(value), label }));
   }, [stockQuery.data]);

   const rows = (stockQuery.data ?? []).filter((stock) => {
      if (logisticsId && stock.logistics_warehouse !== logisticsId) return false;
      if (brandFilter && stock.warehouse_detail?.brand !== Number(brandFilter)) return false;
      if (categoryFilter && stock.warehouse_detail?.product_category !== Number(categoryFilter)) return false;
      return true;
   });

   function clearFilters() {
      setLogisticsFilter('');
      setBrandFilter('');
      setCategoryFilter('');
   }

   return (
      <>
         <PageHeader
            title="O'zbekistonga yuk chiqarish"
            breadcrumb={[
               { label: 'Asosiy', path: '/' },
               { label: 'Ikki bosqichli import' },
               { label: "Tranzit skladdan O'zbekistonga yuk chiqarish", active: true },
            ]}
         />

         <div className='-mx-2.5 flex flex-wrap'>
            <div className='w-full px-2.5 lg:w-1/2'>
               <Panel
                  title='Tranzit sklad mahsulotlari'
                  onReload={() => stockQuery.refetch()}
                  className={SCROLL_PANEL_CLASS}
                  bodyClassName={SCROLL_BODY_CLASS}
               >
                  <div className='-mx-2.5 mb-4 flex flex-wrap gap-y-3'>
                     <div className='w-full px-2.5 sm:w-1/2'>
                        <label className='mb-1 block text-xs font-semibold text-ca-heading'>Logistika ombori:</label>
                        <Combobox
                           value={logisticsFilter}
                           onChange={(value) => setLogisticsFilter(value)}
                           options={logisticsOptions}
                           placeholder='Barchasi'
                           clearable
                        />
                     </div>
                     <div className='w-full px-2.5 sm:w-1/2'>
                        <label className='mb-1 block text-xs font-semibold text-ca-heading'>Modelni tanlang:</label>
                        <Combobox
                           value={brandFilter}
                           onChange={(value) => {
                              setBrandFilter(value);
                              setCategoryFilter('');
                           }}
                           loadOptions={loadBrandOptions}
                           placeholder='Modelni tanlang'
                           clearable
                        />
                     </div>
                     <div className='w-full px-2.5 sm:w-1/2'>
                        <label className='mb-1 block text-xs font-semibold text-ca-heading'>Kategoriya:</label>
                        <div className='flex gap-2'>
                           <div className='flex-1'>
                              <Combobox
                                 value={categoryFilter}
                                 onChange={(value) => setCategoryFilter(value)}
                                 loadOptions={loadCategoryOptions}
                                 placeholder='Kategoriyani tanlang'
                                 clearable
                              />
                           </div>
                           <Button
                              type='button'
                              variant='default'
                              size='sm'
                              disabled={!logisticsFilter && !brandFilter && !categoryFilter}
                              onClick={clearFilters}
                           >
                              Tozalash
                           </Button>
                        </div>
                     </div>
                  </div>

                  <div className={SCROLL_AREA_CLASS}>
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead className='bg-ca-theme text-white'>#</TableHead>
                              <TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>
                              <TableHead className='bg-ca-theme text-white'>Mavjud</TableHead>
                              <TableHead className='bg-ca-theme text-white'>Narxi (¥)</TableHead>
                              <TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {stockQuery.isLoading && (
                              <TableRow>
                                 <TableCell colSpan={5} className='text-center'>
                                    Yuklanmoqda...
                                 </TableCell>
                              </TableRow>
                           )}
                           {!stockQuery.isLoading && stockQuery.isError && (
                              <TableRow>
                                 <TableCell colSpan={5} className='text-center text-ca-red'>
                                    <FaExclamationTriangle className='mr-1.5 inline' />{' '}
                                    {getApiErrorMessage(stockQuery.error, 'Xatolik yuz berdi')}
                                 </TableCell>
                              </TableRow>
                           )}
                           {!stockQuery.isLoading && !stockQuery.isError && rows.length === 0 && (
                              <TableRow>
                                 <TableCell colSpan={5} className='text-center'>
                                    Ma'lumot topilmadi
                                 </TableCell>
                              </TableRow>
                           )}
                           {rows.map((stock, index) => (
                              <TableRow key={stock.id} onClick={() => canWrite && stock.available_quantity > 0 && setSelected(stock)} className={canWrite && stock.available_quantity > 0 ? 'cursor-pointer bg-red-50 hover:bg-red-100' : 'bg-red-50 opacity-60'}>
                                 <TableCell>{index + 1}</TableCell>
                                 <TableCell>{formatNumber(stock.warehouse_detail?.size ?? '')}</TableCell>
                                 <TableCell className='font-semibold'>{formatNumber(stock.available_quantity)}</TableCell>
                                 <TableCell>{formatNumber(stock.current_price_yuan, 0)}</TableCell>
                                 <TableCell>{formatNumber(stock.current_price_dollar, 2)}</TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </div>
               </Panel>
            </div>

            <div className='w-full px-2.5 lg:w-1/2'>
               <Panel
                  title="O'zbekistonga jo'natish savatchasi"
                  onReload={() => cartQuery.refetch()}
                  className={SCROLL_PANEL_CLASS}
                  bodyClassName={SCROLL_BODY_CLASS}
               >
                  <div className='mb-4'>
                     <label className='mb-1 block text-xs font-semibold text-ca-heading'>
                        Jo'natish sanasi va vaqti: <span className='text-ca-red'>*</span>
                     </label>
                     <DatePicker value={dispatchValue} onChange={setDispatchInput} />
                  </div>

                  <div className={SCROLL_AREA_CLASS}>
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead className='bg-ca-theme text-white'>#</TableHead>
                              <TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>
                              <TableHead className='bg-ca-theme text-white'>Soni</TableHead>
                              <TableHead className='bg-ca-theme text-white'>Narxi (¥)</TableHead>
                              <TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>
                              <TableHead className='bg-ca-theme text-white'>Jami (¥)</TableHead>
                              <TableHead className='bg-ca-theme text-white'>Jami ($)</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {cartQuery.isLoading && (
                              <TableRow>
                                 <TableCell colSpan={7} className='text-center'>
                                    Yuklanmoqda...
                                 </TableCell>
                              </TableRow>
                           )}
                           {!cartQuery.isLoading && cartItems.length === 0 && (
                              <TableRow>
                                 <TableCell colSpan={7} className='text-center'>
                                    Jo'natish savati bo'sh
                                 </TableCell>
                              </TableRow>
                           )}
                           {cartItems.map((item, index) => {
                              const stock = stockForCartItem(item);
                              return (
                                 <TableRow key={item.id} className='bg-red-50'>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{formatNumber(stock?.warehouse_detail?.size ?? '')}</TableCell>
                                    <TableCell>{formatNumber(item.quantity)}</TableCell>
                                    <TableCell>{formatNumber(item.unit_price_yuan, 0)}</TableCell>
                                    <TableCell>{formatNumber(item.unit_price_dollar, 2)}</TableCell>
                                    <TableCell>{formatNumber(item.total_yuan, 0)}</TableCell>
                                    <TableCell className='font-semibold'>{formatNumber(item.total_dollar, 2)}</TableCell>
                                 </TableRow>
                              );
                           })}
                        </TableBody>
                     </Table>

                     {summary && cartItems.length > 0 && (
                        <div className='mt-4 flex flex-wrap items-center justify-around gap-3 rounded-[3px] border border-ca-border bg-ca-silver px-4 py-3 text-sm'>
                           <span className='text-ca-heading'>
                              Jami: <span className='font-bold'>{formatNumber(summary.total_quantity)} dona</span>
                           </span>
                           <span className='font-bold text-ca-heading'>{formatNumber(summary.total_yuan, 0)} ¥</span>
                           <span className='font-bold text-ca-green'>{formatNumber(summary.total_dollar, 2)} $</span>
                        </div>
                     )}

                     <div className='mt-5 border-t border-ca-border pt-4'>
                        <Button
                           type='button'
                           variant='danger'
                           size='lg'
                           className='w-full'
                           disabled={cartItems.length === 0 || !cart}
                           onClick={() => setDispatchOpen(true)}
                        >
                           Davom etish
                        </Button>
                     </div>
                  </div>
               </Panel>
            </div>
         </div>

         {dispatchOpen && (
            <UzbekistanDispatchForm
               open={dispatchOpen}
               setOpen={setDispatchOpen}
               cartId={cart?.id}
               disabled={cartItems.length === 0}
            />
         )}

         {selected && (
            <AddToUzCartModal
               open
               setOpen={(open) => !open && setSelected(null)}
               stock={selected}
               dispatchDatetime={toApiDateTime(dispatchValue)}
            />
         )}
      </>
   );
}
