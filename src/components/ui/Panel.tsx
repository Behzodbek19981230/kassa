import { FaExpand, FaMinus, FaRedo, FaTimes } from 'react-icons/fa'
import type { PanelProps } from '../../types'
import { cn } from '../../lib/utils'
import { Button } from './Button'
import { useState } from 'react'

export function Panel({
  title,
  children,
  toolbar,
  footer,
  className = '',
  bodyClassName = '',
}: PanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={cn('mb-5 overflow-hidden rounded-[3px] bg-white shadow-none', className)}>
      <div className="flex items-center bg-ca-panel-inverse px-[15px] py-[10px] text-white">
        <div className="order-2 ml-auto flex items-center gap-2">
          <Button variant="default" size="icon-xs" type="button" aria-label="Expand panel">
            <FaExpand />
          </Button>
          <Button variant="success" size="icon-xs" type="button" aria-label="Reload panel">
            <FaRedo />
          </Button>
          <Button
            variant="warning"
            size="icon-xs"
            type="button"
            aria-label="Collapse panel"
            onClick={() => setCollapsed(!collapsed)}
          >
            <FaMinus />
          </Button>
          <Button variant="danger" size="icon-xs" type="button" aria-label="Remove panel">
            <FaTimes />
          </Button>
        </div>
        <h4 className="order-1 flex-1 text-xs leading-5 font-normal">{title}</h4>
      </div>
      {toolbar && !collapsed && (
        <div className="border-t border-ca-border bg-white px-[15px] py-[10px]">{toolbar}</div>
      )}
      {!collapsed && <div className={cn('p-[15px]', bodyClassName)}>{children}</div>}
      {footer && !collapsed && (
        <div className="border-t border-ca-border bg-white px-[15px] py-[14px]">{footer}</div>
      )}
    </div>
  )
}
