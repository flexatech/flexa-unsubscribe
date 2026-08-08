<?php
namespace FlexaUnsubscribe\Controllers;

use FlexaUnsubscribe\Engine\RestAPI;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) exit;

/**
 * General + appearance settings endpoints.
 *
 * Two endpoint pairs live in one controller because they share the
 * same shape (flat `get_option` / `update_option` over `flexa_tech_su_*`
 * keys) and the same auth model. Splitting by tab would spread the
 * `flexa_tech_su_` key allowlist across files with no benefit.
 *
 * Defaults here must match the defaults used at read time in
 * `includes/settings.php` and `templates/unsubscribe-page.php` -
 * the legacy `flexa_tech_su_get_setting()` path stays the source of
 * truth on the read side.
 */
class SettingsRestController {
    /** Comma-separated default for `exclude_keywords`. */
    private const EXCLUDE_KEYWORDS_DEFAULT = 'Order, Password, Invoice';

    /**
     * Read-time defaults for the auto-append email footer. Same
     * pattern + rationale as appearance_defaults() (a method, not a
     * const, because the text defaults are wrapped in __()).
     *
     * The two text source strings MUST stay byte-identical to the
     * matching __() defaults in includes/core.php so the read side
     * and this REST surface resolve the same translation.
     *
     * @return array<string,string>
     */
    private static function append_defaults(): array {
        return [
            'append_heading_text' => __('No longer want to receive these emails?', 'flexa-unsubscribe'),
            'append_button_text'  => __('Unsubscribe', 'flexa-unsubscribe'),
            'append_button_color' => '#dc3545',
        ];
    }

    private const FONT_FAMILIES = [
        'sans-serif',
        'Arial, sans-serif',
        'Helvetica, sans-serif',
        'Georgia, serif',
        "'Times New Roman', serif",
        "'Courier New', monospace",
    ];

    /**
     * Appearance fields whose value renders as HTML on the public
     * page (so wp_kses_post is applied on save). The templates output
     * these through `wp_kses_post()` (templates/unsubscribe-page.php:102,139;
     * templates/resubscribe-page.php:75), so the same `post` HTML subset
     * is enforced on both save and render. Everything else is escaped
     * with esc_html at output, so those render as plain text even if the
     * admin types HTML - no point letting HTML through save.
     */
    private const APPEARANCE_HTML_FIELDS = [
        'success_message',
        'error_message',
    ];

    /**
     * Appearance field allowlist + defaults. Map is `key => default`.
     * Keeping this as a single map means adding a new appearance option
     * is one entry here + one entry in the Zod schema on the client.
     *
     * A method (not a `const`) because the text-content defaults are
     * wrapped in __() for localization, and PHP constants can't hold
     * function calls. The text-content source strings MUST stay
     * byte-identical to the matching __() defaults in
     * templates/unsubscribe-page.php + templates/resubscribe-page.php
     * so the read side and this REST surface resolve the same
     * translation.
     *
     * @return array<string,string>
     */
    private static function appearance_defaults(): array {
        return [
            // Colors
            'bg_color'            => '#f0f2f5',
            'box_bg_color'        => '#ffffff',
            'text_color'          => '#333333',
            'heading_color'       => '#495057',
            'button_bg_color'     => '#00aad0',
            'button_text_color'   => '#ffffff',
            'button_hover_color'  => '#0099bb',
            // Typography
            'font_family'         => 'sans-serif',
            'font_size'           => '14px',
            // Text content
            'title_text'          => __('Unsubscribed', 'flexa-unsubscribe'),
            /* translators: {email} is a literal placeholder, replaced with the recipient's address. Keep it as-is. */
            'success_message'     => __('Email {email} is removed.', 'flexa-unsubscribe'),
            'button_text'         => __('Submit Feedback', 'flexa-unsubscribe'),
            'thank_you_title'     => __('Thank you for your feedback!', 'flexa-unsubscribe'),
            'thank_you_message'   => __('We greatly appreciate your input and will use this information to improve our content in the future.', 'flexa-unsubscribe'),
            'home_link_text'      => __('Back to Home Page', 'flexa-unsubscribe'),
            'error_title'         => __("We're Sorry, This Link Is No Longer Valid", 'flexa-unsubscribe'),
            /* translators: <br> is an HTML line break; keep it in the translation. */
            'error_message'       => __('The unsubscribe link you used appears to be invalid or has expired.<br>If you believe this is a mistake, please try again or contact our support team for assistance.', 'flexa-unsubscribe'),
            'resubscribe_title'   => __('Successfully Re-subscribed!', 'flexa-unsubscribe'),
            'resubscribe_message' => __('You have been successfully re-subscribed. You will start receiving emails again.', 'flexa-unsubscribe'),
        ];
    }

