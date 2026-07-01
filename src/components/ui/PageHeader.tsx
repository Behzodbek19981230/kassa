import type { PageHeaderProps } from '../../types'
import { Breadcrumb } from './Breadcrumb'

export function PageHeader({ title, subtitle, breadcrumb }: PageHeaderProps) {
  return (
    <>
      <Breadcrumb items={breadcrumb} className="float-right" />
      <h1 className="clear-both mb-5 border-none p-0 text-2xl leading-7 font-medium text-ca-heading">
        {title}{' '}
        {subtitle && (
          <small className="text-[60%] font-light text-[#7c7f83]">{subtitle}</small>
        )}
      </h1>
    </>
  )
}
