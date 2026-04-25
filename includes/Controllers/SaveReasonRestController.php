<?php
namespace FlexaUnsubscribe\Controllers;

use FlexaUnsubscribe\Engine\RestAPI;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) exit;

/**
 * Public endpoint that records the visitor-supplied "why did you
 * unsubscribe" reason posted by the form on
 * `templates/unsubscribe-page.php`.
 *
 * Authentication is HMAC-over-email (same scheme the unsubscribe
 * link itself uses) — visitors are logged out, so cookie nonces
 * aren't applicable. The permission callback verifies the token
 * against `AUTH_KEY` before the route handler runs; an invalid
 * token returns 403 with no DB write.
 *
 * Distinct path from the admin-side `/reasons` (plural) CRUD:
 * `/reason` (singular) is the public submit endpoint and never
 * grants `manage_options`.
 */
class SaveReasonRestController {
    public function register_routes() {
        $ns = RestAPI::NAMESPACE;

        register_rest_route($ns, '/reason', [
            'methods'             => 'POST',
            'callback'            => [$this, 'save'],
            'permission_callback' => [$this, 'verify_hmac'],
            'args'                => [
                'email' => [
                    'type'              => 'string',
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_email',
                ],
                'token' => [
                    'type'              => 'string',
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'reason' => [
                    'type'              => 'string',
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
    }

    /**
     * @return true|WP_Error
     */
    public function verify_hmac(WP_REST_Request $request) {
        $email = (string) $request->get_param('email');
        $token = (string) $request->get_param('token');

        if ($email === '' || $token === '') {
            return new WP_Error(
                'flexa_invalid_token',
                __('Missing or invalid token.', 'flexa-unsubscribe'),
                ['status' => 403]
            );
        }

        $expected = hash_hmac('sha256', $email, AUTH_KEY);
        if (!hash_equals($expected, $token)) {
            return new WP_Error(
                'flexa_invalid_token',
                __('Missing or invalid token.', 'flexa-unsubscribe'),
                ['status' => 403]
            );
        }

        return true;
    }

    public function save(WP_REST_Request $request): WP_REST_Response {
        $email  = (string) $request->get_param('email');
        $reason = (string) $request->get_param('reason');

        flexa_tech_su_update_reason($email, $reason);

        return new WP_REST_Response(['saved' => true]);
    }
}
