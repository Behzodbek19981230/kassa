import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
	FaAngleDoubleLeft,
	FaBalanceScale,
	FaBookmark,
	FaBoxes,
	FaCaretRight,
	FaChartBar,
	FaChartPie,
	FaCheckCircle,
	FaCircle,
	FaCogs,
	FaExclamationTriangle,
	FaFileInvoice,
	FaHistory,
	FaLayerGroup,
	FaReceipt,
	FaRulerCombined,
	FaShippingFast,
	FaShoppingCart,
	FaTags,
	FaTruck,
	FaUndo,
	FaUsersCog,
	FaWarehouse,
} from 'react-icons/fa';
import { sidebarMenu } from '@/data/sidebarMenu';
import type { SidebarIcon, SidebarMenuItem } from '@/types';
import { collectExpandedIds, hasActiveDescendant, isRouteMatch } from '@/utils/sidebarUtils';

interface SidebarProps {
	minified: boolean;
	mobileOpen: boolean;
	onMinify: () => void;
	onCloseMobile: () => void;
}

const iconMap: Record<SidebarIcon, ReactNode> = {
	boxes: <FaBoxes />,
	cart: <FaShoppingCart />,
	history: <FaHistory />,
	'balance-scale': <FaBalanceScale />,
	'chart-pie': <FaChartPie />,
	undo: <FaUndo />,
	'file-invoice': <FaFileInvoice />,
	tags: <FaTags />,
	truck: <FaTruck />,
	warehouse: <FaWarehouse />,
	bookmark: <FaBookmark />,
	cogs: <FaCogs />,
	'layer-group': <FaLayerGroup />,
	'ruler-combined': <FaRulerCombined />,
	'shipping-fast': <FaShippingFast />,
	'check-circle': <FaCheckCircle />,
	'exclamation-triangle': <FaExclamationTriangle />,
	'users-cog': <FaUsersCog />,
	'chart-bar': <FaChartBar />,
	receipt: <FaReceipt />,
};

function SubMenuBullet({ active }: { active: boolean }) {
	return (
		<FaCircle
			className={`absolute top-1/2 left-1 -translate-y-1/2 text-[7px] ${
				active ? 'text-ca-theme drop-shadow-[0_0_5px_rgba(52,143,226,0.5)]' : 'text-ca-border'
			}`}
		/>
	);
}

function SubMenuMarker({ icon, active }: { icon?: SidebarIcon; active: boolean }) {
	if (icon) {
		return (
			<span
				className={`absolute top-1/2 left-1 w-3.5 -translate-y-1/2 text-center text-[11px] ${
					active ? 'text-ca-theme' : 'text-ca-sidebar-muted'
				}`}
			>
				{iconMap[icon]}
			</span>
		);
	}

	return <SubMenuBullet active={active} />;
}

interface SubMenuItemProps {
	item: SidebarMenuItem;
	pathname: string;
	expanded: Set<string>;
	onToggle: (id: string) => void;
	onNavigate: () => void;
	nested?: boolean;
	inFlyout?: boolean;
}

