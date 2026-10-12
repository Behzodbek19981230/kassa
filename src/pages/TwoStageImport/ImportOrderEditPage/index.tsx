import { isAxiosError } from 'axios';
import { useMemo, useState } from 'react';
import { FaArrowLeft, FaExclamationTriangle, FaSave, FaSyncAlt, FaTrash } from 'react-icons/fa';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
   Button,
   Combobox,
   DatePicker,
   FormField,
   Input,
   InputGroup,
   PageHeader,
   Panel,
   PriceInput,
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
   Textarea,
   Tooltip,
   useNotification,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useConsignorQuery } from '@/services/consignor/consignor.queries';
import { useLogisticsCompanyQuery } from '@/services/logistics-company/logistics-company.queries';
import { useLogisticsWarehouseQuery } from '@/services/logistics-warehouse/logistics-warehouse.queries';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import {
   useRouteOrderEditQuery,
   useTransitStockQuery,
   useUpdateRouteOrderMutation,
} from '@/services/two-stage-import/two-stage-import.queries';
import type {
   ImportStage,
   RouteOrderEditItemPayload,
   RouteOrderEditPayload,
   RouteOrderEditResponse,
} from '@/services/two-stage-import/two-stage-import.types';
import YuanRateHint from '@/pages/TwoStageImport/components/YuanRateHint';
import {
   createLogisticsWarehouseLoader,
   loadConsignorOptions,
   loadLogisticsCompanyOptions,
   logisticsWarehouseLabel,
} from '@/pages/TwoStageImport/options';
import { useWarehouseCatalog } from '@/pages/TwoStageImport/useWarehouseCatalog';
import { useYuanDollarConversion } from '@/pages/TwoStageImport/useYuanDollarConversion';
import { fromApiDateTime, STAGE_LABELS, toApiDateTime } from '@/pages/TwoStageImport/utils';

const HEAD_CLASS = 'bg-ca-theme text-white';
const loadWarehouseOptions = createLogisticsWarehouseLoader();

interface EditRow {
   key: string;
   /** Present for rows that already belong to the order; new rows are sent without it. */
   id?: number;
   warehouse: number;
   sourceImportWarehouse?: number;
   name: { brand: string; category: string; size: string; type: string };
   typeQuantity: string;
   quantity: string;
   priceYuan: string;
   priceDollar: string;
   totalYuan: string;
   totalDollar: string;
}

interface HeaderValues {
   consignor: string;
   carrierLogistics: string;
   destinationLogisticsWarehouse: string;
   sourceLogisticsWarehouse: string;
   destinationTypeSklad: string;
   orderDatetime: string;
   exchangeRate: string;
   truckNumber: string;
   driverPhone: string;
   servicePriceYuan: string;
   servicePriceDollar: string;
   weightKg: string;
   volumeM3: string;
   note: string;
}

const idString = (value: number | null) => (value != null ? String(value) : '');
const decimalString = (value: string | null) => (value != null ? String(Number(value)) : '');

// The backend stores whatever totals it gets, so the frontend owns the math: line total = soni × narx.
function lineTotal(quantity: string, price: string) {
   const total = (Number(quantity) || 0) * (Number(price) || 0);
   return total.toFixed(2);
}

let newRowCounter = 0;

function parseStage(value: string | null): ImportStage | undefined {
   return value === 'CHINA_TO_TRANSIT' || value === 'TRANSIT_TO_UZBEKISTAN' ? value : undefined;
}

