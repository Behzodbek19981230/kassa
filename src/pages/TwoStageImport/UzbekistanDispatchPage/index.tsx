import { useEffect, useMemo, useState } from 'react';
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import {
   Button,
   buttonProps,
   Combobox,
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
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import ColumnVisibilityMenu from '@/components/ColumnVisibilityMenu';
import { type ColumnVisibilityDef, useColumnVisibility } from '@/lib/useColumnVisibility';
import { useLogisticsDebtListQuery } from '@/services/logistics-debt/logistics-debt.queries';
import { useLogisticsWarehouseQuery } from '@/services/logistics-warehouse/logistics-warehouse.queries';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
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
import YuanDebtPayModal from '@/pages/TwoStageImport/components/YuanDebtPayModal';
import { useYuanDollarConversion } from '@/pages/TwoStageImport/useYuanDollarConversion';
import {
   SCROLL_AREA_CLASS,
   SCROLL_BODY_CLASS,
   SCROLL_PANEL_CLASS,
   fromApiDateTime,
   nowTashkentLocal,
   toApiDateTime,
} from '@/pages/TwoStageImport/utils';

const STOCK_COLUMNS: ColumnVisibilityDef[] = [
   { id: 'index', label: '#', hideable: false },
   { id: 'brand', label: 'Model' },
   { id: 'category', label: 'Nomi' },
   { id: 'size', label: "O'lcham" },
   { id: 'type', label: 'Tip' },
   { id: 'available', label: 'Mavjud' },
   { id: 'price', label: 'Narxi (¥ / $)' },
];

const CART_COLUMNS: ColumnVisibilityDef[] = [
   { id: 'index', label: '#', hideable: false },
   { id: 'size', label: "O'lcham" },
   { id: 'quantity', label: 'Soni' },
   { id: 'price_yuan', label: 'Narxi (¥)' },
   { id: 'price_dollar', label: 'Narxi ($)' },
   { id: 'total_yuan', label: 'Jami (¥)' },
   { id: 'total_dollar', label: 'Jami ($)' },
   { id: 'actions', label: '', hideable: false },
];

const STAGE = 'TRANSIT_TO_UZBEKISTAN' as const;

export default function UzbekistanDispatchPage() {
   const { canWrite } = useCurrentCompany();
   const stockCols = useColumnVisibility('logistics-uz-stock', STOCK_COLUMNS);
   const cartCols = useColumnVisibility('logistics-uz-cart', CART_COLUMNS);
   const { notify } = useNotification();

   const [destination, setDestination] = useState('');
   const [logisticsCompany, setLogisticsCompany] = useState('');
   const [logisticsWarehouse, setLogisticsWarehouse] = useState('');
   const [brandFilter, setBrandFilter] = useState('');
   const [categoryFilter, setCategoryFilter] = useState('');
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
   const { data: skladTypes } = useSkladTypeListQuery({ limit: 200 });
   const destinationOptions = (skladTypes?.results ?? []).map((t) => ({ value: String(t.id), label: t.name }));

   // Carts are per (source warehouse, receiving sklad). The receiving sklad is picked first; with only
   // it set, the backend returns that sklad's latest active cart, whose source is then prefilled below.
   const destinationId = destination ? Number(destination) : undefined;
   const cartQuery = useImportCartQuery(
      { stage: STAGE, destination_type_sklad: destinationId, source_logistics_warehouse: logisticsWarehouseId },
      destinationId != null,
   );

   const cart = cartQuery.data?.cart ?? null;
   const cartItems = cartQuery.data?.items ?? [];
   const summary = cartQuery.data?.summary;

   useEffect(() => {
      if (!logisticsWarehouse && cart?.source_logistics_warehouse) {
         setLogisticsWarehouse(String(cart.source_logistics_warehouse));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [cart?.source_logistics_warehouse]);

   const { data: selectedWarehouse } = useLogisticsWarehouseQuery(logisticsWarehouseId);
   useEffect(() => {
      if (!logisticsCompany && selectedWarehouse?.logistics_company) {
         setLogisticsCompany(String(selectedWarehouse.logistics_company));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [selectedWarehouse?.logistics_company]);

   // New items go in with the cart's dispatch time (or now for a new cart); it's set when confirming the dispatch.
   const dispatchValue = cart ? fromApiDateTime(cart.dispatch_datetime) : defaultDispatch;

   // What I owe the chosen logistics company (LogisticsDebt, kept in dollars), shown in yuan at today's rate.
   const { dollarToYuan } = useYuanDollarConversion();
   const logisticsCompanyId = logisticsCompany ? Number(logisticsCompany) : undefined;
   const { data: logisticsDebtData } = useLogisticsDebtListQuery(
      { logistics_company: logisticsCompanyId, limit: 1 },
      logisticsCompanyId != null,
   );
   const logisticsDebtDollar = String(
      Number((logisticsCompanyId != null && logisticsDebtData?.results?.[0]?.total_debt) || 0),
   );
   const logisticsDebtYuan = dollarToYuan(logisticsDebtDollar);

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

   const canPick = canWrite && Boolean(destination);

   const headerErrors = {
      destination: submitAttempted && !destination ? 'Qabul qiluvchi skladni tanlang' : '',
      logisticsCompany: submitAttempted && !logisticsCompany ? 'Logistikani tanlang' : '',
      logisticsWarehouse: submitAttempted && !logisticsWarehouse ? 'Logistika skladini tanlang' : '',
   };

   function handleContinue() {
      setSubmitAttempted(true);
      if (!destination || !logisticsCompany || !logisticsWarehouse) return;
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

                  <div className='mb-2 flex justify-end'>
                     <ColumnVisibilityMenu state={stockCols} />
                  </div>

                  <div className={SCROLL_AREA_CLASS}>
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead className='bg-ca-theme text-white'>#</TableHead>
                              {stockCols.isVisible('brand') && <TableHead className='bg-ca-theme text-white'>Model</TableHead>}
                              {stockCols.isVisible('category') && <TableHead className='bg-ca-theme text-white'>Nomi</TableHead>}
                              {stockCols.isVisible('size') && <TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>}
                              {stockCols.isVisible('type') && <TableHead className='bg-ca-theme text-white'>Tip</TableHead>}
                              {stockCols.isVisible('available') && <TableHead className='bg-ca-theme text-white'>Mavjud</TableHead>}
                              {stockCols.isVisible('price') && <TableHead className='bg-ca-theme text-white'>Narxi (¥ / $)</TableHead>}
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {stockQuery.isLoading && (
                              <TableRow>
                                 <TableCell colSpan={stockCols.visibleCount} className='text-center'>
                                    Yuklanmoqda...
                                 </TableCell>
                              </TableRow>
                           )}
                           {!stockQuery.isLoading && stockQuery.isError && (
                              <TableRow>
                                 <TableCell colSpan={stockCols.visibleCount} className='text-center text-ca-red'>
                                    <FaExclamationTriangle className='mr-1.5 inline' />{' '}
                                    {getApiErrorMessage(stockQuery.error, 'Xatolik yuz berdi')}
                                 </TableCell>
                              </TableRow>
                           )}
                           {!stockQuery.isLoading && !stockQuery.isError && rows.length === 0 && (
                              <TableRow>
                                 <TableCell colSpan={stockCols.visibleCount} className='text-center'>
                                    {logisticsWarehouseId ? "Ma'lumot topilmadi" : 'Avval logistika va skladni tanlang'}
                                 </TableCell>
                              </TableRow>
                           )}
                           {rows.map((stock, index) => {
                              const product = stock.warehouse_detail;
                              return (
                                 <TableRow key={stock.id} onClick={() => canPick && stock.available_quantity > 0 && setSelected(stock)} className={canPick && stock.available_quantity > 0 ? 'cursor-pointer bg-red-50 hover:bg-red-100' : 'bg-red-50 opacity-60'}>
                                    <TableCell>{index + 1}</TableCell>
                                    {stockCols.isVisible('brand') && <TableCell>{product?.brand_name ?? '-'}</TableCell>}
                                    {stockCols.isVisible('category') && <TableCell>{product?.product_category_name ?? '-'}</TableCell>}
                                    {stockCols.isVisible('size') && <TableCell>{formatNumber(product?.size ?? '')}</TableCell>}
                                    {stockCols.isVisible('type') && <TableCell>{product?.type_name ?? '-'}</TableCell>}
                                    {stockCols.isVisible('available') && <TableCell className='font-semibold'>{formatNumber(stock.available_quantity)}</TableCell>}
                                    {stockCols.isVisible('price') && (
                                       <TableCell className='whitespace-nowrap'>
                                          {formatNumber(stock.current_price_yuan, 0)} ¥ /{' '}
                                          <span className='font-semibold text-ca-green'>{formatNumber(stock.current_price_dollar, 2)} $</span>
                                       </TableCell>
                                    )}
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
                  <div className='-mx-2.5 mb-4 flex flex-wrap gap-y-3'>
                     <div className='w-full px-2.5 sm:w-1/2'>
                        <label className='mb-1 block text-xs font-semibold text-ca-heading'>
                           Qabul qiluvchi sklad: <span className='text-ca-red'>*</span>
                        </label>
                        <Combobox
                           value={destination}
                           onChange={(value) => {
                              setDestination(value);
                           }}
                           options={destinationOptions}
                           placeholder='Qabul qiluvchini tanlang'
                           clearable
                        />
                        {headerErrors.destination && <p className='mt-1 text-xs text-ca-red'>{headerErrors.destination}</p>}
                     </div>
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
                           selectedLabel={selectedWarehouse?.logistics_company_name ?? undefined}
                           disabled={!destination}
                           placeholder={destination ? 'Logistikani tanlang' : 'Avval qabul qiluvchini tanlang'}
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
                           selectedLabel={selectedWarehouse?.name}
                           disabled={!logisticsCompany}
                           placeholder={logisticsCompany ? 'Skladni tanlang' : 'Avval logistikani tanlang'}
                           clearable
                        />
                        {headerErrors.logisticsWarehouse && (
                           <p className='mt-1 text-xs text-ca-red'>{headerErrors.logisticsWarehouse}</p>
                        )}
                     </div>
                     {logisticsCompanyId != null && (
                        <div className='flex w-full items-end px-2.5 sm:w-1/2'>
                           <div className='flex h-8.5 items-center gap-2 text-xs whitespace-nowrap text-ca-heading'>
                              Logistikaga qarzim:{' '}
                              <span className='font-bold text-ca-red'>
                                 {logisticsDebtYuan !== null ? `${formatNumber(logisticsDebtYuan, 2)} ¥` : "yuan kursi yo'q"}
                              </span>
                              <span className='text-ca-text'>({formatNumber(logisticsDebtDollar, 2)} $)</span>
                              {canWrite && (
                                 <OpenDialogButton
                                    element={(props) => <Button {...props} />}
                                    elementProps={buttonProps("Qarz to'lash", 'success', 'xs')}
                                    dialog={YuanDebtPayModal}
                                    dialogProps={{
                                       target: { kind: 'logistics' as const, logisticsCompanyId },
                                       name: selectedWarehouse?.logistics_company_name ?? undefined,
                                       currentDebtDollar: Number(logisticsDebtDollar),
                                    }}
                                 />
                              )}
                           </div>
                        </div>
                     )}
                  </div>

                  <div className='mb-2 flex justify-end'>
                     <ColumnVisibilityMenu state={cartCols} />
                  </div>

                  <div className={SCROLL_AREA_CLASS}>
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead className='bg-ca-theme text-white'>#</TableHead>
                              {cartCols.isVisible('size') && <TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>}
                              {cartCols.isVisible('quantity') && <TableHead className='bg-ca-theme text-white'>Soni</TableHead>}
                              {cartCols.isVisible('price_yuan') && <TableHead className='bg-ca-theme text-white'>Narxi (¥)</TableHead>}
                              {cartCols.isVisible('price_dollar') && <TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>}
                              {cartCols.isVisible('total_yuan') && <TableHead className='bg-ca-theme text-white'>Jami (¥)</TableHead>}
                              {cartCols.isVisible('total_dollar') && <TableHead className='bg-ca-theme text-white'>Jami ($)</TableHead>}
                              <TableHead className='bg-ca-theme text-white' />
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {cartQuery.isLoading && (
                              <TableRow>
                                 <TableCell colSpan={cartCols.visibleCount} className='text-center'>
                                    Yuklanmoqda...
                                 </TableCell>
                              </TableRow>
                           )}
                           {!cartQuery.isLoading && cartItems.length === 0 && (
                              <TableRow>
                                 <TableCell colSpan={cartCols.visibleCount} className='text-center'>
                                    {destination ? "Jo'natish savati bo'sh" : 'Avval qabul qiluvchi skladni tanlang'}
                                 </TableCell>
                              </TableRow>
                           )}
                           {cartItems.map((item, index) => {
                              const stock = stockForCartItem(item);
                              return (
                                 <TableRow key={item.id} className='bg-red-50'>
                                    <TableCell>{index + 1}</TableCell>
                                    {cartCols.isVisible('size') && <TableCell>{formatNumber(stock?.warehouse_detail?.size ?? '')}</TableCell>}
                                    {cartCols.isVisible('quantity') && <TableCell>{formatNumber(item.quantity)}</TableCell>}
                                    {cartCols.isVisible('price_yuan') && <TableCell>{formatNumber(item.unit_price_yuan, 0)}</TableCell>}
                                    {cartCols.isVisible('price_dollar') && <TableCell>{formatNumber(item.unit_price_dollar, 2)}</TableCell>}
                                    {cartCols.isVisible('total_yuan') && <TableCell>{formatNumber(item.total_yuan, 0)}</TableCell>}
                                    {cartCols.isVisible('total_dollar') && <TableCell className='font-semibold'>{formatNumber(item.total_dollar, 2)}</TableCell>}
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
                              Jami: <span className='font-bold'>{formatNumber(summary.total_quantity)} </span>
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
                              disabled={!cart || cartItems.length === 0}
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
               cartDispatchDatetime={cart?.dispatch_datetime}
               destinationTypeSklad={cart?.destination_type_sklad ?? destinationId}
               disabled={cartItems.length === 0}
            />
         )}

         {clearCartOpen && cart && (
            <ClearImportCartConfirmModal open={clearCartOpen} setOpen={setClearCartOpen} stage={STAGE} cartId={cart.id} />
         )}

         {selected && destinationId != null && (
            <AddToUzCartModal
               open
               setOpen={(open) => !open && setSelected(null)}
               stock={selected}
               destinationTypeSklad={destinationId}
               dispatchDatetime={toApiDateTime(dispatchValue)}
            />
         )}
      </>
   );
}
