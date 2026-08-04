<?php
namespace FlexaUnsubscribe\Controllers;

use FlexaUnsubscribe\Engine\RestAPI;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) exit;

/**
 * CSV import for the unsubscribes list.
 *
 * Accepts a multipart upload (field name `file`) and parses it row by
 * row with `fgetcsv` - streaming, so even a 10k-row file never
 * materializes in memory beyond a single line.
 *
 * Schema mirrors the existing CSV export written by
 * `flexa_handle_export_csv()` in includes/admin.php:
 *
 *   Email, Reason, Date
 *
 * Header detection is automatic and case-insensitive: if the first
 * non-empty row's first cell looks like an email, the file is treated
 * as headerless; otherwise the first row is used to map columns. Only
 * `Email` is required - Reason and Date are optional and default to
 * empty / `current_time('mysql')`.
 *
 * Dedup is delegated to `flexa_tech_su_import_unsubscribe()`, which
 * uses INSERT IGNORE on the `email` UNIQUE KEY. Rows already in the
 * table are skipped (counted as `skipped_duplicate`) without touching
 * their stored `reason` or `unsubscribed_at`.
 *
 * Limits (defense-in-depth against accidental DoS / runaway parse):
 *  - MAX_BYTES = 2 MiB  - rejected at the upload layer.
 *  - MAX_ROWS  = 10000  - rejected after MAX_ROWS+1 successful reads.
 *  - MAX_ERRORS = 100   - `failed` list is truncated; the count keeps
 *                          climbing so the UI can still report totals.
 *
 * All routes require `manage_options`.
 */
class ImportUnsubscribesRestController {
    private const MAX_BYTES  = 2 * 1024 * 1024;
    private const MAX_ROWS   = 10000;
    private const MAX_ERRORS = 100;

    public function register_routes(): void {
        $ns = RestAPI::NAMESPACE;

        register_rest_route($ns, '/unsubscribes/import', [
            [
                'methods'             => 'POST',
                'callback'            => [$this, 'handle'],
                'permission_callback' => [$this, 'permission_check'],
            ],
        ]);
    }

    public function permission_check(): bool {
        return current_user_can('manage_options');
    }

