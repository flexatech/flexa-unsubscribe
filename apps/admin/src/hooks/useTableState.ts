import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface TableSort {
  id: string;
  desc: boolean;
}

export interface TableState {
  page: number;
  perPage: number;
  sort: TableSort | null;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onSortChange: (sort: TableSort | null) => void;
  /** Cycles none → desc → asc → none on repeated header clicks for the same column id. */
  onSortToggle: (columnId: string) => void;
}

export interface UseTableStateOptions {
  defaultPerPage?: number;
  defaultSort?: TableSort;
  /** If provided, auto-clamps `page` to the last valid page whenever it exceeds the total. */
  total?: number;
}

/**
 * Syncs pagination + sort state to the URL search params (hash router).
 * The URL is the source of truth - reload / back-forward / bookmark all round-trip.
 *
 * Param shape:  ?page=2&per_page=50&sort=email&order=desc
 * Defaults (page=1, default per_page, default sort) are omitted from the URL.
 */
export function useTableState({
  defaultPerPage = 20,
  defaultSort,
  total,
}: UseTableStateOptions = {}): TableState {
  const [params, setParams] = useSearchParams();

  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const perPage = Math.max(1, parseInt(params.get('per_page') || String(defaultPerPage), 10) || defaultPerPage);

  const sort = useMemo<TableSort | null>(() => {
    const id = params.get('sort');
    if (!id) return defaultSort ?? null;
    const order = params.get('order');
    return { id, desc: order !== 'asc' };
  }, [params, defaultSort]);

  const update = useCallback(
    (mutator: (next: URLSearchParams) => void) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutator(next);
          // Strip defaults so URLs stay clean.
          if (next.get('page') === '1') next.delete('page');
          if (next.get('per_page') === String(defaultPerPage)) next.delete('per_page');
          if (defaultSort && next.get('sort') === defaultSort.id) {
            const order = next.get('order');
            if ((order === 'desc' && defaultSort.desc) || (order === 'asc' && !defaultSort.desc)) {
              next.delete('sort');
              next.delete('order');
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams, defaultPerPage, defaultSort],
  );

  const onPageChange = useCallback(
    (next: number) => update((p) => p.set('page', String(Math.max(1, next)))),
    [update],
  );

  const onPerPageChange = useCallback(
    (next: number) =>
      update((p) => {
        p.set('per_page', String(Math.max(1, next)));
        // Reset to page 1 when page size changes - otherwise the current page
        // might overshoot and auto-clamp anyway.
        p.delete('page');
      }),
    [update],
  );

  const onSortChange = useCallback(
    (next: TableSort | null) =>
      update((p) => {
        if (!next) {
          p.delete('sort');
          p.delete('order');
        } else {
          p.set('sort', next.id);
          p.set('order', next.desc ? 'desc' : 'asc');
        }
      }),
    [update],
  );

  const onSortToggle = useCallback(
    (columnId: string) => {
      if (!sort || sort.id !== columnId) {
        onSortChange({ id: columnId, desc: true });
      } else if (sort.desc) {
        onSortChange({ id: columnId, desc: false });
      } else {
        onSortChange(null);
      }
    },
    [sort, onSortChange],
  );

  // Auto-clamp to the last valid page when total shrinks (e.g. after delete).
  useEffect(() => {
    if (typeof total !== 'number' || total < 0) return;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    if (page > lastPage) onPageChange(lastPage);
  }, [total, perPage, page, onPageChange]);

  return { page, perPage, sort, onPageChange, onPerPageChange, onSortChange, onSortToggle };
}
