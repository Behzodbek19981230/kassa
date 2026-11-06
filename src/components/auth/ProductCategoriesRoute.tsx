import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** "Mahsulot toifalari" (Modellar + Mahsulot toifalari): Super Admin + Admin only; everyone else is sent back to the products list. */
export default function ProductCategoriesRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canViewProductCategories, homePath } = usePermissions()

  if (isLoading) return null
  if (!canViewProductCategories) return <Navigate to={homePath} replace />

  return <Outlet />
}