    public function handle(WP_REST_Request $request) {
        // WP_REST_Request normalizes uploaded files into $_FILES-shaped
        // arrays via get_file_params(); same key as the multipart field.
        $files = $request->get_file_params();
        $file  = $files['file'] ?? null;

        if (!is_array($file) || empty($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return new WP_Error(
                'flexa_import_no_file',
                __('No CSV file was uploaded.', 'flexa-unsubscribe'),
                ['status' => 400]
            );
        }

        if (!empty($file['error']) && (int) $file['error'] !== UPLOAD_ERR_OK) {
            return new WP_Error(
                'flexa_import_upload_error',
                __('The upload failed. Please try again.', 'flexa-unsubscribe'),
                ['status' => 400]
            );
        }

        if (!empty($file['size']) && (int) $file['size'] > self::MAX_BYTES) {
            return new WP_Error(
                'flexa_import_too_large',
                sprintf(
                    /* translators: %s: human-readable max file size, e.g. "2 MB" */
                    __('The CSV file is too large. Maximum size is %s.', 'flexa-unsubscribe'),
                    size_format(self::MAX_BYTES)
                ),
                ['status' => 413]
            );
        }

        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen -- streaming user upload row-by-row; WP_Filesystem has no fgetcsv equivalent.
        $handle = fopen($file['tmp_name'], 'r');
        if ($handle === false) {
            return new WP_Error(
                'flexa_import_open_failed',
                __('Could not read the uploaded CSV file.', 'flexa-unsubscribe'),
                ['status' => 500]
            );
        }

        // Strip a UTF-8 BOM if present - exports we ship include one, and
        // Excel always writes one. fgetcsv would otherwise leak it into
        // the first cell of the first row.
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fread -- streaming user upload row-by-row; WP_Filesystem has no fgetcsv equivalent.
        $first_three = fread($handle, 3);
        if ($first_three !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        $imported            = 0;
        $skipped_duplicate   = 0;
        $failed              = [];
        $failed_count        = 0;
        $row_number          = 0;
        $column_map          = null;  // resolved on the first non-empty row
        $now                 = current_time('mysql');

        while (($row = fgetcsv($handle)) !== false) {
            // fgetcsv returns [null] for completely blank lines.
            if ($row === [null] || $row === false) {
                continue;
            }

            $row_number++;

            // First non-empty row determines header vs headerless.
            if ($column_map === null) {
                $column_map = $this->resolve_column_map($row);
                if ($column_map['has_header']) {
                    // Header row consumed; do not import it.
                    continue;
                }
            }

            if ($row_number > self::MAX_ROWS + ($column_map['has_header'] ? 1 : 0)) {
                // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- streaming user upload row-by-row; WP_Filesystem has no fgetcsv equivalent.
                fclose($handle);
                return new WP_Error(
                    'flexa_import_too_many_rows',
                    sprintf(
                        /* translators: %d: maximum rows allowed per import. */
                        __('The CSV has too many rows. Maximum is %d.', 'flexa-unsubscribe'),
                        self::MAX_ROWS
                    ),
                    ['status' => 413]
                );
            }

            $email  = isset($row[$column_map['email']]) ? trim((string) $row[$column_map['email']]) : '';
            $reason = $column_map['reason'] !== null && isset($row[$column_map['reason']])
                ? sanitize_text_field((string) $row[$column_map['reason']])
                : '';
            $date_raw = $column_map['date'] !== null && isset($row[$column_map['date']])
                ? trim((string) $row[$column_map['date']])
                : '';

            if ($email === '') {
                $failed_count++;
                if (count($failed) < self::MAX_ERRORS) {
                    $failed[] = [
                        'row'   => $row_number,
                        'email' => '',
                        'error' => __('Missing email.', 'flexa-unsubscribe'),
                    ];
                }
                continue;
            }

            $unsubscribed_at = $this->parse_date($date_raw, $now);

            $outcome = flexa_tech_su_import_unsubscribe($email, $reason, $unsubscribed_at);

            if ($outcome === 'imported') {
                $imported++;
            } elseif ($outcome === 'duplicate') {
                $skipped_duplicate++;
            } else {
                $failed_count++;
                if (count($failed) < self::MAX_ERRORS) {
                    $failed[] = [
                        'row'   => $row_number,
                        'email' => $email,
                        'error' => __('Invalid email address.', 'flexa-unsubscribe'),
                    ];
                }
            }
        }

        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- streaming user upload row-by-row; WP_Filesystem has no fgetcsv equivalent.
        fclose($handle);

        // Edge case: completely empty file (no data rows after header).
        if ($column_map === null) {
            return new WP_Error(
                'flexa_import_empty',
                __('The CSV file is empty.', 'flexa-unsubscribe'),
                ['status' => 400]
            );
        }

        return new WP_REST_Response([
            'imported'          => $imported,
            'skipped_duplicate' => $skipped_duplicate,
            'failed_count'      => $failed_count,
            'failed'            => $failed,
            'total'             => $imported + $skipped_duplicate + $failed_count,
        ]);
    }

    /**
     * Decide whether the first row is a header and resolve the
     * Email / Reason / Date column positions. Returns:
     *
     *   [
     *     'has_header' => bool,
     *     'email'      => int,       // required - falls back to 0
     *     'reason'     => int|null,
     *     'date'       => int|null,
     *   ]
     *
     * Header matching is case-insensitive and tolerates variants:
     *  - "Email" / "E-mail" / "Email address"
     *  - "Reason" / "Unsubscribe reason"
     *  - "Date" / "Unsubscribed at" / "Unsubscribed"
     */
    private function resolve_column_map(array $first_row): array {
        $first_cell = isset($first_row[0]) ? trim((string) $first_row[0]) : '';

        // If the first cell parses as a valid email, treat the file as
        // headerless (column 0 = Email).
        if ($first_cell !== '' && is_email($first_cell)) {
            return [
                'has_header' => false,
                'email'      => 0,
                'reason'     => isset($first_row[1]) ? 1 : null,
                'date'       => isset($first_row[2]) ? 2 : null,
            ];
        }

        $email_idx  = null;
        $reason_idx = null;
        $date_idx   = null;

        foreach ($first_row as $i => $cell) {
            $needle = strtolower(trim((string) $cell));
            if ($email_idx === null && (
                $needle === 'email' ||
                $needle === 'e-mail' ||
                $needle === 'email address' ||
                $needle === 'address'
            )) {
                $email_idx = $i;
            } elseif ($reason_idx === null && (
                $needle === 'reason' ||
                $needle === 'unsubscribe reason'
            )) {
                $reason_idx = $i;
            } elseif ($date_idx === null && (
                $needle === 'date' ||
                $needle === 'unsubscribed at' ||
                $needle === 'unsubscribed' ||
                $needle === 'unsubscribed_at'
            )) {
                $date_idx = $i;
            }
        }

        return [
            'has_header' => true,
            'email'      => $email_idx ?? 0,
            'reason'     => $reason_idx,
            'date'       => $date_idx,
        ];
    }

    /**
     * Parse a user-provided date string into MySQL DATETIME form. Falls
     * back to `$default` (the import's `current_time('mysql')`) when the
     * cell is empty or unparseable - same shape `flexa_tech_su_save_unsubscribe`
     * gets from the schema default.
     */
    private function parse_date(string $raw, string $default): string {
        if ($raw === '') {
            return $default;
        }
        $ts = strtotime($raw);
        if ($ts === false) {
            return $default;
        }
        return gmdate('Y-m-d H:i:s', $ts);
    }
}
