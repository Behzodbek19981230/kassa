import type { SidebarMenuItem } from '../types'

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
