import { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { applyFormErrors } from '@/lib/form-errors';
import type { ReasonInput } from '@/lib/api/reasons';
import { useCreateReasonMutation } from '@/lib/queries/reasons';

const schema = z.object({
  reason_text: z
    .string()
    .trim()
    .min(1, 'Reason text is required')
    .max(255, 'Keep it under 255 characters'),
});

type Values = z.infer<typeof schema>;

interface Props {
  /** Next sort_order to use - parent computes as `max(existing) + 1`. */
  nextSortOrder: number;
}

/**
 * Add-new-reason card. Single-field form kept deliberately minimal
 * (plan calls `sort_order` hidden); the user types a label, hits
 * Add, the input clears and they can keep adding.
 */
export function AddReasonForm({ nextSortOrder }: Props) {
  const createMut = useCreateReasonMutation();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { reason_text: '' },
  });

  // Clear input after a successful create so the user can
  // keep adding rapidly without clicking the field again.
  useEffect(() => {
    if (createMut.isSuccess) {
      form.reset({ reason_text: '' });
      createMut.reset();
    }
  }, [createMut.isSuccess, createMut, form]);

  async function onSubmit(values: Values) {
    const body: ReasonInput = {
      reason_text: values.reason_text,
      sort_order: nextSortOrder,
    };
    try {
      await createMut.mutateAsync(body);
    } catch (err) {
      await applyFormErrors(err, form.setError);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="reason_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{__('New reason', 'flexa-unsubscribe')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={__('e.g. Too many emails', 'flexa-unsubscribe')}
                  maxLength={255}
                  autoComplete="off"
                />
              </FormControl>
              <FormDescription>
                {__(
                  'Appears in the unsubscribe dropdown on the public page.',
                  'flexa-unsubscribe',
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createMut.isPending} className="w-full">
          <Plus />
          {createMut.isPending ? __('Adding…', 'flexa-unsubscribe') : __('Add reason', 'flexa-unsubscribe')}
        </Button>
      </form>
    </Form>
  );
}
