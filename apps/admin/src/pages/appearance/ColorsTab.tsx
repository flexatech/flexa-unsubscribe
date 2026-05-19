import { __ } from '@wordpress/i18n';
import type { Control } from 'react-hook-form';

import { ColorInput } from '@/components/ui/color-input';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { AppearanceSettings } from '@/lib/api/appearance';

type ColorField = keyof Pick<
  AppearanceSettings,
  | 'bg_color'
  | 'box_bg_color'
  | 'text_color'
  | 'heading_color'
  | 'button_bg_color'
  | 'button_text_color'
  | 'button_hover_color'
>;

// Labels/descriptions are localized here at module load (wp.i18n is a
// script dependency, available before this runs) so the render sites
// stay plain literal lookups and `wp i18n make-pot` can extract them.
const FIELDS: Array<{ name: ColorField; label: string; description: string }> = [
  {
    name: 'bg_color',
    label: __('Page background', 'flexa-unsubscribe'),
    description: __('Outer background colour of the unsubscribe page.', 'flexa-unsubscribe'),
  },
  {
    name: 'box_bg_color',
    label: __('Card background', 'flexa-unsubscribe'),
    description: __('Background of the content box.', 'flexa-unsubscribe'),
  },
  {
    name: 'text_color',
    label: __('Body text', 'flexa-unsubscribe'),
    description: __('Default text colour.', 'flexa-unsubscribe'),
  },
  {
    name: 'heading_color',
    label: __('Headings', 'flexa-unsubscribe'),
    description: __('Colour for h2 titles.', 'flexa-unsubscribe'),
  },
  {
    name: 'button_bg_color',
    label: __('Button background', 'flexa-unsubscribe'),
    description: __('Primary button colour.', 'flexa-unsubscribe'),
  },
  {
    name: 'button_text_color',
    label: __('Button text', 'flexa-unsubscribe'),
    description: __('Text colour inside buttons.', 'flexa-unsubscribe'),
  },
  {
    name: 'button_hover_color',
    label: __('Button hover', 'flexa-unsubscribe'),
    description: __('Button background when hovered.', 'flexa-unsubscribe'),
  },
];

interface Props {
  control: Control<AppearanceSettings>;
}

export function ColorsTab({ control }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map(({ name, label, description }) => (
        <FormField
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <ColorInput
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </FormControl>
              <FormDescription>{description}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
