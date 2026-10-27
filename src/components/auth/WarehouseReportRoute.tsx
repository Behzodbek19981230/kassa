import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** "Omborxona hisobi" pages: Super Admin + Sklad Manager only; everyone else is sent back to the products list. */
export default function WarehouseReportRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canViewWarehouseReport } = usePermissions()

  if (isLoading) return null
  if (!canViewWarehouseReport) return <Navigate to="/warehouse-products" replace />

  return <Outlet />
}
