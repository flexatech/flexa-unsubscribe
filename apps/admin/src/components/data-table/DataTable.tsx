import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, type EmptyStateProps } from '@/components/data-table/states';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';
import type { TableSort } from '@/hooks/useTableState';

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  total: number;
  page: number;
  perPage: number;
  sort: TableSort | null;
  onPageChange: (page: number) => void;
  onSortToggle: (columnId: string) => void;

  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;

  /** Toolbar action slot (right-aligned, before the search row). */
  toolbar?: React.ReactNode;

  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** Empty-state content shown when data is empty AND not loading AND no error. */
  empty?: Omit<EmptyStateProps, 'action'> & { action?: React.ReactNode };

  /** Stable row key extractor. Default: `(row as any).id ?? index`. */
  getRowId?: (row: T, index: number) => string;
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  perPage,
  sort,
  onPageChange,
  onSortToggle,
  isLoading,
  error,
  onRetry,
  toolbar,
  search,
  onSearchChange,
  searchPlaceholder,
  empty,
  getRowId,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId
      ? (row, index) => getRowId(row, index)
      : (row: T, index) => {
          const id = (row as unknown as { id?: number | string }).id;
          return id != null ? String(id) : String(index);
        },
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  });

  const rows = table.getRowModel().rows;
  const showEmpty = !isLoading && !error && rows.length === 0;
  const showError = !!error;

  const startIdx = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endIdx = Math.min(page * perPage, total);

  const hasSearch = typeof onSearchChange === 'function';
  const hasToolbar = !!toolbar || hasSearch;

  return (
    <div className="flex flex-col gap-4">
      {hasToolbar && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {hasSearch ? (
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search ?? ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={
                  searchPlaceholder ?? __('Filter this page…', 'flexa-unsubscribe')
                }
                className="pl-8 pr-8"
              />
              {search && (
                <button
                  type="button"
                  aria-label={__('Clear search', 'flexa-unsubscribe')}
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ) : (
            <div />
          )}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  const sortable = meta?.sortable ?? false;
                  const isSorted = sort?.id === header.column.id;
                  const sortDir = isSorted ? (sort!.desc ? 'desc' : 'asc') : null;
                  const ariaSort: 'ascending' | 'descending' | 'none' = isSorted
                    ? sortDir === 'desc'
                      ? 'descending'
                      : 'ascending'
                    : 'none';
                  const responsiveClass = meta?.responsive === 'md' ? 'hidden md:table-cell' : '';
                  const alignClass =
                    meta?.align === 'right'
                      ? 'text-right'
                      : meta?.align === 'center'
                      ? 'text-center'
                      : '';
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={sortable ? ariaSort : undefined}
                      className={cn(responsiveClass, alignClass, meta?.cellClassName)}
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={() => onSortToggle(header.column.id)}
                          className="inline-flex cursor-pointer items-center gap-1 font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {isSorted ? (
                            sortDir === 'desc' ? (
                              <ArrowDown className="size-3" />
                            ) : (
                              <ArrowUp className="size-3" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.max(3, Math.min(perPage, 10)) }).map((_, rowIdx) => (
                <TableRow key={`skeleton-${rowIdx}`}>
                  {columns.map((col, colIdx) => {
                    const meta = col.meta;
                    const responsiveClass = meta?.responsive === 'md' ? 'hidden md:table-cell' : '';
                    return (
                      <TableCell key={colIdx} className={responsiveClass}>
                        <Skeleton className="h-4 w-full max-w-[180px]" />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : showError ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <ErrorState
                    message={error instanceof Error ? error.message : undefined}
                    onRetry={onRetry}
                  />
                </TableCell>
              </TableRow>
            ) : showEmpty ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState
                    icon={empty?.icon}
                    title={empty?.title ?? __('No results', 'flexa-unsubscribe')}
                    description={empty?.description}
                    action={empty?.action}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta;
                    const responsiveClass = meta?.responsive === 'md' ? 'hidden md:table-cell' : '';
                    const alignClass =
                      meta?.align === 'right'
                        ? 'text-right'
                        : meta?.align === 'center'
                        ? 'text-center'
                        : '';
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(responsiveClass, alignClass, meta?.cellClassName)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {total > 0 && !isLoading && !error && (
          <CardContent className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {sprintf(
                /* translators: 1: first row index, 2: last row index, 3: total count */
                __('Showing %1$s–%2$s of %3$s', 'flexa-unsubscribe'),
                formatNumber(startIdx),
                formatNumber(endIdx),
                formatNumber(total),
              )}
            </p>
            <Pagination
              page={page}
              pageSize={perPage}
              total={total}
              onPageChange={onPageChange}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
