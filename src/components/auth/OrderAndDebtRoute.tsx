import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** "Buyurtmalar va qarzlar" (/order-and-debt): closed for Sotuvchi and Sklad xodim. */
export default function OrderAndDebtRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canViewOrderAndDebt, homePath } = usePermissions()

  if (isLoading) return null
  if (!canViewOrderAndDebt) return <Navigate to={homePath} replace />

  return <Outlet />
}
