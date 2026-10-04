import { FaAngleDoubleLeft, FaAngleDoubleRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const DOTS = '...' as const

function range(start: number, end: number): number[] {
  const length = end - start + 1
  return length > 0 ? Array.from({ length }, (_, i) => start + i) : []
}

function getPaginationRange(current: number, total: number, siblingCount: number): (number | typeof DOTS)[] {
  const totalPageNumbers = siblingCount * 2 + 5

  if (total <= totalPageNumbers) {
    return range(1, total)
  }

  const leftSiblingIndex = Math.max(current - siblingCount, 1)
  const rightSiblingIndex = Math.min(current + siblingCount, total)

  const shouldShowLeftDots = leftSiblingIndex > 2
  const shouldShowRightDots = rightSiblingIndex < total - 2

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + siblingCount * 2
    return [...range(1, leftItemCount), DOTS, total]
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + siblingCount * 2
    return [1, DOTS, ...range(total - rightItemCount + 1, total)]
  }

  return [1, DOTS, ...range(leftSiblingIndex, rightSiblingIndex), DOTS, total]
}

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  siblingCount?: number
}

export function Pagination({ page, totalPages, onPageChange, className, siblingCount = 1 }: PaginationProps) {
  const pages = getPaginationRange(page, Math.max(totalPages, 1), siblingCount)
  const isFirst = page <= 1
  const isLast = page >= totalPages

  return (
    <ul className={cn('m-0 flex list-none items-center gap-1 p-0', className)}>
      <li>
        <Button
          variant="white"
          size="sm"
          type="button"
          disabled={isFirst}
          onClick={() => onPageChange(1)}
          className="border-ca-border px-2"
          aria-label="Birinchi sahifa"
        >
          <FaAngleDoubleLeft className="text-[10px]" />
        </Button>
      </li>
      <li>
        <Button
          variant="white"
          size="sm"
          type="button"
          disabled={isFirst}
          onClick={() => onPageChange(page - 1)}
          className="border-ca-border px-2"
          aria-label="Oldingi sahifa"
        >
          <FaChevronLeft className="text-[10px]" />
        </Button>
      </li>
      {pages.map((pageNumber, index) =>
        pageNumber === DOTS ? (
          <li key={`dots-${index}`} className="px-1 text-ca-text select-none">
            {DOTS}
          </li>
        ) : (
          <li key={pageNumber}>
            <Button
              variant={pageNumber === page ? 'inverse' : 'white'}
              size="sm"
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={pageNumber === page ? '' : 'border-ca-border'}
              aria-current={pageNumber === page ? 'page' : undefined}
            >
              {pageNumber}
            </Button>
          </li>
        ),
      )}
      <li>
        <Button
          variant="white"
          size="sm"
          type="button"
          disabled={isLast}
          onClick={() => onPageChange(page + 1)}
          className="border-ca-border px-2"
          aria-label="Keyingi sahifa"
        >
          <FaChevronRight className="text-[10px]" />
        </Button>
      </li>
      <li>
        <Button
          variant="white"
          size="sm"
          type="button"
          disabled={isLast}
          onClick={() => onPageChange(totalPages)}
          className="border-ca-border px-2"
          aria-label="Oxirgi sahifa"
        >
          <FaAngleDoubleRight className="text-[10px]" />
        </Button>
      </li>
    </ul>
  )
}
