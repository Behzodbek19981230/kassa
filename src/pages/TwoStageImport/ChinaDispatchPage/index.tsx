import { Fragment, type UIEvent, useMemo, useState } from 'react';
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
import ColumnVisibilityMenu from '@/components/ColumnVisibilityMenu';
import { type ColumnVisibilityDef, useColumnVisibility } from '@/lib/useColumnVisibility';
import { useConsignorQuery } from '@/services/consignor/consignor.queries';
import {
   useChinaProductsQuery,
   useDeleteCartItemMutation,
   useImportCartQuery,
} from '@/services/two-stage-import/two-stage-import.queries';
import { useWarehouseDetailQueries } from '@/services/warehouse/warehouse.queries';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';
import { createCategoryLoader, loadBrandOptions, loadConsignorOptions } from '@/pages/TwoStageImport/options';
import AddToChinaCartModal from '@/pages/TwoStageImport/components/AddToChinaCartModal';
import ChinaDispatchConfirmModal from '@/pages/TwoStageImport/components/ChinaDispatchConfirmModal';
import ClearImportCartConfirmModal from '@/pages/TwoStageImport/components/ClearImportCartConfirmModal';
import {
   SCROLL_AREA_CLASS,
   SCROLL_BODY_CLASS,
   SCROLL_PANEL_CLASS,
   fromApiDateTime,
   nowTashkentLocal,
   toApiDateTime,
} from '@/pages/TwoStageImport/utils';

const PRODUCT_COLUMNS: ColumnVisibilityDef[] = [
   { id: 'index', label: '#', hideable: false },
   { id: 'brand', label: 'Model' },
   { id: 'category', label: 'Nomi' },
   { id: 'size', label: "O'lcham" },
   { id: 'type', label: 'Tip' },
];

const CART_COLUMNS: ColumnVisibilityDef[] = [
   { id: 'index', label: '#', hideable: false },
   { id: 'brand', label: 'Model' },
   { id: 'category', label: 'Nomi' },
   { id: 'size', label: "O'lcham" },
   { id: 'type', label: 'Tip' },
   { id: 'type_quantity', label: 'Tip dona' },
   { id: 'price_yuan', label: 'Narxi (¥)' },
   { id: 'price_dollar', label: 'Narxi ($)' },
   { id: 'quantity', label: 'Soni' },
   { id: 'total_dollar', label: 'Jami ($)' },
   { id: 'actions', label: '', hideable: false },
];

const STAGE = 'CHINA_TO_TRANSIT' as const;

