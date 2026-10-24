import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/lib/errors';
import {
   FaBuilding,
   FaCalendarAlt,
   FaCheck,
   FaClock,
   FaDollarSign,
   FaExchangeAlt,
   FaExclamationTriangle,
   FaHistory,
   FaInfoCircle,
   FaPaperPlane,
   FaPencilAlt,
   FaMoon,
   FaReceipt,
   FaShippingFast,
   FaSignOutAlt,
   FaSun,
   FaTruck,
   FaUser,
   FaWarehouse,
   FaYenSign,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { sidebarMenu } from '@/data/sidebarMenu';
import { clearSession, getRefreshToken } from '@/lib/auth';
import { useCurrentCompany } from '@/lib/company';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';
import { useLogoutMutation } from '@/services/auth/auth.queries';
import { useClientListQuery } from '@/services/client/client.queries';
import { useUserInfoQuery } from '@/services/user/user.queries';
import { useWarehouseTransferListQuery } from '@/services/warehouse-transfer/warehouse-transfer.queries';
import {
   Badge,
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
   Tooltip,
   useNotification,
} from '@/components/ui';
import ExchangeRateEditModal, { type ExchangeRateCurrency } from '@/components/layout/ExchangeRateEditModal';
import NewTelegramClientsModal from '@/components/layout/NewTelegramClientsModal';
import type { SidebarIcon } from '@/types';

// The header reuses the sidebar's Logistika group, so both menus list the same pages.
const logisticsMenu = sidebarMenu.find((item) => item.id === 'two-stage-import');

const logisticsIcons: Partial<Record<SidebarIcon, ReactNode>> = {
   truck: <FaTruck className='text-ca-text' />,
   history: <FaHistory className='text-ca-text' />,
   warehouse: <FaWarehouse className='text-ca-text' />,
   'shipping-fast': <FaShippingFast className='text-ca-text' />,
};

interface HeaderProps {
   onToggleSidebar: () => void;
}

function useClock() {
   const [now, setNow] = useState(() => new Date());
   useEffect(() => {
      const id = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(id);
   }, []);
   return now;
}

function formatDate(date: Date) {
   const dd = String(date.getDate()).padStart(2, '0');
   const mm = String(date.getMonth() + 1).padStart(2, '0');
   return `${dd}.${mm}.${date.getFullYear()}`;
}

function formatTime(date: Date) {
   const hh = String(date.getHours()).padStart(2, '0');
   const mi = String(date.getMinutes()).padStart(2, '0');
   const ss = String(date.getSeconds()).padStart(2, '0');
   return `${hh}:${mi}:${ss}`;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
   const navigate = useNavigate();
   const { data: user } = useUserInfoQuery();
   const logoutMutation = useLogoutMutation();
   const { theme, toggleTheme } = useTheme();
   const now = useClock();
   const {
      companyId,
      setCompanyId,
      companies,
      showCompanySelect,
      ownCompany,
      ownCompanyId,
      isSuperAdmin,
      isAdminOrManager,
      exchangeRate,
      isExchangeRateSet,
      yuanExchangeRate,
      isYuanExchangeRateSet,
   } = useCurrentCompany();
   const currentCompany = companies.find((c) => c.id === companyId);
   const { notify } = useNotification();

   const [switchingCompanyId, setSwitchingCompanyId] = useState<number | null>(null);
   const [rateModalCurrency, setRateModalCurrency] = useState<ExchangeRateCurrency | null>(null);
   const [newClientsModalOpen, setNewClientsModalOpen] = useState(false);

   const { data: unconfirmedTransfersData } = useWarehouseTransferListQuery(
      {
         is_confirmed: false,
         limit: 1,
      },
      // Loaded once per page load; mutations that change the count invalidate it.
      { staleTime: Infinity, enabled: isSuperAdmin },
   );
   const unconfirmedTransfersCount = unconfirmedTransfersData?.pagination.total ?? 0;

   const { data: unconfirmedClientsData } = useClientListQuery(
      {
         status: 'new_telegram',
         limit: 1,
      },
      // Loaded once per page load; mutations that change the count invalidate it.
      { staleTime: Infinity, enabled: isSuperAdmin },
   );
   const unconfirmedClientsCount = unconfirmedClientsData?.pagination.total ?? 0;

   // Header menus that fit stay in the bar; the rest (from the last one) move into the profile dropdown.
   const innerRef = useRef<HTMLDivElement>(null);
   const leftRef = useRef<HTMLDivElement>(null);
   const menuRef = useRef<HTMLUListElement>(null);
   const [measuring, setMeasuring] = useState(true);
   const [visibleCount, setVisibleCount] = useState(Number.POSITIVE_INFINITY);
   const [measureTick, setMeasureTick] = useState(0);
   const inHeader = (index: number) => measuring || index < visibleCount;
   const inMenu = (index: number) => !measuring && index >= visibleCount;
   // Clients (0) and transfers (2) are superadmin-only, telegram (1) is admin/manager. Hidden items keep their slot so indices stay stable.
   const canSee = [isSuperAdmin, isAdminOrManager, isSuperAdmin, showCompanySelect && companies.length > 1];
   const anyInMenu = [0, 1, 2, 3].some((i) => inMenu(i) && canSee[i]);
   const hasMenuTop = anyInMenu;

   useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      const remeasure = () => setMeasureTick((t) => t + 1);
      // The left block (clock, rates) changes width when data/fonts arrive; the menu itself is not
      // observed because its size changes with our own collapsing and would loop.
      const observer = new ResizeObserver(remeasure);
      observer.observe(el);
      if (leftRef.current) observer.observe(leftRef.current);
      // Menu text widths change once web fonts and images have loaded.
      void document.fonts?.ready.then(remeasure);
      window.addEventListener('load', remeasure);
      return () => {
         observer.disconnect();
         window.removeEventListener('load', remeasure);
      };
   }, []);

   // Re-measure with every menu rendered whenever the width or the menu contents change.
   useLayoutEffect(() => {
      setMeasuring(true);
   }, [measureTick, unconfirmedClientsCount, unconfirmedTransfersCount, showCompanySelect, companies.length, currentCompany?.name, user?.username]);

   useLayoutEffect(() => {
      if (!measuring) return;
      const inner = innerRef.current;
      const left = leftRef.current;
      const menu = menuRef.current;
      if (!inner || !left || !menu) return;
      const available = inner.clientWidth - 40 - left.offsetWidth - 24;
      const items = Array.from(menu.children) as HTMLElement[];
      let used = items.filter((li) => !li.hasAttribute('data-collapsible')).reduce((sum, li) => sum + li.offsetWidth, 0);
      let count = 0;
      for (const li of items.filter((li) => li.hasAttribute('data-collapsible'))) {
         used += li.offsetWidth;
         if (used > available) break;
         count += 1;
      }
      setVisibleCount(count);
      setMeasuring(false);
   }, [measuring]);

   const handleSelectCompany = async (id: number) => {
      setSwitchingCompanyId(id);
      try {
         await setCompanyId(id);
      } catch (err) {
         console.log(err);

         notify({ title: "Tashkilotni almashtirib bo'lmadi", text: getApiErrorMessage(err, 'Xatolik yuz berdi') });
      } finally {
         setSwitchingCompanyId(null);
      }
   };

   const handleLogout = async () => {
      const refresh = getRefreshToken();
      if (refresh) {
         await logoutMutation.mutateAsync({ refresh }).catch(() => undefined);
      }
      clearSession();
      window.location.href = '/login';
   };

   return (
      <>
         <header
            id='header'
            className='fixed top-0 right-0 left-0 z-[1020] h-[54px] bg-ca-header shadow-[0_0_2px_rgba(0,0,0,0.3)]'
         >
            <div ref={innerRef} className='flex h-full items-center px-5'>
               <div ref={leftRef} className='flex shrink-0 items-center'>
                  <Link
                     to='/'
                     className='flex h-[54px] w-[220px] items-center justify-center px-5 text-lg font-medium text-ca-nav-text no-underline'
                  >
                     <img src='/logo.png' alt='Logo' className='pointer-events-none mr-2 select-none' draggable={false} />
                  </Link>
                  <button
                     type='button'
                     onClick={onToggleSidebar}
                     className='ml-4 flex flex-col gap-1 p-2.5 lg:hidden'
                     aria-label='Toggle sidebar'
                  >
                     <span className='block h-0.5 w-5 bg-ca-heading' />
                     <span className='block h-0.5 w-5 bg-ca-heading' />
                     <span className='block h-0.5 w-5 bg-ca-heading' />
                  </button>
                  <li className='hidden items-center gap-4 px-3 text-xs text-ca-nav-text md:flex'>
                     <span className='flex items-center gap-1.5'>
                        <FaCalendarAlt className='text-ca-nav-text' />
                        {formatDate(now)}
                     </span>

                     <span className='flex items-center gap-1'>
                        <Tooltip
                           side='bottom'
                           content={
                              isExchangeRateSet
                                 ? 'Bugungi dollar kursi'
                                 : 'Bugungi dollar kursi hali belgilanmagan. Superadmin kursni yangilamaguncha kassada amallar bloklangan.'
                           }
                        >
                           <span
                              className={cn(
                                 'flex items-center gap-1.5 rounded-full  px-2.5 py-1 font-semibold text-white',
                                 isExchangeRateSet ? 'bg-ca-green' : 'bg-ca-red',
                              )}
                           >
                              <FaDollarSign />
                              <span className='tabular-nums'>
                                 {exchangeRate
                                    ? `${Number(exchangeRate.dollar).toLocaleString('ru-RU')} so'm`
                                    : '...'}
                              </span>
                              {!isExchangeRateSet && <FaExclamationTriangle className='animate-pulse' />}
                           </span>
                        </Tooltip>
                        {isSuperAdmin && (
                           <Tooltip side='bottom' content="Kursni o'zgartirish">
                              <button
                                 type='button'
                                 aria-label="Dollar kursini o'zgartirish"
                                 onClick={() => setRateModalCurrency('dollar')}
                                 className='rounded-full p-1.5 text-ca-nav-text/70 transition-colors hover:bg-white/10 hover:text-ca-theme focus:outline-none'
                              >
                                 <FaPencilAlt className='text-[11px]' />
                              </button>
                           </Tooltip>
                        )}
                     </span>

                     <span className='flex items-center gap-1'>
                        <Tooltip
                           side='bottom'
                           content={
                              isYuanExchangeRateSet
                                 ? 'Bugungi yuan kursi'
                                 : 'Bugungi yuan kursi hali belgilanmagan. Superadmin kursni yangilamaguncha Logistika sahifalari bloklangan.'
                           }
                        >
                           <span
                              className={cn(
                                 'flex items-center gap-1.5 rounded-full  px-2.5 py-1 font-semibold text-white',
                                 isYuanExchangeRateSet ? 'bg-ca-green' : 'bg-ca-red',
                              )}
                           >
                              <FaYenSign />
                              <span className='tabular-nums'>
                                 {yuanExchangeRate
                                    ? `1 ¥ = ${Number(yuanExchangeRate.dollar_per_yuan).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} $`
                                    : '...'}
                              </span>
                              {!isYuanExchangeRateSet && <FaExclamationTriangle className='animate-pulse' />}
                           </span>
                        </Tooltip>
                        {isSuperAdmin && (
                           <Tooltip side='bottom' content="Kursni o'zgartirish">
                              <button
                                 type='button'
                                 aria-label="Yuan kursini o'zgartirish"
                                 onClick={() => setRateModalCurrency('yuan')}
                                 className='rounded-full p-1.5 text-ca-nav-text/70 transition-colors hover:bg-white/10 hover:text-ca-theme focus:outline-none'
                              >
                                 <FaPencilAlt className='text-[11px]' />
                              </button>
                           </Tooltip>
                        )}
                     </span>
                  </li>
               </div>

               <ul ref={menuRef} className='ml-auto flex list-none items-center p-0 [&>li]:shrink-0'>
                  <li>
                     <button
                        type='button'
                        onClick={toggleTheme}
                        className='px-[15px] py-[17px] text-sm text-ca-nav-text hover:opacity-60'
                        aria-label={theme === 'dark' ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
                     >
                        {theme === 'dark' ? <FaSun /> : <FaMoon />}
                     </button>
                  </li>

                  <li data-collapsible className={inHeader(0) && canSee[0] ? undefined : 'hidden'}>
                     <Tooltip side='bottom' content='Yangi klientlar'>
                        <button
                           type='button'
                           onClick={() => setNewClientsModalOpen(true)}
                           className='flex items-center gap-1.5 whitespace-nowrap px-[15px] py-[17px] text-sm text-ca-nav-text hover:opacity-60 focus:outline-none'
                           aria-label={
                              unconfirmedClientsCount > 0
                                 ? `Tasdiqlanmagan mijozlar (${unconfirmedClientsCount} ta)`
                                 : 'Tasdiqlanmagan mijozlar'
                           }
                        >
                           <FaUser />
                           <span className='hidden items-center gap-1.5 md:inline-flex'>
                              Tasdiqlanmagan mijozlar
                              {unconfirmedClientsCount > 0 && (
                                 <Badge variant='danger' className='rounded-full'>
                                    {unconfirmedClientsCount}
                                 </Badge>
                              )}
                           </span>
                        </button>
                     </Tooltip>
                  </li>

                  <li data-collapsible className={inHeader(1) && canSee[1] ? undefined : 'hidden'}>
                     <Tooltip side='bottom' content='Telegram xabarnoma'>
                        <button
                           type='button'
                           onClick={() => navigate('/telegram-broadcast')}
                           className='flex items-center gap-1.5 whitespace-nowrap px-[15px] py-[17px] text-sm text-ca-nav-text hover:opacity-60 focus:outline-none'
                           aria-label='Telegram xabarnoma'
                        >
                           <FaPaperPlane />
                           <span className='hidden md:inline'>Telegram xabarnoma</span>
                        </button>
                     </Tooltip>
                  </li>



                  <li data-collapsible className={inHeader(2) && canSee[2] ? undefined : 'hidden'}>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <button
                              type='button'
                              className='flex items-center gap-1.5 whitespace-nowrap px-[15px] py-[17px] text-sm text-ca-nav-text hover:opacity-60 focus:outline-none'
                              aria-label={
                                 unconfirmedTransfersCount > 0
                                    ? `Skladlararo transfer (${unconfirmedTransfersCount} ta tasdiqlanmagan)`
                                    : 'Skladlararo transfer'
                              }
                           >
                              <FaExchangeAlt />
                              <span className='hidden items-center gap-1.5 md:inline-flex'>
                                 Skladlararo transfer
                                 {unconfirmedTransfersCount > 0 && (
                                    <Badge variant='danger' className='rounded-full'>
                                       {unconfirmedTransfersCount}
                                    </Badge>
                                 )}
                              </span>
                              <span className='ml-1 inline-block h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-ca-nav-text' />
                           </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                           <DropdownMenuItem
                              onSelect={() => navigate('/warehouse-transfer')}
                              className='flex items-center gap-2'
                           >
                              <FaExchangeAlt className='text-ca-text' />
                              Skladlararo transfer
                           </DropdownMenuItem>
                           <DropdownMenuItem
                              onSelect={() => navigate('/warehouse-transfer/history')}
                              className='flex items-center gap-2'
                           >
                              <FaHistory className='text-ca-text' />
                              Transfer tarixi
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </li>

                  {showCompanySelect && companies.length > 1 && (
                     <li data-collapsible className={inHeader(3) ? undefined : 'hidden'}>
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <button
                                 type='button'
                                 className='flex items-center gap-1.5 whitespace-nowrap px-[15px] py-[17px] text-sm text-ca-nav-text hover:opacity-60 focus:outline-none'
                              >
                                 <FaBuilding />
                                 <span className='hidden md:inline'>
                                    {currentCompany?.name ?? 'Tashkilot'}
                                 </span>
                                 <span className='ml-1 inline-block h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-ca-nav-text' />
                              </button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent>
                              <DropdownMenuLabel>Tashkilotni tanlash</DropdownMenuLabel>
                              {companies.map((company) => (
                                 <DropdownMenuItem
                                    key={company.id}
                                    disabled={switchingCompanyId != null}
                                    onSelect={() => handleSelectCompany(company.id)}
                                    className='flex items-center justify-between gap-2'
                                 >
                                    <span className='flex items-center gap-1.5'>
                                       {company.name}
                                       {company.id === ownCompanyId && (
                                          <Badge
                                             variant='info'
                                             className='px-1.5 py-0 text-[10px] font-normal'
                                          >
                                             Ishchi
                                          </Badge>
                                       )}
                                    </span>
                                    {switchingCompanyId === company.id ? (
                                       <span className='text-[10px] text-ca-text'>...</span>
                                    ) : (
                                       company.id === companyId && <FaCheck className='text-ca-green' />
                                    )}
                                 </DropdownMenuItem>
                              ))}
                           </DropdownMenuContent>
                        </DropdownMenu>
                     </li>
                  )}

                  <li>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <button
                              type='button'
                              className='flex items-center px-[15px] py-[17px] text-ca-nav-text hover:opacity-60 focus:outline-none'
                           >
                              <img
                                 src={user?.avatar || '/assets/img/user-13.jpg'}
                                 alt=''
                                 className='-mt-[5px] mr-2.5 h-[30px] w-[30px] rounded-full '
                              />
                              <span className='hidden md:inline'>{user?.username ?? 'Admin'}</span>
                              <span className='ml-1 inline-block h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-ca-nav-text' />
                           </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                           {ownCompany && (
                              <DropdownMenuLabel className='flex items-center gap-2'>
                                 {ownCompany.logo ? (
                                    <img
                                       src={ownCompany.logo}
                                       alt=''
                                       className='h-6 w-6 shrink-0 rounded-full object-cover'
                                    />
                                 ) : (
                                    <FaBuilding className='shrink-0 text-ca-text' />
                                 )}
                                 <span className='truncate font-semibold text-ca-heading'>
                                    {ownCompany.name}
                                 </span>
                              </DropdownMenuLabel>
                           )}

                           {hasMenuTop && <DropdownMenuSeparator />}
                           {/* Tablet/mobile: the header menus collapse into this dropdown (only the ones that don't fit the header). */}
                           <DropdownMenuItem
                              onSelect={() => setNewClientsModalOpen(true)}
                              className={inMenu(0) && canSee[0] ? 'flex items-center gap-2' : 'hidden'}
                           >
                              <FaUser className='text-ca-text' />
                              Tasdiqlanmagan mijozlar
                              {unconfirmedClientsCount > 0 && (
                                 <Badge variant='danger' className='ml-auto rounded-full'>
                                    {unconfirmedClientsCount}
                                 </Badge>
                              )}
                           </DropdownMenuItem>
                           <DropdownMenuItem
                              onSelect={() => navigate('/telegram-broadcast')}
                              className={inMenu(1) && canSee[1] ? 'flex items-center gap-2' : 'hidden'}
                           >
                              <FaPaperPlane className='text-ca-text' />
                              Telegram xabarnoma
                           </DropdownMenuItem>
                           <DropdownMenuItem
                              onSelect={() => navigate('/warehouse-transfer')}
                              className={inMenu(2) && canSee[2] ? 'flex items-center gap-2' : 'hidden'}
                           >
                              <FaExchangeAlt className='text-ca-text' />
                              Skladlararo transfer
                              {unconfirmedTransfersCount > 0 && (
                                 <Badge variant='danger' className='ml-auto rounded-full'>
                                    {unconfirmedTransfersCount}
                                 </Badge>
                              )}
                           </DropdownMenuItem>
                           <DropdownMenuItem
                              onSelect={() => navigate('/warehouse-transfer/history')}
                              className={inMenu(2) && canSee[2] ? 'flex items-center gap-2' : 'hidden'}
                           >
                              <FaHistory className='text-ca-text' />
                              Transfer tarixi
                           </DropdownMenuItem>
                           {showCompanySelect && companies.length > 1 && (
                              <div className={inMenu(3) ? undefined : 'hidden'}>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuLabel>Tashkilotni tanlash</DropdownMenuLabel>
                                 {companies.map((company) => (
                                    <DropdownMenuItem
                                       key={company.id}
                                       disabled={switchingCompanyId != null}
                                       onSelect={() => handleSelectCompany(company.id)}
                                       className='flex items-center justify-between gap-2'
                                    >
                                       <span className='flex items-center gap-1.5'>
                                          <FaBuilding className='text-ca-text' />
                                          {company.name}
                                       </span>
                                       {switchingCompanyId === company.id ? (
                                          <span className='text-[10px] text-ca-text'>...</span>
                                       ) : (
                                          company.id === companyId && <FaCheck className='text-ca-green' />
                                       )}
                                    </DropdownMenuItem>
                                 ))}
                              </div>
                           )}
                           {hasMenuTop && isSuperAdmin && <DropdownMenuSeparator />}
                           {isSuperAdmin && (
                              <DropdownMenuItem
                                 onSelect={() => navigate('/system/event-log')}
                                 className='flex items-center gap-2'
                              >
                                 <FaHistory className='text-ca-text' />
                                 O'zgarishlar tarixi
                              </DropdownMenuItem>
                           )}
                           {isSuperAdmin && (
                              <DropdownMenuItem
                                 onSelect={() => navigate('/system/expenses')}
                                 className='flex items-center gap-2'
                              >
                                 <FaReceipt className='text-ca-text' />
                                 Xarajatlar
                              </DropdownMenuItem>
                           )}
                           {isSuperAdmin && (
                              <DropdownMenuItem
                                 onSelect={() => navigate('/system/about')}
                                 className='flex items-center gap-2'
                              >
                                 <FaInfoCircle className='text-ca-text' />
                                 Biz haqimizda
                              </DropdownMenuItem>
                           )}
                           <DropdownMenuSeparator className='my-1 h-px bg-ca-border' />
                           <DropdownMenuItem
                              onSelect={handleLogout}
                              className='flex items-center gap-2 font-medium text-ca-red data-highlighted:bg-red-50'
                           >
                              <FaSignOutAlt />
                              Chiqish
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </li>
               </ul>
            </div>
         </header>

         {isSuperAdmin && companyId && (
            <>
               <ExchangeRateEditModal
                  open={rateModalCurrency === 'dollar'}
                  setOpen={(open) => setRateModalCurrency(open ? 'dollar' : null)}
                  companyId={companyId}
                  currency='dollar'
                  rateId={exchangeRate?.id}
                  rateValue={exchangeRate?.dollar}
               />
               <ExchangeRateEditModal
                  open={rateModalCurrency === 'yuan'}
                  setOpen={(open) => setRateModalCurrency(open ? 'yuan' : null)}
                  companyId={companyId}
                  currency='yuan'
                  rateId={yuanExchangeRate?.id}
                  rateValue={yuanExchangeRate?.dollar_per_yuan}
               />
            </>
         )}

         <NewTelegramClientsModal open={newClientsModalOpen} setOpen={setNewClientsModalOpen} />
      </>
   );
}
