<?php
namespace FlexaUnsubscribe\Register;

use FlexaUnsubscribe\Utils\SingletonTrait;

if (!defined('ABSPATH')) exit;

/**
 * Prod-mode script registration.
 *
 * Points the admin bundle at the built output from `pnpm build`
 * (apps/admin/ → assets/dist/admin/js/main.js). React / ReactDOM /
 * @wordpress/i18n are Vite externals so they resolve to WP's enqueued
 * copies at runtime (hence the script deps below).
 *
 * The stylesheet handle is registered by RegisterFacade (shared
 * between dev and prod with a mode-aware src).
 */
class RegisterProd {
    use SingletonTrait;

    private function __construct() {
        add_action('init', [$this, 'register_all_scripts']);
    }

    public function register_all_scripts() {
        $deps = ['react', 'react-dom', 'wp-hooks', 'wp-i18n'];

        wp_register_script(
            ScriptName::PAGE_ADMIN,
            FLEXA_TECH_SU_URL . 'assets/dist/admin/js/main.js',
            $deps,
            FLEXA_TECH_SU_VERSION,
            true
        );
        wp_set_script_translations(
            ScriptName::PAGE_ADMIN,
            'flexa-unsubscribe',
            FLEXA_TECH_SU_PATH . 'languages'
        );
    }
}
