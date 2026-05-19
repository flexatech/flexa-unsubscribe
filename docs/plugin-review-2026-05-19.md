# WordPress Plugin Review — flexa-unsubscribe

**Date:** 2026-05-19
**Scope:** Static pre-submission audit (10-check WP.org rubric).
**Plugin root:** `flexa-unsubscribe/` · **Text Domain:** `flexa-unsubscribe`
**Excluded paths:** `vendor/`, `node_modules/`, `dist/`, `build/`, `apps/admin/dist/`

## Verdict

Passes all ten checks. **No blockers, no WP.org-rejection issues.** The
single suggestion (admin menu position) is a deliberate, documented design
choice and has been **left as-is** by decision of the maintainer.

## Blockers

None.

## Required (WP.org reviewer would reject)

None.

## Suggestions

| Check | Finding | Decision |
|-------|---------|----------|
| 4 — Admin menu placement | `includes/Engine/Admin/Settings.php:51` — `add_menu_page(...)` uses `$position = 60` (Appearance slot). The inline comment documents that this deliberately inherited the legacy `flexa-su` menu slot to preserve bookmarks made during the parallel-menu period. Rubric treats `60–79` as a Suggestion only. | **Left as-is** — intentional bookmark-continuity choice. |

## Clean checks

| # | Check | Result |
|---|-------|--------|
| 1 | Asset enqueueing | No raw `<script>`/`<style>`/heredoc. `render_root()` echoes only a static `<div id="flexa-unsubscribe">`. Script translations via `wp_set_script_translations` + registered handles. |
| 2 | Input sanitization | All `$_GET` reads in `includes/frontend.php` pass through `wp_unslash()` + `sanitize_key`/`sanitize_email`/`sanitize_text_field`. |
| 3 | REST `permission_callback` | All 15 routes guarded. CRUD/analytics/settings → `current_user_can('manage_options')`. `/reason` → HMAC (`hash_hmac('sha256', …, AUTH_KEY)` + `hash_equals`). None public/unguarded. |
| 5 | Output escaping | No unescaped `echo $var`. Templates use `esc_*`. No raw `_e()`. |
| 6 | ABSPATH guard | Every PHP file guarded. `includes/database.php` guard at line 28 (after a long docblock + `phpcs:disable` block) — present. |
| 7 | `$wpdb->prepare()` | Table names from `FLEXA_TECH_SU_*` constants (not user input); `ORDER BY` via `sanitize_sql_orderby()`; `LIMIT/OFFSET` via `absint()`; all value-bearing queries use `$wpdb->prepare()`. Reasoning documented with per-line `phpcs:ignore`. |
| 8 | Banned functions | No `eval`/`exec`/`base64_decode`/remote `file_get_contents`/`curl_init`. |
| 9 | i18n text-domain | All translation calls use `'flexa-unsubscribe'`; `load_plugin_textdomain()` present in `flexa-unsubscribe.php:49`. Bundled locales: fr_FR, de_DE, sv_SE, it_IT, zh_CN, ja, ar. |
| 10 | Nonce verification | `admin_post_*` CSV exporters check `current_user_can('manage_options')` **and** `check_admin_referer()`. REST uses `wp_rest` nonce + permission callbacks. Stateless public unsubscribe links use HMAC (correct — email links can't carry a cookie nonce), documented with scoped `phpcs:disable`. |
