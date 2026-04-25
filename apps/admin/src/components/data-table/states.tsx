import type { LucideIcon } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
          <Icon className="size-6" />
        </div>
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
        <AlertTriangle className="size-6" />
      </div>
      <p className="text-base font-semibold text-foreground">
        {__('Something went wrong', 'flexa-unsubscribe')}
      </p>
      <p className="text-sm text-muted-foreground max-w-sm">
        {message || __('Failed to load data. Please try again.', 'flexa-unsubscribe')}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-3">
          {__('Retry', 'flexa-unsubscribe')}
        </Button>
      )}
    </div>
  );
}
