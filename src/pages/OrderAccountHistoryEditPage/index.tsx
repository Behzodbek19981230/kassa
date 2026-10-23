import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaArrowLeft, FaExclamationTriangle, FaSave } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Button, Checkbox, DatePicker, FormField, Input, PriceInput, Textarea, useNotification } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber, roundMoney } from '@/lib/number';
import { usePermissions } from '@/lib/permissions';
import { generateId } from '@/lib/utils';
import { skladProductService } from '@/services/sklad-product/sklad-product.service';
import OrderProductLineRow, {
   emptyOrderLine,
   type OrderLineValue,
} from '@/pages/OrderAccountHistoryEditPage/components/OrderProductLineRow';
import {
   useOrderAccountHistoryQuery,
   useUpdateSaleOrderAccountHistoryMutation,
} from '@/services/order-account-history/order-account-history.queries';
import type { OrderAccountHistoryUpdateSaleItemPayload } from '@/services/order-account-history/order-account-history.types';
import { useProductAccountHistoryListQuery } from '@/services/product-account-history/product-account-history.queries';

const editOrderFormSchema = z.object({
   date: z.string().min(1, 'Sana kiritilishi shart'),
   exchange_rate: z.string().min(1, 'Dollar kursini kiriting'),
   discount_amount: z.string().optional(),
   zdacha_dollar: z.string().optional(),
   zdacha_sum: z.string().optional(),
   sum_dollar: z.string().min(1, 'Qiymat kiritilishi shart'),
   sum_som: z.string().min(1, 'Qiymat kiritilishi shart'),
   sum_cart: z.string().min(1, 'Qiymat kiritilishi shart'),
   sum_transfers: z.string().min(1, 'Qiymat kiritilishi shart'),
   driver_info: z.string().optional(),
   order_commit: z.string().trim().min(1, 'Izoh kiritilishi shart'),
   order_account_status: z.boolean(),
   fast_order: z.boolean(),
});

type EditOrderFormValues = z.infer<typeof editOrderFormSchema>;

/** "12.50" -> "12.5"; zero and empty values stay empty. */
const plainNumber = (value?: string | number | null) => (Number(value) ? String(Number(value)) : '');

type EditableProductRow = OrderLineValue;

/** Collects every string in a (nested) API error payload. */
function collectMessages(value: unknown, out: string[] = []): string[] {
   if (typeof value === 'string') out.push(value);
   else if (Array.isArray(value)) value.forEach((v) => collectMessages(v, out));
   else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectMessages(v, out));
   return out;
}

/** Maps backend item errors ("items[5]: ..." strings or DRF `items: [{}, {count: [...]}]`) to row indexes. */
function extractRowErrors(err: unknown): Record<number, string> {
   const result: Record<number, string> = {};
   if (!isAxiosError(err)) return result;
   const data = err.response?.data as { items?: unknown } | undefined;
   if (!data || typeof data !== 'object') return result;

   for (const message of collectMessages(data)) {
      const match = /items\[(\d+)\]:\s*(.*)/s.exec(message);
      if (match) result[Number(match[1])] ??= match[2].trim();
   }
   if (Array.isArray(data.items)) {
      data.items.forEach((entry, i) => {
         const message = collectMessages(entry)[0];
         if (message) result[i] ??= message;
      });
   }
   return result;
}

