import { Link } from 'react-router-dom'
import type { BreadcrumbItem } from '../../types'
import { cn } from '../../lib/utils'

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <ol className={cn('m-0 flex list-none flex-wrap p-0 text-xs leading-7', className)}>
      {items.map((item, i) => (
        <li
          key={`${item.label}-${i}`}
          className={cn(
            i < items.length - 1 && 'after:mx-1 after:content-["/"]',
            item.active && 'text-ca-text',
          )}
        >
          {item.active ? (
            <span>{item.label}</span>
          ) : item.path && item.path !== '#' ? (
            <Link to={item.path} className="text-ca-heading no-underline hover:opacity-60">
              {item.label}
            </Link>
          ) : (
            <a href="#" className="text-ca-heading no-underline hover:opacity-60">
              {item.label}
            </a>
          )}
        </li>
      ))}
    </ol>
  )
}
