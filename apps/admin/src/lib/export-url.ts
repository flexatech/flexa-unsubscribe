/**
 * Builds an `admin-post.php` URL for a legacy CSV export handler.
 *
 * Each of the three handlers (`flexa_export_csv`, `flexa_export_blocked_csv`,
 * `flexa_export_resubscribed_csv`) verifies its own nonce via
 * `check_admin_referer`. `Helper::get_js_config()` exposes one nonce
 * per handler under `admin_post_nonces`; this helper picks the right
 * one by key and assembles the href that a `<a>` tag can use directly.
 *
 * Returns `null` if `window.flexaUnsubscribe` isn't hydrated yet (the
 * caller should hide the Export button in that case).
 */
export function buildExportUrl(
  action: 'flexa_export_csv' | 'flexa_export_blocked_csv' | 'flexa_export_resubscribed_csv',
  nonceKey: keyof NonNullable<FlexaUnsubscribeConfig['admin_post_nonces']>,
): string | null {
  const cfg = window.flexaUnsubscribe;
  if (!cfg?.admin_url) return null;
  const nonce = cfg.admin_post_nonces?.[nonceKey];
  if (!nonce) return null;

  const url = new URL('admin-post.php', cfg.admin_url);
  url.searchParams.set('action', action);
  url.searchParams.set('_wpnonce', nonce);
  return url.toString();
}
