import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** "Sotilgan tovarlar tarixi" (/settings/sold-history): Super Admin, Admin, Manager; everyone else goes home. */
export default function SoldHistoryRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canViewSoldHistory, homePath } = usePermissions()

  if (isLoading) return null
  if (!canViewSoldHistory) return <Navigate to={homePath} replace />

  return <Outlet />
}
