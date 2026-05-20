import { useDeferredValue } from 'react';
import { __ } from '@wordpress/i18n';
import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

import type { GeneralSettings } from '@/lib/api/settings';

/**
 * Live replica of the footer that `flexa_auto_append_unsubscribe_link()`
 * appends in `includes/core.php`. The inline styles below are kept
 * byte-for-byte in sync with the `$button_html` sprintf there so the
 * admin sees exactly what recipients get. Reads the form draft via
 * `useWatch` (deferred so fast typing doesn't stall React), same
 * pattern as `AppearancePreview`.
 *
 * Not iframe-based - we accept slight visual drift (no real email
 * client rendering) in exchange for zero state-sync complexity.
 */
export function EmailFooterPreview({ control }: { control: Control<GeneralSettings> }) {
  const watched = useWatch({ control });
  const values = useDeferredValue(watched) as GeneralSettings;

  if (!values) return null;

  const headingText = values.append_heading_text ?? '';
  const buttonText = values.append_button_text ?? '';
  const buttonColor = values.append_button_color ?? '';

  // Mirrors includes/core.php $button_html exactly.
  const containerStyle: React.CSSProperties = {
    marginTop: 20,
    paddingTop: 20,
    borderTop: '1px solid #e0e0e0',
    textAlign: 'center',
  };
  const headingStyle: React.CSSProperties = {
    marginBottom: 10,
    color: '#222',
    fontSize: 15,
    fontFamily: 'Arial, sans-serif',
  };
  const buttonStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '5px 5px',
    backgroundColor: buttonColor,
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'Arial, sans-serif',
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">
        {__('Preview', 'flexa-unsubscribe')}
      </span>

      {/* Preview frame */}
      <div
        className="overflow-hidden rounded-md border border-border"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
      >
        <div className="bg-white px-6 py-6">
          {/* Simulated email body the footer is appended below. */}
          <div aria-hidden className="space-y-2">
            <div className="h-2 w-3/4 rounded bg-slate-200" />
            <div className="h-2 w-full rounded bg-slate-100" />
            <div className="h-2 w-2/3 rounded bg-slate-100" />
          </div>

          <div style={containerStyle}>
            <div style={headingStyle}>{headingText}</div>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={buttonStyle}
            >
              {buttonText}
            </a>
          </div>
        </div>
      </div>

      {values.enable_auto_append ? (
        <p className="text-[11px] text-muted-foreground">
          {__(
            'Approximate preview - rendering may differ slightly across email clients.',
            'flexa-unsubscribe',
          )}
        </p>
      ) : (
        <p className="text-[11px] text-amber-600">
          {__(
            'Auto-append is off - this footer is not added to outgoing emails until you enable it above.',
            'flexa-unsubscribe',
          )}
        </p>
      )}
    </div>
  );
}
