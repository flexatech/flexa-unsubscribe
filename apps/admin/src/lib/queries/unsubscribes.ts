import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';

import {
  deleteUnsubscribe,
  fetchUnsubscribes,
  importUnsubscribes,
  type ImportResult,
  type ListParams,
} from '@/lib/api/unsubscribes';
import { showToast } from '@/lib/toast';

const BASE_KEY = ['unsubscribes'] as const;

export function useUnsubscribes(params: ListParams) {
  return useQuery({
    queryKey: [...BASE_KEY, params],
    queryFn: () => fetchUnsubscribes(params),
    placeholderData: (prev) => prev,
  });
}

export function useDeleteUnsubscribeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUnsubscribe(id),
    onSuccess: () => {
      showToast.success(__('Unsubscribe record deleted.', 'flexa-unsubscribe'));
      qc.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

/**
 * CSV import. On success we invalidate both the unsubscribes list and
 * the analytics queries - imported rows show up in the totals/charts
 * immediately. Toast is intentionally NOT raised here: the dialog
 * already shows a detailed summary, and a toast on top would just
 * duplicate that information.
 */
export function useImportUnsubscribesMutation() {
  const qc = useQueryClient();
  return useMutation<ImportResult, Error, File>({
    mutationFn: (file: File) => importUnsubscribes(file),
    onSuccess: (result) => {
      if (result.imported > 0) {
        qc.invalidateQueries({ queryKey: BASE_KEY });
        qc.invalidateQueries({ queryKey: ['analytics'] });
      }
    },
  });
}
