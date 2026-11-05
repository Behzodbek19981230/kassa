import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** "Tovarlar va Narxlar" list: Super Admin + Admin + Manager; everyone else is sent back to the products list. */
export default function WarehousePricesRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canViewWarehousePrices, homePath } = usePermissions()

  if (isLoading) return null
  if (!canViewWarehousePrices) return <Navigate to={homePath} replace />

  return <Outlet />
}
