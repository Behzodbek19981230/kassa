import { useCallback, useEffect, useRef, useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
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

export default function Layout() {
	const { pathname } = useLocation();
	const { isExchangeRateSet } = useCurrentCompany();
	const [sidebarMinified, setSidebarMinified] = useState(false);
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
	const [rateModalOpen, setRateModalOpen] = useState(false);
	const rateModalShownRef = useRef(false);

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

	const contentMargin = sidebarMinified ? 'lg:ml-[60px]' : 'lg:ml-[220px]';

	return (
		<NotificationProvider>
			<div id='page-container' className='min-h-screen pt-[54px]'>
				<Header onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

				<Sidebar
					minified={sidebarMinified}
					mobileOpen={mobileSidebarOpen}
					onMinify={() => setSidebarMinified((prev) => !prev)}
					onCloseMobile={closeMobileSidebar}
				/>

				<main id='content' className={`px-[25px] py-5 transition-all duration-200 ${contentMargin}`}>
					{isExchangeRateSet ? (
						<Outlet />
					) : (
						<div className='flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center'>
							<FaExclamationTriangle className='text-5xl text-ca-red' />
							<div className='text-lg font-semibold text-ca-heading'>Dollar kursi o'zgarmagan</div>
							<div className='max-w-md text-sm text-ca-text'>
								Shuning uchun hech qanday vazifa qila olmaysiz. Adminga murojaat qiling.
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
							<FaExclamationTriangle /> Dollar kursi o'zgarmagan
						</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>Shuning uchun hech qanday vazifa qila olmaysiz. Adminga murojaat qiling.</p>
					</ModalBody>
					<ModalFooter>
						<Button variant='danger' onClick={() => setRateModalOpen(false)}>
							Tushunarli
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</NotificationProvider>
	);
}
