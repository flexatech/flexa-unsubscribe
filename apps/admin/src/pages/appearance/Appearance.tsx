import { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/data-table/states';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDirtyNavigationGuard } from '@/hooks/useDirtyNavigationGuard';
import { applyFormErrors } from '@/lib/form-errors';
import {
  AppearanceSettingsSchema,
  type AppearanceSettings,
} from '@/lib/api/appearance';
import {
  useAppearanceSettings,
  useUpdateAppearanceSettingsMutation,
} from '@/lib/queries/appearance';

import { AppearancePreview } from './AppearancePreview';
import { ColorsTab } from './ColorsTab';
import { TextContentTab } from './TextContentTab';
import { TypographyTab } from './TypographyTab';

type TabKey = 'colors' | 'typography' | 'text';
const TAB_KEYS: TabKey[] = ['colors', 'typography', 'text'];

export default function Appearance() {
  const query = useAppearanceSettings();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-foreground">
          {__('Appearance', 'flexa-unsubscribe')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {__(
            'Customize the look and copy of the public unsubscribe page.',
            'flexa-unsubscribe',
          )}
        </p>
      </header>

      {query.isLoading ? (
        <AppearanceSkeleton />
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
        <AppearanceForm initial={query.data} />
      ) : null}
    </div>
  );
}

function AppearanceForm({ initial }: { initial: AppearanceSettings }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const mutation = useUpdateAppearanceSettingsMutation();

  const form = useForm<AppearanceSettings>({
    resolver: zodResolver(AppearanceSettingsSchema),
    defaultValues: initial,
  });

  const { isDirty, isSubmitting } = form.formState;
  useDirtyNavigationGuard(isDirty);

  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = TAB_KEYS.includes(rawTab as TabKey) ? (rawTab as TabKey) : 'colors';

  function setTab(tab: TabKey) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'colors') next.delete('tab');
        else next.set('tab', tab);
        return next;
      },
      { replace: true },
    );
  }

  useEffect(() => {
    if (!isDirty) return;
    form.clearErrors('root.serverError');
  }, [isDirty, form]);

  async function onSubmit(values: AppearanceSettings) {
    mutation.mutate(values, {
      onSuccess: (saved) => form.reset(saved),
      onError: async (err) => {
        await applyFormErrors(err, form.setError);
      },
    });
  }

  const rootError = form.formState.errors.root?.serverError?.message;
  const pending = isSubmitting || mutation.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
      {/* Form column */}
      <Card className="overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>{__('Unsubscribe page', 'flexa-unsubscribe')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {rootError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <span>{rootError}</span>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={(v) => setTab(v as TabKey)}>
                <TabsList>
                  <TabsTrigger value="colors">{__('Colors', 'flexa-unsubscribe')}</TabsTrigger>
                  <TabsTrigger value="typography">{__('Typography', 'flexa-unsubscribe')}</TabsTrigger>
                  <TabsTrigger value="text">{__('Text content', 'flexa-unsubscribe')}</TabsTrigger>
                </TabsList>

                {/*
                 * Mount all three tabs unconditionally so RHF keeps their
                 * values registered when the user switches tabs mid-edit.
                 * Radix hides inactive TabsContent via CSS.
                 */}
                <TabsContent value="colors" forceMount hidden={activeTab !== 'colors'}>
                  <ColorsTab control={form.control} />
                </TabsContent>
                <TabsContent value="typography" forceMount hidden={activeTab !== 'typography'}>
                  <TypographyTab control={form.control} />
                </TabsContent>
                <TabsContent value="text" forceMount hidden={activeTab !== 'text'}>
                  <TextContentTab control={form.control} />
                </TabsContent>
              </Tabs>
            </CardContent>

            {/* Sticky submit footer */}
            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-border bg-card px-6 py-4">
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

      {/* Preview column — live replica driven by form state */}
      <Card className="hidden lg:flex flex-col max-h-[calc(100vh-140px)] sticky top-[88px] overflow-hidden">
        <CardHeader>
          <CardTitle>{__('Live preview', 'flexa-unsubscribe')}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <AppearancePreview control={form.control} />
        </CardContent>
      </Card>
    </div>
  );
}

function AppearanceSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </CardContent>
      </Card>
      <Card className="hidden lg:block">
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
