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

const SECTIONS: Array<{ title: string; fields: FieldSpec[] }> = [
  {
    title: 'Unsubscribe success',
    fields: [
      { name: 'title_text', label: 'Title', type: 'input' },
      {
        name: 'success_message',
        label: 'Message',
        type: 'textarea',
        description: 'Use {email} to insert the recipient address.',
        htmlAllowed: true,
      },
      { name: 'button_text', label: 'Feedback submit button', type: 'input' },
    ],
  },
  {
    title: 'Feedback thank-you',
    fields: [
      { name: 'thank_you_title', label: 'Title', type: 'input' },
      {
        name: 'thank_you_message',
        label: 'Message',
        type: 'textarea',
      },
      { name: 'home_link_text', label: 'Home link text', type: 'input' },
    ],
  },
  {
    title: 'Invalid-link error',
    fields: [
      { name: 'error_title', label: 'Title', type: 'input' },
      {
        name: 'error_message',
        label: 'Message',
        type: 'textarea',
        htmlAllowed: true,
      },
    ],
  },
  {
    title: 'Re-subscribe success',
    fields: [
      { name: 'resubscribe_title', label: 'Title', type: 'input' },
      {
        name: 'resubscribe_message',
        label: 'Message',
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
            {__(section.title, 'flexa-unsubscribe')}
          </h3>
          <div className="space-y-4">
            {section.fields.map((f) => (
              <FormField
                key={f.name}
                control={control}
                name={f.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{__(f.label, 'flexa-unsubscribe')}</FormLabel>
                    <FormControl>
                      {f.type === 'textarea' ? (
                        <Textarea {...field} rows={3} />
                      ) : (
                        <Input {...field} />
                      )}
                    </FormControl>
                    {(f.description || f.htmlAllowed) && (
                      <FormDescription>
                        {f.description ? __(f.description, 'flexa-unsubscribe') : null}
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
