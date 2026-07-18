import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/errors';
import {
	FaBuilding,
	FaCalendarAlt,
	FaCheck,
	FaClock,
	FaDollarSign,
	FaExclamationTriangle,
	FaHistory,
	FaInfoCircle,
	FaPencilAlt,
	FaReceipt,
	FaSignOutAlt,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { clearSession, getRefreshToken } from '@/lib/auth';
import { useCurrentCompany } from '@/lib/company';
import { cn } from '@/lib/utils';
// import { useTheme } from '@/lib/theme';
import { useLogoutMutation } from '@/services/auth/auth.queries';
import { useUserInfoQuery } from '@/services/user/user.queries';
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
import ExchangeRateEditModal from '@/components/layout/ExchangeRateEditModal';

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
	// const { theme, toggleTheme } = useTheme();
	const now = useClock();
	const {
		companyId,
		setCompanyId,
		companies,
		showCompanySelect,
		ownCompany,
		ownCompanyId,
		isAdminOrManager,
		isSuperAdmin,
		exchangeRate,
		isExchangeRateSet,
	} = useCurrentCompany();
	const currentCompany = companies.find((c) => c.id === companyId);
	const { notify } = useNotification();

	const [switchingCompanyId, setSwitchingCompanyId] = useState<number | null>(null);
	const [rateModalOpen, setRateModalOpen] = useState(false);

	const handleSelectCompany = async (id: number) => {
		setSwitchingCompanyId(id);
		try {
			await setCompanyId(id);
		} catch (err) {
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
		navigate('/login', { replace: true });
	};

	return (
		<>
			<header
				id='header'
				className='fixed top-0 right-0 left-0 z-[1020] h-[54px] bg-ca-header shadow-[0_0_2px_rgba(0,0,0,0.3)]'
			>
				<div className='flex h-full items-center px-5'>
					<div className='flex items-center'>
						<a
							href='/'
							className='flex h-[54px] w-[220px] items-center justify-center px-5 text-lg font-medium text-ca-nav-text no-underline'
						>
							<img src='/logo.png' alt='Logo' className='mr-2 ' />
						</a>
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
							<span className='flex items-center gap-1.5 font-medium text-ca-nav-text tabular-nums'>
								<FaClock className='text-ca-nav-text' />
								{formatTime(now)}
							</span>
							<span className='flex items-center gap-1'>
								<Tooltip
									side='bottom'
									content={
										isExchangeRateSet
											? 'Bugungi dollar kursi'
											: 'Bugungi dollar kursi hali belgilanmagan. Admin yoki menejer kursni yangilamaguncha kassada amallar bloklangan.'
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
								{isAdminOrManager && (
									<Tooltip side='bottom' content="Kursni o'zgartirish">
										<button
											type='button'
											aria-label="Dollar kursini o'zgartirish"
											onClick={() => setRateModalOpen(true)}
											className='rounded-full p-1.5 text-ca-nav-text/70 transition-colors hover:bg-white/10 hover:text-ca-theme focus:outline-none'
										>
											<FaPencilAlt className='text-[11px]' />
										</button>
									</Tooltip>
								)}
							</span>
						</li>
					</div>

					<ul className='ml-auto flex list-none items-center p-0'>
						{/* <li>
							<button
								type='button'
								onClick={toggleTheme}
								className='px-[15px] py-[17px] text-sm text-ca-nav-text hover:opacity-60'
								aria-label={theme === 'dark' ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
							>
								{theme === 'dark' ? <FaSun /> : <FaMoon />}
							</button>
						</li> */}

						{showCompanySelect && companies.length > 1 && (
							<li>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											type='button'
											className='flex items-center gap-1.5 px-[15px] py-[17px] text-sm text-ca-nav-text hover:opacity-60 focus:outline-none'
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

									<DropdownMenuSeparator />
									{isSuperAdmin && (
										<DropdownMenuItem
											onSelect={() => navigate('/system/event-log')}
											className='flex items-center gap-2'
										>
											<FaHistory className='text-ca-text' />
											O'zgarishlar tarixi
										</DropdownMenuItem>
									)}
									<DropdownMenuItem
										onSelect={() => navigate('/system/expenses')}
										className='flex items-center gap-2'
									>
										<FaReceipt className='text-ca-text' />
										Xarajatlar
									</DropdownMenuItem>
									<DropdownMenuItem
										onSelect={() => navigate('/system/about')}
										className='flex items-center gap-2'
									>
										<FaInfoCircle className='text-ca-text' />
										Biz haqimizda
									</DropdownMenuItem>
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

			{isAdminOrManager && companyId && (
				<ExchangeRateEditModal
					open={rateModalOpen}
					setOpen={setRateModalOpen}
					companyId={companyId}
					exchangeRate={exchangeRate}
				/>
			)}
		</>
	);
}
