import * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

const HEX_3_OR_6 = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Expand shorthand `#abc` to `#aabbcc` and lowercase. Returns the
 * original input unchanged if it's not a valid hex shape — the Zod
 * schema will catch that at submit time.
 */
function normalize(hex: string): string {
  const trimmed = hex.trim();
  if (!HEX_3_OR_6.test(trimmed)) return trimmed;
  const body = trimmed.slice(1).toLowerCase();
  if (body.length === 3) {
    return '#' + body[0] + body[0] + body[1] + body[1] + body[2] + body[2];
  }
  return '#' + body;
}

/**
 * A controlled composed input: native colour picker + hex text field,
 * both writing the same form value. Used inside `<FormControl>` in
 * Phase 3 appearance forms. The hex text accepts 3- or 6-char hex;
 * 3-char expands on blur so the value persisted is always 6-char
 * lowercase.
 */
export const ColorInput = React.forwardRef<HTMLInputElement, ColorInputProps>(
  ({ value, onChange, onBlur, name, id, disabled, className }, ref) => {
    // Internal text state lets the user type an intermediate value
    // like `#f` without the controlled colour picker lurching. On
    // blur we normalise + commit back to the parent.
    const [text, setText] = React.useState(value);
    React.useEffect(() => {
      setText(value);
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setText(next);
      // Only propagate to the form if the text is a complete hex —
      // avoids thrashing the colour picker while the user types.
      if (HEX_3_OR_6.test(next.trim())) {
        onChange(normalize(next));
      }
    };

    const handleTextBlur = () => {
      const normalized = normalize(text);
      setText(normalized);
      if (normalized !== value) onChange(normalized);
      onBlur?.();
    };

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // `<input type="color">` always emits 6-char lowercase hex.
      const next = e.target.value.toLowerCase();
      setText(next);
      onChange(next);
    };

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <input
          type="color"
          value={HEX_3_OR_6.test(value) ? normalize(value) : '#000000'}
          onChange={handlePickerChange}
          disabled={disabled}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1 disabled:cursor-not-allowed disabled:opacity-50"
          aria-hidden="true"
          tabIndex={-1}
        />
        <Input
          ref={ref}
          id={id}
          name={name}
          value={text}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          disabled={disabled}
          placeholder="#000000"
          spellCheck={false}
          autoComplete="off"
          className="font-mono w-32"
        />
      </div>
    );
  },
);
ColorInput.displayName = 'ColorInput';
