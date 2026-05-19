<?php
namespace FlexaUnsubscribe\Register;

use FlexaUnsubscribe\Utils\SingletonTrait;

if (!defined('ABSPATH')) exit;

/**
 * Decides whether to load RegisterDev (Vite dev server) or RegisterProd
 * (built bundle) based on FLEXA_TECH_SU_IS_DEVELOPMENT, and handles the
 * cross-cutting concerns that apply to both modes:
 *
 *  - `script_loader_tag` filter promotes any script whose handle carries
 *    the `flexa-unsubscribe/module/` prefix to `type="module"`. Both
 *    Vite's dev server (serving raw .tsx) and its production ES-module
 *    output require this.
 *  - The admin stylesheet handle is registered here with a mode-aware
 *    `src`: in dev Vite injects CSS at runtime via the JS module, so the
 *    static file doesn't exist yet - we register with a `false` src so
 *    `wp_enqueue_style` is happy but emits nothing.
 */
class RegisterFacade {
    use SingletonTrait;

    private function __construct() {
        add_filter('script_loader_tag', [$this, 'add_entry_as_module'], 10, 3);
        add_action('init', [$this, 'register_all_styles']);

        $is_dev = defined('FLEXA_TECH_SU_IS_DEVELOPMENT') && FLEXA_TECH_SU_IS_DEVELOPMENT === true;

        if ($is_dev && class_exists(RegisterDev::class)) {
            RegisterDev::get_instance();
        } else {
            RegisterProd::get_instance();
        }
    }

    /**
     * Promote our bundle to an ES module so both Vite dev-server imports
     * and the production ES-module output load correctly.
     */
    public function add_entry_as_module($tag, $handle) {
        if (strpos($handle, ScriptName::MODULE_PREFIX) === false) {
            return $tag;
        }

        if (strpos($tag, 'type="') !== false) {
            return preg_replace('/\stype="\S+"/', ' type="module"', $tag, 1);
        }
        return str_replace(' src=', ' type="module" src=', $tag);
    }

    public function register_all_styles() {
        $is_dev = defined('FLEXA_TECH_SU_IS_DEVELOPMENT') && FLEXA_TECH_SU_IS_DEVELOPMENT === true;

        wp_register_style(
            ScriptName::STYLE_ADMIN,
            $is_dev ? false : FLEXA_TECH_SU_URL . 'assets/dist/admin/style.css',
            [],
            FLEXA_TECH_SU_VERSION
        );
    }
}
