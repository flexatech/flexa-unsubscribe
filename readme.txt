=== Flexa Unsubscribe ===
Contributors: flexatech
Tags: unsubscribe, email, mailing list, gdpr, opt-out
Requires at least: 5.8
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 3.1.9
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Professional email unsubscribe management with HMAC tokens, auto-appended unsubscribe links, recipient blocking, and CSV import/export.

== Description ==

**Flexa Unsubscribe** adds a complete unsubscribe workflow to every email WordPress sends, with a fully-branded admin UI for managing opt-outs, analytics, and the public unsubscribe page.

* **Auto-appends a secure unsubscribe button** to outgoing single-recipient emails. Tokens are HMAC-signed using the `AUTH_KEY` in `wp-config.php`, so no database lookup is needed to verify a link.
* **Blocks outbound mail to unsubscribed addresses** before it reaches the mail server. Blocked attempts are logged to a dedicated audit table.
* **Honours an exclude-keywords list** (default: `Order, Password, Invoice`) so transactional mail never gets an unsubscribe link and never gets blocked.
* **Re-subscribe URL** is supported as a first-class action - the plugin can tell opt-outs from opt-backs.
* **Customisable public page** - every color, font, and string on the unsubscribe/re-subscribe templates is editable from the admin with a live preview.

All screens are powered by a REST API under `/wp-json/flexa-unsubscribe/v1/`, so external integrations can plug in too.

**Source code for compiled JavaScript and CSS**

The plugin ships with minified/compiled JavaScript and CSS in `assets/dist/`. The human-readable source code for these assets is **publicly available** and maintained at:

https://github.com/flexatech/flexa-unsubscribe

Source lives in the `apps/admin` (admin UI) directory. Build tools used: **pnpm**, **Vite**, **React**, **TypeScript**. To build from source: clone the repository, run `pnpm install` in `apps/admin`, then `pnpm build` (see the repository README for exact commands). This allows the code to be reviewed, studied, and forked.


**Documentation**

Full user guide, technical reference, and REST API documentation are hosted at:

https://unsubscribe-doc.flexacommerce.com/

