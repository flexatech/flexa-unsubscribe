import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';

import {
  fetchGeneralSettings,
  updateGeneralSettings,
  type GeneralSettings,
} from '@/lib/api/settings';
import { showToast } from '@/lib/toast';

const BASE_KEY = ['settings', 'general'] as const;

export function useGeneralSettings() {
  return useQuery({
    queryKey: BASE_KEY,
    queryFn: fetchGeneralSettings,
  });
}

export function useUpdateGeneralSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GeneralSettings) => updateGeneralSettings(body),
    onSuccess: (saved) => {
      // Server returns the canonical persisted values - seed the
      // cache directly so `form.reset(data)` lines up exactly.
      qc.setQueryData(BASE_KEY, saved);
      showToast.success(__('Settings saved.', 'flexa-unsubscribe'));
    },
  });
}
