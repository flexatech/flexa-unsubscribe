import { useQuery } from '@tanstack/react-query';

import { fetchResubscribed, type ListParams } from '@/lib/api/resubscribed';

const BASE_KEY = ['resubscribed'] as const;

export function useResubscribed(params: ListParams) {
  return useQuery({
    queryKey: [...BASE_KEY, params],
    queryFn: () => fetchResubscribed(params),
    placeholderData: (prev) => prev,
  });
}
