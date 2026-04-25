<?php
/**
 * Core Functionality
 */

if (!defined('ABSPATH')) exit;

/**
 * Block emails to unsubscribed users
 * This filter runs with high priority (5) to block emails before other processing
 */
add_filter('wp_mail', 'flexa_tech_su_block_unsubscribed_emails', 5, 1);
function flexa_tech_su_block_unsubscribed_emails($args) {
    // Get setting to enable/disable blocking (default: enabled)
    $enable_blocking = flexa_tech_su_get_setting('enable_blocking', '1');
    if ($enable_blocking !== '1') {
        return $args;
    }
    
    // Skip if 'to' is empty (already blocked)
    if (empty($args['to'])) {
        return $args;
    }
    
    // Check exclude keywords - don't block emails with these keywords in subject
    $subject = isset($args['subject']) ? $args['subject'] : '';
    $exclude_raw = flexa_tech_su_get_setting('exclude_keywords', 'Order, Password, Invoice');
    $exclude_keywords = array_map('trim', explode(',', $exclude_raw));
    
    // If subject contains excluded keywords, don't block the email
    foreach ($exclude_keywords as $keyword) {
        if (!empty($keyword) && stripos($subject, $keyword) !== false) {
            // Subject contains excluded keyword, allow email to be sent
            return $args;
        }
    }
    
    $to_email = $args['to'];
    
    // Normalize email addresses
    $emails_to_check = [];
    
    if (is_array($to_email)) {
        $emails_to_check = $to_email;
    } elseif (is_string($to_email)) {
        // Handle comma-separated emails
        if (strpos($to_email, ',') !== false) {
            $emails_to_check = array_map('trim', explode(',', $to_email));
        } else {
            $emails_to_check = [trim($to_email)];
        }
    }
    
    // Filter out unsubscribed emails and track blocked ones
    $filtered_emails = [];
    $blocked_emails = [];
    
    foreach ($emails_to_check as $email) {
        $email = sanitize_email($email);
        if (!empty($email)) {
            if (flexa_tech_su_is_unsubscribed($email)) {
                $blocked_emails[] = $email;
            } else {
                $filtered_emails[] = $email;
            }
        }
    }
    
    // Save blocked emails to database
    if (!empty($blocked_emails)) {
        $subject = isset($args['subject']) ? $args['subject'] : '';
        $from_email = '';
        $from_name = '';
        
        // Extract from email and name from headers
        if (isset($args['headers'])) {
            if (is_array($args['headers'])) {
                // Check for From header
                if (isset($args['headers']['From'])) {
                    $from_header = $args['headers']['From'];
                } elseif (isset($args['headers']['from'])) {
                    $from_header = $args['headers']['from'];
                } else {
                    $from_header = '';
                }
                
                // Try to extract name and email from From header
                if (!empty($from_header)) {
                    if (preg_match('/^(.+?)\s*<(.+?)>$/', $from_header, $matches)) {
                        $from_name = trim($matches[1], '"\'');
                        $from_email = trim($matches[2]);
                    } else {
                        $from_email = trim($from_header);
                    }
                }
            } elseif (is_string($args['headers'])) {
                // Parse string headers
                if (preg_match('/From:\s*(.+)/i', $args['headers'], $matches)) {
                    $from_header = trim($matches[1]);
                    if (preg_match('/^(.+?)\s*<(.+?)>$/', $from_header, $name_matches)) {
                        $from_name = trim($name_matches[1], '"\'');
                        $from_email = trim($name_matches[2]);
                    } else {
                        $from_email = trim($from_header);
                    }
                }
            }
        }
        
        // Fallback to get_option if no from email found
        if (empty($from_email)) {
            $from_email = get_option('admin_email', '');
        }
        
        // Save each blocked email
        foreach ($blocked_emails as $blocked_email) {
            flexa_tech_su_save_blocked_email(
                $blocked_email,
                $subject,
                $from_email,
                $from_name,
                $args['headers'] ?? ''
            );
        }
    }
    
    // If all emails are unsubscribed, block the email
    if (empty($filtered_emails)) {
        // Set to empty array - WordPress wp_mail() will return false and skip sending
        $args['to'] = [];
        return $args;
    }
    
    // Update with filtered emails (preserve original format)
    if (is_array($to_email)) {
        $args['to'] = $filtered_emails;
    } else {
        // Single email or comma-separated string
        if (count($filtered_emails) === 1) {
            $args['to'] = $filtered_emails[0];
        } else {
            $args['to'] = implode(', ', $filtered_emails);
        }
    }
    
    return $args;
}

