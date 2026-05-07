<?php
/**
 * Frontend Unsubscribe Handler
 */

if (!defined('ABSPATH')) exit;

/**
 * Handle unsubscribe request from frontend
 */
add_action('template_redirect', 'flexa_handle_unsubscribe_logic');
function flexa_handle_unsubscribe_logic() {
    // The `?flexa_action=…` URLs are unauthenticated public links protected
    // by an HMAC token — there is no cookie nonce to verify. The HMAC check
    // below replaces the nonce semantics. `urldecode` runs on the email
    // because the link is built with `urlencode($email)` in
    // `flexa_generate_unsubscribe_link`. Email is normalized here with
    // `sanitize_email` after `urldecode`; DB writes still call `sanitize_email`.
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended
    if (!isset($_GET['flexa_action'])) {
        return;
    }

    // phpcs:ignore WordPress.Security.NonceVerification.Recommended
    $action = sanitize_key(wp_unslash($_GET['flexa_action']));

    if ($action === 'unsubscribe') {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- HMAC replaces nonce; email/token sanitized inline.
        $email = isset($_GET['email'])
            ? sanitize_email(urldecode(wp_unslash((string) $_GET['email'])))
            : '';
        $token = isset($_GET['token'])
            ? sanitize_text_field(wp_unslash((string) $_GET['token']))
            : '';

        if ($email !== '' && $token !== '' && hash_equals(hash_hmac('sha256', $email, AUTH_KEY), $token)) {
            flexa_tech_su_save_unsubscribe($email, $token);
            $status = 'success';
        } else {
            $status = 'error';
        }

        include FLEXA_TECH_SU_PATH . 'templates/unsubscribe-page.php';
        exit;
    } elseif ($action === 'resubscribe') {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- HMAC replaces nonce; email/token sanitized inline.
        $email = isset($_GET['email'])
            ? sanitize_email(urldecode(wp_unslash((string) $_GET['email'])))
            : '';
        $token = isset($_GET['token'])
            ? sanitize_text_field(wp_unslash((string) $_GET['token']))
            : '';

        if ($email !== '' && $token !== '' && hash_equals(hash_hmac('sha256', $email, AUTH_KEY), $token)) {
            $resubscribed = flexa_tech_su_resubscribe($email);
            $status = $resubscribed !== false ? 'success' : 'error';
        } else {
            $status = 'error';
        }

        include FLEXA_TECH_SU_PATH . 'templates/resubscribe-page.php';
        exit;
    }
}
