import { api } from './base';

export interface AnalyticsSummary {
  unsubscribes: {
    total: number;
    today: number;
    this_week: number;
    this_month: number;
    last_month: number;
    month_change: number;
  };
  resubscribes: {
    total_resubscribed: number;
    today_resubscribed: number;
    this_week_resubscribed: number;
    this_month_resubscribed: number;
  };
  blocked_count: number;
}

export interface ChartPoint {
  date: string;
  count: number;
}

export interface ReasonPoint {
  reason: string;
  count: number;
}

export async function fetchAnalyticsSummary() {
  return api.get('analytics/summary').json<AnalyticsSummary>();
}

export async function fetchAnalyticsByDate(period: '7days' | '30days' | '12months' | 'all') {
  return api
    .get('analytics/by-date', { searchParams: { period } })
    .json<ChartPoint[]>();
}

export async function fetchAnalyticsByReason(limit = 10) {
  return api
    .get('analytics/by-reason', { searchParams: { limit: String(limit) } })
    .json<ReasonPoint[]>();
}
