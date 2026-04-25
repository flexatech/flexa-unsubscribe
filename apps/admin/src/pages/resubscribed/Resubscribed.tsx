import { useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Download, MailCheck } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/DataTable';
import { dateColumn, emailColumn } from '@/components/data-table/columns';
import { useTableState } from '@/hooks/useTableState';
import { useResubscribed } from '@/lib/queries/resubscribed';
import type { Resubscribed, ResubscribedOrderBy } from '@/lib/api/resubscribed';
import { buildExportUrl } from '@/lib/export-url';

const VALID_SORT_IDS: ResubscribedOrderBy[] = [
  'resubscribed_at',
  'email',
  'unsubscribed_at',
];

function isValidSortId(id: string): id is ResubscribedOrderBy {
  return (VALID_SORT_IDS as string[]).includes(id);
}

export default function ResubscribedPage() {
  const [search, setSearch] = useState('');
  const { page, perPage, sort, onPageChange, onSortToggle } = useTableState({
    defaultSort: { id: 'resubscribed_at', desc: true },
  });

  const order_by: ResubscribedOrderBy =
    sort && isValidSortId(sort.id) ? sort.id : 'resubscribed_at';
  const order = sort?.desc === false ? 'asc' : 'desc';

  const query = useResubscribed({ page, per_page: perPage, order_by, order });

  const data = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data.filter((row) => row.email.toLowerCase().includes(q));
  }, [data, search]);

  const columns: ColumnDef<Resubscribed>[] = [
    emailColumn<Resubscribed>({ accessor: (r) => r.email }),
    dateColumn<Resubscribed>({
      id: 'resubscribed_at',
      header: __('Re-subscribed at', 'flexa-unsubscribe'),
      accessor: (r) => r.resubscribed_at,
    }),
    dateColumn<Resubscribed>({
      id: 'unsubscribed_at',
      header: __('Originally unsubscribed', 'flexa-unsubscribe'),
      accessor: (r) => r.unsubscribed_at,
      responsive: 'md',
    }),
  ];

  const exportHref = buildExportUrl('flexa_export_resubscribed_csv', 'export_resubscribed');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {__('Re-subscribed', 'flexa-unsubscribe')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {__(
              'Addresses that opted back in after previously unsubscribing.',
              'flexa-unsubscribe',
            )}
          </p>
        </div>
      </header>

      <DataTable<Resubscribed>
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
          icon: MailCheck,
          title: __('No re-subscribes yet', 'flexa-unsubscribe'),
          description: __(
            'When someone uses the re-subscribe link, they will appear here.',
            'flexa-unsubscribe',
          ),
        }}
      />
    </div>
  );
}
