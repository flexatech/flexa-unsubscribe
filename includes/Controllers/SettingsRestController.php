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
 * `includes/settings.php` and `templates/unsubscribe-page.php` —
 * the legacy `flexa_tech_su_get_setting()` path stays the source of
 * truth on the read side.
 */
class SettingsRestController {
    /** Comma-separated default for `exclude_keywords`. */
    private const EXCLUDE_KEYWORDS_DEFAULT = 'Order, Password, Invoice';

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
     * page (so wp_kses_post is applied on save). The legacy templates
     * echo these unescaped; everything else is escaped at output.
     *
     *   templates/unsubscribe-page.php lines 76, 121 — success_message
     *   + error_message are echoed with `<?php echo $var; ?>` (no
     *   esc_html). thank_you_message and resubscribe_message are
     *   esc_html'd on output, so they render as plain text even if
     *   the admin types HTML — no point letting HTML through save.
     */
    private const APPEARANCE_HTML_FIELDS = [
        'success_message',
        'error_message',
    ];

    /**
     * Appearance field allowlist + defaults. Map is `key => default`.
     * Keeping this as a single map means adding a new appearance option
     * is one entry here + one entry in the Zod schema on the client.
     */
    private const APPEARANCE_DEFAULTS = [
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
        'title_text'          => 'Unsubscribed',
        'success_message'     => 'Email {email} is removed.',
        'button_text'         => 'Submit Feedback',
        'thank_you_title'     => 'Thank you for your feedback!',
        'thank_you_message'   => 'We greatly appreciate your input and will use this information to improve our content in the future.',
        'home_link_text'      => 'Back to Home Page',
        'error_title'         => "We're Sorry, This Link Is No Longer Valid",
        'error_message'       => 'The unsubscribe link you used appears to be invalid or has expired.<br>If you believe this is a mistake, please try again or contact our support team for assistance.',
        'resubscribe_title'   => 'Successfully Re-subscribed!',
        'resubscribe_message' => 'You have been successfully re-subscribed. You will start receiving emails again.',
    ];

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
        return new WP_REST_Response([
            'enable_auto_append' => flexa_tech_su_get_setting('enable_auto_append', '') === '1',
            'exclude_keywords'   => (string) flexa_tech_su_get_setting('exclude_keywords', self::EXCLUDE_KEYWORDS_DEFAULT),
            'enable_blocking'    => flexa_tech_su_get_setting('enable_blocking', '1') === '1',
        ]);
    }

    public function update_general(WP_REST_Request $request): WP_REST_Response {
        $body = $this->body($request);

        if (array_key_exists('enable_auto_append', $body)) {
            update_option('flexa_tech_su_enable_auto_append', $this->bool_to_checkbox($body['enable_auto_append']));
        }
        if (array_key_exists('exclude_keywords', $body)) {
            $value = sanitize_text_field((string) $body['exclude_keywords']);
            // Cap at 500 chars — aligns with the Zod schema cap client-side.
            update_option('flexa_tech_su_exclude_keywords', mb_substr($value, 0, 500));
        }
        if (array_key_exists('enable_blocking', $body)) {
            update_option('flexa_tech_su_enable_blocking', $this->bool_to_checkbox($body['enable_blocking']));
        }

        return $this->get_general();
    }

    // ─── Appearance ────────────────────────────────────────────────

    public function get_appearance(): WP_REST_Response {
        $out = [];
        foreach (self::APPEARANCE_DEFAULTS as $key => $default) {
            $out[$key] = (string) flexa_tech_su_get_setting($key, $default);
        }
        return new WP_REST_Response($out);
    }

    public function update_appearance(WP_REST_Request $request): WP_REST_Response {
        $body = $this->body($request);

        foreach (self::APPEARANCE_DEFAULTS as $key => $_default) {
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

        // Plain text content — single-line inputs + success_message.
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