export default function ChinaDispatchPage() {
   const { canWrite } = useCurrentCompany();
   const productCols = useColumnVisibility('logistics-china-products', PRODUCT_COLUMNS);
   const cartCols = useColumnVisibility('logistics-china-cart', CART_COLUMNS);
   const { notify } = useNotification();

   const [brandFilter, setBrandFilter] = useState('');
   const [categoryFilter, setCategoryFilter] = useState('');
   const [consignorInput, setConsignorInput] = useState('');
   const [dispatchInput, setDispatchInput] = useState('');
   const [defaultDispatch] = useState(nowTashkentLocal);
   const [selectedProduct, setSelectedProduct] = useState<WarehouseAllListItem | null>(null);
   const [confirmOpen, setConfirmOpen] = useState(false);
   const [clearCartOpen, setClearCartOpen] = useState(false);

   const brandId = brandFilter ? Number(brandFilter) : undefined;
   const loadCategoryOptions = useMemo(() => createCategoryLoader(brandId), [brandId]);

   const productsQuery = useChinaProductsQuery({
      brand: brandId,
      product_category: categoryFilter ? Number(categoryFilter) : undefined,
   });
   const productGroups = productsQuery.data ?? [];
   const products = productGroups.flatMap((group) => group.product_categories.flatMap((category) => category.warehouses));
   const rowNumbers = new Map(products.map((row, index) => [row.id, index + 1]));

   // Each consignor has its own cart, so nothing is loaded until one is chosen.
   const consignorValue = consignorInput;
   const cartQuery = useImportCartQuery(
      { stage: STAGE, consignor: consignorValue ? Number(consignorValue) : undefined },
      Boolean(consignorValue),
   );
   const cart = cartQuery.data?.cart ?? null;
   const cartItems = cartQuery.data?.items ?? [];
   const summary = cartQuery.data?.summary;

   // Cart items only carry a warehouse id, so their names come from the detail of each id.
   const cartWarehouseIds = [...new Set(cartItems.flatMap((item) => (item.warehouse != null ? [item.warehouse] : [])))];
   const cartWarehouseQueries = useWarehouseDetailQueries(cartWarehouseIds);
   const cartWarehouseById = new Map(cartWarehouseIds.map((id, index) => [id, cartWarehouseQueries[index]?.data] as const));

   // The consignor's cart keeps the dispatch time of its open import, so it's prefilled from it.
   const dispatchValue = dispatchInput || (cart ? fromApiDateTime(cart.dispatch_datetime) : defaultDispatch);
   const canPick = canWrite && Boolean(consignorValue) && Boolean(dispatchValue);

   const { data: selectedConsignor } = useConsignorQuery(consignorValue ? Number(consignorValue) : undefined);
   const deleteCartItemMutation = useDeleteCartItemMutation();

   function handleRemoveCartItem(id: number) {
      deleteCartItemMutation.mutate(id, {
         onError: (err) =>
            notify({ title: "O'chirishda xatolik", text: getApiErrorMessage(err, "Mahsulotni savatdan o'chirib bo'lmadi") }),
      });
   }

   function handleProductsScroll(e: UIEvent<HTMLDivElement>) {
      const el = e.currentTarget;
      if (
         productsQuery.hasNextPage &&
         !productsQuery.isFetchingNextPage &&
         el.scrollTop + el.clientHeight >= el.scrollHeight - 40
      ) {
         productsQuery.fetchNextPage();
      }
   }

   function clearFilters() {
      setBrandFilter('');
      setCategoryFilter('');
   }

   return (
      <>
         <PageHeader
            title='Xitoydan yuk chiqarish'
            breadcrumb={[
               { label: 'Asosiy', path: '/' },
               { label: 'Logistika' },
               { label: 'Xitoydan yuk chiqarish', active: true },
            ]}
         />

         <div className='-mx-2.5 flex flex-wrap'>
            <div className='w-full px-2.5 lg:w-1/2'>
               <Panel
                  title='Ombordagi mahsulotlar'
                  onReload={() => productsQuery.refetch()}
                  className={SCROLL_PANEL_CLASS}
                  bodyClassName={SCROLL_BODY_CLASS}
               >
                  <div className='-mx-2.5 mb-4 flex flex-wrap items-end gap-y-3'>
                     <div className='w-full px-2.5 sm:w-1/3'>
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
                     <div className='w-full px-2.5 sm:w-1/3'>
                        <label className='mb-1 block text-xs font-semibold text-ca-heading'>Kategoriya:</label>
                        <Combobox
                           value={categoryFilter}
                           onChange={(value) => setCategoryFilter(value)}
                           loadOptions={loadCategoryOptions}
                           disabled={!brandFilter}
                           placeholder={brandFilter ? 'Kategoriyani tanlang' : 'Avval modelni tanlang'}
                           clearable
                        />
                     </div>
                     <div className='w-full px-2.5 sm:w-auto'>
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

                  <div className='mb-2 flex justify-end'>
                     <ColumnVisibilityMenu state={productCols} />
                  </div>

                  <div className={SCROLL_AREA_CLASS} onScroll={handleProductsScroll}>
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead className='bg-ca-theme text-white'>#</TableHead>
                              {productCols.isVisible('brand') && <TableHead className='bg-ca-theme text-white'>Model</TableHead>}
                              {productCols.isVisible('category') && <TableHead className='bg-ca-theme text-white'>Nomi</TableHead>}
                              {productCols.isVisible('size') && <TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>}
                              {productCols.isVisible('type') && <TableHead className='bg-ca-theme text-white'>Tip</TableHead>}
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {productsQuery.isLoading && (
                              <TableRow>
                                 <TableCell colSpan={productCols.visibleCount} className='text-center'>
                                    Yuklanmoqda...
                                 </TableCell>
                              </TableRow>
                           )}
                           {productsQuery.isError && (
                              <TableRow>
                                 <TableCell colSpan={productCols.visibleCount} className='text-center text-ca-red'>
                                    <FaExclamationTriangle className='mr-1.5 inline' />{' '}
                                    {getApiErrorMessage(productsQuery.error, 'Xatolik yuz berdi')}
                                 </TableCell>
                              </TableRow>
                           )}
                           {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && (
                              <TableRow>
                                 <TableCell colSpan={productCols.visibleCount} className='text-center'>
                                    Ma'lumot topilmadi
                                 </TableCell>
                              </TableRow>
                           )}
                           {productGroups.map((group) => (
                              <Fragment key={group.brand.id}>
                                 <TableRow>
                                    <TableCell colSpan={productCols.visibleCount} className='bg-cyan-100 font-bold text-ca-red dark:bg-cyan-950/60 dark:text-red-400'>
                                       {group.brand.name}
                                    </TableCell>
                                 </TableRow>
                                 {group.product_categories
                                    .flatMap((category) => category.warehouses)
                                    .map((row) => (
                                       <TableRow key={row.id} onClick={() => canPick && setSelectedProduct(row)} className={canPick ? 'cursor-pointer bg-red-50 hover:bg-red-100' : 'cursor-not-allowed bg-red-50 opacity-60'}>
                                          <TableCell>{rowNumbers.get(row.id)}</TableCell>
                                          {productCols.isVisible('brand') && <TableCell>{row.brand_name}</TableCell>}
                                          {productCols.isVisible('category') && <TableCell>{row.product_category_name}</TableCell>}
                                          {productCols.isVisible('size') && <TableCell>{formatNumber(row.size)}</TableCell>}
                                          {productCols.isVisible('type') && <TableCell>{row.type_name ?? ''}</TableCell>}
                                       </TableRow>
                                    ))}
                              </Fragment>
                           ))}
                           {productsQuery.isFetchingNextPage && (
                              <TableRow>
                                 <TableCell colSpan={productCols.visibleCount} className='text-center'>
                                    Yuklanmoqda...
                                 </TableCell>
                              </TableRow>
                           )}
                        </TableBody>
                     </Table>
                  </div>
               </Panel>
            </div>

            <div className='w-full px-2.5 lg:w-1/2'>
               <Panel
                  title='Import savatchasi'
                  onReload={() => cartQuery.refetch()}
               >
                  <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
                     <div>
                        <label className='mb-1 block text-xs font-semibold text-ca-heading'>Yuk jo'natuvchi:</label>
                        <Combobox
                           value={consignorValue}
                           onChange={(value) => {
                              setConsignorInput(value);
                              // A different consignor means a different cart — show that cart's dispatch time.
                              setDispatchInput('');
                           }}
                           loadOptions={loadConsignorOptions}
                           selectedLabel={selectedConsignor?.name}
                           placeholder="Yuk jo'natuvchini tanlang"
                        />
                     </div>
                     <div>
                        <label className='mb-1 block text-xs font-semibold text-ca-heading'>Yuk chiqish vaqti:</label>
                        {/* Only the date is picked; the time stays as the default / cart value. */}
                        <DatePicker
                           value={dispatchValue}
                           onChange={(date) => setDispatchInput(date ? `${date}T${dispatchValue.slice(11, 16)}` : '')}
                        />
                     </div>
                  </div>

                  <div className='mb-2 flex justify-end'>
                     <ColumnVisibilityMenu state={cartCols} />
                  </div>

                  <div className=' overflow-auto [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10'>
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead className='bg-ca-theme text-white'>#</TableHead>
                              {cartCols.isVisible('brand') && <TableHead className='bg-ca-theme text-white'>Model</TableHead>}
                              {cartCols.isVisible('category') && <TableHead className='bg-ca-theme text-white'>Nomi</TableHead>}
                              {cartCols.isVisible('size') && <TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>}
                              {cartCols.isVisible('type') && <TableHead className='bg-ca-theme text-white'>Tip</TableHead>}
                              {cartCols.isVisible('type_quantity') && <TableHead className='bg-ca-theme text-white'>Tip dona</TableHead>}
                              {cartCols.isVisible('price_yuan') && <TableHead className='bg-ca-theme text-white'>Narxi (¥)</TableHead>}
                              {cartCols.isVisible('price_dollar') && <TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>}
                              {cartCols.isVisible('quantity') && <TableHead className='bg-ca-theme text-white'>Soni</TableHead>}
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
                           {!consignorValue && (
                              <TableRow>
                                 <TableCell colSpan={cartCols.visibleCount} className='text-center'>
                                    Avval yuk jo'natuvchini tanlang
                                 </TableCell>
                              </TableRow>
                           )}
                           {consignorValue && !cartQuery.isLoading && cartItems.length === 0 && (
                              <TableRow>
                                 <TableCell colSpan={cartCols.visibleCount} className='text-center'>
                                    Import savati bo'sh
                                 </TableCell>
                              </TableRow>
                           )}
                           {cartItems.map((item, index) => {
                              const row = item.warehouse != null ? cartWarehouseById.get(item.warehouse) : undefined;
                              return (
                                 <TableRow key={item.id} className='bg-red-50'>
                                    <TableCell>{index + 1}</TableCell>
                                    {cartCols.isVisible('brand') && <TableCell>{row?.brand_detail?.name ?? '-'}</TableCell>}
                                    {cartCols.isVisible('category') && <TableCell>{row?.product_category_detail?.name ?? '-'}</TableCell>}
                                    {cartCols.isVisible('size') && <TableCell>{formatNumber(row?.size ?? '')}</TableCell>}
                                    {cartCols.isVisible('type') && <TableCell>{row?.type_detail?.name ?? ''}</TableCell>}
                                    {cartCols.isVisible('type_quantity') && <TableCell>{formatNumber(item.type_quantity, 2)}</TableCell>}
                                    {cartCols.isVisible('price_yuan') && <TableCell>{formatNumber(item.unit_price_yuan, 0)}</TableCell>}
                                    {cartCols.isVisible('price_dollar') && (
                                       <TableCell className='font-semibold text-ca-green'>
                                          {formatNumber(item.unit_price_dollar, 2)} $
                                       </TableCell>
                                    )}
                                    {cartCols.isVisible('quantity') && <TableCell>{formatNumber(item.quantity)}</TableCell>}
                                    {cartCols.isVisible('total_dollar') && <TableCell className='font-semibold'>{formatNumber(item.total_dollar, 2)} $</TableCell>}
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
                  </div>

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
                     <div className='mt-4 flex gap-2'>
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
                           disabled={!cart || cartItems.length === 0}
                           onClick={() => setConfirmOpen(true)}
                        >
                           Davom etish
                        </Button>
                     </div>
                  )}
               </Panel>
            </div>
         </div>

         {selectedProduct && consignorValue && (
            <AddToChinaCartModal
               open={Boolean(selectedProduct)}
               setOpen={(open) => !open && setSelectedProduct(null)}
               product={selectedProduct}
               consignorId={Number(consignorValue)}
               dispatchDatetime={toApiDateTime(dispatchValue)}
            />
         )}

         {clearCartOpen && cart && (
            <ClearImportCartConfirmModal open={clearCartOpen} setOpen={setClearCartOpen} stage={STAGE} cartId={cart.id} />
         )}

         {confirmOpen && cart && summary && (
            <ChinaDispatchConfirmModal open={confirmOpen} setOpen={setConfirmOpen} cart={cart} summary={summary} />
         )}
      </>
   );
}
