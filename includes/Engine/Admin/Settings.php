<?php
namespace FlexaUnsubscribe\Engine\Admin;

use FlexaUnsubscribe\Utils\SingletonTrait;
use FlexaUnsubscribe\Register\ScriptName;
use FlexaUnsubscribe\Helpers\Helper;

if (!defined('ABSPATH')) exit;

/**
 * Registers the new React-powered top-level menu ("Flexa Unsubscribe")
 * and mounts the app to `<div id="flexa-unsubscribe">`.
 *
 * The legacy `includes/admin.php` still registers the `flexa-su` menu
 * with its PHP-rendered pages; both coexist while the React port is
 * in flight.
 */
class Settings {
    use SingletonTrait;

    private const MENU_SLUG = 'flexa-unsubscribe';
    private const HOOK_SUFFIX = 'toplevel_page_flexa-unsubscribe';

    private function __construct() {
        add_filter('admin_body_class', [$this, 'admin_body_class']);
        add_action('admin_menu', [$this, 'admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'admin_enqueue_scripts']);
    }

    public function admin_body_class($classes) {
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        if ($screen && $screen->id === self::HOOK_SUFFIX) {
            if (strpos($classes, 'flexa-unsubscribe-ui') === false) {
                $classes .= ' flexa-unsubscribe-ui';
            }
        }
        return $classes;
    }

    public function admin_menu() {
        // Phase 4 cutover: took over the label + menu slot the legacy
        // `flexa-su` menu used to occupy. Slug stays `flexa-unsubscribe`
        // so bookmarks made during the parallel-menu period keep working.
        add_menu_page(
            __('Unsubscribe', 'flexa-unsubscribe'),
            __('Unsubscribe', 'flexa-unsubscribe'),
            'manage_options',
            self::MENU_SLUG,
            [$this, 'render_root'],
            'dashicons-email-alt',
            60
        );
    }

    public function render_root() {
        echo '<div id="flexa-unsubscribe"></div>';
    }

    public function admin_enqueue_scripts($hook_suffix) {
        if ($hook_suffix !== self::HOOK_SUFFIX) return;

        wp_localize_script(ScriptName::PAGE_ADMIN, 'flexaUnsubscribe', Helper::get_js_config());
        wp_enqueue_script(ScriptName::PAGE_ADMIN);
        wp_enqueue_style(ScriptName::STYLE_ADMIN);
    }
}
