import { useMemo, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Download, MailX, Trash2 } from 'lucide-react';
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
  useDeleteUnsubscribeMutation,
  useUnsubscribes,
} from '@/lib/queries/unsubscribes';
import type { Unsubscribe, UnsubscribeOrderBy } from '@/lib/api/unsubscribes';
import { buildExportUrl } from '@/lib/export-url';

const VALID_SORT_IDS: UnsubscribeOrderBy[] = ['unsubscribed_at', 'email', 'reason'];

function isValidSortId(id: string): id is UnsubscribeOrderBy {
  return (VALID_SORT_IDS as string[]).includes(id);
}

export default function Unsubscribes() {
  const [search, setSearch] = useState('');
  const { page, perPage, sort, onPageChange, onSortToggle } = useTableState({
    defaultSort: { id: 'unsubscribed_at', desc: true },
  });

  const order_by: UnsubscribeOrderBy =
    sort && isValidSortId(sort.id) ? sort.id : 'unsubscribed_at';
  const order = sort?.desc === false ? 'asc' : 'desc';

  const query = useUnsubscribes({ page, per_page: perPage, order_by, order });
  const deleteMutation = useDeleteUnsubscribeMutation();
  const confirm = useConfirm();

  const data = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data.filter(
      (row) =>
        row.email.toLowerCase().includes(q) ||
        (row.reason ?? '').toLowerCase().includes(q),
    );
  }, [data, search]);

  async function handleDelete(row: Unsubscribe) {
    const ok = await confirm({
      title: __('Delete unsubscribe record?', 'flexa-unsubscribe'),
      description: sprintf(
        /* translators: %s: email address */
        __('This will remove the record for %s. This cannot be undone.', 'flexa-unsubscribe'),
        row.email,
      ),
      destructive: true,
      confirmLabel: __('Delete', 'flexa-unsubscribe'),
    });
    if (!ok) return;
    deleteMutation.mutate(row.id);
  }

  const columns: ColumnDef<Unsubscribe>[] = [
    emailColumn<Unsubscribe>({ accessor: (r) => r.email }),
    truncatedColumn<Unsubscribe>({
      id: 'reason',
      header: __('Reason', 'flexa-unsubscribe'),
      accessor: (r) => r.reason || '',
      sortable: true,
      responsive: 'md',
    }),
    dateColumn<Unsubscribe>({
      id: 'unsubscribed_at',
      header: __('Unsubscribed at', 'flexa-unsubscribe'),
      accessor: (r) => r.unsubscribed_at,
    }),
    actionsColumn<Unsubscribe>({
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

  const exportHref = buildExportUrl('flexa_export_csv', 'export_unsubscribes');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary">
            {__('Unsubscribes', 'flexa-unsubscribe')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {__('Addresses that have opted out. Blocked from future sends.', 'flexa-unsubscribe')}
          </p>
        </div>
      </header>

      <DataTable<Unsubscribe>
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
          exportHref && (
            <Button asChild variant="outline" size="sm">
              <a href={exportHref}>
                <Download />
                {__('Export CSV', 'flexa-unsubscribe')}
              </a>
            </Button>
          )
        }
        empty={{
          icon: MailX,
          title: __('No unsubscribes yet', 'flexa-unsubscribe'),
          description: __(
            'When someone clicks the unsubscribe link in an email, they will appear here.',
            'flexa-unsubscribe',
          ),
        }}
      />
    </div>
  );
}

