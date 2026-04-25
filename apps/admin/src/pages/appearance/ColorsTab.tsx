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

const FIELDS: Array<{ name: ColorField; label: string; description: string }> = [
  {
    name: 'bg_color',
    label: 'Page background',
    description: 'Outer background colour of the unsubscribe page.',
  },
  {
    name: 'box_bg_color',
    label: 'Card background',
    description: 'Background of the content box.',
  },
  {
    name: 'text_color',
    label: 'Body text',
    description: 'Default text colour.',
  },
  {
    name: 'heading_color',
    label: 'Headings',
    description: 'Colour for h2 titles.',
  },
  {
    name: 'button_bg_color',
    label: 'Button background',
    description: 'Primary button colour.',
  },
  {
    name: 'button_text_color',
    label: 'Button text',
    description: 'Text colour inside buttons.',
  },
  {
    name: 'button_hover_color',
    label: 'Button hover',
    description: 'Button background when hovered.',
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
              <FormLabel>{__(label, 'flexa-unsubscribe')}</FormLabel>
              <FormControl>
                <ColorInput
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </FormControl>
              <FormDescription>{__(description, 'flexa-unsubscribe')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
