import { __ } from '@wordpress/i18n';
import type { Control } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AppearanceSettings } from '@/lib/api/appearance';

type TextField = keyof Pick<
  AppearanceSettings,
  | 'title_text'
  | 'success_message'
  | 'button_text'
  | 'thank_you_title'
  | 'thank_you_message'
  | 'home_link_text'
  | 'error_title'
  | 'error_message'
  | 'resubscribe_title'
  | 'resubscribe_message'
>;

interface FieldSpec {
  name: TextField;
  label: string;
  description?: string;
  type: 'input' | 'textarea';
  /** Server accepts a small HTML subset (wp_kses_post) for these. */
  htmlAllowed?: boolean;
}

// Strings are localized here at module load (wp.i18n is a script
// dependency, available before this runs) so the render sites stay
// plain literal lookups and `wp i18n make-pot` can extract them.
const SECTIONS: Array<{ title: string; fields: FieldSpec[] }> = [
  {
    title: __('Unsubscribe success', 'flexa-unsubscribe'),
    fields: [
      { name: 'title_text', label: __('Title', 'flexa-unsubscribe'), type: 'input' },
      {
        name: 'success_message',
        label: __('Message', 'flexa-unsubscribe'),
        type: 'textarea',
        /* translators: {email} is a literal placeholder token; keep it as-is. */
        description: __('Use {email} to insert the recipient address.', 'flexa-unsubscribe'),
        htmlAllowed: true,
      },
      { name: 'button_text', label: __('Feedback submit button', 'flexa-unsubscribe'), type: 'input' },
    ],
  },
  {
    title: __('Feedback thank-you', 'flexa-unsubscribe'),
    fields: [
      { name: 'thank_you_title', label: __('Title', 'flexa-unsubscribe'), type: 'input' },
      {
        name: 'thank_you_message',
        label: __('Message', 'flexa-unsubscribe'),
        type: 'textarea',
      },
      { name: 'home_link_text', label: __('Home link text', 'flexa-unsubscribe'), type: 'input' },
    ],
  },
  {
    title: __('Invalid-link error', 'flexa-unsubscribe'),
    fields: [
      { name: 'error_title', label: __('Title', 'flexa-unsubscribe'), type: 'input' },
      {
        name: 'error_message',
        label: __('Message', 'flexa-unsubscribe'),
        type: 'textarea',
        htmlAllowed: true,
      },
    ],
  },
  {
    title: __('Re-subscribe success', 'flexa-unsubscribe'),
    fields: [
      { name: 'resubscribe_title', label: __('Title', 'flexa-unsubscribe'), type: 'input' },
      {
        name: 'resubscribe_message',
        label: __('Message', 'flexa-unsubscribe'),
        type: 'textarea',
      },
    ],
  },
];

interface Props {
  control: Control<AppearanceSettings>;
}

export function TextContentTab({ control }: Props) {
  return (
    <div className="space-y-8">
      {SECTIONS.map((section) => (
        <section key={section.title} className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {section.title}
          </h3>
          <div className="space-y-4">
            {section.fields.map((f) => (
              <FormField
                key={f.name}
                control={control}
                name={f.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{f.label}</FormLabel>
                    <FormControl>
                      {f.type === 'textarea' ? (
                        <Textarea {...field} rows={3} />
                      ) : (
                        <Input {...field} />
                      )}
                    </FormControl>
                    {(f.description || f.htmlAllowed) && (
                      <FormDescription>
                        {f.description ?? null}
                        {f.description && f.htmlAllowed ? ' ' : ''}
                        {f.htmlAllowed
                          ? __('Basic HTML (<br>, <strong>, <em>, links) is allowed.', 'flexa-unsubscribe')
                          : null}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
