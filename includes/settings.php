<?php
/**
 * Settings Management
 *
 * `register_setting()` for every persisted option. The actual sanitization
 * for the React admin path lives in `Controllers\SettingsRestController`,
 * but `register_setting` requires its own `sanitize_callback` for any
 * code (REST `WP_REST_Server::EDITABLE` via the legacy `/wp/v2/settings`
 * surface, manual `update_option`, etc.) that goes through the Settings
 * API. The callbacks here mirror the REST controller's per-field rules.
 */

if (!defined('ABSPATH')) exit;

/**
 * Sanitize a hex color, falling back to '#000000' on bad input. Mirrors
 * `SettingsRestController::normalize_hex` so the two write paths agree.
 */
function flexa_tech_su_sanitize_color($value) {
    if (!is_string($value)) {
        return '#000000';
    }
    $value = trim($value);
    if (!preg_match('/^#([0-9a-f]{3}|[0-9a-f]{6})$/i', $value)) {
        return '#000000';
    }
    $hex = strtolower(substr($value, 1));
    if (strlen($hex) === 3) {
        $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }
    return '#' . $hex;
}

/**
 * Sanitize the `font_family` enum.
 */
function flexa_tech_su_sanitize_font_family($value) {
    static $allowed = [
        'sans-serif',
        'Arial, sans-serif',
        'Helvetica, sans-serif',
        'Georgia, serif',
        "'Times New Roman', serif",
        "'Courier New', monospace",
    ];
    return in_array($value, $allowed, true) ? $value : 'sans-serif';
}

/**
 * Sanitize the `font_size` regex (e.g. "14px", "1.2rem", "100%").
 */
function flexa_tech_su_sanitize_font_size($value) {
    if (!is_string($value)) {
        return '14px';
    }
    $value = trim($value);
    return preg_match('/^\d+(\.\d+)?(px|em|rem|%)$/', $value) ? $value : '14px';
}

/**
 * Sanitize the comma-separated keyword list for the `exclude_keywords`
 * setting; caps at 500 chars to match the REST controller.
 */
function flexa_tech_su_sanitize_keywords($value) {
    return mb_substr(sanitize_text_field((string) $value), 0, 500);
}

/**
 * Register plugin settings
 */
add_action('admin_init', 'flexa_tech_su_register_settings');
function flexa_tech_su_register_settings() {
    // General settings.
    register_setting('flexa_tech_su_settings_group', 'flexa_tech_su_enable_auto_append', [
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default'           => '',
    ]);
    register_setting('flexa_tech_su_settings_group', 'flexa_tech_su_exclude_keywords', [
        'type'              => 'string',
        'sanitize_callback' => 'flexa_tech_su_sanitize_keywords',
        'default'           => 'Order, Password, Invoice',
    ]);
    register_setting('flexa_tech_su_settings_group', 'flexa_tech_su_enable_blocking', [
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default'           => '1',
    ]);

    // Appearance — colors.
    foreach ([
        'flexa_tech_su_bg_color',
        'flexa_tech_su_box_bg_color',
        'flexa_tech_su_text_color',
        'flexa_tech_su_heading_color',
        'flexa_tech_su_button_bg_color',
        'flexa_tech_su_button_text_color',
        'flexa_tech_su_button_hover_color',
    ] as $color_key) {
        register_setting('flexa_tech_su_appearance_group', $color_key, [
            'type'              => 'string',
            'sanitize_callback' => 'flexa_tech_su_sanitize_color',
        ]);
    }

    // Appearance — typography.
    register_setting('flexa_tech_su_appearance_group', 'flexa_tech_su_font_family', [
        'type'              => 'string',
        'sanitize_callback' => 'flexa_tech_su_sanitize_font_family',
    ]);
    register_setting('flexa_tech_su_appearance_group', 'flexa_tech_su_font_size', [
        'type'              => 'string',
        'sanitize_callback' => 'flexa_tech_su_sanitize_font_size',
    ]);

    // Appearance — plain-text content.
    foreach ([
        'flexa_tech_su_title_text',
        'flexa_tech_su_button_text',
        'flexa_tech_su_thank_you_title',
        'flexa_tech_su_thank_you_message',
        'flexa_tech_su_home_link_text',
        'flexa_tech_su_error_title',
        'flexa_tech_su_resubscribe_title',
        'flexa_tech_su_resubscribe_message',
    ] as $text_key) {
        register_setting('flexa_tech_su_appearance_group', $text_key, [
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
        ]);
    }

    // Appearance — HTML-allowed message fields. These render unescaped on
    // the public unsubscribe template, so we permit the `post` HTML subset
    // (no scripts) and rely on `wp_kses_post` to strip anything dangerous.
    foreach ([
        'flexa_tech_su_success_message',
        'flexa_tech_su_error_message',
    ] as $html_key) {
        register_setting('flexa_tech_su_appearance_group', $html_key, [
            'type'              => 'string',
            'sanitize_callback' => 'wp_kses_post',
        ]);
    }
}

/**
 * Get setting value with default
 */
function flexa_tech_su_get_setting($key, $default = '') {
    return get_option('flexa_tech_su_' . $key, $default);
}
