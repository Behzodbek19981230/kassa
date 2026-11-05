import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** "Yuk jo'natuvchilar" (/system/consignors): Super Admin + Sklad Manager. */
export default function ConsignorRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canManageConsignor, homePath } = usePermissions()

  if (isLoading) return null
  if (!canManageConsignor) return <Navigate to={homePath} replace />

  return <Outlet />
}
