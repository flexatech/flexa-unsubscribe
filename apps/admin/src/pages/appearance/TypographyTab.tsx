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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FONT_FAMILIES, type AppearanceSettings } from '@/lib/api/appearance';

interface Props {
  control: Control<AppearanceSettings>;
}

const FONT_LABELS: Record<(typeof FONT_FAMILIES)[number], string> = {
  'sans-serif': 'Sans-serif (default)',
  'Arial, sans-serif': 'Arial',
  'Helvetica, sans-serif': 'Helvetica',
  'Georgia, serif': 'Georgia',
  "'Times New Roman', serif": 'Times New Roman',
  "'Courier New', monospace": 'Courier New',
};

export function TypographyTab({ control }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={control}
        name="font_family"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{__('Font family', 'flexa-unsubscribe')}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {FONT_FAMILIES.map((family) => (
                  <SelectItem key={family} value={family}>
                    <span style={{ fontFamily: family }}>{__(FONT_LABELS[family], 'flexa-unsubscribe')}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              {__('Applied to the whole unsubscribe page.', 'flexa-unsubscribe')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="font_size"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{__('Font size', 'flexa-unsubscribe')}</FormLabel>
            <FormControl>
              <Input {...field} placeholder="14px" className="font-mono" />
            </FormControl>
            <FormDescription>
              {__('Any CSS length — e.g. 14px, 1em, 0.875rem, 100%.', 'flexa-unsubscribe')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
