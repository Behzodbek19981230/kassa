import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** "Do'kon kartalari" (/system/payment-cards/*): Super Admin, for now only is_staff users; everyone else goes home. */
export default function PaymentCardsRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canViewPaymentCards, homePath } = usePermissions()

  if (isLoading) return null
  if (!canViewPaymentCards) return <Navigate to={homePath} replace />

  return <Outlet />
}
