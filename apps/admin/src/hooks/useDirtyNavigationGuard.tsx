import { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useBlocker } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Blocks in-app navigation (React Router) and full page unload while
 * the form is dirty, showing a confirm dialog on router attempts and
 * a native `beforeunload` prompt on window close / external links.
 *
 * Works with `createHashRouter` (a data router, required for `useBlocker`).
 *
 *   function MyForm() {
 *     const form = useForm(…);
 *     useDirtyNavigationGuard(form.formState.isDirty);
 *     return <Form …>…</Form>;
 *   }
 */
export function useDirtyNavigationGuard(isDirty: boolean) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!isDirty) return false;
    return currentLocation.pathname !== nextLocation.pathname;
  });

  // Native "do you want to leave" prompt when closing the tab or
  // clicking a full-reload link. The custom message text is ignored
  // by modern browsers; they show their own copy. We only gate with
  // `preventDefault`.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const blocked = blocker.state === 'blocked';

  // Narrow via `state === 'blocked'` rather than checking proceed/reset
  // individually. React Router types proceed + reset as a pair that are
  // both defined only in the blocked state — checking one doesn't
  // narrow the other, which is what tripped the original build.
  const handleOpenChange = (open: boolean) => {
    if (!open && blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const handleKeepEditing = () => {
    if (blocker.state === 'blocked') blocker.reset();
  };

  const handleDiscard = () => {
    if (blocker.state === 'blocked') blocker.proceed();
  };

  return (
    <Dialog open={blocked} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{__('Discard unsaved changes?', 'flexa-unsubscribe')}</DialogTitle>
          <DialogDescription>
            {__(
              'You have unsaved changes that will be lost if you navigate away.',
              'flexa-unsubscribe',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleKeepEditing}>
            {__('Keep editing', 'flexa-unsubscribe')}
          </Button>
          <Button variant="destructive" onClick={handleDiscard}>
            {__('Discard changes', 'flexa-unsubscribe')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
