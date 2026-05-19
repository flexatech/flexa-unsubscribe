<?php
namespace FlexaUnsubscribe\Helpers;

if (!defined('ABSPATH')) exit;

class Helper {
    public static function get_js_config(): array {
        return apply_filters('flexa_unsubscribe_js_config', [
            'plugin_url' => FLEXA_TECH_SU_URL,
            'admin_url'  => admin_url(),
            'rest_url'   => esc_url_raw(rest_url()),
            'rest_nonce' => wp_create_nonce('wp_rest'),
            'rest_base'  => 'flexa-unsubscribe/v1',

            // For client-side date rendering. The DB stores DATETIME in site
            // timezone (via current_time('mysql')) - we pass the timezone
            // and format strings so the React side can format with the same
            // rules the legacy admin pages use.
            'timezone_string' => wp_timezone_string(),
            'date_format'     => (string) get_option('date_format', 'F j, Y'),
            'time_format'     => (string) get_option('time_format', 'g:i a'),

            // Nonces for legacy admin-post CSV export handlers. Each action
            // verifies its own nonce via check_admin_referer(), so we expose
            // one per handler. React renders these straight into the
            // "Export CSV" anchor href as _wpnonce=… so a click POSTs with
            // a valid nonce.
            'admin_post_nonces' => [
                'export_unsubscribes' => wp_create_nonce('flexa_export_csv'),
                'export_blocked'      => wp_create_nonce('flexa_export_blocked_csv'),
                'export_resubscribed' => wp_create_nonce('flexa_export_resubscribed_csv'),
            ],
        ]);
    }
}
