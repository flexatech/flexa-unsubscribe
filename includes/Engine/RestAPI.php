<?php
namespace FlexaUnsubscribe\Engine;

use FlexaUnsubscribe\Utils\SingletonTrait;
use FlexaUnsubscribe\Controllers\AnalyticsRestController;
use FlexaUnsubscribe\Controllers\UnsubscribesRestController;
use FlexaUnsubscribe\Controllers\BlockedRestController;
use FlexaUnsubscribe\Controllers\ResubscribedRestController;
use FlexaUnsubscribe\Controllers\ReasonsRestController;
use FlexaUnsubscribe\Controllers\SaveReasonRestController;
use FlexaUnsubscribe\Controllers\SettingsRestController;

if (!defined('ABSPATH')) exit;

/**
 * Collects every REST controller under the `flexa-unsubscribe/v1`
 * namespace and kicks off their registration on `rest_api_init`.
 *
 * New controllers get added to the $controllers list — each one
 * implements a single `register_routes()` method.
 */
class RestAPI {
    use SingletonTrait;

    public const NAMESPACE = 'flexa-unsubscribe/v1';

    /** @var object[] */
    private array $controllers = [];

    private function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        $this->controllers = [
            new AnalyticsRestController(),
            new UnsubscribesRestController(),
            new BlockedRestController(),
            new ResubscribedRestController(),
            new ReasonsRestController(),
            new SaveReasonRestController(),
            new SettingsRestController(),
        ];

        foreach ($this->controllers as $controller) {
            if (method_exists($controller, 'register_routes')) {
                $controller->register_routes();
            }
        }
    }
}
