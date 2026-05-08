<?php
/**
 * Plugin Name: Flexa Unsubscribe
 * Description: Professional email unsubscribe management with HMAC tokens, auto-append logic, and CSV export.
 * Version: 3.0.2
 * Author: flexatech
 * Text Domain: flexa-unsubscribe
 * Requires at least: 5.8
 * Tested up to:      6.9
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

// Activation hook
register_activation_hook(__FILE__, 'flexa_tech_su_create_db');

// Versioned schema upgrade — runs once per request when the stored
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
// transparently compatible — the declaration just silences the
// "Incompatible with WooCommerce features" admin notice.
add_action('before_woocommerce_init', function () {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('cart_checkout_blocks', __FILE__, true);
    }
});
