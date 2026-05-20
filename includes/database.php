<?php
/**
 * Database Operations.
 *
 * Every helper here operates on this plugin's three custom tables
 * (`{prefix}flexa_unsubscribes`, `{prefix}flexa_blocked_emails`,
 * `{prefix}flexa_unsubscribe_reasons`). Direct `$wpdb->*` calls and
 * interpolated table-name constants are intentional:
 *
 *  - `WordPress.DB.DirectDatabaseQuery.*` - there is no Core API for
 *    custom tables; admin-side volume is small and `wp_cache_*` would
 *    add stale-read risk to a write-through CRUD layer.
 *  - `WordPress.DB.PreparedSQL.InterpolatedNotPrepared` - table names
 *    come from `FLEXA_TECH_SU_*` constants defined in `constants.php`,
 *    not user input. Plugin requires WP 5.8 so the `%i` identifier
 *    placeholder (WP 6.2+) isn't available; `$wpdb->prepare` only
 *    handles values, not identifiers.
 *
 * File-level disables below; per-line `phpcs:ignore` is used for the
 * two findings PluginCheck flags as ERROR-level.
 */

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery
// phpcs:disable WordPress.DB.DirectDatabaseQuery.NoCaching
// phpcs:disable WordPress.DB.DirectDatabaseQuery.SchemaChange
// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

if (!defined('ABSPATH')) exit;

/**
 * Create database tables on plugin activation
 */
function flexa_tech_su_create_db() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

    // Unsubscribes table
    $table_name = FLEXA_TECH_SU_TABLE;
    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        email varchar(100) NOT NULL,
        token varchar(64) NOT NULL,
        reason varchar(255) DEFAULT '' NOT NULL,
        unsubscribed_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        resubscribed_at datetime DEFAULT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY email (email),
        KEY unsubscribed_at (unsubscribed_at),
        KEY resubscribed_at (resubscribed_at)
    ) $charset_collate;";
    dbDelta($sql);

    // Add resubscribed_at column if it doesn't exist (for existing installations)
    $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $table_name LIKE 'resubscribed_at'");
    if (empty($column_exists)) {
        $wpdb->query("ALTER TABLE $table_name ADD COLUMN resubscribed_at datetime DEFAULT NULL AFTER unsubscribed_at");
        $wpdb->query("ALTER TABLE $table_name ADD INDEX resubscribed_at (resubscribed_at)");
    }

    // Add unsubscribed_at index for older installs that pre-date it.
    // Analytics queries (`get_stats`, `get_trend`, etc.) need this index
    // - without it every dashboard load full-scans the unsubscribes table.
    $index_exists = $wpdb->get_results("SHOW INDEX FROM $table_name WHERE Key_name = 'unsubscribed_at'");
    if (empty($index_exists)) {
        $wpdb->query("ALTER TABLE $table_name ADD INDEX unsubscribed_at (unsubscribed_at)");
    }

    // Blocked emails table
    $blocked_table = FLEXA_TECH_SU_BLOCKED_TABLE;
    $sql_blocked = "CREATE TABLE $blocked_table (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        email varchar(100) NOT NULL,
        subject varchar(255) DEFAULT '' NOT NULL,
        from_email varchar(100) DEFAULT '' NOT NULL,
        from_name varchar(100) DEFAULT '' NOT NULL,
        headers text,
        blocked_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY  (id),
        KEY email (email),
        KEY blocked_at (blocked_at)
    ) $charset_collate;";
    dbDelta($sql_blocked);

    // Unsubscribe reasons table
    $reasons_table = FLEXA_TECH_SU_REASONS_TABLE;
    $sql_reasons = "CREATE TABLE $reasons_table (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        reason_text varchar(255) NOT NULL,
        sort_order int(11) DEFAULT 0 NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY  (id),
        KEY sort_order (sort_order)
    ) $charset_collate;";
    dbDelta($sql_reasons);

    // Insert default reasons if table is empty
    $existing_reasons = $wpdb->get_var("SELECT COUNT(*) FROM $reasons_table");
    if ($existing_reasons == 0) {
        $default_reasons = [
            __('Too many emails', 'flexa-unsubscribe'),
            __('Content not relevant', 'flexa-unsubscribe'),
            __('Other', 'flexa-unsubscribe'),
        ];
        foreach ($default_reasons as $index => $reason) {
            $wpdb->insert($reasons_table, [
                'reason_text' => $reason,
                'sort_order' => $index + 1
            ]);
        }
    }
}

