import { Fragment, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
   FaArrowLeft,
   FaBoxes,
   FaBuilding,
   FaCalendarAlt,
   FaDollarSign,
   FaExchangeAlt,
   FaExclamationTriangle,
   FaFileAlt,
   FaImage,
   FaInfoCircle,
   FaDatabase,
   FaSearch,
   FaTruck,
} from 'react-icons/fa';
import {
   Badge,
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
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import InfoItem from '@/pages/TwoStageImport/components/InfoItem';
import StatCard from '@/pages/TwoStageImport/components/StatCard';
import {
   ORDER_STATUS_LABELS,
   ORDER_STATUS_VARIANTS,
   formatTashkentDateTime,
} from '@/pages/TwoStageImport/utils';
import { useOrderProductsQuery } from '@/services/two-stage-import/two-stage-import.queries';

const PAGE_SIZE = 50;
const MOVEMENT_PAGE_SIZE = 20;
const ALL = 'all';
const HEAD_CLASS = 'bg-ca-theme text-white';

export default function ImportOrderProductsPage() {
   const { id } = useParams();
   const orderId = Number(id);
   const navigate = useNavigate();

   const [brandDraft, setBrandDraft] = useState(ALL);
   const [categoryDraft, setCategoryDraft] = useState(ALL);
   const [filters, setFilters] = useState({ brand: ALL, category: ALL });
   const [page, setPage] = useState(1);
   const [movementPage, setMovementPage] = useState(1);

   const query = useOrderProductsQuery(orderId || undefined, {
      brand_name: filters.brand !== ALL ? filters.brand : undefined,
      category_name: filters.category !== ALL ? filters.category : undefined,
      page,
      limit: PAGE_SIZE,
      movement_page: movementPage,
      movement_limit: MOVEMENT_PAGE_SIZE,
   });
   const data = query.data;
   const order = data?.order;
   const pagination = data?.pagination;
   const movements = data?.movements;

   // Categories belong to a brand, so the category select only lists the chosen brand's categories.
   const categoryOptions = (data?.filters.product_categories ?? []).filter(
      (c) => brandDraft === ALL || c.brand_name === brandDraft,
   );

   function applyFilters() {
      setFilters({ brand: brandDraft, category: categoryDraft });
      setPage(1);
   }

   const title = order?.two_stage_import_detail?.import_number ?? order?.order_number ?? '...';
   let rowNumber = pagination ? (pagination.currentPage - 1) * pagination.perPage : 0;

   return (
      <>
         <PageHeader
            title='Buyurtma mahsulotlari'
            breadcrumb={[
               { label: 'Asosiy', path: '/' },
               { label: 'Import buyurtmalar', path: '/two-stage-import/orders' },
               { label: title, active: true },
            ]}
         />

         <Panel
            title={`${title} — buyurtma mahsulotlari`}
            onReload={() => query.refetch()}
            actions={
               <Button type='button' variant='warning' size='xs' onClick={() => navigate('/two-stage-import/orders')}>
                  <FaArrowLeft className='mr-1.5' /> Orqaga
               </Button>
            }
         >
            {query.isError && (
               <div className='py-6 text-center text-xs text-ca-red'>
                  <FaExclamationTriangle className='mr-1.5 inline' />
                  {getApiErrorMessage(query.error, 'Buyurtma mahsulotlarini olishda xatolik.')}
               </div>
            )}
            {query.isLoading && <div className='py-6 text-center text-xs'>Yuklanmoqda...</div>}

            {order && (
               <div className='mb-3 rounded-[3px] border border-ca-border bg-ca-silver-light'>
                  <div className='grid grid-cols-1 divide-ca-border sm:grid-cols-2 xl:grid-cols-4 xl:divide-x'>
                     <InfoItem icon={<FaFileAlt />} label='Buyurtma:' value={order.order_number} />
                     <InfoItem
                        icon={<FaCalendarAlt />}
                        label='Sana:'
                        value={formatTashkentDateTime(order.order_datetime)}
                     />
                     <InfoItem icon={<FaTruck />} label="Yuk jo'natuvchi:" value={order.sender_name} />
                     <InfoItem icon={<FaExchangeAlt />} label="Yo'nalish:" value={order.direction_name} />
                  </div>
                  <div className='grid grid-cols-1 items-center divide-ca-border border-t border-ca-border sm:grid-cols-2 xl:grid-cols-4 xl:divide-x'>
                     <InfoItem
                        icon={<FaBuilding />}
                        label='Logistika:'
                        value={order.carrier_logistics_detail?.name}
                     />
                     <InfoItem icon={<FaTruck />} label='Fura:' value={order.truck_number} />
                     <div className='px-3 py-2'>
                        <Badge variant={ORDER_STATUS_VARIANTS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                     </div>
                  </div>
               </div>
            )}

            <p className='mb-4 flex items-center gap-1.5 rounded-[3px] border border-ca-border bg-ca-silver-light px-3 py-2 text-[11px] text-ca-text'>
               <FaInfoCircle className='text-ca-theme' />
               Jo'natilgan mahsulotlar va narxlar buyurtma paytidagi qiymatlar bilan ko'rsatilgan.
            </p>

            <div className='-mx-2.5 mb-4 flex flex-wrap items-end gap-y-3'>
               <FilterSelect
                  label='Model:'
                  value={brandDraft}
                  onChange={(value) => {
                     setBrandDraft(value);
                     setCategoryDraft(ALL);
                  }}
                  options={(data?.filters.brands ?? []).map((b) => ({ value: b, label: b }))}
               />
               <FilterSelect
                  label='Kategoriya:'
                  value={categoryDraft}
                  onChange={setCategoryDraft}
                  options={categoryOptions.map((c) => ({ value: c.category_name, label: c.category_name }))}
               />
               <div className='w-full px-2.5 sm:w-auto'>
                  <Button type='button' variant='theme' size='sm' className='w-full sm:w-auto' onClick={applyFilters}>
                     <FaSearch className='mr-1.5' /> Qidirish
                  </Button>
               </div>
            </div>

            <div className='-mx-2.5 flex flex-wrap'>
               <StatCard icon={<FaBoxes />} label='Jami soni' value={formatNumber(data?.summary.total_count ?? 0)} />
               <StatCard
                  icon={<FaDatabase />}
                  label='Jami (¥)'
                  value={formatNumber(data?.summary.total_yuan ?? 0, 2)}
                  accent='warning'
               />
               <StatCard
                  icon={<FaDollarSign />}
                  label='Jami ($)'
                  value={formatNumber(data?.summary.total_dollar ?? 0, 2)}
                  accent='success'
               />
            </div>

            <div className='max-h-[85vh] min-h-75 overflow-auto [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10'>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className={HEAD_CLASS}>Rasm</TableHead>
                        <TableHead className={HEAD_CLASS}>#</TableHead>
                        <TableHead className={HEAD_CLASS}>Model</TableHead>
                        <TableHead className={HEAD_CLASS}>Nomi</TableHead>
                        <TableHead className={HEAD_CLASS}>O'lchami</TableHead>
                        <TableHead className={HEAD_CLASS}>Tip</TableHead>
                        <TableHead className={HEAD_CLASS}>Jo'natilgan soni</TableHead>
                        <TableHead className={HEAD_CLASS}>Narx (¥ / $)</TableHead>
                        <TableHead className={HEAD_CLASS}>Jami (¥ / $)</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {data && data.results.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={9} className='text-center'>
                              Ma'lumot topilmadi
                           </TableCell>
                        </TableRow>
                     )}
                     {data?.results.map((group, groupIndex) => (
                        <Fragment key={group.brand?.name ?? `g${groupIndex}`}>
                           <TableRow>
                              <TableCell colSpan={9} className='bg-ca-theme/10 font-bold text-ca-red'>
                                 {group.brand?.name ?? '—'}
                              </TableCell>
                           </TableRow>
                           {group.product_categories.flatMap((cat) =>
                              cat.items.map((item) => {
                                 rowNumber += 1;
                                 return (
                                    <TableRow key={item.id}>
                                       <TableCell>
                                          {item.image ? (
                                             <img
                                                src={item.image}
                                                alt={item.category_name ?? ''}
                                                className='h-9 w-9 rounded object-cover'
                                             />
                                          ) : (
                                             <FaImage className='text-lg text-ca-text' />
                                          )}
                                       </TableCell>
                                       <TableCell>{rowNumber}</TableCell>
                                       <TableCell>{item.brand_name ?? '—'}</TableCell>
                                       <TableCell>{item.category_name ?? '—'}</TableCell>
                                       <TableCell>{item.size ? formatNumber(item.size) : '—'}</TableCell>
                                       <TableCell>{item.type_name ?? '—'}</TableCell>
                                       <TableCell className='font-semibold'>{formatNumber(item.count)}</TableCell>
                                       <TableCell className='text-ca-theme'>{item.price.display}</TableCell>
                                       <TableCell className='font-semibold text-ca-theme'>{item.total.display}</TableCell>
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

         <Panel title='Buyurtma harakatlari'>
            {movements?.dispatch_at && (
               <MovementRow date={formatTashkentDateTime(movements.dispatch_at)} text="Xitoydan yuk jo'natildi" />
            )}
            {movements?.results.map((m) => (
               <MovementRow
                  key={`${m.first_at}-${m.movement_type}-${m.logistics_warehouse?.id ?? 0}`}
                  date={formatTashkentDateTime(m.first_at)}
                  text={`${m.label}${m.logistics_warehouse ? ` — ${m.logistics_warehouse.name}` : ''}${
                     m.quantity_change ? ` (${m.quantity_change > 0 ? '+' : ''}${formatNumber(m.quantity_change)})` : ''
                  }`}
               />
            ))}
            {movements && !movements.dispatch_at && movements.results.length === 0 && (
               <div className='py-3 text-center text-xs text-ca-text'>Buyurtma bo'yicha ombor harakatlari yo'q</div>
            )}
            {movements && movements.pagination.lastPage > 1 && (
               <div className='mt-3 flex justify-end'>
                  <Pagination
                     page={movementPage}
                     totalPages={movements.pagination.lastPage}
                     onPageChange={setMovementPage}
                  />
               </div>
            )}
         </Panel>
      </>
   );
}

function MovementRow({ date, text }: { date: string; text: string }) {
   return (
      <div className='flex items-center gap-4 border-b border-ca-border py-2 text-xs last:border-b-0'>
         <span className='h-2.5 w-2.5 shrink-0 rounded-full bg-ca-theme' />
         <span className='w-36 shrink-0 text-ca-text'>{date}</span>
         <span className='text-ca-heading'>{text}</span>
      </div>
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
      <div className='w-full px-2.5 sm:w-1/2 xl:w-2/5'>
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
