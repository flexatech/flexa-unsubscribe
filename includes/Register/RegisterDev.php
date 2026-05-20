<?php
namespace FlexaUnsubscribe\Register;

use FlexaUnsubscribe\Utils\SingletonTrait;

if (!defined('ABSPATH')) exit;

/**
 * Dev-mode script registration.
 *
 * Points the admin bundle at the Vite dev server (default:
 * http://localhost:3001/main.tsx) and injects the `@react-refresh`
 * runtime into admin_footer so HMR works in-browser.
 *
 * Only runs when FLEXA_TECH_SU_IS_DEVELOPMENT === true.
 * Safe to ship - RegisterFacade guards the instantiation, and this
 * class does nothing until its `init` hook fires.
 */
class RegisterDev {
    use SingletonTrait;

    private function __construct() {
        // React-Refresh runtime needs to import from the Vite dev server
        // BEFORE our bundle runs. We only need this inside wp-admin; no
        // React is used on the public side of this plugin.
        add_action('admin_footer', [$this, 'render_dev_refresh'], 5);
        add_action('init', [$this, 'register_all_scripts']);

        // In dev the bundle is served from localhost:3001 (cross-host),
        // so WP's `load_script_textdomain()` can't compute a relative
        // plugin path → can't md5 it → can't find the JSON → admin UI
        // stays English even when the locale switched. Bridge it: when
        // WP asks for our handle's translation file, hand back the
        // path that would resolve in prod (md5 of the built bundle's
        // plugin-relative path).
        add_filter('load_script_translation_file', [$this, 'translate_script_in_dev'], 10, 3);
    }

    public function translate_script_in_dev($file, $handle, $domain) {
        if ($handle !== ScriptName::PAGE_ADMIN || $domain !== 'flexa-unsubscribe') {
            return $file;
        }
        // Matches the path RegisterProd registers; md5 of that string is
        // what wp_set_script_translations() would normally compute. Kept
        // in sync with RegisterProd::register_all_scripts().
        $built_path = 'assets/dist/admin/js/main.js';
        $candidate = sprintf(
            '%slanguages/%s-%s-%s.json',
            FLEXA_TECH_SU_PATH,
            $domain,
            determine_locale(),
            md5($built_path)
        );
        return is_readable($candidate) ? $candidate : $file;
    }

    public function render_dev_refresh() {
        // Only inject the React-Refresh runtime on screens that actually
        // load our admin bundle. Without this gate the runtime fires on
        // every WP admin page, causing a `localhost:3001/@react-refresh`
        // request even on screens where the React app isn't mounted -
        // visible noise in the browser network tab and a hard error if
        // Vite isn't running. Sibling plugins doing the same thing on
        // a different port (e.g. retailers on 3000) compound this.
        if (!is_admin() || !function_exists('wp_script_is')) return;
        if (!wp_script_is(ScriptName::PAGE_ADMIN, 'enqueued')) return;

        printf(
            '<script type="module">
            import RefreshRuntime from "%s/@react-refresh"
            RefreshRuntime.injectIntoGlobalHook(window)
            window.$RefreshReg$ = () => {}
            window.$RefreshSig$ = () => (type) => type
            window.__vite_plugin_react_preamble_installed__ = true
            </script>',
            esc_url($this->vite_origin())
        );
    }

    public function register_all_scripts() {
        $deps = ['react', 'react-dom', 'wp-hooks', 'wp-i18n'];

        // Vite is configured with `root: './src'` so the entry is served
        // at /main.tsx (not /src/main.tsx).
        wp_register_script(
            ScriptName::PAGE_ADMIN,
            $this->vite_origin() . '/main.tsx',
            $deps,
            FLEXA_TECH_SU_VERSION,
            true
        );
        wp_set_script_translations(
            ScriptName::PAGE_ADMIN,
            'flexa-unsubscribe',
            FLEXA_TECH_SU_PATH . 'languages'
        );
    }

    /**
     * Resolve the Vite dev-server origin.
     *
     * `constants.php` already defaults `FLEXA_TECH_SU_VITE_DEV_ORIGIN`
     * to `http://localhost:3001` when undefined, but a wp-config.php
     * override that sets it to `''`, `true`, or other non-URL values
     * would otherwise leak through and break `wp_register_script`:
     * concatenating `'' . '/main.tsx'` → `/main.tsx`, which WP outputs
     * verbatim and the browser resolves against the site host (the
     * "src=http://<site>/main.tsx" symptom). `true . '/…'` → `'1/…'`,
     * same family of bug.
     *
     * Defensive validation here means a malformed override falls back
     * to localhost:3001 instead of producing a self-referencing src.
     */
    private function vite_origin(): string {
        if (defined('FLEXA_TECH_SU_VITE_DEV_ORIGIN')) {
            $origin = FLEXA_TECH_SU_VITE_DEV_ORIGIN;
            if (is_string($origin) && $origin !== '' && preg_match('#^https?://#i', $origin)) {
                return rtrim($origin, '/');
            }
        }
        return 'http://localhost:3001';
    }
}
