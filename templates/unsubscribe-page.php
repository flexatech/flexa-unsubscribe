<?php
/**
 * Public unsubscribe page template.
 *
 * Loaded via `include()` from `includes/frontend.php` after HMAC token
 * verification. Available from the parent scope:
 *   - $status ('success' | 'error')
 *   - $email  (decoded URL param, only valid when $status === 'success')
 *   - $token  (HMAC-verified, only valid when $status === 'success')
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

// Text content settings. The default (second) argument is wrapped in
// __() so an untouched install renders in the active locale; the source
// strings here MUST stay byte-identical to the matching entries in
// Controllers\SettingsRestController::APPEARANCE_DEFAULTS so both paths
// resolve the same translation.
$flexa_tech_su_title_text        = flexa_tech_su_get_setting('title_text', __('Unsubscribed', 'flexa-unsubscribe'));
/* translators: {email} is a literal placeholder, replaced with the recipient's address. Keep it as-is. */
$flexa_tech_su_success_message   = flexa_tech_su_get_setting('success_message', __('Email {email} is removed.', 'flexa-unsubscribe'));
$flexa_tech_su_button_text       = flexa_tech_su_get_setting('button_text', __('Submit Feedback', 'flexa-unsubscribe'));
$flexa_tech_su_thank_you_title   = flexa_tech_su_get_setting('thank_you_title', __('Thank you for your feedback!', 'flexa-unsubscribe'));
$flexa_tech_su_thank_you_message = flexa_tech_su_get_setting('thank_you_message', __('We greatly appreciate your input and will use this information to improve our content in the future.', 'flexa-unsubscribe'));
$flexa_tech_su_home_link_text    = flexa_tech_su_get_setting('home_link_text', __('Back to Home Page', 'flexa-unsubscribe'));
$flexa_tech_su_error_title       = flexa_tech_su_get_setting('error_title', __("We're Sorry, This Link Is No Longer Valid", 'flexa-unsubscribe'));
/* translators: <br> is an HTML line break; keep it in the translation. */
$flexa_tech_su_error_message     = flexa_tech_su_get_setting('error_message', __('The unsubscribe link you used appears to be invalid or has expired.<br>If you believe this is a mistake, please try again or contact our support team for assistance.', 'flexa-unsubscribe'));

// {email} placeholder substitution. Email is escaped before being wrapped in <strong>.
$flexa_tech_su_success_message = str_replace(
    '{email}',
    '<strong>' . esc_html($email) . '</strong>',
    $flexa_tech_su_success_message
);

$flexa_tech_su_style_handle = 'flexa-tech-su-unsubscribe-page';
wp_register_style(
    $flexa_tech_su_style_handle,
    FLEXA_TECH_SU_URL . 'public/css/unsubscribe-page.css',
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

$flexa_tech_su_script_handle = 'flexa-tech-su-unsubscribe-page';
wp_register_script(
    $flexa_tech_su_script_handle,
    FLEXA_TECH_SU_URL . 'public/js/unsubscribe-page.js',
    array(),
    FLEXA_TECH_SU_VERSION,
    false
);
wp_enqueue_script($flexa_tech_su_script_handle);
wp_add_inline_script(
    $flexa_tech_su_script_handle,
    'window.flexaTechSuReasonEndpoint = ' . wp_json_encode(esc_url_raw(rest_url('flexa-unsubscribe/v1/reason'))) . ';',
    'before'
);
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="UTF-8">
    <title><?php echo esc_html__('Unsubscribe', 'flexa-unsubscribe') . ' - Flexa'; ?></title>
    <?php wp_print_styles($flexa_tech_su_style_handle); ?>
    <?php wp_print_scripts($flexa_tech_su_script_handle); ?>
</head>
<body>
    <div class="flexa-tech-su-box">
        <?php if ($status === 'success'): ?>
            <div id="s1">
                <h2><?php echo esc_html($flexa_tech_su_title_text); ?></h2>
                <p><?php echo wp_kses_post($flexa_tech_su_success_message); ?></p>
                <form id="f-survey">
                    <input type="hidden" name="email" value="<?php echo esc_attr($email); ?>">
                    <input type="hidden" name="token" value="<?php echo esc_attr($token); ?>">
                    <select name="reason" class="flexa-tech-su-reason-select" required>
                        <option value=""><?php esc_html_e('-- Please select a reason --', 'flexa-unsubscribe'); ?></option>
                        <?php
                        $flexa_tech_su_reasons = flexa_tech_su_get_reasons();
                        if (!empty($flexa_tech_su_reasons)):
                            foreach ($flexa_tech_su_reasons as $flexa_tech_su_reason):
                        ?>
                            <option value="<?php echo esc_attr($flexa_tech_su_reason->reason_text); ?>">
                                <?php echo esc_html($flexa_tech_su_reason->reason_text); ?>
                            </option>
                        <?php
                            endforeach;
                        else:
                        ?>
                            <option value="Other"><?php esc_html_e('Other', 'flexa-unsubscribe'); ?></option>
                        <?php endif; ?>
                    </select>
                    <button type="submit" class="flexa-tech-su-btn"><?php echo esc_html($flexa_tech_su_button_text); ?></button>
                </form>
            </div>
            <div id="s2" class="flexa-tech-su-hidden">
                <h2><?php echo esc_html($flexa_tech_su_thank_you_title); ?></h2>
                <p><?php echo esc_html($flexa_tech_su_thank_you_message); ?></p>
                <div class="flexa-tech-su-actions">
                    <a href="<?php echo esc_url(flexa_generate_resubscribe_link($email)); ?>"
                       class="flexa-tech-su-resubscribe-link">
                        <?php esc_html_e('Re-subscribe to emails', 'flexa-unsubscribe'); ?>
                    </a>
                    <a href="/" class="flexa-tech-su-btn"><?php echo esc_html($flexa_tech_su_home_link_text); ?></a>
                </div>
            </div>
        <?php else: ?>
            <h2 class="flexa-tech-su-error-title"><?php echo esc_html($flexa_tech_su_error_title); ?></h2>
            <p><?php echo wp_kses_post($flexa_tech_su_error_message); ?></p>
            <a href="/" class="flexa-tech-su-btn"><?php echo esc_html($flexa_tech_su_home_link_text); ?></a>
        <?php endif; ?>
    </div>
</body>
</html>
