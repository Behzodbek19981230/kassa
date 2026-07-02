import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ScrollToTopButton, NotificationProvider } from '@/components/ui';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export default function Layout() {
	const { pathname } = useLocation();
	const [sidebarMinified, setSidebarMinified] = useState(false);
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

	const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

	useEffect(() => {
		closeMobileSidebar();
	}, [pathname, closeMobileSidebar]);

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
					<Outlet />
				</main>

				<ScrollToTopButton />
			</div>
		</NotificationProvider>
	);
}