/**
 * Get all unsubscribes with pagination support
 */
function flexa_tech_su_get_unsubscribes($order_by = 'unsubscribed_at', $order = 'DESC', $limit = null, $offset = 0) {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    
    $limit_clause = '';
    if ($limit) {
        $limit = absint($limit);
        $offset = absint($offset);
        $limit_clause = "LIMIT $limit OFFSET $offset";
    }
    
    $order_by = sanitize_sql_orderby($order_by . ' ' . $order);
    if (!$order_by) {
        $order_by = 'unsubscribed_at DESC';
    }

    // phpcs:ignore PluginCheck.Security.DirectDB.UnescapedDBParameter -- $order_by comes from `sanitize_sql_orderby`, the WP-sanctioned identifier sanitizer; $limit_clause is composed only of `absint`-cast integers.
    return $wpdb->get_results("SELECT * FROM $table_name ORDER BY $order_by $limit_clause");
}

/**
 * Get total count of unsubscribes
 */
function flexa_tech_su_get_unsubscribes_count() {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    return (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
}

/**
 * Save unsubscribe record
 */
function flexa_tech_su_save_unsubscribe($email, $token) {
    global $wpdb;

    $email = sanitize_email($email);
    if (empty($email)) {
        return false;
    }

    return $wpdb->replace(FLEXA_TECH_SU_TABLE, [
        'email' => $email,
        'token' => $token
    ]);
}

/**
 * Insert an unsubscribe record from a CSV import row.
 *
 * Dedup is delegated to the table's UNIQUE KEY on `email`: we issue
 * `INSERT IGNORE` so an existing row is left untouched and the call
 * reports back as `duplicate`. This keeps the import idempotent and
 * preserves the original `unsubscribed_at` / `reason` / `token` for
 * rows already opted-out, matching the "Skip duplicates" import
 * behavior chosen at design time.
 *
 * `$unsubscribed_at` is expected in MySQL DATETIME form (`Y-m-d H:i:s`);
 * caller should pass `current_time('mysql')` when the CSV row has no
 * Date column.
 *
 * Returns one of: 'imported', 'duplicate', 'failed'.
 */
function flexa_tech_su_import_unsubscribe(string $email, string $reason, string $unsubscribed_at): string {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;

    $email = sanitize_email($email);
    if (empty($email) || !is_email($email)) {
        return 'failed';
    }

    // wp_generate_password is the WP-blessed CSPRNG wrapper; 64 chars
    // matches the schema column width and the live token format used
    // by HMAC-issued links elsewhere in the plugin.
    $token = wp_generate_password(64, false);

    // INSERT IGNORE relies on the UNIQUE KEY (email) - the duplicate-key
    // case becomes a 0-row affected, not an error. We can't use
    // $wpdb->insert() because its INSERT has no IGNORE flavor; the
    // prepared statement here uses %s placeholders for every value so
    // there's nothing identifier-position to escape beyond the table
    // name (already a server-side constant).
    $result = $wpdb->query($wpdb->prepare(
        "INSERT IGNORE INTO $table_name (email, token, reason, unsubscribed_at) VALUES (%s, %s, %s, %s)",
        $email,
        $token,
        $reason,
        $unsubscribed_at
    ));

    if ($result === false) {
        return 'failed';
    }
    return $result === 1 ? 'imported' : 'duplicate';
}

/**
 * Update unsubscribe reason
 */
function flexa_tech_su_update_reason($email, $reason) {
    global $wpdb;
    return $wpdb->update(
        FLEXA_TECH_SU_TABLE,
        ['reason' => $reason],
        ['email' => $email]
    );
}

/**
 * Delete unsubscribe record
 */
function flexa_tech_su_delete_unsubscribe($id) {
    global $wpdb;
    return $wpdb->delete(FLEXA_TECH_SU_TABLE, ['id' => intval($id)]);
}

/**
 * Stream unsubscribe rows for CSV export.
 *
 * Keyset pagination on the primary key keeps memory flat regardless of
 * total row count - no `OFFSET` deep-pagination cost, no full result set
 * buffered in PHP. Caller iterates once; each yielded row is an
 * associative array shaped for `fputcsv` (no `id` column).
 *
 * Trade-off: rows come out in insertion order (id ASC), not the
 * `unsubscribed_at` order the previous buffered helper used. Not
 * meaningful for CSV consumers - they sort in their own tool.
 */
function flexa_tech_su_stream_export_unsubscribes(int $chunk = 1000): Generator {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    $last_id = 0;

    do {
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, email, reason, unsubscribed_at FROM $table_name WHERE id > %d ORDER BY id ASC LIMIT %d",
                $last_id,
                $chunk
            ),
            ARRAY_A
        );
        if (empty($rows)) {
            return;
        }
        foreach ($rows as $row) {
            $last_id = (int) $row['id'];
            unset($row['id']);
            yield $row;
        }
    } while (count($rows) === $chunk);
}

