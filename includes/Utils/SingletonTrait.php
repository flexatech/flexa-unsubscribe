<?php
namespace FlexaUnsubscribe\Utils;

if (!defined('ABSPATH')) exit;

trait SingletonTrait {
    private static $instance = null;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __clone() {}
    public function __wakeup() {}
}
