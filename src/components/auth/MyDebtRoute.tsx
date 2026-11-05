import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** "Mening qarzlarim" (/my-debts): Super Admin + Sklad Manager (read-only for the latter). */
export default function MyDebtRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canViewMyDebts, homePath } = usePermissions()

  if (isLoading) return null
  if (!canViewMyDebts) return <Navigate to={homePath} replace />

  return <Outlet />
}
