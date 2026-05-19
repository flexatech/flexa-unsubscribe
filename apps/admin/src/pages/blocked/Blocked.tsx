import { useMemo, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Download, MailMinus, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/data-table/DataTable';
import {
  actionsColumn,
  dateColumn,
  emailColumn,
  truncatedColumn,
} from '@/components/data-table/columns';
import { useTableState } from '@/hooks/useTableState';
import {
  useBlocked,
  useClearBlockedMutation,
  useDeleteBlockedMutation,
} from '@/lib/queries/blocked';
import type { Blocked, BlockedOrderBy } from '@/lib/api/blocked';
import { buildExportUrl } from '@/lib/export-url';
import { formatNumber } from '@/lib/format';

const VALID_SORT_IDS: BlockedOrderBy[] = ['blocked_at', 'email', 'subject', 'from_email'];

function isValidSortId(id: string): id is BlockedOrderBy {
  return (VALID_SORT_IDS as string[]).includes(id);
}

export default function BlockedPage() {
  const [search, setSearch] = useState('');
  const { page, perPage, sort, onPageChange, onSortToggle } = useTableState({
    defaultSort: { id: 'blocked_at', desc: true },
  });

  const order_by: BlockedOrderBy =
    sort && isValidSortId(sort.id) ? sort.id : 'blocked_at';
  const order = sort?.desc === false ? 'asc' : 'desc';

  const query = useBlocked({ page, per_page: perPage, order_by, order });
  const deleteMutation = useDeleteBlockedMutation();
  const clearMutation = useClearBlockedMutation();
  const confirm = useConfirm();

  const data = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data.filter(
      (row) =>
        row.email.toLowerCase().includes(q) ||
        row.subject.toLowerCase().includes(q) ||
        row.from_email.toLowerCase().includes(q),
    );
  }, [data, search]);

  async function handleDelete(row: Blocked) {
    const ok = await confirm({
      title: __('Delete blocked email record?', 'flexa-unsubscribe'),
      description: sprintf(
        /* translators: %s: email address */
        __('This will remove the audit record for %s. This cannot be undone.', 'flexa-unsubscribe'),
        row.email,
      ),
      destructive: true,
      confirmLabel: __('Delete', 'flexa-unsubscribe'),
    });
    if (!ok) return;
    deleteMutation.mutate(row.id);
  }

  async function handleClearAll() {
    if (total === 0) return;
    const ok = await confirm({
      title: __('Clear all blocked records?', 'flexa-unsubscribe'),
      description: sprintf(
        /* translators: %s: number of records */
        __(
          'This will delete %s blocked-email records. This cannot be undone.',
          'flexa-unsubscribe',
        ),
        formatNumber(total),
      ),
      destructive: true,
      confirmLabel: __('Clear all', 'flexa-unsubscribe'),
    });
    if (!ok) return;
    clearMutation.mutate();
  }

  const columns: ColumnDef<Blocked>[] = [
    emailColumn<Blocked>({ accessor: (r) => r.email }),
    truncatedColumn<Blocked>({
      id: 'subject',
      header: __('Subject', 'flexa-unsubscribe'),
      accessor: (r) => r.subject,
      sortable: true,
      maxWidth: 280,
    }),
    truncatedColumn<Blocked>({
      id: 'from_email',
      header: __('From', 'flexa-unsubscribe'),
      accessor: (r) => r.from_email,
      sortable: true,
      responsive: 'md',
      maxWidth: 200,
    }),
    dateColumn<Blocked>({
      id: 'blocked_at',
      header: __('Blocked at', 'flexa-unsubscribe'),
      accessor: (r) => r.blocked_at,
    }),
    actionsColumn<Blocked>({
      items: (row) => [
        {
          label: __('Delete', 'flexa-unsubscribe'),
          icon: Trash2,
          destructive: true,
          onClick: handleDelete,
        },
      ],
    }),
  ];

  const exportHref = buildExportUrl('flexa_export_blocked_csv', 'export_blocked');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary">
            {__('Blocked emails', 'flexa-unsubscribe')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {__(
              'Audit log of outgoing emails that were blocked because the recipient had unsubscribed.',
              'flexa-unsubscribe',
            )}
          </p>
        </div>
      </header>

      <DataTable<Blocked>
        columns={columns}
        data={filtered}
        total={total}
        page={page}
        perPage={perPage}
        sort={sort}
        onPageChange={onPageChange}
        onSortToggle={onSortToggle}
        isLoading={query.isLoading}
        error={query.error ?? undefined}
        onRetry={() => query.refetch()}
        search={search}
        onSearchChange={setSearch}
        toolbar={
          <>
            {exportHref && (
              <Button asChild variant="outline" size="sm">
                <a href={exportHref}>
                  <Download />
                  {__('Export CSV', 'flexa-unsubscribe')}
                </a>
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAll}
              disabled={total === 0 || clearMutation.isPending}
            >
              <Trash2 />
              {__('Clear all', 'flexa-unsubscribe')}
            </Button>
          </>
        }
        empty={{
          icon: MailMinus,
          title: __('No blocked emails', 'flexa-unsubscribe')
            ,
          description: __(
            'When an outgoing email targets an unsubscribed address, it will be logged here.',
            'flexa-unsubscribe',
          ),
        }}
      />
    </div>
  );
}
