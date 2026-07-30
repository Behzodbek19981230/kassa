import type { SidebarMenuItem, SidebarMenuPermissions } from '@/types'

export function isRouteMatch(path: string | undefined, pathname: string): boolean {
  if (!path || path === '#') return false
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function hasActiveDescendant(item: SidebarMenuItem, pathname: string): boolean {
  if (isRouteMatch(item.path, pathname)) return true
  return item.children?.some((child) => hasActiveDescendant(child, pathname)) ?? false
}

export function collectExpandedIds(items: SidebarMenuItem[], pathname: string): string[] {
  const ids: string[] = []

  for (const item of items) {
    if (item.children?.length && hasActiveDescendant(item, pathname)) {
      ids.push(item.id)
      ids.push(...collectExpandedIds(item.children, pathname))
    }
  }

  return ids
}

function findContainingList(items: SidebarMenuItem[], targetId: string): SidebarMenuItem[] | null {
  if (items.some((item) => item.id === targetId)) return items

  for (const item of items) {
    if (item.children?.length) {
      const found = findContainingList(item.children, targetId)
      if (found) return found
    }
  }

  return null
}

/** Ids of the other dropdown items sharing `targetId`'s parent list, so opening one can close its siblings. */
export function findSiblingGroupIds(items: SidebarMenuItem[], targetId: string): string[] {
  const list = findContainingList(items, targetId)
  if (!list) return []
  return list.filter((item) => item.id !== targetId && item.children?.length).map((item) => item.id)
}

/** Drops items (and groups left with no visible children) the user lacks the required permission for. */
export function filterMenuByPermissions(
  items: SidebarMenuItem[],
  permissions: SidebarMenuPermissions,
): SidebarMenuItem[] {
  return items.reduce<SidebarMenuItem[]>((acc, item) => {
    if (item.requiredPermission && !permissions[item.requiredPermission]) return acc

    if (item.children?.length) {
      const children = filterMenuByPermissions(item.children, permissions)
      if (children.length === 0) return acc
      acc.push({ ...item, children })
      return acc
    }

    acc.push(item)
    return acc
  }, [])
}
