import { useMemo, useState } from 'react';
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import {
   Button,
   buttonProps,
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
   useNotification,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import {
   useDeleteCartItemMutation,
   useImportCartQuery,
   useTransitStockQuery,
} from '@/services/two-stage-import/two-stage-import.queries';
import type { ImportCartItem, TransitStockItem } from '@/services/two-stage-import/two-stage-import.types';
import {
   createCategoryLoader,
   createLogisticsWarehouseLoader,
   loadBrandOptions,
   loadLogisticsCompanyOptions,
} from '@/pages/TwoStageImport/options';
import AddToUzCartModal from '@/pages/TwoStageImport/components/AddToUzCartModal';
import ClearImportCartConfirmModal from '@/pages/TwoStageImport/components/ClearImportCartConfirmModal';
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
   const { notify } = useNotification();

   const [logisticsCompany, setLogisticsCompany] = useState('');
   const [logisticsWarehouse, setLogisticsWarehouse] = useState('');
   const [brandFilter, setBrandFilter] = useState('');
   const [categoryFilter, setCategoryFilter] = useState('');
   const [dispatchInput, setDispatchInput] = useState('');
   const [defaultDispatch] = useState(nowTashkentLocal);
   const [selected, setSelected] = useState<TransitStockItem | null>(null);
   const [dispatchOpen, setDispatchOpen] = useState(false);
   const [clearCartOpen, setClearCartOpen] = useState(false);
   // Required-field errors on the cart panel only show after "Davom etish" was pressed once.
   const [submitAttempted, setSubmitAttempted] = useState(false);

   const logisticsWarehouseId = logisticsWarehouse ? Number(logisticsWarehouse) : undefined;
   const loadLogisticsWarehouseOptions = useMemo(
      () => createLogisticsWarehouseLoader(undefined, logisticsCompany ? Number(logisticsCompany) : undefined),
      [logisticsCompany],
   );
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

   const deleteCartItemMutation = useDeleteCartItemMutation();

   function handleRemoveCartItem(id: number) {
      deleteCartItemMutation.mutate(id, {
         onError: (err) =>
            notify({ title: "O'chirishda xatolik", text: getApiErrorMessage(err, "Mahsulotni savatdan o'chirib bo'lmadi") }),
      });
   }

   function stockForCartItem(item: ImportCartItem) {
      return item.import_warehouse != null ? stockById.get(item.import_warehouse) : undefined;
   }

   // Nothing is listed until a logistics warehouse is chosen on the right.
   const rows = (stockQuery.data ?? []).filter((stock) => {
      if (!logisticsWarehouseId || stock.logistics_warehouse !== logisticsWarehouseId) return false;
      if (brandFilter && stock.warehouse_detail?.brand !== Number(brandFilter)) return false;
      if (categoryFilter && stock.warehouse_detail?.product_category !== Number(categoryFilter)) return false;
      return true;
   });

   const headerErrors = {
      logisticsCompany: submitAttempted && !logisticsCompany ? 'Logistikani tanlang' : '',
      logisticsWarehouse: submitAttempted && !logisticsWarehouse ? 'Logistika skladini tanlang' : '',
      dispatch: submitAttempted && !dispatchValue ? "Jo'natish sanasini tanlang" : '',
   };

   function handleContinue() {
      setSubmitAttempted(true);
      if (!logisticsCompany || !logisticsWarehouse || !dispatchValue) return;
      setDispatchOpen(true);
   }

   function clearFilters() {
      setBrandFilter('');
      setCategoryFilter('');
   }

   return (
      <>
         <PageHeader
            title="O'zbekistonga yuk chiqarish"
            breadcrumb={[
               { label: 'Asosiy', path: '/' },
               { label: 'Logistika' },
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
                                 key={brandFilter}
                                 value={categoryFilter}
                                 onChange={(value) => setCategoryFilter(value)}
                                 loadOptions={loadCategoryOptions}
                                 disabled={!brandFilter}
                                 placeholder={brandFilter ? 'Kategoriyani tanlang' : 'Avval modelni tanlang'}
                                 clearable
                              />
                           </div>
                           <Button
                              type='button'
                              variant='default'
                              size='sm'
                              disabled={!brandFilter && !categoryFilter}
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
                              <TableHead className='bg-ca-theme text-white'>Model</TableHead>
                              <TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
                              <TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>
                              <TableHead className='bg-ca-theme text-white'>Tip</TableHead>
                              <TableHead className='bg-ca-theme text-white'>Mavjud</TableHead>
                              <TableHead className='bg-ca-theme text-white'>Narxi (¥ / $)</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {stockQuery.isLoading && (
                              <TableRow>
                                 <TableCell colSpan={7} className='text-center'>
                                    Yuklanmoqda...
                                 </TableCell>
                              </TableRow>
                           )}
                           {!stockQuery.isLoading && stockQuery.isError && (
                              <TableRow>
                                 <TableCell colSpan={7} className='text-center text-ca-red'>
                                    <FaExclamationTriangle className='mr-1.5 inline' />{' '}
                                    {getApiErrorMessage(stockQuery.error, 'Xatolik yuz berdi')}
                                 </TableCell>
                              </TableRow>
                           )}
                           {!stockQuery.isLoading && !stockQuery.isError && rows.length === 0 && (
                              <TableRow>
                                 <TableCell colSpan={7} className='text-center'>
                                    {logisticsWarehouseId ? "Ma'lumot topilmadi" : 'Avval logistika va skladni tanlang'}
                                 </TableCell>
                              </TableRow>
                           )}
                           {rows.map((stock, index) => {
                              const product = stock.warehouse_detail;
                              return (
                                 <TableRow key={stock.id} onClick={() => canWrite && stock.available_quantity > 0 && setSelected(stock)} className={canWrite && stock.available_quantity > 0 ? 'cursor-pointer bg-red-50 hover:bg-red-100' : 'bg-red-50 opacity-60'}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{product?.brand_name ?? '-'}</TableCell>
                                    <TableCell>{product?.product_category_name ?? '-'}</TableCell>
                                    <TableCell>{formatNumber(product?.size ?? '')}</TableCell>
                                    <TableCell>{product?.type_name ?? '-'}</TableCell>
                                    <TableCell className='font-semibold'>{formatNumber(stock.available_quantity)}</TableCell>
                                    <TableCell className='whitespace-nowrap'>
                                       {formatNumber(stock.current_price_yuan, 0)} ¥ /{' '}
                                       <span className='font-semibold text-ca-green'>{formatNumber(stock.current_price_dollar, 2)} $</span>
                                    </TableCell>
                                 </TableRow>
                              );
                           })}
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
                  <div className='-mx-2.5 mb-3 flex flex-wrap gap-y-3'>
                     <div className='w-full px-2.5 sm:w-1/2'>
                        <label className='mb-1 block text-xs font-semibold text-ca-heading'>
                           Logistika: <span className='text-ca-red'>*</span>
                        </label>
                        <Combobox
                           value={logisticsCompany}
                           onChange={(value) => {
                              setLogisticsCompany(value);
                              setLogisticsWarehouse('');
                           }}
                           loadOptions={loadLogisticsCompanyOptions}
                           placeholder='Logistikani tanlang'
                           clearable
                        />
                        {headerErrors.logisticsCompany && (
                           <p className='mt-1 text-xs text-ca-red'>{headerErrors.logisticsCompany}</p>
                        )}
                     </div>
                     <div className='w-full px-2.5 sm:w-1/2'>
                        <label className='mb-1 block text-xs font-semibold text-ca-heading'>
                           Logistika skladi: <span className='text-ca-red'>*</span>
                        </label>
                        <Combobox
                           key={logisticsCompany}
                           value={logisticsWarehouse}
                           onChange={(value) => setLogisticsWarehouse(value)}
                           loadOptions={loadLogisticsWarehouseOptions}
                           disabled={!logisticsCompany}
                           placeholder={logisticsCompany ? 'Skladni tanlang' : 'Avval logistikani tanlang'}
                           clearable
                        />
                        {headerErrors.logisticsWarehouse && (
                           <p className='mt-1 text-xs text-ca-red'>{headerErrors.logisticsWarehouse}</p>
                        )}
                     </div>
                  </div>

                  <div className='mb-4'>
                     <label className='mb-1 block text-xs font-semibold text-ca-heading'>
                        Jo'natish sanasi va vaqti: <span className='text-ca-red'>*</span>
                     </label>
                     <DatePicker value={dispatchValue} onChange={setDispatchInput} />
                     {headerErrors.dispatch && <p className='mt-1 text-xs text-ca-red'>{headerErrors.dispatch}</p>}
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
                              <TableHead className='bg-ca-theme text-white' />
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {cartQuery.isLoading && (
                              <TableRow>
                                 <TableCell colSpan={8} className='text-center'>
                                    Yuklanmoqda...
                                 </TableCell>
                              </TableRow>
                           )}
                           {!cartQuery.isLoading && cartItems.length === 0 && (
                              <TableRow>
                                 <TableCell colSpan={8} className='text-center'>
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
                                    <TableCell>
                                       {canWrite && (
                                          <Button
                                             type='button'
                                             {...buttonProps(<FaTrash />, 'danger', 'icon')}
                                             aria-label="O'chirish"
                                             disabled={deleteCartItemMutation.isPending}
                                             onClick={() => handleRemoveCartItem(item.id)}
                                          />
                                       )}
                                    </TableCell>
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

                     {canWrite && (
                        <div className='mt-5 flex gap-2 border-t border-ca-border pt-4'>
                           <Button
                              type='button'
                              variant='default'
                              size='lg'
                              className='flex-1'
                              disabled={cartItems.length === 0}
                              onClick={() => setClearCartOpen(true)}
                           >
                              Savatni tozalash
                           </Button>
                           <Button
                              type='button'
                              variant='danger'
                              size='lg'
                              className='flex-1'
                              disabled={cartItems.length === 0 || !cart}
                              onClick={handleContinue}
                           >
                              Davom etish
                           </Button>
                        </div>
                     )}
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

         {clearCartOpen && (
            <ClearImportCartConfirmModal open={clearCartOpen} setOpen={setClearCartOpen} stage={STAGE} />
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
