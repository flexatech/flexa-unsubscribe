import { useDeferredValue, useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

import { cn } from '@/lib/utils';
import type { AppearanceSettings } from '@/lib/api/appearance';

type PreviewState = 'success' | 'thank-you' | 'error' | 'resubscribe';

// Labels localized at module load (wp.i18n is a script dependency,
// available before this runs) so the render site stays a literal
// lookup and `wp i18n make-pot` can extract them.
const STATES: Array<{ key: PreviewState; label: string }> = [
  { key: 'success', label: __('Unsubscribe', 'flexa-unsubscribe') },
  { key: 'thank-you', label: __('Thank you', 'flexa-unsubscribe') },
  { key: 'error', label: __('Invalid link', 'flexa-unsubscribe') },
  { key: 'resubscribe', label: __('Re-subscribe', 'flexa-unsubscribe') },
];

/** Hard-coded in the legacy templates (line 120 unsub, 82 resub). */
const ERROR_TITLE_COLOR = '#dc3545';

const SAMPLE_EMAIL = 'customer@example.com';

/**
 * Lightweight replica of `templates/unsubscribe-page.php` +
 * `templates/resubscribe-page.php`. Reads the form draft via
 * `useWatch` (deferred so fast typing doesn't stall React) and
 * maps each token onto inline `style={{…}}`.
 *
 * Not iframe-based - we accept slight visual drift (e.g. no
 * viewport centring, scaled down) in exchange for zero state
 * sync complexity. The admin sees the right copy, colors,
 * font, and overall layout.
 */
export function AppearancePreview({ control }: { control: Control<AppearanceSettings> }) {
  const watched = useWatch({ control });
  const values = useDeferredValue(watched) as AppearanceSettings;
  const [state, setState] = useState<PreviewState>('success');

  if (!values) return null;

  const outerStyle: React.CSSProperties = {
    background: values.bg_color,
    color: values.text_color,
    fontFamily: values.font_family,
    fontSize: values.font_size,
  };
  const boxStyle: React.CSSProperties = {
    background: values.box_bg_color,
  };
  const headingStyle: React.CSSProperties = {
    color: values.heading_color,
  };
  const errorHeadingStyle: React.CSSProperties = {
    color: ERROR_TITLE_COLOR,
  };

  return (
    <div className="flex flex-col gap-3">
      {/* State switcher */}
      <div className="flex flex-wrap gap-1" role="tablist" aria-label={__('Preview state', 'flexa-unsubscribe')}>
        {STATES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={state === key}
            onClick={() => setState(key)}
            className={cn(
              'cursor-pointer rounded-md border px-2 py-1 text-xs transition-colors',
              state === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Preview frame */}
      <div
        className="overflow-hidden rounded-md border border-border"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
      >
        <div
          style={outerStyle}
          className="flex min-h-[320px] items-center justify-center px-4 py-6"
        >
          <div
            style={boxStyle}
            className="w-full max-w-sm rounded-lg px-6 py-6 text-center"
          >
            {state === 'success' && <SuccessState values={values} headingStyle={headingStyle} />}
            {state === 'thank-you' && <ThankYouState values={values} headingStyle={headingStyle} />}
            {state === 'error' && <ErrorState values={values} headingStyle={errorHeadingStyle} />}
            {state === 'resubscribe' && (
              <ResubscribeState values={values} headingStyle={headingStyle} />
            )}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {__(
          'Approximate preview - actual page is viewport-centred and may differ slightly under site themes.',
          'flexa-unsubscribe',
        )}
      </p>
    </div>
  );
}

// ─── State bodies ────────────────────────────────────────────────

interface StateProps {
  values: AppearanceSettings;
  headingStyle: React.CSSProperties;
}

function SuccessState({ values, headingStyle }: StateProps) {
  // Legacy: the `{email}` token is replaced server-side with a
  // `<strong>` wrapper. We do the same for preview accuracy, then
  // hand the resulting HTML to the renderer. The admin is the author
  // of this content so dangerouslySetInnerHTML is acceptable here.
  const messageHtml = useMemo(
    () =>
      values.success_message.replace('{email}', `<strong>${escapeHtml(SAMPLE_EMAIL)}</strong>`),
    [values.success_message],
  );

  return (
    <>
      <h2 style={{ ...headingStyle, fontWeight: 600, margin: '0 0 12px' }}>
        {values.title_text}
      </h2>
      <p
        style={{ margin: '0 0 16px' }}
        dangerouslySetInnerHTML={{ __html: messageHtml }}
      />
      <select
        disabled
        defaultValue=""
        style={{
          width: '100%',
          marginBottom: 12,
          padding: 8,
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 4,
        }}
      >
        <option value="">{__('-- Please select a reason --', 'flexa-unsubscribe')}</option>
      </select>
      <Btn values={values}>{values.button_text}</Btn>
    </>
  );
}

function ThankYouState({ values, headingStyle }: StateProps) {
  return (
    <>
      <h2 style={{ ...headingStyle, fontWeight: 600, margin: '0 0 12px' }}>
        {values.thank_you_title}
      </h2>
      {/* Legacy escapes this on output - render as plain text. */}
      <p style={{ margin: '0 0 16px' }}>{values.thank_you_message}</p>
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        style={{
          color: values.button_bg_color,
          textDecoration: 'underline',
          marginRight: 12,
        }}
      >
        {__('Re-subscribe to emails', 'flexa-unsubscribe')}
      </a>
      <Btn values={values}>{values.home_link_text}</Btn>
    </>
  );
}

function ErrorState({ values, headingStyle }: StateProps) {
  return (
    <>
      <h2 style={{ ...headingStyle, fontWeight: 600, margin: '0 0 12px' }}>
        {values.error_title}
      </h2>
      <p
        style={{ margin: '0 0 16px' }}
        dangerouslySetInnerHTML={{ __html: values.error_message }}
      />
      <Btn values={values}>{values.home_link_text}</Btn>
    </>
  );
}

function ResubscribeState({ values, headingStyle }: StateProps) {
  return (
    <>
      <div
        style={{
          fontSize: 40,
          color: '#00a32a',
          marginBottom: 8,
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        ✓
      </div>
      <h2 style={{ ...headingStyle, fontWeight: 600, margin: '0 0 12px' }}>
        {values.resubscribe_title}
      </h2>
      {/* Legacy escapes this on output - render as plain text. */}
      <p style={{ margin: '0 0 16px' }}>{values.resubscribe_message}</p>
      <Btn values={values}>{values.home_link_text}</Btn>
    </>
  );
}

/**
 * Button with hover swap driven by local state - the only way to
 * demonstrate `button_hover_color` without a real :hover rule since
 * inline styles can't express pseudo-classes.
 */
function Btn({ values, children }: { values: AppearanceSettings; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => e.preventDefault()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? values.button_hover_color : values.button_bg_color,
        color: values.button_text_color,
        border: 'none',
        padding: '8px 16px',
        borderRadius: 4,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        transition: 'background-color 0.2s',
      }}
    >
      {children}
    </button>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
