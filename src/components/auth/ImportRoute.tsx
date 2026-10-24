import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** Import page: closed for Manager, who is sent back to the products list. */
export default function ImportRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canImport } = usePermissions()

  if (isLoading) return null
  if (!canImport) return <Navigate to="/warehouse-products" replace />

  return <Outlet />
}
