=== Flexa Unsubscribe ===
Contributors: flexatech
Tags: unsubscribe, email, mailing list, gdpr, opt-out
Requires at least: 5.8
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 3.0.3
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Professional email unsubscribe management with HMAC tokens, auto-appended unsubscribe links, recipient blocking, and CSV export.

== Description ==

**Flexa Unsubscribe** adds a complete unsubscribe workflow to every email WordPress sends, with a fully-branded admin UI for managing opt-outs, analytics, and the public unsubscribe page.

* **Auto-appends a secure unsubscribe button** to outgoing single-recipient emails. Tokens are HMAC-signed using the `AUTH_KEY` in `wp-config.php`, so no database lookup is needed to verify a link.
* **Blocks outbound mail to unsubscribed addresses** before it reaches the mail server. Blocked attempts are logged to a dedicated audit table.
* **Honours an exclude-keywords list** (default: `Order, Password, Invoice`) so transactional mail never gets an unsubscribe link and never gets blocked.
* **Re-subscribe URL** is supported as a first-class action - the plugin can tell opt-outs from opt-backs.
* **Customisable public page** - every color, font, and string on the unsubscribe/re-subscribe templates is editable from the admin with a live preview.

== Admin UI ==

Starting with v3.0.0 the admin is a React single-page application with seven screens:

* **Dashboard** - stats cards + bar chart of unsubscribes over time + pie chart of top reasons.
* **Unsubscribes / Blocked emails / Re-subscribed** - paginated tables with sorting, per-row delete, and CSV export.
* **Reasons** - manage the dropdown options shown on the public unsubscribe form; click-to-edit, ↑/↓ reorder.
* **Settings** - enable/disable auto-append + blocking, tune the exclude-keywords list.
* **Appearance** - 19 tokens (colors, typography, copy) across three tabs with a live preview panel.


All screens are powered by a REST API under `/wp-json/flexa-unsubscribe/v1/`, so external integrations can plug in too.

**Source code for compiled JavaScript and CSS**

The plugin ships with minified/compiled JavaScript and CSS in `assets/dist/`. The human-readable source code for these assets is **publicly available** and maintained at:

https://github.com/flexatech/flexa-unsubscribe

Source lives in the `apps/admin` (admin UI) and `apps/frontend` (product page UI) directories. Build tools used: **pnpm**, **Vite**, **React**, **TypeScript**. To build from source: clone the repository, run `pnpm install` from the plugin root, then build the admin and frontend apps (see the repository README for exact commands). This allows the code to be reviewed, studied, and forked.

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

== Changelog ==

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
