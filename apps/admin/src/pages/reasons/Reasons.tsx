import { useMemo } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { MessageSquareText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { EmptyState, ErrorState } from '@/components/data-table/states';
import {
  useDeleteReasonMutation,
  useReasons,
  useReorderReasonsMutation,
  useUpdateReasonMutation,
} from '@/lib/queries/reasons';
import type { Reason } from '@/lib/api/reasons';

import { AddReasonForm } from './AddReasonForm';
import { ReasonRow } from './ReasonRow';

export default function Reasons() {
  const { data: reasons = [], isLoading, error, refetch } = useReasons();
  const updateMut = useUpdateReasonMutation();
  const deleteMut = useDeleteReasonMutation();
  const reorderMut = useReorderReasonsMutation();
  const confirm = useConfirm();

  const reorderPending = reorderMut.isPending;

  const nextSortOrder = useMemo(
    () => (reasons.length === 0 ? 1 : Math.max(...reasons.map((r) => r.sort_order)) + 1),
    [reasons],
  );

  function moveBy(id: number, delta: -1 | 1) {
    const idx = reasons.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= reasons.length) return;

    const next = reasons.slice();
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    reorderMut.mutate(next.map((r) => r.id));
  }

  async function handleDelete(reason: Reason) {
    const ok = await confirm({
      title: __('Delete this reason?', 'flexa-unsubscribe'),
      description: sprintf(
        /* translators: %s: reason text */
        __(
          'Delete "%s"? Existing unsubscribe records that used this reason keep their text — the reason is stored per-record, not referenced.',
          'flexa-unsubscribe',
        ),
        reason.reason_text,
      ),
      destructive: true,
      confirmLabel: __('Delete', 'flexa-unsubscribe'),
    });
    if (!ok) return;
    deleteMut.mutate(reason.id);
  }

  function handleRename(id: number, newText: string) {
    const current = reasons.find((r) => r.id === id);
    if (!current) return;
    updateMut.mutate({
      id,
      body: { reason_text: newText, sort_order: current.sort_order },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-foreground">
          {__('Unsubscribe reasons', 'flexa-unsubscribe')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {__(
            'Options shown in the unsubscribe feedback dropdown. Reorder with the arrows — top of the list appears first.',
            'flexa-unsubscribe',
          )}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle>{__('Current reasons', 'flexa-unsubscribe')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {error ? (
              <ErrorState
                message={error instanceof Error ? error.message : undefined}
                onRetry={() => refetch()}
              />
            ) : isLoading ? (
              <div className="space-y-0">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-border last:border-0">
                    <Skeleton className="h-8 w-5" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-6" />
                    <Skeleton className="h-7 w-7" />
                  </div>
                ))}
              </div>
            ) : reasons.length === 0 ? (
              <EmptyState
                icon={MessageSquareText}
                title={__('No reasons yet', 'flexa-unsubscribe')}
                description={__(
                  'Use the form on the right to add the first option shown when someone unsubscribes.',
                  'flexa-unsubscribe',
                )}
              />
            ) : (
              <div>
                {reasons.map((reason, index) => (
                  <ReasonRow
                    key={reason.id}
                    reason={reason}
                    index={index}
                    total={reasons.length}
                    disabled={reorderPending || deleteMut.isPending || updateMut.isPending}
                    onRename={handleRename}
                    onMoveUp={(id) => moveBy(id, -1)}
                    onMoveDown={(id) => moveBy(id, 1)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add form */}
        <Card>
          <CardHeader>
            <CardTitle>{__('Add a reason', 'flexa-unsubscribe')}</CardTitle>
          </CardHeader>
          <CardContent>
            <AddReasonForm nextSortOrder={nextSortOrder} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
