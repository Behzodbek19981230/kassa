import { isAxiosError } from 'axios';
import { type ReactNode, useMemo, useState } from 'react';
import { FaArrowLeft, FaExclamationTriangle, FaPlus, FaSave, FaSyncAlt, FaTrash } from 'react-icons/fa';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
   Button,
   Combobox,
   DatePicker,
   FormField,
   Input,
   InputGroup,
   PriceInput,
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
import { fromApiDateTime, ORDER_STATUS_LABELS, STAGE_LABELS, toApiDateTime } from '@/pages/TwoStageImport/utils';

const loadWarehouseOptions = createLogisticsWarehouseLoader();

const PAGE_TITLES: Record<ImportStage, string> = {
   CHINA_TO_TRANSIT: "Xitoydan tranzit skladga buyurtmani o'zgartirish",
   TRANSIT_TO_UZBEKISTAN: "Tranzit skladdan O'zbekistonga buyurtmani o'zgartirish",
};

/**
 * One pickable product. China rows pick from the warehouse catalog (key = warehouse id); Uzbekistan
 * rows pick a stock line of the source transit warehouse (key = stock id), which also fixes tip dona and prices.
 */
interface ProductOption {
   key: string;
   warehouse: number;
   stockId?: number;
   brand: string;
   brandName: string;
   category: string;
   categoryName: string;
   size: string;
   typeName: string;
   typeQuantity?: string;
   priceYuan?: string;
   priceDollar?: string;
}

interface EditRow {
   key: string;
   /** Present for rows that already belong to the order; new rows are sent without it. */
   id?: number;
   /** Partial Model → Nomi → O'lchami choice while no product is picked yet. */
   brand: string;
   category: string;
   size: string;
   /** ProductOption key once the product is fully chosen. */
   productKey: string;
   warehouse?: number;
   sourceImportWarehouse?: number;
   /** Names saved on the order, shown while the catalog / stock list isn't loaded (or no longer has the line). */
   snapshot?: { brand: string; category: string; size: string; type: string };
   typeQuantity: string;
   quantity: string;
   priceYuan: string;
   priceDollar: string;
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
   return (Number(quantity) || 0) * (Number(price) || 0);
}

let rowCounter = 0;
const newRowKey = () => `row-${++rowCounter}`;

function emptyRow(): EditRow {
   return {
      key: newRowKey(),
      brand: '',
      category: '',
      size: '',
      productKey: '',
      typeQuantity: '',
      quantity: '',
      priceYuan: '',
      priceDollar: '',
   };
}

