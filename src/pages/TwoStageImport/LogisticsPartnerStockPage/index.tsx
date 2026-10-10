import { Fragment, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
   FaArrowLeft,
   FaBoxes,
   FaBuilding,
   FaExclamationTriangle,
   FaFileAlt,
   FaFileExcel,
   FaFilePdf,
   FaHistory,
   FaImage,
   FaInfoCircle,
   FaPhone,
   FaSearch,
   FaTruck,
   FaUser,
   FaWarehouse,
} from 'react-icons/fa';
import {
   Button,
   PageHeader,
   Pagination,
   Panel,
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
   useNotification,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import PriceHistoryModal from '@/pages/TwoStageImport/LogisticsPartnerStockPage/PriceHistoryModal';
import InfoItem from '@/pages/TwoStageImport/components/InfoItem';
import StatCard from '@/pages/TwoStageImport/components/StatCard';
import { formatTashkentDate } from '@/pages/TwoStageImport/utils';
import { twoStageImportService } from '@/services/two-stage-import/two-stage-import.service';
import { usePartnerStockQuery } from '@/services/two-stage-import/two-stage-import.queries';
import type { PartnerStockExportFormat } from '@/services/two-stage-import/two-stage-import.types';

const PAGE_SIZE = 50;
const ALL = 'all';
const HEAD_CLASS = 'bg-ca-theme text-white';

export default function LogisticsPartnerStockPage() {
   const { id } = useParams();
   const partnerId = Number(id);
   const navigate = useNavigate();
   const { notify } = useNotification();

   const [warehouseDraft, setWarehouseDraft] = useState(ALL);
   const [brandDraft, setBrandDraft] = useState(ALL);
   const [categoryDraft, setCategoryDraft] = useState(ALL);
   const [filters, setFilters] = useState({ warehouse: ALL, brand: ALL, category: ALL });
   const [page, setPage] = useState(1);
   const [exporting, setExporting] = useState<PartnerStockExportFormat | null>(null);

   const filterParams = {
      logistics_warehouse: filters.warehouse !== ALL ? Number(filters.warehouse) : undefined,
      brand: filters.brand !== ALL ? Number(filters.brand) : undefined,
      product_category: filters.category !== ALL ? Number(filters.category) : undefined,
   };

   const query = usePartnerStockQuery(partnerId || undefined, { ...filterParams, page, limit: PAGE_SIZE });
   const data = query.data;

   function applyFilters() {
      setFilters({ warehouse: warehouseDraft, brand: brandDraft, category: categoryDraft });
      setPage(1);
   }

   async function handleExport(format: PartnerStockExportFormat) {
      if (exporting) return;
      setExporting(format);
      try {
         const blob = await twoStageImportService.exportPartnerStock(partnerId, format, filterParams);
         const url = URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `logistics-${partnerId}-stock.${format}`;
         document.body.appendChild(link);
         link.click();
         link.remove();
         setTimeout(() => URL.revokeObjectURL(url), 10_000);
      } catch (err) {
         // Error bodies arrive as a Blob because of responseType: 'blob'.
         let message = 'Yuklab olishda xatolik yuz berdi';
         const body = (err as { response?: { data?: unknown } }).response?.data;
         if (body instanceof Blob) {
            try {
               const parsed = JSON.parse(await body.text()) as Record<string, unknown>;
               const first = parsed.detail ?? Object.values(parsed)[0];
               if (typeof first === 'string') message = first;
               else if (Array.isArray(first) && typeof first[0] === 'string') message = first[0];
            } catch {
               /* keep fallback */
            }
         } else {
            message = getApiErrorMessage(err, message);
         }
         notify({ title: 'Xatolik', text: message });
      } finally {
         setExporting(null);
      }
   }

   const partner = data?.partner;
   const pagination = data?.pagination;
   const consignors = data?.consignors ?? [];
   let rowNumber = (pagination ? (pagination.currentPage - 1) * pagination.perPage : 0) + 0;

   return (
      <>
         <PageHeader
            title='Logistika hamkori'
            breadcrumb={[
               { label: 'Asosiy', path: '/' },
               { label: 'Import' },
               { label: 'Logistika hamkorlari', path: '/two-stage-import/transit-stock' },
               { label: partner?.name ?? '...', active: true },
            ]}
         />

         <Panel
            title={`${partner?.name ?? ''} — skladlardagi mahsulotlar`}
            onReload={() => query.refetch()}
            actions={
               <div className='flex gap-2'>
                  <Button
                     type='button'
                     variant='danger'
                     size='xs'
                     loading={exporting === 'pdf'}
                     disabled={!!exporting}
                     onClick={() => handleExport('pdf')}
                  >
                     <FaFilePdf className='mr-1.5' /> PDF
                  </Button>
                  <Button
                     type='button'
                     variant='success'
                     size='xs'
                     loading={exporting === 'xlsx'}
                     disabled={!!exporting}
                     onClick={() => handleExport('xlsx')}
                  >
                     <FaFileExcel className='mr-1.5' /> Excel
                  </Button>
                  <Button
                     type='button'
                     variant='warning'
                     size='xs'
                     onClick={() => navigate('/two-stage-import/transit-stock')}
                  >
                     <FaArrowLeft className='mr-1.5' /> Orqaga
                  </Button>
               </div>
            }
         >
            {query.isError && (
               <div className='py-6 text-center text-xs text-ca-red'>
                  <FaExclamationTriangle className='mr-1.5 inline' />
                  {getApiErrorMessage(query.error, 'Xatolik yuz berdi')}
               </div>
            )}

            {partner && (
               <div className='mb-4 rounded-[3px] border border-ca-border bg-ca-silver-light'>
                  <div className='grid grid-cols-1 divide-ca-border sm:grid-cols-2 xl:grid-cols-4 xl:divide-x'>
                     <InfoItem
                        icon={<FaBuilding />}
                        label={partner.country?.name ?? 'Logistika firmasi'}
                        value={partner.name}
                     />
                     <InfoItem icon={<FaPhone />} label='Telefon:' value={partner.phone} />
                     <InfoItem icon={<FaUser />} label="Mas'ul shaxs:" value={partner.contact_person} />
                     <InfoItem icon={<FaFileAlt />} label='Logistika invoice:' value={partner.invoice_number} />
                  </div>
                  {consignors.length > 0 && (
                     <div className='grid grid-cols-1 divide-ca-border border-t border-ca-border sm:grid-cols-2 xl:grid-cols-4 xl:divide-x'>
                        {consignors.map((c) => (
                           <Fragment key={c.id}>
                              <InfoItem icon={<FaTruck />} label="Yuk jo'natuvchi:" value={c.name} />
                              <InfoItem icon={<FaFileAlt />} label="Jo'natuvchi invoice:" value={c.invoice_number} />
                           </Fragment>
                        ))}
                     </div>
                  )}
               </div>
            )}

            <div className='-mx-2.5 mb-2 flex flex-wrap items-end gap-y-3'>
               <FilterSelect
                  label='Logistika skladi:'
                  value={warehouseDraft}
                  onChange={setWarehouseDraft}
                  options={(data?.filters.logistics_warehouses ?? []).map((w) => ({
                     value: String(w.logistics_warehouse_id),
                     label: w.logistics_warehouse__name,
                  }))}
               />
               <FilterSelect
                  label='Model:'
                  value={brandDraft}
                  onChange={setBrandDraft}
                  options={(data?.filters.brands ?? []).map((b) => ({
                     value: String(b.warehouse__brand_id),
                     label: b.warehouse__brand__name,
                  }))}
               />
               <FilterSelect
                  label='Kategoriya:'
                  value={categoryDraft}
                  onChange={setCategoryDraft}
                  options={(data?.filters.product_categories ?? []).map((c) => ({
                     value: String(c.warehouse__product_category_id),
                     label: c.warehouse__product_category__name,
                  }))}
               />
               <div className='w-full px-2.5 sm:w-auto'>
                  <Button type='button' variant='theme' size='sm' className='w-full sm:w-auto' onClick={applyFilters}>
                     <FaSearch className='mr-1.5' /> Qidirish
                  </Button>
               </div>
            </div>
            <p className='mb-4 flex items-center gap-1.5 text-[11px] text-ca-theme'>
               <FaInfoCircle /> Narx ustiga bosing — kirim narxlari tarixini ko'ring.
            </p>

            <div className='-mx-2.5 flex flex-wrap'>
               <StatCard icon={<FaBoxes />} label='Jami soni' value={formatNumber(data?.summary.total_count ?? 0)} />
               <StatCard
                  icon={<FaWarehouse />}
                  label='Skladlar'
                  value={formatNumber(data?.summary.warehouse_count ?? 0)}
                  accent='warning'
               />
            </div>

            {/* Header, filters and stats take a lot of room, so the page scrolls and the table gets its own tall area. */}
            <div className='max-h-[85vh] min-h-75 overflow-auto [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10'>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className={HEAD_CLASS}>Rasm</TableHead>
                        <TableHead className={HEAD_CLASS}>#</TableHead>
                        <TableHead className={HEAD_CLASS}>Logistika skladi</TableHead>
                        <TableHead className={HEAD_CLASS}>Model</TableHead>
                        <TableHead className={HEAD_CLASS}>Nomi</TableHead>
                        <TableHead className={HEAD_CLASS}>O'lchami</TableHead>
                        <TableHead className={HEAD_CLASS}>Tip</TableHead>
                        <TableHead className={HEAD_CLASS}>Soni</TableHead>
                        <TableHead className={HEAD_CLASS}>Narx (¥ / $)</TableHead>
                        <TableHead className={HEAD_CLASS}>Oxirgi kirim</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {query.isLoading && (
                        <TableRow>
                           <TableCell colSpan={10} className='text-center'>
                              Yuklanmoqda...
                           </TableCell>
                        </TableRow>
                     )}
                     {data && data.results.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={10} className='text-center'>
                              Ma'lumot topilmadi
                           </TableCell>
                        </TableRow>
                     )}
                     {data?.results.map((group, groupIndex) => (
                        <Fragment key={group.brand?.id ?? `g${groupIndex}`}>
                           <TableRow>
                              <TableCell colSpan={10} className='bg-ca-theme/10 font-bold text-ca-red'>
                                 {group.brand?.name ?? '—'}
                              </TableCell>
                           </TableRow>
                           {group.product_categories.flatMap((cat) =>
                              cat.stocks.map((stock) => {
                                 rowNumber += 1;
                                 return (
                                    <TableRow key={stock.id}>
                                       <TableCell>
                                          {stock.image ? (
                                             <img
                                                src={stock.image}
                                                alt={stock.product_category?.name ?? ''}
                                                className='h-9 w-9 rounded object-cover'
                                             />
                                          ) : (
                                             <FaImage className='text-lg text-ca-text' />
                                          )}
                                       </TableCell>
                                       <TableCell>{rowNumber}</TableCell>
                                       <TableCell>{stock.logistics_warehouse?.name ?? '—'}</TableCell>
                                       <TableCell>{stock.brand?.name ?? '—'}</TableCell>
                                       <TableCell>{stock.product_category?.name ?? '—'}</TableCell>
                                       <TableCell>{formatNumber(stock.size ?? '')}</TableCell>
                                       <TableCell>{stock.type?.name ?? '—'}</TableCell>
                                       <TableCell className='font-semibold'>{formatNumber(stock.count)}</TableCell>
                                       <TableCell>
                                          <OpenDialogButton
                                             element={(props) => (
                                                <button
                                                   type='button'
                                                   {...props}
                                                   className='inline-flex items-center gap-1.5 font-semibold text-ca-theme underline hover:opacity-80'
                                                />
                                             )}
                                             elementProps={{
                                                children: (
                                                   <>
                                                      {stock.price.display} <FaHistory />
                                                   </>
                                                ),
                                             }}
                                             dialog={PriceHistoryModal}
                                             dialogProps={{ partnerId, stockId: stock.id }}
                                          />
                                       </TableCell>
                                       <TableCell>{formatTashkentDate(stock.last_arrival_at)}</TableCell>
                                    </TableRow>
                                 );
                              }),
                           )}
                        </Fragment>
                     ))}
                  </TableBody>
               </Table>
            </div>

            {pagination && (
               <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-xs text-ca-text'>
                     {pagination.currentPage}-sahifa ({pagination.lastPage} tadan)
                  </span>
                  <Pagination page={page} totalPages={pagination.lastPage} onPageChange={setPage} />
               </div>
            )}
         </Panel>
      </>
   );
}

interface FilterSelectProps {
   label: string;
   value: string;
   onChange: (value: string) => void;
   options: { value: string; label: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
   return (
      <div className='w-full px-2.5 sm:w-1/2 xl:w-1/4'>
         <label className='mb-1 block text-xs font-semibold text-ca-heading'>{label}</label>
         <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
               <SelectValue placeholder='Barchasi' />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value={ALL}>Barchasi</SelectItem>
               {options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                     {o.label}
                  </SelectItem>
               ))}
            </SelectContent>
         </Select>
      </div>
   );
}
