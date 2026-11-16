import { Navigate, Outlet } from 'react-router-dom'
import { useCurrentCompany } from '@/lib/company'
import { usePermissions } from '@/lib/permissions'

/** Logistika pages: only for a company with is_logistika; nest it inside SuperAdminRoute. */
export default function LogistikaRoute() {
  const { isLogistika, isLogistikaLoading } = useCurrentCompany()
  const { homePath } = usePermissions()

  if (isLogistikaLoading) return null
  if (!isLogistika) return <Navigate to={homePath} replace />

  return <Outlet />
}
