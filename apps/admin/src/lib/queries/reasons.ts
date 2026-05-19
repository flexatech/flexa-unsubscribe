import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';

import {
  createReason,
  deleteReason,
  fetchReasons,
  reorderReasons,
  updateReason,
  type ReasonInput,
} from '@/lib/api/reasons';
import { showToast } from '@/lib/toast';

const BASE_KEY = ['reasons'] as const;

export function useReasons() {
  return useQuery({
    queryKey: BASE_KEY,
    queryFn: fetchReasons,
  });
}

export function useCreateReasonMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ReasonInput) => createReason(body),
    onSuccess: () => {
      showToast.success(__('Reason added.', 'flexa-unsubscribe'));
      qc.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

export function useUpdateReasonMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ReasonInput }) => updateReason(id, body),
    onSuccess: () => {
      showToast.success(__('Reason updated.', 'flexa-unsubscribe'));
      qc.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

export function useDeleteReasonMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteReason(id),
    onSuccess: () => {
      showToast.success(__('Reason deleted.', 'flexa-unsubscribe'));
      qc.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

export function useReorderReasonsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: number[]) => reorderReasons(order),
    onSuccess: (items) => {
      // Reorder already returns the authoritative list - seed the
      // cache directly so the UI updates without a second round-trip.
      qc.setQueryData(BASE_KEY, items);
    },
  });
}
