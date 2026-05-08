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
    // phpcs:disable WordPress.Security.NonceVerification.Recommended -- Public unsubscribe links are stateless; HMAC token validation below is the CSRF protection layer.
    // The `?flexa_action=…` URLs are unauthenticated public links protected
    // by an HMAC token — there is no cookie nonce to verify. The HMAC check
    // below replaces the nonce semantics. Email comes from `$_GET`, which PHP
    // already URL-decodes when parsing the query string, then we normalize it
    // with `sanitize_email`; DB writes still call `sanitize_email`.
    if (!isset($_GET['flexa_action'])) {
        return;
    }

    $action = sanitize_key(wp_unslash($_GET['flexa_action']));

    if ($action === 'unsubscribe') {
        $email = isset($_GET['email'])
            ? sanitize_email(wp_unslash($_GET['email']))
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
        $email = isset($_GET['email'])
            ? sanitize_email(wp_unslash($_GET['email']))
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
    // phpcs:enable WordPress.Security.NonceVerification.Recommended
}
