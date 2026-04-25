<?php
namespace FlexaUnsubscribe\Controllers\Support;

use WP_REST_Request;

if (!defined('ABSPATH')) exit;

/**
 * Single source of truth for the shape of a paginated / sortable list
 * REST request. Every list controller under `flexa-unsubscribe/v1` uses
 * these two helpers so pagination bounds, the `page ↔ offset` conversion,
 * and the `order` validation all live in exactly one place.
 *
 * Usage:
 *   register_rest_route(…, [
 *     'methods'  => 'GET',
 *     'args'     => TableRequestArgs::args(['email','unsubscribed_at','reason']),
 *     'callback' => [$this, 'index'],
 *   ]);
 *
 *   // inside the callback:
 *   ['limit' => $limit, 'offset' => $offset, 'page' => $page,
 *    'per_page' => $per_page, 'order_by' => $order_by, 'order' => $order]
 *     = TableRequestArgs::resolve($request);
 */
class TableRequestArgs {
    public const DEFAULT_PER_PAGE = 20;
    public const MAX_PER_PAGE     = 100;

    /**
     * @param string[] $order_by_enum Column allowlist. First entry is the default.
     * @return array<string, array<string, mixed>>
     */
    public static function args(array $order_by_enum): array {
        $default_order_by = $order_by_enum[0] ?? '';

        return [
            'page' => [
                'type'              => 'integer',
                'default'           => 1,
                'minimum'           => 1,
                'sanitize_callback' => 'absint',
            ],
            'per_page' => [
                'type'              => 'integer',
                'default'           => self::DEFAULT_PER_PAGE,
                'minimum'           => 1,
                'maximum'           => self::MAX_PER_PAGE,
                'sanitize_callback' => 'absint',
            ],
            'order_by' => [
                'type'              => 'string',
                'default'           => $default_order_by,
                'enum'              => $order_by_enum,
                'sanitize_callback' => 'sanitize_key',
            ],
            'order' => [
                'type'              => 'string',
                'default'           => 'DESC',
                'enum'              => ['ASC', 'DESC', 'asc', 'desc'],
                'sanitize_callback' => 'sanitize_key',
            ],
        ];
    }

    /**
     * @return array{limit:int, offset:int, page:int, per_page:int, order_by:string, order:string}
     */
    public static function resolve(WP_REST_Request $request): array {
        $page     = max(1, (int) $request->get_param('page'));
        $per_page = max(1, min(self::MAX_PER_PAGE, (int) $request->get_param('per_page')));
        $order_by = (string) $request->get_param('order_by');
        $order    = strtoupper((string) $request->get_param('order'));

        if ($order !== 'ASC' && $order !== 'DESC') {
            $order = 'DESC';
        }

        return [
            'limit'    => $per_page,
            'offset'   => ($page - 1) * $per_page,
            'page'     => $page,
            'per_page' => $per_page,
            'order_by' => $order_by,
            'order'    => $order,
        ];
    }

    /**
     * Standard list-response envelope used by every list endpoint under
     * `flexa-unsubscribe/v1`. Keeps shape consistent for the React
     * `parseListResponse()` helper.
     *
     * @param array $items
     */
    public static function envelope(array $items, int $total, int $page, int $per_page): array {
        return [
            'items'    => array_values($items),
            'total'    => $total,
            'page'     => $page,
            'per_page' => $per_page,
        ];
    }
}
