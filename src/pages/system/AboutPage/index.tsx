import {
	FaBuilding,
	FaEdit,
	FaExclamationTriangle,
	FaInstagram,
	FaMapMarkerAlt,
	FaPhone,
	FaTelegramPlane,
	FaYoutube,
} from 'react-icons/fa';
import { Badge, Button, buttonProps, PageHeader, Panel, Skeleton, Tooltip } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { resolveMediaUrl } from '@/lib/media';
import CompanyFormModal from '@/pages/system/CompanyPage/components/CompanyFormModal';
import { useCompanyQuery } from '@/services/company/company.queries';

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className='flex items-start gap-3'>
			<div className='mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ca-theme/10 text-ca-theme'>
				{icon}
			</div>
			<div className='min-w-0'>
				<div className='text-xs text-ca-text'>{label}</div>
				<div className='text-sm wrap-break-word whitespace-pre-line font-semibold text-ca-heading'>
					<span>{value}</span>
				</div>
			</div>
		</div>
	);
}

function SocialLink({
	href,
	label,
	icon,
	className,
}: {
	href?: string | null;
	label: string;
	icon: React.ReactNode;
	className: string;
}) {
	if (!href) return null;
	return (
		<Tooltip content={label}>
			<a
				href={href}
				target='_blank'
				rel='noreferrer'
				aria-label={label}
				className={`flex h-10 w-10 items-center justify-center rounded-full text-lg text-white shadow-sm transition-transform hover:scale-105 ${className}`}
			>
				{icon}
			</a>
		</Tooltip>
	);
}

export default function AboutPage() {
	const { companyId, isSuperAdmin } = useCurrentCompany();
	const { data: company, isLoading, isFetching, isError, error, refetch } = useCompanyQuery(companyId);

	const region = company?.region_detail?.name;
	const district = company?.district_detail?.name;
	const location = [region, district].filter(Boolean).join(', ');
	const telegramUsername = company?.telegram_bot_username?.replace(/^@/, '');
	const hasSocialLinks =
		!!telegramUsername || !!company?.telegram_channel_url || !!company?.instagram_url || !!company?.youtube_url;
	console.log(location);

	return (
		<>
			<PageHeader
				title='Biz haqimizda'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Biz haqimizda', active: true },
				]}
			/>

			<Panel
				title="Tashkilot ma'lumotlari"
				actions={
					isSuperAdmin &&
					company && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{ ...buttonProps(<FaEdit />, 'warning', 'icon'), 'aria-label': 'Tahrirlash' }}
							dialog={CompanyFormModal}
							dialogProps={{ mode: 'edit' as const, item: company }}
						/>
					)
				}
				onReload={() => {
					refetch();
				}}
			>
				{isLoading || isFetching ? (
					<div className='flex flex-col gap-5 sm:flex-row'>
						<Skeleton className='h-28 w-28 shrink-0 rounded-2xl' />
						<div className='flex flex-1 flex-col gap-3'>
							<Skeleton className='h-5 w-56' />
							<Skeleton className='h-3 w-32' />
							<Skeleton className='mt-3 h-3 w-full' />
							<Skeleton className='h-3 w-full' />
							<Skeleton className='h-3 w-2/3' />
						</div>
					</div>
				) : isError ? (
					<div className='flex flex-col items-center gap-2 py-10 text-center text-ca-text'>
						<FaExclamationTriangle className='text-4xl text-ca-red' />
						<div>{getApiErrorMessage(error, 'Xatolik yuz berdi')}</div>
					</div>
				) : !company ? (
					<div className='py-10 text-center text-ca-text'>Tashkilot topilmadi</div>
				) : (
					<div className='max-w-3xl'>
						<div className='flex flex-col gap-5 sm:flex-row sm:items-start'>
							{company.logo ? (
								<img
									src={resolveMediaUrl(company.logo)}
									alt={company.name}
									className='h-28 w-28 shrink-0 self-start rounded-2xl border border-ca-border object-cover '
								/>
							) : (
								<div className='flex h-28 w-28 shrink-0 items-center justify-center self-start rounded-2xl bg-ca-theme/10 text-4xl text-ca-theme'>
									<FaBuilding />
								</div>
							)}

							<div className='min-w-0 flex-1'>
								<div className='text-xl font-semibold '>{company.name}</div>
								<div className='mt-1.5 flex flex-wrap items-center gap-2'>
									{company.code && <span className='text-xs text-ca-text'>Kod: {company.code}</span>}
									<Badge variant={company.is_active ? 'success' : 'danger'}>
										{company.is_active ? 'Faol' : 'Nofaol'}
									</Badge>
								</div>

								{hasSocialLinks && (
									<div className='mt-4 flex flex-wrap items-center gap-2.5'>
										<SocialLink
											href={telegramUsername ? `https://t.me/${telegramUsername}` : null}
											label='Telegram bot'
											icon={<FaTelegramPlane />}
											className='bg-[#26A5E4]'
										/>
										<SocialLink
											href={company.telegram_channel_url}
											label='Telegram kanal'
											icon={<FaTelegramPlane />}
											className='bg-[#26A5E4]'
										/>
										<SocialLink
											href={company.instagram_url}
											label='Instagram'
											icon={<FaInstagram />}
											className='bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]'
										/>
										<SocialLink
											href={company.youtube_url}
											label='YouTube'
											icon={<FaYoutube />}
											className='bg-[#FF0000]'
										/>
									</div>
								)}
							</div>
						</div>

						<div className='mt-6 grid grid-cols-1 gap-x-6 gap-y-5 border-t border-ca-border pt-5 sm:grid-cols-2'>
							{company && <InfoItem icon={<FaPhone />} label='Telefon' value={company.phone} />}

							<InfoItem icon={<FaMapMarkerAlt />} label='Hudud' value={location} />
							<div className='sm:col-span-2'>
								<InfoItem icon={<FaMapMarkerAlt />} label='Manzil' value={company?.address || '—'} />
							</div>
						</div>
					</div>
				)}
			</Panel>
		</>
	);
}
