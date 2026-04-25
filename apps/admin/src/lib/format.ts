/**
 * Formatting helpers used by column renderers.
 *
 * Date strings arrive from the DB as MySQL DATETIME (`YYYY-MM-DD HH:mm:ss`)
 * in site timezone (see `current_time('mysql')` in `includes/database.php`).
 * We reinterpret them as local times in `window.flexaUnsubscribe.timezone_string`
 * and render via `Intl.DateTimeFormat` so the browser locale picks the
 * right numerals / separators. We don't port WP's PHP format tokens
 * verbatim — Intl produces defensible results and we avoid a tokenizer
 * that would need maintenance for every new admin locale.
 */

const config = typeof window !== 'undefined' ? window.flexaUnsubscribe : undefined;

const timeZone = config?.timezone_string || undefined;
const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

const dateFmt = new Intl.DateTimeFormat(locale, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone,
});

const dateTimeFmt = new Intl.DateTimeFormat(locale, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone,
});

/**
 * Parse a MySQL-style DATETIME string as a Date in the site's timezone.
 *
 * `new Date('2026-04-23 12:34:56')` is non-standard and timezone-ambiguous
 * across browsers — Safari in particular rejects it. We normalise to ISO
 * so parsing is deterministic, then rely on the Intl formatter's `timeZone`
 * option to render in the right zone.
 */
function parseDbDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  // Treat the all-zeros sentinel as null (legacy migration artefact).
  if (value === '0000-00-00 00:00:00') return null;

  // MySQL DATETIME → ISO "YYYY-MM-DDTHH:mm:ss".
  const iso = value.replace(' ', 'T');
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value: string | null | undefined): string {
  const d = parseDbDate(value);
  return d ? dateFmt.format(d) : '—';
}

export function formatDateTime(value: string | null | undefined): string {
  const d = parseDbDate(value);
  return d ? dateTimeFmt.format(d) : '—';
}

/** ISO string for native `title=…` tooltips — the unambiguous form. */
export function formatDateIso(value: string | null | undefined): string {
  const d = parseDbDate(value);
  return d ? d.toISOString() : '';
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(locale).format(n);
}
