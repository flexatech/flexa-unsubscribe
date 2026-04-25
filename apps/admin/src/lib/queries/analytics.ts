import { useQuery } from '@tanstack/react-query';

import {
  fetchAnalyticsByDate,
  fetchAnalyticsByReason,
  fetchAnalyticsSummary,
} from '@/lib/api/analytics';

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: fetchAnalyticsSummary,
  });
}

export function useAnalyticsByDate(period: '7days' | '30days' | '12months' | 'all' = '30days') {
  return useQuery({
    queryKey: ['analytics', 'by-date', period],
    queryFn: () => fetchAnalyticsByDate(period),
  });
}

export function useAnalyticsByReason(limit = 10) {
  return useQuery({
    queryKey: ['analytics', 'by-reason', limit],
    queryFn: () => fetchAnalyticsByReason(limit),
  });
}
