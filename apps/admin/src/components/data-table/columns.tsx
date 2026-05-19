import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatDateIso, formatDateTime } from '@/lib/format';

/**
 * Column `meta` fields recognised by DataTable:
 *
 *   - `sortable`:   header becomes a sort toggle button
 *   - `responsive`: 'md' = hide on < md breakpoints (saves horizontal space
 *                   for email + primary date + actions on mobile)
 *   - `align`:      'right' for numeric columns
 *
 * Declared here so they're typed at the callsite via module augmentation.
 */
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends unknown, TValue> {
    sortable?: boolean;
    responsive?: 'md';
    align?: 'left' | 'right' | 'center';
    cellClassName?: string;
  }
}

export interface EmailColumnOptions<T> {
  id?: string;
  header?: string;
  accessor: (row: T) => string;
  sortable?: boolean;
}

export function emailColumn<T>({
  id = 'email',
  header,
  accessor,
  sortable = true,
}: EmailColumnOptions<T>): ColumnDef<T> {
  return {
    id,
    header: header ?? __('Email', 'flexa-unsubscribe'),
    accessorFn: accessor,
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return (
        <span
          className="font-mono text-xs text-foreground truncate max-w-[260px] inline-block align-middle"
          title={value}
        >
          {value}
        </span>
      );
    },
    meta: { sortable },
  };
}

export interface DateColumnOptions<T> {
  id: string;
  header: string;
  accessor: (row: T) => string | null | undefined;
  withTime?: boolean;
  sortable?: boolean;
  responsive?: 'md';
}

export function dateColumn<T>({
  id,
  header,
  accessor,
  withTime = true,
  sortable = true,
  responsive,
}: DateColumnOptions<T>): ColumnDef<T> {
  const format = withTime ? formatDateTime : formatDate;
  return {
    id,
    header,
    accessorFn: accessor,
    cell: ({ getValue }) => {
      const raw = getValue<string | null | undefined>();
      const display = format(raw);
      const iso = formatDateIso(raw);
      return (
        <span className="font-mono text-xs text-foreground whitespace-nowrap" title={iso}>
          {display}
        </span>
      );
    },
    meta: { sortable, responsive },
  };
}

export interface TruncatedColumnOptions<T> {
  id: string;
  header: string;
  accessor: (row: T) => string;
  maxWidth?: number;
  sortable?: boolean;
  responsive?: 'md';
  placeholder?: string;
}

export function truncatedColumn<T>({
  id,
  header,
  accessor,
  maxWidth = 240,
  sortable = false,
  responsive,
  placeholder = '-',
}: TruncatedColumnOptions<T>): ColumnDef<T> {
  return {
    id,
    header,
    accessorFn: accessor,
    cell: ({ getValue }) => {
      const value = getValue<string>();
      if (!value) {
        return <span className="text-muted-foreground">{placeholder}</span>;
      }
      return (
        <span
          className="block truncate text-foreground"
          style={{ maxWidth }}
          title={value}
        >
          {value}
        </span>
      );
    },
    meta: { sortable, responsive },
  };
}

export interface RowActionItem<T> {
  label: string;
  icon?: LucideIcon;
  onClick: (row: T) => void;
  destructive?: boolean;
  disabled?: boolean | ((row: T) => boolean);
}

export interface ActionsColumnOptions<T> {
  items: (row: T) => RowActionItem<T>[];
  id?: string;
}

export function actionsColumn<T>({
  items,
  id = 'actions',
}: ActionsColumnOptions<T>): ColumnDef<T> {
  return {
    id,
    header: () => <span className="sr-only">{__('Actions', 'flexa-unsubscribe')}</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const actions = items(row.original);
      if (actions.length === 0) return null;
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={__('Row actions', 'flexa-unsubscribe')}
                className="h-8 w-8"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action, idx) => {
                const disabled =
                  typeof action.disabled === 'function'
                    ? action.disabled(row.original)
                    : action.disabled;
                return (
                  <DropdownMenuItem
                    key={idx}
                    onClick={() => action.onClick(row.original)}
                    destructive={action.destructive}
                    disabled={disabled}
                  >
                    {action.icon && <action.icon />}
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    meta: { align: 'right', cellClassName: 'w-[56px]' },
  };
}
