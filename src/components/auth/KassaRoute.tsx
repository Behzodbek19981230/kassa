import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** "Kassa" pages (/kassa/*): Super Admin and Admin; everyone else goes home. */
export default function KassaRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canViewKassa, homePath } = usePermissions()

  if (isLoading) return null
  if (!canViewKassa) return <Navigate to={homePath} replace />

  return <Outlet />
}
