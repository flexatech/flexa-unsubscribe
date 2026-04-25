import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Number of page buttons to render around the current page. Default 1 → [1, …, c-1, c, c+1, …, last] */
  siblingCount?: number;
  className?: string;
}

/**
 * Build a page list in the shape `[1, 'ellipsis', c-1, c, c+1, 'ellipsis', last]`.
 * Returns an array that PaginationList maps 1:1 to button/ellipsis elements.
 */
function usePageRange(page: number, totalPages: number, siblingCount: number) {
  return useMemo<(number | 'ellipsis-l' | 'ellipsis-r')[]>(() => {
    if (totalPages <= 1) return [];

    const first = 1;
    const last = totalPages;
    const leftSibling = Math.max(page - siblingCount, first);
    const rightSibling = Math.min(page + siblingCount, last);

    const showLeftEllipsis = leftSibling > first + 1;
    const showRightEllipsis = rightSibling < last - 1;

    const out: (number | 'ellipsis-l' | 'ellipsis-r')[] = [first];

    if (showLeftEllipsis) out.push('ellipsis-l');
    else for (let i = first + 1; i < leftSibling; i++) out.push(i);

    for (let i = leftSibling; i <= rightSibling; i++) {
      if (i !== first && i !== last) out.push(i);
    }

    if (showRightEllipsis) out.push('ellipsis-r');
    else for (let i = rightSibling + 1; i < last; i++) out.push(i);

    if (last !== first) out.push(last);

    return out;
  }, [page, totalPages, siblingCount]);
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const range = usePageRange(page, totalPages, siblingCount);

  if (totalPages <= 1) return null;

  const go = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    if (next !== page) onPageChange(next);
  };

  const btnBase =
    'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-background px-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center gap-1', className)}
    >
      <button
        type="button"
        className={cn(btnBase, 'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50')}
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>

      {range.map((item, idx) =>
        item === 'ellipsis-l' || item === 'ellipsis-r' ? (
          <span
            key={`${item}-${idx}`}
            className="inline-flex h-8 min-w-8 items-center justify-center px-1 text-muted-foreground select-none"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => go(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              btnBase,
              'cursor-pointer',
              item === page && 'bg-primary text-primary-foreground border-primary hover:bg-primary',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className={cn(btnBase, 'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50')}
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
