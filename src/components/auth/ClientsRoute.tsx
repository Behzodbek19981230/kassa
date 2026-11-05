import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** "Mijozlar" pages: Super Admin + Admin only; everyone else is sent back to the products list. */
export default function ClientsRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canViewClients, homePath } = usePermissions()

  if (isLoading) return null
  if (!canViewClients) return <Navigate to={homePath} replace />

  return <Outlet />
}
