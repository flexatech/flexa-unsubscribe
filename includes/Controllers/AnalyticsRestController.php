<?php
namespace FlexaUnsubscribe\Controllers;

use FlexaUnsubscribe\Engine\RestAPI;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) exit;

/**
 * Read-only analytics endpoints that wrap the procedural
 * `flexa_tech_su_get_stats()` / `flexa_tech_su_get_unsubscribes_by_date()` /
 * `flexa_tech_su_get_unsubscribes_by_reason()` helpers.
 *
 * All routes require the `manage_options` capability. The Dashboard
 * React page is the only consumer.
 */
class AnalyticsRestController {
    public function register_routes() {
        $ns = RestAPI::NAMESPACE;
        $permission = [$this, 'permission_check'];

        register_rest_route($ns, '/analytics/summary', [
            'methods'             => 'GET',
            'callback'            => [$this, 'summary'],
            'permission_callback' => $permission,
        ]);

        register_rest_route($ns, '/analytics/by-date', [
            'methods'             => 'GET',
            'callback'            => [$this, 'by_date'],
            'permission_callback' => $permission,
            'args'                => [
                'period' => [
                    'type'              => 'string',
                    'enum'              => ['7days', '30days', '12months', 'all'],
                    'default'           => '30days',
                    'sanitize_callback' => 'sanitize_key',
                ],
            ],
        ]);

        register_rest_route($ns, '/analytics/by-reason', [
            'methods'             => 'GET',
            'callback'            => [$this, 'by_reason'],
            'permission_callback' => $permission,
            'args'                => [
                'limit' => [
                    'type'              => 'integer',
                    'default'           => 10,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);
    }

    public function permission_check(): bool {
        return current_user_can('manage_options');
    }

    public function summary(): WP_REST_Response {
        return new WP_REST_Response([
            'unsubscribes' => flexa_tech_su_get_stats(),
            'resubscribes' => flexa_tech_su_get_resubscribe_stats(),
            'blocked_count' => flexa_tech_su_get_blocked_emails_count(),
        ]);
    }

    public function by_date(WP_REST_Request $request): WP_REST_Response {
        $period = $request->get_param('period');
        return new WP_REST_Response(flexa_tech_su_get_unsubscribes_by_date($period));
    }

    public function by_reason(WP_REST_Request $request): WP_REST_Response {
        $limit = (int) $request->get_param('limit');
        return new WP_REST_Response(flexa_tech_su_get_unsubscribes_by_reason($limit));
    }
}
