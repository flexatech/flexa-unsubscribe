<?php
/**
 * Plugin Constants
 */

if (!defined('ABSPATH')) exit;

// Plugin paths
define('FLEXA_TECH_SU_PATH', plugin_dir_path(dirname(__FILE__)));
define('FLEXA_TECH_SU_URL', plugin_dir_url(dirname(__FILE__)));
define('FLEXA_TECH_SU_VERSION', '3.0.0');

// Schema version — bump whenever `flexa_tech_su_create_db()` gains a
// new table, column, or index. The runner in `flexa-unsubscribe.php`
// re-runs `dbDelta` (and the defensive ALTERs) when the stored value
// is below this number.
//   v1 — initial schema (3.0.0)
//   v2 — `unsubscribed_at` index added for sargable analytics queries
define('FLEXA_TECH_SU_DB_VERSION', 2);

// Development toggle.
// When true the React admin loads from the Vite dev server (http://localhost:3001)
// and the React Refresh runtime is injected into admin_footer. When false or
// undefined, the built bundle at assets/dist/admin/ is used instead.
// Flip to true during local work; must be false for any shipped release.
if (!defined('FLEXA_TECH_SU_IS_DEVELOPMENT')) {
    define('FLEXA_TECH_SU_IS_DEVELOPMENT', false);
}

// Vite dev server origin. Must match `server.origin` (or the default) in
// apps/admin/vite.config.ts. Override in wp-config.php if you run Vite
// on a non-default host/port.
if (!defined('FLEXA_TECH_SU_VITE_DEV_ORIGIN')) {
    define('FLEXA_TECH_SU_VITE_DEV_ORIGIN', 'http://localhost:3001');
}

// Database table names
global $wpdb;
define('FLEXA_TECH_SU_TABLE', $wpdb->prefix . 'flexa_unsubscribes');
define('FLEXA_TECH_SU_BLOCKED_TABLE', $wpdb->prefix . 'flexa_blocked_emails');
define('FLEXA_TECH_SU_REASONS_TABLE', $wpdb->prefix . 'flexa_unsubscribe_reasons');
