import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/**
 * "Qarz to'lov karzinka" (/settings/debt-repayments-drafts): Super Admin + Admin only; everyone else is sent back
 * to the products list. The deleted-repayments history under it is Super Admin only and sits under SuperAdminRoute.
 */
export default function DebtRepaymentDraftRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canViewDebtRepaymentDrafts, homePath } = usePermissions()

  if (isLoading) return null
  if (!canViewDebtRepaymentDrafts) return <Navigate to={homePath} replace />

  return <Outlet />
}
