<?php
namespace FlexaUnsubscribe\Controllers;

use FlexaUnsubscribe\Engine\RestAPI;
use FlexaUnsubscribe\Controllers\Support\TableRequestArgs;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) exit;

/**
 * Blocked-email audit log - list, delete, clear-all.
 *
 * Wraps the procedural `flexa_tech_su_get_blocked_emails()` /
 * `flexa_tech_su_get_blocked_emails_count()` / `flexa_tech_su_delete_blocked_email()` /
 * `flexa_tech_su_clear_blocked_emails()` helpers.
 */
class BlockedRestController {
    private const ORDER_BY_ENUM = ['blocked_at', 'email', 'subject', 'from_email'];

    public function register_routes() {
        $ns = RestAPI::NAMESPACE;

        register_rest_route($ns, '/blocked', [
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'index'],
                'permission_callback' => [$this, 'permission_check'],
                'args'                => TableRequestArgs::args(self::ORDER_BY_ENUM),
            ],
        ]);

        register_rest_route($ns, '/blocked/(?P<id>\d+)', [
            [
                'methods'             => 'DELETE',
                'callback'            => [$this, 'destroy'],
                'permission_callback' => [$this, 'permission_check'],
                'args'                => [
                    'id' => [
                        'type'              => 'integer',
                        'required'          => true,
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
        ]);

        register_rest_route($ns, '/blocked/clear', [
            [
                'methods'             => 'POST',
                'callback'            => [$this, 'clear'],
                'permission_callback' => [$this, 'permission_check'],
            ],
        ]);
    }

    public function permission_check(): bool {
        return current_user_can('manage_options');
    }

    public function index(WP_REST_Request $request): WP_REST_Response {
        $args = TableRequestArgs::resolve($request);

        $rows = flexa_tech_su_get_blocked_emails(
            $args['order_by'],
            $args['order'],
            $args['limit'],
            $args['offset']
        );
        $total = flexa_tech_su_get_blocked_emails_count();

        $items = array_map(static function ($row) {
            return [
                'id'         => (int) $row->id,
                'email'      => (string) $row->email,
                'subject'    => (string) ($row->subject ?? ''),
                'from_email' => (string) ($row->from_email ?? ''),
                'from_name'  => (string) ($row->from_name ?? ''),
                'blocked_at' => (string) $row->blocked_at,
            ];
        }, $rows ?: []);

        return new WP_REST_Response(
            TableRequestArgs::envelope($items, $total, $args['page'], $args['per_page'])
        );
    }

    public function destroy(WP_REST_Request $request) {
        $id = (int) $request->get_param('id');
        $deleted = flexa_tech_su_delete_blocked_email($id);

        if ($deleted === false) {
            return new WP_Error(
                'flexa_delete_failed',
                __('Failed to delete blocked email record.', 'flexa-unsubscribe'),
                ['status' => 500]
            );
        }
        if ($deleted === 0) {
            return new WP_Error(
                'flexa_not_found',
                __('Blocked email record not found.', 'flexa-unsubscribe'),
                ['status' => 404]
            );
        }

        return new WP_REST_Response(['deleted' => true, 'id' => $id]);
    }

    public function clear(): WP_REST_Response {
        flexa_tech_su_clear_blocked_emails();
        return new WP_REST_Response(['cleared' => true]);
    }
}