function uniqueOptions(items: { value: string; label: string }[]) {
   const seen = new Map<string, string>();
   for (const item of items) if (!seen.has(item.value)) seen.set(item.value, item.label);
   return [...seen].map(([value, label]) => ({ value, label }));
}

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
   const goBack = () => navigate('/two-stage-import/orders');

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
            onDone={goBack}
         />
      );
   }

   return (
      <>
         <div className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-ca-theme px-4 py-3 text-white'>
            <div>
               <h4 className='text-base font-semibold'>
                  {stage ? PAGE_TITLES[stage] : 'Buyurtmani tahrirlash'}
                  {data && ` · ${data.order.order_number}`}
               </h4>
               {stage && <div className='text-xs text-white/80'>{STAGE_LABELS[stage]}</div>}
            </div>
            <Button type='button' variant='warning' size='sm' onClick={goBack}>
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

/** A $ and ¥ input side by side under one label, kept in sync with today's yuan rate. */
function DualPriceInput({
   dollar,
   yuan,
   onChange,
}: {
   dollar: string;
   yuan: string;
   onChange: (next: { dollar: string; yuan: string }) => void;
}) {
   const { yuanToDollar, dollarToYuan } = useYuanDollarConversion();
   return (
      <div className='flex gap-1'>
         <InputGroup prepend='$' className='flex-1'>
            <PriceInput
               value={dollar}
               onChange={(v) => onChange({ dollar: v, yuan: dollarToYuan(v) ?? yuan })}
            />
         </InputGroup>
         <InputGroup prepend='¥' className='flex-1'>
            <PriceInput value={yuan} onChange={(v) => onChange({ yuan: v, dollar: yuanToDollar(v) ?? dollar })} />
         </InputGroup>
      </div>
   );
}

function Card({ children }: { children: ReactNode }) {
   return <div className='mb-5 rounded-[3px] bg-ca-silver-light p-4 shadow-sm'>{children}</div>;
}

function ReadOnlyField({ value }: { value: string }) {
   return (
      <div className='flex h-8.5 items-center rounded-[3px] border border-ca-field-border bg-ca-muted-2 px-3 text-xs text-ca-text'>
         {value}
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
   const updateMutation = useUpdateRouteOrderMutation();

   const { order, debts } = data;
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
         key: newRowKey(),
         id: item.id,
         brand: '',
         category: '',
         size: '',
         productKey: String(isChina ? item.warehouse : (item.source_import_warehouse ?? '')),
         warehouse: item.warehouse,
         sourceImportWarehouse: item.source_import_warehouse ?? undefined,
         snapshot: {
            brand: item.brand_snapshot ?? '',
            category: item.category_snapshot ?? '',
            size: item.size_snapshot ? formatNumber(Number(item.size_snapshot)) : '',
            type: item.type_snapshot ?? '',
         },
         typeQuantity: String(Number(item.type_quantity)),
         quantity: String(item.quantity),
         priceYuan: String(Number(item.unit_price_yuan)),
         priceDollar: String(Number(item.unit_price_dollar)),
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

   const catalog = useWarehouseCatalog();
   const sourceId = !isChina && header.sourceLogisticsWarehouse ? Number(header.sourceLogisticsWarehouse) : undefined;
   const stockQuery = useTransitStockQuery(sourceId);
   const products = useMemo<ProductOption[]>(() => {
      if (isChina) {
         return [...catalog.byId.entries()].map(([cardId, w]) => ({
            key: String(cardId),
            warehouse: cardId,
            brand: String(w.brand_id),
            brandName: w.brand_name,
            category: String(w.product_category_id),
            categoryName: w.product_category_name,
            size: String(Number(w.size)),
            typeName: w.type_name ?? '-',
         }));
      }
      return (stockQuery.data ?? [])
         .filter((s) => s.logistics_warehouse === sourceId && s.warehouse_detail)
         .map((s) => ({
            key: String(s.id),
            warehouse: s.warehouse,
            stockId: s.id,
            brand: String(s.warehouse_detail?.brand ?? ''),
            brandName: s.warehouse_detail?.brand_name ?? '',
            category: String(s.warehouse_detail?.product_category ?? ''),
            categoryName: s.warehouse_detail?.product_category_name ?? '',
            size: String(Number(s.warehouse_detail?.size ?? 0)),
            typeName: `${s.warehouse_detail?.type_name ?? '-'} (mavjud: ${formatNumber(s.available_quantity)})`,
            typeQuantity: String(Number(s.current_type_quantity)),
            priceYuan: String(Number(s.current_price_yuan)),
            priceDollar: String(Number(s.current_price_dollar)),
         }));
   }, [isChina, catalog.byId, stockQuery.data, sourceId]);
   const productByKey = useMemo(() => new Map(products.map((p) => [p.key, p])), [products]);
   const brandOptions = useMemo(
      () => uniqueOptions(products.map((p) => ({ value: p.brand, label: p.brandName }))),
      [products],
   );

   /** The row's Model / Nomi / O'lchami: from its chosen product when there is one, else the partial picks. */
   function selectionOf(row: EditRow) {
      const product = row.productKey ? productByKey.get(row.productKey) : undefined;
      return product
         ? { brand: product.brand, category: product.category, size: product.size, product }
         : { brand: row.brand, category: row.category, size: row.size, product: undefined };
   }

   function updateRow(key: string, patch: Partial<EditRow>) {
      setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
   }

   function pickProduct(row: EditRow, productKey: string) {
      const product = productByKey.get(productKey);
      if (!product) return;
      updateRow(row.key, {
         productKey,
         warehouse: product.warehouse,
         sourceImportWarehouse: product.stockId,
         snapshot: undefined,
         // Uzbekistan lines bring their own tip dona and prices from the transit stock.
         ...(product.typeQuantity != null && { typeQuantity: product.typeQuantity }),
         ...(product.priceYuan != null && { priceYuan: product.priceYuan }),
         ...(product.priceDollar != null && { priceDollar: product.priceDollar }),
         ...(isChina && !row.typeQuantity && { typeQuantity: '1' }),
      });
   }

   const rowTotals = rows.map((row) => ({
      dollar: lineTotal(row.quantity, row.priceDollar),
      yuan: lineTotal(row.quantity, row.priceYuan),
   }));
   const totals = rows.reduce(
      (acc, row, index) => ({
         quantity: acc.quantity + (Number(row.quantity) || 0),
         dollar: acc.dollar + rowTotals[index].dollar,
         yuan: acc.yuan + rowTotals[index].yuan,
      }),
      { quantity: 0, dollar: 0, yuan: 0 },
   );

   function validate(): string {
      if (isChina) {
         if (!header.consignor) return "Yuk jo'natuvchini tanlang";
         if (!header.destinationLogisticsWarehouse) return 'Qabul qiluvchi tranzit skladni tanlang';
         if (!(Number(header.exchangeRate) > 0)) return 'Dollar kursini kiriting';
      } else {
         if (!header.sourceLogisticsWarehouse) return "Jo'natuvchi tranzit skladni tanlang";
         if (!header.destinationTypeSklad) return 'Qabul qiluvchi skladni tanlang';
         if (!header.driverPhone.trim()) return 'Haydovchi telefonini kiriting';
      }
      if (!header.carrierLogistics) return 'Logistika firmasini tanlang';
      if (!header.orderDatetime) return 'Sanani tanlang';
      if (!header.truckNumber.trim()) return 'Fura raqamini kiriting';
      if (!(Number(header.weightKg) > 0)) return "Og'irlikni kiriting";
      if (!(Number(header.volumeM3) > 0)) return 'Hajmni kiriting';
      if (rows.length === 0) return "Kamida bitta mahsulot bo'lishi kerak";
      for (const [index, row] of rows.entries()) {
         const n = `${index + 1}-mahsulot`;
         if (row.warehouse == null) return `${n}: model, nomi, o'lchami va tipni tanlang`;
         if (!(Number(row.typeQuantity) > 0)) return `${n}: tip donani kiriting`;
         const qty = Number(row.quantity);
         if (!Number.isInteger(qty) || qty <= 0) return `${n}: soni 0 dan katta butun son bo'lishi kerak`;
         if (row.priceYuan === '' || row.priceDollar === '') return `${n}: narxni kiriting`;
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

      const items: RouteOrderEditItemPayload[] = rows.map((row, index) => ({
         ...(row.id != null && { id: row.id }),
         warehouse: row.warehouse!,
         ...(!isChina && row.sourceImportWarehouse != null && { source_import_warehouse: row.sourceImportWarehouse }),
         type_quantity: Number(row.typeQuantity).toFixed(4),
         quantity: Number(row.quantity),
         unit_price_yuan: Number(row.priceYuan).toFixed(2),
         unit_price_dollar: Number(row.priceDollar).toFixed(2),
         total_yuan: rowTotals[index].yuan.toFixed(2),
         total_dollar: rowTotals[index].dollar.toFixed(2),
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
         weight_kg: Number(header.weightKg).toFixed(3),
         volume_m3: Number(header.volumeM3).toFixed(4),
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
         notify({ title: "Buyurtma o'zgartirildi", text: order.order_number });
         onDone();
      } catch (err) {
         if (isAxiosError(err) && err.response?.status === 409) {
            setConflict(true);
            return;
         }
         setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
      }
   }

   // Existing Uzbekistan rows point at stock lines of the original transit warehouse.
   const sourceChanged =
      !isChina &&
      header.sourceLogisticsWarehouse !== idString(order.source_logistics_warehouse) &&
      rows.some((row) => row.id != null);

   const statusField = (
      <FormField label='Holati' required horizontal={false} className='mb-3'>
         {/* The edit API only accepts the current status; it changes through confirm / cancel. */}
         <Combobox value={order.status} options={[{ value: order.status, label: ORDER_STATUS_LABELS[order.status] }]} disabled />
      </FormField>
   );
   const datetimeField = (
      <FormField label='Sana va vaqt' required horizontal={false} className='mb-3'>
         {/* Only the date is picked; the time of day is kept from the order. */}
         <DatePicker
            value={header.orderDatetime}
            onChange={(date) => set('orderDatetime', date ? `${date}T${header.orderDatetime.slice(11, 16) || '00:00'}` : '')}
         />
      </FormField>
   );
   const carrierField = (
      <FormField label='Logistika firmasi' required horizontal={false} className='mb-3'>
         <Combobox
            value={header.carrierLogistics}
            onChange={(v) => set('carrierLogistics', v)}
            loadOptions={loadLogisticsCompanyOptions}
            selectedLabel={carrier?.name}
            placeholder='Tanlang...'
         />
      </FormField>
   );
   const truckField = (
      <FormField label='Fura raqami' required horizontal={false} className='mb-3'>
         <Input value={header.truckNumber} onChange={(e) => set('truckNumber', e.target.value)} />
      </FormField>
   );

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

         {/* Order header */}
         <Card>
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
                     {datetimeField}
                     <FormField label='Dollar kursi' required horizontal={false} className='mb-3'>
                        <PriceInput value={header.exchangeRate} onChange={(v) => set('exchangeRate', v)} />
                     </FormField>
                     {statusField}
                     {carrierField}
                     <FormField label='Qabul qiluvchi tranzit sklad' required horizontal={false} className='mb-3'>
                        <Combobox
                           value={header.destinationLogisticsWarehouse}
                           onChange={(v) => set('destinationLogisticsWarehouse', v)}
                           loadOptions={loadWarehouseOptions}
                           selectedLabel={destinationWarehouse ? logisticsWarehouseLabel(destinationWarehouse) : undefined}
                           placeholder='Tanlang...'
                        />
                     </FormField>
                     {truckField}
                     <FormField label='Consignorga qolgan qarz ($)' horizontal={false} className='mb-3'>
                        <ReadOnlyField
                           value={debts.my_total_debt ? formatNumber(debts.my_total_debt.total_debt, 2) : '0'}
                        />
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
                     {datetimeField}
                     <FormField label='Qabul qiluvchi sklad' required horizontal={false} className='mb-3'>
                        <Combobox
                           value={header.destinationTypeSklad}
                           onChange={(v) => set('destinationTypeSklad', v)}
                           options={skladTypeOptions}
                           placeholder='Tanlang...'
                        />
                     </FormField>
                     {statusField}
                     {carrierField}
                     {truckField}
                     <FormField label='Haydovchi telefoni' required horizontal={false} className='mb-3'>
                        <Input value={header.driverPhone} onChange={(e) => set('driverPhone', e.target.value)} />
                     </FormField>
                     <FormField label='Logistikaga qolgan qarz ($)' horizontal={false} className='mb-3'>
                        <ReadOnlyField
                           value={debts.logistics_debt ? formatNumber(debts.logistics_debt.total_debt, 2) : '0'}
                        />
                     </FormField>
                  </>
               )}
            </div>
         </Card>

         {/* Products */}
         <Card>
            {sourceChanged && (
               <p className='mb-3 flex items-center gap-1.5 text-xs font-semibold text-ca-red'>
                  <FaExclamationTriangle /> Tranzit sklad o'zgardi: eski mahsulotlar oldingi skladga tegishli. Ularni
                  o'chirib, yangi skladdan qayta qo'shing.
               </p>
            )}

            {rows.map((row, index) => {
               const sel = selectionOf(row);
               const categoryOptions = uniqueOptions(
                  products
                     .filter((p) => p.brand === sel.brand)
                     .map((p) => ({ value: p.category, label: p.categoryName })),
               );
               const sizeOptions = uniqueOptions(
                  products
                     .filter((p) => p.brand === sel.brand && p.category === sel.category)
                     .map((p) => ({ value: p.size, label: formatNumber(Number(p.size)) })),
               );
               const typeOptions = products
                  .filter((p) => p.brand === sel.brand && p.category === sel.category && p.size === sel.size)
                  .map((p) => ({ value: p.key, label: p.typeName }));
               const snap = sel.product ? undefined : row.snapshot;
               const isLast = index === rows.length - 1;

               return (
                  <div key={row.key} className='flex flex-wrap items-start gap-x-3 border-b border-ca-border pb-3 last:border-b-0'>
                     <FormField label='Model' required horizontal={false} className='mb-2 min-w-36 flex-[1.2]'>
                        <Combobox
                           value={sel.brand}
                           onChange={(v) => updateRow(row.key, { ...emptyPick, brand: v })}
                           options={brandOptions}
                           selectedLabel={snap?.brand || undefined}
                           disabled={!isChina && !sourceId}
                           placeholder='Tanlang...'
                        />
                     </FormField>
                     <FormField label='Nomi' required horizontal={false} className='mb-2 min-w-32 flex-1'>
                        <Combobox
                           value={sel.category}
                           onChange={(v) => updateRow(row.key, { ...emptyPick, brand: sel.brand, category: v })}
                           options={categoryOptions}
                           selectedLabel={snap?.category || undefined}
                           disabled={!sel.brand && !snap}
                           placeholder='Tanlang...'
                        />
                     </FormField>
                     <FormField label="O'lchami" required horizontal={false} className='mb-2 min-w-28 flex-1'>
                        <Combobox
                           value={sel.size}
                           onChange={(v) => {
                              updateRow(row.key, { ...emptyPick, brand: sel.brand, category: sel.category, size: v });
                              // A size with a single type needs no extra pick.
                              const matches = products.filter(
                                 (p) => p.brand === sel.brand && p.category === sel.category && p.size === v,
                              );
                              if (matches.length === 1) pickProduct(row, matches[0].key);
                           }}
                           options={sizeOptions}
                           selectedLabel={snap?.size || undefined}
                           disabled={!sel.category && !snap}
                           placeholder='Tanlang...'
                        />
                     </FormField>
                     <FormField label='Tip' required horizontal={false} className='mb-2 min-w-32 flex-1'>
                        <Combobox
                           value={row.productKey}
                           onChange={(v) => pickProduct(row, v)}
                           options={typeOptions}
                           selectedLabel={snap?.type || undefined}
                           disabled={typeOptions.length <= 1}
                           placeholder='Tanlang...'
                           contentClassName='w-[260px] min-w-[var(--radix-popover-trigger-width)]'
                           wrapOptions
                        />
                     </FormField>
                     <FormField label='Tip dona' required horizontal={false} className='mb-2 w-24'>
                        <PriceInput decimals={4}
                           value={row.typeQuantity}
                           // Uzbekistan lines take tip dona from the transit stock.
                           disabled={!isChina}
                           onChange={(v) => updateRow(row.key, { typeQuantity: v })}
                        />
                     </FormField>
                     <FormField label='Soni' required horizontal={false} className='mb-2 w-24'>
                        <PriceInput decimals={0}
                           value={row.quantity}
                           onChange={(v) => updateRow(row.key, { quantity: v })}
                        />
                     </FormField>
                     <div className='mb-2 min-w-56 flex-[1.6]'>
                        <FormField label='Narx ($ / ¥)' required horizontal={false} className='mb-0'>
                           <DualPriceInput
                              dollar={row.priceDollar}
                              yuan={row.priceYuan}
                              onChange={({ dollar, yuan }) => updateRow(row.key, { priceDollar: dollar, priceYuan: yuan })}
                           />
                        </FormField>
                        <p className='mt-1 text-[11px] text-ca-text'>
                           Summa:{' '}
                           <span className='font-semibold text-ca-heading'>
                              {formatNumber(rowTotals[index].dollar, 2)} $ / {formatNumber(rowTotals[index].yuan, 2)} ¥
                           </span>
                        </p>
                     </div>
                     <div className='mb-2 flex gap-1 pt-5.5'>
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
                        {isLast && (
                           <Tooltip content="Mahsulot qo'shish">
                              <Button
                                 type='button'
                                 variant='success'
                                 size='icon'
                                 aria-label="Mahsulot qo'shish"
                                 onClick={() => setRows((prev) => [...prev, emptyRow()])}
                              >
                                 <FaPlus />
                              </Button>
                           </Tooltip>
                        )}
                     </div>
                  </div>
               );
            })}

            {rows.length === 0 && (
               <div className='flex items-center justify-between gap-2 py-2'>
                  <span className='text-xs text-ca-red'>Kamida bitta mahsulot bo'lishi kerak</span>
                  <Button type='button' variant='success' size='sm' onClick={() => setRows([emptyRow()])}>
                     <FaPlus className='mr-1.5' /> Mahsulot qo'shish
                  </Button>
               </div>
            )}

            <div className='mt-3 flex flex-wrap items-baseline justify-end gap-x-8 gap-y-1 border-t border-ca-border pt-3 text-sm'>
               <span className='text-ca-text'>
                  Jami soni: <span className='text-base font-bold text-ca-heading'>{formatNumber(totals.quantity)}</span>
               </span>
               <span className='text-ca-text'>
                  Mahsulotlar summasi:{' '}
                  <span className='text-base font-bold text-ca-heading'>
                     {formatNumber(totals.dollar, 2)} $ / {formatNumber(totals.yuan, 2)} ¥
                  </span>
               </span>
            </div>
         </Card>

         {/* Shipment and save */}
         <Card>
            <div className='grid grid-cols-1 gap-x-4 sm:grid-cols-2 xl:grid-cols-4'>
               <FormField label='Jami summa ($ / ¥)' horizontal={false} className='mb-3'>
                  <ReadOnlyField value={`${formatNumber(totals.dollar, 2)} / ${formatNumber(totals.yuan, 2)}`} />
               </FormField>
               <FormField label='Logistika xizmat narxi ($ / ¥)' required horizontal={false} className='mb-3'>
                  <DualPriceInput
                     dollar={header.servicePriceDollar}
                     yuan={header.servicePriceYuan}
                     onChange={({ dollar, yuan }) =>
                        setHeader((prev) => ({ ...prev, servicePriceDollar: dollar, servicePriceYuan: yuan }))
                     }
                  />
                  <YuanRateHint />
               </FormField>
               <FormField label="Og'irlik (kg)" required horizontal={false} className='mb-3'>
                  <PriceInput decimals={3}
                     value={header.weightKg}
                     onChange={(v) => set('weightKg', v)}
                  />
               </FormField>
               <FormField label='Hajm (m³)' required horizontal={false} className='mb-3'>
                  <PriceInput decimals={4}
                     value={header.volumeM3}
                     onChange={(v) => set('volumeM3', v)}
                  />
               </FormField>
            </div>
            <FormField label='Izoh' horizontal={false} className='mb-3'>
               <Textarea rows={2} value={header.note} onChange={(e) => set('note', e.target.value)} />
            </FormField>

            {canWrite && (
               <Button
                  type='button'
                  variant='info'
                  size='lg'
                  className='w-full'
                  loading={updateMutation.isPending}
                  onClick={handleSave}
               >
                  <FaSave className='mr-1.5' /> O'zgartirish
               </Button>
            )}
         </Card>
      </>
   );
}

/** Clears a row's product pick when an upper level (model / nomi / o'lchami) changes. */
const emptyPick: Partial<EditRow> = {
   brand: '',
   category: '',
   size: '',
   productKey: '',
   warehouse: undefined,
   sourceImportWarehouse: undefined,
   snapshot: undefined,
};