/**
 * Check if email is in unsubscribe list (and not re-subscribed)
 */
function flexa_tech_su_is_unsubscribed($email) {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    
    if (empty($email)) {
        return false;
    }
    
    $email = sanitize_email($email);
    $result = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $table_name WHERE email = %s AND (resubscribed_at IS NULL OR resubscribed_at = '0000-00-00 00:00:00')",
        $email
    ));
    
    return $result > 0;
}

/**
 * Get all unsubscribed emails (for bulk checking) - excludes re-subscribed
 */
function flexa_tech_su_get_unsubscribed_emails() {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    $emails = $wpdb->get_col("SELECT email FROM $table_name WHERE resubscribed_at IS NULL OR resubscribed_at = '0000-00-00 00:00:00'");
    return array_map('strtolower', $emails);
}

/**
 * Re-subscribe an email
 */
function flexa_tech_su_resubscribe($email) {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    
    if (empty($email)) {
        return false;
    }
    
    $email = sanitize_email($email);
    
    // Check if email exists in unsubscribe list
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $table_name WHERE email = %s",
        $email
    ));
    
    if ($exists > 0) {
        // Update existing record
        return $wpdb->update(
            $table_name,
            ['resubscribed_at' => current_time('mysql')],
            ['email' => $email],
            ['%s'],
            ['%s']
        );
    }
    
    return false;
}

/**
 * Check if email is re-subscribed
 */
function flexa_tech_su_is_resubscribed($email) {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    
    if (empty($email)) {
        return false;
    }
    
    $email = sanitize_email($email);
    $result = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $table_name WHERE email = %s AND resubscribed_at IS NOT NULL AND resubscribed_at != '0000-00-00 00:00:00'",
        $email
    ));
    
    return $result > 0;
}

/**
 * Get re-subscribe stats
 */