function SubMenuItem({
	item,
	pathname,
	expanded,
	onToggle,
	onNavigate,
	nested = false,
	inFlyout = false,
}: SubMenuItemProps) {
	const hasChildren = Boolean(item.children?.length);
	const isOpen = expanded.has(item.id);
	const branchActive = hasActiveDescendant(item, pathname);
	const isActive = isRouteMatch(item.path, pathname);
	const isVisible = branchActive || isOpen;

	const rowClass = `relative flex w-full items-center text-left text-sm font-light transition-colors ${
		inFlyout ? 'px-5 py-2' : 'px-5 py-[6px]'
	}`;

	if (hasChildren) {
		return (
			<li className='relative list-none'>
				<button
					type='button'
					onClick={() => onToggle(item.id)}
					className={`${rowClass} ${
						branchActive
							? 'text-ca-theme font-medium'
							: 'text-ca-sidebar-muted hover:bg-ca-silver hover:text-ca-heading'
					}`}
				>
					<SubMenuMarker icon={item.icon} active={branchActive} />
					<span className='flex-1 pl-4'>{item.label}</span>
					<FaCaretRight
						className={`text-[9px] opacity-80 transition-transform duration-200 ${
							isVisible ? 'rotate-90' : ''
						}`}
					/>
				</button>

				<ul
					className={`relative m-0 list-none overflow-hidden transition-all duration-200 ${
						inFlyout
							? 'border-l border-ca-border bg-ca-silver pl-3'
							: nested
								? 'bg-transparent pl-[30px]'
								: 'bg-transparent pl-[30px]'
					} ${isVisible ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
				>
					{item.children!.map((child) => (
						<SubMenuItem
							key={child.id}
							item={child}
							pathname={pathname}
							expanded={expanded}
							onToggle={onToggle}
							onNavigate={onNavigate}
							nested
							inFlyout={inFlyout}
						/>
					))}
				</ul>
			</li>
		);
	}

	const linkClass = `${rowClass} no-underline ${
		isActive
			? 'bg-ca-theme/10 text-ca-theme font-medium'
			: 'text-ca-sidebar-muted hover:bg-ca-silver hover:text-ca-heading'
	}`;

	return (
		<li className='list-none'>
			{item.path && item.path !== '#' ? (
				<Link to={item.path} onClick={onNavigate} className={linkClass}>
					<SubMenuMarker icon={item.icon} active={isActive} />
					<span className='pl-4'>{item.label}</span>
				</Link>
			) : (
				<a href='#' className={linkClass} onClick={(e) => e.preventDefault()}>
					<SubMenuMarker icon={item.icon} active={false} />
					<span className='pl-4'>{item.label}</span>
				</a>
			)}
		</li>
	);
}

interface MenuItemProps {
	item: SidebarMenuItem;
	pathname: string;
	expanded: Set<string>;
	onToggle: (id: string) => void;
	onNavigate: () => void;
	minified: boolean;
}

function MenuItem({ item, pathname, expanded, onToggle, onNavigate, minified }: MenuItemProps) {
	const hasChildren = Boolean(item.children?.length);
	const isOpen = expanded.has(item.id);
	const branchActive = hasActiveDescendant(item, pathname);
	const isDirectActive = isRouteMatch(item.path, pathname);
	const isVisible = branchActive || isOpen;

	if (item.type === 'header') {
		if (minified) return null;
		return (
			<li className='list-none px-5 py-2.5 text-[11px] leading-5 font-normal text-ca-nav-header'>{item.label}</li>
		);
	}

	if (!hasChildren) {
		const active = isDirectActive;
		const linkClass = `flex items-center px-5 py-2 text-sm leading-5 no-underline transition-colors ${
			active
				? 'bg-ca-theme text-white'
				: 'text-ca-sidebar-text hover:bg-ca-sidebar-hover hover:text-ca-sidebar-text'
		}`;

		return (
			<li className={`relative list-none ${active ? 'active' : ''}`}>
				{item.path && item.path !== '#' ? (
					<Link
						to={item.path}
						onClick={onNavigate}
						className={linkClass}
						title={minified ? item.label : undefined}
					>
						{item.icon && (
							<span
								className={`w-[14px] shrink-0 text-center text-sm ${minified ? 'mx-auto' : 'mr-[15px]'}`}
							>
								{iconMap[item.icon]}
							</span>
						)}
						{!minified && <span>{item.label}</span>}
					</Link>
				) : (
					<a href='#' className={linkClass} onClick={(e) => e.preventDefault()}>
						{item.icon && (
							<span
								className={`w-[14px] shrink-0 text-center text-sm ${minified ? 'mx-auto' : 'mr-[15px]'}`}
							>
								{iconMap[item.icon]}
							</span>
						)}
						{!minified && <span>{item.label}</span>}
					</a>
				)}
			</li>
		);
	}

	const parentClass = `flex w-full items-center px-5 py-2 text-sm leading-5 no-underline transition-colors ${
		branchActive
			? 'bg-ca-theme text-white'
			: isVisible
				? 'bg-ca-sidebar-hover text-ca-sidebar-text'
				: 'text-ca-sidebar-text hover:bg-ca-sidebar-hover hover:text-ca-sidebar-text'
	}`;

	return (
		<li className={`group/sub relative list-none ${branchActive ? 'active' : ''} ${isVisible ? 'expand' : ''}`}>
			<button
				type='button'
				onClick={() => !minified && onToggle(item.id)}
				className={parentClass}
				title={minified ? item.label : undefined}
			>
				{item.icon && (
					<span className={`w-[14px] shrink-0 text-center text-sm ${minified ? 'mx-auto' : 'mr-[15px]'}`}>
						{iconMap[item.icon]}
					</span>
				)}
				{!minified && (
					<>
						<span className='flex flex-1 items-center text-left'>
							{item.label}
							{item.tag && (
								<span
									className={`ml-1.5 rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold ${
										branchActive ? 'bg-black/40 text-white' : 'bg-ca-theme text-white'
									}`}
								>
									{item.tag}
								</span>
							)}
						</span>
						{item.badge ? (
							<span
								className={`rounded-[3px] px-2 py-[3px] text-[10px] font-light ${
									branchActive ? 'bg-black/40 text-white' : 'bg-ca-badge-bg text-white'
								}`}
							>
								{item.badge}
							</span>
						) : (
							<FaCaretRight
								className={`text-sm transition-transform duration-200 ${
									isVisible ? 'rotate-90' : ''
								} ${branchActive ? 'text-white/80' : 'text-ca-sidebar-text/80'}`}
							/>
						)}
					</>
				)}
			</button>

			{/* Normal expanded sub-menu */}
			{!minified && (
				<ul
					className={`relative m-0 list-none overflow-hidden bg-ca-sidebar-dark transition-all duration-200 before:absolute before:top-0 before:bottom-0 before:left-[26px] before:w-[2px] before:bg-ca-border ${
						isVisible ? 'max-h-[800px] py-2.5 pl-[30px] opacity-100' : 'max-h-0 py-0 pl-[30px] opacity-0'
					}`}
				>
					{item.children!.map((child) => (
						<SubMenuItem
							key={child.id}
							item={child}
							pathname={pathname}
							expanded={expanded}
							onToggle={onToggle}
							onNavigate={onNavigate}
						/>
					))}
				</ul>
			)}

			{/* Minified hover flyout */}
			{minified && (
				<div className='pointer-events-none absolute top-0 left-full z-[1050] hidden pl-0 group-hover/sub:pointer-events-auto group-hover/sub:block'>
					<div className='ml-0 w-[220px] overflow-hidden rounded-r-[3px] border border-ca-border bg-ca-sidebar-dark shadow-[4px_4px_16px_rgba(0,0,0,0.15)]'>
						<div className='border-b border-ca-border bg-ca-silver px-5 py-2.5 text-sm font-semibold text-ca-heading'>
							{item.label}
						</div>
						<ul className='relative m-0 list-none py-2 before:absolute before:top-2 before:bottom-2 before:left-[18px] before:w-[2px] before:bg-ca-border'>
							{item.children!.map((child) => (
								<SubMenuItem
									key={child.id}
									item={child}
									pathname={pathname}
									expanded={expanded}
									onToggle={onToggle}
									onNavigate={onNavigate}
									inFlyout
								/>
							))}
						</ul>
					</div>
				</div>
			)}
		</li>
	);
}

export default function Sidebar({ minified, mobileOpen, onMinify, onCloseMobile }: SidebarProps) {
	const { pathname } = useLocation();
	const [expanded, setExpanded] = useState<Set<string>>(() => new Set(collectExpandedIds(sidebarMenu, pathname)));
	useEffect(() => {
		const activeIds = collectExpandedIds(sidebarMenu, pathname);
		setExpanded((prev) => new Set([...prev, ...activeIds]));
	}, [pathname]);

	const toggleExpanded = (id: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const widthClass = minified ? 'w-[60px]' : 'w-[220px]';
	const mobileClass = mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0';
	const overflowClass = minified ? 'overflow-visible' : 'overflow-x-hidden overflow-y-auto';

	return (
		<>
			<div
				className={`fixed top-0 bottom-0 left-0 z-[1000] border-r border-ca-border bg-ca-sidebar pt-[54px] transition-all duration-200 ${widthClass} ${mobileClass} ${minified ? 'overflow-visible' : ''}`}
			/>

			<aside
				id='sidebar'
				className={`fixed top-0 bottom-0 left-0 z-[1010] pt-[54px] transition-all duration-200 ${widthClass} ${mobileClass} ${overflowClass}`}
			>
				<ul className='m-0 list-none py-5'>
					<li>
						<div className={`px-5 text-sm font-semibold ${minified ? 'opacity-0' : 'opacity-100'}`}>
							Menyular
						</div>
					</li>
					{/* <li
						className='relative overflow-hidden border-b border-ca-border p-5'
						style={{
							backgroundImage: 'url(/assets/img/gallery/gallery-10.jpg)',
							backgroundSize: 'cover',
							backgroundPosition: 'center',
						}}
					>
						<div className='absolute inset-0 bg-ca-theme/80' />
						<div className={`relative flex items-start ${minified ? 'justify-center' : ''}`}>
							<div
								className={`mt-0.5 h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full ${minified ? '' : 'mr-[15px]'}`}
							>
								<img src='/assets/img/user-13.jpg' alt='' className='h-full w-full object-cover' />
							</div>
							{!minified && (
								<div className='text-sm leading-snug text-white'>
									{fullName ?? 'Foydalanuvchi'}
									<small className='mt-0 block text-[11px] text-white/70'>{roleLabel}</small>
								</div>
							)}
						</div>
					</li> */}
				</ul>

				<ul className={`m-0 list-none p-0 pb-12 ${minified ? 'overflow-visible' : ''}`}>
					{sidebarMenu.map((item) => (
						<MenuItem
							key={item.id}
							item={item}
							pathname={pathname}
							expanded={expanded}
							onToggle={toggleExpanded}
							onNavigate={onCloseMobile}
							minified={minified}
						/>
					))}

					<li className='clear-both list-none'>
						<button
							type='button'
							onClick={onMinify}
							className='float-right mx-0 my-2.5 flex items-center rounded-l-full bg-ca-badge-bg py-[5px] pr-5 pl-2.5 text-white transition-opacity hover:opacity-80'
							aria-label={minified ? 'Expand sidebar' : 'Minify sidebar'}
						>
							<FaAngleDoubleLeft
								className={`text-sm transition-transform duration-200 ${minified ? 'rotate-180' : ''}`}
							/>
						</button>
					</li>
				</ul>
			</aside>

			{mobileOpen && (
				<button
					type='button'
					aria-label='Close sidebar'
					className='fixed inset-0 z-[1005] bg-black/40 lg:hidden'
					onClick={onCloseMobile}
				/>
			)}
		</>
	);
}
