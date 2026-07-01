import { cn } from '../../lib/utils'

export interface MediaListItemProps {
  image: string
  title: string
  description: string
  className?: string
}

export function MediaListItem({ image, title, description, className }: MediaListItemProps) {
  return (
    <li
      className={cn(
        'flex gap-4 border-t border-ca-border py-5 first:border-t-0 first:pt-0',
        className,
      )}
    >
      <img
        src={image}
        alt=""
        className="h-24 w-32 shrink-0 rounded object-cover"
      />
      <div>
        <h4 className="mb-2 text-base font-medium text-ca-heading">{title}</h4>
        <p className="m-0 text-xs leading-4 text-ca-text">{description}</p>
      </div>
    </li>
  )
}

interface MediaListProps {
  items: Omit<MediaListItemProps, 'className'>[]
  className?: string
}

export function MediaList({ items, className }: MediaListProps) {
  return (
    <ul className={cn('m-0 list-none p-0', className)}>
      {items.map((item) => (
        <MediaListItem key={item.image} {...item} />
      ))}
    </ul>
  )
}
