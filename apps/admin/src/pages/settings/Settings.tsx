import { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/data-table/states';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ColorInput } from '@/components/ui/color-input';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useDirtyNavigationGuard } from '@/hooks/useDirtyNavigationGuard';
import { applyFormErrors } from '@/lib/form-errors';
import {
  GeneralSettingsSchema,
  type GeneralSettings,
} from '@/lib/api/settings';
import {
  useGeneralSettings,
  useUpdateGeneralSettingsMutation,
} from '@/lib/queries/settings';

export default function Settings() {
  const query = useGeneralSettings();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header>
        <h1 className="text-xl font-semibold text-foreground">
          {__('Settings', 'flexa-unsubscribe')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {__(
            'Control how outgoing emails are processed and which recipients are blocked.',
            'flexa-unsubscribe',
          )}
        </p>
      </header>

      {query.isLoading ? (
        <SettingsFormSkeleton />
      ) : query.error ? (
        <Card>
          <CardContent className="p-0">
            <ErrorState
              message={query.error instanceof Error ? query.error.message : undefined}
              onRetry={() => query.refetch()}
            />
          </CardContent>
        </Card>
      ) : query.data ? (
        <SettingsForm initial={query.data} />
      ) : null}
    </div>
  );
}

function SettingsForm({ initial }: { initial: GeneralSettings }) {
  const mutation = useUpdateGeneralSettingsMutation();
  const form = useForm<GeneralSettings>({
    resolver: zodResolver(GeneralSettingsSchema),
    defaultValues: initial,
  });

  const { isDirty, isSubmitting } = form.formState;
  useDirtyNavigationGuard(isDirty);

  // Clear the transient root error once the user starts editing
  // again - otherwise the banner lingers across retries.
  useEffect(() => {
    if (!isDirty) return;
    form.clearErrors('root.serverError');
  }, [isDirty, form]);

  async function onSubmit(values: GeneralSettings) {
    mutation.mutate(values, {
      onSuccess: (saved) => {
        // Pristine-at-persisted: RHF's isDirty compares against
        // `defaultValues`, so reset() with the server response
        // makes the form clean at exactly what's stored.
        form.reset(saved);
      },
      onError: async (err) => {
        await applyFormErrors(err, form.setError);
      },
    });
  }

  const rootError = form.formState.errors.root?.serverError?.message;
  const pending = isSubmitting || mutation.isPending;

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>{__('General', 'flexa-unsubscribe')}</CardTitle>
            <CardDescription>
              {__('Applies to all outgoing WordPress emails.', 'flexa-unsubscribe')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {rootError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{rootError}</span>
              </div>
            )}

            <FormField
              control={form.control}
              name="enable_auto_append"
              render={({ field }) => (
                <FormItem className="flex items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1">
                    <FormLabel>{__('Auto-append unsubscribe link', 'flexa-unsubscribe')}</FormLabel>
                    <FormDescription>
                      {__(
                        'When enabled, outgoing single-recipient emails get a secure unsubscribe button appended automatically.',
                        'flexa-unsubscribe',
                      )}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exclude_keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{__('Exclude keywords', 'flexa-unsubscribe')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Order, Password, Invoice" maxLength={500} />
                  </FormControl>
                  <FormDescription>
                    {__(
                      'Comma-separated. Emails whose subject contains any of these (case-insensitive) skip both blocking and auto-append - use for transactional mail.',
                      'flexa-unsubscribe',
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enable_blocking"
              render={({ field }) => (
                <FormItem className="flex items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1">
                    <FormLabel>{__('Block unsubscribed recipients', 'flexa-unsubscribe')}</FormLabel>
                    <FormDescription>
                      {__(
                        'Prevent sending mail to addresses in the unsubscribe list. Blocked attempts are logged under Blocked Emails.',
                        'flexa-unsubscribe',
                      )}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-6 border-t border-border pt-6">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">
                  {__('Unsubscribe footer', 'flexa-unsubscribe')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {__(
                    'Customize the footer appended to outgoing emails when auto-append is on.',
                    'flexa-unsubscribe',
                  )}
                </p>
              </div>

              <FormField
                control={form.control}
                name="append_heading_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{__('Footer heading text', 'flexa-unsubscribe')}</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={200} />
                    </FormControl>
                    <FormDescription>
                      {__(
                        'The line shown above the unsubscribe button in appended emails.',
                        'flexa-unsubscribe',
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="append_button_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{__('Unsubscribe button label', 'flexa-unsubscribe')}</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="append_button_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{__('Unsubscribe button color', 'flexa-unsubscribe')}</FormLabel>
                    <FormControl>
                      <ColorInput
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormDescription>
                      {__('Background color of the appended button.', 'flexa-unsubscribe')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            {isDirty && (
              <span className="text-xs text-muted-foreground">
                {__('Unsaved changes', 'flexa-unsubscribe')}
              </span>
            )}
            <Button type="submit" disabled={!isDirty || pending}>
              <Save />
              {pending ? __('Saving…', 'flexa-unsubscribe') : __('Save changes', 'flexa-unsubscribe')}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

function SettingsFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}
