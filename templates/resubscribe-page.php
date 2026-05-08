<?php
/**
 * Public re-subscribe confirmation page.
 *
 * Loaded via `include()` from `includes/frontend.php` after HMAC token
 * verification. Available from the parent scope:
 *   - $status ('success' | 'error')
 *
 * All other variables defined here are template-scope only and prefixed
 * `$flexa_tech_su_*` to satisfy the WP coding standards.
 */

if (!defined('ABSPATH')) exit;

// Appearance settings.
$flexa_tech_su_bg_color           = flexa_tech_su_get_setting('bg_color', '#f0f2f5');
$flexa_tech_su_box_bg_color       = flexa_tech_su_get_setting('box_bg_color', '#ffffff');
$flexa_tech_su_text_color         = flexa_tech_su_get_setting('text_color', '#333333');
$flexa_tech_su_heading_color      = flexa_tech_su_get_setting('heading_color', '#495057');
$flexa_tech_su_button_bg_color    = flexa_tech_su_get_setting('button_bg_color', '#00aad0');
$flexa_tech_su_button_text_color  = flexa_tech_su_get_setting('button_text_color', '#ffffff');
$flexa_tech_su_button_hover_color = flexa_tech_su_get_setting('button_hover_color', '#0099bb');
$flexa_tech_su_font_family        = flexa_tech_su_get_setting('font_family', 'sans-serif');
$flexa_tech_su_font_size          = flexa_tech_su_get_setting('font_size', '14px');

// Text content settings.
$flexa_tech_su_resubscribe_title   = flexa_tech_su_get_setting('resubscribe_title', 'Successfully Re-subscribed!');
$flexa_tech_su_resubscribe_message = flexa_tech_su_get_setting('resubscribe_message', 'You have been successfully re-subscribed. You will start receiving emails again.');
$flexa_tech_su_home_link_text      = flexa_tech_su_get_setting('home_link_text', 'Back to Home Page');
$flexa_tech_su_error_title         = flexa_tech_su_get_setting('error_title', 'We\'re Sorry, This Link Is No Longer Valid');
$flexa_tech_su_error_message       = flexa_tech_su_get_setting('error_message', 'The re-subscribe link you used appears to be invalid or has expired.<br>If you believe this is a mistake, please try again or contact our support team for assistance.');

$flexa_tech_su_style_handle = 'flexa-tech-su-resubscribe-page';
wp_register_style(
    $flexa_tech_su_style_handle,
    FLEXA_TECH_SU_URL . 'public/css/resubscribe-page.css',
    array(),
    FLEXA_TECH_SU_VERSION
);
wp_enqueue_style($flexa_tech_su_style_handle);

$flexa_tech_su_dynamic_css = sprintf(
    ':root{--flexa-tech-su-font-family:%1$s;--flexa-tech-su-bg-color:%2$s;--flexa-tech-su-text-color:%3$s;--flexa-tech-su-font-size:%4$s;--flexa-tech-su-box-bg-color:%5$s;--flexa-tech-su-button-bg-color:%6$s;--flexa-tech-su-button-text-color:%7$s;--flexa-tech-su-button-hover-color:%8$s;--flexa-tech-su-heading-color:%9$s;}',
    esc_html($flexa_tech_su_font_family),
    esc_html($flexa_tech_su_bg_color),
    esc_html($flexa_tech_su_text_color),
    esc_html($flexa_tech_su_font_size),
    esc_html($flexa_tech_su_box_bg_color),
    esc_html($flexa_tech_su_button_bg_color),
    esc_html($flexa_tech_su_button_text_color),
    esc_html($flexa_tech_su_button_hover_color),
    esc_html($flexa_tech_su_heading_color)
);
wp_add_inline_style($flexa_tech_su_style_handle, $flexa_tech_su_dynamic_css);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Re-subscribe - Flexa</title>
    <?php wp_print_styles($flexa_tech_su_style_handle); ?>
</head>
<body>
    <div class="flexa-tech-su-box">
        <?php if ($status === 'success'): ?>
            <div class="flexa-tech-su-success-icon">✓</div>
            <h2><?php echo esc_html($flexa_tech_su_resubscribe_title); ?></h2>
            <p><?php echo esc_html($flexa_tech_su_resubscribe_message); ?></p>
            <a href="/" class="flexa-tech-su-btn"><?php echo esc_html($flexa_tech_su_home_link_text); ?></a>
        <?php else: ?>
            <h2 class="flexa-tech-su-error-title"><?php echo esc_html($flexa_tech_su_error_title); ?></h2>
            <p><?php echo wp_kses_post($flexa_tech_su_error_message); ?></p>
            <a href="/" class="flexa-tech-su-btn"><?php echo esc_html($flexa_tech_su_home_link_text); ?></a>
        <?php endif; ?>
    </div>
</body>
</html>
