<?php
/**
 * Plugin Name: Flexa Unsubscribe
 * Description: Professional email unsubscribe management with HMAC tokens, auto-append logic, and CSV import/export.
 * Version: 3.1.7
 * Author: flexatech
 * Text Domain: flexa-unsubscribe
 * Requires at least: 5.8
 * Tested up to:      7.0
 * Requires PHP:      7.4
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package flexatech/flexa-unsubscribe
 */

if (!defined('ABSPATH')) exit;

// Load constants first
require_once plugin_dir_path(__FILE__) . 'includes/constants.php';

// PSR-4 autoloader for the new namespaced classes under includes/
// (the legacy procedural files below keep using plain require_once).
spl_autoload_register(function ($class) {
    $prefix = 'FlexaUnsubscribe\\';
    $base_dir = FLEXA_TECH_SU_PATH . 'includes/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;

    $relative = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative) . '.php';
    if (file_exists($file)) require_once $file;
});

// Legacy procedural includes (kept working while the React admin is phased in).
require_once FLEXA_TECH_SU_PATH . 'includes/database.php';
require_once FLEXA_TECH_SU_PATH . 'includes/core.php';
require_once FLEXA_TECH_SU_PATH . 'includes/settings.php';
require_once FLEXA_TECH_SU_PATH . 'includes/frontend.php';
require_once FLEXA_TECH_SU_PATH . 'includes/admin.php';

// Load translations. Hooked on `init` (not `plugins_loaded`) so that on
// WP 6.7+ the call doesn't trip the `_load_textdomain_just_in_time`
// doing_it_wrong notice, while still covering WP 5.8-6.6 where the
// just-in-time loader isn't available. Bundled .mo/.json live in
// `languages/`; a wp-content/languages/plugins/ override still wins.
add_action('init', function () {
    load_plugin_textdomain(
        'flexa-unsubscribe',
        false,
        dirname(plugin_basename(__FILE__)) . '/languages'
    );
});

// Activation hook
register_activation_hook(__FILE__, 'flexa_tech_su_create_db');

// Versioned schema upgrade - runs once per request when the stored
// db_version is below FLEXA_TECH_SU_DB_VERSION, then writes the new
// version. `flexa_tech_su_create_db()` is idempotent (`dbDelta` +
// existence-checked ALTERs), so re-running it on existing installs
// is safe.
add_action('plugins_loaded', function () {
    if ((int) get_option('flexa_tech_su_db_version', 0) < FLEXA_TECH_SU_DB_VERSION) {
        flexa_tech_su_create_db();
        update_option('flexa_tech_su_db_version', FLEXA_TECH_SU_DB_VERSION, false);
    }
}, 5);

// Boot the new namespaced admin / REST layer.
add_action('plugins_loaded', function () {
    \FlexaUnsubscribe\Initialize::get_instance();
});

// Declare WooCommerce feature compatibility. The plugin only hooks
// `wp_mail` and never reads or writes the orders table, so HPOS
// (custom_order_tables) and the Cart/Checkout Blocks are both
// transparently compatible - the declaration just silences the
// "Incompatible with WooCommerce features" admin notice.
add_action('before_woocommerce_init', function () {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('cart_checkout_blocks', __FILE__, true);
    }
});

// Plugins list row: prepend "Settings" + "Documentation" links so the
// row reads `Settings | Documentation | Deactivate`. The Settings link
// jumps straight to the React admin (slug `flexa-unsubscribe`, the
// same admin URL the menu item opens). Documentation opens the public
// doc site in a new tab.
add_filter('plugin_action_links_' . plugin_basename(__FILE__), function ($links) {
    $settings_url = admin_url('admin.php?page=flexa-unsubscribe');
    $extra = array(
        'settings' => sprintf(
            '<a href="%s">%s</a>',
            esc_url($settings_url),
            esc_html__('Settings', 'flexa-unsubscribe')
        ),
        'documentation' => sprintf(
            '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
            esc_url(FLEXA_TECH_SU_DOC_URL),
            esc_html__('Documentation', 'flexa-unsubscribe')
        ),
    );
    return array_merge($extra, $links);
});

// Plugin row meta (the smaller text on the right of the row). Add
// the doc link there too so it's reachable from either column,
// matching what WP.org plugin reviewers expect for an external
// docs reference.
add_filter('plugin_row_meta', function ($links, $file) {
    if ($file !== plugin_basename(__FILE__)) return $links;
    $links[] = sprintf(
        '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
        esc_url(FLEXA_TECH_SU_DOC_URL),
        esc_html__('View documentation', 'flexa-unsubscribe')
    );
    return $links;
}, 10, 2);
