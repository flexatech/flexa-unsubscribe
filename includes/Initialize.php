<?php
namespace FlexaUnsubscribe;

use FlexaUnsubscribe\Utils\SingletonTrait;
use FlexaUnsubscribe\Register\RegisterFacade;
use FlexaUnsubscribe\Engine\Admin\Settings as AdminSettings;
use FlexaUnsubscribe\Engine\RestAPI;

if (!defined('ABSPATH')) exit;

/**
 * Boots the namespaced plugin services.
 *
 * Invoked once from the root plugin file on `plugins_loaded`.
 * The legacy procedural `includes/*.php` files continue to run
 * in parallel - this class is purely additive until they're
 * removed.
 */
class Initialize {
    use SingletonTrait;

    private function __construct() {
        // Facade picks RegisterDev or RegisterProd based on FLEXA_TECH_SU_IS_DEVELOPMENT.
        RegisterFacade::get_instance();
        AdminSettings::get_instance();
        RestAPI::get_instance();
    }
}