export default function OrderAccountHistoryEditPage() {
   const navigate = useNavigate();
   const { id } = useParams();
   const orderId = id ? Number(id) : undefined;
   const { notify } = useNotification();
   const { canWrite } = useCurrentCompany();
   const { canEditOwned } = usePermissions();
   const [formError, setFormError] = useState('');

   useEffect(() => {
      if (!canWrite) navigate('/customer-order-history', { replace: true });
   }, [canWrite, navigate]);

   const { data: item, isLoading, isError } = useOrderAccountHistoryQuery(orderId);
   const { data: linesData } = useProductAccountHistoryListQuery(
      { order_account_history: orderId, limit: 500 },
      orderId !== undefined,
   );

   useEffect(() => {
      if (item && !canEditOwned(item)) navigate('/customer-order-history', { replace: true });
   }, [item, canEditOwned, navigate]);

   const [rows, setRows] = useState<EditableProductRow[]>([]);
   const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
   useEffect(() => {
      if (!linesData) return;
      let cancelled = false;
      (async () => {
         // Older lines carry no sklad_product, so their stock row is looked up by product + sklad.
         const next = await Promise.all(
            linesData.results.map(async (line): Promise<EditableProductRow> => {
               const stock =
                  line.sklad_product == null && line.type_sklad != null
                     ? await skladProductService.findByPair(line.warehouse, line.type_sklad).catch(() => null)
                     : null;
               return {
                  key: generateId(),
                  type_sklad: line.type_sklad != null ? String(line.type_sklad) : '',
                  skladLabel: line.type_sklad_detail?.name ?? '',
                  stockId: line.sklad_product != null ? String(line.sklad_product) : stock ? String(stock.id) : '',
                  warehouse: line.warehouse,
                  productLabel: [
                     line.brand_detail?.name,
                     line.product_category_detail?.name,
                     formatNumber(line.size),
                     line.type_detail?.name,
                  ]
                     .filter(Boolean)
                     .join(' | '),
                  count: line.count,
                  price: String(line.price),
               };
            }),
         );
         if (!cancelled) setRows(next);
      })();
      return () => {
         cancelled = true;
      };
   }, [linesData]);

   const updateRow = (index: number, next: EditableProductRow) => {
      setRows((prev) => prev.map((row, i) => (i === index ? next : row)));
   };
   const addRow = () => setRows((prev) => [...prev, emptyOrderLine()]);
   const removeRow = (index: number) => {
      setRows((prev) => prev.filter((_, i) => i !== index));
   };

   const rowsTotal = rows.reduce((sum, row) => sum + (Number(row.count) || 0) * (Number(row.price) || 0), 0);

   const {
      control,
      register,
      handleSubmit,
      watch,
      formState: { errors },
   } = useForm<EditOrderFormValues>({
      resolver: zodResolver(editOrderFormSchema),
      values: item
         ? {
            date: item.date,
            exchange_rate: item.exchange_rate,
            discount_amount: String(Number(item.discount_amount) || 0),
            zdacha_dollar: String(Number(item.zdacha_dollar) || 0),
            zdacha_sum: String(Number(item.zdacha_sum) || 0),
            sum_dollar: plainNumber(item.sum_dollar),
            sum_som: plainNumber(item.sum_som),
            sum_cart: plainNumber(item.sum_cart),
            sum_transfers: plainNumber(item.sum_transfers),
            driver_info: item.driver_info ?? '',
            order_commit: item.order_commit ?? '',
            order_account_status: Boolean(item.order_account_status),
            fast_order: Boolean(item.fast_order),
         }
         : undefined,
   });

   // Som, card and transfer amounts are in so'm, so they are converted to dollars by the rate.
   const rate = Number(watch('exchange_rate')) || 0;
   const somTotal =
      (Number(watch('sum_som')) || 0) + (Number(watch('sum_cart')) || 0) + (Number(watch('sum_transfers')) || 0);
   const paidDollar = (Number(watch('sum_dollar')) || 0) + (rate > 0 ? somTotal / rate : 0);
   const coveredDollar = paidDollar + (Number(watch('discount_amount')) || 0);

   const updateSaleMutation = useUpdateSaleOrderAccountHistoryMutation();
   const isSaving = updateSaleMutation.isPending;

   const onSubmit = handleSubmit(async (values) => {
      if (!item) return;
      setFormError('');

      const rowErrs: Record<number, string> = {};
      rows.forEach((row, i) => {
         if (!row.warehouse || !row.price || !row.count) {
            rowErrs[i] = "Barcha maydonlar to'ldirilishi shart";
         } else if (!row.type_sklad) {
            rowErrs[i] = 'Skladni tanlang';
         } else if (!row.stockId) {
            rowErrs[i] = 'Bu tovar tanlangan skladda topilmadi';
         }
      });
      if (Object.keys(rowErrs).length) {
         setRowErrors(rowErrs);
         setFormError("Mahsulotlar bo'limida xatolik bor");
         return;
      }
      setRowErrors({});

      const items: OrderAccountHistoryUpdateSaleItemPayload[] = rows.map((row) => ({
         warehouse: row.warehouse!,
         sklad_product: Number(row.stockId),
         count: row.count ?? 0,
         price: row.price,
      }));

      try {
         await updateSaleMutation.mutateAsync({
            id: item.id,
            payload: {
               date: values.date,
               exchange_rate: values.exchange_rate,
               discount_amount: values.discount_amount || '0',
               zdacha_dollar: values.zdacha_dollar || '0',
               zdacha_sum: values.zdacha_sum || '0',
               all_summ_dollar: String(roundMoney(coveredDollar)),
               sum_dollar: values.sum_dollar || '0',
               sum_som: values.sum_som || '0',
               sum_cart: values.sum_cart || '0',
               sum_transfers: values.sum_transfers || '0',
               driver_info: values.driver_info?.trim(),
               comment: values.order_commit?.trim(),
               order_account_status: values.order_account_status,
               fast_order: values.fast_order,
               items,
            },
         });

         notify({ title: 'Buyurtma yangilandi' });
         navigate(-1);
      } catch (err) {
         const rowErrs = extractRowErrors(err);
         if (Object.keys(rowErrs).length) {
            setRowErrors(rowErrs);
            setFormError("Mahsulotlar bo'limida xatolik bor");
         } else {
            setFormError(getApiErrorMessage(err, 'Yangilashda xatolik yuz berdi'));
         }
      }
   });

   if (isLoading) {
      return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
   }

   if (isError || !item) {
      return (
         <div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
            <FaExclamationTriangle /> Buyurtma topilmadi
         </div>
      );
   }

   return (
      <>
         <div className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-ca-theme px-4 py-3 text-white'>
            <h4 className='text-sm font-normal'>
               <span className='font-semibold'>{item.client_name ?? item.client_detail?.fio}</span> ning{' '}
               {item.date} sanadagi mahsulotlarini o'zgartirish
            </h4>
            <Button type='button' variant='warning' size='xs' onClick={() => navigate(-1)}>
               <FaArrowLeft className='mr-1.5' /> Orqaga qaytish
            </Button>
         </div>

         <form onSubmit={onSubmit} noValidate>
            <div className='mb-5 rounded-[3px] bg-ca-silver-light p-5 shadow-sm'>
               {formError && (
                  <div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
                     {formError}
                  </div>
               )}

               <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4'>
                  <FormField label='Mijoz' horizontal={false} className='mb-0'>
                     <Input value={item.client_name ?? item.client_detail?.fio ?? ''} disabled />
                  </FormField>
                  <FormField label='Eski Qarz ($)' horizontal={false} className='mb-0'>
                     <Input value={formatNumber(item.total_debt_old, 2)} disabled />
                  </FormField>
                  <FormField
                     label='Sana'
                     error={errors.date?.message}
                     required
                     horizontal={false}
                     className='mb-0'
                  >
                     <Controller
                        name='date'
                        control={control}
                        render={({ field }) => (
                           <DatePicker value={field.value} onChange={field.onChange} disabled />
                        )}
                     />
                  </FormField>
                  <FormField
                     label='Dollar kursi'
                     error={errors.exchange_rate?.message}
                     required
                     horizontal={false}
                     className='mb-0'
                  >
                     <Controller
                        name='exchange_rate'
                        control={control}
                        render={({ field }) => (
                           <PriceInput value={field.value} onChange={field.onChange} disabled />
                        )}
                     />
                  </FormField>
               </div>
            </div>

            <div className='mb-5 rounded-[3px] bg-ca-silver-light p-5 shadow-sm'>
               {rows.map((row, index) => (
                  <OrderProductLineRow
                     key={row.key}
                     value={row}
                     onChange={(next) => updateRow(index, next)}
                     error={rowErrors[index]}
                     showAdd={index === rows.length - 1}
                     onAdd={addRow}
                     onRemove={() => removeRow(index)}
                  />
               ))}
               {rows.length === 0 && (
                  <Button type='button' variant='success' size='sm' onClick={addRow}>
                     Mahsulot qo'shish
                  </Button>
               )}
               {rows.length > 0 && (
                  <div className='mt-4 flex justify-end border-t border-ca-border pt-3'>
                     <p className='text-sm text-ca-text'>
                        Mahsulotlar summasi:{' '}
                        <span className='text-base font-semibold text-ca-heading'>
                           {formatNumber(rowsTotal, 2)} $
                        </span>
                     </p>
                  </div>
               )}
            </div>

            <div className='mb-5 rounded-[3px] bg-ca-silver-light p-5 shadow-sm'>
               <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-6'>
                  <FormField label='Jami summa dollarda ($)' horizontal={false} className='mb-0'>
                     <PriceInput value={plainNumber(coveredDollar.toFixed(2))} disabled />
                  </FormField>
                  <FormField label='Jami chegirma ($)' horizontal={false} className='mb-0'>
                     <Controller
                        name='discount_amount'
                        control={control}
                        render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
                     />
                  </FormField>
                  <FormField
                     label='Summa dollarda ($)'
                     error={errors.sum_dollar?.message}
                     required
                     horizontal={false}
                     className='mb-0'
                  >
                     <Controller
                        name='sum_dollar'
                        control={control}
                        render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
                     />
                  </FormField>
                  <FormField
                     label="Summa so'mda"
                     error={errors.sum_som?.message}
                     required
                     horizontal={false}
                     className='mb-0'
                  >
                     <Controller
                        name='sum_som'
                        control={control}
                        render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
                     />
                  </FormField>
                  <FormField
                     label='Summa kartada'
                     error={errors.sum_cart?.message}
                     required
                     horizontal={false}
                     className='mb-0'
                  >
                     <Controller
                        name='sum_cart'
                        control={control}
                        render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
                     />
                  </FormField>
                  <FormField
                     label='Summa transferda'
                     error={errors.sum_transfers?.message}
                     required
                     horizontal={false}
                     className='mb-0'
                  >
                     <Controller
                        name='sum_transfers'
                        control={control}
                        render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
                     />
                  </FormField>
               </div>

               <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <FormField label='Qaytim ($)' horizontal={false} className='mb-0'>
                     <Controller
                        name='zdacha_dollar'
                        control={control}
                        render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
                     />
                  </FormField>
                  <FormField label="Qaytim so'm" horizontal={false} className='mb-0'>
                     <Controller
                        name='zdacha_sum'
                        control={control}
                        render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
                     />
                  </FormField>
               </div>

               <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <FormField label='Izoh' error={errors.order_commit?.message} required horizontal={false} className='mb-0'>
                     <Textarea rows={1} {...register('order_commit')} />
                  </FormField>
                  <FormField label="Haydovchi ma'lumotlari" horizontal={false} className='mb-0'>
                     <Input {...register('driver_info')} />
                  </FormField>
               </div>

               <div className='mb-4 flex items-center gap-6'>
                  <Controller
                     name='order_account_status'
                     control={control}
                     render={({ field }) => (
                        <Checkbox
                           label='Tasdiqlash:'
                           checked={field.value}
                           onCheckedChange={field.onChange}
                           inline
                        />
                     )}
                  />
                  <Controller
                     name='fast_order'
                     control={control}
                     render={({ field }) => (
                        <Checkbox
                           label='Tezda tayyorlash:'
                           checked={field.value}
                           onCheckedChange={field.onChange}
                           inline
                        />
                     )}
                  />
               </div>

               <Button type='submit' variant='info' className='w-full' loading={isSaving}>
                  <FaSave className='mr-1.5' /> O'zgartirish
               </Button>
            </div>
         </form>
      </>
   );
}