A "Documentation" link is also added to the plugin row on the **Plugins** screen for one-click access from inside WordPress.

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/flexa-unsubscribe`, or install through the WordPress **Plugins** screen.
2. Activate the plugin through the **Plugins** screen.
3. On activation the plugin provisions three database tables: `{prefix}flexa_unsubscribes`, `{prefix}flexa_blocked_emails`, `{prefix}flexa_unsubscribe_reasons` (the last seeded with three default reasons).
4. Visit **Unsubscribe** in the admin sidebar to configure.

== Frequently Asked Questions ==

= Do I need to change anything in my existing email sending code? =

No. The plugin hooks `wp_mail` with standard WordPress filters. Any plugin or theme that sends mail via `wp_mail` is covered automatically.

= What happens if I rotate `AUTH_KEY`? =

Every in-flight unsubscribe/resubscribe link becomes invalid, because the HMAC key is `AUTH_KEY`. New links issued after rotation work normally. Existing records in the database are unaffected.

= How are blocked emails different from unsubscribed addresses? =

`Unsubscribes` is the list of addresses that opted out. `Blocked emails` is the audit log of outgoing sends that were stopped because they targeted an unsubscribed address. One unsubscribe can cause many blocked-email entries over time.

= Are CSV exports safe to share publicly? =

No - CSV exports contain email addresses. Treat them as PII. The download link is nonce-protected so it's not trivially shareable across sessions.

= Are there developer hooks I can extend? =

Yes. Three action hooks fire on opt-out events so you can sync opt-outs to a CRM, ESP, or your own logging:

* `do_action( 'flexa_unsubscribe_unsubscribed', $email, $reason )` - fires when an address is recorded as unsubscribed. `$reason` is '' for link-based opt-outs because the public page collects the reason in a follow-up step.
* `do_action( 'flexa_unsubscribe_resubscribed', $email )` - fires when an address is re-subscribed (opted back in).
* `do_action( 'flexa_unsubscribe_email_blocked', $email, $subject )` - fires for each recipient whose outbound email is blocked because they had opted out.

Example: add_action( 'flexa_unsubscribe_unsubscribed', 'my_sync_optout', 10, 2 );

== Screenshots ==

1. **Dashboard** - stats cards + bar chart of unsubscribes over time + pie chart of top reasons.
2. **Unsubscribes / Blocked emails / Re-subscribed** - paginated tables with sorting, per-row delete, and CSV export. The Unsubscribes screen also accepts CSV import for bulk-adding opt-out records (skip-on-duplicate).
3. **Reasons** - manage the dropdown options shown on the public unsubscribe form; click-to-edit, reorder with the arrow buttons.
4. **Settings** - enable/disable auto-append + blocking, tune the exclude-keywords list.
5. **Appearance** - 19 tokens (colors, typography, copy) across three tabs with a live preview panel.
6. **Blocked Emails** - audit log of send attempts that were stopped because the recipient had opted out - it is not the opt-out list itself.

== Changelog ==

= 3.1.9 =
* **Compatibility:** Tested against WordPress 7.1 and bumped "Tested up to" to 7.1. No code changes were required - the plugin's admin app (Radix + Tailwind, `@wordpress/i18n` only) is unaffected by the 7.1 `@wordpress/components` and jQuery UI updates, and the plugin does not touch the post editor, media processing, or the editor toolbar.

= 3.1.8 =
* **i18n:** Removed the manual `load_plugin_textdomain()` call. WordPress loads translations just-in-time for the plugin slug (language packs + bundled `languages/` files), so the call was redundant and flagged by Plugin Check.
* **Packaging:** Exclude the dev-only Vite HMR registration (`RegisterDev.php`) from the distributed build so the WordPress.org Plugin Check no longer flags its dev-only inline script.
* **Docs:** Correct the source-code build instructions in the readme (single `apps/admin` app) and clarify a code comment about how the public unsubscribe/re-subscribe templates sanitize HTML message fields.

= 3.1.7 =
* **New:** Added three developer action hooks so external plugins can react to opt-out events: `flexa_unsubscribe_unsubscribed` (fires with the email and reason when an address opts out), `flexa_unsubscribe_resubscribed` (fires with the email when an address opts back in), and `flexa_unsubscribe_email_blocked` (fires with the recipient and subject when an outbound email is blocked). See the FAQ for signatures and usage.

= 3.1.5 =
* **New:** Added a `flexa_unsubscribe_hmac_key` filter so developers can supply a custom, stable secret for signing unsubscribe/resubscribe links instead of `AUTH_KEY`. With no filter hooked, behavior is unchanged and existing links keep verifying.

= 3.1.4 =
* **Fix:** The Screenshots section on the WordPress.org plugin page now renders correctly. A non-ASCII arrow character in screenshot caption 3 broke the page rendering; the caption now describes the reorder buttons in plain text.

= 3.1.3 =
* **Fix:** Destructive confirmation dialogs (e.g. "Clear all" on the Blocked emails screen) now focus the **Cancel** button when they open, so holding Enter on the triggering button can no longer accidentally confirm the deletion. Non-destructive dialogs still focus Confirm.

= 3.1.2 =
* **Fix:** Inline-editing a reason on the **Reasons** screen now commits the new value when you click anywhere outside the input. Previously, clicking away discarded the typed value - only pressing Enter would save. Enter still saves; Esc still discards.

= 3.1.1 =
* **New:** Plugins-list row now shows **Settings** and **Documentation** links next to **Deactivate**, plus a **View documentation** link in the row's meta line. The doc site is https://unsubscribe-doc.flexacommerce.com/.
* **i18n:** 3 new translatable strings ("Settings", "Documentation", "View documentation").

= 3.1.0 =
* **New:** CSV import on the Unsubscribes screen. Bulk-add opt-out records by uploading a CSV file - the same `Email, Reason, Date` shape produced by the existing CSV export, so an export from one site can be re-imported on another. Email is the only required column; Reason and Date are optional. A header row is auto-detected; headerless files are also accepted.
* **Behavior:** Existing emails are skipped (the import is idempotent - it never overwrites the original `unsubscribed_at` or reason for a row already on the list). The dialog reports imported / skipped / failed counts and lists the first 100 row-level errors so you can correct the source file.
* **Safety limits:** 2 MiB max file size, 10,000 rows per import, requires `manage_options` plus the standard REST nonce.
* **REST:** new `POST /flexa-unsubscribe/v1/unsubscribes/import` endpoint accepts a `multipart/form-data` upload (field `file`).
* **i18n:** 29 new translatable strings (8 PHP, 21 admin UI), translated across all seven bundled locales.

= 3.0.2 =
* **Security:** Sanitize `$_GET['email']` and `$_GET['token']` at the read site in the public unsubscribe/resubscribe handler (`sanitize_email` / `sanitize_text_field` + `wp_unslash`), with a documented `phpcs:disable WordPress.Security.NonceVerification.Recommended` since the HMAC token is the CSRF protection layer for these public links.
* **Compatibility:** Replace inline `<style>` and `<script>` blocks in `templates/unsubscribe-page.php` and `templates/resubscribe-page.php` with `wp_register_style` / `wp_enqueue_style` / `wp_add_inline_style` (and the script equivalents), so the public templates pass the WP.org Plugin Check enqueue rule.
* **Docs:** Fix the source-code repository URL in `readme.txt`.

= 3.0.0 =
* **Complete admin rewrite.** The seven admin pages are now a React single-page app (Vite + TypeScript + shadcn/ui + Tailwind v4) instead of individual PHP-rendered screens.
* **New:** REST API under `/wp-json/flexa-unsubscribe/v1/` covering unsubscribes, blocked emails, re-subscribes, reasons, settings, appearance, and analytics. Every admin screen consumes this API.
* **New:** Dashboard with time-series and reasons charts (recharts).
* **New:** Live preview panel on the Appearance screen - see your colors, fonts, and copy applied to a replica of the public unsubscribe page while you edit.
* **New:** Client-side search + server-side sort + server-side pagination on every list screen.
* **New:** URL-synced table state (`?page=2&sort=email&order=desc` bookmarkable) on every list screen.
* **Security:** CSV export `admin-post.php` handlers now verify nonces via `check_admin_referer()`.
* **Change:** Admin menu label is "Unsubscribe" (same as pre-2.x) and sits at menu position 60. Slug changed from `flexa-su` to `flexa-unsubscribe` - legacy admin bookmarks will 404.
* **Change:** Removed the `flexa_get_analytics_data` AJAX endpoint, superseded by the REST `/analytics/*` routes.
* **Requires PHP 7.4** (was previously unspecified; the plugin now declares the floor).

= 2.0.2 =
* Pagination for large lists.

= 2.0.1 =
* Menu refinements.

= 2.0.0 =
* Analytics page introduced.
