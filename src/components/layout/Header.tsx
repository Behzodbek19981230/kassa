import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/errors';
import {
	FaBell,
	FaBug,
	FaBuilding,
	FaCalendarAlt,
	FaCheck,
	FaClock,
	FaDollarSign,
	FaEnvelope,
	FaPlus,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { clearSession, getRefreshToken } from '@/lib/auth';
import { useCurrentCompany } from '@/lib/company';
// import { useTheme } from '@/lib/theme';
import { useLogoutMutation } from '@/services/auth/auth.queries';
import { useCurrencyRateQuery } from '@/services/currency/currency.queries';
import { useUserInfoQuery } from '@/services/user/user.queries';
import {
	Badge,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuFooter,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuLinkItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMediaItem,
	useNotification,
} from '@/components/ui';

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
	const { data: usdRate } = useCurrencyRateQuery('USD');
	const { companyId, setCompanyId, companies, showCompanySelect, ownCompany } = useCurrentCompany();
	const currentCompany = companies.find((c) => c.id === companyId);
	const { notify } = useNotification();

	const [switchingCompanyId, setSwitchingCompanyId] = useState<number | null>(null);

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
						<span className='flex items-center gap-1.5'>
							<FaDollarSign className='text-ca-green' />
							{usdRate ? `${usdRate.rate.toLocaleString('ru-RU')} so'm` : '...'}
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

					<li>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type='button'
									className='relative px-[15px] py-[17px] text-sm text-ca-nav-text hover:opacity-60 focus:outline-none'
								>
									<FaBell />
									<Badge
										variant='danger'
										className='absolute top-[7px] right-[3px] rounded-full px-[0.6em] py-[0.3em] font-light'
									>
										5
									</Badge>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className='w-[280px]'>
								<DropdownMenuLabel>Notifications (5)</DropdownMenuLabel>
								<DropdownMediaItem
									icon={<FaBug />}
									iconBg='bg-ca-red'
									title='Server Error Reports'
									time='3 minutes ago'
								/>
								<DropdownMediaItem
									icon={<FaPlus />}
									iconBg='bg-ca-green'
									title='New User Registered'
									time='1 hour ago'
								/>
								<DropdownMediaItem
									icon={<FaEnvelope />}
									iconBg='bg-ca-primary'
									title='New Email From John'
									time='2 hour ago'
								/>
								<DropdownMenuFooter>
									<DropdownMenuLinkItem href='#'>View more</DropdownMenuLinkItem>
								</DropdownMenuFooter>
							</DropdownMenuContent>
						</DropdownMenu>
					</li>

					{showCompanySelect && companies.length > 1 && (
						<li>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type='button'
										className='flex items-center gap-1.5 px-[15px] py-[17px] text-sm text-ca-nav-text hover:opacity-60 focus:outline-none'
									>
										<FaBuilding />
										<span className='hidden md:inline'>{currentCompany?.name ?? 'Tashkilot'}</span>
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
											{company.name}
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
								<DropdownMenuItem onSelect={handleLogout}>Chiqish</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</li>
				</ul>
			</div>
		</header>
	);
}
