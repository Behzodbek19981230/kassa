import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** Pages only Super Admin may open; every other role is sent back to the products list. */
export default function SuperAdminRoute() {
  const { isLoading } = useUserInfoQuery()
  const { isSuperAdmin } = usePermissions()

  if (isLoading) return null
  if (!isSuperAdmin) return <Navigate to="/warehouse-products" replace />

  return <Outlet />
}
