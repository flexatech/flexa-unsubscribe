import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn | null>(null);

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (ok: boolean) => void;
}

/**
 * Mount once at the app root. Exposes a promise-based `useConfirm()`
 * hook so any component can trigger a confirmation without owning
 * its own Dialog state.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'Delete?', destructive: true })) { … }
 */
export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  // Keep the latest pending promise in a ref so the Dialog's onOpenChange
  // can always resolve it, even during the trailing close animation.
  const pendingRef = useRef<PendingConfirm | null>(null);
  pendingRef.current = pending;

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    pendingRef.current?.resolve(true);
    setPending(null);
  };

  const handleCancel = (open: boolean) => {
    if (open) return;
    pendingRef.current?.resolve(false);
    setPending(null);
  };

  const opts = pending?.options;
  const destructive = opts?.destructive ?? false;

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <Dialog open={!!pending} onOpenChange={handleCancel}>
        {opts && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{opts.title}</DialogTitle>
              {opts.description && <DialogDescription>{opts.description}</DialogDescription>}
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleCancel(false)}>
                {opts.cancelLabel ?? __('Cancel', 'flexa-unsubscribe')}
              </Button>
              <Button
                variant={destructive ? 'destructive' : 'default'}
                onClick={handleConfirm}
                autoFocus
              >
                {opts.confirmLabel ?? __('Confirm', 'flexa-unsubscribe')}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error('useConfirm must be used inside <ConfirmDialogProvider>');
  }
  return ctx;
}
