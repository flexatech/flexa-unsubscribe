<?php
namespace FlexaUnsubscribe\Controllers;

use FlexaUnsubscribe\Engine\RestAPI;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) exit;

/**
 * Unsubscribe reasons — list + CRUD + bulk reorder.
 *
 * Wraps `flexa_tech_su_get_reasons()`, `flexa_tech_su_get_reason()`,
 * `flexa_tech_su_save_reason()`, `flexa_tech_su_delete_reason()` and
 * `flexa_tech_su_update_reason_order()` in `includes/database.php`.
 * Data access stays procedural; this controller is the REST contract.
 *
 * All routes require `manage_options`. The list is small and never
 * paginated; no TableRequestArgs here.
 */
class ReasonsRestController {
    public function register_routes() {
        $ns = RestAPI::NAMESPACE;
        $permission = [$this, 'permission_check'];

        register_rest_route($ns, '/reasons', [
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'index'],
                'permission_callback' => $permission,
            ],
            [
                'methods'             => 'POST',
                'callback'            => [$this, 'create'],
                'permission_callback' => $permission,
                'args'                => $this->mutation_args(false),
            ],
        ]);

        register_rest_route($ns, '/reasons/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [$this, 'update'],
                'permission_callback' => $permission,
                'args'                => $this->mutation_args(true),
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [$this, 'destroy'],
                'permission_callback' => $permission,
                'args'                => [
                    'id' => [
                        'type'              => 'integer',
                        'required'          => true,
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
        ]);

        register_rest_route($ns, '/reasons/reorder', [
            [
                'methods'             => 'POST',
                'callback'            => [$this, 'reorder'],
                'permission_callback' => $permission,
                'args'                => [
                    'order' => [
                        'type'     => 'array',
                        'required' => true,
                        'items'    => ['type' => 'integer'],
                    ],
                ],
            ],
        ]);
    }

    public function permission_check(): bool {
        return current_user_can('manage_options');
    }

    private function mutation_args(bool $with_id): array {
        $args = [
            'reason_text' => [
                'type'              => 'string',
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function ($value) {
                    return is_string($value) && trim($value) !== '' && strlen($value) <= 255;
                },
            ],
            'sort_order' => [
                'type'              => 'integer',
                'default'           => 0,
                // `absint` rather than `intval` because WP's REST framework
                // passes 3 args (`$value, $request, $param`) to sanitize
                // callbacks. `intval` is a builtin with a strict 2-arg
                // signature — PHP 8+ throws ArgumentCountError. WP's
                // user-defined helpers (`absint`, `sanitize_*`) silently
                // accept extras.
                'sanitize_callback' => 'absint',
            ],
        ];
        if ($with_id) {
            $args['id'] = [
                'type'              => 'integer',
                'required'          => true,
                'sanitize_callback' => 'absint',
            ];
        }
        return $args;
    }

    private function present($row): array {
        return [
            'id'          => (int) $row->id,
            'reason_text' => (string) $row->reason_text,
            'sort_order'  => (int) $row->sort_order,
            'created_at'  => (string) ($row->created_at ?? ''),
        ];
    }

    public function index(): WP_REST_Response {
        $rows = flexa_tech_su_get_reasons('sort_order', 'ASC');
        $items = array_map([$this, 'present'], $rows ?: []);
        return new WP_REST_Response(['items' => array_values($items)]);
    }

    public function create(WP_REST_Request $request) {
        $text = (string) $request->get_param('reason_text');
        $order = (int) $request->get_param('sort_order');

        $result = flexa_tech_su_save_reason($text, $order);
        if ($result === false) {
            return new WP_Error('flexa_save_failed', __('Failed to create reason.', 'flexa-unsubscribe'), ['status' => 500]);
        }

        global $wpdb;
        $id = (int) $wpdb->insert_id;
        $row = flexa_tech_su_get_reason($id);
        return new WP_REST_Response($this->present($row), 201);
    }

    public function update(WP_REST_Request $request) {
        $id = (int) $request->get_param('id');
        $text = (string) $request->get_param('reason_text');
        $order = (int) $request->get_param('sort_order');

        $existing = flexa_tech_su_get_reason($id);
        if (!$existing) {
            return new WP_Error('flexa_not_found', __('Reason not found.', 'flexa-unsubscribe'), ['status' => 404]);
        }

        flexa_tech_su_save_reason($text, $order, $id);
        $row = flexa_tech_su_get_reason($id);
        return new WP_REST_Response($this->present($row));
    }

    public function destroy(WP_REST_Request $request) {
        $id = (int) $request->get_param('id');
        $deleted = flexa_tech_su_delete_reason($id);

        if ($deleted === false) {
            return new WP_Error('flexa_delete_failed', __('Failed to delete reason.', 'flexa-unsubscribe'), ['status' => 500]);
        }
        if ($deleted === 0) {
            return new WP_Error('flexa_not_found', __('Reason not found.', 'flexa-unsubscribe'), ['status' => 404]);
        }
        return new WP_REST_Response(['deleted' => true, 'id' => $id]);
    }

    public function reorder(WP_REST_Request $request): WP_REST_Response {
        $ids = (array) $request->get_param('order');
        $position = 1;
        foreach ($ids as $raw) {
            $id = (int) $raw;
            if ($id > 0) {
                flexa_tech_su_update_reason_order($id, $position);
                $position++;
            }
        }

        $rows = flexa_tech_su_get_reasons('sort_order', 'ASC');
        $items = array_map([$this, 'present'], $rows ?: []);
        return new WP_REST_Response(['items' => array_values($items)]);
    }
}