function flexa_tech_su_get_resubscribe_stats() {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;

    return [
        'total_resubscribed'      => (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE resubscribed_at IS NOT NULL AND resubscribed_at != '0000-00-00 00:00:00'"),
        'today_resubscribed'      => (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE resubscribed_at >= CURDATE() AND resubscribed_at < CURDATE() + INTERVAL 1 DAY"),
        'this_week_resubscribed'  => (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE resubscribed_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND resubscribed_at < DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 7 DAY"),
        'this_month_resubscribed' => (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE resubscribed_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND resubscribed_at < DATE_FORMAT(CURDATE(), '%Y-%m-01') + INTERVAL 1 MONTH"),
    ];
}

/**
 * Get all re-subscribed emails with pagination support
 */
function flexa_tech_su_get_resubscribed_emails($order_by = 'resubscribed_at', $order = 'DESC', $limit = null, $offset = 0) {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    
    $limit_clause = '';
    if ($limit) {
        $limit = absint($limit);
        $offset = absint($offset);
        $limit_clause = "LIMIT $limit OFFSET $offset";
    }
    
    $order_by = sanitize_sql_orderby($order_by . ' ' . $order);
    if (!$order_by) {
        $order_by = 'resubscribed_at DESC';
    }

    // phpcs:ignore PluginCheck.Security.DirectDB.UnescapedDBParameter -- $order_by comes from `sanitize_sql_orderby`, the WP-sanctioned identifier sanitizer; $limit_clause is composed only of `absint`-cast integers.
    return $wpdb->get_results(
        "SELECT * FROM $table_name WHERE resubscribed_at IS NOT NULL AND resubscribed_at != '0000-00-00 00:00:00' ORDER BY $order_by $limit_clause"
    );
}

/**
 * Get total count of re-subscribed emails
 */
function flexa_tech_su_get_resubscribed_count() {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    return (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE resubscribed_at IS NOT NULL AND resubscribed_at != '0000-00-00 00:00:00'");
}

/**
 * Save blocked email record
 */
function flexa_tech_su_save_blocked_email($email, $subject, $from_email = '', $from_name = '', $headers = '') {
    global $wpdb;
    
    // Serialize headers if it's an array
    if (is_array($headers)) {
        $headers = maybe_serialize($headers);
    }
    
    return $wpdb->insert(FLEXA_TECH_SU_BLOCKED_TABLE, [
        'email' => sanitize_email($email),
        'subject' => sanitize_text_field($subject),
        'from_email' => sanitize_email($from_email),
        'from_name' => sanitize_text_field($from_name),
        'headers' => $headers
    ]);
}

/**
 * Get all blocked emails with pagination support
 */
function flexa_tech_su_get_blocked_emails($order_by = 'blocked_at', $order = 'DESC', $limit = null, $offset = 0) {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_BLOCKED_TABLE;
    
    $limit_clause = '';
    if ($limit) {
        $limit = absint($limit);
        $offset = absint($offset);
        $limit_clause = "LIMIT $limit OFFSET $offset";
    }
    
    $order_by = sanitize_sql_orderby($order_by . ' ' . $order);
    if (!$order_by) {
        $order_by = 'blocked_at DESC';
    }

    // phpcs:ignore PluginCheck.Security.DirectDB.UnescapedDBParameter -- $order_by comes from `sanitize_sql_orderby`, the WP-sanctioned identifier sanitizer; $limit_clause is composed only of `absint`-cast integers.
    return $wpdb->get_results("SELECT * FROM $table_name ORDER BY $order_by $limit_clause");
}

/**
 * Get blocked emails count
 */
function flexa_tech_su_get_blocked_emails_count() {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_BLOCKED_TABLE;
    return (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
}

/**
 * Delete blocked email record
 */
function flexa_tech_su_delete_blocked_email($id) {
    global $wpdb;
    return $wpdb->delete(FLEXA_TECH_SU_BLOCKED_TABLE, ['id' => intval($id)]);
}

/**
 * Clear all blocked emails
 */
function flexa_tech_su_clear_blocked_emails() {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_BLOCKED_TABLE;
    return $wpdb->query("TRUNCATE TABLE $table_name");
}

/**
 * Stream blocked-email rows for CSV export. See
 * {@see flexa_tech_su_stream_export_unsubscribes()} for rationale.
 */
function flexa_tech_su_stream_export_blocked(int $chunk = 1000): Generator {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_BLOCKED_TABLE;
    $last_id = 0;

    do {
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, email, subject, from_email, from_name, blocked_at FROM $table_name WHERE id > %d ORDER BY id ASC LIMIT %d",
                $last_id,
                $chunk
            ),
            ARRAY_A
        );
        if (empty($rows)) {
            return;
        }
        foreach ($rows as $row) {
            $last_id = (int) $row['id'];
            unset($row['id']);
            yield $row;
        }
    } while (count($rows) === $chunk);
}

/**
 * Stream re-subscribed rows for CSV export. Filters server-side so PHP
 * never sees rows that aren't actually re-subscribed.
 */
function flexa_tech_su_stream_export_resubscribed(int $chunk = 1000): Generator {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    $last_id = 0;

    do {
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT id, email, unsubscribed_at, resubscribed_at, reason FROM $table_name
             WHERE id > %d
               AND resubscribed_at IS NOT NULL
               AND resubscribed_at != '0000-00-00 00:00:00'
             ORDER BY id ASC
             LIMIT %d",
            $last_id,
            $chunk
        ));
        if (empty($rows)) {
            return;
        }
        foreach ($rows as $row) {
            $last_id = (int) $row->id;
            yield $row;
        }
    } while (count($rows) === $chunk);
}

/**
 * Get all unsubscribe reasons
 */
function flexa_tech_su_get_reasons($order_by = 'sort_order', $order = 'ASC') {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_REASONS_TABLE;

    // `$wpdb->prepare("... ORDER BY %s %s", ...)` would quote both values
    // and silently break ordering - `sanitize_sql_orderby` is the correct
    // tool for identifier-position interpolation.
    $clause = sanitize_sql_orderby($order_by . ' ' . $order);
    if (!$clause) {
        $clause = 'sort_order ASC';
    }
    // phpcs:ignore PluginCheck.Security.DirectDB.UnescapedDBParameter -- $clause comes from `sanitize_sql_orderby`, the WP-sanctioned identifier sanitizer.
    return $wpdb->get_results("SELECT * FROM $table_name ORDER BY $clause");
}

/**
 * Get single reason by ID
 */
function flexa_tech_su_get_reason($id) {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_REASONS_TABLE;
    return $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE id = %d",
        $id
    ));
}