    public function register_routes() {
        $ns = RestAPI::NAMESPACE;
        $permission = [$this, 'permission_check'];

        register_rest_route($ns, '/settings/general', [
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'get_general'],
                'permission_callback' => $permission,
            ],
            [
                'methods'             => 'PUT',
                'callback'            => [$this, 'update_general'],
                'permission_callback' => $permission,
            ],
        ]);

        register_rest_route($ns, '/settings/appearance', [
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'get_appearance'],
                'permission_callback' => $permission,
            ],
            [
                'methods'             => 'PUT',
                'callback'            => [$this, 'update_appearance'],
                'permission_callback' => $permission,
            ],
        ]);
    }

    public function permission_check(): bool {
        return current_user_can('manage_options');
    }

    // ─── General ───────────────────────────────────────────────────

    public function get_general(): WP_REST_Response {
        $append = self::append_defaults();
        return new WP_REST_Response([
            'enable_auto_append'  => flexa_tech_su_get_setting('enable_auto_append', '') === '1',
            'exclude_keywords'    => (string) flexa_tech_su_get_setting('exclude_keywords', self::EXCLUDE_KEYWORDS_DEFAULT),
            'enable_blocking'     => flexa_tech_su_get_setting('enable_blocking', '1') === '1',
            'append_heading_text' => (string) flexa_tech_su_get_setting('append_heading_text', $append['append_heading_text']),
            'append_button_text'  => (string) flexa_tech_su_get_setting('append_button_text', $append['append_button_text']),
            'append_button_color' => (string) flexa_tech_su_get_setting('append_button_color', $append['append_button_color']),
        ]);
    }

    public function update_general(WP_REST_Request $request): WP_REST_Response {
        $body = $this->body($request);

        if (array_key_exists('enable_auto_append', $body)) {
            update_option('flexa_tech_su_enable_auto_append', $this->bool_to_checkbox($body['enable_auto_append']));
        }
        if (array_key_exists('exclude_keywords', $body)) {
            $value = sanitize_text_field((string) $body['exclude_keywords']);
            // Cap at 500 chars - aligns with the Zod schema cap client-side.
            update_option('flexa_tech_su_exclude_keywords', mb_substr($value, 0, 500));
        }
        if (array_key_exists('enable_blocking', $body)) {
            update_option('flexa_tech_su_enable_blocking', $this->bool_to_checkbox($body['enable_blocking']));
        }
        if (array_key_exists('append_heading_text', $body)) {
            $value = sanitize_text_field((string) $body['append_heading_text']);
            update_option('flexa_tech_su_append_heading_text', mb_substr($value, 0, 200));
        }
        if (array_key_exists('append_button_text', $body)) {
            $value = sanitize_text_field((string) $body['append_button_text']);
            update_option('flexa_tech_su_append_button_text', mb_substr($value, 0, 100));
        }
        if (array_key_exists('append_button_color', $body)) {
            update_option('flexa_tech_su_append_button_color', $this->normalize_hex((string) $body['append_button_color']));
        }

        return $this->get_general();
    }

    // ─── Appearance ────────────────────────────────────────────────

    public function get_appearance(): WP_REST_Response {
        $out = [];
        foreach (self::appearance_defaults() as $key => $default) {
            $out[$key] = (string) flexa_tech_su_get_setting($key, $default);
        }
        return new WP_REST_Response($out);
    }

    public function update_appearance(WP_REST_Request $request): WP_REST_Response {
        $body = $this->body($request);

        foreach (self::appearance_defaults() as $key => $_default) {
            if (!array_key_exists($key, $body)) {
                continue;
            }
            $value = $body[$key];
            $sanitized = $this->sanitize_appearance_field($key, $value);
            update_option('flexa_tech_su_' . $key, $sanitized);
        }

        return $this->get_appearance();
    }

    private function sanitize_appearance_field(string $key, $value): string {
        if (!is_string($value)) {
            $value = '';
        }

        if (in_array($key, self::APPEARANCE_HTML_FIELDS, true)) {
            // Safe HTML subset (<br>, <strong>, <em>, <a>, …). wp_kses_post
            // strips inline <script> etc. per WP's `post` context rules.
            return wp_kses_post($value);
        }

        // Colors → lowercase 6-char hex, pad 3-char shorthand.
        // `substr ... === '_color'` instead of `str_ends_with` to keep
        // the plugin running on PHP 7.4 (`Requires PHP` header).
        if (substr($key, -6) === '_color' || $key === 'bg_color') {
            return $this->normalize_hex($value);
        }

        if ($key === 'font_family') {
            return in_array($value, self::FONT_FAMILIES, true)
                ? $value
                : 'sans-serif';
        }

        if ($key === 'font_size') {
            $value = trim($value);
            return preg_match('/^\d+(\.\d+)?(px|em|rem|%)$/', $value) ? $value : '14px';
        }

        // Plain text content - single-line inputs + success_message.
        return sanitize_text_field($value);
    }

    private function normalize_hex(string $value): string {
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

    // ─── Shared helpers ────────────────────────────────────────────

    private function body(WP_REST_Request $request): array {
        $body = $request->get_json_params();
        return is_array($body) ? $body : [];
    }

    /**
     * Booleans → the `'1'` / `''` string shape legacy comparisons
     * (`flexa_tech_su_get_setting('enable_blocking') !== '1'`) rely on.
     */
    private function bool_to_checkbox($value): string {
        return ($value === true || $value === '1' || $value === 1) ? '1' : '';
    }
}
