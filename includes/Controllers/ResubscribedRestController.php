<?php
namespace FlexaUnsubscribe\Controllers;

use FlexaUnsubscribe\Engine\RestAPI;
use FlexaUnsubscribe\Controllers\Support\TableRequestArgs;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) exit;

/**
 * Re-subscribed audit list — read only.
 *
 * Wraps `flexa_tech_su_get_resubscribed_emails()` and
 * `flexa_tech_su_get_resubscribed_count()`. The legacy admin has no
 * delete / clear action here, so neither does this controller —
 * resubscription is reached through the HMAC frontend link, not
 * admin mutation.
 */
class ResubscribedRestController {
    private const ORDER_BY_ENUM = ['resubscribed_at', 'email', 'unsubscribed_at'];

    public function register_routes() {
        $ns = RestAPI::NAMESPACE;

        register_rest_route($ns, '/resubscribed', [
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'index'],
                'permission_callback' => [$this, 'permission_check'],
                'args'                => TableRequestArgs::args(self::ORDER_BY_ENUM),
            ],
        ]);
    }

    public function permission_check(): bool {
        return current_user_can('manage_options');
    }

    public function index(WP_REST_Request $request): WP_REST_Response {
        $args = TableRequestArgs::resolve($request);

        $rows = flexa_tech_su_get_resubscribed_emails(
            $args['order_by'],
            $args['order'],
            $args['limit'],
            $args['offset']
        );
        $total = flexa_tech_su_get_resubscribed_count();

        $items = array_map(static function ($row) {
            return [
                'id'              => (int) $row->id,
                'email'           => (string) $row->email,
                'reason'          => (string) ($row->reason ?? ''),
                'unsubscribed_at' => (string) $row->unsubscribed_at,
                'resubscribed_at' => (string) ($row->resubscribed_at ?? ''),
            ];
        }, $rows ?: []);

        return new WP_REST_Response(
            TableRequestArgs::envelope($items, $total, $args['page'], $args['per_page'])
        );
    }
}