/**
 * Save unsubscribe reason
 */
function flexa_tech_su_save_reason($reason_text, $sort_order = 0, $id = null) {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_REASONS_TABLE;
    
    $data = [
        'reason_text' => sanitize_text_field($reason_text),
        'sort_order' => intval($sort_order)
    ];
    
    if ($id) {
        // Update existing
        return $wpdb->update($table_name, $data, ['id' => intval($id)]);
    } else {
        // Insert new
        return $wpdb->insert($table_name, $data);
    }
}

/**
 * Delete unsubscribe reason
 */
function flexa_tech_su_delete_reason($id) {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_REASONS_TABLE;
    return $wpdb->delete($table_name, ['id' => intval($id)]);
}

/**
 * Update reason sort order
 */
function flexa_tech_su_update_reason_order($id, $sort_order) {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_REASONS_TABLE;
    return $wpdb->update(
        $table_name,
        ['sort_order' => intval($sort_order)],
        ['id' => intval($id)]
    );
}

/**
 * Analytics Functions
 */

/**
 * Get unsubscribe stats (total, today, this week, this month)
 */
function flexa_tech_su_get_stats() {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;

    // All bounded predicates use range comparisons against `CURDATE()` so
    // the planner can use the `unsubscribed_at` index. Function-on-column
    // forms (`DATE(...)`, `YEARWEEK(...)`, `YEAR(...) AND MONTH(...)`)
    // disqualify index use entirely.
    $stats = [
        'total'      => (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name"),
        'today'      => (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE unsubscribed_at >= CURDATE() AND unsubscribed_at < CURDATE() + INTERVAL 1 DAY"),
        'this_week'  => (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE unsubscribed_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND unsubscribed_at < DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 7 DAY"),
        'this_month' => (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE unsubscribed_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND unsubscribed_at < DATE_FORMAT(CURDATE(), '%Y-%m-01') + INTERVAL 1 MONTH"),
        'last_month' => (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE unsubscribed_at >= DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-01') AND unsubscribed_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')"),
    ];

    if ($stats['last_month'] > 0) {
        $stats['month_change'] = round((($stats['this_month'] - $stats['last_month']) / $stats['last_month']) * 100, 1);
    } else {
        $stats['month_change'] = $stats['this_month'] > 0 ? 100 : 0;
    }

    return $stats;
}

/**
 * Get unsubscribes by date range for chart
 */
function flexa_tech_su_get_unsubscribes_by_date($period = '7days') {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    
    $date_format = '%Y-%m-%d';
    $date_condition = '';
    
    switch ($period) {
        case '7days':
            $date_condition = "WHERE unsubscribed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
            $date_format = '%Y-%m-%d';
            break;
        case '30days':
            $date_condition = "WHERE unsubscribed_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            $date_format = '%Y-%m-%d';
            break;
        case '12months':
            $date_condition = "WHERE unsubscribed_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
            $date_format = '%Y-%m';
            break;
        case 'all':
            $date_condition = '';
            $date_format = '%Y-%m';
            break;
    }
    
    // phpcs:ignore PluginCheck.Security.DirectDB.UnescapedDBParameter -- $date_format is a hardcoded format string assigned via the switch above, never touched by user input.
    $results = $wpdb->get_results(
        "SELECT
            DATE_FORMAT(unsubscribed_at, '$date_format') as date,
            COUNT(*) as count
        FROM $table_name
        $date_condition
        GROUP BY DATE_FORMAT(unsubscribed_at, '$date_format')
        ORDER BY date ASC"
    );
    
    $data = [];
    foreach ($results as $row) {
        $data[] = [
            'date' => $row->date,
            'count' => (int) $row->count
        ];
    }
    
    return $data;
}

/**
 * Get unsubscribes by reason for pie chart
 */
function flexa_tech_su_get_unsubscribes_by_reason($limit = 10) {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    
    $limit = intval($limit);
    
    $limit = absint($limit);
    $results = $wpdb->get_results(
        "SELECT 
            COALESCE(reason, 'No reason provided') as reason,
            COUNT(*) as count
        FROM $table_name 
        GROUP BY reason
        ORDER BY count DESC
        LIMIT $limit"
    );
    
    $data = [];
    foreach ($results as $row) {
        $data[] = [
            // The SQL COALESCE above buckets NULL/empty reasons under the
            // English sentinel so they group as one row; localize that
            // sentinel for display without disturbing the GROUP BY key.
            'reason' => (!$row->reason || $row->reason === 'No reason provided')
                ? __('No reason provided', 'flexa-unsubscribe')
                : $row->reason,
            'count' => (int) $row->count
        ];
    }
    
    return $data;
}

/**
 * Get recent unsubscribes
 */
function flexa_tech_su_get_recent_unsubscribes($limit = 10) {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;
    
    $limit = absint($limit);
    
    return $wpdb->get_results(
        "SELECT * FROM $table_name ORDER BY unsubscribed_at DESC LIMIT $limit"
    );
}

/**
 * Get unsubscribe trend (compare periods)
 */
function flexa_tech_su_get_trend() {
    global $wpdb;
    $table_name = FLEXA_TECH_SU_TABLE;

    $current_week = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE unsubscribed_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND unsubscribed_at < DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 7 DAY");
    $last_week    = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE unsubscribed_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) - INTERVAL 7 DAY AND unsubscribed_at < DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)");

    $current_month = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE unsubscribed_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND unsubscribed_at < DATE_FORMAT(CURDATE(), '%Y-%m-01') + INTERVAL 1 MONTH");
    $last_month    = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE unsubscribed_at >= DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-01') AND unsubscribed_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')");

    return [
        'week'  => [
            'current'  => $current_week,
            'previous' => $last_week,
            'change'   => $last_week > 0 ? round((($current_week - $last_week) / $last_week) * 100, 1) : ($current_week > 0 ? 100 : 0),
        ],
        'month' => [
            'current'  => $current_month,
            'previous' => $last_month,
            'change'   => $last_month > 0 ? round((($current_month - $last_month) / $last_month) * 100, 1) : ($current_month > 0 ? 100 : 0),
        ],
    ];
}
