import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';

import {
  fetchAppearanceSettings,
  updateAppearanceSettings,
  type AppearanceSettings,
} from '@/lib/api/appearance';
import { showToast } from '@/lib/toast';

const BASE_KEY = ['settings', 'appearance'] as const;

export function useAppearanceSettings() {
  return useQuery({
    queryKey: BASE_KEY,
    queryFn: fetchAppearanceSettings,
  });
}

export function useUpdateAppearanceSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AppearanceSettings) => updateAppearanceSettings(body),
    onSuccess: (saved) => {
      qc.setQueryData(BASE_KEY, saved);
      showToast.success(__('Appearance saved.', 'flexa-unsubscribe'));
    },
  });
}
