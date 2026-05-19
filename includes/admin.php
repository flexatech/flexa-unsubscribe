<?php
/**
 * Admin-post CSV export handlers.
 *
 * The seven PHP-rendered admin pages (Dashboard/Analytics, Unsubscribes,
 * Blocked Emails, Re-subscribed, Reasons, Settings, Appearance) and the
 * `flexa-su` menu itself were removed in the Phase 4 cutover once the
 * React admin under `flexa-unsubscribe` reached feature parity (see
 * PHASE-4-PLAN.md). What remains here is the CSV streaming surface:
 * the React "Export CSV" buttons link to these `admin-post.php`
 * endpoints via `buildExportUrl()` - wrapping CSV streaming in REST
 * would require custom `serve_request` bypass for zero gain, so these
 * stay on `admin-post.php` indefinitely.
 *
 * Each handler:
 *  - requires `manage_options`
 *  - verifies its own nonce via `check_admin_referer()` (added in P2-12)
 *  - streams UTF-8 CSV with a BOM for Excel compatibility
 */

if (!defined('ABSPATH')) exit;

/**
 * Unsubscribe records → CSV.
 */
add_action('admin_post_flexa_export_csv', 'flexa_handle_export_csv');
function flexa_handle_export_csv() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('Unauthorized', 'flexa-unsubscribe'));
    }
    check_admin_referer('flexa_export_csv');

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=unsubscribes-' . gmdate('Y-m-d') . '.csv');
    header('Pragma: no-cache');
    header('Expires: 0');

    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM

    fputcsv($output, [
        __('Email', 'flexa-unsubscribe'),
        __('Reason', 'flexa-unsubscribe'),
        __('Date', 'flexa-unsubscribe'),
    ]);
    foreach (flexa_tech_su_stream_export_unsubscribes() as $row) {
        fputcsv($output, $row);
    }

    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- streaming CSV to php://output, WP_Filesystem doesn't apply.
    fclose($output);
    exit;
}

/**
 * Blocked-email audit log → CSV.
 */
add_action('admin_post_flexa_export_blocked_csv', 'flexa_handle_export_blocked_csv');
function flexa_handle_export_blocked_csv() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('Unauthorized', 'flexa-unsubscribe'));
    }
    check_admin_referer('flexa_export_blocked_csv');

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=blocked-emails-' . gmdate('Y-m-d') . '.csv');
    header('Pragma: no-cache');
    header('Expires: 0');

    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    fputcsv($output, [
        __('Email', 'flexa-unsubscribe'),
        __('Subject', 'flexa-unsubscribe'),
        __('From Email', 'flexa-unsubscribe'),
        __('From Name', 'flexa-unsubscribe'),
        __('Blocked At', 'flexa-unsubscribe'),
    ]);
    foreach (flexa_tech_su_stream_export_blocked() as $row) {
        fputcsv($output, $row);
    }

    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- streaming CSV to php://output, WP_Filesystem doesn't apply.
    fclose($output);
    exit;
}

/**
 * Re-subscribed emails → CSV.
 */
add_action('admin_post_flexa_export_resubscribed_csv', 'flexa_handle_export_resubscribed_csv');
function flexa_handle_export_resubscribed_csv() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('Unauthorized', 'flexa-unsubscribe'));
    }
    check_admin_referer('flexa_export_resubscribed_csv');

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=resubscribed-emails-' . gmdate('Y-m-d') . '.csv');
    header('Pragma: no-cache');
    header('Expires: 0');

    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    fputcsv($output, [
        __('Email', 'flexa-unsubscribe'),
        __('Unsubscribed At', 'flexa-unsubscribe'),
        __('Re-subscribed At', 'flexa-unsubscribe'),
        __('Reason', 'flexa-unsubscribe'),
    ]);
    foreach (flexa_tech_su_stream_export_resubscribed() as $row) {
        fputcsv($output, [
            $row->email,
            $row->unsubscribed_at,
            $row->resubscribed_at,
            $row->reason ?: __('N/A', 'flexa-unsubscribe'),
        ]);
    }

    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- streaming CSV to php://output, WP_Filesystem doesn't apply.
    fclose($output);
    exit;
}
