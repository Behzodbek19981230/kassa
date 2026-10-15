import { useRef } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { Button, Combobox, type ComboboxLoadParams, type ComboboxLoadResult, PriceInput } from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { generateId } from '@/lib/utils';
import { skladProductService } from '@/services/sklad-product/sklad-product.service';
import type { Warehouse } from '@/services/warehouse/warehouse.types';
import type { SkladProduct } from '@/services/sklad-product/sklad-product.types';
import { warehouseService } from '@/services/warehouse/warehouse.service';
import { skladTypeService } from '@/services/sklad-type/sklad-type.service';

export interface OrderLineValue {
   key: number | string;
   type_sklad: string;
   /** The stock row (product in the chosen sklad) the line is sold from. */
   stockId: string;
   warehouse: number | null;
   /** The product card; known even for a line sold before skladlar existed (no sklad, no stock row). */
   productLabel: string;
   skladLabel: string;
   count: number | null;
   price: string;
}

export const emptyOrderLine = (): OrderLineValue => ({
   key: generateId(),
   type_sklad: '',
   stockId: '',
   warehouse: null,
   productLabel: '',
   skladLabel: '',
   count: null,
   price: '',
});

/** "Model Nomi O'lcham Tip" of a product card. */
function cardLabel(w: Warehouse): string {
   return [w.brand_detail?.name, w.product_category_detail?.name, formatNumber(w.size), w.type_detail?.name]
      .filter(Boolean)
      .join(' | ');
}

/** "Model Nomi O'lcham Tip" of a stock row. */
export function stockLabel(stock: Pick<SkladProduct, 'warehouse_detail'>): string {
   const w = stock.warehouse_detail;
   if (!w) return '';
   return [w.brand_detail?.name, w.product_category_detail?.name, formatNumber(w.size), w.type_detail?.name]
      .filter(Boolean)
      .join(' | ');
}

interface OrderProductLineRowProps {
   value: OrderLineValue;
   onChange: (value: OrderLineValue) => void;
   error?: string;
   showAdd?: boolean;
   onAdd?: () => void;
   onRemove?: () => void;
}

export default function OrderProductLineRow({
   value,
   onChange,
   error,
   showAdd,
   onAdd,
   onRemove,
}: OrderProductLineRowProps) {
   // Stock rows loaded by the product list, so a pick can be turned back into the full row.
   const loadedStocks = useRef(new Map<string, SkladProduct>());
   const loadedCards = useRef(new Map<string, Warehouse>());
   const lineTotal = (Number(value.count) || 0) * (Number(value.price) || 0);

   const loadSkladOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
      const result = await skladTypeService.list({ search: search || undefined, page, limit: 20 });
      return {
         options: result.results.map((s) => ({ value: String(s.id), label: s.name })),
         hasMore: result.pagination.currentPage < result.pagination.lastPage,
      };
   };

   const loadProductOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
      // With a sklad chosen only the products it holds are offered; without one, every product card.
      if (value.type_sklad) {
         const result = await skladProductService.list({
            type_sklad: Number(value.type_sklad),
            search: search || undefined,
            page,
            limit: 20,
         });
         return {
            options: result.results.map((stock) => {
               loadedStocks.current.set(String(stock.warehouse), stock);
               return {
                  value: String(stock.warehouse),
                  label: `${stockLabel(stock)} (${formatNumber(stock.count)})`,
               };
            }),
            hasMore: result.pagination.currentPage < result.pagination.lastPage,
         };
      }
      const result = await warehouseService.list({ search: search || undefined, page, limit: 20 });
      return {
         options: result.results.map((w) => {
            loadedCards.current.set(String(w.id), w);
            return { value: String(w.id), label: cardLabel(w) };
         }),
         hasMore: result.pagination.currentPage < result.pagination.lastPage,
      };
   };

   function handleSkladChange(type_sklad: string, label?: string) {
      // The products on offer depend on the sklad, so the picked product is cleared.
      onChange({ ...value, type_sklad, skladLabel: label ?? '', stockId: '', warehouse: null, productLabel: '' });
   }

   function handleProductChange(warehouseId: string, option: { label: string } | null) {
      const stock = loadedStocks.current.get(warehouseId);
      const card = loadedCards.current.get(warehouseId);
      const workerPrice = stock?.worker_price ?? (card ? String(card.worker_price) : null);
      onChange({
         ...value,
         warehouse: warehouseId ? Number(warehouseId) : null,
         stockId: value.type_sklad && stock ? String(stock.id) : '',
         productLabel: stock ? stockLabel(stock) : card ? cardLabel(card) : (option?.label ?? ''),
         // A new pick starts at the worker price unless the line already has a price.
         price: !value.price && workerPrice && Number(workerPrice) > 0 ? String(Number(workerPrice)) : value.price,
      });
   }

   return (
      <div className='mb-3'>
         <div className='flex flex-wrap items-start gap-3'>
            <div className='min-w-37.5 flex-1'>
               <label className='mb-1 block text-xs font-semibold text-ca-heading'>
                  Sklad <span className='text-ca-red'>*</span>
               </label>
               <Combobox
                  value={value.type_sklad}
                  onChange={(v, option) => handleSkladChange(v, option?.label)}
                  loadOptions={loadSkladOptions}
                  selectedLabel={value.skladLabel || undefined}
                  placeholder='Tanlang...'
                  searchPlaceholder='Qidirish...'
               />
            </div>
            <div className='min-w-75 flex-[3]'>
               <label className='mb-1 block text-xs font-semibold text-ca-heading'>
                  Mahsulot <span className='text-ca-red'>*</span>
               </label>
               <Combobox
                  key={value.type_sklad}
                  value={value.warehouse ? String(value.warehouse) : ''}
                  onChange={handleProductChange}
                  loadOptions={loadProductOptions}
                  selectedLabel={value.productLabel || undefined}
                  placeholder='Tanlang...'
                  searchPlaceholder='Mahsulot qidirish...'
               />
            </div>
            <div className='min-w-25 flex-1'>
               <label className='mb-1 block text-xs font-semibold text-ca-heading'>
                  Soni <span className='text-ca-red'>*</span>
               </label>
               <PriceInput
                  value={value.count ?? ''}
                  onChange={(count) => onChange({ ...value, count: count ? Number(count) : null })}
               />
            </div>
            <div className='min-w-37.5 flex-1'>
               <label className='mb-1 block text-xs font-semibold text-ca-heading'>
                  Narxi <span className='text-ca-red'>*</span>
               </label>
               <PriceInput value={value.price} onChange={(price) => onChange({ ...value, price })} />
               <p className='mt-1 text-[13px] text-ca-text'>
                  Summa: <span className='font-semibold text-ca-heading'>{formatNumber(lineTotal, 2)} $</span>
               </p>
               {error && <p className='mt-1 text-[13px] text-ca-red'>{error}</p>}
            </div>
            <div className='w-16 shrink-0'>
               <label className='mb-1 block text-xs font-semibold text-transparent select-none'>_</label>
               <div className='flex justify-end gap-1'>
                  <Button type='button' variant='danger' size='icon' aria-label="Qatorni o'chirish" onClick={onRemove}>
                     <FaTrash />
                  </Button>
                  {showAdd && (
                     <Button type='button' variant='success' size='icon' aria-label="Qator qo'shish" onClick={onAdd}>
                        <FaPlus />
                     </Button>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
