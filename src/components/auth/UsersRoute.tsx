import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useUserInfoQuery } from '@/services/user/user.queries'

/** "Hodimlar" (/system/users and a user's payroll): Super Admin, Admin and Sklad Manager, each seeing their own tabs. */
export default function UsersRoute() {
  const { isLoading } = useUserInfoQuery()
  const { canViewUsersPage, homePath } = usePermissions()

  if (isLoading) return null
  if (!canViewUsersPage) return <Navigate to={homePath} replace />

  return <Outlet />
}
