import { useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalyticsByDate, useAnalyticsByReason, useAnalyticsSummary } from '@/lib/queries/analytics';
import { cn } from '@/lib/utils';

type StatTone = 'primary' | 'success' | 'warning' | 'destructive';

const toneClasses: Record<StatTone, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

function StatCard({
  label,
  value,
  tone = 'primary',
  footer,
  loading,
}: {
  label: string;
  value: number | string;
  tone?: StatTone;
  footer?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        <div className={cn('mt-2 text-3xl font-bold', toneClasses[tone])}>
          {loading ? <Skeleton className="h-8 w-20" /> : value}
        </div>
        {footer && <div className="mt-1 text-xs text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  );
}

function TrendBadge({ change }: { change: number }) {
  if (change === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="size-3" /> 0%
      </span>
    );
  }
  const up = change > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        up ? 'text-destructive' : 'text-success',
      )}
    >
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(change)}% {__('vs last month')}
    </span>
  );
}

const CHART_COLORS = ['#2271b1', '#00a32a', '#d63638', '#dba617', '#72aee6', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const summary = useAnalyticsSummary();
  const [period, setPeriod] = useState<'7days' | '30days' | '12months'>('30days');
  const byDate = useAnalyticsByDate(period);
  const byReason = useAnalyticsByReason(10);

  const pieData = useMemo(
    () => (byReason.data ?? []).map((d) => ({ name: d.reason, value: d.count })),
    [byReason.data],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{__('Dashboard')}</h1>
        <p className="text-sm text-muted-foreground">
          {__('Overview of unsubscribes, re-subscribes, and blocked emails.')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={__('Total unsubscribes')}
          value={summary.data?.unsubscribes.total.toLocaleString() ?? 0}
          loading={summary.isLoading}
        />
        <StatCard
          label={__('This month')}
          value={summary.data?.unsubscribes.this_month.toLocaleString() ?? 0}
          footer={
            summary.data && <TrendBadge change={summary.data.unsubscribes.month_change} />
          }
          loading={summary.isLoading}
        />
        <StatCard
          label={__('Re-subscribed (total)')}
          value={summary.data?.resubscribes.total_resubscribed.toLocaleString() ?? 0}
          tone="success"
          loading={summary.isLoading}
        />
        <StatCard
          label={__('Blocked emails')}
          value={summary.data?.blocked_count.toLocaleString() ?? 0}
          tone="destructive"
          loading={summary.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>{__('Unsubscribes over time')}</CardTitle>
            <select
              className="h-8 rounded-md border border-border bg-background px-2 text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value as typeof period)}
            >
              <option value="7days">{__('Last 7 days')}</option>
              <option value="30days">{__('Last 30 days')}</option>
              <option value="12months">{__('Last 12 months')}</option>
            </select>
          </CardHeader>
          <CardContent>
            {byDate.isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDate.data ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{__('Top reasons')}</CardTitle>
          </CardHeader>
          <CardContent>
            {byReason.isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={90}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
