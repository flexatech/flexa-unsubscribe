import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';

import {
  deleteUnsubscribe,
  fetchUnsubscribes,
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
