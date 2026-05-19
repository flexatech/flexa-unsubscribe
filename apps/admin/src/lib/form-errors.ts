import type { FieldValues, UseFormSetError, Path } from 'react-hook-form';
import { HTTPError } from 'ky';
import { __ } from '@wordpress/i18n';

/**
 * Body shape we expect from REST endpoints on 4xx. WP's default
 * error shape is `{ code, message, data: { status, …extras } }`;
 * our controllers optionally include `data.fieldErrors` - a map of
 * `fieldName → messageString`. Anything else is surfaced at the
 * form root.
 */
interface WpRestError {
  code?: string;
  message?: string;
  data?: {
    status?: number;
    fieldErrors?: Record<string, string>;
  };
}

/**
 * Translate a ky `HTTPError` (or any throwable) into per-field +
 * root-level RHF errors. Use inside a mutation's `onError`:
 *
 *   onError: (err) => applyFormErrors(err, form.setError)
 */
export async function applyFormErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): Promise<void> {
  let body: WpRestError | null = null;

  if (error instanceof HTTPError) {
    try {
      body = (await error.response.clone().json()) as WpRestError;
    } catch {
      body = null;
    }
  }

  const rootMessage =
    body?.message ||
    (error instanceof Error ? error.message : __('Something went wrong.', 'flexa-unsubscribe'));

  const fieldErrors = body?.data?.fieldErrors;
  if (fieldErrors) {
    for (const [field, message] of Object.entries(fieldErrors)) {
      setError(field as Path<T>, { type: 'server', message });
    }
  }

  // Always set a root message too - lets the form card show a banner
  // even when all individual fields were attributed.
  setError('root.serverError' as Path<T>, { type: 'server', message: rootMessage });
}