export default function ImportOrderEditPage() {
   const { id } = useParams();
   const orderId = id ? Number(id) : undefined;
   const [searchParams] = useSearchParams();
   const stage = parseStage(searchParams.get('stage'));
   const navigate = useNavigate();

   const editQuery = useRouteOrderEditQuery(stage, orderId);
   const data = editQuery.data;

   const title = data ? `Buyurtmani tahrirlash — ${data.order.order_number}` : 'Buyurtmani tahrirlash';

   let body;
   if (!stage) {
      body = <Message text="Buyurtma yo'nalishi noma'lum. Ro'yxatdan qayta oching." />;
   } else if (editQuery.isLoading) {
      body = <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
   } else if (editQuery.isError || !data) {
      body = <Message text={getApiErrorMessage(editQuery.error, 'Buyurtma topilmadi')} />;
   } else if (!data.can_edit) {
      body = <Message text="Bu buyurtmani tahrirlab bo'lmaydi: faqat Qoralama va Yo'ldagi buyurtmalar tahrirlanadi." />;
   } else {
      // Keyed by updated_time: after a 409 reload the form starts over from the fresh server state.
      body = (
         <OrderEditForm
            key={data.order.updated_time}
            stage={stage}
            data={data}
            onReload={() => editQuery.refetch()}
            onDone={() => navigate('/two-stage-import/orders')}
         />
      );
   }

   return (
      <>
         <PageHeader
            title={title}
            breadcrumb={[
               { label: 'Asosiy', path: '/' },
               { label: 'Logistika' },
               { label: 'Import buyurtmalar', path: '/two-stage-import/orders' },
               { label: 'Tahrirlash', active: true },
            ]}
         />
         <div className='mb-3'>
            <Button type='button' variant='white' size='xs' onClick={() => navigate('/two-stage-import/orders')}>
               <FaArrowLeft className='mr-1.5' /> Orqaga qaytish
            </Button>
         </div>
         {body}
      </>
   );
}

function Message({ text }: { text: string }) {
   return (
      <div className='flex items-center justify-center gap-2 rounded-[3px] bg-ca-silver-light p-5 text-ca-red'>
         <FaExclamationTriangle /> {text}
      </div>
   );
}

interface OrderEditFormProps {
   stage: ImportStage;
   data: RouteOrderEditResponse;
   onReload: () => void;
   onDone: () => void;
}

