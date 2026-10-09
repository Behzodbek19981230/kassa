import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   FaBoxes,
   FaBoxOpen,
   FaExclamationTriangle,
   FaMoneyBillWave,
   FaTruck,
   FaWarehouse,
} from 'react-icons/fa';
import {
   Button,
   Combobox,
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
import { useImportCartQuery, useTransitStockQuery } from '@/services/two-stage-import/two-stage-import.queries';
import type { TransitStockItem } from '@/services/two-stage-import/two-stage-import.types';
import {
   createLogisticsWarehouseLoader,
   loadBrandOptions,
   createCategoryLoader,
   loadCountryOptions,
   logisticsWarehouseLabel,
} from '@/pages/TwoStageImport/options';
import { useLogisticsWarehouseQuery } from '@/services/logistics-warehouse/logistics-warehouse.queries';
import AddToUzCartModal from '@/pages/TwoStageImport/components/AddToUzCartModal';
import StatCard from '@/pages/TwoStageImport/components/StatCard';
import {
   SCROLL_AREA_CLASS,
   SCROLL_BODY_CLASS,
   SCROLL_PANEL_CLASS,
   formatTashkentDate,
   nowTashkentLocal,
   toApiDateTime,
} from '@/pages/TwoStageImport/utils';

export default function TransitStockPage() {
   const navigate = useNavigate();
   const { canWrite } = useCurrentCompany();

   const [countryFilter, setCountryFilter] = useState('');
   const [logisticsFilter, setLogisticsFilter] = useState('');
   const [brandFilter, setBrandFilter] = useState('');
   const [categoryFilter, setCategoryFilter] = useState('');
   const [selected, setSelected] = useState<TransitStockItem | null>(null);
   const [defaultDispatch] = useState(nowTashkentLocal);

   const countryId = countryFilter ? Number(countryFilter) : undefined;
   const loadWarehouseOptions = useMemo(() => createLogisticsWarehouseLoader(countryId), [countryId]);
   const loadCategoryOptions = useMemo(
      () => createCategoryLoader(brandFilter ? Number(brandFilter) : undefined),
      [brandFilter],
   );

   const stockQuery = useTransitStockQuery(logisticsFilter ? Number(logisticsFilter) : undefined);
   const { data: selectedWarehouse } = useLogisticsWarehouseQuery(logisticsFilter ? Number(logisticsFilter) : undefined);

   const cartQuery = useImportCartQuery('TRANSIT_TO_UZBEKISTAN');
   const dispatchDatetime = cartQuery.data?.cart
      ? cartQuery.data.cart.dispatch_datetime
      : toApiDateTime(defaultDispatch);

   const rows = (stockQuery.data ?? []).filter((stock) => {
      if (countryId && stock.logistics_warehouse_detail?.country !== countryId) return false;
      if (brandFilter && stock.warehouse_detail?.brand !== Number(brandFilter)) return false;
      if (categoryFilter && stock.warehouse_detail?.product_category !== Number(categoryFilter)) return false;
      return true;
   });

   const totals = rows.reduce(
      (acc, stock) => ({
         quantity: acc.quantity + stock.quantity,
         reserved: acc.reserved + stock.reserved_quantity,
         available: acc.available + stock.available_quantity,
         value: acc.value + stock.quantity * Number(stock.current_price_dollar),
      }),
      { quantity: 0, reserved: 0, available: 0, value: 0 },
   );

   function clearFilters() {
      setCountryFilter('');
      setLogisticsFilter('');
      setBrandFilter('');
      setCategoryFilter('');
   }

   return (
      <>
         <PageHeader
            title='Tranzit logistika skladi'
            breadcrumb={[
               { label: 'Asosiy', path: '/' },
               { label: 'Logistika' },
               { label: 'Tranzit logistika skladi', active: true },
            ]}
         />

         <Panel
            title='Tranzit logistika skladi'
            className={SCROLL_PANEL_CLASS}
            bodyClassName={SCROLL_BODY_CLASS}
            onReload={() => stockQuery.refetch()}
            actions={
               canWrite && (
                  <Button
                     type='button'
                     variant='danger'
                     size='xs'
                     onClick={() => navigate('/two-stage-import/transit-dispatch')}
                  >
                     <FaTruck className='mr-1.5' /> O'zbekistonga yuk chiqarish
                  </Button>
               )
            }
         >
            <div className='-mx-2.5 flex flex-wrap'>
               <StatCard icon={<FaBoxes />} label='Jami mahsulot' value={`${formatNumber(totals.quantity)} `} />
               <StatCard
                  icon={<FaBoxOpen />}
                  label='Band qilingan'
                  value={`${formatNumber(totals.reserved)} `}
                  accent='warning'
               />
               <StatCard
                  icon={<FaWarehouse />}
                  label='Mavjud'
                  value={`${formatNumber(totals.available)} `}
                  accent='success'
               />
               <StatCard
                  icon={<FaMoneyBillWave />}
                  label='Jami qiymat'
                  value={`${formatNumber(totals.value, 2)} $`}
                  accent='danger'
               />
            </div>

            <div className='-mx-2.5 mb-4 flex flex-wrap gap-y-3'>
               <div className='w-full px-2.5 sm:w-1/2 xl:w-1/4'>
                  <label className='mb-1 block text-xs font-semibold text-ca-heading'>Davlat:</label>
                  <Combobox
                     value={countryFilter}
                     onChange={(value) => {
                        setCountryFilter(value);
                        setLogisticsFilter('');
                     }}
                     loadOptions={loadCountryOptions}
                     placeholder='Barchasi'
                     clearable
                  />
               </div>
               <div className='w-full px-2.5 sm:w-1/2 xl:w-1/4'>
                  <label className='mb-1 block text-xs font-semibold text-ca-heading'>Logistika skladi:</label>
                  <Combobox
                     value={logisticsFilter}
                     onChange={(value) => setLogisticsFilter(value)}
                     loadOptions={loadWarehouseOptions}
                     selectedLabel={selectedWarehouse ? logisticsWarehouseLabel(selectedWarehouse) : undefined}
                     placeholder='Barchasi'
                     clearable
                  />
               </div>
               <div className='w-full px-2.5 sm:w-1/2 xl:w-1/4'>
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
               <div className='w-full px-2.5 sm:w-1/2 xl:w-1/4'>
                  <label className='mb-1 block text-xs font-semibold text-ca-heading'>Kategoriya:</label>
                  <div className='flex gap-2'>
                     <div className='flex-1'>
                        <Combobox
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
                        disabled={!countryFilter && !logisticsFilter && !brandFilter && !categoryFilter}
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
                        <TableHead className='bg-ca-theme text-white'>Jami soni</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Band</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Mavjud</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Narxi (¥)</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>
                        <TableHead className='bg-ca-theme text-white'>Oxirgi kirim</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {stockQuery.isLoading && (
                        <TableRow>
                           <TableCell colSpan={8} className='text-center'>
                              Yuklanmoqda...
                           </TableCell>
                        </TableRow>
                     )}
                     {!stockQuery.isLoading && stockQuery.isError && (
                        <TableRow>
                           <TableCell colSpan={8} className='text-center text-ca-red'>
                              <FaExclamationTriangle className='mr-1.5 inline' />{' '}
                              {getApiErrorMessage(stockQuery.error, 'Xatolik yuz berdi')}
                           </TableCell>
                        </TableRow>
                     )}
                     {!stockQuery.isLoading && !stockQuery.isError && rows.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={8} className='text-center'>
                              Ma'lumot topilmadi
                           </TableCell>
                        </TableRow>
                     )}
                     {rows.map((stock, index) => (
                        <TableRow key={stock.id} onClick={() => canWrite && stock.available_quantity > 0 && setSelected(stock)} className={canWrite && stock.available_quantity > 0 ? 'cursor-pointer hover:bg-ca-table-hover' : undefined}>
                           <TableCell>{index + 1}</TableCell>
                           <TableCell>{formatNumber(stock.warehouse_detail?.size ?? '')}</TableCell>
                           <TableCell>{formatNumber(stock.quantity)}</TableCell>
                           <TableCell>{formatNumber(stock.reserved_quantity)}</TableCell>
                           <TableCell className='font-semibold text-ca-green'>
                              {formatNumber(stock.available_quantity)}
                           </TableCell>
                           <TableCell>{formatNumber(stock.current_price_yuan, 0)} ¥</TableCell>
                           <TableCell className='font-semibold'>{formatNumber(stock.current_price_dollar, 2)} $</TableCell>
                           <TableCell>{formatTashkentDate(stock.last_arrival_at)}</TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </div>
         </Panel>

         {selected && (
            <AddToUzCartModal
               open
               setOpen={(open) => !open && setSelected(null)}
               stock={selected}
               dispatchDatetime={dispatchDatetime}
            />
         )}
      </>
   );
}
