import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** "Qarzdorlar ro'yxati" (/settings/debtors): Super Admin + Manager. */
export default function ClientDebtorRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canViewClientDebtors, homePath } = usePermissions()

  if (isLoading) return null
  if (!canViewClientDebtors) return <Navigate to={homePath} replace />

  return <Outlet />
}