function OrderEditForm({ stage, data, onReload, onDone }: OrderEditFormProps) {
   const isChina = stage === 'CHINA_TO_TRANSIT';
   const { canWrite } = useCurrentCompany();
   const { notify } = useNotification();
   const { yuanToDollar, dollarToYuan } = useYuanDollarConversion();
   const updateMutation = useUpdateRouteOrderMutation();

   const { order } = data;
   const [header, setHeader] = useState<HeaderValues>(() => ({
      consignor: idString(order.consignor),
      carrierLogistics: idString(order.carrier_logistics),
      destinationLogisticsWarehouse: idString(order.destination_logistics_warehouse),
      sourceLogisticsWarehouse: idString(order.source_logistics_warehouse),
      destinationTypeSklad: idString(order.destination_type_sklad),
      orderDatetime: order.order_datetime ? fromApiDateTime(order.order_datetime) : '',
      exchangeRate: decimalString(order.exchange_rate),
      truckNumber: order.truck_number ?? '',
      driverPhone: order.driver_phone ?? '',
      servicePriceYuan: decimalString(order.service_price_yuan),
      servicePriceDollar: decimalString(order.service_price_dollar),
      weightKg: decimalString(order.weight_kg),
      volumeM3: decimalString(order.volume_m3),
      note: order.note ?? '',
   }));
   const [rows, setRows] = useState<EditRow[]>(() =>
      data.items.map((item) => ({
         key: `item-${item.id}`,
         id: item.id,
         warehouse: item.warehouse,
         sourceImportWarehouse: item.source_import_warehouse ?? undefined,
         name: {
            brand: item.brand_snapshot ?? '',
            category: item.category_snapshot ?? '',
            size: item.size_snapshot ? formatNumber(item.size_snapshot) : '',
            type: item.type_snapshot ?? '',
         },
         typeQuantity: String(Number(item.type_quantity)),
         quantity: String(item.quantity),
         priceYuan: String(Number(item.unit_price_yuan)),
         priceDollar: String(Number(item.unit_price_dollar)),
         totalYuan: item.total_yuan,
         totalDollar: item.total_dollar,
      })),
   );
   const [formError, setFormError] = useState('');
   const [conflict, setConflict] = useState(false);

   const set = <K extends keyof HeaderValues>(field: K, value: HeaderValues[K]) =>
      setHeader((prev) => ({ ...prev, [field]: value }));

   // Names for the prefilled comboboxes (they only know labels of options they have loaded).
   const { data: consignor } = useConsignorQuery(isChina && header.consignor ? Number(header.consignor) : undefined);
   const { data: carrier } = useLogisticsCompanyQuery(header.carrierLogistics ? Number(header.carrierLogistics) : undefined);
   const { data: destinationWarehouse } = useLogisticsWarehouseQuery(
      isChina && header.destinationLogisticsWarehouse ? Number(header.destinationLogisticsWarehouse) : undefined,
   );
   const { data: sourceWarehouse } = useLogisticsWarehouseQuery(
      !isChina && header.sourceLogisticsWarehouse ? Number(header.sourceLogisticsWarehouse) : undefined,
   );
   const { data: skladTypes } = useSkladTypeListQuery({ limit: 200 });
   const skladTypeOptions = (skladTypes?.results ?? []).map((t) => ({ value: String(t.id), label: t.name }));

   // New rows: China picks any catalog product; Uzbekistan picks a stock line of the source transit warehouse.
   const catalog = useWarehouseCatalog();
   const sourceId = !isChina && header.sourceLogisticsWarehouse ? Number(header.sourceLogisticsWarehouse) : undefined;
   const stockQuery = useTransitStockQuery(sourceId);
   const addOptions = useMemo(() => {
      if (isChina) {
         return [...catalog.byId.values()].map((w) => ({
            value: String(w.id),
            label: [w.brand_name, w.product_category_name, formatNumber(w.size), w.type_name].filter(Boolean).join(' · '),
         }));
      }
      return (stockQuery.data ?? [])
         .filter((s) => sourceId == null || s.logistics_warehouse === sourceId)
         .map((s) => ({
            value: String(s.id),
            label: `${[
               s.warehouse_detail?.brand_name,
               s.warehouse_detail?.product_category_name,
               formatNumber(s.warehouse_detail?.size ?? ''),
               s.warehouse_detail?.type_name,
            ]
               .filter(Boolean)
               .join(' · ')} (mavjud: ${formatNumber(s.available_quantity)})`,
         }));
   }, [isChina, catalog.byId, stockQuery.data, sourceId]);

   function addRow(value: string) {
      if (!value) return;
      const key = `new-${++newRowCounter}`;
      if (isChina) {
         const w = catalog.byId.get(Number(value));
         if (!w) return;
         setRows((prev) => [
            ...prev,
            {
               key,
               warehouse: w.id,
               name: {
                  brand: w.brand_name,
                  category: w.product_category_name,
                  size: formatNumber(w.size),
                  type: w.type_name ?? '',
               },
               typeQuantity: '1',
               quantity: '',
               priceYuan: '',
               priceDollar: '',
               totalYuan: '0.00',
               totalDollar: '0.00',
            },
         ]);
         return;
      }
      const s = (stockQuery.data ?? []).find((stock) => stock.id === Number(value));
      if (!s) return;
      // Uzbekistan prices and tip dona come from the transit stock line.
      setRows((prev) => [
         ...prev,
         {
            key,
            warehouse: s.warehouse,
            sourceImportWarehouse: s.id,
            name: {
               brand: s.warehouse_detail?.brand_name ?? '',
               category: s.warehouse_detail?.product_category_name ?? '',
               size: formatNumber(s.warehouse_detail?.size ?? ''),
               type: s.warehouse_detail?.type_name ?? '',
            },
            typeQuantity: String(Number(s.current_type_quantity)),
            quantity: '',
            priceYuan: String(Number(s.current_price_yuan)),
            priceDollar: String(Number(s.current_price_dollar)),
            totalYuan: '0.00',
            totalDollar: '0.00',
         },
      ]);
   }

   function updateRow(key: string, patch: Partial<EditRow>) {
      setRows((prev) =>
         prev.map((row) => {
            if (row.key !== key) return row;
            const next = { ...row, ...patch };
            return {
               ...next,
               totalYuan: lineTotal(next.quantity, next.priceYuan),
               totalDollar: lineTotal(next.quantity, next.priceDollar),
            };
         }),
      );
   }

   function changeRowPrice(row: EditRow, currency: 'yuan' | 'dollar', value: string) {
      if (currency === 'yuan') {
         const dollar = yuanToDollar(value);
         updateRow(row.key, { priceYuan: value, ...(dollar !== null && { priceDollar: dollar }) });
      } else {
         const yuan = dollarToYuan(value);
         updateRow(row.key, { priceDollar: value, ...(yuan !== null && { priceYuan: yuan }) });
      }
   }

   const totals = rows.reduce(
      (acc, row) => ({
         quantity: acc.quantity + (Number(row.quantity) || 0),
         yuan: acc.yuan + Number(row.totalYuan),
         dollar: acc.dollar + Number(row.totalDollar),
      }),
      { quantity: 0, yuan: 0, dollar: 0 },
   );

   function validate(): string {
      if (isChina) {
         if (!header.consignor) return "Yuk jo'natuvchini tanlang";
         if (!header.destinationLogisticsWarehouse) return 'Qabul qiluvchi logistika skladini tanlang';
         if (!(Number(header.exchangeRate) > 0)) return 'Dollar kursini kiriting';
      } else {
         if (!header.sourceLogisticsWarehouse) return "Jo'natuvchi tranzit skladni tanlang";
         if (!header.destinationTypeSklad) return 'Qabul qiluvchi skladni tanlang';
         if (!header.driverPhone.trim()) return 'Haydovchi telefonini kiriting';
      }
      if (!header.carrierLogistics) return 'Tashuvchi logistikani tanlang';
      if (!header.orderDatetime) return 'Sanani tanlang';
      if (!header.truckNumber.trim()) return 'Fura raqamini kiriting';
      if (rows.length === 0) return "Kamida bitta mahsulot bo'lishi kerak";
      for (const row of rows) {
         const label = `${row.name.brand} ${row.name.category}`.trim();
         const qty = Number(row.quantity);
         if (!Number.isInteger(qty) || qty <= 0) return `${label}: soni 0 dan katta butun son bo'lishi kerak`;
         if (!(Number(row.typeQuantity) > 0)) return `${label}: tip donani kiriting`;
         if (row.priceYuan === '' || row.priceDollar === '') return `${label}: narxni kiriting`;
      }
      return '';
   }

   async function handleSave() {
      setFormError('');
      setConflict(false);
      const error = validate();
      if (error) {
         setFormError(error);
         return;
      }

      const items: RouteOrderEditItemPayload[] = rows.map((row) => ({
         ...(row.id != null && { id: row.id }),
         warehouse: row.warehouse,
         ...(!isChina && row.sourceImportWarehouse != null && { source_import_warehouse: row.sourceImportWarehouse }),
         type_quantity: Number(row.typeQuantity).toFixed(4),
         quantity: Number(row.quantity),
         unit_price_yuan: Number(row.priceYuan).toFixed(2),
         unit_price_dollar: Number(row.priceDollar).toFixed(2),
         total_yuan: row.totalYuan,
         total_dollar: row.totalDollar,
      }));
      const common = {
         expected_updated_time: order.updated_time,
         carrier_logistics: Number(header.carrierLogistics),
         order_datetime: toApiDateTime(header.orderDatetime),
         truck_number: header.truckNumber.trim(),
         total_quantity: totals.quantity,
         total_yuan: totals.yuan.toFixed(2),
         total_dollar: totals.dollar.toFixed(2),
         service_price_yuan: (Number(header.servicePriceYuan) || 0).toFixed(2),
         service_price_dollar: (Number(header.servicePriceDollar) || 0).toFixed(2),
         weight_kg: (Number(header.weightKg) || 0).toFixed(3),
         volume_m3: (Number(header.volumeM3) || 0).toFixed(4),
         note: header.note.trim(),
         items,
      };
      const payload: RouteOrderEditPayload = isChina
         ? {
              ...common,
              consignor: Number(header.consignor),
              destination_logistics_warehouse: Number(header.destinationLogisticsWarehouse),
              exchange_rate: Number(header.exchangeRate).toFixed(2),
           }
         : {
              ...common,
              source_logistics_warehouse: Number(header.sourceLogisticsWarehouse),
              destination_type_sklad: Number(header.destinationTypeSklad),
              driver_phone: header.driverPhone.trim(),
           };

      try {
         await updateMutation.mutateAsync({ stage, orderId: order.id, payload });
         notify({ title: 'Buyurtma saqlandi', text: order.order_number });
         onDone();
      } catch (err) {
         if (isAxiosError(err) && err.response?.status === 409) {
            setConflict(true);
            return;
         }
         setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
      }
   }

   const debts = data.debts;
   // Existing Uzbekistan rows point at stock lines of the original transit warehouse.
   const sourceChanged =
      !isChina &&
      header.sourceLogisticsWarehouse !== idString(order.source_logistics_warehouse) &&
      rows.some((row) => row.id != null);

   return (
      <>
         {conflict && (
            <div className='mb-3 flex flex-wrap items-center justify-between gap-2 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
               <span className='flex items-center gap-1.5 font-semibold'>
                  <FaExclamationTriangle /> Buyurtma siz ochganingizdan keyin o'zgartirilgan. Qayta yuklab, tahrirni
                  takrorlang.
               </span>
               <Button type='button' variant='danger' size='xs' onClick={onReload}>
                  <FaSyncAlt className='mr-1.5' /> Qayta yuklash
               </Button>
            </div>
         )}
         {formError && (
            <div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
               {formError}
            </div>
         )}

         <Panel title={`${STAGE_LABELS[stage]} — ${order.order_number}`}>
            <div className='grid grid-cols-1 gap-x-4 sm:grid-cols-2 xl:grid-cols-4'>
               {isChina ? (
                  <>
                     <FormField label="Yuk jo'natuvchi" required horizontal={false} className='mb-3'>
                        <Combobox
                           value={header.consignor}
                           onChange={(v) => set('consignor', v)}
                           loadOptions={loadConsignorOptions}
                           selectedLabel={consignor?.name}
                           placeholder='Tanlang...'
                        />
                     </FormField>
                     <FormField label='Qabul qiluvchi logistika skladi' required horizontal={false} className='mb-3'>
                        <Combobox
                           value={header.destinationLogisticsWarehouse}
                           onChange={(v) => set('destinationLogisticsWarehouse', v)}
                           loadOptions={loadWarehouseOptions}
                           selectedLabel={destinationWarehouse ? logisticsWarehouseLabel(destinationWarehouse) : undefined}
                           placeholder='Tanlang...'
                        />
                     </FormField>
                     <FormField label="Dollar kursi (so'm)" required horizontal={false} className='mb-3'>
                        <PriceInput value={header.exchangeRate} onChange={(v) => set('exchangeRate', v)} />
                     </FormField>
                  </>
               ) : (
                  <>
                     <FormField label="Jo'natuvchi tranzit sklad" required horizontal={false} className='mb-3'>
                        <Combobox
                           value={header.sourceLogisticsWarehouse}
                           onChange={(v) => set('sourceLogisticsWarehouse', v)}
                           loadOptions={loadWarehouseOptions}
                           selectedLabel={sourceWarehouse ? logisticsWarehouseLabel(sourceWarehouse) : undefined}
                           placeholder='Tanlang...'
                        />
                     </FormField>
                     <FormField label='Qabul qiluvchi sklad' required horizontal={false} className='mb-3'>
                        <Combobox
                           value={header.destinationTypeSklad}
                           onChange={(v) => set('destinationTypeSklad', v)}
                           options={skladTypeOptions}
                           placeholder='Tanlang...'
                        />
                     </FormField>
                     <FormField label='Haydovchi telefoni' required horizontal={false} className='mb-3'>
                        <Input value={header.driverPhone} onChange={(e) => set('driverPhone', e.target.value)} />
                     </FormField>
                  </>
               )}
               <FormField label='Tashuvchi logistika' required horizontal={false} className='mb-3'>
                  <Combobox
                     value={header.carrierLogistics}
                     onChange={(v) => set('carrierLogistics', v)}
                     loadOptions={loadLogisticsCompanyOptions}
                     selectedLabel={carrier?.name}
                     placeholder='Tanlang...'
                  />
               </FormField>
               <FormField label='Sana' required horizontal={false} className='mb-3'>
                  {/* Only the date is picked; the time of day is kept from the order. */}
                  <DatePicker
                     value={header.orderDatetime}
                     onChange={(date) =>
                        set('orderDatetime', date ? `${date}T${header.orderDatetime.slice(11, 16) || '00:00'}` : '')
                     }
                  />
               </FormField>
               <FormField label='Fura raqami' required horizontal={false} className='mb-3'>
                  <Input value={header.truckNumber} onChange={(e) => set('truckNumber', e.target.value)} />
               </FormField>
               <FormField label="Og'irlik (kg)" horizontal={false} className='mb-3'>
                  <Input
                     type='number'
                     inputMode='decimal'
                     min={0}
                     step='0.001'
                     value={header.weightKg}
                     onChange={(e) => set('weightKg', e.target.value)}
                  />
               </FormField>
               <FormField label='Hajm (m³)' horizontal={false} className='mb-3'>
                  <Input
                     type='number'
                     inputMode='decimal'
                     min={0}
                     step='0.0001'
                     value={header.volumeM3}
                     onChange={(e) => set('volumeM3', e.target.value)}
                  />
               </FormField>
               <FormField label='Xizmat narxi (¥)' horizontal={false} className='mb-3'>
                  <InputGroup prepend='¥'>
                     <PriceInput
                        value={header.servicePriceYuan}
                        onChange={(v) => {
                           const dollar = yuanToDollar(v);
                           setHeader((prev) => ({
                              ...prev,
                              servicePriceYuan: v,
                              ...(dollar !== null && { servicePriceDollar: dollar }),
                           }));
                        }}
                     />
                  </InputGroup>
                  <YuanRateHint />
               </FormField>
               <FormField label='Xizmat narxi ($)' horizontal={false} className='mb-3'>
                  <InputGroup prepend='$'>
                     <PriceInput
                        value={header.servicePriceDollar}
                        onChange={(v) => {
                           const yuan = dollarToYuan(v);
                           setHeader((prev) => ({
                              ...prev,
                              servicePriceDollar: v,
                              ...(yuan !== null && { servicePriceYuan: yuan }),
                           }));
                        }}
                     />
                  </InputGroup>
               </FormField>
               <div className='sm:col-span-2 xl:col-span-4'>
                  <FormField label='Izoh' horizontal={false} className='mb-3'>
                     <Textarea rows={2} value={header.note} onChange={(e) => set('note', e.target.value)} />
                  </FormField>
               </div>
            </div>

            {(debts.my_total_debt || debts.logistics_debt) && (
               <div className='flex flex-wrap gap-4 rounded-[3px] bg-ca-silver px-3 py-2 text-xs'>
                  {debts.my_total_debt && (
                     <span>
                        Yuk jo'natuvchiga qarz:{' '}
                        <b className='text-ca-red'>{formatNumber(debts.my_total_debt.total_debt, 2)} $</b>
                     </span>
                  )}
                  {debts.logistics_debt && (
                     <span>
                        Logistikaga qarz: <b className='text-ca-red'>{formatNumber(debts.logistics_debt.total_debt, 2)} $</b>
                     </span>
                  )}
                  <span className='text-ca-text'>Saqlanganda qarzlar backendda qayta hisoblanadi.</span>
               </div>
            )}
         </Panel>

         <Panel title='Mahsulotlar'>
            {canWrite && (
               <div className='mb-3 max-w-xl'>
                  <label className='mb-1 block text-xs font-semibold text-ca-heading'>Mahsulot qo'shish:</label>
                  <Combobox
                     key={rows.length}
                     value=''
                     onChange={addRow}
                     options={addOptions}
                     disabled={!isChina && !sourceId}
                     placeholder={
                        isChina || sourceId ? 'Mahsulotni tanlang...' : "Avval jo'natuvchi tranzit skladni tanlang"
                     }
                     contentClassName='w-[480px] min-w-[var(--radix-popover-trigger-width)] max-w-[90vw]'
                     wrapOptions
                  />
               </div>
            )}

            {sourceChanged && (
               <p className='mb-3 flex items-center gap-1.5 text-xs font-semibold text-ca-red'>
                  <FaExclamationTriangle /> Tranzit sklad o'zgardi: eski mahsulotlar oldingi skladga tegishli. Ularni
                  o'chirib, yangi skladdan qayta qo'shing.
               </p>
            )}

            <div className='overflow-x-auto'>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className={HEAD_CLASS}>#</TableHead>
                        <TableHead className={HEAD_CLASS}>Mahsulot</TableHead>
                        <TableHead className={HEAD_CLASS}>Tip dona</TableHead>
                        <TableHead className={HEAD_CLASS}>Soni</TableHead>
                        <TableHead className={HEAD_CLASS}>Narxi (¥)</TableHead>
                        <TableHead className={HEAD_CLASS}>Narxi ($)</TableHead>
                        <TableHead className={HEAD_CLASS}>Jami (¥ / $)</TableHead>
                        <TableHead className={HEAD_CLASS} />
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {rows.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={8} className='text-center text-ca-red'>
                              Kamida bitta mahsulot bo'lishi kerak
                           </TableCell>
                        </TableRow>
                     )}
                     {rows.map((row, index) => (
                        <TableRow key={row.key}>
                           <TableCell>{index + 1}</TableCell>
                           <TableCell>
                              <div className='font-semibold text-ca-heading'>
                                 {row.name.brand} {row.name.category}
                              </div>
                              <div className='text-[11px] text-ca-text'>
                                 {[row.name.size, row.name.type].filter(Boolean).join(' · ')}
                                 {row.id == null && <span className='ml-1.5 font-semibold text-ca-green'>yangi</span>}
                              </div>
                           </TableCell>
                           <TableCell className='w-28'>
                              <Input
                                 type='number'
                                 inputMode='decimal'
                                 min={0}
                                 step='0.0001'
                                 value={row.typeQuantity}
                                 // Uzbekistan rows take tip dona from the transit stock line.
                                 disabled={!isChina}
                                 onChange={(e) => updateRow(row.key, { typeQuantity: e.target.value })}
                              />
                           </TableCell>
                           <TableCell className='w-24'>
                              <Input
                                 type='number'
                                 inputMode='numeric'
                                 min={1}
                                 step='1'
                                 value={row.quantity}
                                 onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                              />
                           </TableCell>
                           <TableCell className='w-32'>
                              <PriceInput
                                 value={row.priceYuan}
                                 onChange={(v) => changeRowPrice(row, 'yuan', v)}
                              />
                           </TableCell>
                           <TableCell className='w-32'>
                              <PriceInput
                                 value={row.priceDollar}
                                 onChange={(v) => changeRowPrice(row, 'dollar', v)}
                              />
                           </TableCell>
                           <TableCell className='whitespace-nowrap'>
                              {formatNumber(row.totalYuan, 2)} ¥ /{' '}
                              <span className='font-semibold text-ca-green'>{formatNumber(row.totalDollar, 2)} $</span>
                           </TableCell>
                           <TableCell>
                              <Tooltip content="O'chirish">
                                 <Button
                                    type='button'
                                    variant='danger'
                                    size='icon'
                                    aria-label="O'chirish"
                                    onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                                 >
                                    <FaTrash />
                                 </Button>
                              </Tooltip>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </div>

            <div className='mt-4 flex flex-wrap items-center justify-around gap-3 rounded-[3px] border border-ca-border bg-ca-silver px-4 py-3 text-sm'>
               <span className='text-ca-heading'>
                  Jami: <span className='font-bold'>{formatNumber(totals.quantity)}</span>
               </span>
               <span className='font-bold text-ca-heading'>{formatNumber(totals.yuan, 2)} ¥</span>
               <span className='font-bold text-ca-green'>{formatNumber(totals.dollar, 2)} $</span>
            </div>

            {canWrite && (
               <Button
                  type='button'
                  variant='success'
                  size='lg'
                  className='mt-4 w-full'
                  loading={updateMutation.isPending}
                  onClick={handleSave}
               >
                  <FaSave className='mr-1.5' /> Saqlash
               </Button>
            )}
         </Panel>
      </>
   );
}
