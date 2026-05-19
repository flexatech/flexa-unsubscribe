<?php
namespace FlexaUnsubscribe\Controllers;

use FlexaUnsubscribe\Engine\RestAPI;
use FlexaUnsubscribe\Controllers\Support\TableRequestArgs;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) exit;

/**
 * Unsubscribe records - list + delete.
 *
 * Wraps the procedural `flexa_tech_su_get_unsubscribes()`,
 * `flexa_tech_su_get_unsubscribes_count()` and `flexa_tech_su_delete_unsubscribe()`
 * helpers in `includes/database.php`. Data access stays procedural;
 * this controller is just the REST contract.
 *
 * All routes require `manage_options`.
 */
class UnsubscribesRestController {
    private const ORDER_BY_ENUM = ['unsubscribed_at', 'email', 'reason'];

    public function register_routes() {
        $ns = RestAPI::NAMESPACE;

        register_rest_route($ns, '/unsubscribes', [
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'index'],
                'permission_callback' => [$this, 'permission_check'],
                'args'                => TableRequestArgs::args(self::ORDER_BY_ENUM),
            ],
        ]);

        register_rest_route($ns, '/unsubscribes/(?P<id>\d+)', [
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
    }

    public function permission_check(): bool {
        return current_user_can('manage_options');
    }

    public function index(WP_REST_Request $request): WP_REST_Response {
        $args = TableRequestArgs::resolve($request);

        $rows = flexa_tech_su_get_unsubscribes(
            $args['order_by'],
            $args['order'],
            $args['limit'],
            $args['offset']
        );
        $total = flexa_tech_su_get_unsubscribes_count();

        $items = array_map(static function ($row) {
            return [
                'id'              => (int) $row->id,
                'email'           => (string) $row->email,
                'reason'          => (string) ($row->reason ?? ''),
                'unsubscribed_at' => (string) $row->unsubscribed_at,
                'resubscribed_at' => $row->resubscribed_at ?: null,
            ];
        }, $rows ?: []);

        return new WP_REST_Response(
            TableRequestArgs::envelope($items, $total, $args['page'], $args['per_page'])
        );
    }

    public function destroy(WP_REST_Request $request) {
        $id = (int) $request->get_param('id');
        $deleted = flexa_tech_su_delete_unsubscribe($id);

        if ($deleted === false) {
            return new WP_Error(
                'flexa_delete_failed',
                __('Failed to delete unsubscribe record.', 'flexa-unsubscribe'),
                ['status' => 500]
            );
        }
        if ($deleted === 0) {
            return new WP_Error(
                'flexa_not_found',
                __('Unsubscribe record not found.', 'flexa-unsubscribe'),
                ['status' => 404]
            );
        }

        return new WP_REST_Response(['deleted' => true, 'id' => $id]);
    }
}
