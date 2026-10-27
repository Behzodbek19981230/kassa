import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/**
 * Order cart pages (/order-cart, /cart-drafts): Super Admin + Admin only; everyone else is sent back to the products list.
 * The deleted-orders history under /cart-drafts is Super Admin only and sits under SuperAdminRoute instead.
 */
export default function OrderCartRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canManageOrderCart } = usePermissions()

  if (isLoading) return null
  if (!canManageOrderCart) return <Navigate to="/warehouse-products" replace />

  return <Outlet />
}
