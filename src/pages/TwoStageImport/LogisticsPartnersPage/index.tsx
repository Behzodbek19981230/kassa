import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBoxes, FaEye, FaExclamationTriangle, FaSearch, FaUsers, FaWarehouse } from 'react-icons/fa';
import {
   Button,
   Combobox,
   Input,
   PageHeader,
   Pagination,
   Panel,
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { loadCountryOptions } from '@/pages/TwoStageImport/options';
import StatCard from '@/pages/TwoStageImport/components/StatCard';
import { SCROLL_AREA_CLASS, SCROLL_BODY_CLASS, SCROLL_PANEL_CLASS } from '@/pages/TwoStageImport/utils';
import { useLogisticsPartnersQuery } from '@/services/two-stage-import/two-stage-import.queries';

const PAGE_SIZE = 20;
const HEAD_CLASS = 'bg-ca-theme text-white';

export default function LogisticsPartnersPage() {
   const navigate = useNavigate();

   const [countryDraft, setCountryDraft] = useState('');
   const [searchDraft, setSearchDraft] = useState('');
   const [filters, setFilters] = useState({ country: '', search: '' });
   const [page, setPage] = useState(1);

   const query = useLogisticsPartnersQuery({
      country: filters.country ? Number(filters.country) : undefined,
      search: filters.search || undefined,
      page,
      limit: PAGE_SIZE,
   });

   const partners = query.data?.results ?? [];
   const summary = query.data?.summary;
   const pagination = query.data?.pagination;

   function applyFilters() {
      setFilters({ country: countryDraft, search: searchDraft.trim() });
      setPage(1);
   }

   const from = pagination && pagination.total > 0 ? (pagination.currentPage - 1) * pagination.perPage + 1 : 0;
   const to = pagination ? Math.min(pagination.currentPage * pagination.perPage, pagination.total) : 0;

   return (
      <>
         <PageHeader
            title='Logistika hamkorlari'
            breadcrumb={[
               { label: 'Asosiy', path: '/' },
               { label: 'Import' },
               { label: 'Logistika hamkorlari', active: true },
            ]}
         />

         <Panel
            title='Logistika hamkorlari'
            className={SCROLL_PANEL_CLASS}
            bodyClassName={SCROLL_BODY_CLASS}
            onReload={() => query.refetch()}
         >
            <form
               className='-mx-2.5 mb-4 flex flex-wrap items-end gap-y-3'
               onSubmit={(e) => {
                  e.preventDefault();
                  applyFilters();
               }}
            >
               <div className='w-full px-2.5 sm:w-1/3 xl:w-1/4'>
                  <label className='mb-1 block text-xs font-semibold text-ca-heading'>Davlat:</label>
                  <Combobox
                     value={countryDraft}
                     onChange={setCountryDraft}
                     loadOptions={loadCountryOptions}
                     placeholder='Barchasi'
                     clearable
                  />
               </div>
               <div className='w-full px-2.5 sm:flex-1'>
                  <label className='mb-1 block text-xs font-semibold text-ca-heading'>Firma nomi:</label>
                  <Input value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} placeholder='Qidirish...' />
               </div>
               <div className='w-full px-2.5 sm:w-auto'>
                  <Button type='submit' variant='theme' size='sm' className='w-full sm:w-auto'>
                     <FaSearch className='mr-1.5' /> Qidirish
                  </Button>
               </div>
            </form>

            <div className='-mx-2.5 flex flex-wrap'>
               <StatCard icon={<FaUsers />} label='Hamkor firmalar' value={formatNumber(summary?.partner_count ?? 0)} />
               <StatCard
                  icon={<FaWarehouse />}
                  label='Skladlar'
                  value={formatNumber(summary?.warehouse_count ?? 0)}
                  accent='warning'
               />
               <StatCard
                  icon={<FaBoxes />}
                  label='Jami soni'
                  value={formatNumber(summary?.total_count ?? 0)}
                  accent='success'
               />
            </div>

            <div className={SCROLL_AREA_CLASS}>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className={HEAD_CLASS}>#</TableHead>
                        <TableHead className={HEAD_CLASS}>Logistika firmasi</TableHead>
                        <TableHead className={HEAD_CLASS}>Davlat</TableHead>
                        <TableHead className={HEAD_CLASS}>Telefon</TableHead>
                        <TableHead className={HEAD_CLASS}>Mas'ul shaxs</TableHead>
                        <TableHead className={HEAD_CLASS}>Yuk jo'natuvchi</TableHead>
                        <TableHead className={HEAD_CLASS}>Logistika invoice</TableHead>
                        <TableHead className={HEAD_CLASS}>Jo'natuvchi invoice</TableHead>
                        <TableHead className={HEAD_CLASS}>Skladlar</TableHead>
                        <TableHead className={HEAD_CLASS}>Jami soni</TableHead>
                        <TableHead className={`${HEAD_CLASS} text-right`}>Harakatlar</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {query.isLoading && (
                        <TableRow>
                           <TableCell colSpan={11} className='text-center'>
                              Yuklanmoqda...
                           </TableCell>
                        </TableRow>
                     )}
                     {!query.isLoading && query.isError && (
                        <TableRow>
                           <TableCell colSpan={11} className='text-center text-ca-red'>
                              <FaExclamationTriangle className='mr-1.5 inline' />{' '}
                              {getApiErrorMessage(query.error, 'Xatolik yuz berdi')}
                           </TableCell>
                        </TableRow>
                     )}
                     {!query.isLoading && !query.isError && partners.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={11} className='text-center'>
                              Ma'lumot topilmadi
                           </TableCell>
                        </TableRow>
                     )}
                     {partners.map((partner, index) => (
                        <TableRow key={partner.id}>
                           <TableCell>{(pagination ? (pagination.currentPage - 1) * pagination.perPage : 0) + index + 1}</TableCell>
                           <TableCell className='font-semibold'>{partner.name}</TableCell>
                           <TableCell>{partner.country?.name ?? '—'}</TableCell>
                           <TableCell>{partner.phone || '—'}</TableCell>
                           <TableCell>{partner.contact_person || '—'}</TableCell>
                           <TableCell>
                              {partner.consignors.length
                                 ? partner.consignors.map((c) => (
                                      <div key={c.id}>{c.name}</div>
                                   ))
                                 : '—'}
                           </TableCell>
                           <TableCell>{partner.invoice_number || '—'}</TableCell>
                           <TableCell>
                              {partner.consignors.length
                                 ? partner.consignors.map((c) => (
                                      <div key={c.id}>{c.invoice_number || '—'}</div>
                                   ))
                                 : '—'}
                           </TableCell>
                           <TableCell>{formatNumber(partner.warehouse_count)}</TableCell>
                           <TableCell className='font-semibold'>{formatNumber(partner.total_count)}</TableCell>
                           <TableCell className='text-right'>
                              <Button
                                 type='button'
                                 variant='theme'
                                 size='xs'
                                 onClick={() => navigate(`/two-stage-import/transit-stock/${partner.id}`)}
                              >
                                 <FaEye className='mr-1.5' /> Ko'rish
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </div>

            {pagination && (
               <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-xs text-ca-text'>
                     {pagination.total} tadan {from} dan {to} gacha ko'rsatilmoqda
                  </span>
                  <Pagination page={page} totalPages={pagination.lastPage} onPageChange={setPage} />
               </div>
            )}
         </Panel>
      </>
   );
}
