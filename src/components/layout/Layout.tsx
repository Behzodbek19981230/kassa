import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ScrollToTopButton, NotificationProvider } from '../ui'
import Footer from './Footer'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout() {
  const { pathname } = useLocation()
  const [sidebarMinified, setSidebarMinified] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), [])

  useEffect(() => {
    closeMobileSidebar()
  }, [pathname, closeMobileSidebar])

  const contentMargin = sidebarMinified ? 'lg:ml-[60px]' : 'lg:ml-[220px]'
  const footerMargin = sidebarMinified ? 'lg:ml-[85px]' : 'lg:ml-[245px]'

  return (
    <NotificationProvider>
      <div id="page-container" className="min-h-screen pt-[54px]">
        <Header onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

        <Sidebar
          minified={sidebarMinified}
          mobileOpen={mobileSidebarOpen}
          onMinify={() => setSidebarMinified((prev) => !prev)}
          onCloseMobile={closeMobileSidebar}
        />

        <main
          id="content"
          className={`px-[25px] py-5 transition-all duration-200 ${contentMargin}`}
        >
          <Outlet />
        </main>

        <div className={footerMargin}>
          <Footer />
        </div>

        <ScrollToTopButton />
      </div>
    </NotificationProvider>
  )
}
