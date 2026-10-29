import { useCallback, useEffect, useRef, useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import { Outlet, useLocation } from 'react-router-dom';
import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	ScrollToTopButton,
	NotificationProvider,
} from '@/components/ui';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useCurrentCompany } from '@/lib/company';

// Logistika pages work with yuan prices, so they're gated on today's yuan rate as well.
const LOGISTICS_PATH_PREFIX = '/two-stage-import';
const SIDEBAR_MINIFIED_KEY = 'sidebar-minified';

function readSidebarMinified() {
	try {
		return localStorage.getItem(SIDEBAR_MINIFIED_KEY) === '1';
	} catch {
		return false;
	}
}

export default function Layout() {
	const { pathname } = useLocation();
	const { isExchangeRateSet, isYuanExchangeRateSet } = useCurrentCompany();
	const isLogisticsPage = pathname.startsWith(LOGISTICS_PATH_PREFIX);
	const isYuanBlocked = isLogisticsPage && !isYuanExchangeRateSet;
	const [yuanModalOpen, setYuanModalOpen] = useState(false);
	const [sidebarMinified, setSidebarMinified] = useState(readSidebarMinified);
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
	const [rateModalOpen, setRateModalOpen] = useState(false);
	const rateModalShownRef = useRef(false);
	const queryClient = useQueryClient();
	const [pageKey, setPageKey] = useState(0);

	// Remount the current page (fresh local state) and refetch its data.
	const reloadPage = () => {
		setPageKey((key) => key + 1);
		void queryClient.invalidateQueries();
	};

	const toggleSidebarMinified = () => {
		const next = !sidebarMinified;
		setSidebarMinified(next);
		try {
			localStorage.setItem(SIDEBAR_MINIFIED_KEY, next ? '1' : '0');
		} catch {
			// storage unavailable — keep the in-memory state only
		}
	};

	const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

	useEffect(() => {
		closeMobileSidebar();
	}, [pathname, closeMobileSidebar]);

	// Pop the warning once per page load/refresh, the first time we get a real answer
	// that the rate isn't set — not on every render while it flips true during loading.
	useEffect(() => {
		if (!isExchangeRateSet && !rateModalShownRef.current) {
			rateModalShownRef.current = true;
			setRateModalOpen(true);
		}
	}, [isExchangeRateSet]);

	// Warn every time a Logistika page is opened while the yuan rate is missing. The dollar
	// warning takes precedence, so don't stack both modals.
	useEffect(() => {
		setYuanModalOpen(isYuanBlocked && isExchangeRateSet);
	}, [pathname, isYuanBlocked, isExchangeRateSet]);

	const contentMargin = sidebarMinified ? 'lg:ml-[60px]' : 'lg:ml-[220px]';

	return (
		<NotificationProvider defaultPosition='bottom-right'>
			<div id='page-container' className='min-h-screen pt-[54px]'>
				<Header onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

				<Sidebar
					minified={sidebarMinified}
					mobileOpen={mobileSidebarOpen}
					onMinify={toggleSidebarMinified}
					onCloseMobile={closeMobileSidebar}
					onReload={reloadPage}
				/>

				<main id='content' className={`px-[25px] py-5 transition-all duration-200 ${contentMargin}`}>
					{isExchangeRateSet && !isYuanBlocked ? (
						<Outlet key={pageKey} />
					) : isExchangeRateSet ? (
						<div className='flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center'>
							<FaExclamationTriangle className='text-5xl text-ca-red' />
							<div className='text-lg font-semibold text-ca-heading'>Bugungi yuan kursi yangilanmagan</div>
							<div className='max-w-md text-sm text-ca-text'>
								Shuning uchun Logistika bo'limida vazifa qila olmaysiz. Adminga murojaat qiling.
							</div>
						</div>
					) : (
						<div className='flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center'>
							<FaExclamationTriangle className='text-5xl text-ca-red' />
							<div className='text-lg font-semibold text-ca-heading'>
								Bugungi dollar kursi yangilanmagan
							</div>
							<div className='max-w-md text-sm text-ca-text'>
								Shuning uchun hech qanday vazifa qila olmaysiz. Yuqoridagi dollar kursini bosib, kursni yangilang.
							</div>
						</div>
					)}
				</main>

				<ScrollToTopButton />
			</div>

			<Modal open={rateModalOpen} onOpenChange={setRateModalOpen}>
				<ModalContent>
					<ModalHeader>
						<ModalTitle className='flex items-center gap-2 text-ca-red'>
							<FaExclamationTriangle /> Bugungi dollar kursi yangilanmagan
						</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>Shuning uchun hech qanday vazifa qila olmaysiz. Yuqoridagi dollar kursini bosib, kursni yangilang.</p>
					</ModalBody>
					<ModalFooter>
						<Button variant='danger' onClick={() => setRateModalOpen(false)}>
							Tushunarli
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			<Modal open={yuanModalOpen} onOpenChange={setYuanModalOpen}>
				<ModalContent>
					<ModalHeader>
						<ModalTitle className='flex items-center gap-2 text-ca-red'>
							<FaExclamationTriangle /> Bugungi yuan kursi yangilanmagan
						</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>Shuning uchun Logistika bo'limida vazifa qila olmaysiz. Adminga murojaat qiling.</p>
					</ModalBody>
					<ModalFooter>
						<Button variant='danger' onClick={() => setYuanModalOpen(false)}>
							Tushunarli
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</NotificationProvider>
	);
}
