import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';

import {
  clearAllBlocked,
  deleteBlocked,
  fetchBlocked,
  type ListParams,
} from '@/lib/api/blocked';
import { showToast } from '@/lib/toast';

const BASE_KEY = ['blocked'] as const;

export function useBlocked(params: ListParams) {
  return useQuery({
    queryKey: [...BASE_KEY, params],
    queryFn: () => fetchBlocked(params),
    placeholderData: (prev) => prev,
  });
}

export function useDeleteBlockedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBlocked(id),
    onSuccess: () => {
      showToast.success(__('Blocked email deleted.', 'flexa-unsubscribe'));
      qc.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

export function useClearBlockedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearAllBlocked(),
    onSuccess: () => {
      showToast.success(__('All blocked emails cleared.', 'flexa-unsubscribe'));
      qc.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}
