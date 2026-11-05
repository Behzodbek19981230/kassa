import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** /warehouse-products: roles whose home is another page (Sotuvchi, Sklad xodim) are sent there instead. */
export default function WarehouseProductsRoute() {
  const { isLoading } = useUserInfoQuery()
  const { homePath } = usePermissions()

  if (isLoading) return null
  if (homePath !== '/warehouse-products') return <Navigate to={homePath} replace />

  return <Outlet />
}