/**
 * Generate secure unsubscribe link
 */
function flexa_generate_unsubscribe_link($email) {
    $token = hash_hmac('sha256', $email, AUTH_KEY);
    return add_query_arg([
        'flexa_action' => 'unsubscribe',
        'email' => urlencode($email),
        'token' => $token
    ], home_url('/'));
}

/**
 * Generate secure re-subscribe link
 */
function flexa_generate_resubscribe_link($email) {
    $token = hash_hmac('sha256', $email, AUTH_KEY);
    return add_query_arg([
        'flexa_action' => 'resubscribe',
        'email' => urlencode($email),
        'token' => $token
    ], home_url('/'));
}

/**
 * Auto-append unsubscribe link to emails
 */
add_filter('wp_mail', 'flexa_auto_append_unsubscribe_link', 10, 1);
function flexa_auto_append_unsubscribe_link($args) {
    static $processed_emails = [];
    
    if (flexa_tech_su_get_setting('enable_auto_append') !== '1') {
        return $args;
    }

    $to_email = $args['to'];
    
    // Normalize email for tracking
    $email_key = is_array($to_email) ? implode(',', $to_email) : $to_email;
    
    // Check if we already processed this email in this request
    if (isset($processed_emails[$email_key])) {
        return $args;
    }
    
    // Skip if multiple recipients
    if (is_array($to_email) || strpos($to_email, ',') !== false) {
        return $args;
    }

    $subject = $args['subject'];
    $exclude_raw = flexa_tech_su_get_setting('exclude_keywords', 'Order, Password, Invoice');
    $exclude_keywords = array_map('trim', explode(',', $exclude_raw));

    // Check if subject contains excluded keywords
    foreach ($exclude_keywords as $keyword) {
        if (!empty($keyword) && stripos($subject, $keyword) !== false) {
            return $args;
        }
    }

    // Check if unsubscribe button already exists in message
    $unsubscribe_url = flexa_generate_unsubscribe_link($to_email);
    $marker = '<!-- FLEXA_UNSUBSCRIBE_ADDED -->';
    
    // Check if we already added the button (using marker)
    if (strpos($args['message'], $marker) !== false) {
        return $args;
    }
    
    // Also check if unsubscribe link/button already exists (from other sources)
    if (strpos($args['message'], 'flexa_action=unsubscribe') !== false || 
        strpos($args['message'], $unsubscribe_url) !== false ||
        preg_match('/<a[^>]*unsubscribe[^>]*>/i', $args['message'])) {
        // Already has unsubscribe link, skip
        return $args;
    }
    
    // Set email to HTML format if not already
    if (empty($args['headers'])) {
        $args['headers'] = [];
    }
    if (is_string($args['headers'])) {
        $args['headers'] = explode("\n", $args['headers']);
    }
    
    // Check if message is already HTML
    $is_html = (wp_strip_all_tags($args['message']) !== $args['message']);
    
    // Convert plain text to HTML if needed
    if (!$is_html) {
        $args['message'] = nl2br(esc_html($args['message']));
    }
    
    // Add HTML content type if not present
    $has_html_header = false;
    foreach ($args['headers'] as $header) {
        if (stripos($header, 'Content-Type') !== false && stripos($header, 'text/html') !== false) {
            $has_html_header = true;
            break;
        }
    }
    
    if (!$has_html_header) {
        $args['headers'][] = 'Content-Type: text/html; charset=UTF-8';
    }
    
    // Create HTML button with inline styles for email compatibility
    $button_html = sprintf(
        '%s<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <div style="margin-bottom: 10px; color: #222; font-size: 15px; font-family: Arial, sans-serif;">
                No longer want to receive these emails?
            </div>
            <a href="%s" style="display: inline-block; padding: 5px 5px; background-color: #dc3545; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500; font-family: Arial, sans-serif;">
                Unsubscribe
            </a>
        </div>',
        $marker,
        esc_url($unsubscribe_url)
    );
    
    // Append button to message
    $args['message'] .= $button_html;
    
    // Mark this email as processed
    $processed_emails[$email_key] = true;
    
    return $args;
}
